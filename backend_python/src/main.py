# src/main.py
import re
import uvicorn
import json
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from src.routes.node_progress import router as node_progress_router
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
import PyPDF2
from docx import Document
from src.models import NodeProgress
from src.supabase_client import supabase

# Import config
from .ai_config import genai

app = FastAPI()

# Thêm router node progress
app.include_router(node_progress_router)

# ===== DOCUMENT PROCESSING =====

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from a PDF file"""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error reading PDF {pdf_path}: {e}")
        return ""

def extract_text_from_word(docx_path: str) -> str:
    """Extract text from a Word (.docx) file"""
    try:
        doc = Document(docx_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        print(f"Error reading Word file {docx_path}: {e}")
        return ""

def extract_text_from_file(file_path: str) -> str:
    """Extract text from PDF or Word file based on extension"""
    file_path_obj = Path(file_path)
    extension = file_path_obj.suffix.lower()
    
    if extension == '.pdf':
        return extract_text_from_pdf(file_path)
    elif extension in ['.docx', '.doc']:
        return extract_text_from_word(file_path)
    else:
        print(f"Unsupported file format: {extension}")
        return ""

def load_reference_materials(folder_path: str, max_files: int = 5) -> str:
    """Load and combine text from multiple PDF/Word files in a folder"""
    folder = Path(folder_path)
    if not folder.exists():
        print(f"Warning: Folder {folder_path} does not exist")
        return ""
    
    # Get both PDF and Word files
    pdf_files = list(folder.glob("*.pdf"))
    docx_files = list(folder.glob("*.docx"))
    doc_files = list(folder.glob("*.doc"))
    
    all_files = (pdf_files + docx_files + doc_files)[:max_files]
    
    if not all_files:
        print(f"Warning: No PDF or Word files found in {folder_path}")
        return ""
    
    combined_text = ""
    for file in all_files:
        print(f"📄 Loading: {file.name}")
        text = extract_text_from_file(str(file))
        if text:
            combined_text += f"\n\n=== TÀI LIỆU: {file.name} ===\n{text}\n"
    
    return combined_text

# ===== PATHS CONFIGURATION =====

BASE_DIR = Path(__file__).parent.parent
EXERCISES_FOLDER = BASE_DIR / "reference_materials" / "exercises"
TESTS_FOLDER = BASE_DIR / "reference_materials" / "tests"

EXERCISES_FOLDER.mkdir(parents=True, exist_ok=True)
TESTS_FOLDER.mkdir(parents=True, exist_ok=True)

print(f"📁 Exercises folder: {EXERCISES_FOLDER}")
print(f"📁 Tests folder: {TESTS_FOLDER}")

# ===== SYSTEM INSTRUCTIONS =====

CHAT_SYSTEM_INSTRUCTION = """Bạn là một AI gia sư toán học THPT lớp 12 Việt Nam, chuyên hướng dẫn học sinh TỰ HỌC và PHÁT TRIỂN Tư DUY.

# NGUYÊN TẮC CỐT LÕI
🎯 **MỤC TIÊU**: Giúp học sinh tự khám phá kiến thức, KHÔNG làm bài giúp học sinh
📚 **PHƯƠNG PHÁP**: Sử dụng câu hỏi gợi mở (Socratic Method) để dẫn dắt tư duy
💡 **TRIẾT LÝ**: "Dạy học sinh cách câu cá, không phải cho cá"

---

## KHI HỌC SINH GỬI BÀI TẬP

### BƯỚC 1: PHÂN TÍCH CÂU TRẢ LỜI CỦA HỌC SINH (NẾU CÓ)
Nếu học sinh đã làm bài:

✅ **Ghi nhận điểm tốt:**
- "Em làm đúng bước [X], cách tiếp cận này rất hợp lý!"
- "Ý tưởng sử dụng [công thức/phương pháp] là chính xác!"

⚠️ **Chỉ ra chỗ cần cải thiện (KHÔNG NÊU TRỰC TIẾP SAI Ở ĐÂU):**
- "Em xem lại bước [Y], có điều gì đó chưa chính xác nhé"
- "Kết quả này có vẻ chưa hợp lý. Em thử kiểm tra lại bước tính [Z]?"
- "Em đã nghĩ đến trường hợp [điều kiện] chưa?"

### BƯỚC 2: GỢI MỞ TƯ DUY BẰNG CÂU HỎI DẪN DẮT
Thay vì giải luôn, hãy đặt câu hỏi:

🔍 **Về phân tích đề:**
- "Đề bài yêu cầu em tìm gì? Cho em biết những gì?"
- "Em thử viết lại đề bài theo cách hiểu của mình xem?"

🧩 **Về lý thuyết:**
- "Dạng bài này thuộc chủ đề nào em đã học?"
- "Em còn nhớ công thức/định lý nào liên quan không?"
- "Trong SGK phần [X], có công thức nào em nghĩ áp dụng được không?"

🎯 **Về phương pháp:**
- "Em thử nghĩ xem nên bắt đầu từ đâu?"
- "Nếu gọi ẩn là [X], thì điều kiện của bài toán sẽ như thế nào?"
- "Em có thể biến đổi biểu thức này thành dạng quen thuộc không?"

📊 **Về kiểm tra:**
- "Kết quả này có hợp lý không? Em thử thế vào kiểm tra xem?"
- "Đáp án có thỏa điều kiện của bài toán không?"

### BƯỚC 3: CHỈ GỢI Ý HƯỚNG GIẢI (KHÔNG GIẢI CHI TIẾT)
Nếu học sinh thực sự bị mắc kẹt:

💡 **Gợi ý nhẹ:**
- "Gợi ý: Em thử [phép biến đổi/công thức] xem sao"
- "Bài này có thể giải bằng 2 cách: [Cách 1] hoặc [Cách 2]. Em thích cách nào?"
- "Bước tiếp theo là [tên bước], em thử thực hiện nhé"

📖 **Tham khảo tài liệu:**
- "Em xem lại ví dụ [X] trong tài liệu/SGK, có tương tự không?"
- "Phần lý thuyết [Y] có công thức này, em thử áp dụng xem"

### BƯỚC 4: CHỈ GIẢI CHI TIẾT KHI:
✔️ Học sinh đã cố gắng nhưng vẫn không hiểu sau 2-3 lần gợi ý
✔️ Học sinh YÊU CẦU TƯỜNG MINH: "Thầy/cô giải mẫu giúp em"
✔️ Là bài toán quá khó hoặc ngoài chương trình

