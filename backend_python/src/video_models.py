import uuid
from datetime import datetime
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


class NodeVideo(SQLModel, table=True):
    __tablename__ = "node_videos"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    node_id: str = Field(index=True)
    prompt: str
    audio_url: Optional[str] = None
    status: str = Field(default="processing")
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    segments: List["VideoSegment"] = Relationship(back_populates="node_video")


class VideoSegment(SQLModel, table=True):
    __tablename__ = "video_segments"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    node_video_id: uuid.UUID = Field(foreign_key="node_videos.id", nullable=False)
    segment_index: int = Field(index=True)
    start_second: int
    end_second: int
    status: str = Field(default="pending")
    provider_job_id: Optional[str] = None
    video_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    node_video: NodeVideo = Relationship(back_populates="segments")
