# src/ai_flows/geogebra_flow.py
import genkit.ai as ai
from genkit import flow
from ..ai_schemas.geogebra_schema import GeogebraInputSchema, GeogebraOutputSchema

MODEL = "models/gemini-1.5-flash"
GEOGEBRA_PROMPT = """Bạn là một AI gia sư toán học THPT lớp 12 Việt Nam... (sao chép toàn bộ nội dung prompt từ tệp geogebra-flow.ts của bạn vào đây) ... "Một AI gia sư giỏi không phải là người giải bài nhanh nhất, mà là người giúp học sinh TỰ TIN giải bài một mình!" 🎓"""

@ai.prompt
def geogebra_prompt(input: GeogebraInputSchema) -> ai.Prompt[GeogebraOutputSchema]:
    return ai.Prompt(
        GEOGEBRA_PROMPT, # Lưu ý: prompt này có vẻ là system instruction
        input=input.request, # Giả định request của user là input
        config=ai.GenerationConfig(model=MODEL, response_format=ai.ResponseFormat.JSON)
    )
    
# Lưu ý: System prompt của bạn cho Geogebra rất giống với Chat.
# Có thể bạn muốn nó hoạt động như một System Instruction.
# Nếu vậy, cách tiếp cận sau có thể tốt hơn:

@ai.prompt
def geogebra_prompt_v2(input_request: str) -> ai.Prompt[GeogebraOutputSchema]:
    return ai.Prompt(
        input_request,
        config=ai.GenerationConfig(
            model=MODEL,
            system_instruction=GEOGEBRA_PROMPT,
            response_format=ai.ResponseFormat.JSON
        )
    )

@flow
async def generate_geogebra_commands(input: GeogebraInputSchema) -> GeogebraOutputSchema:
    # Sử dụng v2 nếu bạn muốn prompt dài hoạt động như một chỉ dẫn hệ thống
    response = await geogebra_prompt_v2.generate(input_request=input.request)
    return response.output
