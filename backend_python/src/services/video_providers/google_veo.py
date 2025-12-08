import asyncio
import os
from typing import Optional

import google.genai as genai
from google.genai.types import GenerateVideosOperation

from .base import VideoProvider


class GoogleVeoProvider(VideoProvider):
    """Google Veo video generation via google-genai."""

    def __init__(self, model: str = "veo-002", polling_interval_seconds: float = 5.0) -> None:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise RuntimeError("GOOGLE_API_KEY is required for Google Veo provider")

        self.client = genai.Client(api_key=api_key)
        self.model = model
        self.polling_interval_seconds = polling_interval_seconds

    async def create_video_segment(
        self, prompt: str, duration_seconds: int, audio_url: Optional[str] | None = None
    ) -> str:
        # google-genai returns an LRO operation we can poll by name.
        operation: GenerateVideosOperation = await asyncio.to_thread(
            self.client.models.generate_videos,
            model=self.model,
            prompt=prompt,
            config={"duration_seconds": duration_seconds},
        )

        if not operation or not operation.name:
            raise RuntimeError("Failed to start Veo video generation")

        return operation.name

    async def get_job_status(self, provider_job_id: str) -> dict:
        operation: GenerateVideosOperation = await asyncio.to_thread(
            self.client.operations.get, provider_job_id
        )
        if not operation:
            return {
                "status": "failed",
                "video_url": None,
                "error_message": "veo_operation_not_found",
            }

        if getattr(operation, "error", None):
            message = operation.error.get("message") if isinstance(operation.error, dict) else str(operation.error)
            return {
                "status": "failed",
                "video_url": None,
                "error_message": message or "veo_operation_error",
            }

        if getattr(operation, "done", False):
            response = getattr(operation, "response", None) or getattr(operation, "result", None)
            video_url: Optional[str] = None

            generated_videos = getattr(response, "generated_videos", None)
            if generated_videos:
                first_video = generated_videos[0].video if generated_videos[0] else None
                if first_video and first_video.uri:
                    video_url = first_video.uri

            return {
                "status": "done" if video_url else "failed",
                "video_url": video_url,
                "error_message": None if video_url else "veo_missing_video_uri",
            }

        return {"status": "processing", "video_url": None, "error_message": None}
