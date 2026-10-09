from pydantic import BaseModel
from typing import Optional

class UserSettingsBase(BaseModel):
    notify_complaints: bool = True
    notify_community: bool = True
    notify_study_buddy: bool = True
    notify_announcements: bool = True
    profile_visibility: bool = True
    leaderboard_visible: bool = True
    theme: str = "system"
    reduced_motion: bool = False

class UserSettingsUpdate(BaseModel):
    notify_complaints: Optional[bool] = None
    notify_community: Optional[bool] = None
    notify_study_buddy: Optional[bool] = None
    notify_announcements: Optional[bool] = None
    profile_visibility: Optional[bool] = None
    leaderboard_visible: Optional[bool] = None
    theme: Optional[str] = None
    reduced_motion: Optional[bool] = None

class UserSettingsResponse(UserSettingsBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
