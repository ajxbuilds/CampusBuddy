import secrets
import urllib.parse
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import httpx
from jose import JWTError, jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_onboarding_token,
    decode_onboarding_token,
    get_current_user,
)
from app.models.user import User, UserRole, StudentProfile, ParentLink
from app.models.gamification import PointTransaction
from app.schemas.user import (
    UserCreate, 
    UserLogin, 
    UserResponse, 
    Token,
    GoogleAuthUrlResponse,
    GoogleOnboardRequest,
)
from app.services.complaint_service import create_audit_log

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # CRITICAL SECURITY GUARD: Disallow public creation of ADMIN accounts
    if user_in.role == UserRole.ADMIN or str(user_in.role).upper() == "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Security Restriction: Administrator accounts cannot be created via public registration. Contact campus system administrators."
        )

    # Check if user email already exists
    existing = await db.execute(select(User).where(User.email == user_in.email))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Check if student roll number already registered
    if user_in.role == UserRole.STUDENT and user_in.roll_number:
        existing_roll = await db.execute(
            select(StudentProfile).where(StudentProfile.roll_number == user_in.roll_number)
        )
        if existing_roll.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Roll number '{user_in.roll_number}' is already registered to an existing student profile."
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

    # Safe null check on hashed_password avoids passlib TypeError on OAuth accounts
    if not user or not user.hashed_password or not verify_password(credentials.password, user.hashed_password):
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

@router.get("/parent/linked-student", response_model=Optional[UserResponse])
async def get_parent_linked_student(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns the profile of the student linked to the current parent account."""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parent accounts can access linked student.")
    
    link_res = await db.execute(select(ParentLink).where(ParentLink.parent_id == current_user.id))
    link = link_res.scalars().first()
    if not link:
        return None
    
    stmt = select(User).options(selectinload(User.student_profile)).where(User.id == link.student_id)
    res = await db.execute(stmt)
    student = res.scalars().first()
    return UserResponse.model_validate(student) if student else None


# =========================================================================
# Google OAuth 2.0 / OIDC Authentication Flow
# =========================================================================

@router.get("/google/status")
async def google_auth_status():
    """Returns whether Google OAuth credentials are configured on the server."""
    is_configured = bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)
    return {
        "configured": is_configured,
        "client_id": settings.GOOGLE_CLIENT_ID if is_configured else None,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
    }

@router.get("/google/login", response_model=GoogleAuthUrlResponse)
async def google_login(redirect: bool = False):
    """
    Generates official Google OAuth 2.0 authorization URL with CSRF protection.
    If redirect=True, sends 307 Redirect directly to Google accounts auth page.
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        if redirect:
            return RedirectResponse(
                f"{settings.FRONTEND_URL}/login?error=google_not_configured"
            )
        return GoogleAuthUrlResponse(
            configured=False,
            url=None,
            message="Google OAuth 2.0 is not configured in backend/.env. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
        )

    # Cryptographic state parameter to prevent CSRF: encoded as signed JWT
    state_payload = {
        "csrf": secrets.token_urlsafe(16),
        "type": "oauth_state",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15)
    }
    state = jwt.encode(state_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "select_account"
    }
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"

    if redirect:
        return RedirectResponse(auth_url)

    return GoogleAuthUrlResponse(
        configured=True,
        url=auth_url,
        message="Google OAuth authorization URL generated successfully."
    )