**Cách giải chi tiết:**
1. **Phân tích đề:** Nêu rõ dữ kiện, yêu cầu2. **Lý thuyết:** Công thức/định lý cần dùng
3. **Giải từng bước:** Giải thích TẠI SAO làm như vậy
4. **Kết luận:** Đáp án rõ ràng
5. **Mở rộng:** "Nếu đề thay đổi [X] thì em làm thế nào?"

---

## PHONG CÁCH GIAO TIẾP

🌟 **Luôn động viên:**
- "Em đang làm rất tốt đấy!"
- "Không sao, nhiều bạn cũng gặp khó khăn ở bước này"
- "Tuyệt! Em đã tự mình tìm ra được!"

🤝 **Tạo không gian tư duy:**
- "Em suy nghĩ trong 2-3 phút rồi thử làm nhé"
- "Không cần vội, em làm từ từ, có gì cứ hỏi"
- "Sai không sao, quan trọng là em hiểu chỗ sai ở đâu"

❌ **TRÁNH:**
- Đưa luôn công thức mà không giải thích
- Giải toàn bộ bài mà học sinh chưa cố gắng
- Nói "Em sai rồi" mà không chỉ rõ tại sao
- Dùng ngôn ngữ quá học thuật, khó hiểu

---

## QUY TẮC HIỂN THỊ TOÁN HỌC

📐 **LaTeX chuẩn:**
- Công thức trong dòng: \$x^2 + 2x + 1\$
- Công thức độc lập: \$\$\\int_{0}^{1} x^2 \\, dx\$\$
- Phân số: \$\\frac{a}{b}\$, căn: \$\\sqrt{x}\$
- Vector: \$\\vec{v}\$, giới hạn: \$\\lim_{x \\to 0}\$
- Ma trận: \$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}\$

---

## XỬ LÝ TÀI LIỆU

📁 Khi có tài liệu đính kèm:
- Tham khảo nội dung để trả lời chính xác
- Trích dẫn: "Theo tài liệu của em, ở phần [X]..."
- Nếu không tìm thấy: "Trong tài liệu em gửi không có phần này. Thầy/cô sẽ giải thích dựa trên kiến thức chung nhé"

---

## CÁC TÌNH HUỐNG ĐẶC BIỆT

### Học sinh chỉ gửi đề, không làm gì:
"Em thử đọc kỹ đề và làm thử phần nào em tự tin trước nhé! Sau đó gửi bài làm lên, thầy/cô sẽ xem và hướng dẫn phần em chưa rõ. Việc tự làm sẽ giúp em nhớ lâu hơn nhiều đấy! 😊"

### Học sinh nói "em không biết làm":
"Không sao! Chúng ta cùng phân tích từng bước:
1. Em hiểu đề bài chưa? Đề yêu cầu tìm gì?
2. Dạng bài này em có gặp trong SGK không?
3. Em thử nhớ lại xem có công thức nào liên quan không?"

### Học sinh hỏi liên tục không tự làm:
"Thầy/cô thấy em có thể tự làm được mà! Thầy/cô đã gợi ý rồi, giờ em thử làm rồi gửi lên nhé. Tự mình làm được sẽ nhớ lâu hơn rất nhiều đấy!"

### Học sinh yêu cầu giải nhanh:
"Thầy/cô hiểu em đang vội, nhưng để em thực sự hiểu và làm được bài tương tự sau này, chúng ta nên cùng phân tích kỹ hơn nhé! Bài này không khó lắm đâu, em làm thử đi!"

---

## LƯU Ý QUAN TRỌNG

⚠️ **KHÔNG BAO GIỜ:**
- Giải toàn bộ bài ngay từ đầu (trừ khi học sinh yêu cầu sau nhiều lần cố gắng)
- Cho đáp án trực tiếp khi học sinh chưa thử- Làm bài kiểm tra/bài thi thay học sinh

✅ **LUÔN LUÔN:**
- Khuyến khích học sinh tự suy nghĩ trước
- Đặt câu hỏi dẫn dắt tư duy
- Khen ngợi mỗi nỗ lực của học sinh
- Giải thích BẢN CHẤT, không chỉ CÔNG THỨC

---

**Phương châm**: "Một AI gia sư giỏi không phải là người giải bài nhanh nhất, mà là người giúp học sinh TỰ TIN giải bài một mình!" 🎓;"""

CHAT_RESPONSE_BLUEPRINT = """Bạn luôn trả lời ở định dạng JSON với 3 khóa chính:
{
  "reply": "Tin nhắn hội thoại. Giải thích kiến thức nền, gợi ý tư duy từng bước, nhắc học sinh tự kiểm tra và đặt câu hỏi kế tiếp.",
  "mindmap_insights": [
    {
      "node_id": "slug-khong-dau",
      "parent_node_id": "ung-dung-dao-ham" | "tinh-don-dieu" | "cuc-tri" | "max-min",
      "label": "Tên node súc tích",
      "type": "topic" | "subtopic" | "concept",
      "weakness_summary": "Mô tả ngắn lỗ hổng kiến thức hoặc kỹ năng học sinh chưa chắc",
      "action_steps": ["Gợi ý 1", "Gợi ý 2" (tối đa 3 câu hướng dẫn thực hành cụ thể)]
    }
  ],
  "geogebra": {
    "should_draw": true | false,
    "reason": "Giải thích vì sao cần đồ thị/hình học (chuỗi rỗng nếu không cần)",
    "prompt": "Mô tả ngắn để gửi cho AI vẽ hình",
    "commands": ["Danh sách lệnh GeoGebra hợp lệ. Chỉ có giá trị khi should_draw = true"]
  }
}

YÊU CẦU:
1. "reply" phải tham chiếu lịch sử cuộc trò chuyện, bổ sung lý thuyết cần thiết để học sinh tự giải, kèm 1-2 câu hỏi gợi mở.
2. "mindmap_insights" phản ánh điểm yếu rút ra từ cả lịch sử và câu trả lời mới nhất. Nếu không có điểm mới thì trả về mảng rỗng.
   - Chỉ dùng các parent_node_id đã có trong mindmap lớp 12: "ung-dung-dao-ham" (gốc), "tinh-don-dieu", "cuc-tri", "max-min".
   - node_id phải dạng slug, duy nhất.
