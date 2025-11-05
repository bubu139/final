# src/main.py
import uvicorn
import json
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware  
from pydantic import BaseModel
from typing import List, Optional
import PyPDF2
from docx import Document

# Import config
from .ai_config import genai

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

CHAT_SYSTEM_INSTRUCTION = """Bạn là một AI gia sư toán học THPT lớp 12 Việt Nam chuyên nghiệp, thân thiện và kiên nhẫn.

🎯 MỤC TIÊU CHÍNH:
- Giúp học sinh HIỂU BẢN CHẤT vấn đề, không chỉ ghi nhớ công thức
- Khuyến khích tư duy logic và phương pháp giải quyết vấn đề
- Xây dựng nền tảng vững chắc cho kỳ thi THPT Quốc gia

📚 PHẠM VI KIẾN THỨC:
- Giải tích 12: Hàm số, đạo hàm, khảo sát hàm số, tích phân, số phức
- Hình học không gian: Khối đa diện, mặt nón, mặt trụ, mặt cầu
- Xác suất thống kê: Xác suất, biến ngẫu nhiên

🔧 CÁCH TRÌNH BÀY:
1. **Phân tích đề bài**: Xác định dạng bài, yêu cầu cụ thể
2. **Hướng dẫn từng bước**: Giải thích logic đằng sau mỗi bước
3. **Sử dụng LaTeX**: Viết công thức toán học đẹp với $...$ (inline) hoặc $$...$$ (display)
4. **Kiểm tra lại**: Luôn verify đáp án cuối cùng

💡 PHONG CÁCH GIẢNG DẠY:
- Dùng ví dụ thực tế để minh họa khái niệm trừu tượng
- Chỉ ra các SAI LẦM THƯỜNG GẶP
- Cung cấp tips & tricks cho kỳ thi
- Khuyến khích học sinh đặt câu hỏi

⚠️ LƯU Ý:
- Không đưa ra đáp án trực tiếp ngay lập tức, hãy hướng dẫn
- Nếu học sinh mắc lỗi, chỉ ra nhẹ nhàng và giải thích tại sao
- Điều chỉnh độ khó phù hợp với từng học sinh

"Một AI gia sư giỏi không phải là người giải bài nhanh nhất, mà là người giúp học sinh TỰ TIN giải bài một mình!" 🎓"""

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== SCHEMAS =====

class MediaPart(BaseModel):
    url: str

class ChatInputSchema(BaseModel):
    message: str
    history: List = []
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

async def stream_generator(text_generator):
    """Convert generator to async generator for streaming"""
    for chunk in text_generator:
        if hasattr(chunk, 'text') and chunk.text:
            yield chunk.text

# ===== ENDPOINTS =====

@app.get("/")
async def root():
    return {
        "status": "ok", 
        "message": "Math Tutor API with PDF & Word Support",
        "model": "gemini-2.0-flash-exp",
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

@app.post("/api/chat")
async def handle_chat(request: ChatInputSchema):
    """Handle chat with streaming response"""
    try:
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
        }
        
        model = genai.GenerativeModel(
            'gemini-2.0-flash-exp',
            generation_config=generation_config,
            system_instruction=CHAT_SYSTEM_INSTRUCTION
        )
        
        if request.media:
            prompt_parts = [request.message]
            response = model.generate_content(prompt_parts, stream=True)
        else:
            response = model.generate_content(request.message, stream=True)
        
        return StreamingResponse(
            stream_generator(response),
            media_type="text/plain; charset=utf-8"
        )
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
            'gemini-2.0-flash-exp',
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
            'gemini-2.0-flash-exp',
            generation_config=generation_config,
            system_instruction=TEST_SYSTEM_INSTRUCTION
        )
        
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
            "Hàm số nghịch biến trên khoảng $(-\\infty; 1)$"
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
- answer trong multipleChoice: 0=option[0], 1=option[1], 2=option[2], 3=option[3]
- answer trong trueFalse: [true, false, true, false]
- answer trong shortAnswer: string số (max 6 ký tự)"""
        
        response = model.generate_content(prompt)
        
        # Parse JSON response
        try:
            result = json.loads(response.text)
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
        
        # ✅ THÊM THÔNG BÁO RÕ RÀNG CHO 429 ERRORS
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
            'gemini-2.0-flash-exp',
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
            'gemini-2.0-flash-exp',
            generation_config=generation_config,
            system_instruction=GEOGEBRA_SYSTEM_INSTRUCTION
        )
        
        prompt = f"""Tạo lệnh GeoGebra cho: {request.request}

