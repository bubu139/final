# backend/src/models.py
from pydantic import BaseModel

class NodeProgress(BaseModel):
    user_id: str
    node_id: str
    opened: bool
    score: float | None = None
