from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel
from app.schemas.user import UserResponse, UserBasicResponse

class AdminStatsResponse(BaseModel):
    total_complaints: int
    pending_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    escalated_complaints: int
    total_community_posts: int
    total_users: int
    active_students: int
    resolution_rate_percent: float
    avg_resolution_time_hours: float

class CategoryDistribution(BaseModel):
    category: str
    count: int
    resolved_count: int

class ComplaintsTrendPoint(BaseModel):
    date: str
    count: int
    resolved: int

class AuditLogResponse(BaseModel):
    id: int
    actor_id: Optional[int]
    action: str
    resource_type: str
    resource_id: Optional[str]
    details: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    actor: Optional[UserBasicResponse] = None

    class Config:
        from_attributes = True

class UserRoleUpdate(BaseModel):
    role: str
    department: Optional[str] = None
    is_active: Optional[bool] = None
