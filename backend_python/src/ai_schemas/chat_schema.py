# src/ai_schemas/chat_schema.py
from pydantic import BaseModel, Field
from typing import List, Optional

class MediaPart(BaseModel):
    url: str = Field(description="A data URI of the media.")

class ChatInputSchema(BaseModel):
    message: str
    media: Optional[List[MediaPart]] = None

class ChatOutputSchema(BaseModel):
    message: str