# src/ai_schemas/chat_schema.py
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class MediaPart(BaseModel):
    url: str = Field(description="A data URI of the media.")


class ConversationTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class MindmapInsight(BaseModel):
    node_id: str = Field(description="Unique id for the new mindmap node")
    parent_node_id: Optional[str] = Field(
        default=None,
        description="Existing node id inside the grade 12 map that this node should attach to"
    )
    label: str = Field(description="Node title to display")
    type: Literal["topic", "subtopic", "concept"] = "concept"
    weakness_summary: Optional[str] = Field(
        default=None,
        description="Short description of the misconception or gap"
    )
    action_steps: Optional[List[str]] = Field(
        default=None,
        description="Concrete learning actions for the student"
    )


class GeogebraInstruction(BaseModel):
    should_draw: bool = False
    reason: Optional[str] = None
    prompt: Optional[str] = None
    commands: Optional[List[str]] = None


class ChatInputSchema(BaseModel):
    message: str
    history: List[ConversationTurn] = Field(default_factory=list)
    media: Optional[List[MediaPart]] = None


class ChatOutputSchema(BaseModel):
    reply: str
    mindmap_insights: List[MindmapInsight] = Field(default_factory=list)
    geogebra: GeogebraInstruction = Field(default_factory=GeogebraInstruction)