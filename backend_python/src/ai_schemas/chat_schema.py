# src/ai_schemas/chat_schema.py
from typing import List, Literal, Optional
from pydantic import BaseModel, Field

class MediaPart(BaseModel):
    url: str = Field(description="A data URI of the media.")

class ConversationTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class MindmapInsight(BaseModel):
    node_id: str = Field(description="Unique id for the new mindmap node (slugify label)")
    parent_node_id: Optional[str] = Field(
        default=None,
        description="Existing node id to attach to"
    )
    label: str = Field(description="Name of the concept/topic")
    type: Literal["topic", "subtopic", "concept"] = "concept"
    weakness_summary: Optional[str] = Field(
        default=None,
        description="Why the student needs this (gap analysis)"
    )
    action_steps: Optional[List[str]] = Field(
        default=None,
        description="Suggested actions"
    )

class GeogebraInstruction(BaseModel):
    should_draw: bool = False
    reason: Optional[str] = None
    commands: Optional[List[str]] = Field(
        default=None, 
        description="List of Geogebra commands to execute e.g. ['A=(1,2)', 'Circle(A, 5)']"
    )

class ChatInputSchema(BaseModel):
    message: str
    history: List[ConversationTurn] = Field(default_factory=list)
    media: Optional[List[MediaPart]] = None

class ChatOutputSchema(BaseModel):
    reply: str = Field(description="The conversational response to the student")
    mindmap_insights: List[MindmapInsight] = Field(default_factory=list)
    geogebra: GeogebraInstruction = Field(default_factory=GeogebraInstruction)