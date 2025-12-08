from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlmodel import Session

from src.db import get_session
from src.schemas.video import CreateVideoRequest, NodeVideoRead, ProgressEvent, VideoSegmentRead
from src.services.video_service import (
    create_video,
    get_video,
    get_video_by_node_id,  # <-- Cần import hàm này
    list_segments,
    trigger_next_segment,
)

router = APIRouter(prefix="/videos", tags=["videos"])


@router.post("/", response_model=NodeVideoRead)
def create_node_video(
    payload: CreateVideoRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
):
    video = create_video(session, payload, background_tasks)
    segments = list_segments(session, video.id)
    return NodeVideoRead.from_orm(video).copy(update={"segments": segments})


# --- BỔ SUNG ENDPOINT NÀY ---
@router.get("/node/{node_id}", response_model=NodeVideoRead)
def get_video_by_node(node_id: str, session: Session = Depends(get_session)):
    """Lấy video theo node_id thay vì video_id"""
    video = get_video_by_node_id(session, node_id)
    if not video:
        raise HTTPException(status_code=404, detail=f"Video for node '{node_id}' not found")
    segments = list_segments(session, video.id)
    return NodeVideoRead.from_orm(video).copy(update={"segments": segments})
# ----------------------------


@router.get("/{video_id}", response_model=NodeVideoRead)
def get_node_video(video_id: str, session: Session = Depends(get_session)):
    video = get_video(session, video_id)
    segments = list_segments(session, video_id)
    return NodeVideoRead.from_orm(video).copy(update={"segments": segments})


@router.get("/{video_id}/segments", response_model=list[VideoSegmentRead])
def get_video_segments(video_id: str, session: Session = Depends(get_session)):
    return list_segments(session, video_id)


@router.post("/{video_id}/progress", response_model=list[VideoSegmentRead])
def report_progress(
    video_id: str,
    event: ProgressEvent,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
):
    trigger_next_segment(session, video_id, event.current_second, background_tasks)
    return list_segments(session, video_id)