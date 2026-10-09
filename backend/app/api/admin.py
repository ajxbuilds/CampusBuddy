import time
import os
from pathlib import Path
from app.core.config import settings
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, desc, text, distinct

from app.core.database import get_db
from app.core.security import require_roles
from app.models.user import User, UserRole, StudentProfile
from app.models.gamification import PointTransaction
from app.schemas.admin import GamificationStatsResponse, GamificationChartPoint, GamificationBreakdown, TopContributor, GamificationTransaction
from app.models.complaint import Complaint, ComplaintStatus, ComplaintCategory
from app.models.community import CommunityPost, CommunityAnswer, Report, ReportStatus
from app.models.audit import AuditLog
from app.services.settings_service import get_all_settings, update_setting
from app.schemas.setting import AppSettingResponse, AppSettingUpdate, BulkSettingUpdate
from app.schemas.health import SystemHealthResponse, HealthComponent
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

@router.get("/audit-logs")
async def list_audit_logs(
    limit: int = 50,
    skip: int = 0,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    action: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AuditLog).options(selectinload(AuditLog.actor))

    if start_date:
        stmt = stmt.where(AuditLog.created_at >= start_date)
    if end_date:
        stmt = stmt.where(AuditLog.created_at <= end_date)
    if action:
        stmt = stmt.where(AuditLog.action == action)

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_res = await db.execute(count_stmt)
    total = total_res.scalar() or 0

    stmt = stmt.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit)
    res = await db.execute(stmt)
    logs = res.scalars().all()

    return {
        "items": [AuditLogResponse.model_validate(l) for l in logs],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/settings", response_model=List[AppSettingResponse])
async def list_settings(db: AsyncSession = Depends(get_db)):
    settings = await get_all_settings(db)
    return settings

@router.patch("/settings", response_model=List[AppSettingResponse])
async def bulk_update_settings(
    updates: List[BulkSettingUpdate],
    db: AsyncSession = Depends(get_db)
):
    updated = []
    for update in updates:
        try:
            s = await update_setting(db, update.key, update.value)
            updated.append(s)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    return updated

@router.patch("/settings/{key}", response_model=AppSettingResponse)
async def update_single_setting(
    key: str,
    update: AppSettingUpdate,
    db: AsyncSession = Depends(get_db)
):
    try:
        s = await update_setting(db, key, update.value)
        return s
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/system-health", response_model=SystemHealthResponse)
async def get_system_health(db: AsyncSession = Depends(get_db)):
    start_time = time.perf_counter()
    now_str = datetime.now().isoformat()

    components = {}

    # 1. Database Check
    db_start = time.perf_counter()
    try:
        await db.execute(text("SELECT 1"))
        db_latency = int((time.perf_counter() - db_start) * 1000)
        components["database"] = HealthComponent(
            status="HEALTHY",
            message="Database is reachable and responding to read queries.",
            latency_ms=db_latency,
            checked_at=now_str
        )
    except Exception as e:
        components["database"] = HealthComponent(
            status="UNAVAILABLE",
            message="Database connection failed.",
            latency_ms=None,
            checked_at=now_str
        )

    # 2. Authentication Check
    auth_start = time.perf_counter()
    if settings.SECRET_KEY and settings.SECRET_KEY != "dev-only-fallback-secret-key":
        auth_status = "HEALTHY"
        auth_msg = "Authentication system is securely configured."
    else:
        auth_status = "DEGRADED"
        auth_msg = "Authentication is using fallback development keys."
    auth_latency = int((time.perf_counter() - auth_start) * 1000)
    components["authentication"] = HealthComponent(
        status=auth_status,
        message=auth_msg,
        latency_ms=auth_latency,
        checked_at=now_str
    )

    # 3. File Storage Check
    fs_start = time.perf_counter()
    upload_dir = Path(settings.UPLOAD_DIR)
    try:
        if not upload_dir.exists():
            upload_dir.mkdir(parents=True, exist_ok=True)
        if os.access(upload_dir, os.W_OK):
            fs_status = "HEALTHY"
            fs_msg = "Upload directory is accessible and writable."
        else:
            fs_status = "UNAVAILABLE"
            fs_msg = "Upload directory exists but is not writable."
    except Exception:
        fs_status = "UNAVAILABLE"
        fs_msg = "Upload directory is not writable or cannot be created."
    fs_latency = int((time.perf_counter() - fs_start) * 1000)
    components["file_storage"] = HealthComponent(
        status=fs_status,
        message=fs_msg,
        latency_ms=fs_latency,
        checked_at=now_str
    )

    # 4. AI Service Check
    ai_start = time.perf_counter()
    if settings.AI_PROVIDER == "mock":
        ai_status = "NOT_CONFIGURED"
        ai_msg = "AI provider is set to mock mode."
    elif settings.AI_PROVIDER == "gemini" and not settings.GEMINI_API_KEY:
        ai_status = "UNAVAILABLE"
        ai_msg = "Gemini provider selected but API key is missing."
    elif settings.AI_PROVIDER == "openai" and not settings.OPENAI_API_KEY:
        ai_status = "UNAVAILABLE"
        ai_msg = "OpenAI provider selected but API key is missing."
    else:
        ai_status = "HEALTHY"
        ai_msg = f"AI service configured for {settings.AI_PROVIDER}."
    ai_latency = int((time.perf_counter() - ai_start) * 1000)
    components["ai_service"] = HealthComponent(
        status=ai_status,
        message=ai_msg,
        latency_ms=ai_latency,
        checked_at=now_str
    )

    # 5. Notifications Check
    notif_start = time.perf_counter()
    if settings.SMTP_ENABLED.lower() == "true":
        if settings.SMTP_HOST:
            notif_status = "HEALTHY"
            notif_msg = "SMTP notifications are configured."
        else:
            notif_status = "UNAVAILABLE"
            notif_msg = "SMTP is enabled but host is missing."
    else:
        notif_status = "HEALTHY"
        notif_msg = "In-app database notifications are active."
    notif_latency = int((time.perf_counter() - notif_start) * 1000)
    components["notifications"] = HealthComponent(
        status=notif_status,
        message=notif_msg,
        latency_ms=notif_latency,
        checked_at=now_str
    )

    # 6. Backend API Check
    api_latency = int((time.perf_counter() - start_time) * 1000)
    components["backend_api"] = HealthComponent(
        status="HEALTHY",
        message="Backend API is responding to requests.",
        latency_ms=api_latency,
        checked_at=now_str
    )

    # Determine Overall Status
    # Critical: Database, Backend API
    # Optional/Degraded: Auth (if dev keys), AI (if unavailable), File Storage (if unavailable), Notifications (if unavailable)
    overall_status = "HEALTHY"
    if components["database"].status == "UNAVAILABLE" or components["backend_api"].status == "UNAVAILABLE":
        overall_status = "UNAVAILABLE"
    else:
        for key, comp in components.items():
            if comp.status == "UNAVAILABLE" and key not in ["database", "backend_api"]:
                overall_status = "DEGRADED"
            elif comp.status == "DEGRADED":
                overall_status = "DEGRADED"

    return SystemHealthResponse(
        overall_status=overall_status,
        last_checked=now_str,
        components=components
    )


@router.get("/gamification/stats", response_model=GamificationStatsResponse)
async def get_gamification_stats(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db)
):
    conds = []
    if start_date:
        conds.append(PointTransaction.created_at >= start_date)
    if end_date:
        conds.append(PointTransaction.created_at <= end_date)

    stmt_base = select(
        func.count(PointTransaction.id).filter(PointTransaction.points > 0).label("total_contribs"),
        func.sum(PointTransaction.points).label("points_awarded"),
        func.count(distinct(PointTransaction.user_id)).label("active"),
        func.count(PointTransaction.id).filter(PointTransaction.event_type == 'ANSWER_ACCEPTED').label("accepted")
    )
    if conds:
        stmt_base = stmt_base.where(*conds)

    res = await db.execute(stmt_base)
    row = res.fetchone()

    return {
        "total_contributions": row.total_contribs or 0,
        "points_awarded": row.points_awarded or 0,
        "active_contributors": row.active or 0,
        "accepted_answers": row.accepted or 0
    }

