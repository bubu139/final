import asyncio
import uuid
from typing import Dict, Optional

from .base import VideoProvider


class MockVideoProvider(VideoProvider):
    """A lightweight provider that simulates async video generation."""

    def __init__(self) -> None:
        self._jobs: Dict[str, Dict[str, Optional[str]]] = {}

    async def create_video_segment(self, prompt: str, duration_seconds: int, audio_url: str | None = None) -> str:
        job_id = str(uuid.uuid4())
        self._jobs[job_id] = {
            "status": "processing",
            "video_url": None,
            "error_message": None,
        }
        # Simulate async completion without blocking the request handler
        asyncio.create_task(self._complete_job(job_id, duration_seconds))
        return job_id

    async def _complete_job(self, job_id: str, duration_seconds: int) -> None:
        # Wait a little to mimic generation time
        await asyncio.sleep(min(2, duration_seconds * 0.05))
        job = self._jobs.get(job_id)
        if job:
            job["status"] = "done"
            job["video_url"] = f"https://cdn.example.com/videos/{job_id}.mp4"

    async def get_job_status(self, provider_job_id: str) -> dict:
        job = self._jobs.get(provider_job_id)
        if not job:
            return {
                "status": "failed",
                "video_url": None,
                "error_message": "job_not_found",
            }
        return job
