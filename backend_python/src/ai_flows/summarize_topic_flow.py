# src/ai_flows/summarize_topic_flow.py
import genkit.ai as ai
from genkit import flow
from pydantic import BaseModel, Field

MODEL = "gemini-2.5-flash"

class SummarizeTopicInput(BaseModel):
  topic: str = Field(description='The topic to summarize.')

class SummarizeTopicOutput(BaseModel):
  summary: str = Field(description='The summary of the topic.')

@ai.prompt
def summarize_topic_prompt(input: SummarizeTopicInput) -> ai.Prompt[SummarizeTopicOutput]:
    prompt_text = f"""Bạn là một chuyên gia tóm tắt kiến thức toán học. Hãy tóm tắt chủ đề sau một cách ngắn gọn, súc tích và dễ hiểu, sử dụng các gạch đầu dòng và công thức LaTeX khi cần thiết.

Chủ đề: {input.topic}
"""
    return ai.Prompt(
        prompt_text,
        config=ai.GenerationConfig(model=MODEL, response_format=ai.ResponseFormat.JSON)
    )

@flow
async def summarize_topic(input: SummarizeTopicInput) -> SummarizeTopicOutput:
    response = await summarize_topic_prompt.generate(input=input)
    return response.output