@router.get("/google/callback")
async def google_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Receives callback from Google OAuth service.
    Exchanges code for tokens, retrieves user profile info, and either:
    1. Logs in existing user (linking account if previously registered via email/password)
    2. Issues temporary onboarding token for new user to complete role selection.
    """
    if error:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error={urllib.parse.quote(error)}")

    if not code:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=missing_authorization_code")

    # Cryptographic CSRF state validation
    if not state:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=missing_csrf_state")
    try:
        decoded_state = jwt.decode(state, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if decoded_state.get("type") != "oauth_state":
            return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=invalid_csrf_state")
    except JWTError:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=expired_csrf_state")

    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=google_not_configured")

    # Exchange authorization code for token with Google
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            token_res = await client.post(token_url, data=token_data)
            if token_res.status_code != 200:
                err_detail = token_res.text
                return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=failed_token_exchange")
            
            token_json = token_res.json()
            google_access_token = token_json.get("access_token")

            # Fetch user info from Google OIDC endpoint
            userinfo_res = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {google_access_token}"}
            )
            if userinfo_res.status_code != 200:
                return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=failed_userinfo_fetch")
            
            userinfo = userinfo_res.json()
    except Exception as exc:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error={urllib.parse.quote(str(exc))}")

    # Critical security check: Google email verification
    if not userinfo.get("email_verified", False):
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=google_email_not_verified")

    google_email = userinfo.get("email")
    google_sub = userinfo.get("sub")
    google_name = userinfo.get("name") or google_email.split("@")[0]
    google_picture = userinfo.get("picture")

    if not google_email:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=missing_email_from_google")

    # Check for existing user with this email
    stmt = select(User).options(selectinload(User.student_profile)).where(User.email == google_email)
    res = await db.execute(stmt)
    existing_user = res.scalars().first()

    if existing_user:
        # Existing account linking:
        if not existing_user.provider_user_id:
            existing_user.provider_user_id = google_sub
        if existing_user.auth_provider == "local":
            existing_user.auth_provider = "google"
        if not existing_user.avatar_url or "dicebear" in existing_user.avatar_url:
            if google_picture:
                existing_user.avatar_url = google_picture
        await db.commit()

        await create_audit_log(
            db,
            actor_id=existing_user.id,
            action="USER_LOGIN_GOOGLE_LINKED",
            resource_type="USER",
            resource_id=str(existing_user.id)
        )

        access_token = create_access_token(
            data={"sub": str(existing_user.id), "role": str(existing_user.role.value)}
        )
        return RedirectResponse(f"{settings.FRONTEND_URL}/auth/callback?token={access_token}")
    else:
        # New Google user: issue signed onboarding token and redirect to onboarding screen
        onboarding_token = create_onboarding_token({
            "sub": google_sub,
            "email": google_email,
            "name": google_name,
            "picture": google_picture,
        })
        return RedirectResponse(f"{settings.FRONTEND_URL}/onboarding?token={onboarding_token}")

@router.post("/google/dev-simulate")
async def google_dev_simulate(
    email: str = "google.student@campusbuddy.edu",
    name: str = "Google Student",
    picture: Optional[str] = "https://api.dicebear.com/7.x/avataaars/svg?seed=google-student",
    db: AsyncSession = Depends(get_db)
):
    """
    Developer helper: allows local testing of Google OAuth flow without needing live GCP credentials.
    CRITICAL SECURITY GUARD: Block any attempt to simulate ADMIN accounts.
    """
    stmt = select(User).options(selectinload(User.student_profile)).where(User.email == email)
    res = await db.execute(stmt)
    existing = res.scalars().first()

    # STRICT SECURITY GUARD: Never simulate or issue tokens for ADMIN accounts
    if existing and (existing.role == UserRole.ADMIN or str(existing.role).upper() == "ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Security Violation: Administrator accounts cannot be simulated or accessed via development simulation."
        )

    if existing:
        token = create_access_token(data={"sub": str(existing.id), "role": str(existing.role.value)})
        return {
            "status": "linked",
            "action": "login",
            "redirect_url": f"/auth/callback?token={token}",
            "token": token
        }

    onboarding_token = create_onboarding_token({
        "sub": f"google-sim-{secrets.token_hex(6)}",
        "email": email,
        "name": name,
        "picture": picture,
    })
    return {
        "status": "new_user",
        "action": "onboard",
        "redirect_url": f"/onboarding?token={onboarding_token}",
        "onboarding_token": onboarding_token
    }

@router.post("/google/onboard", response_model=Token)
async def google_onboard(
    onboard_in: GoogleOnboardRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Completes onboarding for a new user who authenticated through Google OAuth.
    CRITICAL: Rejects any attempt to register with ADMIN role.
    """
    # 1. Decode and verify onboarding token
    google_data = decode_onboarding_token(onboard_in.onboarding_token)

    # 2. Strict ADMIN role guard: Google signups can NEVER be ADMIN
    role_val = onboard_in.role.value if hasattr(onboard_in.role, "value") else str(onboard_in.role)
    if role_val.upper() == "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Security Restriction: Administrator accounts cannot be created via Google registration. Admin accounts are strictly managed by system administrators."
        )

    email = google_data["email"]
    sub = google_data.get("sub")
    name = google_data.get("name") or email.split("@")[0]
    picture = google_data.get("picture")

    # 3. Check if user was already created in the meantime
    stmt = select(User).options(selectinload(User.student_profile)).where(User.email == email)
    res = await db.execute(stmt)
    existing_user = res.scalars().first()

    if existing_user:
        access_token = create_access_token(
            data={"sub": str(existing_user.id), "role": str(existing_user.role.value)}
        )
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(existing_user)
        )

    # 4. Create new User with disabled password string (secures OAuth-only accounts)
    user = User(
        email=email,
        hashed_password=f"!oauth_google_{secrets.token_hex(24)}",
        full_name=name,
        role=onboard_in.role,
        department=onboard_in.department,
        phone=onboard_in.phone,
        avatar_url=picture or f"https://api.dicebear.com/7.x/avataaars/svg?seed={name}",
        auth_provider="google",
        provider_user_id=sub,
        is_active=True
    )
    db.add(user)
    await db.flush()

    # 5. Role-specific profile initialization
    if onboard_in.role == UserRole.STUDENT:
        roll = onboard_in.roll_number or f"CB-G{user.id:04d}"
        # Ensure roll number uniqueness
        existing_roll = await db.execute(select(StudentProfile).where(StudentProfile.roll_number == roll))
        if existing_roll.scalars().first():
            roll = f"{roll}-{secrets.token_hex(2)}"
        
        profile = StudentProfile(
            user_id=user.id,
            roll_number=roll,
            semester=onboard_in.semester or 1,
            program=onboard_in.program or "B.Tech Computer Science",
            total_points=50 # Welcome bonus points!
        )
        db.add(profile)

        # Record PointTransaction to keep gamification ledger synchronized
        pt = PointTransaction(
            user_id=user.id,
            points=50,
            reason="Welcome Bonus (Google Account Registration)"
        )
        db.add(pt)

    if onboard_in.role == UserRole.PARENT and onboard_in.linked_student_id:
        stu = await db.scalar(select(User).where(User.id == onboard_in.linked_student_id, User.role == UserRole.STUDENT))
        if stu:
            parent_link = ParentLink(
                parent_id=user.id,
                student_id=onboard_in.linked_student_id,
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
    await create_audit_log(
        db,
        actor_id=user.id,
        action="USER_REGISTERED_GOOGLE",
        resource_type="USER",
        resource_id=str(user.id)
    )

    access_token = create_access_token(
        data={"sub": str(user.id), "role": str(user.role.value)}
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user_loaded)
    )

