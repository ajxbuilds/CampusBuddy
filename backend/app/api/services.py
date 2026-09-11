import os
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from fastapi.responses import FileResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, UserRole, ParentLink
from app.models.services import FeeItem, FeePayment, FeeReceipt, DocumentRecord, CollegeNotice, ELearningResource
from app.models.academic import Subject
from app.models.notification import Notification, NotificationType
from app.schemas.services import (
    FeeItemResponse,
    FeeSummaryResponse,
    FeeReceiptResponse,
    FeePaymentResponse,
    FeePaymentRequest,
    DocumentRecordResponse,
    DocumentUploadRequest,
    CollegeNoticeResponse,
    CollegeNoticeCreate,
    ELearningResourceResponse,
    ELearningResourceCreate,
)

router = APIRouter(prefix="/services", tags=["Student Services"])

async def resolve_student_id(current_user: User, db: AsyncSession, requested_id: Optional[int] = None) -> int:
    if current_user.role == UserRole.STUDENT:
        return current_user.id
    elif current_user.role == UserRole.PARENT:
        link_res = await db.execute(select(ParentLink).where(ParentLink.parent_id == current_user.id))
        link = link_res.scalars().first()
        if not link:
            raise HTTPException(status_code=404, detail="No linked student profile found for this parent account.")
        return link.student_id
    else:
        # Teacher or Admin
        if requested_id:
            return requested_id
        s_res = await db.execute(select(User).where(User.role == UserRole.STUDENT).limit(1))
        first_student = s_res.scalars().first()
        if not first_student:
            raise HTTPException(status_code=404, detail="No student record found in database.")
        return first_student.id

# ==================== FEES & RECEIPTS ====================

