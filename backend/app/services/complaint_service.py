import random
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models.complaint import Complaint, ComplaintCategory, ComplaintStatusHistory, ComplaintStatus
from app.models.audit import AuditLog
from app.models.notification import Notification, NotificationType

async def generate_complaint_code(db: AsyncSession) -> str:
    year = datetime.now(timezone.utc).year
    # Count existing complaints for this year to generate sequential/unique code
    stmt = select(func.count(Complaint.id))
    result = await db.execute(stmt)
    count = result.scalar() or 0
    # Add a random offset to prevent predictability while keeping format clean
    random_suffix = random.randint(100, 999)
    code_number = (count + 1) * 1000 + random_suffix
    return f"CB-{year}-{code_number:06d}"

async def log_status_change(
    db: AsyncSession,
    complaint_id: int,
    changed_by_id: Optional[int],
    from_status: Optional[str],
    to_status: str,
    remarks: Optional[str] = None
) -> ComplaintStatusHistory:
    history = ComplaintStatusHistory(
        complaint_id=complaint_id,
        changed_by=changed_by_id,
        from_status=from_status,
        to_status=to_status,
        remarks=remarks,
        created_at=datetime.now(timezone.utc)
    )
    db.add(history)
    return history

async def create_audit_log(
    db: AsyncSession,
    actor_id: Optional[int],
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    log = AuditLog(
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id else None,
        details=details,
        ip_address=ip_address,
        created_at=datetime.now(timezone.utc)
    )
    db.add(log)
    return log

async def send_notification(
    db: AsyncSession,
    user_id: int,
    title: str,
    message: str,
    notification_type: NotificationType = NotificationType.COMPLAINT,
    link: Optional[str] = None
) -> Notification:
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        link=link,
        is_read=False,
        created_at=datetime.now(timezone.utc)
    )
    db.add(notif)
    return notif