Trả về JSON:
{{
  "commands": ["command1", "command2"]
}}"""
        
        response = model.generate_content(prompt)
        result = json.loads(response.text)
        
        if "commands" not in result or not isinstance(result["commands"], list):
            raise ValueError("Invalid response format")
        
        return result
        
    except Exception as e:
        print(f"Geogebra error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze-test-result")
async def handle_analyze_test_result(request: AnalyzeTestResultInput):
    """
    Phân tích kết quả bài kiểm tra và đưa ra đánh giá, lời khuyên
    """
    try:
        generation_config = {
            "temperature": 0.5,
        }
        
        model = genai.GenerativeModel(
            'gemini-2.0-flash-exp',
            generation_config=generation_config,
        )
        
        attempt = request.testAttempt
        weak_topics = request.weakTopics
        
        prompt = f"""Bạn là một chuyên gia giáo dục toán học, hãy phân tích kết quả bài kiểm tra của học sinh và đưa ra nhận xét, lời khuyên.

**THÔNG TIN BÀI LÀM:**
- Điểm số: {attempt['score']:.1f}/100
- Số câu đúng: {attempt['correctAnswers']}/{attempt['totalQuestions']}
- Điểm trắc nghiệm: {attempt['multipleChoiceScore']:.1f}%
- Điểm đúng/sai: {attempt['trueFalseScore']:.1f}%
- Điểm trả lời ngắn: {attempt['shortAnswerScore']:.1f}%
- Thời gian làm bài: {attempt['timeSpent']} giây

**CÁC CHỦ ĐỀ YẾU:**
{chr(10).join([f"- {t['topic']}: {t['accuracy']:.1f}% ({t['correctAnswers']}/{t['totalQuestions']} câu)" for t in weak_topics])}

**YÊU CẦU:**

1. **Phân tích tổng quan** (2-3 câu): Đánh giá chung về kết quả bài làm

2. **Điểm mạnh** (2-3 điểm): Những gì học sinh làm tốt

3. **Điểm yếu** (2-3 điểm): Những gì cần cải thiện

4. **Khuyến nghị** (3-4 điểm): Lời khuyên cụ thể để cải thiện

5. **Chủ đề nên ôn tập** (3-5 chủ đề): Các chủ đề cần tập trung ôn tập

Trả về JSON với định dạng:
{{
  "analysis": "...",
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "recommendations": ["...", "...", "..."],
  "suggestedTopics": ["...", "...", "..."]
}}

LƯU Ý: 
- Dùng giọng điệu thân thiện, khích lệ
- Đưa ra lời khuyên CỤ THỂ, HÀNH ĐỘNG được
- Tập trung vào việc giúp học sinh TỰ TIN hơn"""
        
        response = model.generate_content(prompt)
        result_text = response.text.strip()
        
        # Parse JSON
        try:
            # Remove markdown code blocks if present
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.startswith('```'):
                result_text = result_text[3:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            
            result = json.loads(result_text)
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error: {e}")
            print(f"Raw response: {result_text[:500]}")
            raise HTTPException(status_code=500, detail="AI trả về dữ liệu không hợp lệ")
        
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
            'gemini-2.0-flash-exp',
            generation_config=generation_config,
            system_instruction=TEST_SYSTEM_INSTRUCTION
        )
        
        topics_str = ", ".join(request.weakTopics)
        
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

Trả về JSON thuần túy (KHÔNG dùng markdown code block)."""
        
        response = model.generate_content(prompt)
        
        try:
            result_text = response.text.strip()
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.startswith('```'):
                result_text = result_text[3:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            
            result = json.loads(result_text)
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