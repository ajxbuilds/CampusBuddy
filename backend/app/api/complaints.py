from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, UserRole, ParentLink
from app.models.complaint import (
    Complaint,
    ComplaintCategory,
    ComplaintStatus,
    ComplaintPriority,
    ComplaintStatusHistory,
    ComplaintEscalation,
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

router = APIRouter(prefix="/complaints", tags=["Complaints"])

@router.get("/categories", response_model=List[ComplaintCategoryResponse])
async def get_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ComplaintCategory).order_by(ComplaintCategory.name))
    categories = result.scalars().all()
    return [ComplaintCategoryResponse.model_validate(c) for c in categories]

@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    complaint_in: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
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

    # Also notify linked parent if any
    parent_link_res = await db.execute(select(ParentLink).where(ParentLink.student_id == current_user.id))
    parent_link = parent_link_res.scalars().first()
    if parent_link:
        await send_notification(
            db=db,
            user_id=parent_link.parent_id,
            title="Student Complaint Filed",
            message=f"A new complaint #{code} was submitted by your ward.",
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
            selectinload(Complaint.assignee)
        )
        .where(Complaint.id == complaint.id)
    )
    res = await db.execute(stmt)
    full_complaint = res.scalars().first()

    return ComplaintResponse.model_validate(full_complaint)

@router.get("/", response_model=List[ComplaintResponse])
async def list_complaints(
    category_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Complaint)
        .options(
            selectinload(Complaint.category),
            selectinload(Complaint.student),
            selectinload(Complaint.assignee)
        )
        .order_by(desc(Complaint.created_at))
    )

    # Strict RBAC data isolation
    if current_user.role == UserRole.STUDENT:
        stmt = stmt.where(Complaint.student_id == current_user.id)
    elif current_user.role == UserRole.PARENT:
        # Find linked student(s)
        links_res = await db.execute(select(ParentLink.student_id).where(ParentLink.parent_id == current_user.id))
        student_ids = links_res.scalars().all()
        stmt = stmt.where(Complaint.student_id.in_(student_ids))
    elif current_user.role == UserRole.TEACHER:
        # Teachers see complaints assigned to them or their department
        stmt = stmt.where(
            (Complaint.assigned_to == current_user.id) | 
            (Complaint.category.has(department=current_user.department))
        )
    # ADMIN sees all complaints

    if category_id:
        stmt = stmt.where(Complaint.category_id == category_id)
    if status_filter:
        stmt = stmt.where(Complaint.status == status_filter)
    if priority_filter:
        stmt = stmt.where(Complaint.priority == priority_filter)

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
    
    if current_user.role == UserRole.PARENT:
        links_res = await db.execute(select(ParentLink).where(ParentLink.parent_id == current_user.id, ParentLink.student_id == complaint.student_id))
        if not links_res.scalars().first():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. This complaint does not belong to your linked student.")

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
            selectinload(Complaint.history).selectinload(ComplaintStatusHistory.actor),
            selectinload(Complaint.escalations).selectinload(ComplaintEscalation.requester)
        )
        .where(Complaint.id == complaint_id)
    )
    res = await db.execute(stmt)
    complaint = res.scalars().first()

    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

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
