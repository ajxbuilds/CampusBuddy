from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class VoteTargetType(str, enum.Enum):
    POST = "POST"
    ANSWER = "ANSWER"
    REPLY = "REPLY"

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
    downvotes_count = Column(Integer, default=0, index=True)
    answers_count = Column(Integer, default=0)
    has_accepted_answer = Column(Boolean, default=False)
    is_hidden = Column(Boolean, default=False) # for moderation
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    author = relationship("User", back_populates="community_posts")
    answers = relationship("CommunityAnswer", back_populates="post", cascade="all, delete-orphan", order_by="CommunityAnswer.is_accepted.desc(), CommunityAnswer.upvotes_count.desc()")
    attachments = relationship("CommunityAttachment", back_populates="post", cascade="all, delete-orphan")
    resources = relationship("CommunityResource", back_populates="post", cascade="all, delete-orphan")

class CommunityAnswer(Base):
    __tablename__ = "community_answers"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    upvotes_count = Column(Integer, default=0, index=True)
    downvotes_count = Column(Integer, default=0, index=True)
    is_accepted = Column(Boolean, default=False)
    is_faculty_endorsed = Column(Boolean, default=False)
    is_hidden = Column(Boolean, default=False) # for moderation
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    post = relationship("CommunityPost", back_populates="answers")
    author = relationship("User", back_populates="community_answers")
    replies = relationship("CommunityReply", back_populates="answer", cascade="all, delete-orphan")

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

class CommunityAttachment(Base):
    __tablename__ = "community_attachments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    post = relationship("CommunityPost", back_populates="attachments")
    uploader = relationship("User")

class CommunityReply(Base):
    __tablename__ = "community_replies"

    id = Column(Integer, primary_key=True, index=True)
    answer_id = Column(Integer, ForeignKey("community_answers.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_reply_id = Column(Integer, ForeignKey("community_replies.id", ondelete="CASCADE"), nullable=True, index=True)
    content = Column(Text, nullable=False)
    upvotes_count = Column(Integer, default=0, index=True)
    downvotes_count = Column(Integer, default=0, index=True)
    is_hidden = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    answer = relationship("CommunityAnswer", back_populates="replies")
    author = relationship("User")
    parent_reply = relationship("CommunityReply", remote_side=[id], backref="child_replies")

class CommunityResource(Base):
    __tablename__ = "community_resources"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    url = Column(String, nullable=False)
    title = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    post = relationship("CommunityPost", back_populates="resources")
    creator = relationship("User")
