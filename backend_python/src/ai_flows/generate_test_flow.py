# src/ai_flows/generate_test_flow.py
import genkit.ai as ai
from genkit import flow
from pydantic import BaseModel, Field
from ..ai_schemas.test_schema import TestSchema
from typing import Literal # 👈 Thêm Literal

MODEL = "models/gemini-1.5-flash"

class GenerateTestInput(BaseModel):
    topic: str = Field(description='The topic to generate a test for.')
    # 👇 Thêm 2 trường này
    testType: Literal['standard', 'thptqg', 'node'] = Field(
        default='standard', 
        description='The type of test to generate (standard 3-part, THPTQG 50-question, or node-based).'
    )
    numQuestions: int = Field(
        default=5, 
        description='Approximate number of questions (used for THPTQG or node tests).'
    )


class GenerateTestOutput(BaseModel):
    test: TestSchema = Field(description='The generated test.')

# Tách riêng các đoạn prompt
PROMPT_BASE = """Bạn là một AI chuyên tạo đề kiểm tra toán học cho học sinh lớp 12 ở Việt Nam.
Hãy tạo một bài kiểm tra đầy đủ dựa vào chủ đề và yêu cầu được cung cấp.

Chủ đề: {topic}

YÊU CẦU CHUNG:
1. Tạo một bài kiểm tra có cấu trúc JSON hợp lệ theo schema đã cho.
2. Nội dung câu hỏi phải phù hợp với chương trình Toán lớp 12 của Việt Nam.
3. Sử dụng công thức toán học LaTeX khi cần thiết.
4. Cung cấp đáp án chính xác cho TẤT CẢ các câu hỏi.
5. Hãy đảm bảo đầu ra là một đối tượng JSON duy nhất, không có bất kỳ văn bản nào khác.
"""

PROMPT_STANDARD_FORMAT = """
YÊU CẦU CẤU TRÚC (ĐỀ TIÊU CHUẨN):
1.  Đề bài phải bao gồm 3 phần:
    -   **Phần 1: Trắc nghiệm (Multiple Choice):** Gồm 4 câu hỏi. Mỗi câu có 4 đáp án (A, B, C, D) và chỉ có 1 đáp án đúng.
    -   **Phần 2: Đúng/Sai (True/False):** Gồm 1 câu hỏi, trong đó có 4 mệnh đề nhỏ.
    -   **Phần 3: Trả lời ngắn (Short Answer):** Gồm 1 câu hỏi. Đáp án là một số (tối đa 6 ký tự).
2.  Đáp án:
    -   Trắc nghiệm: đáp án là chỉ số của lựa chọn đúng (0-3).
    -   Đúng/Sai: đáp án là một mảng boolean.
    -   Trả lời ngắn: đáp án là một chuỗi số.
"""

PROMPT_THPTQG_FORMAT = """
YÊU CẦU CẤU TRÚC (ĐỀ THI THPTQG):
1.  Đề bài CHỈ BAO GỒM 1 PHẦN DUY NHẤT:
    -   **Phần 1: Trắc nghiệm (multipleChoice):** Gồm {num_questions} câu hỏi. (Mặc định của đề THPTQG là 50, nhưng hãy tạo theo số lượng yêu cầu).
2.  Mỗi câu hỏi phải có 4 đáp án (A, B, C, D) và chỉ có 1 đáp án đúng.
3.  Đáp án:
    -   Trắc nghiệm: đáp án là chỉ số của lựa chọn đúng (0-3).
    -   KHÔNG tạo phần trueFalse hoặc shortAnswer.
"""

@ai.prompt
def generate_test_prompt(input: GenerateTestInput) -> ai.Prompt[GenerateTestZOutput]:
    
    prompt_text = PROMPT_BASE.format(topic=input.topic)
    
    # 👇 Logic chọn prompt động
    if input.testType == 'thptqg':
        prompt_text += PROMPT_THPTQG_FORMAT.format(num_questions=input.numQuestions)
    elif input.testType == 'node':
         # Tạm thời dùng format THPTQG cho node test, vì nó cũng chỉ cần trắc nghiệm
        prompt_text += PROMPT_THPTQG_FORMAT.format(num_questions=input.numQuestions)
    else: # 'standard'
        prompt_text += PROMPT_STANDARD_FORMAT

    return ai.Prompt(
        prompt_text,
        config=ai.GenerationConfig(model=MODEL, response_format=ai.ResponseFormat.JSON)
    )

@flow
async def generate_test(input: GenerateTestInput) -> GenerateTestOutput:
    response = await generate_test_prompt.generate(input=input)
    return response.output
