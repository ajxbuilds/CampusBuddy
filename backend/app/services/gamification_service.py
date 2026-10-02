from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc

from app.models.gamification import Badge, UserBadge, PointTransaction
from app.models.user import User, StudentProfile
from app.models.notification import Notification, NotificationType

# Point Values
POINTS_ANSWER_POSTED = 5
POINTS_HELPFUL_ANSWER = 10
POINTS_ACCEPTED_ANSWER = 20
POINTS_USEFUL_CONTRIBUTION = 10

BADGE_THRESHOLDS = [
    {"name": "First Helper", "points_threshold": 5, "icon": "HandHeart", "description": "Contributed first helpful community answer"},
    {"name": "Problem Solver", "points_threshold": 25, "icon": "CheckCircle2", "description": "Had an answer accepted as the official solution"},
    {"name": "Community Star", "points_threshold": 50, "icon": "Star", "description": "Accumulated 50 reputation points in the community"},
    {"name": "Top Contributor", "points_threshold": 150, "icon": "Award", "description": "Demonstrated persistent college problem-solving expertise"},
    {"name": "Trusted Buddy", "points_threshold": 300, "icon": "ShieldCheck", "description": "Elite campus helper trusted by students and faculty"}
]

async def award_points(
    db: AsyncSession,
    user_id: int,
    points: int,
    reason: str,
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None
) -> Optional[PointTransaction]:
    # Anti-spam: Check if identical transaction already logged for this reference
    if reference_type and reference_id:
        stmt = select(PointTransaction).where(
            PointTransaction.user_id == user_id,
            PointTransaction.reference_type == reference_type,
            PointTransaction.reference_id == reference_id
        )
        res = await db.execute(stmt)
        if res.scalars().first() is not None:
            return None # Already awarded

    # Create transaction
    tx = PointTransaction(
        user_id=user_id,
        points=points,
        reason=reason,
        reference_type=reference_type,
        reference_id=reference_id,
        created_at=datetime.now(timezone.utc)
    )
    db.add(tx)

    # Update student profile total_points if student
    profile_stmt = select(StudentProfile).where(StudentProfile.user_id == user_id)
    profile_res = await db.execute(profile_stmt)
    profile = profile_res.scalars().first()
    if profile:
        profile.total_points += points
        new_total = profile.total_points
    else:
        new_total = points

    # In-app notification for points
    notif = Notification(
        user_id=user_id,
        title="Points Earned!",
        message=f"You earned +{points} reputation points: {reason}",
        type=NotificationType.BADGE,
        link="/leaderboard",
        is_read=False,
        created_at=datetime.now(timezone.utc)
    )
    db.add(notif)

    # Check for badge eligibility
    await check_and_award_badges(db, user_id, new_total, reference_type)

    return tx

async def check_and_award_badges(
    db: AsyncSession,
    user_id: int,
    total_points: int,
    trigger_event: Optional[str] = None
):
    # Fetch all badges
    badges_res = await db.execute(select(Badge))
    all_badges = badges_res.scalars().all()

    # Fetch user's existing badge IDs
    user_badges_res = await db.execute(select(UserBadge.badge_id).where(UserBadge.user_id == user_id))
    existing_badge_ids = set(user_badges_res.scalars().all())

    for badge in all_badges:
        if badge.id in existing_badge_ids:
            continue

        eligible = False
        if badge.name == "First Helper" and trigger_event in ["ANSWER_POSTED", "ACCEPTED_ANSWER"]:
            eligible = True
        elif badge.name == "Problem Solver" and trigger_event == "ACCEPTED_ANSWER":
            eligible = True
        elif total_points >= badge.points_threshold:
            eligible = True

        if eligible:
            ub = UserBadge(
                user_id=user_id,
                badge_id=badge.id,
                awarded_at=datetime.now(timezone.utc)
            )
            db.add(ub)

            # Notification for new badge
            b_notif = Notification(
                user_id=user_id,
                title=f"Badge Unlocked: {badge.name}!",
                message=f"Congratulations! You've been awarded the '{badge.name}' badge: {badge.description}",
                type=NotificationType.BADGE,
                link="/profile",
                is_read=False,
                created_at=datetime.now(timezone.utc)
            )
            db.add(b_notif)
