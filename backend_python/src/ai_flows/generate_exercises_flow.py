# src/ai_flows/generate_exercises_flow.py
import genkit.ai as ai
from genkit import flow
from pydantic import BaseModel, Field

MODEL = "gemini-2.5-flash"

class GenerateExercisesInput(BaseModel):
    topic: str = Field(description='The topic to generate exercises for.')

class GenerateExercisesOutput(BaseModel):
    exercises: str = Field(description='The generated exercises in Markdown format.')

@ai.prompt
def generate_exercises_prompt(input: GenerateExercisesInput) -> ai.Prompt[GenerateExercisesOutput]:
    prompt_text = f"""Bạn là một AI tạo bài tập toán học. Hãy tạo 3 bài tập tự luận (kèm đáp án chi tiết) về chủ đề sau. Sử dụng công thức LaTeX.

Chủ đề: {input.topic}"""
    return ai.Prompt(
        prompt_text,
        config=ai.GenerationConfig(model=MODEL, response_format=ai.ResponseFormat.JSON)
    )

@flow
async def generate_exercises(input: GenerateExercisesInput) -> GenerateExercisesOutput:
    response = await generate_exercises_prompt.generate(input=input)
    return response.output