3. "geogebra":
   - Nếu câu hỏi liên quan đồ thị hàm số hoặc hình học không gian/phẳng cần hình minh họa thì should_draw = true, cung cấp prompt ngắn + ít nhất 3 commands.
   - Nếu không cần hình, đặt should_draw = false, reason = "", commands = [].
4. Luôn trả về JSON hợp lệ (không markdown, không giải thích ngoài).
"""

GEOGEBRA_SYSTEM_INSTRUCTION = """Bạn là một chuyên gia GeoGebra, chuyên chuyển đổi mô tả bằng ngôn ngữ tự nhiên thành các lệnh GeoGebra hợp lệ.

🎯 NHIỆM VỤ:
- Phân tích yêu cầu vẽ hình của người dùng
- Sinh ra dan sách các lệnh GeoGebra chính xác, có thứ tự logic
- Đảm bảo các lệnh tương thích với GeoGebra Classic

📐 CÚ PHÁP GEOGEBRA CƠ BẢN:
1. **Điểm**: A = (2, 3) hoặc Point({2, 3})
2. **Đường thẳng**: y = 2x + 1 hoặc Line(A, B)
3. **Đường tròn**: Circle((0,0), 3) hoặc Circle(A, r)
4. **Hàm số**: f(x) = x^2 - 4x + 3
5. **Parabol**: y = a*x^2 + b*x + c
6. **Vector**: v = Vector(A, B)
7. **Đa giác**: Polygon(A, B, C)
8. **Góc**: Angle(A, B, C)
9. **Text**: Text("Label", A)

🔧 QUY TẮC QUAN TRỌNG:
- Định nghĩa các đối tượng cơ bản trước (điểm, hệ số)
- Sử dụng tên biến ngắn gọn (A, B, C cho điểm)
- Tránh xung đột tên biến
- Các lệnh phải độc lập, không phụ thuộc biến ngoài

⚠️ LƯU Ý:
- KHÔNG thêm giải thích, chỉ trả về lệnh
- KHÔNG sử dụng ký tự đặc biệt Việt Nam trong tên biến
- Đảm bảo cú pháp 100% chính xác

🎯 OUTPUT FORMAT: {"commands": ["command1", "command2", ...]}"""

EXERCISE_SYSTEM_INSTRUCTION = """Bạn là một chuyên gia biên soạn bài tập toán THPT lớp 12 Việt Nam."""

TEST_SYSTEM_INSTRUCTION = """Bạn là chuyên gia biên soạn đề thi THPT Quốc gia môn Toán.

🎯 QUY TẮC BẮT BUỘC:

1. **Trắc nghiệm**: Mỗi câu PHẢI có đầy đủ dữ liệu
   ✅ ĐÚNG: "Tìm đạo hàm của hàm số $y = x^3 - 3x^2 + 2$"
   ❌ SAI: "Tìm đạo hàm của hàm số" (thiếu hàm số cụ thể)

2. **Đúng/Sai**: Các mệnh đề phải CỤ THỂ, có thể đánh giá được
   ✅ ĐÚNG: "Hàm số đồng biến trên $(1; +\\infty)$"
   ❌ SAI: "Hàm số đồng biến" (thiếu khoảng)

3. **Trả lời ngắn**: Đề bài rõ ràng, yêu cầu tính toán cụ thể
   ✅ ĐÚNG: "Tính $\\int_0^2 x^2 dx$"
   ❌ SAI: "Tính tích phân" (thiếu hàm số và cận)

4. **LaTeX**: Dùng đúng cú pháp
   - Inline: $x^2 + 1$
   - Display: $$\\int_a^b f(x)dx$$
   - Phân số: $\\frac{a}{b}$
   - Vô cực: $\\infty$