@router.get("/fees", response_model=FeeSummaryResponse)
async def get_student_fees(
    student_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_student_id = await resolve_student_id(current_user, db, student_id)

    query = select(FeeItem).where(FeeItem.student_id == target_student_id).order_by(FeeItem.due_date)
    result = await db.execute(query)
    fee_items = result.scalars().all()

    # Get receipts for student
    rec_res = await db.execute(select(FeeReceipt).where(FeeReceipt.student_id == target_student_id))
    receipts = rec_res.scalars().all()
    receipt_by_fee = {r.fee_item_id: r for r in receipts}

    items_resp = []
    total_amount = 0.0
    paid_amount = 0.0
    pending_amount = 0.0

    for item in fee_items:
        total_amount += item.amount
        rec_obj = receipt_by_fee.get(item.id)
        rec_schema = None
        if rec_obj:
            rec_schema = FeeReceiptResponse(
                id=rec_obj.id,
                receipt_number=rec_obj.receipt_number,
                payment_id=rec_obj.payment_id,
                fee_item_id=rec_obj.fee_item_id,
                student_id=rec_obj.student_id,
                fee_title=item.title,
                pdf_url=rec_obj.pdf_url,
                generated_at=rec_obj.generated_at,
                academic_year=rec_obj.academic_year,
                semester=rec_obj.semester,
                total_amount=rec_obj.total_amount
            )

        if item.status == "PAID":
            paid_amount += item.amount
        else:
            pending_amount += item.amount

        items_resp.append(
            FeeItemResponse(
                id=item.id,
                student_id=item.student_id,
                title=item.title,
                amount=item.amount,
                due_date=item.due_date,
                status=item.status,
                academic_year=item.academic_year,
                semester=item.semester,
                description=item.description,
                created_at=item.created_at,
                receipt=rec_schema
            )
        )

    return FeeSummaryResponse(
        total_fees=total_amount,
        paid_fees=paid_amount,
        pending_fees=pending_amount,
        items=items_resp
    )

@router.get("/fees/receipts", response_model=List[FeeReceiptResponse])
async def get_fee_receipts(
    student_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_student_id = await resolve_student_id(current_user, db, student_id)

    query = select(FeeReceipt).where(FeeReceipt.student_id == target_student_id).order_by(desc(FeeReceipt.generated_at))
    result = await db.execute(query)
    receipts = result.scalars().all()

    # Load titles
    fee_ids = [r.fee_item_id for r in receipts]
    f_res = await db.execute(select(FeeItem).where(FeeItem.id.in_(fee_ids)))
    fee_map = {f.id: f.title for f in f_res.scalars().all()}

    resp = []
    for r in receipts:
        resp.append(
            FeeReceiptResponse(
                id=r.id,
                receipt_number=r.receipt_number,
                payment_id=r.payment_id,
                fee_item_id=r.fee_item_id,
                student_id=r.student_id,
                fee_title=fee_map.get(r.fee_item_id, "College Fee"),
                pdf_url=r.pdf_url,
                generated_at=r.generated_at,
                academic_year=r.academic_year,
                semester=r.semester,
                total_amount=r.total_amount
            )
        )
    return resp

@router.post("/fees/payment", response_model=FeeReceiptResponse)
async def process_fee_payment(
    payload: FeePaymentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_student_id = await resolve_student_id(current_user, db)

    # Find the fee item
    f_res = await db.execute(
        select(FeeItem).where(FeeItem.id == payload.fee_item_id, FeeItem.student_id == target_student_id)
    )
    fee_item = f_res.scalars().first()
    if not fee_item:
        raise HTTPException(status_code=404, detail="Fee item not found for student")

    if fee_item.status == "PAID":
        raise HTTPException(status_code=400, detail="Fee is already fully paid")

    now = datetime.now(timezone.utc)
    txn_id = f"TXN-2026-{uuid.uuid4().hex[:6].upper()}"
    rec_num = f"REC-2026-{uuid.uuid4().hex[:5].upper()}"

    # 1. Create Payment record
    payment = FeePayment(
        fee_item_id=fee_item.id,
        student_id=target_student_id,
        transaction_id=txn_id,
        amount_paid=payload.amount,
        payment_method=payload.payment_method,
        status="SUCCESS",
        paid_at=now,
        notes="Demo payment completed successfully."
    )
    db.add(payment)
    await db.flush()

    # 2. Update FeeItem status
    fee_item.status = "PAID"

    # 3. Create Receipt
    receipt = FeeReceipt(
        receipt_number=rec_num,
        payment_id=payment.id,
        fee_item_id=fee_item.id,
        student_id=target_student_id,
        pdf_url=f"/receipts/{rec_num}.pdf",
        generated_at=now,
        academic_year=fee_item.academic_year,
        semester=fee_item.semester,
        total_amount=payload.amount
    )
    db.add(receipt)

    # 4. Create document record for this receipt
    doc = DocumentRecord(
        student_id=target_student_id,
        title=f"Fee Receipt - {fee_item.title} ({rec_num})",
        category="FEE_RECEIPT",
        file_url=f"/receipts/{rec_num}.pdf",
        file_size_kb=185,
        status="VERIFIED",
        upload_date=now
    )
    db.add(doc)

    # 5. Create notification for student
    db.add(
        Notification(
            user_id=target_student_id,
            title="Fee Payment Successful",
            message=f"Payment of Rs. {payload.amount:,.2f} for {fee_item.title} confirmed. Receipt: {rec_num}",
            type=NotificationType.SYSTEM,
            link=f"/fees?receipt={rec_num}",
            is_read=False,
            created_at=now
        )
    )

    await db.commit()
    await db.refresh(receipt)

    return FeeReceiptResponse(
        id=receipt.id,
        receipt_number=receipt.receipt_number,
        payment_id=receipt.payment_id,
        fee_item_id=receipt.fee_item_id,
        student_id=receipt.student_id,
        fee_title=fee_item.title,
        pdf_url=receipt.pdf_url,
        generated_at=receipt.generated_at,
        academic_year=receipt.academic_year,
        semester=receipt.semester,
        total_amount=receipt.total_amount
    )

# ==================== DOCUMENTS ====================

ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".docx", ".txt", ".csv"}
DANGEROUS_EXTENSIONS = {".exe", ".bat", ".cmd", ".sh", ".py", ".js", ".vbs", ".dll", ".scr", ".msi", ".ps1"}

@router.get("/documents", response_model=List[DocumentRecordResponse])
async def get_student_documents(
    category: Optional[str] = Query(None),
    student_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_student_id = await resolve_student_id(current_user, db, student_id)

    query = select(DocumentRecord).where(DocumentRecord.student_id == target_student_id)
    if category:
        query = query.where(DocumentRecord.category == category)
    query = query.order_by(desc(DocumentRecord.upload_date))

    result = await db.execute(query)
    docs = result.scalars().all()
    return [DocumentRecordResponse.model_validate(d) for d in docs]

@router.post("/documents/upload-file", response_model=DocumentRecordResponse, status_code=status.HTTP_201_CREATED)
async def upload_document_file(
    title: str = Form(...),
    category: str = Form(...),
    file: UploadFile = File(...),
    student_id: Optional[int] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_student_id = await resolve_student_id(current_user, db, student_id)

    filename = file.filename or "uploaded_document.pdf"
    ext = Path(filename).suffix.lower()
    if ext in DANGEROUS_EXTENSIONS or ext not in ALLOWED_DOCUMENT_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid or unsafe file type '{ext}'. Allowed types: {', '.join(sorted(ALLOWED_DOCUMENT_EXTENSIONS))}"
        )

    file_bytes = await file.read()
    size_kb = max(1, len(file_bytes) // 1024)
    if size_kb > settings.MAX_UPLOAD_SIZE_MB * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    user_upload_dir = Path(settings.UPLOAD_DIR) / "documents" / str(target_student_id)
    user_upload_dir.mkdir(parents=True, exist_ok=True)

    safe_filename = f"{uuid.uuid4().hex[:8]}_{Path(filename).name}"
    file_path = user_upload_dir / safe_filename

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    doc = DocumentRecord(
        student_id=target_student_id,
        title=title,
        category=category,
        file_url=f"/api/services/documents/{safe_filename}",
        original_filename=filename,
        mime_type=file.content_type or "application/octet-stream",
        storage_path=str(file_path),
        file_size_kb=size_kb,
        status="VERIFIED",
        upload_date=datetime.now(timezone.utc)
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return DocumentRecordResponse.model_validate(doc)

@router.post("/documents", response_model=DocumentRecordResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    payload: DocumentUploadRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_student_id = await resolve_student_id(current_user, db)

    file_url = payload.file_url or f"/documents/user_{target_student_id}_{uuid.uuid4().hex[:6]}.pdf"

    doc = DocumentRecord(
        student_id=target_student_id,
        title=payload.title,
        category=payload.category,
        file_url=file_url,
        original_filename=payload.original_filename or f"{payload.title}.pdf",
        mime_type=payload.mime_type or "application/pdf",
        file_size_kb=payload.file_size_kb or 250,
        status="VERIFIED",
        upload_date=datetime.now(timezone.utc)
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return DocumentRecordResponse.model_validate(doc)

@router.get("/documents/{document_id}/download")
async def download_student_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(DocumentRecord).where(DocumentRecord.id == document_id)
    result = await db.execute(query)
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if current_user.role == UserRole.STUDENT and doc.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied to this document.")
    elif current_user.role == UserRole.PARENT:
        link_res = await db.execute(select(ParentLink).where(ParentLink.parent_id == current_user.id))
        link = link_res.scalars().first()
        if not link or link.student_id != doc.student_id:
            raise HTTPException(status_code=403, detail="Access denied to this document.")

    if doc.storage_path and os.path.exists(doc.storage_path):
        return FileResponse(
            path=doc.storage_path,
            filename=doc.original_filename or f"{doc.title}.pdf",
            media_type=doc.mime_type or "application/octet-stream"
        )

    # Simulated fallback response for demo records
    content = (
        f"====================================================\n"
        f"       CAMPUSBUDDY VERIFIED DOCUMENT VAULT          \n"
        f"====================================================\n\n"
        f"Title:           {doc.title}\n"
        f"Category:        {doc.category}\n"
        f"Document ID:     DOC-{doc.id:06d}\n"
        f"Student Ref:     STU-{doc.student_id}\n"
        f"Verification:    AUTHENTICATED BY REGISTRAR OFFICE\n"
        f"Status:          {doc.status}\n"
        f"Upload Date:     {doc.upload_date}\n\n"
        f"CampusBuddy Educational ERP & Digital Campus Platform\n"
    )
    return Response(
        content=content.encode("utf-8"),
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{doc.original_filename or f"{doc.title}.txt"}"'}
    )

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(DocumentRecord).where(DocumentRecord.id == document_id)
    if current_user.role == UserRole.STUDENT:
        query = query.where(DocumentRecord.student_id == current_user.id)

    result = await db.execute(query)
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    # Remove physical file if on disk
    if doc.storage_path and os.path.exists(doc.storage_path):
        try:
            os.remove(doc.storage_path)
        except Exception:
            pass

    await db.delete(doc)
    await db.commit()
    return {"message": "Document deleted successfully"}

# ==================== COLLEGE NOTICES ====================

@router.get("/notices", response_model=List[CollegeNoticeResponse])
async def get_college_notices(
    category: Optional[str] = Query(None),
    important_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(CollegeNotice).options(selectinload(CollegeNotice.publisher))
    if category:
        query = query.where(CollegeNotice.category == category)
    if important_only:
        query = query.where(CollegeNotice.is_important == True)
    query = query.order_by(desc(CollegeNotice.is_important), desc(CollegeNotice.published_at))

    result = await db.execute(query)
    notices = result.scalars().all()

    resp = []
    for n in notices:
        resp.append(
            CollegeNoticeResponse(
                id=n.id,
                title=n.title,
                category=n.category,
                content=n.content,
                is_important=n.is_important,
                published_by=n.published_by,
                publisher_name=n.publisher.full_name if n.publisher else "College Administration",
                published_at=n.published_at,
                attachment_url=n.attachment_url,
                target_audience=n.target_audience
            )
        )
    return resp

@router.post("/notices", response_model=CollegeNoticeResponse, status_code=status.HTTP_201_CREATED)
async def create_college_notice(
    payload: CollegeNoticeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN]))
):
    notice = CollegeNotice(
        title=payload.title,
        category=payload.category,
        content=payload.content,
        is_important=payload.is_important,
        target_audience=payload.target_audience,
        attachment_url=payload.attachment_url,
        published_by=current_user.id,
        published_at=datetime.now(timezone.utc)
    )
    db.add(notice)
    await db.commit()
    await db.refresh(notice)

    return CollegeNoticeResponse(
        id=notice.id,
        title=notice.title,
        category=notice.category,
        content=notice.content,
        is_important=notice.is_important,
        published_by=notice.published_by,
        publisher_name=current_user.full_name,
        published_at=notice.published_at,
        attachment_url=notice.attachment_url,
        target_audience=notice.target_audience
    )

# ==================== E-LEARNING MODULE ====================

@router.get("/elearning", response_model=List[ELearningResourceResponse])
async def list_elearning_resources(
    resource_type: Optional[str] = Query(None),
    subject_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(ELearningResource).options(
        selectinload(ELearningResource.subject),
        selectinload(ELearningResource.uploader)
    )

    if resource_type and resource_type != "ALL":
        query = query.where(ELearningResource.resource_type == resource_type)
    if subject_id:
        query = query.where(ELearningResource.subject_id == subject_id)
    if search:
        query = query.where(ELearningResource.title.ilike(f"%{search}%"))

    query = query.order_by(desc(ELearningResource.created_at))
    result = await db.execute(query)
    resources = result.scalars().all()

    resp = []
    for r in resources:
        resp.append(
            ELearningResourceResponse(
                id=r.id,
                title=r.title,
                resource_type=r.resource_type,
                subject_id=r.subject_id,
                subject_code=r.subject.code if r.subject else None,
                subject_name=r.subject.name if r.subject else None,
                uploaded_by=r.uploaded_by,
                uploader_name=r.uploader.full_name if r.uploader else "Faculty Member",
                file_url=r.file_url,
                original_filename=r.original_filename,
                file_size_kb=r.file_size_kb,
                description=r.description,
                created_at=r.created_at
            )
        )
    return resp

@router.post("/elearning/upload", response_model=ELearningResourceResponse, status_code=status.HTTP_201_CREATED)
async def upload_elearning_file(
    title: str = Form(...),
    resource_type: str = Form("NOTE"),
    subject_id: int = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN]))
):
    # Verify subject exists
    sub_res = await db.execute(select(Subject).where(Subject.id == subject_id))
    subject = sub_res.scalars().first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    filename = file.filename or "elearning_resource.pdf"
    ext = Path(filename).suffix.lower()
    if ext in DANGEROUS_EXTENSIONS or ext not in ALLOWED_DOCUMENT_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_DOCUMENT_EXTENSIONS))}"
        )

    file_bytes = await file.read()
    size_kb = max(1, len(file_bytes) // 1024)

    elearning_dir = Path(settings.UPLOAD_DIR) / "elearning" / str(subject_id)
    elearning_dir.mkdir(parents=True, exist_ok=True)

    safe_filename = f"{uuid.uuid4().hex[:8]}_{Path(filename).name}"
    file_path = elearning_dir / safe_filename

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    res = ELearningResource(
        title=title,
        resource_type=resource_type,
        subject_id=subject_id,
        uploaded_by=current_user.id,
        file_url=f"/api/services/elearning/file/{safe_filename}",
        original_filename=filename,
        file_size_kb=size_kb,
        description=description,
        created_at=datetime.now(timezone.utc)
    )
    db.add(res)
    await db.commit()
    await db.refresh(res)

    return ELearningResourceResponse(
        id=res.id,
        title=res.title,
        resource_type=res.resource_type,
        subject_id=res.subject_id,
        subject_code=subject.code,
        subject_name=subject.name,
        uploaded_by=current_user.id,
        uploader_name=current_user.full_name,
        file_url=res.file_url,
        original_filename=res.original_filename,
        file_size_kb=res.file_size_kb,
        description=res.description,
        created_at=res.created_at
    )

@router.post("/elearning", response_model=ELearningResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_elearning_resource(
    payload: ELearningResourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN]))
):
    sub_res = await db.execute(select(Subject).where(Subject.id == payload.subject_id))
    subject = sub_res.scalars().first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    file_url = payload.file_url or f"/elearning/sub_{payload.subject_id}_{uuid.uuid4().hex[:6]}.pdf"

    res = ELearningResource(
        title=payload.title,
        resource_type=payload.resource_type,
        subject_id=payload.subject_id,
        uploaded_by=current_user.id,
        file_url=file_url,
        original_filename=payload.original_filename or f"{payload.title}.pdf",
        file_size_kb=payload.file_size_kb or 512,
        description=payload.description,
        created_at=datetime.now(timezone.utc)
    )
    db.add(res)
    await db.commit()
    await db.refresh(res)

    return ELearningResourceResponse(
        id=res.id,
        title=res.title,
        resource_type=res.resource_type,
        subject_id=res.subject_id,
        subject_code=subject.code,
        subject_name=subject.name,
        uploaded_by=current_user.id,
        uploader_name=current_user.full_name,
        file_url=res.file_url,
        original_filename=res.original_filename,
        file_size_kb=res.file_size_kb,
        description=res.description,
        created_at=res.created_at
    )

