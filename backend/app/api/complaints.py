from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc

from app.core.database import get_db
from app.core.file_validation import validate_upload
from app.services.settings_service import get_setting
from app.core.security import get_current_user, require_roles
from app.models.user import User, UserRole
from fastapi.responses import FileResponse
from app.models.complaint import (
    Complaint,
    ComplaintCategory,
    ComplaintStatus,
    ComplaintPriority,
    ComplaintStatusHistory,
    ComplaintEscalation,
    ComplaintAttachment,
)
from app.models.notification import NotificationType
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintUpdate,
    ComplaintResponse,
    ComplaintDetailResponse,
    ComplaintCategoryResponse,
)
from app.services.complaint_service import (
    generate_complaint_code,
    log_status_change,
    create_audit_log,
    send_notification,
)

router = APIRouter(prefix="/complaints", tags=["Complaints"], redirect_slashes=False)

@router.get("/categories", response_model=List[ComplaintCategoryResponse])
async def get_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ComplaintCategory).order_by(ComplaintCategory.name))
    categories = result.scalars().all()
    return [ComplaintCategoryResponse.model_validate(c) for c in categories]

async def _check_complaints_enabled(db: AsyncSession):
    enabled = await get_setting(db, "complaints_enabled")
    if enabled is False:
        raise HTTPException(status_code=403, detail="Complaints module is currently disabled by administrators.")

@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)

async def create_complaint(
    complaint_in: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await _check_complaints_enabled(db)

    if current_user.role != UserRole.STUDENT and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can register complaints."
        )


    # Validate category
    cat_res = await db.execute(select(ComplaintCategory).where(ComplaintCategory.id == complaint_in.category_id))
    category = cat_res.scalars().first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")

    code = await generate_complaint_code(db)
    sla_deadline = datetime.now(timezone.utc) + timedelta(hours=category.sla_hours)

    complaint = Complaint(
        complaint_code=code,
        student_id=current_user.id,
        category_id=category.id,
        title=complaint_in.title,
        description=complaint_in.description,
        priority=complaint_in.priority,
        status=ComplaintStatus.SUBMITTED,
        attachment_url=complaint_in.attachment_url,
        sla_deadline=sla_deadline,
        created_at=datetime.now(timezone.utc)
    )
    db.add(complaint)
    await db.flush()

    # Initial history timeline entry
    await log_status_change(
        db=db,
        complaint_id=complaint.id,
        changed_by_id=current_user.id,
        from_status=None,
        to_status=ComplaintStatus.SUBMITTED.value,
        remarks="Complaint filed successfully by student."
    )

    # Audit log
    await create_audit_log(
        db=db,
        actor_id=current_user.id,
        action="COMPLAINT_CREATED",
        resource_type="COMPLAINT",
        resource_id=str(complaint.id),
        details=f"Complaint {code} created under {category.name}"
    )

    # In-app notification to student
    await send_notification(
        db=db,
        user_id=current_user.id,
        title="Complaint Submitted",
        message=f"Your complaint #{code} has been registered and is under review.",
        notification_type=NotificationType.COMPLAINT,
        link=f"/complaints/{complaint.id}"
    )



    await db.commit()

    # Reload with relations
    stmt = (
        select(Complaint)
        .options(
            selectinload(Complaint.category),
            selectinload(Complaint.student),
            selectinload(Complaint.assignee),
            selectinload(Complaint.attachments)
        )
        .where(Complaint.id == complaint.id)
    )
    res = await db.execute(stmt)
    full_complaint = res.scalars().first()

    return ComplaintResponse.model_validate(full_complaint)

