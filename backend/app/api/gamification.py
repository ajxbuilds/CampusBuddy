from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole, StudentProfile
from app.models.gamification import Badge, UserBadge, PointTransaction
from app.schemas.gamification import (
    BadgeResponse,
    UserBadgeResponse,
    PointTransactionResponse,
    LeaderboardResponse,
    LeaderboardUser,
)

router = APIRouter(prefix="/gamification", tags=["Gamification"])

@router.get("/badges", response_model=List[BadgeResponse])
async def list_all_badges(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Badge).order_by(Badge.points_threshold))
    badges = res.scalars().all()
    return [BadgeResponse.model_validate(b) for b in badges]

@router.get("/my-badges", response_model=List[UserBadgeResponse])
async def get_my_badges(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(UserBadge)
        .options(selectinload(UserBadge.badge))
        .where(UserBadge.user_id == current_user.id)
        .order_by(desc(UserBadge.awarded_at))
    )
    res = await db.execute(stmt)
    ub = res.scalars().all()
    return [UserBadgeResponse.model_validate(b) for b in ub]

@router.get("/my-transactions", response_model=List[PointTransactionResponse])
async def get_my_point_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(PointTransaction)
        .where(PointTransaction.user_id == current_user.id)
        .order_by(desc(PointTransaction.created_at))
        .limit(50)
    )
    res = await db.execute(stmt)
    txs = res.scalars().all()
    return [PointTransactionResponse.model_validate(t) for t in txs]

@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    period: str = Query("all-time", pattern="^(weekly|monthly|all-time)$"),
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    
    if period == "weekly":
        start_date = now - timedelta(days=7)
    elif period == "monthly":
        start_date = now - timedelta(days=30)
    else:
        start_date = None

    if start_date:
        # Sum points from transactions in the time window
        stmt = (
            select(
                PointTransaction.user_id,
                func.sum(PointTransaction.points).label("total_pts")
            )
            .where(PointTransaction.created_at >= start_date)
            .group_by(PointTransaction.user_id)
            .order_by(desc("total_pts"))
            .limit(limit)
        )
        res = await db.execute(stmt)
        rows = res.all()

        leaders = []
        rank = 1
        for user_id, pts in rows:
            u_stmt = select(User).where(User.id == user_id)
            u_res = await db.execute(u_stmt)
            user = u_res.scalars().first()
            if not user:
                continue

            # Badges
            b_stmt = select(Badge).join(UserBadge).where(UserBadge.user_id == user.id)
            b_res = await db.execute(b_stmt)
            user_badges = [BadgeResponse.model_validate(b) for b in b_res.scalars().all()]

            leaders.append(LeaderboardUser(
                user_id=user.id,
                full_name=user.full_name,
                department=user.department,
                role=user.role.value,
                avatar_url=user.avatar_url,
                points=pts,
                rank=rank,
                badges=user_badges
            ))
            rank += 1

        return LeaderboardResponse(period=period, leaders=leaders)

    else:
        # All-time leaderboard based on student_profiles.total_points
        stmt = (
            select(User)
            .options(
                selectinload(User.student_profile),
                selectinload(User.badges).selectinload(UserBadge.badge)
            )
            .where(User.role.in_([UserRole.STUDENT, UserRole.TEACHER]))
        )
        res = await db.execute(stmt)
        users = res.scalars().all()

        user_points_list = []
        for u in users:
            pts = u.student_profile.total_points if u.student_profile else 0
            user_points_list.append((u, pts))

        # Sort descending
        user_points_list.sort(key=lambda x: x[1], reverse=True)
        top_users = user_points_list[:limit]

        leaders = []
        for idx, (user, pts) in enumerate(top_users, start=1):
            user_badges = [BadgeResponse.model_validate(ub.badge) for ub in user.badges if ub.badge]
            leaders.append(LeaderboardUser(
                user_id=user.id,
                full_name=user.full_name,
                department=user.department,
                role=user.role.value,
                avatar_url=user.avatar_url,
                points=pts,
                rank=idx,
                badges=user_badges
            ))

        return LeaderboardResponse(period=period, leaders=leaders)
