from fastapi import APIRouter
from src.models import NodeProgress
from src.supabase_client import supabase

router = APIRouter(prefix="/node-progress", tags=["node-progress"])

# ---------------------------------
# POST /node-progress/update
# ---------------------------------
@router.post("/update")
def update_node_progress(data: NodeProgress):

    # Kiểm tra xem bản ghi đã tồn tại chưa
    existing = supabase.table("node_progress") \
        .select("*") \
        .eq("user_id", data.user_id) \
        .eq("node_id", data.node_id) \
        .execute()

    has_row = existing.data is not None and len(existing.data) > 0

    if has_row:
        # cập nhật
        supabase.table("node_progress") \
            .update({
                "opened": data.opened,
                "score": data.score
            }) \
            .eq("user_id", data.user_id) \
            .eq("node_id", data.node_id) \
            .execute()
    else:
        # thêm mới
        supabase.table("node_progress") \
            .insert({
                "user_id": data.user_id,
                "node_id": data.node_id,
                "opened": data.opened,
                "score": data.score,
            }).execute()

    return {"status": "ok"}


# ---------------------------------
# GET /node-progress/{user_id}
# ---------------------------------
@router.get("/{user_id}")
def get_all_progress(user_id: str):

    res = supabase.table("node_progress") \
        .select("*") \
        .eq("user_id", user_id) \
        .execute()

    return res.data or []