@router.get("/elearning/{resource_id}/download")
async def download_elearning_resource(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(ELearningResource).where(ELearningResource.id == resource_id)
    result = await db.execute(query)
    res = result.scalars().first()
    if not res:
        raise HTTPException(status_code=404, detail="E-learning resource not found")

    # If physical file on disk exists, serve it
    potential_path = Path(settings.UPLOAD_DIR) / "elearning" / str(res.subject_id)
    if potential_path.exists():
        for f in potential_path.iterdir():
            if f.name.endswith(res.original_filename or ""):
                return FileResponse(path=str(f), filename=res.original_filename)

    # Educational material content fallback
    content = (
        f"====================================================\n"
        f"       CAMPUSBUDDY E-LEARNING DIGITAL REPOSITORY    \n"
        f"====================================================\n\n"
        f"Title:           {res.title}\n"
        f"Category:        {res.resource_type}\n"
        f"Resource ID:     LRN-{res.id:06d}\n"
        f"Subject Ref:     SUB-{res.subject_id}\n"
        f"Description:     {res.description or 'Official course study material.'}\n"
        f"Uploaded At:     {res.created_at}\n\n"
        f"CampusBuddy Educational ERP & Academic Repository\n"
    )
    return Response(
        content=content.encode("utf-8"),
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{res.original_filename or f"{res.title}.txt"}"'}
    )

