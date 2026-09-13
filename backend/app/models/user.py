from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    TEACHER = "TEACHER"
    PARENT = "PARENT"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True) # Nullable for OAuth-only users
    auth_provider = Column(String, default="local", nullable=False) # "local", "google"
    provider_user_id = Column(String, nullable=True, index=True) # Google 'sub' id
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.STUDENT)
    department = Column(String, nullable=True) # e.g. "Computer Engineering", "Administration"
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    complaints_created = relationship("Complaint", back_populates="student", foreign_keys="Complaint.student_id")
    complaints_assigned = relationship("Complaint", back_populates="assignee", foreign_keys="Complaint.assigned_to")
    community_posts = relationship("CommunityPost", back_populates="author")
    community_answers = relationship("CommunityAnswer", back_populates="author")
    badges = relationship("UserBadge", back_populates="user")
    points_transactions = relationship("PointTransaction", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    roll_number = Column(String, unique=True, index=True, nullable=False)
    semester = Column(Integer, default=1)
    program = Column(String, default="B.Tech Computer Science")
    total_points = Column(Integer, default=0, index=True)

    user = relationship("User", back_populates="student_profile")

class ParentLink(Base):
    __tablename__ = "parent_links"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    relation_type = Column(String, default="Parent") # Father, Mother, Guardian
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    parent = relationship("User", foreign_keys="ParentLink.parent_id")
    student = relationship("User", foreign_keys="ParentLink.student_id")

class ParentLinkCode(Base):
    __tablename__ = "parent_link_codes"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String, unique=True, index=True, nullable=False) # e.g. CB-P7K4-X9M2
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    used_by_parent_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    student = relationship("User", foreign_keys="ParentLinkCode.student_id")
