from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, desc

from app.core.database import get_db
from app.core.security import require_roles
from app.models.user import User, UserRole, StudentProfile
from app.models.complaint import Complaint, ComplaintStatus, ComplaintCategory
from app.models.community import CommunityPost, CommunityAnswer, Report, ReportStatus
from app.models.audit import AuditLog
from app.schemas.admin import (
    AdminStatsResponse,
    AuditLogResponse,
    UserRoleUpdate,
)
from app.schemas.user import UserResponse
from app.schemas.community import ReportResponse
from app.services.complaint_service import create_audit_log

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_roles(["ADMIN"]))])

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(db: AsyncSession = Depends(get_db)):
    # Total complaints
    total_cmp = await db.scalar(select(func.count(Complaint.id))) or 0
    
    # Complaints by status
    pending_cmp = await db.scalar(
        select(func.count(Complaint.id)).where(Complaint.status.in_([ComplaintStatus.SUBMITTED, ComplaintStatus.UNDER_REVIEW]))
    ) or 0
    
    in_prog_cmp = await db.scalar(
        select(func.count(Complaint.id)).where(Complaint.status.in_([ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.AWAITING_INFORMATION]))
    ) or 0
    
    resolved_cmp = await db.scalar(
        select(func.count(Complaint.id)).where(Complaint.status == ComplaintStatus.RESOLVED)
    ) or 0
    
    escalated_cmp = await db.scalar(
        select(func.count(Complaint.id)).where(Complaint.status == ComplaintStatus.ESCALATED)
    ) or 0

    total_posts = await db.scalar(select(func.count(CommunityPost.id))) or 0
    total_users = await db.scalar(select(func.count(User.id))) or 0
    active_students = await db.scalar(
        select(func.count(User.id)).where(User.role == UserRole.STUDENT, User.is_active == True)
    ) or 0

    # Resolution rate
    rate = (resolved_cmp / total_cmp * 100) if total_cmp > 0 else 0.0

    # Average resolution time (hours)
    res_cmp_stmt = select(Complaint).where(Complaint.status == ComplaintStatus.RESOLVED, Complaint.resolved_at.is_not(None))
    res_cmp_result = await db.execute(res_cmp_stmt)
    resolved_list = res_cmp_result.scalars().all()
    
    if resolved_list:
        total_hours = sum(
            (c.resolved_at - c.created_at).total_seconds() / 3600 
            for c in resolved_list 
            if c.resolved_at and c.created_at
        )
        avg_hours = total_hours / len(resolved_list)
    else:
        avg_hours = 24.5 # baseline default

    return AdminStatsResponse(
        total_complaints=total_cmp,
        pending_complaints=pending_cmp,
        in_progress_complaints=in_prog_cmp,
        resolved_complaints=resolved_cmp,
        escalated_complaints=escalated_cmp,
        total_community_posts=total_posts,
        total_users=total_users,
        active_students=active_students,
        resolution_rate_percent=round(rate, 1),
        avg_resolution_time_hours=round(avg_hours, 1)
    )

@router.get("/users", response_model=List[UserResponse])
async def list_all_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).options(selectinload(User.student_profile)).order_by(User.id)
    if role and role.upper() != "ALL":
        stmt = stmt.where(User.role == role.upper())
    if search:
        term = f"%{search}%"
        stmt = stmt.where((User.full_name.ilike(term)) | (User.email.ilike(term)))

    res = await db.execute(stmt)
    users = res.scalars().all()
    return [UserResponse.model_validate(u) for u in users]

@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    update_in: UserRoleUpdate,
    admin_user: User = Depends(require_roles(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).options(selectinload(User.student_profile)).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if update_in.role:
        user.role = UserRole(update_in.role.upper())
    if update_in.department is not None:
        user.department = update_in.department
    if update_in.is_active is not None:
        user.is_active = update_in.is_active

    await create_audit_log(
        db=db,
        actor_id=admin_user.id,
        action="USER_UPDATED",
        resource_type="USER",
        resource_id=str(user.id),
        details=f"Updated role={user.role.value}, active={user.is_active}"
    )

    await db.commit()
    return UserResponse.model_validate(user)

@router.get("/reports", response_model=List[ReportResponse])
async def list_reports(
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Report).options(selectinload(Report.reporter)).order_by(desc(Report.created_at))
    if status_filter:
        stmt = stmt.where(Report.status == status_filter.upper())

    res = await db.execute(stmt)
    reports = res.scalars().all()
    return [ReportResponse.model_validate(r) for r in reports]

@router.patch("/reports/{report_id}")
async def handle_report(
    report_id: int,
    action: str = Query(..., pattern="^(dismiss|hide_content)$"),
    admin_notes: Optional[str] = None,
    admin_user: User = Depends(require_roles(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Report).where(Report.id == report_id)
    res = await db.execute(stmt)
    report = res.scalars().first()

    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    if action == "dismiss":
        report.status = ReportStatus.DISMISSED
        report.admin_notes = admin_notes or "Reviewed and dismissed by admin."
    elif action == "hide_content":
        report.status = ReportStatus.REVIEWED
        report.admin_notes = admin_notes or "Content hidden due to community guidelines violation."
        
        # Hide target post or answer
        target_is_post = (report.target_type.value == "POST") if hasattr(report.target_type, 'value') else (str(report.target_type) == "POST")
        if target_is_post:
            p_stmt = select(CommunityPost).where(CommunityPost.id == report.target_id)
            p_res = await db.execute(p_stmt)
            p = p_res.scalars().first()
            if p:
                p.is_hidden = True
        else:
            a_stmt = select(CommunityAnswer).where(CommunityAnswer.id == report.target_id)
            a_res = await db.execute(a_stmt)
            a = a_res.scalars().first()
            if a:
                a.is_hidden = True

    await create_audit_log(
        db=db,
        actor_id=admin_user.id,
        action=f"REPORT_{action.upper()}",
        resource_type="REPORT",
        resource_id=str(report.id),
        details=admin_notes
    )

    await db.commit()
    return {"status": "success", "report_status": report.status.value}

@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AuditLog).options(selectinload(AuditLog.actor)).order_by(desc(AuditLog.created_at)).limit(limit)
    res = await db.execute(stmt)
    logs = res.scalars().all()
    return [AuditLogResponse.model_validate(l) for l in logs]
