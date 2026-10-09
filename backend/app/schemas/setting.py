from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AppSettingBase(BaseModel):
    key: str
    value: str
    value_type: str
    category: str
    description: Optional[str] = None

class AppSettingUpdate(BaseModel):
    value: str

class AppSettingResponse(AppSettingBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True

class BulkSettingUpdate(BaseModel):
    key: str
    value: str
