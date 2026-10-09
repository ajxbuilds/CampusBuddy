from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.study_buddy import StudyBuddyProfile, StudyBuddyRequest, StudyBuddyConnection, ConnectionStatus
from app.schemas.study_buddy import (
    StudyBuddyProfileCreate,
    StudyBuddyProfileUpdate,
    StudyBuddyProfileResponse,
    StudyBuddyRequestCreate,
    StudyBuddyRequestResponse,
    StudyBuddyConnectionResponse,
)

router = APIRouter(prefix="/study-buddy", tags=["Study Buddy"])

@router.get("/profile", response_model=StudyBuddyProfileResponse)
async def get_my_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StudyBuddyProfile).where(StudyBuddyProfile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    from app.models.user import StudentProfile
    st_res = await db.execute(select(StudentProfile).where(StudentProfile.user_id == current_user.id))
    st_profile = st_res.scalars().first()

    if st_profile:
        profile.skills = st_profile.skills
        profile.interests = st_profile.interests
        profile.help_areas = st_profile.help_areas
        profile.goals = st_profile.goals

    return profile

@router.post("/profile", response_model=StudyBuddyProfileResponse)
async def create_profile(profile_in: StudyBuddyProfileCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StudyBuddyProfile).where(StudyBuddyProfile.user_id == current_user.id))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Profile already exists")

    profile = StudyBuddyProfile(
        user_id=current_user.id,
        is_active=profile_in.is_active
    )
    db.add(profile)

    from app.models.user import StudentProfile
    st_res = await db.execute(select(StudentProfile).where(StudentProfile.user_id == current_user.id))
    st_profile = st_res.scalars().first()
    if st_profile:
        create_data = profile_in.model_dump(exclude_unset=True) if hasattr(profile_in, 'model_dump') else profile_in.dict(exclude_unset=True)
        if 'skills' in create_data: st_profile.skills = create_data['skills']
        if 'interests' in create_data: st_profile.interests = create_data['interests']
        if 'help_areas' in create_data: st_profile.help_areas = create_data['help_areas']
        if 'goals' in create_data: st_profile.goals = create_data['goals']

        # Hydrate the response with student profile data
        profile.skills = st_profile.skills
        profile.interests = st_profile.interests
        profile.help_areas = st_profile.help_areas
        profile.goals = st_profile.goals

    await db.commit()
    await db.refresh(profile)
    return profile

