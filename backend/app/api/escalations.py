from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.complaint import (
    Complaint,
    ComplaintStatus,
    ComplaintPriority,
    ComplaintEscalation,
    EscalationStatus,
)
from app.models.notification import NotificationType
from app.schemas.complaint import (
    ComplaintEscalationCreate,
    ComplaintEscalationReview,
    ComplaintEscalationResponse,
    ComplaintDetailResponse,
)
from app.services.complaint_service import (
    log_status_change,
    create_audit_log,
    send_notification,
)

router = APIRouter(prefix="/escalations", tags=["Escalations"])

@router.post("/{complaint_id}", response_model=ComplaintEscalationResponse, status_code=status.HTTP_201_CREATED)
async def request_escalation(
    complaint_id: int,
    escalation_in: ComplaintEscalationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Complaint).where(Complaint.id == complaint_id)
    res = await db.execute(stmt)
    complaint = res.scalars().first()

    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    if current_user.role == UserRole.STUDENT and complaint.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only escalate your own complaints.")

    # Check if SLA breached
    sla_breached = False
    if complaint.sla_deadline and datetime.now(timezone.utc) > complaint.sla_deadline.replace(tzinfo=timezone.utc):
        sla_breached = True

    # Check eligibility: SLA breached or status is REJECTED or has been pending/in progress for extended time
    is_eligible = (
        sla_breached or 
        complaint.status == ComplaintStatus.REJECTED or
        complaint.status in [ComplaintStatus.SUBMITTED, ComplaintStatus.UNDER_REVIEW, ComplaintStatus.IN_PROGRESS]
    )

    if not is_eligible:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complaint is not eligible for escalation at this time."
        )

    old_status = complaint.status.value
    complaint.status = ComplaintStatus.ESCALATED
    complaint.is_escalated = True
    complaint.priority = ComplaintPriority.CRITICAL

    escalation = ComplaintEscalation(
        complaint_id=complaint.id,
        requested_by=current_user.id,
        level=escalation_in.level,
        reason=escalation_in.reason,
        sla_breached=sla_breached,
        status=EscalationStatus.PENDING,
        created_at=datetime.now(timezone.utc)
    )
    db.add(escalation)

    # Timeline entry
    await log_status_change(
        db=db,
        complaint_id=complaint.id,
        changed_by_id=current_user.id,
        from_status=old_status,
        to_status=ComplaintStatus.ESCALATED.value,
        remarks=f"Escalated ({escalation_in.level}): {escalation_in.reason}"
    )

    # Audit log
    await create_audit_log(
        db=db,
        actor_id=current_user.id,
        action="COMPLAINT_ESCALATED",
        resource_type="COMPLAINT",
        resource_id=str(complaint.id),
        details=f"Escalation requested. Reason: {escalation_in.reason}"
    )

    # In-app notification to student
    await send_notification(
        db=db,
        user_id=complaint.student_id,
        title=f"Escalation Submitted: #{complaint.complaint_code}",
        message="Your complaint has been escalated to senior college administration for expedited review.",
        notification_type=NotificationType.COMPLAINT,
        link=f"/complaints/{complaint.id}"
    )

    # Notify administrators
    admin_stmt = select(User).where(User.role == UserRole.ADMIN)
    admin_res = await db.execute(admin_stmt)
    admins = admin_res.scalars().all()
    for adm in admins:
        await send_notification(
            db=db,
            user_id=adm.id,
            title=f"🚨 Urgent Escalation: #{complaint.complaint_code}",
            message=f"Complaint escalated: {complaint.title}. Reason: {escalation_in.reason[:60]}...",
            notification_type=NotificationType.COMPLAINT,
            link=f"/complaints/{complaint.id}"
        )

    await db.commit()

    # Re-fetch escalation with requester
    esc_stmt = select(ComplaintEscalation).options(selectinload(ComplaintEscalation.requester)).where(ComplaintEscalation.id == escalation.id)
    esc_res = await db.execute(esc_stmt)
    return ComplaintEscalationResponse.model_validate(esc_res.scalars().first())

@router.patch("/{escalation_id}/review", response_model=ComplaintEscalationResponse)
async def review_escalation(
    escalation_id: int,
    review_in: ComplaintEscalationReview,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(ComplaintEscalation)
        .options(
            selectinload(ComplaintEscalation.requester),
            selectinload(ComplaintEscalation.complaint)
        )
        .where(ComplaintEscalation.id == escalation_id)
    )
    res = await db.execute(stmt)
    escalation = res.scalars().first()

    if not escalation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escalation record not found.")

    escalation.status = review_in.status
    escalation.admin_notes = review_in.admin_notes
    escalation.reviewed_at = datetime.now(timezone.utc)

    complaint = escalation.complaint
    old_status = complaint.status.value

    if review_in.status == EscalationStatus.APPROVED:
        complaint.status = ComplaintStatus.IN_PROGRESS
        if review_in.priority:
            complaint.priority = review_in.priority
        if review_in.assigned_to:
            complaint.assigned_to = review_in.assigned_to

        await log_status_change(
            db=db,
            complaint_id=complaint.id,
            changed_by_id=current_user.id,
            from_status=old_status,
            to_status=ComplaintStatus.IN_PROGRESS.value,
            remarks=f"Escalation Approved by Admin. Action: {review_in.admin_notes or 'Expedited investigation commenced.'}"
        )
        # Notify student
        await send_notification(
            db=db,
            user_id=complaint.student_id,
            title="Escalation Approved",
            message=f"Admin approved escalation for #{complaint.complaint_code}. Resolution has been expedited.",
            notification_type=NotificationType.COMPLAINT,
            link=f"/complaints/{complaint.id}"
        )
    else:
        await log_status_change(
            db=db,
            complaint_id=complaint.id,
            changed_by_id=current_user.id,
            from_status=old_status,
            to_status=complaint.status.value,
            remarks=f"Escalation Dismissed. Note: {review_in.admin_notes or 'Standard SLA applies.'}"
        )
        # Notify student
        await send_notification(
            db=db,
            user_id=complaint.student_id,
            title="Escalation Update",
            message=f"Escalation request for #{complaint.complaint_code} was reviewed: {review_in.admin_notes or 'Proceeding under standard review.'}",
            notification_type=NotificationType.COMPLAINT,
            link=f"/complaints/{complaint.id}"
        )

    await create_audit_log(
        db=db,
        actor_id=current_user.id,
        action="ESCALATION_REVIEWED",
        resource_type="ESCALATION",
        resource_id=str(escalation.id),
        details=f"Status: {review_in.status.value}. Notes: {review_in.admin_notes}"
    )

    await db.commit()
    return ComplaintEscalationResponse.model_validate(escalation)
