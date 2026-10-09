from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime

class HealthComponent(BaseModel):
    status: str
    message: str
    latency_ms: Optional[int] = None
    checked_at: str

class SystemHealthResponse(BaseModel):
    overall_status: str
    last_checked: str
    components: Dict[str, HealthComponent]