from app.schemas.user import ParentLinkCodeResponse, ParentLinkRequest
from app.models.user import ParentLinkCode, ParentLink

@router.get("/parent/link-code", response_model=Optional[ParentLinkCodeResponse])
async def get_parent_link_code(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can view their link code.")
        
    stmt = select(ParentLinkCode).where(
        ParentLinkCode.student_id == current_user.id,
        ParentLinkCode.is_active == True,
        ParentLinkCode.expires_at >= datetime.now(timezone.utc).replace(tzinfo=None)
    )
    res = await db.execute(stmt)
    code_obj = res.scalars().first()
    
    if not code_obj:
        return None
    return ParentLinkCodeResponse(code=code_obj.code, expires_at=code_obj.expires_at, is_active=bool(code_obj.is_active))

@router.post("/parent/link-code/generate", response_model=ParentLinkCodeResponse)
async def generate_parent_link_code(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can generate a link code.")
    
    stmt = select(ParentLinkCode).where(ParentLinkCode.student_id == current_user.id, ParentLinkCode.is_active == True)
    res = await db.execute(stmt)
    for code_obj in res.scalars().all():
        code_obj.is_active = False
    
    import random
    import string
    chars = string.ascii_uppercase.replace("O", "").replace("I", "").replace("L", "").replace("S", "").replace("B", "")
    nums = string.digits.replace("0", "").replace("1", "").replace("5", "").replace("8", "")
    pool = chars + nums
    code_str = "CB-" + "".join(random.choices(pool, k=4)) + "-" + "".join(random.choices(pool, k=4))
    
    new_code = ParentLinkCode(
        student_id=current_user.id,
        code=code_str,
        is_active=True,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=48)
    )
    db.add(new_code)
    await db.commit()
    
    return ParentLinkCodeResponse(code=new_code.code, expires_at=new_code.expires_at, is_active=True)

@router.post("/parent/link")
async def parent_link_student(
    request: ParentLinkRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Only parents can link students.")
    
    code_str = request.code.strip().upper()
    stmt = select(ParentLinkCode).where(ParentLinkCode.code == code_str, ParentLinkCode.is_active == True)
    res = await db.execute(stmt)
    code_obj = res.scalars().first()
    
    if not code_obj:
        raise HTTPException(status_code=400, detail="That Parent Link Code is invalid or has expired.")
    
    if code_obj.expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
        code_obj.is_active = False
        await db.commit()
        raise HTTPException(status_code=400, detail="That Parent Link Code has expired.")
        
    existing = await db.scalar(select(ParentLink).where(ParentLink.parent_id == current_user.id, ParentLink.student_id == code_obj.student_id))
    if existing:
        raise HTTPException(status_code=400, detail="You are already linked to this student.")
        
    parent_link = ParentLink(
        parent_id=current_user.id,
        student_id=code_obj.student_id,
        relation_type="Parent",
        is_verified=True
    )
    db.add(parent_link)
    
    code_obj.is_active = False
    code_obj.used_at = datetime.now(timezone.utc)
    code_obj.used_by_parent_id = current_user.id
    
    await db.commit()
    return {"status": "success", "message": "Successfully linked student account."}
