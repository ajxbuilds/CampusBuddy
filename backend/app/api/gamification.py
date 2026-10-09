from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc, func

from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_optional
from app.models.user import User, UserRole, StudentProfile
from app.models.gamification import Badge, UserBadge, PointTransaction
from app.services.gamification_service import calculate_level_progression
from app.schemas.gamification import (
    BadgeResponse,
    UserBadgeResponse,
    PointTransactionResponse,
    LeaderboardResponse,
    LeaderboardUser,
    GamificationSummaryResponse
)

router = APIRouter(prefix="/gamification", tags=["Gamification"])
@router.get("/me", response_model=GamificationSummaryResponse)
async def get_my_gamification_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(StudentProfile).where(StudentProfile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()

    total_points = profile.total_points if profile and profile.total_points else 0
    summary = calculate_level_progression(total_points)

    return summary


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


@router.get("/points/history", response_model=List[PointTransactionResponse])
async def get_point_history(
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
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.now(timezone.utc)

    if period == "weekly":
        start_date = now - timedelta(days=7)
    elif period == "monthly":
        start_date = now - timedelta(days=30)
    else:
        start_date = None

    # We will fetch all relevant points and sort in memory for exact determinism
    # Tie-breaking logic:
    # 1. Total points (DESC)
    # 2. Earliest transaction timestamp (ASC)
    # 3. User ID (ASC)

    user_stats = {} # user_id -> {"points": int, "earliest": datetime}

    if start_date:
        # Fetch transactions within window
        stmt = select(PointTransaction).where(PointTransaction.created_at >= start_date)
        res = await db.execute(stmt)
        txs = res.scalars().all()
        for tx in txs:
            if tx.user_id not in user_stats:
                user_stats[tx.user_id] = {"points": 0, "earliest": tx.created_at}
            user_stats[tx.user_id]["points"] += tx.points
            if tx.created_at < user_stats[tx.user_id]["earliest"]:
                user_stats[tx.user_id]["earliest"] = tx.created_at
    else:
        # All-time
        stmt = select(PointTransaction)
        res = await db.execute(stmt)
        txs = res.scalars().all()
        for tx in txs:
            if tx.user_id not in user_stats:
                user_stats[tx.user_id] = {"points": 0, "earliest": tx.created_at}
            user_stats[tx.user_id]["points"] += tx.points
            if tx.created_at < user_stats[tx.user_id]["earliest"]:
                user_stats[tx.user_id]["earliest"] = tx.created_at

        # We also need users who have points but maybe no transactions?
        # Actually all gamification points MUST be driven by PointTransactions (Phase 1 rule).
        # So PointTransaction is the authoritative source of truth.
        pass

    # Sort deterministically
    sorted_users = sorted(
        user_stats.items(),
        key=lambda x: (-x[1]["points"], x[1]["earliest"].timestamp() if x[1]["earliest"].tzinfo else x[1]["earliest"], x[0])
    )

    # Fetch User & Badges data in one go
    user_ids = [uid for uid, _ in sorted_users]
    if not user_ids:
        return LeaderboardResponse(period=period, leaders=[], current_user_entry=None)

    u_stmt = select(User).options(selectinload(User.badges).selectinload(UserBadge.badge)).where(User.id.in_(user_ids), User.role.in_([UserRole.STUDENT, UserRole.TEACHER]))
    u_res = await db.execute(u_stmt)
    users_db = {u.id: u for u in u_res.scalars().all()}

    leaders = []
    current_user_entry = None
    rank = 1

    for uid, stats in sorted_users:
        if uid not in users_db:
            continue
        user_obj = users_db[uid]
        pts = stats["points"]

        # Calculate level
        level_prog = calculate_level_progression(pts)

        # Format badges
        user_badges = [BadgeResponse.model_validate(ub.badge) for ub in user_obj.badges if ub.badge]

        entry = LeaderboardUser(
            user_id=user_obj.id,
            full_name=user_obj.full_name,
            department=user_obj.department,
            role=user_obj.role.value,
            avatar_url=user_obj.avatar_url,
            points=pts,
            rank=rank,
            level=level_prog["level"],
            level_name=level_prog["level_name"],
            badges=user_badges
        )

        if rank <= limit:
            leaders.append(entry)

        if current_user and uid == current_user.id:
            current_user_entry = entry

        rank += 1

    return LeaderboardResponse(period=period, leaders=leaders, current_user_entry=current_user_entry)