5. **Format JSON**: Không thêm markdown ```json, chỉ trả về object thuần túy"""

SUMMARIZE_SYSTEM_INSTRUCTION = """Bạn là một giảng viên toán học chuyên tóm tắt kiến thức một cách súc tích."""

# ===== FASTAPI APP =====

app = FastAPI(title="Math Tutor API")
app.include_router(node_progress_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
def extract_reply_only(raw_text: str) -> str:
    """
    Lấy phần nội dung trong key "reply": " ... " từ output của model,
    kể cả khi toàn bộ không phải JSON hợp lệ.
    Nếu không tìm thấy, trả lại nguyên chuỗi.
    """
    if not raw_text:
        return ""

    # Bỏ dấu xuống dòng dư thừa để regex dễ làm việc
    text = raw_text.strip()

    # Cố gắng tìm "reply": "...."
    match = re.search(r'"reply"\s*:\s*"([^"]*)"', text, re.DOTALL)
    if match:
        return match.group(1).strip()

    # Nếu model dùng 'reply': '...' (dùng nháy đơn) thì bắt thêm
    match2 = re.search(r"'reply'\s*:\s*'([^']*)'", text, re.DOTALL)
    if match2:
        return match2.group(1).strip()

    # Không tìm được thì trả nguyên
    return text


# ===== SCHEMAS =====

class MediaPart(BaseModel):
    url: str

class ConversationTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class MindmapInsight(BaseModel):
    node_id: str
    parent_node_id: Optional[str] = None
    label: str
    type: Literal["topic", "subtopic", "concept"] = "concept"
    weakness_summary: Optional[str] = None
    action_steps: Optional[List[str]] = None


class GeogebraInstruction(BaseModel):
    should_draw: bool = False
    reason: Optional[str] = None
    prompt: Optional[str] = None
    commands: Optional[List[str]] = None


class ChatInputSchema(BaseModel):
    message: str
    history: List[ConversationTurn] = Field(default_factory=list)
    media: Optional[List[MediaPart]] = None

class GenerateExercisesInput(BaseModel):
    topic: str
    difficulty: str = "medium"
    count: int = 3

class GenerateTestInput(BaseModel):
    topic: str
    difficulty: str = "medium"

class SummarizeTopicInput(BaseModel):
    topic: str
    detail_level: str = "medium"

class GeogebraInputSchema(BaseModel):
    request: str
    graph_type: str = "function"

class AnalyzeTestResultInput(BaseModel):
    userId: str
    testAttempt: dict  # TestAttempt object
    weakTopics: List[dict]  # WeakTopic[]

class AnalyzeTestResultOutput(BaseModel):
    analysis: str
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    suggestedTopics: List[str]

class GenerateAdaptiveTestInput(BaseModel):
    userId: str
    weakTopics: List[str]
    difficulty: str = "medium"

# ===== HELPER FUNCTIONS =====

def evaluate_node_status(score: float, has_opened: bool) -> str:
    """
    Xác định trạng thái node:
    - not_started: chưa học hoặc chưa mở node
    - learning: mở rồi nhưng điểm dưới 80%
    - mastered: điểm >= 80% (>= 24/30)
    """
    if not has_opened:
        return "not_started"

    if score >= 24:  # 80% của 30 điểm
        return "mastered"

    return "learning"

# --- SỬA LỖI: HÀM DỌN DẸP JSON ---
def clean_json_response(raw_text: str) -> str:
    """
    Tìm khối JSON đầu tiên trong chuỗi, loại bỏ ```json và các ký tự không hợp lệ.
    """
    if not raw_text:
        return ""

    # Tìm JSON trong chuỗi AI trả về
    json_match = re.search(r"{[\s\S]*}", raw_text)
    if not json_match:
        print("❌ Không tìm thấy JSON trong output AI")
        print("Raw response:", raw_text[:400])
        return "" # Trả về chuỗi rỗng nếu không tìm thấy

    json_text = json_match.group(0).strip()

    # Loại ký tự điều khiển (nguyên nhân chính gây JSONDecodeError)
    json_text = re.sub(r"[\x00-\x1F\x7F]", " ", json_text)
    # Loại emoji và ký tự mở rộng Unicode
    json_text = re.sub(r"[\U00010000-\U0010ffff]", "", json_text)
    # Chuẩn hoá dấu ngoặc kép Unicode về ASCII
    json_text = json_text.replace("“", "\"").replace("”", "\"")
    json_text = json_text.replace("‘", "'").replace("’", "'")
    # Loại bỏ xuống dòng thật và tab thật
    json_text = json_text.replace("\n", " ").replace("\t", " ")
    # Loại escape thừa dạng "\\n", "\\t"
    json_text = json_text.replace("\\n", " ").replace("\\t", " ")

    # Xử lý nếu AI trả về dạng ```json ... ``` hoặc ```...```
    if json_text.startswith("```json"):
        json_text = json_text[7:]
    elif json_text.startswith("```"):
        json_text = json_text[3:]
    if json_text.endswith("```"):
        json_text = json_text[:-3]

    return json_text.strip()
# --- KẾT THÚC HÀM DỌN DẸP JSON ---


# ===== ENDPOINTS =====

@app.get("/")
async def root():
    return {
        "status": "ok", 
        "message": "Math Tutor API with PDF & Word Support",
        "model": "gemini-2.5-flash",
        "supported_formats": ["PDF (.pdf)", "Word (.docx, .doc)"],
        "endpoints": [
            "/api/chat",
            "/api/generate-exercises", 
            "/api/generate-test",
            "/api/summarize-topic",
            "/api/geogebra",
            "/api/analyze-test-result",
            "/api/generate-adaptive-test"
        ],
        "reference_folders": {
            "exercises": str(EXERCISES_FOLDER),
            "tests": str(TESTS_FOLDER)
        }
    }

# --- SỬA LỖI 1: TỐI ƯU HÓA TỐC ĐỘ CHAT ---
@app.post("/api/chat")
async def handle_chat(request: ChatInputSchema):
    """Handle chat using a persistent ChatSession for speed."""
    try:
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
            "response_mime_type": "application/json",
        }

        model = genai.GenerativeModel(
            "gemini-2.5-flash",
            generation_config=generation_config,
            system_instruction=CHAT_SYSTEM_INSTRUCTION,
        )

        # 1) Xây dựng lại lịch sử cho Gemini ChatSession
        gemini_history = []
        for turn in request.history:
            if not turn.content:
                continue
            mapped_role = "user" if turn.role == "user" else "model"
            gemini_history.append(
                {
                    "role": mapped_role,
                    "parts": [{"text": turn.content}],
                }
            )

        # 2) Khởi tạo ChatSession với lịch sử đã có
        #    Điều này cho phép model duy trì ngữ cảnh mà không cần gửi lại toàn bộ
        chat = model.start_chat(history=gemini_history)

        # 3) Chuẩn bị nội dung tin nhắn MỚI
        user_prompt = f"""{CHAT_RESPONSE_BLUEPRINT}\n\nHọc sinh vừa hỏi: {request.message}"""
        user_parts = [{"text": user_prompt}]

        if request.media:
            for media in request.media:
                user_parts.append({"media": {"url": media.url}})

        # 4) Gửi tin nhắn mới (async)
        #    Model sẽ tự động nối lịch sử đã có với tin nhắn mới này
        response = await chat.send_message_async(user_parts)

        # Lấy raw text từ model
        raw_text = response.text if hasattr(response, "text") else None
        if not raw_text:
            raise ValueError("Model không trả về phản hồi")

        # Mặc định: không mindmap, không vẽ geogebra
        mindmap_data = []
        normalized_geogebra = {
            "should_draw": False,
            "reason": "",
            "prompt": request.message,
            "commands": [],
        }

        # ===================== TRY PARSE JSON =====================
        try:
            # SỬA LỖI: Sử dụng hàm dọn dẹp JSON
            json_candidate = clean_json_response(raw_text)
            
            if not json_candidate:
                raise ValueError("Không tìm thấy JSON hợp lệ trong phản hồi")

            payload = json.loads(json_candidate)

            # Nếu parse được JSON, ưu tiên lấy reply trong JSON
            reply_text = (
                payload.get("reply")
                or payload.get("message")
                or extract_reply_only(raw_text)
            )

            # mindmap_insights nếu là list thì dùng, không thì bỏ qua
            md = payload.get("mindmap_insights")
            if isinstance(md, list):
                mindmap_data = md

            # geogebra nếu có cấu trúc đúng thì dùng cho luồng GeoGebra
            geogebra_block = payload.get("geogebra") or {}
            normalized_geogebra = {
                "should_draw": bool(geogebra_block.get("should_draw")),
                "reason": geogebra_block.get("reason") or "",
                "prompt": geogebra_block.get("prompt") or request.message,
                "commands": geogebra_block.get("commands")
                if isinstance(geogebra_block.get("commands"), list)
                else [],
            }

        except Exception as e:
            # JSON hỏng -> chỉ lấy phần reply, bỏ mindmap & geogebra
            print(f"JSON parse failed, fallback to reply-only: {e}")
            reply_text = extract_reply_only(raw_text)

        # Trả response về frontend: chat chỉ dùng field "reply"
        return {
            "reply": reply_text,
            "mindmap_insights": mindmap_data,
            "geogebra": normalized_geogebra,
        }

    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
# --- KẾT THÚC SỬA LỖI CHAT ---


@app.post("/api/generate-exercises")
async def handle_generate_exercises(request: GenerateExercisesInput):
    """Generate math exercises based on topic"""
    try:
        print(f"📚 Generating exercises for topic: {request.topic}")
        reference_text = load_reference_materials(str(EXERCISES_FOLDER), max_files=3)
        
        generation_config = {
            "temperature": 0.7,
        }
        
        model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config=generation_config,
            system_instruction=EXERCISE_SYSTEM_INSTRUCTION
        )
        
        prompt = f"""Tạo {request.count} bài tập toán học về chủ đề: "{request.topic}"
