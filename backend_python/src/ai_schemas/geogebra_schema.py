# src/ai_schemas/geogebra_schema.py
from pydantic import BaseModel, Field
from typing import List

class GeogebraInputSchema(BaseModel):
    request: str = Field(description='The user request in natural language describing the geometric construction.')

class GeogebraOutputSchema(BaseModel):
    commands: List[str] = Field(description='An array of GeoGebra commands to be executed in order.')