import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, case, desc

from app.models.gamification import Badge, UserBadge, PointTransaction
from app.models.user import User, StudentProfile
from app.models.notification import Notification, NotificationType
from app.services.settings_service import get_setting

# CENTRALIZED POINT VALUES & EVENT TYPES (PHASE 1)
# -----------------------------------------------
class PointEvent:
    COMMUNITY_QUESTION = "COMMUNITY_QUESTION"
    COMMUNITY_ANSWER = "COMMUNITY_ANSWER"
    ANSWER_ACCEPTED = "ANSWER_ACCEPTED"
    HELPFUL_REPLY = "HELPFUL_REPLY"
    STUDY_BUDDY_MILESTONE = "STUDY_BUDDY_MILESTONE"

POINT_VALUES = {
    PointEvent.COMMUNITY_QUESTION: 2,
    PointEvent.COMMUNITY_ANSWER: 5,
    PointEvent.ANSWER_ACCEPTED: 10,
    PointEvent.HELPFUL_REPLY: 3,
    PointEvent.STUDY_BUDDY_MILESTONE: 5
}

async def award_points(
    db: AsyncSession,
    user_id: int,
    event_type: str,
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Optional[PointTransaction]:
    # 1. Validate Event & Get Points (Backend source of truth)
    if event_type not in POINT_VALUES and not event_type.startswith("REVOKED_"):
        raise ValueError(f"Invalid event type: {event_type}")

    points = POINT_VALUES.get(event_type, 0)

    # Try fetching dynamic points from Settings API
    if event_type in POINT_VALUES:
        setting_key = "points_" + event_type.lower()
        dynamic_points = await get_setting(db, setting_key)
        if dynamic_points is not None:
            points = dynamic_points


    # 2. Verify User Exists
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalars().first()
    if not user:
        raise ValueError("User not found")

    # 3. Idempotency / Duplicate Protection
    if reference_type and reference_id:
        stmt = select(PointTransaction).where(
            PointTransaction.user_id == user_id,
            PointTransaction.event_type == event_type,
            PointTransaction.reference_type == reference_type,
            PointTransaction.reference_id == reference_id
        )
        res = await db.execute(stmt)
        if res.scalars().first() is not None:
            return None # Already awarded

    # 4. Create transaction
    meta_str = json.dumps(metadata) if metadata else None

    tx = PointTransaction(
        user_id=user_id,
        points=points,
        event_type=event_type,
        reason=event_type, # fallback for legacy code
        reference_type=reference_type,
        reference_id=reference_id,
        metadata_payload=meta_str,
        created_at=datetime.now(timezone.utc)
    )
    db.add(tx)
    await db.flush()

    # 5. Aggregate User Points
    profile_stmt = select(StudentProfile).where(StudentProfile.user_id == user_id)
    profile_res = await db.execute(profile_stmt)
    profile = profile_res.scalars().first()

    new_total = points
    if profile:
        # Initialize if none
        if profile.total_points is None:
            profile.total_points = 0
        profile.total_points += points
        new_total = profile.total_points

    # 6. Evaluate Achievements (Phase 4)
    await evaluate_achievements(db, user_id)

    return tx


async def revoke_points(
    db: AsyncSession,
    user_id: int,
    event_type: str,
    reference_type: str,
    reference_id: int
) -> Optional[PointTransaction]:
    """
    Creates a compensating/reversal transaction if the user previously earned points for an action that is now being removed.
    Prevents negative-farming (revoking points they never earned).
    """
    # 1. Check if they actually earned points for this exact event
    stmt = select(PointTransaction).where(
        PointTransaction.user_id == user_id,
        PointTransaction.event_type == event_type,
        PointTransaction.reference_type == reference_type,
        PointTransaction.reference_id == reference_id,
        PointTransaction.points > 0
    )
    res = await db.execute(stmt)
    original_tx = res.scalars().first()

    if not original_tx:
        # Nothing to revoke
        return None

    # 2. Check if it was ALREADY revoked to prevent double-revoking
    rev_stmt = select(PointTransaction).where(
        PointTransaction.user_id == user_id,
        PointTransaction.event_type == f"REVOKED_{event_type}",
        PointTransaction.reference_type == reference_type,
        PointTransaction.reference_id == reference_id
    )
    rev_res = await db.execute(rev_stmt)
    if rev_res.scalars().first():
        return None

    # 3. Create Negative Transaction
    negative_tx = PointTransaction(
        user_id=user_id,
        points=-original_tx.points,
        reason=f"Revoked: {original_tx.reason}",
        event_type=f"REVOKED_{event_type}",
        reference_type=reference_type,
        reference_id=reference_id,
        created_at=datetime.now(timezone.utc)
    )

    try:
        db.add(negative_tx)
        await db.flush()
    except IntegrityError:
        await db.rollback()
        return None

    # 4. Decrement User Points safely
    profile_stmt = select(StudentProfile).where(StudentProfile.user_id == user_id)
    profile_res = await db.execute(profile_stmt)
    profile = profile_res.scalars().first()

    if profile:
        profile.total_points = max(0, profile.total_points - original_tx.points)

    return negative_tx

async def evaluate_achievements(db: AsyncSession, user_id: int):
    # Fetch all badges
    badges_res = await db.execute(select(Badge))
    all_badges = badges_res.scalars().all()

    # Fetch user's existing badges
    user_badges_res = await db.execute(select(UserBadge.badge_id).where(UserBadge.user_id == user_id))
    existing_badge_ids = set(user_badges_res.scalars().all())

    # Get user stats
    # 1. Any contribution count (Questions, Answers, Accepted, Helpful)
    # MUST prevent badge farming by subtracting revoked transactions!
    contribution_events = [PointEvent.COMMUNITY_QUESTION, PointEvent.COMMUNITY_ANSWER, PointEvent.ANSWER_ACCEPTED, PointEvent.HELPFUL_REPLY]
    revoked_events = [f"REVOKED_{e}" for e in contribution_events]

    stmt_contrib = select(
        func.sum(
            case(
                (PointTransaction.event_type.in_(contribution_events), 1),
                (PointTransaction.event_type.in_(revoked_events), -1),
                else_=0
            )
        )
    ).where(PointTransaction.user_id == user_id)
    res_contrib = await db.execute(stmt_contrib)
    any_contribution_count = res_contrib.scalar() or 0

    # 2. Accepted answers count (Net of revocations)
    stmt_acc = select(
        func.sum(
            case(
                (PointTransaction.event_type == PointEvent.ANSWER_ACCEPTED, 1),
                (PointTransaction.event_type == f"REVOKED_{PointEvent.ANSWER_ACCEPTED}", -1),
                else_=0
            )
        )
    ).where(PointTransaction.user_id == user_id)
    res_acc = await db.execute(stmt_acc)
    accepted_answer_count = res_acc.scalar() or 0

    for badge in all_badges:
        if badge.id in existing_badge_ids:
            continue

        eligible = False
        if badge.criteria_type == "ANY_CONTRIBUTION" and any_contribution_count >= badge.points_threshold:
            eligible = True
        elif badge.criteria_type == "ACCEPTED_ANSWER" and accepted_answer_count >= badge.points_threshold:
            eligible = True

        if eligible:
            ub = UserBadge(
                user_id=user_id,
                badge_id=badge.id,
                awarded_at=datetime.now(timezone.utc)
            )
            db.add(ub)

            b_notif = Notification(
                user_id=user_id,
                title=f"You earned the {badge.name} badge!",
                message=f"Congratulations! You've been awarded the '{badge.name}' badge: {badge.description}",
                type=NotificationType.BADGE,
                link="/profile",
                is_read=False,
                created_at=datetime.now(timezone.utc)
            )
            db.add(b_notif)

# PHASE 3: LEVELS & PROGRESSION
# -----------------------------------------------
GAMIFICATION_LEVELS = [
    {"level": 1, "name": "New Member", "threshold": 0},
    {"level": 2, "name": "Contributor", "threshold": 20},
    {"level": 3, "name": "Helper", "threshold": 50},
    {"level": 4, "name": "Problem Solver", "threshold": 150},
    {"level": 5, "name": "Community Mentor", "threshold": 300},
    {"level": 6, "name": "Campus Champion", "threshold": 600}
]

def calculate_level_progression(total_points: int) -> dict:
    if total_points < 0:
        total_points = 0

    current_level_obj = GAMIFICATION_LEVELS[0]
    next_level_obj = None

    for i, lvl in enumerate(GAMIFICATION_LEVELS):
        if total_points >= lvl["threshold"]:
            current_level_obj = lvl
            if i + 1 < len(GAMIFICATION_LEVELS):
                next_level_obj = GAMIFICATION_LEVELS[i + 1]
            else:
                next_level_obj = None
        else:
            break

    if next_level_obj:
        points_needed = next_level_obj["threshold"] - current_level_obj["threshold"]
        points_earned_in_level = total_points - current_level_obj["threshold"]
        progress_percentage = (points_earned_in_level / points_needed) * 100
        points_remaining = next_level_obj["threshold"] - total_points

        return {
            "points": total_points,
            "level": current_level_obj["level"],
            "level_name": current_level_obj["name"],
            "current_threshold": current_level_obj["threshold"],
            "next_threshold": next_level_obj["threshold"],
            "points_remaining": points_remaining,
            "progress_percentage": round(min(100.0, max(0.0, progress_percentage)), 1)
        }
    else:
        # Maximum level reached
        return {
            "points": total_points,
            "level": current_level_obj["level"],
            "level_name": current_level_obj["name"],
            "current_threshold": current_level_obj["threshold"],
            "next_threshold": None,
            "points_remaining": 0,
            "progress_percentage": 100.0
        }