Độ khó: {request.difficulty}

YÊU CẦU:
- Bài tập phải phù hợp với chương trình Toán 12 Việt Nam
- Cung cấp lời giải chi tiết từng bước
- Sử dụng công thức LaTeX khi cần
- Format Markdown (không cần JSON)

Định dạng mong muốn:
## Bài 1
**Đề bài:** [Nội dung đề]

**Lời giải:**
[Giải thích chi tiết]

**Đáp án:** [Kết quả cuối cùng]

---

## Bài 2
[Tiếp tục...]"""
        
        response = model.generate_content(prompt)
        
        if not response or not hasattr(response, 'text'):
            raise ValueError("Model không trả về phản hồi")
        
        exercises_text = response.text.strip()
        
        if not exercises_text:
            raise ValueError("Model trả về nội dung trống")
        
        print(f"✅ Generated exercises: {len(exercises_text)} characters")
        
        return {
            "exercises": exercises_text
        }
        
    except Exception as e:
        print(f"❌ Generate exercises error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")

# ==============================
#  API TẠO TEST DỰA TRÊN NODE
# ==============================

class NodeTestRequest(BaseModel):
    topic: str   # chính là node.label


# ============================
#   NODE TEST GENERATOR API
# ============================

from pydantic import BaseModel
from fastapi import HTTPException
import json
import google.generativeai as genai


class NodeTestRequest(BaseModel):
    topic: str


@app.post("/api/generate-node-test")
async def generate_node_test(req: NodeTestRequest):
    """Generate test based on current node content"""
    try:
        topic = req.topic

        model = genai.GenerativeModel(
            "gemini-2.5-flash",
            generation_config={
                "temperature": 0.6,
                "response_mime_type": "application/json",
            },
            system_instruction="Bạn là hệ thống sinh đề kiểm tra toán chuẩn THPT."
        )

        # ========================
        #      PROMPT CHUẨN (SỬA LỖI 2A: BẮT BUỘC DÙNG LATEX)
        # ========================
        prompt = f"""
Tạo đề kiểm tra toán lớp 12 dựa 100% trên chủ đề: "{topic}"

YÊU CẦU QUAN TRỌNG VỀ NỘI DUNG:
- Sử dụng LaTeX cho công thức: $x^2$ hoặc $x^2 + 2x + 1 = 0$
- Mỗi câu hỏi PHẢI có đầy đủ dữ liệu (phương trình, hàm số, đồ thị...)
- Câu hỏi phải CỤ THỂ, KHÔNG mơ hồ
- Đáp án phải CHÍNH XÁC

***QUAN TRỌNG VỀ JSON (BẮT BUỘC):***
Toàn bộ đầu ra là một chuỗi JSON. Do đó, tất cả các ký tự gạch chéo ngược (\\) BÊN TRONG chuỗi (ví dụ: trong LaTeX) PHẢI được thoát (escaped) bằng cách nhân đôi.
VÍ DỤ:
- SAI: "$\\frac{{1}}{{2}}$"
- ĐÚNG: "$\\\\frac{{1}}{{2}}$"
- SAI: "$\\lim_{{x \\to 0}}$"
- ĐÚNG: "$\\\\lim_{{x \\\\to 0}}$"
- SAI: "$(1; +\\infty)$"
- ĐÚNG: "$(1; +\\\\infty)$"

YÊU CẦU SỐ LƯỢNG CÂU HỎI:
- 15 câu multiple-choice
- 4 câu true-false (mỗi câu có 4 mệnh đề)
- 2 câu short-answer

CẤU TRÚC JSON BẮT BUỘC (TUYỆT ĐỐI PHẢI ĐÚNG):
{{
  "title": "KIỂM TRA {topic.upper()}",
  "description": "Bài kiểm tra dành riêng cho chủ đề {topic}",
  "parts": {{
    "multipleChoice": {{
      "title": "PHẦN 1: TRẮC NGHIỆM",
      "questions": [
        {{
          "id": 1,
          "type": "multiple-choice",
          "prompt": "Câu hỏi...",
          "options": ["A", "B", "C", "D"],
          "answer": 0
        }}
      ]
    }},
    "trueFalse": {{
      "title": "PHẦN 2: ĐÚNG/SAI",
      "questions": [
        {{
          "id": "tf1",
          "type": "true-false",
          "prompt": "Câu hỏi...",
          "statements": ["...", "...", "...", "..."],
          "answer": [true, false, true, false]
        }}
      ]
    }},
    "shortAnswer": {{
      "title": "PHẦN 3: TRẢ LỜI NGẮN",
      "questions": [
        {{
          "id": "sa1",
          "type": "short-answer",
          "prompt": "Câu hỏi...",
          "answer": "kết quả"
        }}
      ]
    }}
  }}
}}

