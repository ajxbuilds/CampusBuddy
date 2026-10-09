import pytest
from app.models.user import User

@pytest.mark.asyncio
async def test_unauthorized_access(async_client):
    response = await async_client.get("/api/auth/me")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_auth_roles(async_client, db_session):
    # Setup test users
    from app.core.security import create_access_token
    student = User(id=998, full_name="Student", email="student@test.com", role="STUDENT")
    admin = User(id=999, full_name="Admin", email="admin@test.com", role="ADMIN")
    db_session.add(student)
    db_session.add(admin)
    await db_session.commit()

    student_token = create_access_token(data={"sub": str(student.id), "role": student.role if isinstance(student.role, str) else student.role.value})
    admin_token = create_access_token(data={"sub": str(admin.id), "role": admin.role if isinstance(admin.role, str) else admin.role.value})

    # Test student hitting me
    resp1 = await async_client.get("/api/auth/me", headers={"Authorization": f"Bearer {student_token}"})
    assert resp1.status_code == 200
    assert resp1.json()["role"] == "STUDENT"

    # Test admin hitting admin endpoint
    resp2 = await async_client.get("/api/admin/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp2.status_code == 200

    # Test student hitting admin endpoint
    resp3 = await async_client.get("/api/admin/audit-logs", headers={"Authorization": f"Bearer {student_token}"})
    assert resp3.status_code == 403
