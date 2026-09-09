from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class ComplaintStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    AWAITING_INFORMATION = "AWAITING_INFORMATION"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"
    ESCALATED = "ESCALATED"
    CLOSED = "CLOSED"

class ComplaintPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class EscalationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class ComplaintCategory(Base):
    __tablename__ = "complaint_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False) # e.g. "Academics", "Hostel", "Fees"
    code = Column(String, unique=True, nullable=False) # e.g. "ACADEMIC", "HOSTEL", "FEES"
    department = Column(String, nullable=False) # e.g. "Academic Affairs", "Estate Management"
    sla_hours = Column(Integer, default=48) # SLA turnaround time in hours
    description = Column(String, nullable=True)

    complaints = relationship("Complaint", back_populates="category")

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_code = Column(String, unique=True, index=True, nullable=False) # e.g. CB-2026-001245
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("complaint_categories.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(Enum(ComplaintPriority), default=ComplaintPriority.MEDIUM, nullable=False)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.SUBMITTED, nullable=False, index=True)
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    attachment_url = Column(String, nullable=True)
    is_escalated = Column(Boolean, default=False)
    sla_deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    student = relationship("User", foreign_keys="Complaint.student_id", back_populates="complaints_created")
    assignee = relationship("User", foreign_keys="Complaint.assigned_to", back_populates="complaints_assigned")
    category = relationship("ComplaintCategory", back_populates="complaints")
    history = relationship("ComplaintStatusHistory", back_populates="complaint", cascade="all, delete-orphan", order_by="ComplaintStatusHistory.created_at.desc()")
    escalations = relationship("ComplaintEscalation", back_populates="complaint", cascade="all, delete-orphan")

class ComplaintStatusHistory(Base):
    __tablename__ = "complaint_status_history"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    changed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    from_status = Column(String, nullable=True)
    to_status = Column(String, nullable=False)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    complaint = relationship("Complaint", back_populates="history")
    actor = relationship("User")

class ComplaintEscalation(Base):
    __tablename__ = "complaint_escalations"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    level = Column(String, default="LEVEL_1") # LEVEL_1, LEVEL_2
    reason = Column(Text, nullable=False)
    sla_breached = Column(Boolean, default=False)
    status = Column(Enum(EscalationStatus), default=EscalationStatus.PENDING, nullable=False)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    reviewed_at = Column(DateTime, nullable=True)

    complaint = relationship("Complaint", back_populates="escalations")
    requester = relationship("User", foreign_keys="ComplaintEscalation.requested_by")