@router.patch("/profile", response_model=StudyBuddyProfileResponse)
async def update_profile(profile_in: StudyBuddyProfileUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StudyBuddyProfile).where(StudyBuddyProfile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_data = profile_in.model_dump(exclude_unset=True) if hasattr(profile_in, 'model_dump') else profile_in.dict(exclude_unset=True)
    if 'is_active' in update_data:
        profile.is_active = update_data['is_active']

    from app.models.user import StudentProfile
    st_res = await db.execute(select(StudentProfile).where(StudentProfile.user_id == current_user.id))
    st_profile = st_res.scalars().first()
    if st_profile:
        if 'skills' in update_data: st_profile.skills = update_data['skills']
        if 'interests' in update_data: st_profile.interests = update_data['interests']
        if 'help_areas' in update_data: st_profile.help_areas = update_data['help_areas']
        if 'goals' in update_data: st_profile.goals = update_data['goals']

        profile.skills = st_profile.skills
        profile.interests = st_profile.interests
        profile.help_areas = st_profile.help_areas
        profile.goals = st_profile.goals

    await db.commit()
    await db.refresh(profile)
    return profile

@router.get("/discover")
async def discover_buddies(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Returns active profiles excluding the current user and existing connections
    # Simplified matching logic: just returning recent active ones
    from app.models.user import StudentProfile
    result = await db.execute(
        select(StudyBuddyProfile, User, StudentProfile)
        .join(User, User.id == StudyBuddyProfile.user_id)
        .outerjoin(StudentProfile, StudentProfile.user_id == User.id)
        .where(
            StudyBuddyProfile.is_active == True,
            StudyBuddyProfile.user_id != current_user.id
        )
        .limit(20)
    )

    buddies = []
    for sb_profile, user, st_profile in result.all():
        buddies.append({
            "profile_id": sb_profile.id,
            "user_id": user.id,
            "name": user.full_name,
            "avatar_url": user.avatar_url,
            "department": user.department,
            "skills": st_profile.skills if st_profile else None,
            "interests": st_profile.interests if st_profile else None,
            "help_areas": st_profile.help_areas if st_profile else None,
            "goals": st_profile.goals if st_profile else None
        })
    return buddies

@router.post("/requests", response_model=StudyBuddyRequestResponse)
async def send_request(req_in: StudyBuddyRequestCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if req_in.receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot send request to yourself")

    # Check if already requested or connected
    existing_req = await db.execute(
        select(StudyBuddyRequest).where(
            or_(
                and_(StudyBuddyRequest.sender_id == current_user.id, StudyBuddyRequest.receiver_id == req_in.receiver_id),
                and_(StudyBuddyRequest.sender_id == req_in.receiver_id, StudyBuddyRequest.receiver_id == current_user.id)
            )
        )
    )
    if existing_req.scalars().first():
        raise HTTPException(status_code=400, detail="Request already exists")

    new_req = StudyBuddyRequest(
        sender_id=current_user.id,
        receiver_id=req_in.receiver_id,
        message=req_in.message
    )
    db.add(new_req)
    await db.commit()
    await db.refresh(new_req)
    return new_req

@router.get("/requests")
async def get_my_requests(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Incoming pending requests
    inc_res = await db.execute(
        select(StudyBuddyRequest, User)
        .join(User, User.id == StudyBuddyRequest.sender_id)
        .where(
            StudyBuddyRequest.receiver_id == current_user.id,
            StudyBuddyRequest.status == ConnectionStatus.PENDING
        )
    )

    # Outgoing pending requests
    out_res = await db.execute(
        select(StudyBuddyRequest, User)
        .join(User, User.id == StudyBuddyRequest.receiver_id)
        .where(
            StudyBuddyRequest.sender_id == current_user.id,
            StudyBuddyRequest.status == ConnectionStatus.PENDING
        )
    )

    incoming = [{"request": req, "user": {"id": u.id, "name": u.full_name, "avatar_url": u.avatar_url}} for req, u in inc_res.all()]
    outgoing = [{"request": req, "user": {"id": u.id, "name": u.full_name, "avatar_url": u.avatar_url}} for req, u in out_res.all()]

    return {"incoming": incoming, "outgoing": outgoing}

@router.post("/requests/{req_id}/accept")
async def accept_request(req_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(StudyBuddyRequest).where(
            StudyBuddyRequest.id == req_id,
            StudyBuddyRequest.receiver_id == current_user.id,
            StudyBuddyRequest.status == ConnectionStatus.PENDING
        )
    )
    req = result.scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found or not pending")

    req.status = ConnectionStatus.ACCEPTED

    conn = StudyBuddyConnection(
        user1_id=req.sender_id,
        user2_id=req.receiver_id
    )
    db.add(conn)
    await db.commit()
    return {"status": "accepted"}

@router.post("/requests/{req_id}/reject")
async def reject_request(req_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(StudyBuddyRequest).where(
            StudyBuddyRequest.id == req_id,
            StudyBuddyRequest.receiver_id == current_user.id,
            StudyBuddyRequest.status == ConnectionStatus.PENDING
        )
    )
    req = result.scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found or not pending")

    req.status = ConnectionStatus.REJECTED
    await db.commit()
    return {"status": "rejected"}

@router.get("/connections")
async def get_my_connections(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(StudyBuddyConnection)
        .where(
            or_(
                StudyBuddyConnection.user1_id == current_user.id,
                StudyBuddyConnection.user2_id == current_user.id
            )
        )
    )
    conns = result.scalars().all()

    # Resolve user details
    connected_users = []
    for c in conns:
        other_id = c.user2_id if c.user1_id == current_user.id else c.user1_id
        u_res = await db.execute(select(User).where(User.id == other_id))
        u = u_res.scalars().first()
        if u:
            connected_users.append({
                "connection_id": c.id,
                "connected_at": c.connected_at,
                "user": {
                    "id": u.id,
                    "name": u.full_name,
                    "avatar_url": u.avatar_url,
                    "department": u.department
                }
            })

    return connected_users
