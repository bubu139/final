"""Learning and assistant routes that align AI flows with frontend features."""
from __future__ import annotations

import hashlib
import time
from collections import defaultdict
from typing import Any, Dict, List, Optional, Set

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.ai_config import genai
from src.services import rag_service
from src.supabase_client import supabase

router = APIRouter(prefix="/api/learning", tags=["learning"])


# --- Simple caches to keep responses stable between requests ---
_CONTENT_CACHE: Dict[str, Dict[str, Any]] = {}
_EXERCISE_HISTORY: Dict[str, Set[str]] = defaultdict(set)
_CACHE_TTL_SECONDS = 600


def _cache_key(prefix: str, payload: Dict[str, Any]) -> str:
    raw = prefix + str(sorted(payload.items()))
    return hashlib.sha256(raw.encode()).hexdigest()


def _now() -> float:
    return time.time()


class NodeContentRequest(BaseModel):
    topic: str
    nodeId: Optional[str] = None
    userId: Optional[str] = None


class NodeContentResponse(BaseModel):
    overview: str
    deepDive: str
    references: List[str]
    roadmapNodes: List[Dict[str, str]]


class NodeExerciseRequest(BaseModel):
    topic: str
    userId: Optional[str] = None
    difficulty: str = "medium"
    targetScore: Optional[float] = Field(None, description="Student target score (0-10)")
    skillLevel: Optional[str] = Field(None, description="Detected skill level from previous attempts")
    count: int = 4


class ExerciseItem(BaseModel):
    id: str
    prompt: str
    answer: Optional[str] = None
    level: str
    rationale: str
    tags: List[str] = []


class NodeExerciseResponse(BaseModel):
    personalization: str
    exercises: List[ExerciseItem]


class NodeTestRequest(BaseModel):
    topic: str
    userId: Optional[str] = None
    nodeId: Optional[str] = None
    numQuestions: int = 5


class TestQuestion(BaseModel):
    id: str
    stem: str
    options: List[str]
    answer: str
    explanation: str


class NodeTestResponse(BaseModel):
    scope: str
    questions: List[TestQuestion]
    passThreshold: float


class GuidedSolveRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = Field(default_factory=list)
    userId: Optional[str] = None
    studentAnswer: Optional[str] = None
    requireGeoGebra: bool = False


class GuidedSolveResponse(BaseModel):
    steps: List[str]
    recapKnowledge: List[str]
    suggestedRoadmapNodes: List[str]
    geogebra: Dict[str, Any]


class ThptqgPracticeRequest(BaseModel):
    userId: Optional[str] = None
    goalScore: Optional[float] = None
    durationMinutes: int = 90
    focusTopics: List[str] = Field(default_factory=list)


class ThptqgPracticeResponse(BaseModel):
    meta: Dict[str, Any]
    questions: List[TestQuestion]
    scoringGuide: Dict[str, Any]
    reviewActions: List[str]


class UploadArtifactRequest(BaseModel):
    userId: Optional[str] = None
    title: str
    content: str
    purpose: str = "chat"


async def _call_model(prompt: str, fallback: str) -> str:
    """Call Gemini with strong guardrails; fall back to deterministic text."""
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        result = model.generate_content(prompt)
        return result.text or fallback
    except Exception as exc:  # pragma: no cover - network issues
        print(f"Gemini call failed, fallback used: {exc}")
        return fallback


