from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class NotificationType(str, enum.Enum):
    COMPLAINT = "COMPLAINT"
    COMMUNITY = "COMMUNITY"
    BADGE = "BADGE"
    SYSTEM = "SYSTEM"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(Enum(NotificationType), default=NotificationType.SYSTEM, nullable=False)
    link = Column(String(255), nullable=True) # e.g. /complaints/CB-2026-001245 or /community/12
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", back_populates="notifications")
