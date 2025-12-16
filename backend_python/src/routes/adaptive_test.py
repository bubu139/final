from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.supabase_client import supabase
from src.ai_flows.generate_test_flow import generate_test, GenerateTestInput

router = APIRouter(tags=["adaptive-test"])


class GenerateAdaptiveTestRequest(BaseModel):
    userId: str
    weakTopics: List[str] = Field(default_factory=list)
    difficulty: str = "medium"  # frontend vẫn gửi, backend có thể override


def _pick_effective_difficulty(
    requested: str,
    target_score: Optional[float],
    average_score: Optional[float],
) -> str:
    req = (requested or "medium").lower().strip()
    if req not in {"easy", "medium", "hard"}:
        req = "medium"

    # Nếu chưa có dữ liệu -> giữ requested
    if target_score is None or average_score is None:
        return req

    gap = float(target_score) - float(average_score)

    # đang vượt/đạt mục tiêu => tăng khó
    if gap <= 0:
        return "hard"

    # tụt xa => giảm khó để kéo nền tảng
    if gap >= 15:
        return "easy"

    # ở giữa => medium
    return "medium"


@router.post("/api/generate-adaptive-test")
async def generate_adaptive_test(request: GenerateAdaptiveTestRequest):
    try:
        # lấy profile
        prof_res = (
            supabase.from_("student_profiles")
            .select("target_score")
            .eq("user_id", request.userId)
            .execute()
        )
        profile = prof_res.data[0] if prof_res.data else {}
        target_score = profile.get("target_score")

        perf_res = (
            supabase.from_("user_performance_summary")
            .select("average_score")
            .eq("user_id", request.userId)
            .execute()
        )
        perf = perf_res.data[0] if perf_res.data else {}
        average_score = perf.get("average_score")

        effective_difficulty = _pick_effective_difficulty(
            request.difficulty, target_score, average_score
        )

        topics = [t.strip() for t in request.weakTopics if t and t.strip()]
        topic_text = ", ".join(topics) if topics else "các chủ đề học sinh đang yếu"

        # “difficulty” được nhúng vào yêu cầu chủ đề để AI ra đề phù hợp
        final_topic = (
            f"Ra một đề luyện tập tập trung vào: {topic_text}. "
            f"Mức độ: {effective_difficulty}. "
            "Ưu tiên câu hỏi bám sát kỹ năng nền tảng nếu easy/medium, "
            "tăng câu vận dụng nếu hard. "
            "Đề phải rõ dữ kiện, không mơ hồ."
        )

        output = await generate_test(
            GenerateTestInput(
                userId=request.userId,
                topic=final_topic,
                testType="standard",
                numQuestions=6,
            )
        )

        return {"test": output.test, "effectiveDifficulty": effective_difficulty}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate adaptive test: {e}")
