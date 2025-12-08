import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class CreateVideoRequest(BaseModel):
    node_id: str
    prompt: str
    audio_url: Optional[str] = None


class VideoSegmentRead(BaseModel):
    id: uuid.UUID
    segment_index: int
    start_second: int
    end_second: int
    status: str
    provider_job_id: Optional[str] = None
    video_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class NodeVideoRead(BaseModel):
    id: uuid.UUID
    node_id: str
    prompt: str
    audio_url: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    segments: List[VideoSegmentRead] = Field(default_factory=list)

    class Config:
        orm_mode = True


class ProgressEvent(BaseModel):
    current_second: int
