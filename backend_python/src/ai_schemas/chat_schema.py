# src/ai_schemas/chat_schema.py
from typing import List, Literal, Optional
from pydantic import BaseModel, Field

# --- Schema cho Input (Dữ liệu từ Frontend gửi lên) ---
class MediaPart(BaseModel):
    url: str = Field(description="A data URI of the media.")

class ConversationTurn(BaseModel):
    role: Literal["user", "assistant", "model"] # Hỗ trợ cả 'assistant' và 'model'
    content: str

class ChatInputSchema(BaseModel):
    message: str
    history: List[ConversationTurn] = Field(default_factory=list)
    media: Optional[List[MediaPart]] = None

# --- Schema cho Output (Dữ liệu AI trả về) ---

class MindmapInsight(BaseModel):
    """Cấu trúc dữ liệu để tạo node mới trên Mindmap"""
    node_id: str = Field(description="Unique id for the new mindmap node (slugify format)")
    parent_node_id: Optional[str] = Field(
        default=None,
        description="ID of the parent node to attach to (e.g., 'ung-dung-dao-ham', 'khao-sat-ham-so')"
    )
    label: str = Field(description="Title of the concept/topic")
    type: Literal["topic", "subtopic", "concept"] = "concept"
    weakness_summary: Optional[str] = Field(
        default=None,
        description="Short explanation of why the student needs this concept"
    )
    action_steps: Optional[List[str]] = Field(
        default=None,
        description="Concrete steps for the student to practice"
    )

class GeogebraInstruction(BaseModel):
    """Cấu trúc dữ liệu để điều khiển GeoGebra"""
    should_draw: bool = Field(default=False, description="True if the math problem requires visual graph")
    reason: Optional[str] = Field(default=None, description="Why do we need to draw this?")
    commands: Optional[List[str]] = Field(
        default=None, 
        description="List of valid GeoGebra commands. E.g. ['f(x)=x^2', 'A=(1,1)']"
    )

class ChatOutputSchema(BaseModel):
    """Cấu trúc tổng thể của phản hồi từ AI"""
    reply: str = Field(description="The conversational markdown response to the student")
    mindmap_insights: List[MindmapInsight] = Field(default_factory=list)
    geogebra: GeogebraInstruction = Field(default_factory=GeogebraInstruction)