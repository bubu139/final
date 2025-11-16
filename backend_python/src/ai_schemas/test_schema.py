# src/ai_schemas/test_schema.py
from pydantic import BaseModel, Field, conlist
from typing import Literal, Union, List

class MultipleChoiceQuestionSchema(BaseModel):
    id: str
    type: Literal['multiple-choice']
    prompt: str = Field(description='The question prompt, can include LaTeX.')
    options: conlist(str, min_length=4, max_length=4) = Field(description='An array of 4 possible answers.')
    answer: int = Field(ge=0, le=3, description='The index of the correct option (0-3).')

class TrueFalseQuestionSchema(BaseModel):
    id: str
    type: Literal['true-false']
    prompt: str = Field(description='The main prompt for the set of statements.')
    statements: conlist(str, min_length=4, max_length=4) = Field(description='An array of 4 statements to be evaluated.')
    answer: conlist(bool, min_length=4, max_length=4) = Field(description='An array of 4 booleans representing the correct answer for each statement.')

class ShortAnswerQuestionSchema(BaseModel):
    id: str
    type: Literal['short-answer']
    prompt: str = Field(description='The question prompt, can include LaTeX.')
    answer: str = Field(max_length=6, description='The correct numeric answer, as a string, max 6 characters.')

# Union để mô phỏng z.union
QuestionSchema = Union[MultipleChoiceQuestionSchema, TrueFalseQuestionSchema, ShortAnswerQuestionSchema]

class TestSchema(BaseModel):
    title: str
    parts: 'TestPartsSchema'

class TestPartsSchema(BaseModel):
    multipleChoice: 'MultipleChoicePartSchema'
    trueFalse: 'TrueFalsePartSchema'
    shortAnswer: 'ShortAnswerPartSchema'

class MultipleChoicePartSchema(BaseModel):
    title: str
    questions: List[MultipleChoiceQuestionSchema]

class TrueFalsePartSchema(BaseModel):
    title: str
    questions: List[TrueFalseQuestionSchema]

class ShortAnswerPartSchema(BaseModel):
    title: str
    questions: List[ShortAnswerQuestionSchema]

# Cập nhật các forward references
TestSchema.model_rebuild()
TestPartsSchema.model_rebuild()