@router.get("/gamification/chart", response_model=List[GamificationChartPoint])
async def get_gamification_chart(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db)
):
    conds = []
    if start_date:
        conds.append(PointTransaction.created_at >= start_date)
    if end_date:
        conds.append(PointTransaction.created_at <= end_date)

    date_func = func.date(PointTransaction.created_at)
    stmt = select(
        date_func.label("dt"),
        func.count(PointTransaction.id).label("cnt"),
        func.sum(PointTransaction.points).label("pts")
    ).filter(PointTransaction.points > 0).group_by(date_func).order_by(date_func)

    if conds:
        stmt = stmt.where(*conds)

    res = await db.execute(stmt)
    return [{"date": str(row.dt), "count": row.cnt or 0, "points": row.pts or 0} for row in res.fetchall()]

@router.get("/gamification/breakdown", response_model=List[GamificationBreakdown])
async def get_gamification_breakdown(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db)
):
    conds = [PointTransaction.points > 0]
    if start_date:
        conds.append(PointTransaction.created_at >= start_date)
    if end_date:
        conds.append(PointTransaction.created_at <= end_date)

    stmt = select(
        PointTransaction.event_type,
        func.count(PointTransaction.id).label("cnt"),
        func.sum(PointTransaction.points).label("pts")
    ).where(*conds).group_by(PointTransaction.event_type).order_by(desc("pts"))

    res = await db.execute(stmt)
    return [{"event_type": row.event_type, "count": row.cnt, "points": row.pts} for row in res.fetchall()]

