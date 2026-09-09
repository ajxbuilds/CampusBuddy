from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.community import VoteTargetType, ReportStatus
from app.schemas.user import UserBasicResponse

class AnswerBase(BaseModel):
    content: str

class AnswerCreate(AnswerBase):
    pass

class AnswerResponse(AnswerBase):
    id: int
    post_id: int
    author_id: int
    upvotes_count: int
    is_accepted: bool
    is_faculty_endorsed: bool
    is_hidden: bool
    created_at: datetime
    updated_at: datetime
    author: Optional[UserBasicResponse] = None
    has_voted: bool = False

    class Config:
        from_attributes = True

class PostBase(BaseModel):
    title: str
    content: str
    category: str

class PostCreate(PostBase):
    pass

class PostResponse(PostBase):
    id: int
    author_id: int
    views: int
    upvotes_count: int
    answers_count: int
    has_accepted_answer: bool
    is_hidden: bool
    created_at: datetime
    updated_at: datetime
    author: Optional[UserBasicResponse] = None
    has_voted: bool = False

    class Config:
        from_attributes = True

class PostDetailResponse(PostResponse):
    answers: List[AnswerResponse] = []

class VoteCreate(BaseModel):
    target_type: VoteTargetType
    target_id: int

class ReportCreate(BaseModel):
    target_type: VoteTargetType
    target_id: int
    reason: str

class ReportResponse(BaseModel):
    id: int
    reporter_id: int
    target_type: VoteTargetType
    target_id: int
    reason: str
    status: ReportStatus
    admin_notes: Optional[str] = None
    created_at: datetime
    reporter: Optional[UserBasicResponse] = None

    class Config:
        from_attributes = True
