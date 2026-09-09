from datetime import timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
)
from app.models.user import User, UserRole, StudentProfile, ParentLink
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.services.complaint_service import create_audit_log

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user email already exists
    existing = await db.execute(select(User).where(User.email == user_in.email))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Create user
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        department=user_in.department,
        phone=user_in.phone,
        avatar_url=user_in.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_in.full_name}",
        is_active=True
    )
    db.add(user)
    await db.flush()

    # If student, create student profile
    if user_in.role == UserRole.STUDENT:
        roll = user_in.roll_number or f"CB-{user.id:04d}"
        profile = StudentProfile(
            user_id=user.id,
            roll_number=roll,
            semester=user_in.semester or 1,
            program=user_in.program or "B.Tech Computer Science",
            total_points=0
        )
        db.add(profile)

    # If parent, link to student if provided
    if user_in.role == UserRole.PARENT and user_in.linked_student_id:
        parent_link = ParentLink(
            parent_id=user.id,
            student_id=user_in.linked_student_id,
            relation_type="Parent",
            is_verified=True
        )
        db.add(parent_link)

    await db.commit()

    # Re-fetch user with student profile
    stmt = select(User).options(selectinload(User.student_profile)).where(User.id == user.id)
    res = await db.execute(stmt)
    user_loaded = res.scalars().first()

    # Audit log
    await create_audit_log(db, actor_id=user.id, action="USER_REGISTERED", resource_type="USER", resource_id=str(user.id))

    access_token = create_access_token(data={"sub": str(user.id), "role": str(user.role.value)})
    return Token(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user_loaded))

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    stmt = select(User).options(selectinload(User.student_profile)).where(User.email == credentials.email)
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is deactivated.")

    # Audit log
    await create_audit_log(db, actor_id=user.id, action="USER_LOGIN", resource_type="USER", resource_id=str(user.id))

    access_token = create_access_token(data={"sub": str(user.id), "role": str(user.role.value)})
    return Token(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user))

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).options(selectinload(User.student_profile)).where(User.id == current_user.id)
    res = await db.execute(stmt)
    user = res.scalars().first()
    return UserResponse.model_validate(user)

@router.get("/students", response_model=List[UserResponse])
async def list_students(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).options(selectinload(User.student_profile)).where(User.role == UserRole.STUDENT)
    res = await db.execute(stmt)
    students = res.scalars().all()
    return [UserResponse.model_validate(s) for s in students]

@router.get("/staff", response_model=List[UserResponse])
async def list_staff(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.role.in_([UserRole.TEACHER, UserRole.ADMIN]))
    res = await db.execute(stmt)
    staff = res.scalars().all()
    return [UserResponse.model_validate(s) for s in staff]
