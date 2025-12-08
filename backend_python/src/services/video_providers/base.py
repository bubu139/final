from typing import Protocol


class VideoProvider(Protocol):
    async def create_video_segment(self, prompt: str, duration_seconds: int, audio_url: str | None = None) -> str:
        """Create a video segment for the given prompt and duration and return a provider job id."""

    async def get_job_status(self, provider_job_id: str) -> dict:
        """Return the job status payload with keys: status, video_url, error_message."""
