# src/routes/node_progress.py
from fastapi import APIRouter, HTTPException
from src.models import NodeProgress
from src.supabase_client import supabase
from datetime import datetime

router = APIRouter(prefix="/node-progress", tags=["node-progress"])

# ---------------------------------
# POST /node-progress/update
# Tối ưu: Sử dụng UPSERT để xử lý 1 lần gọi DB
# ---------------------------------
@router.post("/update")
def update_node_progress(data: NodeProgress):
    try:
        # Calculate status
        status = "learning"
        if data.score is not None and data.score >= 80:
            status = "mastered"

        # Chuẩn bị dữ liệu
        payload = {
            "user_id": data.user_id,
            "node_id": data.node_id,
            "opened": data.opened,
            "score": data.score,
            "status": status,
            "updated_at": datetime.utcnow().isoformat()
        }

        # Sử dụng upsert: Nếu trùng (user_id, node_id) thì update, chưa có thì insert
        # Yêu cầu: Bảng database phải có constraint unique(user_id, node_id) như code SQL bên trên
        response = supabase.table("node_progress").upsert(
            payload, 
            on_conflict="user_id, node_id"
        ).execute()

        return {"status": "ok", "data": response.data}

    except Exception as e:
        print(f"❌ Error updating node progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------
# GET /node-progress/{user_id}
# ---------------------------------
@router.get("/{user_id}")
def get_all_progress(user_id: str):
    try:
        res = supabase.table("node_progress") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()

        return res.data or []
    except Exception as e:
        print(f"❌ Error fetching progress: {e}")
        return [] # Trả về mảng rỗng thay vì lỗi để FE không bị crash