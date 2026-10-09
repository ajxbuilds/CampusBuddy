from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.user import UserResponse

class BadgeResponse(BaseModel):
    id: int
    name: str
    description: str
    icon: str
    points_threshold: int

    class Config:
        from_attributes = True

class UserBadgeResponse(BaseModel):
    id: int
    user_id: int
    badge_id: int
    awarded_at: datetime
    badge: Optional[BadgeResponse] = None

    class Config:
        from_attributes = True

class PointTransactionResponse(BaseModel):
    id: int
    user_id: int
    points: int
    event_type: str
    reason: str
    metadata_payload: Optional[str] = None
    reference_type: Optional[str]
    reference_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class LeaderboardUser(BaseModel):
    user_id: int
    full_name: str
    department: Optional[str] = None
    role: str
    avatar_url: Optional[str] = None
    points: int
    rank: int
    level: int = 1
    level_name: str = "New Member"
    badges: List[BadgeResponse] = []

class LeaderboardResponse(BaseModel):
    period: str # weekly, monthly, all-time
    leaders: List[LeaderboardUser] = []
    current_user_entry: Optional[LeaderboardUser] = None

class GamificationSummaryResponse(BaseModel):
    points: int
    level: int
    level_name: str
    current_threshold: int
    next_threshold: Optional[int]
    points_remaining: int
    progress_percentage: float
