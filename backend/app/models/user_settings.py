from sqlalchemy import Column, Integer, Boolean, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Notifications
    notify_complaints = Column(Boolean, default=True)
    notify_community = Column(Boolean, default=True)
    notify_study_buddy = Column(Boolean, default=True)
    notify_announcements = Column(Boolean, default=True)

    # Privacy
    profile_visibility = Column(Boolean, default=True)
    leaderboard_visible = Column(Boolean, default=True)

    # Appearance & Accessibility
    theme = Column(String, default="system") # 'light', 'dark', 'system'
    reduced_motion = Column(Boolean, default=False)

    user = relationship("User", backref="settings")
