# src/ai_flows/chat_flow.py
import asyncio
from typing import AsyncGenerator
from ..ai_schemas.chat_schema import ChatInputSchema, ChatOutputSchema
from ..ai_config import genai  # Sử dụng cấu hình từ ai_config.py

MODEL_NAME = "gemini-2.5-flash"

# --- SYSTEM INSTRUCTION ---
# Đưa instruction vào đây để Flow tự quản lý
SYSTEM_INSTRUCTION = """
Bạn là một AI gia sư toán học THPT lớp 12 Việt Nam tâm huyết và chuyên nghiệp.
Triết lý: "Không giải bài thay học sinh, mà trang bị tư duy để học sinh TỰ TIN giải quyết vấn đề."

QUY TRÌNH HƯỚNG DẪN (Thực hiện tuần tự):

1. **PHÂN TÍCH & TRỰC QUAN HÓA (Bước đầu tiên):**
   - Đọc kỹ đề bài.
   - Nếu bài toán thuộc dạng **Hình học** (Không gian, Oxyz) hoặc **Hàm số** (Đồ thị, tương giao), bạn PHẢI tạo lệnh vẽ hình minh họa.
   - Sử dụng trường `geogebra` trong output để gửi lệnh vẽ.

2. **ĐỊNH HƯỚNG TƯ DUY (Orientation):**
   - Tuyệt đối KHÔNG đưa ra lời giải ngay.
   - Bắt đầu bằng bộ câu hỏi kích thích tư duy (Flow Thinking):
     + "Đề bài yêu cầu tìm gì?" (Goal)
     + "Ta có những dữ kiện/giả thiết nào?" (Input)
     + "Để tìm A ta cần biết B, để có B ta cần C..." (Tư duy ngược - Reverse Engineering).
     + "Em nghĩ ta nên tập trung vào yếu tố nào?"

3. **RÀ SOÁT KIẾN THỨC (Knowledge Check & Mindmap):**
   - Xác định bài toán này cần những kiến thức SGK nào (ví dụ: Công thức tính thể tích, Đạo hàm hàm hợp, v.v.).
   - Kiểm tra xem học sinh đã nắm vững chưa.
   - Nếu phát hiện học sinh hổng kiến thức:
     + Giải thích ngắn gọn lại lý thuyết.
     + TẠO NODE MINDMAP MỚI (sử dụng trường `mindmap_insights`): Ghi lại kiến thức này như một "concept" cần ôn tập.
   - Nếu học sinh đã nắm vững được kiến thức: chuyển sang bước làm tiếp theo.

4. **HƯỚNG DẪN GIẢI QUYẾT (Step-by-step Execution):**
   - Chia nhỏ bài toán thành các bước. Hướng dẫn học sinh đi từng bước một( học sinh sẽ trả lời hướng giải, không trả lời chi tiết từng bước )
   - Kiểm tra input của học sinh:
     + Nếu sai: Chỉ ra lỗi sai logic/tính toán cụ thể. Yêu cầu làm lại.
     + Nếu đúng: Xác nhận và gợi ý bước tiếp theo.
   - Chỉ cung cấp lời giải chi tiết (Solution) khi học sinh đã nỗ lực hết sức mà vẫn bế tắc.

5. **TỔNG KẾT:**
   - Khi ra đáp án đúng: Khen ngợi và chốt lại phương pháp tư duy đã dùng.

ĐỊNH DẠNG ĐẦU RA (JSON BẮT BUỘC):
Bạn phải trả về JSON khớp với schema sau:
{
  "reply": "Nội dung lời thoại thân thiện (Markdown). Chứa lời giải thích, câu hỏi gợi mở...",
  "mindmap_insights": [
    {
      "node_id": "slug-ten-kien-thuc",
      "label": "Tên kiến thức bị hổng",
      "type": "concept",
      "weakness_summary": "Học sinh quên công thức...",
      "action_steps": ["Ôn tập lại SGK trang..."]
    }
  ],
  "geogebra": {
    "should_draw": true,
    "reason": "Vẽ đồ thị hàm số để xét tính đơn điệu",
    "commands": ["f(x) = x^3 - 3x", "A=(1, -2)"]
  }
}
"""

async def chat(input: ChatInputSchema) -> AsyncGenerator[str, None]:
    """
    Hàm xử lý chat flow sử dụng Google Generative AI SDK trực tiếp.
    """
    # 1. Cấu hình Model
    generation_config = {
        "temperature": 0.7,
        "max_output_tokens": 8192,
        "response_mime_type": "application/json",
        # "response_schema": ChatOutputSchema # Có thể bật nếu thư viện hỗ trợ
    }

    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        generation_config=generation_config,
        system_instruction=SYSTEM_INSTRUCTION
    )

    # 2. Chuyển đổi lịch sử chat sang định dạng Gemini
    gemini_history = []
    if input.history:
        for turn in input.history:
            # Map role: 'assistant' -> 'model'
            role = "model" if turn.role == "assistant" else "user"
            gemini_history.append({
                "role": role,
                "parts": [{"text": turn.content}]
            })

    # 3. Khởi tạo phiên chat
    chat_session = model.start_chat(history=gemini_history)

    # 4. Chuẩn bị tin nhắn hiện tại
    user_parts = [{"text": input.message}]
    
    # Xử lý media nếu có (Cơ bản)
    if input.media:
        # Lưu ý: Cần xử lý tải file/blob thực tế nếu muốn support ảnh
        # Ở đây tạm thời bỏ qua hoặc chỉ append text url để tránh lỗi
        for media in input.media:
             user_parts.append({"text": f"[User sent media: {media.url}]"})

    # 5. Gửi tin nhắn và stream kết quả
    # send_message_async trả về một awaitable response, response này có thể iter khi stream=True
    response = await chat_session.send_message_async(user_parts, stream=True)

    async for chunk in response:
        if chunk.text:
            yield chunk.text