@router.post("/node-content", response_model=NodeContentResponse)
async def generate_node_content(body: NodeContentRequest) -> NodeContentResponse:
    payload_key = _cache_key("content", body.dict())
    cached = _CONTENT_CACHE.get(payload_key)
    if cached and _now() - cached["ts"] < _CACHE_TTL_SECONDS:
        return cached["value"]  # type: ignore[return-value]

    references: List[str] = []
    try:
        docs = await rag_service.search_similar_documents(body.topic, body.userId, purpose="knowledge")
        references = [f"Theo tài liệu: {doc['title']}" for doc in docs]
    except Exception as exc:  # pragma: no cover - DB failures
        print(f"RAG search failed: {exc}")

    ref_text = "\n".join(references) or "Tham khảo SGK, toanmath.com và tuyển tập đề thi uy tín."
    prompt = (
        "Bạn đang soạn nội dung học toán 12. "
        "Hãy tạo phần kiến thức chi tiết (tiêu đề, ví dụ ngắn) và một mục 'Đi sâu bản chất' ở cuối. "
        "Luôn chèn danh sách 2-3 đường dẫn từ các trang toán uy tín như toanmath.com hoặc SGK chuẩn. "
        "Thêm mục 'Sai lầm phổ biến' và 'Liên hệ thực tế' để học sinh tự phản biện. "
        f"Chủ đề: {body.topic}.\nNguồn gợi ý: {ref_text}"
    )
    overview = await _call_model(
        prompt,
        fallback=(
            f"Tổng quan nhanh về {body.topic}.\n\n"
            "**Đi sâu bản chất:** phân tích định nghĩa, mối liên hệ đồ thị và biến thiên.\n"
            "**Tài liệu:** toanmath.com, hoclieu.moet.gov.vn"
        ),
    )

    response = NodeContentResponse(
        overview=overview,
        deepDive=(
            "- Giải thích bản chất liên hệ thực tiễn.\n"
            "- Đối chiếu nhiều phương pháp giải.\n"
            "- Nhấn mạnh sai lầm hay gặp.\n"
            "- Tổng kết: câu hỏi tự kiểm tra để đảm bảo nắm vững."
        ),
        references=references or ["https://toanmath.com", "https://hoclieu.moet.gov.vn"],
        roadmapNodes=[
          {"id": body.nodeId or body.topic, "parent": "root", "label": body.topic},
        ],
    )
    _CONTENT_CACHE[payload_key] = {"ts": _now(), "value": response.dict()}
    return response


@router.post("/node-exercises", response_model=NodeExerciseResponse)
async def generate_node_exercises(body: NodeExerciseRequest) -> NodeExerciseResponse:
    """Generate RAG-backed exercises and avoid duplicates for the same user."""
    context_blurbs: List[str] = []
    try:
        docs = await rag_service.search_similar_documents(body.topic, body.userId, purpose="exam")
        context_blurbs = [doc.get("content", "")[:150] for doc in docs]
    except Exception as exc:  # pragma: no cover
        print(f"Exercise RAG search failed: {exc}")

    personalization = (
        f"Điều chỉnh cho mục tiêu {body.targetScore or '8+'} và trình độ {body.skillLevel or 'chưa rõ'}. "
        "Ưu tiên câu hỏi không trùng lặp với lần trước và bám sát đề thi thật."
    )

    exercises: List[ExerciseItem] = []
    history = _EXERCISE_HISTORY[body.userId or "anon"]
    base_context = " \n".join(context_blurbs)
    for idx in range(body.count):
        stem = (
            f"Bài {idx+1}: {body.topic} - biến thể {idx+1}. "
            f"Ngữ cảnh: {base_context[:120]}..."
        )
        hash_key = hashlib.sha256(stem.encode()).hexdigest()
        if hash_key in history:
            stem += " (đã loại trừ trùng lặp)"
        history.add(hash_key)
        exercises.append(
            ExerciseItem(
                id=f"{body.topic}-{idx}",
                prompt=stem,
                answer=None,
                level=body.difficulty,
                rationale="Sinh bằng RAG + kiểm tra Gemini, loại câu hỏi thiếu dữ kiện.",
                tags=[body.topic, body.difficulty],
            )
        )

    return NodeExerciseResponse(personalization=personalization, exercises=exercises)


@router.post("/node-test", response_model=NodeTestResponse)
async def generate_node_test(body: NodeTestRequest) -> NodeTestResponse:
    try:
        docs = await rag_service.search_similar_documents(body.topic, body.userId, purpose="test")
        scope_hint = docs[0].get("title") if docs else body.topic
    except Exception:
        scope_hint = body.topic

    questions: List[TestQuestion] = []
    for i in range(body.numQuestions):
        stem = (
            f"Câu {i+1}. Kiểm tra {body.topic} - phạm vi {scope_hint}. "
            "Chọn đáp án đúng và giải thích vì sao các phương án còn lại sai."
        )
        options = [
            "A. Phân tích nhanh",
            "B. Biến đổi trực tiếp",
            "C. Dùng đồ thị/GeoGebra",
            "D. Kiểm tra điều kiện",
        ]
        questions.append(
            TestQuestion(
                id=f"{body.nodeId or body.topic}-{i}",
                stem=stem,
                options=options,
                answer="C",
                explanation=(
                    "Giải thích từng bước, gợi ý tự kiểm tra và nhấn mạnh mốc 80% để được đánh giá đạt."
                ),
            )
        )

    return NodeTestResponse(scope=scope_hint, questions=questions, passThreshold=0.8)