@router.get("", response_model=List[ComplaintResponse])
@router.get("/", response_model=List[ComplaintResponse])
async def list_complaints(
    category_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import or_

    stmt = (
        select(Complaint)
        .outerjoin(ComplaintCategory, Complaint.category_id == ComplaintCategory.id)
        .options(
            selectinload(Complaint.category),
            selectinload(Complaint.student),
            selectinload(Complaint.assignee),
            selectinload(Complaint.attachments)
        )
        .order_by(desc(Complaint.created_at))
    )

    if current_user.role == UserRole.STUDENT:
        stmt = stmt.where(Complaint.student_id == current_user.id)
    elif current_user.role == UserRole.TEACHER:
        stmt = stmt.where(
            or_(
                Complaint.assigned_to == current_user.id,
                ComplaintCategory.department == current_user.department
            )
        )

    if category_id:
        stmt = stmt.where(Complaint.category_id == category_id)

    if status_filter and status_filter.strip().upper() != "ALL":
        try:
            status_enum = ComplaintStatus(status_filter.strip().upper())
            stmt = stmt.where(Complaint.status == status_enum)
        except ValueError:
            stmt = stmt.where(Complaint.status == status_filter.strip().upper())

    if priority_filter and priority_filter.strip().upper() != "ALL":
        try:
            priority_enum = ComplaintPriority(priority_filter.strip().upper())
            stmt = stmt.where(Complaint.priority == priority_enum)
        except ValueError:
            stmt = stmt.where(Complaint.priority == priority_filter.strip().upper())

    res = await db.execute(stmt)
    complaints = res.scalars().all()
    return [ComplaintResponse.model_validate(c) for c in complaints]

@router.get("/{complaint_id}", response_model=ComplaintDetailResponse)
async def get_complaint_detail(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Complaint)
        .options(
            selectinload(Complaint.category),
            selectinload(Complaint.student),
            selectinload(Complaint.assignee),
            selectinload(Complaint.attachments),
            selectinload(Complaint.history).selectinload(ComplaintStatusHistory.actor),
            selectinload(Complaint.escalations).selectinload(ComplaintEscalation.requester)
        )
        .where(Complaint.id == complaint_id)
    )
    res = await db.execute(stmt)
    complaint = res.scalars().first()

    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    # Strict Access Security Check
    if current_user.role == UserRole.STUDENT and complaint.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. You can only view your own complaints.")

    if current_user.role == UserRole.TEACHER and complaint.assigned_to != current_user.id and complaint.category.department != current_user.department:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Not authorized for this complaint.")

    return ComplaintDetailResponse.model_validate(complaint)

@router.patch("/{complaint_id}", response_model=ComplaintDetailResponse)
async def update_complaint(
    complaint_id: int,
    update_in: ComplaintUpdate,
    current_user: User = Depends(require_roles(["ADMIN", "TEACHER"])),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Complaint)
        .options(
            selectinload(Complaint.category),
            selectinload(Complaint.student),
            selectinload(Complaint.assignee),
            selectinload(Complaint.attachments),
            selectinload(Complaint.history).selectinload(ComplaintStatusHistory.actor),
            selectinload(Complaint.escalations).selectinload(ComplaintEscalation.requester)
        )
        .where(Complaint.id == complaint_id)
    )
    res = await db.execute(stmt)
    complaint = res.scalars().first()

    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    if current_user.role == UserRole.TEACHER and complaint.assigned_to != current_user.id and complaint.category.department != current_user.department:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Not authorized for this complaint.")

    old_status = complaint.status.value

    # Update status if provided
    if update_in.status and update_in.status != complaint.status:
        complaint.status = update_in.status
        if update_in.status == ComplaintStatus.RESOLVED:
            complaint.resolved_at = datetime.now(timezone.utc)

        await log_status_change(
            db=db,
            complaint_id=complaint.id,
            changed_by_id=current_user.id,
            from_status=old_status,
            to_status=update_in.status.value,
            remarks=update_in.remarks or f"Status updated to {update_in.status.value} by {current_user.full_name}"
        )

        # Notify student
        await send_notification(
            db=db,
            user_id=complaint.student_id,
            title=f"Complaint #{complaint.complaint_code} Updated",
            message=f"Status changed to {update_in.status.value}. {update_in.remarks or ''}",
            notification_type=NotificationType.COMPLAINT,
            link=f"/complaints/{complaint.id}"
        )

    # Update assignee if provided
    if update_in.assigned_to is not None and update_in.assigned_to != complaint.assigned_to:
        complaint.assigned_to = update_in.assigned_to
        if complaint.status == ComplaintStatus.SUBMITTED or complaint.status == ComplaintStatus.UNDER_REVIEW:
            complaint.status = ComplaintStatus.ASSIGNED
            await log_status_change(
                db=db,
                complaint_id=complaint.id,
                changed_by_id=current_user.id,
                from_status=old_status,
                to_status=ComplaintStatus.ASSIGNED.value,
                remarks=f"Assigned to staff ID {update_in.assigned_to}"
            )
        # Notify assignee
        await send_notification(
            db=db,
            user_id=update_in.assigned_to,
            title=f"Complaint Assigned: #{complaint.complaint_code}",
            message=f"You have been assigned to handle '{complaint.title}'.",
            notification_type=NotificationType.COMPLAINT,
            link=f"/complaints/{complaint.id}"
        )

    if update_in.priority:
        complaint.priority = update_in.priority

    complaint.updated_at = datetime.now(timezone.utc)

    # Audit log
    await create_audit_log(
        db=db,
        actor_id=current_user.id,
        action="COMPLAINT_UPDATED",
        resource_type="COMPLAINT",
        resource_id=str(complaint.id),
        details=f"Status: {old_status} -> {complaint.status.value}"
    )

    await db.commit()

    # Re-fetch updated complaint
    updated_res = await db.execute(stmt)
    return ComplaintDetailResponse.model_validate(updated_res.scalars().first())


