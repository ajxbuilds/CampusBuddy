from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class VoteTargetType(str, enum.Enum):
    POST = "POST"
    ANSWER = "ANSWER"

class ReportStatus(str, enum.Enum):
    PENDING = "PENDING"
    REVIEWED = "REVIEWED"
    DISMISSED = "DISMISSED"

class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(250), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, index=True) # Academics, Exams, Administration, Fees, Hostel, etc.
    views = Column(Integer, default=0)
    upvotes_count = Column(Integer, default=0, index=True)
    answers_count = Column(Integer, default=0)
    has_accepted_answer = Column(Boolean, default=False)
    is_hidden = Column(Boolean, default=False) # for moderation
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    author = relationship("User", back_populates="community_posts")
    answers = relationship("CommunityAnswer", back_populates="post", cascade="all, delete-orphan", order_by="CommunityAnswer.is_accepted.desc(), CommunityAnswer.upvotes_count.desc()")

class CommunityAnswer(Base):
    __tablename__ = "community_answers"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    upvotes_count = Column(Integer, default=0, index=True)
    is_accepted = Column(Boolean, default=False)
    is_faculty_endorsed = Column(Boolean, default=False)
    is_hidden = Column(Boolean, default=False) # for moderation
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    post = relationship("CommunityPost", back_populates="answers")
    author = relationship("User", back_populates="community_answers")

class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    target_type = Column(Enum(VoteTargetType), nullable=False) # POST or ANSWER
    target_id = Column(Integer, nullable=False, index=True)
    vote_type = Column(String(10), default="UPVOTE")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("user_id", "target_type", "target_id", name="uq_user_target_vote"),
    )

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_type = Column(Enum(VoteTargetType), nullable=False) # POST or ANSWER
    target_id = Column(Integer, nullable=False, index=True)
    reason = Column(Text, nullable=False)
    status = Column(Enum(ReportStatus), default=ReportStatus.PENDING, nullable=False)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    reporter = relationship("User")