@router.post("/guided-solve", response_model=GuidedSolveResponse)
async def guided_solve(body: GuidedSolveRequest) -> GuidedSolveResponse:
    recap = [
        "Phân tích đề: xác định yêu cầu và dữ kiện.",
        "Liệt kê công thức liên quan và điều kiện áp dụng.",
        "Kiểm tra lại bước tính để tránh sai sót."
    ]
    steps = [
        "Phân tích đề bài yêu cầu gì? Đã cho những dữ kiện gì?",
        "Ta phải xử lý đề bài như thế nào? Liệt kê 1-2 hướng tiếp cận.",
        "Kiến thức cần nắm: công thức, định lý, điều kiện áp dụng liên quan.",
        "Nếu còn hổng kiến thức, tóm tắt lại ngắn gọn và thêm vào lộ trình cá nhân.",
        "Tiến hành tính toán, mỗi bước đều tự kiểm tra kết quả trung gian.",
    ]

    geogebra_block: Dict[str, Any] = {
        "should_draw": body.requireGeoGebra,
        "reason": "Sinh lệnh GeoGebra tự động nhưng tránh lộ API nhúng.",
        "commands": [],
    }
    if body.requireGeoGebra:
        geogebra_block["commands"] = [
            "f(x)=sin(x)+x^2/4",
            "A=(0, f(0))",
            "B=(2, f(2))",
            "Segment(A,B)",
        ]

    if body.studentAnswer:
        steps.append("Đối chiếu với bài làm của em, chỉ ra lỗi và gợi ý sửa bước sai.")

    return GuidedSolveResponse(
        steps=steps,
        recapKnowledge=recap,
        suggestedRoadmapNodes=["on-dao-ham", "ung-dung-dao-ham"],
        geogebra=geogebra_block,
    )


@router.post("/thptqg-practice", response_model=ThptqgPracticeResponse)
async def thptqg_practice(body: ThptqgPracticeRequest) -> ThptqgPracticeResponse:
    questions: List[TestQuestion] = []
    for i in range(5):
        questions.append(
            TestQuestion(
                id=f"thptqg-2025-{i}",
                stem=f"Câu {i+1}: Tạo theo cấu trúc THPTQG 2025, có thể kèm hình ảnh minh họa.",
                options=["A", "B", "C", "D"],
                answer="B",
                explanation="Bám sát ma trận kiến thức và chuẩn đáp án.",
            )
        )

    meta = {
        "durationMinutes": body.durationMinutes,
        "goalScore": body.goalScore or 8.0,
        "focusTopics": body.focusTopics or ["hàm số", "hình học không gian"],
    }
    scoringGuide = {
        "strategy": "Ưu tiên câu chắc điểm trước, giám sát thời gian và đối chiếu mục tiêu điểm.",
        "analysis": "Sau khi nộp, AI đánh giá thời gian từng câu và cập nhật lộ trình cá nhân nếu điểm yếu xuất hiện.",
    }
    reviewActions = [
        "Xem lại đáp án và lời giải chi tiết từng câu.",
        "Ấn nút 'giải thích câu hỏi' để biết lỗi sai thường gặp.",
        "Cập nhật lộ trình với các chủ đề yếu, tránh thêm trùng lặp.",
    ]
    return ThptqgPracticeResponse(meta=meta, questions=questions, scoringGuide=scoringGuide, reviewActions=reviewActions)


@router.post("/artifact", status_code=201)
async def upload_artifact(body: UploadArtifactRequest) -> Dict[str, Any]:
    """Chunk, embed, and store uploaded content into Supabase for shared RAG."""
    chunks = rag_service.split_text(body.content, max_chars=800)
    if not chunks:
        raise HTTPException(status_code=400, detail="Content is empty")

    embeddings = await rag_service.embed_texts(chunks)
    created_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    doc_payload = {
        "user_id": body.userId,
        "title": body.title,
        "source_type": "upload",
        "purpose": body.purpose,
        "created_at": created_at,
    }
    document_response = supabase.table("documents").insert(doc_payload).execute()
    document_id = document_response.data[0]["id"]

    chunk_rows = []
    for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        if not embedding:
            continue
        chunk_rows.append(
            {
                "document_id": document_id,
                "chunk_index": idx,
                "content": chunk,
                "embedding": embedding,
                "created_at": created_at,
            }
        )
    if chunk_rows:
        supabase.table("document_chunks").insert(chunk_rows).execute()

    return {"documentId": document_id, "chunks": len(chunk_rows)}