@router.post("/{complaint_id}/confirm-resolution", response_model=ComplaintDetailResponse)
async def confirm_resolution(
    complaint_id: int,
    current_user: User = Depends(require_roles(["STUDENT"])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Complaint).options(
        selectinload(Complaint.category),
        selectinload(Complaint.student),
        selectinload(Complaint.assignee),
            selectinload(Complaint.attachments),
        selectinload(Complaint.history).selectinload(ComplaintStatusHistory.actor),
        selectinload(Complaint.escalations).selectinload(ComplaintEscalation.requester)
    ).where(Complaint.id == complaint_id)
    res = await db.execute(stmt)
    complaint = res.scalars().first()

    if not complaint or complaint.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    if complaint.status != ComplaintStatus.RESOLVED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only resolved complaints can be confirmed as closed.")

    old_status = complaint.status.value
    complaint.status = ComplaintStatus.CLOSED
    complaint.updated_at = datetime.now(timezone.utc)

    await log_status_change(
        db=db,
        complaint_id=complaint.id,
        changed_by_id=current_user.id,
        from_status=old_status,
        to_status=ComplaintStatus.CLOSED.value,
        remarks="Student confirmed the resolution. Complaint closed."
    )

    await db.commit()
    updated_res = await db.execute(stmt)
    return ComplaintDetailResponse.model_validate(updated_res.scalars().first())

@router.post("/{complaint_id}/reopen", response_model=ComplaintDetailResponse)
async def reopen_complaint(
    complaint_id: int,
    current_user: User = Depends(require_roles(["STUDENT"])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Complaint).options(
        selectinload(Complaint.category),
        selectinload(Complaint.student),
        selectinload(Complaint.assignee),
            selectinload(Complaint.attachments),
        selectinload(Complaint.history).selectinload(ComplaintStatusHistory.actor),
        selectinload(Complaint.escalations).selectinload(ComplaintEscalation.requester)
    ).where(Complaint.id == complaint_id)
    res = await db.execute(stmt)
    complaint = res.scalars().first()

    if not complaint or complaint.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    if complaint.status != ComplaintStatus.RESOLVED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only resolved complaints can be reopened.")

    old_status = complaint.status.value
    complaint.status = ComplaintStatus.REOPENED
    complaint.updated_at = datetime.now(timezone.utc)

    await log_status_change(
        db=db,
        complaint_id=complaint.id,
        changed_by_id=current_user.id,
        from_status=old_status,
        to_status=ComplaintStatus.REOPENED.value,
        remarks="Student reopened the complaint."
    )

    # Notify assignee if any
    if complaint.assigned_to:
        await send_notification(
            db=db,
            user_id=complaint.assigned_to,
            title=f"Complaint Reopened: #{complaint.complaint_code}",
            message=f"The student has reopened the complaint.",
            notification_type=NotificationType.COMPLAINT,
            link=f"/complaints/{complaint.id}"
        )

    await db.commit()
    updated_res = await db.execute(stmt)
    return ComplaintDetailResponse.model_validate(updated_res.scalars().first())

@router.post("/{complaint_id}/updates", response_model=ComplaintDetailResponse)
async def add_complaint_update(
    complaint_id: int,
    remarks: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Complaint).options(
        selectinload(Complaint.category),
        selectinload(Complaint.student),
        selectinload(Complaint.assignee),
            selectinload(Complaint.attachments),
        selectinload(Complaint.history).selectinload(ComplaintStatusHistory.actor),
        selectinload(Complaint.escalations).selectinload(ComplaintEscalation.requester)
    ).where(Complaint.id == complaint_id)
    res = await db.execute(stmt)
    complaint = res.scalars().first()

    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    # Authorization
    if current_user.role == UserRole.STUDENT and complaint.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    if current_user.role == UserRole.TEACHER and complaint.assigned_to != current_user.id and complaint.category.department != current_user.department:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    await log_status_change(
        db=db,
        complaint_id=complaint.id,
        changed_by_id=current_user.id,
        from_status=complaint.status.value,
        to_status=complaint.status.value,
        remarks=remarks
    )

    # Notifications
    if current_user.role in [UserRole.ADMIN, UserRole.TEACHER]:
        await send_notification(
            db=db,
            user_id=complaint.student_id,
            title=f"Update on #{complaint.complaint_code}",
            message=f"Staff added an update to your complaint.",
            notification_type=NotificationType.COMPLAINT,
            link=f"/complaints/{complaint.id}"
        )
    elif complaint.assigned_to:
        await send_notification(
            db=db,
            user_id=complaint.assigned_to,
            title=f"Student update on #{complaint.complaint_code}",
            message=f"The student has added an update.",
            notification_type=NotificationType.COMPLAINT,
            link=f"/complaints/{complaint.id}"
        )

    await db.commit()
    updated_res = await db.execute(stmt)
    return ComplaintDetailResponse.model_validate(updated_res.scalars().first())


import os
import uuid


UPLOAD_DIR = (
    "/tmp/uploads/complaints"
    if os.getenv("VERCEL")
    else "uploads/complaints"
)
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/{complaint_id}/attachments")
async def upload_attachment(
    complaint_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify complaint exists and user is authorized
    stmt = select(Complaint).where(Complaint.id == complaint_id)
    res = await db.execute(stmt)
    complaint = res.scalars().first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == UserRole.STUDENT and complaint.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # File validation
    content, ext = await validate_upload(db, file)
    ext = '.' + ext

    # Save securely
    unique_filename = f"{uuid.uuid4()}{ext}"
    stored_path = os.path.join(UPLOAD_DIR, unique_filename)

    import asyncio
    def write_file_sync(path, data):
        with open(path, 'wb') as out_file:
            out_file.write(data)

    await asyncio.to_thread(write_file_sync, stored_path, content)

    attachment = ComplaintAttachment(
        complaint_id=complaint_id,
        original_filename=file.filename,
        stored_filename=unique_filename,
        mime_type=file.content_type,
        file_size=len(content),
        uploaded_by=current_user.id,
        created_at=datetime.now(timezone.utc)
    )

    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)

    return {"message": "File uploaded successfully", "attachment_id": attachment.id}

from app.core.security import settings
from jose import jwt, JWTError

from fastapi import Request

@router.get("/attachments/{attachment_id}")
async def download_attachment(
    attachment_id: int,
    request: Request,
    token: Optional[str] = Query(None, description="JWT token for authentication"),
    db: AsyncSession = Depends(get_db)
):
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    stmt_user = select(User).where(User.id == user_id)
    res_user = await db.execute(stmt_user)
    current_user = res_user.scalars().first()
    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid token")

    stmt = select(ComplaintAttachment).options(selectinload(ComplaintAttachment.complaint)).where(ComplaintAttachment.id == attachment_id)
    res = await db.execute(stmt)
    attachment = res.scalars().first()

    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    complaint = attachment.complaint
    # Auth
    if current_user.role == UserRole.STUDENT and complaint.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this attachment")
    if current_user.role == UserRole.TEACHER and complaint.assigned_to != current_user.id and complaint.category.department != current_user.department:
        raise HTTPException(status_code=403, detail="Not authorized to view this attachment")

    file_path = os.path.join(UPLOAD_DIR, attachment.stored_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File missing on disk")

    return FileResponse(file_path, filename=attachment.original_filename, media_type=attachment.mime_type)
