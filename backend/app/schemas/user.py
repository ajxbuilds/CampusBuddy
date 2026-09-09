from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class StudentProfileBase(BaseModel):
    roll_number: str
    semester: int = 1
    program: str = "B.Tech Computer Science"

class StudentProfileCreate(StudentProfileBase):
    pass

class StudentProfileResponse(StudentProfileBase):
    id: int
    total_points: int

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.STUDENT
    department: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str
    roll_number: Optional[str] = None
    semester: Optional[int] = 1
    program: Optional[str] = "B.Tech Computer Science"
    linked_student_id: Optional[int] = None # For parents

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserBasicResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserResponse(UserBasicResponse):
    student_profile: Optional[StudentProfileResponse] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenPayload(BaseModel):
    sub: Optional[str] = None
