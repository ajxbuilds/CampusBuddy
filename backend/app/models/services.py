from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class FeeItem(Base):
    __tablename__ = "fee_items"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False) # e.g. "Tuition Fee - Semester 4", "Hostel & Mess Fee"
    amount = Column(Float, nullable=False)
    due_date = Column(DateTime, nullable=False)
    status = Column(String, default="PENDING") # "PENDING", "PARTIALLY_PAID", "PAID", "OVERDUE"
    academic_year = Column(String, default="2025-2026")
    semester = Column(Integer, default=4)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("User", foreign_keys=[student_id])
    payments = relationship("FeePayment", back_populates="fee_item", cascade="all, delete-orphan")

class FeePayment(Base):
    __tablename__ = "fee_payments"

    id = Column(Integer, primary_key=True, index=True)
    fee_item_id = Column(Integer, ForeignKey("fee_items.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_id = Column(String, unique=True, index=True, nullable=False) # e.g. "TXN-2026-89421"
    amount_paid = Column(Float, nullable=False)
    payment_method = Column(String, default="DEMO_UPI") # "DEMO_UPI", "DEMO_CARD", "DEMO_NETBANKING"
    status = Column(String, default="SUCCESS")
    paid_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    notes = Column(String, nullable=True)

    fee_item = relationship("FeeItem", back_populates="payments")
    student = relationship("User", foreign_keys=[student_id])
    receipt = relationship("FeeReceipt", back_populates="payment", uselist=False)

class FeeReceipt(Base):
    __tablename__ = "fee_receipts"

    id = Column(Integer, primary_key=True, index=True)
    receipt_number = Column(String, unique=True, index=True, nullable=False) # e.g. "REC-2026-4401"
    payment_id = Column(Integer, ForeignKey("fee_payments.id", ondelete="CASCADE"), nullable=False, index=True)
    fee_item_id = Column(Integer, ForeignKey("fee_items.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    pdf_url = Column(String, nullable=True)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    academic_year = Column(String, default="2025-2026")
    semester = Column(Integer, default=4)
    total_amount = Column(Float, nullable=False)

    payment = relationship("FeePayment", back_populates="receipt")
    student = relationship("User", foreign_keys=[student_id])

class DocumentRecord(Base):
    __tablename__ = "document_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False) # e.g. "Semester 3 Official Grade Card", "Bonafide Certificate 2026"
    category = Column(String, nullable=False) # "FEE_RECEIPT", "ID_CARD", "BONAFIDE", "MARK_SHEET", "CERTIFICATE", "SCHOLARSHIP", "OTHER"
    file_url = Column(String, nullable=False)
    original_filename = Column(String, nullable=True)
    mime_type = Column(String, nullable=True)
    storage_path = Column(String, nullable=True)
    file_size_kb = Column(Integer, default=245)
    upload_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String, default="VERIFIED") # "VERIFIED", "PENDING", "REJECTED"

    student = relationship("User", foreign_keys=[student_id])

class CollegeNotice(Base):
    __tablename__ = "college_notices"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, default="ACADEMIC") # "ACADEMIC", "EXAM", "FEES", "DEPARTMENT", "SCHOLARSHIP", "IMPORTANT"
    content = Column(Text, nullable=False)
    is_important = Column(Boolean, default=False)
    published_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    published_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    attachment_url = Column(String, nullable=True)
    target_audience = Column(String, default="ALL") # "ALL", "STUDENT", "TEACHER", "PARENT"

    publisher = relationship("User", foreign_keys=[published_by])

class ELearningResource(Base):
    __tablename__ = "elearning_resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    resource_type = Column(String, default="NOTE") # "ASSIGNMENT", "NOTE", "PRACTICAL_MANUAL", "E_CONTENT"
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    file_url = Column(String, nullable=False)
    original_filename = Column(String, nullable=True)
    file_size_kb = Column(Integer, default=512)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    subject = relationship("Subject", foreign_keys=[subject_id])
    uploader = relationship("User", foreign_keys=[uploaded_by])

