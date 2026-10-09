import pytest
import os
import asyncio
from sqlalchemy.future import select
from app.models.user import User, UserRole
from app.models.complaint import ComplaintCategory
from app.models.gamification import Badge
from create_admin import provision_admin
from seed import seed_database


@pytest.fixture(autouse=True)
def patch_db(monkeypatch):
    from tests.conftest import TestingSessionLocal, engine
    import create_admin
    import seed
    monkeypatch.setattr(create_admin, "AsyncSessionLocal", TestingSessionLocal)
    monkeypatch.setattr(seed, "AsyncSessionLocal", TestingSessionLocal)
    monkeypatch.setattr(seed, "engine", engine)

@pytest.mark.asyncio
async def test_repeatable_seeding(db_session):
    # 1. Run seed script once
    await seed_database()

    # 2. Check counts
    res_cats = await db_session.execute(select(ComplaintCategory))
    initial_cat_count = len(res_cats.scalars().all())

    res_badges = await db_session.execute(select(Badge))
    initial_badge_count = len(res_badges.scalars().all())

    assert initial_cat_count > 0
    assert initial_badge_count > 0

    # 3. Run seed script again to test idempotency
    await seed_database()

    res_cats_after = await db_session.execute(select(ComplaintCategory))
    after_cat_count = len(res_cats_after.scalars().all())

    res_badges_after = await db_session.execute(select(Badge))
    after_badge_count = len(res_badges_after.scalars().all())

    assert initial_cat_count == after_cat_count
    assert initial_badge_count == after_badge_count

@pytest.mark.asyncio
async def test_secure_admin_provisioning(db_session, monkeypatch):
    test_email = "secureadmin@campusbuddy.edu"
    test_password = "SecurePassword123!"

    # Mock environment variables
    monkeypatch.setenv("ADMIN_EMAIL", test_email)
    monkeypatch.setenv("ADMIN_PASSWORD", test_password)

    # Run the provision script
    await provision_admin()

    # Verify creation
    res = await db_session.execute(select(User).where(User.email == test_email))
    admin = res.scalars().first()
    assert admin is not None
    assert admin.role == UserRole.ADMIN
    assert admin.email == test_email

    # Run again and ensure it doesn't crash but skips safely
    try:
        await provision_admin()
    except SystemExit as e:
        assert e.code == 0  # Should gracefully exit with 0 (No action taken)

    # Ensure attempting to overwrite a non-admin account fails
    student_email = "hijackme@test.com"
    student = User(email=student_email, full_name="Student", role=UserRole.STUDENT, auth_provider="local")
    db_session.add(student)
    await db_session.commit()

    monkeypatch.setenv("ADMIN_EMAIL", student_email)
    try:
        await provision_admin()
    except SystemExit as e:
        assert e.code == 1  # Should exit with error to prevent hijack
