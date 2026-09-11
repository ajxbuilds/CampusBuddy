from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class FeePaymentResponse(BaseModel):
    id: int
    fee_item_id: int
    student_id: int
    transaction_id: str
    amount_paid: float
    payment_method: str
    status: str
    paid_at: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class FeeReceiptResponse(BaseModel):
    id: int
    receipt_number: str
    payment_id: int
    fee_item_id: int
    student_id: int
    fee_title: Optional[str] = None
    pdf_url: Optional[str] = None
    generated_at: datetime
    academic_year: str
    semester: int
    total_amount: float

    class Config:
        from_attributes = True

class FeeItemResponse(BaseModel):
    id: int
    student_id: int
    title: str
    amount: float
    due_date: datetime
    status: str
    academic_year: str
    semester: int
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    receipt: Optional[FeeReceiptResponse] = None

    class Config:
        from_attributes = True

class FeeSummaryResponse(BaseModel):
    total_fees: float
    paid_fees: float
    pending_fees: float
    items: List[FeeItemResponse]

class FeePaymentRequest(BaseModel):
    fee_item_id: int
    amount: float
    payment_method: str = "DEMO_UPI" # "DEMO_UPI", "DEMO_CARD", "DEMO_NETBANKING"

class DocumentRecordResponse(BaseModel):
    id: int
    student_id: int
    title: str
    category: str
    file_url: str
    file_size_kb: int
    upload_date: datetime
    status: str
    original_filename: Optional[str] = None
    mime_type: Optional[str] = None

    class Config:
        from_attributes = True

class DocumentUploadRequest(BaseModel):
    title: str
    category: str # "FEE_RECEIPT", "ID_CARD", "BONAFIDE", "MARK_SHEET", "CERTIFICATE", "SCHOLARSHIP", "OTHER"
    file_url: Optional[str] = None
    file_size_kb: Optional[int] = 250
    original_filename: Optional[str] = None
    mime_type: Optional[str] = None

class CollegeNoticeResponse(BaseModel):
    id: int
    title: str
    category: str
    content: str
    is_important: bool
    published_by: Optional[int] = None
    publisher_name: Optional[str] = None
    published_at: datetime
    attachment_url: Optional[str] = None
    target_audience: str

    class Config:
        from_attributes = True

class CollegeNoticeCreate(BaseModel):
    title: str
    category: str = "ACADEMIC"
    content: str
    is_important: bool = False
    target_audience: str = "ALL"
    attachment_url: Optional[str] = None

class ELearningResourceResponse(BaseModel):
    id: int
    title: str
    resource_type: str
    subject_id: int
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    uploaded_by: Optional[int] = None
    uploader_name: Optional[str] = None
    file_url: str
    original_filename: Optional[str] = None
    file_size_kb: int
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ELearningResourceCreate(BaseModel):
    title: str
    resource_type: str = "NOTE" # "ASSIGNMENT", "NOTE", "PRACTICAL_MANUAL", "E_CONTENT"
    subject_id: int
    description: Optional[str] = None
    file_url: Optional[str] = None
    original_filename: Optional[str] = None
    file_size_kb: Optional[int] = 512

