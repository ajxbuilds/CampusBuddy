from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class StudyBuddyProfileBase(BaseModel):
    skills: Optional[str] = None
    interests: Optional[str] = None
    help_areas: Optional[str] = None
    goals: Optional[str] = None
    is_active: bool = True

class StudyBuddyProfileCreate(StudyBuddyProfileBase):
    pass

class StudyBuddyProfileUpdate(StudyBuddyProfileBase):
    pass

class StudyBuddyProfileResponse(StudyBuddyProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class StudyBuddyRequestCreate(BaseModel):
    receiver_id: int
    message: Optional[str] = None

class StudyBuddyRequestResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    message: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class StudyBuddyConnectionResponse(BaseModel):
    id: int
    user1_id: int
    user2_id: int
    connected_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
