from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[NotificationResponse])
async def get_my_notifications(
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .limit(limit)
    )
    res = await db.execute(stmt)
    notifications = res.scalars().all()
    return [NotificationResponse.model_validate(n) for n in notifications]

@router.patch("/{notification_id}/read")
async def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Notification).where(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    )
    res = await db.execute(stmt)
    notif = res.scalars().first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    notif.is_read = True
    await db.commit()
    return {"status": "success"}

@router.post("/mark-all-read")
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Notification).where(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    )
    res = await db.execute(stmt)
    notifications = res.scalars().all()
    for n in notifications:
        n.is_read = True
    await db.commit()
    return {"status": "success", "updated": len(notifications)}
