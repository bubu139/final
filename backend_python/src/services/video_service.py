import asyncio
from datetime import datetime
from typing import List, Optional

from fastapi import BackgroundTasks, HTTPException
from sqlmodel import Session, select

from src.db import SessionLocal
from src.schemas.video import CreateVideoRequest
from src.video_models import NodeVideo, VideoSegment

# Import provider
# from .video_providers.mock import MockVideoProvider
from .video_providers.google_veo import GoogleVeoProvider

SEGMENT_DURATION_SECONDS = 30
SEGMENT_TRIGGER_OFFSET_SECONDS = 20

# --- KHỞI TẠO PROVIDER ---
# Đảm bảo bạn đã có GOOGLE_API_KEY trong file .env
provider = GoogleVeoProvider(model="veo-002")
# Nếu muốn test nhanh mà không tốn tiền, dùng dòng dưới:
# provider = MockVideoProvider()
# -------------------------

def _create_segment(
    session: Session,
    video: NodeVideo,
    segment_index: int,
    status: str = "pending",
) -> VideoSegment:
    start_second = segment_index * SEGMENT_DURATION_SECONDS
    end_second = start_second + SEGMENT_DURATION_SECONDS
    segment = VideoSegment(
        node_video_id=video.id,
        segment_index=segment_index,
        start_second=start_second,
        end_second=end_second,
        status=status,
    )
    session.add(segment)
    session.commit()
    session.refresh(segment)
    return segment


def _update_video_status(session: Session, video: NodeVideo) -> None:
    segments: List[VideoSegment] = session.exec(
        select(VideoSegment).where(VideoSegment.node_video_id == video.id)
    ).all()
    if all(seg.status == "done" for seg in segments):
        video.status = "done"
    elif any(seg.status == "failed" for seg in segments):
        video.status = "failed"
    else:
        video.status = "processing"
    video.updated_at = datetime.utcnow()
    session.add(video)
    session.commit()


async def _process_segment_job(
    segment_id: str, prompt: str, audio_url: Optional[str]
) -> None:
    """Hàm xử lý job sinh video (chạy background)"""
    try:
        # 1. Tạo job
        with SessionLocal() as session:
            segment = session.get(VideoSegment, segment_id)
            if not segment:
                return
            job_id = await provider.create_video_segment(prompt, SEGMENT_DURATION_SECONDS, audio_url)
            segment.provider_job_id = job_id
            segment.status = "processing"
            segment.updated_at = datetime.utcnow()
            session.add(segment)
            session.commit()

        # 2. Polling trạng thái
        while True:
            status_payload = await provider.get_job_status(job_id)
            with SessionLocal() as session:
                segment = session.get(VideoSegment, segment_id)
                if not segment:
                    return
                segment.status = status_payload.get("status", "processing")
                segment.video_url = status_payload.get("video_url")
                segment.error_message = status_payload.get("error_message")
                segment.updated_at = datetime.utcnow()
                session.add(segment)
                
                # Cập nhật trạng thái video cha
                video = session.get(NodeVideo, segment.node_video_id)
                if video:
                    _update_video_status(session, video)
                session.commit()

                if segment.status in {"done", "failed"}:
                    break
            await asyncio.sleep(5) # Đợi 5s rồi poll tiếp

    except Exception as e:
        print(f"Error processing segment job: {e}")
        # Cập nhật trạng thái lỗi nếu crash
        with SessionLocal() as session:
            segment = session.get(VideoSegment, segment_id)
            if segment:
                segment.status = "failed"
                segment.error_message = str(e)
                session.add(segment)
                session.commit()


def create_video(
    session: Session, payload: CreateVideoRequest, background_tasks: BackgroundTasks
) -> NodeVideo:
    video = NodeVideo(
        node_id=payload.node_id,
        prompt=payload.prompt,
        audio_url=payload.audio_url,
        status="processing",
    )
    session.add(video)
    session.commit()
    session.refresh(video)

    first_segment = _create_segment(session, video, segment_index=0, status="processing")
    
    # Sử dụng asyncio.create_task để xử lý async job độc lập
    asyncio.create_task(
        _process_segment_job(
            first_segment.id, 
            payload.prompt, 
            payload.audio_url
        )
    )
    
    return video


def get_video(session: Session, video_id: str) -> NodeVideo:
    video = session.get(NodeVideo, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Node video not found")
    video.segments  # trigger relationship load
    return video

def get_video_by_node_id(session: Session, node_id: str) -> Optional[NodeVideo]:
    statement = select(NodeVideo).where(NodeVideo.node_id == node_id)
    video = session.exec(statement).first()
    if video:
        video.segments
    return video

def list_segments(session: Session, video_id: str) -> List[VideoSegment]:
    statement = (
        select(VideoSegment)
        .where(VideoSegment.node_video_id == video_id)
        .order_by(VideoSegment.segment_index)
    )
    return session.exec(statement).all()


def trigger_next_segment(
    session: Session, video_id: str, current_second: int, background_tasks: BackgroundTasks
) -> Optional[VideoSegment]:
    video = get_video(session, video_id)
    if current_second < 0:
        raise HTTPException(status_code=400, detail="current_second must be non-negative")

    current_index = current_second // SEGMENT_DURATION_SECONDS
    position_in_segment = current_second % SEGMENT_DURATION_SECONDS

    if position_in_segment < SEGMENT_TRIGGER_OFFSET_SECONDS:
        return None

    next_segment_index = current_index + 1
    existing = session.exec(
        select(VideoSegment).where(
            VideoSegment.node_video_id == video.id,
            VideoSegment.segment_index == next_segment_index,
        )
    ).first()
    if existing:
        return existing

    segment = _create_segment(session, video, next_segment_index, status="processing")
    
    # Sử dụng asyncio.create_task để xử lý async job độc lập
    asyncio.create_task(
        _process_segment_job(
            segment.id, 
            video.prompt, 
            video.audio_url
        )
    )
    
    return segment