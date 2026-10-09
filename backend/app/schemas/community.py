from datetime import datetime
from typing import Literal, Optional, List
from pydantic import BaseModel
from app.models.community import VoteTargetType, ReportStatus
from app.schemas.user import UserBasicResponse



class CommunityResourceCreate(BaseModel):
    url: str
    title: Optional[str] = None

class CommunityResourceResponse(BaseModel):
    id: int
    post_id: int
    url: str
    title: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class CommunityAttachmentResponse(BaseModel):
    id: int
    post_id: int
    original_filename: str
    mime_type: str
    file_size: int
    created_at: datetime

    class Config:
        from_attributes = True

class ReplyBase(BaseModel):
    content: str

class ReplyCreate(ReplyBase):
    parent_reply_id: Optional[int] = None

class ReplyResponse(ReplyBase):
    id: int
    answer_id: int
    author_id: int
    parent_reply_id: Optional[int]
    upvotes_count: int
    downvotes_count: int
    is_hidden: bool
    created_at: datetime
    updated_at: datetime
    author: Optional[UserBasicResponse] = None
    points_awarded: Optional[int] = None
    user_vote: Optional[str] = None
    replies: List['ReplyResponse'] = []

    class Config:
        from_attributes = True

class AnswerBase(BaseModel):
    content: str

class AnswerCreate(AnswerBase):
    pass

class AnswerResponse(AnswerBase):
    replies: List[ReplyResponse] = []
    points_awarded: Optional[int] = None
    id: int
    post_id: int
    author_id: int
    upvotes_count: int
    downvotes_count: int = 0
    is_accepted: bool
    is_faculty_endorsed: bool
    is_hidden: bool
    created_at: datetime
    updated_at: datetime
    author: Optional[UserBasicResponse] = None
    points_awarded: Optional[int] = None
    user_vote: Optional[str] = None

    class Config:
        from_attributes = True


class PostBase(BaseModel):
    title: str
    content: str
    category: str

class PostCreate(PostBase):
    resources: List[CommunityResourceCreate] = []

class PostResponse(PostBase):
    id: int
    author_id: int
    views: int
    upvotes_count: int
    downvotes_count: int = 0
    answers_count: int
    has_accepted_answer: bool
    is_hidden: bool
    created_at: datetime
    updated_at: datetime
    author: Optional[UserBasicResponse] = None
    points_awarded: Optional[int] = None
    user_vote: Optional[str] = None

    class Config:
        from_attributes = True

class PostDetailResponse(PostResponse):
    answers: List[AnswerResponse] = []
    attachments: List[CommunityAttachmentResponse] = []
    resources: List[CommunityResourceResponse] = []

class VoteCreate(BaseModel):
    target_type: VoteTargetType
    target_id: int
    vote_type: Literal["UPVOTE", "DOWNVOTE"] = "UPVOTE"

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