CHỈ TRẢ VỀ JSON THUẦN.
KHÔNG markdown.
KHÔNG code block.
TẤT CẢ DẤU \\ TRONG LATEX PHẢI ĐƯỢC ESCAPE (ví dụ: \\\\frac, \\\\lim, \\\\infty).
"""


        # ========================
        #        GỌI AI
        # ========================
        response = model.generate_content(prompt)
        raw = response.text

        # ========================
        # VALIDATE JSON (SỬA LỖI 2B: DÙNG HÀM CLEAN_JSON)
        # ========================
        try:
            json_text = clean_json_response(raw)
            if not json_text:
                raise ValueError("Không tìm thấy JSON hợp lệ")
            
            data = json.loads(json_text)
        except Exception as e:
            print(f"❌ RAW JSON ERROR: {e}")
            print(f"Raw response: {raw[:300]}...")
            raise HTTPException(
                status_code=500, 
                detail="AI trả về JSON không hợp lệ."
            )
        
        if "parts" not in data:
            print(f"❌ Thiếu 'parts' trong JSON: {data}")
            raise HTTPException(status_code=500, detail="Thiếu 'parts' trong JSON")

        return {
            "topic": topic,
            "test": data
        }

    except Exception as e:
        print(f"❌ NODE TEST ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/api/generate-test")
async def handle_generate_test(request: GenerateTestInput):
    """Generate a test based on PDF/Word reference materials"""
    try:
        print(f"📝 Loading test reference materials for topic: {request.topic}")
        reference_text = load_reference_materials(str(TESTS_FOLDER), max_files=3)
        
        generation_config = {
            "temperature": 0.6,
            "response_mime_type": "application/json",
        }
        
        model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config=generation_config,
            system_instruction=TEST_SYSTEM_INSTRUCTION
        )
        
        # --- PROMPT NÀY ĐÃ TỐT (GIỮ NGUYÊN) ---
        prompt = f"""Tạo đề kiểm tra TOÁN LỚP 12 về chủ đề: "{request.topic}"
Độ khó: {request.difficulty}

TÀI LIỆU THAM KHẢO:
{reference_text if reference_text else "Không có tài liệu. Tạo đề theo chuẩn THPT QG."}

QUY TẮC QUAN TRỌNG:
1. Mỗi câu hỏi PHẢI có đầy đủ dữ liệu (phương trình, hàm số, đồ thị...)
2. Sử dụng LaTeX cho công thức: $x^2$ hoặc $x^2 + 2x + 1 = 0$
3. Câu hỏi phải CỤ THỂ, KHÔNG mơ hồ
4. Đáp án phải CHÍNH XÁC

VÍ DỤ MẪU:

TRẮC NGHIỆM TỐT:
"Câu 1: Phương trình $x^2 - 5x + 6 = 0$ có bao nhiêu nghiệm?"

TRẮC NGHIỆM SAI (THIẾU DỮ LIỆU):
"Câu 1: Phương trình có bao nhiêu nghiệm?" ❌

ĐÚNG/SAI TỐT:
"Câu 5: Cho hàm số $y = x^3 - 3x + 1$. Xét tính đúng/sai của các mệnh đề sau:
a) Hàm số đồng biến trên khoảng $(1; +\\infty)$
b) Đồ thị hàm số cắt trục hoành tại 3 điểm
c) Hàm số có cực đại tại $x = -1$
d) $\\lim_{{x \\to +\\infty}} y = +\\infty$"

QUAN TRỌNG - PHẦN ĐÚNG/SAI:
Câu hỏi đúng/sai PHẢI có cấu trúc:
- prompt: "Câu X: Cho [dữ liệu cụ thể]. Xét tính đúng/sai của các mệnh đề sau:"
- statements: Mảng 4 mệnh đề CỤ THỂ, có thể đánh giá được

VÍ DỤ MẪU ĐÚNG:
{{
  "id": "tf1",
  "type": "true-false",
  "prompt": "Câu 5: Cho hàm số $y = x^3 - 3x + 1$. Xét tính đúng/sai:",
  "statements": [
    "Hàm số đồng biến trên khoảng $(1; +\\infty)$",
    "Đồ thị hàm số cắt trục hoành tại 3 điểm",
    "Hàm số có cực đại tại $x = -1$",
    "Giới hạn $\\lim_{{x \\to +\\infty}} y = +\\infty$"
  ],
  "answer": [true, true, true, true]
}}

VÍ DỤ SAI (KHÔNG LÀM THẾ NÀY):
{{
  "statements": ["a) Đúng", "b) Sai", "c) Đúng", "d) Sai"]  ❌
}}

***QUAN TRỌNG VỀ JSON (BẮT BUỘC):***
Toàn bộ đầu ra là một chuỗi JSON. Do đó, tất cả các ký tự gạch chéo ngược (\\) BÊN TRONG chuỗi (ví dụ: trong LaTeX) PHẢI được thoát (escaped) bằng cách nhân đôi.
VÍ DỤ:
- SAI: "$\\frac{{1}}{{2}}$"
- ĐÚNG: "$\\\\frac{{1}}{{2}}$"
- SAI: "$\\lim_{{x \\to 0}}$"
- ĐÚNG: "$\\\\lim_{{x \\\\to 0}}$"
- SAI: "$(1; +\\infty)$"
- ĐÚNG: "$(1; +\\\\infty)$"

YÊU CẦU: Trả về JSON thuần túy, KHÔNG markdown code block:

Trả về JSON:
{{
  "title": "KIỂM TRA {request.topic.upper()}",
  "parts": {{
    "multipleChoice": {{ ... }},
    "trueFalse": {{
      "title": "PHẦN 2: ĐÚNG/SAI",
      "questions": [
        {{
          "id": "tf1",
          "type": "true-false",
          "prompt": "Câu 5: Cho hàm số $y = 2x^2 - 4x + 1$. Xét tính đúng/sai của các mệnh đề sau:",
          "statements": [
            "Đồ thị hàm số có trục đối xứng $x = 1$",
            "Hàm số có giá trị nhỏ nhất bằng $-1$",
            "Đồ thị hàm số đi qua điểm $(0, 1)$",
            "Hàm số nghịch biến trên khoảng $(-\\\\infty; 1)$"
          ],
          "answer": [true, true, true, true]
        }}
      ]
    }},
    "shortAnswer": {{ ... }}
  }}
}}

KHÔNG dùng a), b), c), d) trong statements!
Mỗi statement là một mệnh đề hoàn chỉnh!

