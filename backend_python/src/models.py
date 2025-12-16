# backend/src/models.py
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class NodeProgress(BaseModel):
    user_id: str
    node_id: str
    opened: bool
    score: float | None = None
class StudyStatus(BaseModel):
    level: Literal['unknown', 'good', 'warning', 'critical'] = 'unknown'
    label: str
    message: str
    recommendations: List[str] = []
    completionRatePct: Optional[float] = None

class StudentProfileUpdate(BaseModel):
    # Frontend gửi targetScore, goalText (camelCase)
    target_score: Optional[int] = Field(None, alias="targetScore")
    goal_text: Optional[str] = Field(None, alias="goalText")

    class Config:
        populate_by_name = True

class StudentProfileResponse(BaseModel):
    user_id: str
    target_score: Optional[int] = Field(None, alias="targetScore")
    goal_text: Optional[str] = Field(None, alias="goalText")
    study_status: Optional[StudyStatus] = Field(None, alias="studyStatus")
    
    class Config:
        populate_by_name = True
