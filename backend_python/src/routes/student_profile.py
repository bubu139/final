from fastapi import APIRouter, HTTPException
from datetime import datetime

from src.models import StudentProfileUpdate, StudentProfileResponse, StudyStatus
from src.supabase_client import supabase

router = APIRouter(prefix="/student-profile", tags=["student-profile"])


def generate_study_status(current_avg: float, target: int | None, goal_text: str) -> StudyStatus:
    """
    Logic đơn giản để sinh ra đánh giá dựa trên khoảng cách giữa điểm hiện tại và mục tiêu.
    Có thể nâng cấp phần này để gọi AI (LLM) nếu cần phân tích sâu goal_text.
    """
    if target is None:
        return StudyStatus(
            level="unknown",
            label="Chưa có mục tiêu",
            message="Hãy đặt mục tiêu điểm số để nhận lộ trình.",
            recommendations=["Đặt mục tiêu điểm số cụ thể (0-100)."],
        )

    gap = target - (current_avg or 0.0)

    if gap <= 0:
        return StudyStatus(
            level="good",
            label="Đạt mục tiêu",
            message=f"Tuyệt vời! Điểm trung bình hiện tại ({current_avg:.1f}) đã vượt qua mục tiêu ({target}).",
            recommendations=[
                "Duy trì phong độ với các bài tập nâng cao.",
                "Làm đề tổng hợp để giữ nhịp.",
            ],
        )
    elif gap <= 10:
        return StudyStatus(
            level="warning",
            label="Sắp đạt mục tiêu",
            message=f"Bạn đang tiến rất gần mục tiêu (còn {gap:.1f} điểm).",
            recommendations=[
                "Tập trung luyện đề theo dạng bài bạn sai nhiều.",
                "Ôn lại công thức và mẹo giải nhanh.",
            ],
        )
    else:
        return StudyStatus(
            level="critical",
            label="Khoảng cách lớn",
            message=f"Khoảng cách đến mục tiêu còn khá xa ({gap:.1f} điểm). Cần kế hoạch cấp tốc.",
            recommendations=[
                "Quay lại ôn tập kiến thức nền tảng.",
                "Bắt đầu từ mức Dễ/Trung bình rồi tăng dần.",
                "Luyện theo lộ trình và theo dõi tiến bộ hàng tuần.",
            ],
        )


@router.get("/{user_id}", response_model=StudentProfileResponse)
def get_student_profile(user_id: str):
    """Trả về profile nếu có, nếu chưa có thì trả về mặc định (không 500)."""
    try:
        # maybe_single(): trả về 0 hoặc 1 record, tránh lỗi khi user chưa có profile
        res = (
            supabase.table("student_profiles")
            .select("*")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )

        if not res.data:
            return StudentProfileResponse(
                user_id=user_id,
                target_score=None,
                goal_text=None,
                study_status=None,
            )

        data = res.data
        return StudentProfileResponse(
            user_id=data.get("id", user_id),
            target_score=data.get("target_score"),
            goal_text=data.get("goal_text"),
            study_status=data.get("study_status"),
        )

    except Exception as e:
        # Giữ nguyên HTTP 500 nhưng include lỗi gốc để debug nhanh
        raise HTTPException(status_code=500, detail=f"Could not fetch profile: {e}")


@router.put("/{user_id}", response_model=StudentProfileResponse)
def update_student_profile(user_id: str, payload: StudentProfileUpdate):
    """Upsert profile + sinh study_status. Tuyệt đối không gọi .select() sau update/insert (postgrest-py)."""
    try:
        # 1) Lấy dữ liệu hiệu suất hiện tại để phân tích
        perf_res = (
            supabase.table("user_performance_summary")
            .select("avg_score")
            .eq("user_id", user_id)
            .execute()
        )

        current_avg = 0.0
        if perf_res.data and isinstance(perf_res.data, list) and len(perf_res.data) > 0:
            current_avg = perf_res.data[0].get("avg_score") or 0.0

        # 2) Sinh đánh giá
        new_status = generate_study_status(
            current_avg=current_avg,
            target=payload.target_score,  # giữ None nếu user chưa set mục tiêu
            goal_text=payload.goal_text or "",
        )

        # 3) Dữ liệu lưu DB
        update_data = {
            "target_score": payload.target_score,
            "goal_text": payload.goal_text,
            "study_status": new_status.model_dump(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        # 4) Update (KHÔNG .select() ở write builder)
        data_res = (
            supabase.table("student_profiles")
            .update(update_data)
            .eq("id", user_id)
            .execute()
        )

        # Nếu chưa có record (hoặc update không ảnh hưởng row nào), fallback insert
        record = None
        if data_res.data:
            record = data_res.data[0] if isinstance(data_res.data, list) else data_res.data
        else:
            insert_data = {"id": user_id, **update_data, "full_name": "Student"}
            ins_res = supabase.table("student_profiles").insert(insert_data).execute()
            if ins_res.data:
                record = ins_res.data[0] if isinstance(ins_res.data, list) else ins_res.data

        if not record:
            raise HTTPException(
                status_code=500,
                detail="Update/Insert succeeded but no data returned. Check PostgREST return preference / RLS.",
            )

        return StudentProfileResponse(
            user_id=record.get("id", user_id),
            target_score=record.get("target_score"),
            goal_text=record.get("goal_text"),
            study_status=record.get("study_status"),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