LƯU Ý BẮT BUỘC:
- KHÔNG dùng markdown ```json ... ```
- Mỗi câu hỏi PHẢI có đầy đủ dữ liệu cụ thể
- LaTeX dùng $ cho inline, $ cho display
- TẤT CẢ DẤU \\ TRONG LATEX PHẢI ĐƯỢC ESCAPE (ví dụ: \\\\frac, \\\\lim, \\\\infty)
- answer trong multipleChoice: 0=option[0], 1=option[1], 2=option[2], 3=option[3]
- answer trong trueFalse: [true, false, true, false]
- answer trong shortAnswer: string số (max 6 ký tự)"""
        
        response = model.generate_content(prompt)
        
        # --- SỬA LỖI 2C: BỔ SUNG PARSING JSON AN TOÀN ---
        try:
            json_text = clean_json_response(response.text)
            if not json_text:
                raise ValueError("Không tìm thấy JSON hợp lệ")
            result = json.loads(json_text)
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error: {e}")
            print(f"Raw response: {response.text[:500]}")
            raise HTTPException(status_code=500, detail="AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.")
        
        # Validate structure
        if "parts" not in result:
            print(f"❌ Missing 'parts' in response: {result}")
            raise HTTPException(status_code=500, detail="Dữ liệu đề thi thiếu cấu trúc 'parts'")
        
        if "multipleChoice" not in result["parts"]:
            print(f"❌ Missing 'multipleChoice' in parts")
            raise HTTPException(status_code=500, detail="Dữ liệu đề thi thiếu phần trắc nghiệm")
        
        return {
            "topic": request.topic,
            "difficulty": request.difficulty,
            "has_reference": bool(reference_text),
            "test": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Generate test error: {e}")
        import traceback
        traceback.print_exc()
        
        error_message = str(e)
        if "429" in error_message or "Resource exhausted" in error_message:
            raise HTTPException(
                status_code=429,
                detail="API Google đang quá tải. Vui lòng đợi 1-2 phút rồi thử lại."
            )
        
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/summarize-topic")
async def handle_summarize_topic(request: SummarizeTopicInput):
    """Summarize a math topic"""
    try:
        print(f"📖 Summarizing topic: {request.topic}")
        
        generation_config = {
            "temperature": 0.5,
        }
        
        model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config=generation_config,
            system_instruction=SUMMARIZE_SYSTEM_INSTRUCTION
        )
        
        prompt = f"""Tóm tắt chủ đề sau một cách ngắn gọn, súc tích và dễ hiểu. 
Sử dụng:
- Các gạch đầu dòng (bullet points)
- Công thức LaTeX khi cần thiết
- Tiêu đề phụ cho từng phần

Chủ đề: {request.topic}
Độ chi tiết: {request.detail_level}"""
        
        response = model.generate_content(prompt)
        
        if not response or not hasattr(response, 'text'):
            raise ValueError("Model không trả về phản hồi")
        
        summary_text = response.text.strip()
        
        if not summary_text:
            raise ValueError("Model trả về nội dung trống")
        
        print(f"✅ Generated summary: {len(summary_text)} characters")
        
        return {
            "topic": request.topic,
            "summary": summary_text
        }
        
    except Exception as e:
        print(f"❌ Summarize topic error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")


@app.post("/api/geogebra")
async def handle_geogebra(request: GeogebraInputSchema):
    """Generate GeoGebra commands"""
    try:
        generation_config = {
            "temperature": 0.3,
            "response_mime_type": "application/json",
        }
        
        model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config=generation_config,
            system_instruction=GEOGEBRA_SYSTEM_INSTRUCTION
        )
        
        prompt = f"""Tạo lệnh GeoGebra cho: {request.request}

Trả về JSON:
{{
  "commands": ["command1", "command2"]
}}"""
        
        response = model.generate_content(prompt)
        # SỬA LỖI: Dùng hàm clean_json
        json_text = clean_json_response(response.text)
        if not json_text:
            raise ValueError("Không tìm thấy JSON hợp lệ")
            
        result = json.loads(json_text)
        
        if "commands" not in result or not isinstance(result["commands"], list):
            raise ValueError("Invalid response format")
        
        return result
        
    except Exception as e:
        print(f"Geogebra error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze-test-result")
async def handle_analyze_test_result(request: AnalyzeTestResultInput):
    """
    Phân tích kết quả bài kiểm tra và đưa ra đánh giá, lời khuyên chi tiết
    """
    try:
        generation_config = {
            "temperature": 0.6,
        }
        
        model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config=generation_config,
        )
        
        attempt = request.testAttempt
        weak_topics = request.weakTopics
        
        incorrect_answers_str = ""
        try:
            incorrect_answers = [a for a in attempt['answers'] if not a['isCorrect']]
            
            if not incorrect_answers:
                incorrect_answers_str = "**Học sinh đã trả lời đúng tất cả các câu!**\n"
            else:
                incorrect_answers_str = "**DANH SÁCH CÁC CÂU TRẢ LỜI SAI (Làm cơ sở chẩn đoán):**\n"
                for i, ans in enumerate(incorrect_answers[:5]): 
                    incorrect_answers_str += (
                        f"{i+1}. Chủ đề: {ans.get('topic', 'N/A')}\n"
                        f"   - Loại câu hỏi: {ans.get('questionType', 'N/A')}\n"
                        f"   - Đã chọn: {ans.get('userAnswer', 'N/A')}\n"
                        f"   - Đáp án đúng: {ans.get('correctAnswer', 'N/A')}\n\n"
                    )
        except Exception as e:
            print(f"Warning: Không thể trích xuất câu sai: {e}")
            incorrect_answers_str = "Không thể tải chi tiết các câu sai."
        
        prompt = f"""Bạn là một chuyên gia giáo dục và gia sư toán học AI. Nhiệm vụ của bạn là phân tích sâu kết quả bài làm của học sinh, không chỉ báo cáo điểm số mà còn **chẩn đoán các "lỗi tư duy" (thinking gaps)** và các "khái niệm hiểu lầm" (misconceptions).

**THÔNG TIN BÀI LÀM:**
- Điểm số: {attempt.get('score', 0):.1f}/100
- Số câu đúng: {attempt.get('correctAnswers', 0)}/{attempt.get('totalQuestions', 0)}
- Thời gian làm bài: {attempt.get('timeSpent', 0)} giây

**THỐNG KÊ CHỦ ĐỀ YẾU (từ Client):**
{chr(10).join([f"- {t.get('topic', 'N/A')}: {t.get('accuracy', 0):.1f}% ({t.get('correctAnswers', 0)}/{t.get('totalQuestions', 0)} câu)" for t in weak_topics])}

{incorrect_answers_str}

**YÊU CẦU PHÂN TÍCH (TRẢ VỀ JSON):**

1.  **analysis (Phân tích tổng quan)**:
    Nhận xét chung (2-3 câu) về kết quả bài làm.

2.  **strengths (Điểm mạnh)**:
    Những gì học sinh làm tốt (ví dụ: "Làm tốt phần Đúng/Sai", "Nắm vững chủ đề X").

