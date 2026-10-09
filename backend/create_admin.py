import asyncio
import os
import sys
from datetime import datetime, timezone
from sqlalchemy.future import select

# Ensure we can import app modules when run directly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole

async def provision_admin():
    email = os.environ.get("ADMIN_EMAIL")
    password = os.environ.get("ADMIN_PASSWORD")
    name = os.environ.get("ADMIN_NAME", "System Administrator")

    if not email or not password:
        print("[ERROR] ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.")
        sys.exit(1)

    # Basic input verification
    if "@" not in email:
        print("[ERROR] Invalid email format.")
        sys.exit(1)

    if len(password) < 8:
        print("[ERROR] Password must be at least 8 characters long.")
        sys.exit(1)

    async with AsyncSessionLocal() as db:
        # Check if user already exists
        existing = await db.execute(select(User).where(User.email == email))
        user = existing.scalars().first()

        if user:
            if user.role == UserRole.ADMIN:
                print(f"[INFO] Admin account '{email}' already exists. No action taken to prevent silent resets.")
                sys.exit(0)
            else:
                print(f"[ERROR] An account with '{email}' already exists but is not an ADMIN. Cannot downgrade or hijack existing user.")
                sys.exit(1)

        print(f"[PROVISION] Creating new Admin account for '{email}'...")
        admin = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=name,
            role=UserRole.ADMIN,
            department="Central Administration",
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(admin)
        await db.commit()
        print("[PROVISION] Administrator account successfully provisioned.")

if __name__ == "__main__":
    asyncio.run(provision_admin())
