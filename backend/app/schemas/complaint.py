from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.complaint import ComplaintStatus, ComplaintPriority, EscalationStatus
from app.schemas.user import UserBasicResponse

class ComplaintCategoryBase(BaseModel):
    name: str
    code: str
    department: str
    sla_hours: int = 48
    description: Optional[str] = None

class ComplaintCategoryResponse(ComplaintCategoryBase):
    id: int

    class Config:
        from_attributes = True

class ComplaintBase(BaseModel):
    title: str
    description: str
    category_id: int
    priority: ComplaintPriority = ComplaintPriority.MEDIUM
    attachment_url: Optional[str] = None

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None
    assigned_to: Optional[int] = None
    priority: Optional[ComplaintPriority] = None
    remarks: Optional[str] = None

class ComplaintStatusHistoryResponse(BaseModel):
    id: int
    from_status: Optional[str]
    to_status: str
    remarks: Optional[str]
    created_at: datetime
    actor: Optional[UserBasicResponse] = None

    class Config:
        from_attributes = True

class ComplaintEscalationCreate(BaseModel):
    reason: str
    level: str = "LEVEL_1"

class ComplaintEscalationReview(BaseModel):
    status: EscalationStatus
    admin_notes: Optional[str] = None
    assigned_to: Optional[int] = None
    priority: Optional[ComplaintPriority] = None

class ComplaintEscalationResponse(BaseModel):
    id: int
    complaint_id: int
    level: str
    reason: str
    sla_breached: bool
    status: EscalationStatus
    admin_notes: Optional[str]
    created_at: datetime
    reviewed_at: Optional[datetime]
    requester: Optional[UserBasicResponse] = None

    class Config:
        from_attributes = True

class ComplaintResponse(BaseModel):
    id: int
    complaint_code: str
    student_id: int
    category_id: int
    title: str
    description: str
    priority: ComplaintPriority
    status: ComplaintStatus
    assigned_to: Optional[int]
    attachment_url: Optional[str]
    is_escalated: bool
    sla_deadline: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    category: Optional[ComplaintCategoryResponse] = None
    student: Optional[UserBasicResponse] = None
    assignee: Optional[UserBasicResponse] = None

    class Config:
        from_attributes = True

class ComplaintDetailResponse(ComplaintResponse):
    history: List[ComplaintStatusHistoryResponse] = []
    escalations: List[ComplaintEscalationResponse] = []