3.  **weaknesses (Phân tích lỗi sai & Lỗi tư duy)**:
    * **QUAN TRỌNG NHẤT**: Dựa vào "DANH SÁCH CÁC CÂU TRẢ LỜI SAI" ở trên, hãy chẩn đoán các lỗi sai cụ thể.
    * **KHÔNG** chỉ nói chung chung là "yếu chủ đề X".
    * **HÃY** chẩn đoán NGUYÊN NHÂN. Ví dụ:
        - "Học sinh có vẻ bị nhầm lẫn giữa cực trị và điểm uốn, thể hiện ở câu...".
        - "Lỗi tính toán cơ bản (sai dấu) khi giải phương trình đạo hàm".
        - "Chưa nắm vững công thức tính thể tích khối nón (nhầm với công thức khối chóp)".
        - "Đọc đề không kỹ, bỏ sót điều kiện (ví dụ: 'số nguyên dương')".
        - "Hiểu sai bản chất của tiệm cận đứng".

4.  **recommendations (Khuyến nghị & Kiến thức trọng tâm)**:
    * Dựa trên "weaknesses", đưa ra lời khuyên CỤ THỂ, mang tính HÀNH ĐỘNG.
    * Chỉ rõ các CÔNG THỨC, ĐỊNH NGHĨA, hoặc PHƯƠNG PHÁP giải nào cần được ôn tập.
    * Ví dụ:
        - "Cần ôn lại bảng đạo hàm của các hàm số cơ bản (đặc biệt là hàm loga, mũ)".
        - "Xem lại 3 bước để tìm tiệm cận của đồ thị hàm số".
        - "Luyện tập 5 bài tập về nhận diện đồ thị hàm số bậc 3 và bậc 4 trùng phương".

5.  **suggestedTopics (Chủ đề nên ôn tập)**:
    Liệt kê 3-5 chủ đề chính cần ôn (dựa trên `weak_topics` và `weaknesses`).

**ĐỊNH DẠNG JSON TRẢ VỀ (BẮT BUỘC):**
{{
  "analysis": "...",
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "recommendations": ["...", "...", "..."],
  "suggestedTopics": ["...", "...", "..."]
}}

LƯU Ý: 
- Dùng giọng điệu thân thiện, khích lệ, như một gia sư
- Tập trung vào việc giúp học sinh TỰ TIN hơn"""
        
        response = model.generate_content(prompt)
        
        # SỬA LỖI: Dùng hàm clean_json
        json_text = clean_json_response(response.text)
        if not json_text:
            print("❌ Không tìm thấy JSON trong output AI")
            print("Raw response:", response.text[:400])
            raise HTTPException(status_code=500, detail="AI trả về dữ liệu không hợp lệ")

        try:
            result = json.loads(json_text)
        except json.JSONDecodeError as e:
            print("❌ JSON decode error:", e)
            print("JSON extracted:", json_text[:400])
            raise HTTPException(status_code=500, detail="AI trả về JSON lỗi")

        return result
        
    except Exception as e:
        print(f"❌ Analyze test result error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")


@app.post("/api/generate-adaptive-test")
async def handle_generate_adaptive_test(request: GenerateAdaptiveTestInput):
    """
    Tạo đề thi thích ứng dựa trên điểm yếu của học sinh
    """
    try:
        print(f"📝 Generating adaptive test for user: {request.userId}")
        print(f"Weak topics: {request.weakTopics}")
        
        generation_config = {
            "temperature": 0.6,
            "response_mime_type": "application/json",
        }
        
        model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config=generation_config,
            system_instruction=TEST_SYSTEM_INSTRUCTION
        )
        
        topics_str = ", ".join(request.weakTopics)
        
        # --- PROMPT NÀY ĐÃ TỐT (GIỮ NGUYÊN) ---
        prompt = f"""Tạo đề kiểm tra TOÁN LỚP 12 tập trung vào các chủ đề YẾU của học sinh:

**CÁC CHỦ ĐỀ CẦN LUYỆN TẬP:**
{topics_str}

Độ khó: {request.difficulty}

**YÊU CẦU ĐẶC BIỆT:**
- 70% câu hỏi về các chủ đề yếu đã liệt kê
- 30% câu hỏi tổng hợp để kiểm tra kiến thức tổng quát
- Độ khó tăng dần từ câu dễ đến khó
- Các câu hỏi phải có đầy đủ dữ liệu (phương trình, hàm số, số liệu...)

{TEST_SYSTEM_INSTRUCTION}

***QUAN TRỌNG VỀ JSON (BẮT BUỘC):***
Toàn bộ đầu ra là một chuỗi JSON. Do đó, tất cả các ký tự gạch chéo ngược (\\) BÊN TRONG chuỗi (ví dụ: trong LaTeX) PHẢI được thoát (escaped) bằng cách nhân đôi.
VÍ DỤ:
- SAI: "$\\frac{{1}}{{2}}$"
- ĐÚNG: "$\\\\frac{{1}}{{2}}$"
- SAI: "$\\lim_{{x \\to 0}}$"
- ĐÚNG: "$\\\\lim_{{x \\\\to 0}}$"
- SAI: "$(1; +\\infty)$"
- ĐÚNG: "$(1; +\\\\infty)$"

LƯU Ý BẮT BUỘC:
- KHÔNG dùng markdown ```json ... ```
- TẤT CẢ DẤU \\ TRONG LATEX PHẢI ĐƯỢC ESCAPE (ví dụ: \\\\frac, \\\\lim, \\\\infty)

Trả về JSON thuần túy (KHÔNG dùng markdown code block)."""
        
        response = model.generate_content(prompt)
        
        # --- SỬA LỖI 2C: BỔ SUNG PARSING JSON AN TOÀN ---
        try:
            json_text = clean_json_response(response.text)
            if not json_text:
                raise ValueError("Không tìm thấy JSON hợp lệ")
            result = json.loads(json_text)
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error: {e}")
            raise HTTPException(status_code=500, detail="AI trả về dữ liệu không hợp lệ")
        
        return {
            "userId": request.userId,
            "weakTopics": request.weakTopics,
            "difficulty": request.difficulty,
            "test": result
        }
        
    except Exception as e:
        print(f"❌ Generate adaptive test error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 Starting Math Tutor API Server")
    print("="*60)
    print(f"📁 Exercises folder: {EXERCISES_FOLDER}")
    print(f"📁 Tests folder: {TESTS_FOLDER}")
    print("\n📄 Supported formats: PDF (.pdf), Word (.docx, .doc)")
    print("⚠️  NOTE: Place your files in these folders")
    print("="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)