@router.get("/gamification/top-contributors", response_model=List[TopContributor])
async def get_gamification_top(
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(
        PointTransaction.user_id,
        User.full_name,
        func.sum(PointTransaction.points).label("pts"),
        func.count(PointTransaction.id).filter(PointTransaction.points > 0).label("cnt")
    ).join(User, PointTransaction.user_id == User.id).group_by(PointTransaction.user_id, User.full_name).order_by(desc("pts")).limit(limit)

    res = await db.execute(stmt)
    return [{"user_id": row.user_id, "user_name": row.full_name or "Unknown", "points": row.pts, "contributions": row.cnt} for row in res.fetchall()]

@router.get("/gamification/transactions", response_model=List[GamificationTransaction])
async def get_gamification_transactions(
    page: int = 1,
    limit: int = 50,
    user_id: Optional[int] = None,
    event_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    offset = (page - 1) * limit
    conds = []
    if user_id:
        conds.append(PointTransaction.user_id == user_id)
    if event_type:
        conds.append(PointTransaction.event_type == event_type)

    stmt = select(PointTransaction, User.full_name).join(User, PointTransaction.user_id == User.id).order_by(desc(PointTransaction.created_at)).offset(offset).limit(limit)
    if conds:
        stmt = stmt.where(*conds)

    res = await db.execute(stmt)
    results = []
    for tx, fname in res.fetchall():
        results.append({
            "id": tx.id,
            "user_id": tx.user_id,
            "user_name": fname or "Unknown",
            "event_type": tx.event_type,
            "reason": tx.reason,
            "points": tx.points,
            "created_at": tx.created_at
        })
    return results


from app.models.community import CommunityReply
from pydantic import BaseModel
class AdminCommunityStatsResponse(BaseModel):
    total_questions: int
    unanswered_questions: int
    reported_content: int
    questions_this_week: int

@router.get("/community/stats", response_model=AdminCommunityStatsResponse)
async def get_community_stats(db: AsyncSession = Depends(get_db)):
    tq_res = await db.execute(select(func.count(CommunityPost.id)))
    total_questions = tq_res.scalar() or 0

    uq_res = await db.execute(select(func.count(CommunityPost.id)).where(CommunityPost.answers_count == 0))
    unanswered_questions = uq_res.scalar() or 0

    rep_res = await db.execute(select(func.count(Report.id)).where(Report.status == ReportStatus.PENDING))
    reported_content = rep_res.scalar() or 0

    from datetime import datetime, timedelta, timezone
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    qtw_res = await db.execute(select(func.count(CommunityPost.id)).where(CommunityPost.created_at >= week_ago))
    questions_this_week = qtw_res.scalar() or 0

    return {
        "total_questions": total_questions,
        "unanswered_questions": unanswered_questions,
        "reported_content": reported_content,
        "questions_this_week": questions_this_week
    }

@router.get("/community/posts")
async def get_admin_community_posts(
    page: int = 1,
    limit: int = 25,
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None, # "answered", "unanswered", "hidden"
    db: AsyncSession = Depends(get_db)
):
    offset = (page - 1) * limit
    stmt = select(CommunityPost, User.full_name).join(User, CommunityPost.author_id == User.id).order_by(desc(CommunityPost.created_at))

    if search:
        stmt = stmt.where(CommunityPost.title.ilike(f"%{search}%") | CommunityPost.content.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%"))
    if category:
        stmt = stmt.where(CommunityPost.category == category)
    if status == "answered":
        stmt = stmt.where(CommunityPost.answers_count > 0)
    elif status == "unanswered":
        stmt = stmt.where(CommunityPost.answers_count == 0)
    elif status == "hidden":
        stmt = stmt.where(CommunityPost.is_hidden == True)

    # Get total count for pagination
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_res = await db.execute(count_stmt)
    total_count = total_res.scalar() or 0

    stmt = stmt.offset(offset).limit(limit)
    res = await db.execute(stmt)

    posts = []
    for post, author_name in res.fetchall():
        posts.append({
            "id": post.id,
            "title": post.title,
            "author_name": author_name or "Unknown",
            "category": post.category,
            "answers_count": post.answers_count,
            "votes": post.upvotes_count - post.downvotes_count,
            "is_hidden": post.is_hidden,
            "has_accepted_answer": post.has_accepted_answer,
            "created_at": post.created_at.isoformat()
        })

    return {
        "items": posts,
        "total": total_count,
        "page": page,
        "limit": limit
    }
