# src/ai_flows/generate_test_flow.py
import genkit.ai as ai
from genkit import flow
from pydantic import BaseModel, Field
from ..ai_schemas.test_schema import TestSchema

MODEL = "gemini-2.5-flash"

class GenerateTestInput(BaseModel):
    topic: str = Field(description='The topic to generate a test for.')

class GenerateTestOutput(BaseModel):
    test: TestSchema = Field(description='The generated test.')

@ai.prompt
def generate_test_prompt(input: GenerateTestInput) -> ai.Prompt[GenerateTestOutput]:
    prompt_text = f"""Bạn là một AI chuyên tạo đề kiểm tra toán học cho học sinh lớp 12 ở Việt Nam.
    Hãy tạo một bài kiểm tra đầy đủ dựa vào chủ đề được cung cấp.

    Chủ đề: {input.topic}

    YÊU CẦU:
    1.  Tạo một bài kiểm tra có cấu trúc JSON hợp lệ theo schema đã cho.
    2.  Đề bài phải bao gồm 3 phần:
        -   **Phần 1: Trắc nghiệm (Multiple Choice):** Gồm 4 câu hỏi. Mỗi câu có 4 đáp án (A, B, C, D) và chỉ có 1 đáp án đúng.
        -   **Phần 2: Đúng/Sai (True/False):** Gồm 1 câu hỏi, trong đó có 4 mệnh đề nhỏ. Học sinh sẽ đánh giá mỗi mệnh đề là Đúng hoặc Sai.
        -   **Phần 3: Trả lời ngắn (Short Answer):** Gồm 1 câu hỏi. Đáp án là một số (nguyên hoặc thập phân) gồm tối đa 6 ký tự (bao gồm cả dấu "." hoặc "-").
    3.  Nội dung câu hỏi phải phù hợp với chương trình Toán lớp 12 của Việt Nam và bám sát chủ đề được đưa ra.
    4.  Sử dụng công thức toán học LaTeX khi cần thiết.
    5.  Cung cấp đáp án chính xác cho TẤT CẢ các câu hỏi.
        -   Đối với trắc nghiệm, đáp án là chỉ số của lựa chọn đúng (0 cho A, 1 cho B, 2 cho C, 3 cho D).
        -   Đối với đúng/sai, đáp án là một mảng boolean.
        -   Đối với trả lời ngắn, đáp án là một chuỗi số.

    Hãy đảm bảo đầu ra là một đối tượng JSON duy nhất, không có bất kỳ văn bản nào khác.
    """
    return ai.Prompt(
        prompt_text,
        config=ai.GenerationConfig(model=MODEL, response_format=ai.ResponseFormat.JSON)
    )

@flow
async def generate_test(input: GenerateTestInput) -> GenerateTestOutput:
    response = await generate_test_prompt.generate(input=input)
    return response.output