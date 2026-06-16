from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import datetime

# Auth Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: Optional[str]
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Document Schemas
class DocumentResponse(BaseModel):
    id: int
    filename: str
    upload_status: str
    upload_date: datetime

    class Config:
        from_attributes = True

# Chat Schemas
class ChatQuery(BaseModel):
    document_id: Optional[int] = None
    question: str

class ChatHistoryResponse(BaseModel):
    id: int
    document_id: Optional[int]
    question: str
    answer: str
    timestamp: datetime

    class Config:
        from_attributes = True

# Summary Schemas
class SummaryResponse(BaseModel):
    id: int
    document_id: int
    summary: str
    created_at: datetime

    class Config:
        from_attributes = True

# Quiz Schemas
class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    answer: str
    explanation: Optional[str] = None

class QuizCreate(BaseModel):
    document_id: int
    title: str
    num_questions: Optional[int] = 5

class QuizResponse(BaseModel):
    id: int
    document_id: Optional[int]
    title: str
    quiz_data: List[QuizQuestion]
    score: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class QuizSubmit(BaseModel):
    score: int

# Activity Log Schema
class ActivityLog(BaseModel):
    id: int
    type: str  # "upload", "chat", "quiz", "summary"
    description: str
    timestamp: datetime

# Dashboard Stats Schema
class DashboardStats(BaseModel):
    total_pdfs: int
    total_questions: int
    total_quizzes: int
    recent_activities: List[ActivityLog]
