# src/ai_flows/chat_flow.py
import genkit.ai as ai
from genkit import flow
from ..ai_schemas.chat_schema import ChatInputSchema
from typing import AsyncGenerator

MODEL = "gemini-2.5-flash"
SYSTEM_INSTRUCTION = """Bạn là một AI gia sư toán học THPT lớp 12 Việt Nam... (sao chép toàn bộ nội dung prompt từ tệp chat-flow.ts của bạn vào đây) ..."Một AI gia sư giỏi không phải là người giải bài nhanh nhất, mà là người giúp học sinh TỰ TIN giải bài một mình!" 🎓"""

@flow(stream=True)
async def chat(input: ChatInputSchema) -> AsyncGenerator[str, None]:
    prompt_parts = [{"text": input.message}]
    if input.media:
        for media in input.media:
            prompt_parts.append({"media": {"url": media.url}})
    
    stream = await ai.generate(
        prompt={
            "role": "user",
            "content": prompt_parts
        },
        history=[],
        config=ai.GenerationConfig(
            model=MODEL,
            system_instruction=SYSTEM_INSTRUCTION,
        ),
        stream=True
    )

    async for chunk in stream:
        yield chunk.text