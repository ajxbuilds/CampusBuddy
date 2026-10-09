import json
import json
import pytest
from app.models.user import User, UserRole, StudentProfile
from app.core.security import create_access_token

from app.core.security import get_password_hash
@pytest.fixture
async def setup_users(db_session):
    hashed = get_password_hash("testpassword")
    student = User(email="student@test.com", full_name="Student One", role=UserRole.STUDENT, auth_provider="local", hashed_password=hashed)
    teacher = User(email="teacher@test.com", full_name="Teacher One", role=UserRole.TEACHER, auth_provider="local", hashed_password=hashed)
    admin = User(email="admin@test.com", full_name="Admin One", role=UserRole.ADMIN, auth_provider="local", hashed_password=hashed)
    db_session.add_all([student, teacher, admin])
    await db_session.commit()
    await db_session.refresh(student)
    await db_session.refresh(teacher)
    await db_session.refresh(admin)

    # Need student profile for community/gamification
    profile = StudentProfile(user_id=student.id, roll_number="123", semester=1, total_points=0)
    db_session.add(profile)
    await db_session.commit()



    from app.models.complaint import ComplaintCategory
    cat = ComplaintCategory(name="Infrastructure", code="INFRA", department="IT", description="Building and Facilities")
    db_session.add(cat)
    await db_session.commit()
    await db_session.refresh(cat)

    return {"category_id": cat.id,


        "student": {"user": student, "token": create_access_token({"sub": str(student.id), "role": student.role.value})},
        "teacher": {"user": teacher, "token": create_access_token({"sub": str(teacher.id), "role": teacher.role.value})},
        "admin": {"user": admin, "token": create_access_token({"sub": str(admin.id), "role": admin.role.value})},
    }


@pytest.mark.asyncio
async def test_admin_login_security(async_client, setup_users):
    # 1. Valid Admin Login
    resp = await async_client.post("/api/auth/login", json={"email": "admin@test.com", "password": "testpassword", "role": "ADMIN"})
    assert resp.status_code == 200
    assert resp.json()["user"]["role"] == "ADMIN"

    # 2. Incorrect Credentials
    resp = await async_client.post("/api/auth/login", json={"email": "admin@test.com", "password": "wrongpassword", "role": "ADMIN"})
    assert resp.status_code == 401

    # 3. Role Mismatch: Student tries to log in as ADMIN
    resp = await async_client.post("/api/auth/login", json={"email": "student@test.com", "password": "testpassword", "role": "ADMIN"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_auth_rbac(async_client, setup_users):
    users = setup_users

    # 1. Valid login succeeds (mocked via token here)
    resp = await async_client.get("/api/auth/me", headers={"Authorization": f"Bearer {users['student']['token']}"})
    assert resp.status_code == 200
    assert resp.json()["role"] == "STUDENT"

    # 2. Invalid tokens are rejected
    resp = await async_client.get("/api/auth/me", headers={"Authorization": f"Bearer invalid_token_123"})
    assert resp.status_code == 401

    # 3. Unauthorized complaint access (Student trying to access admin audit logs)
    resp = await async_client.get("/api/admin/audit-logs", headers={"Authorization": f"Bearer {users['student']['token']}"})
    assert resp.status_code == 403

    # 4. Teacher trying to access admin audit logs
    resp = await async_client.get("/api/admin/audit-logs", headers={"Authorization": f"Bearer {users['teacher']['token']}"})
    assert resp.status_code == 403

    # 5. Admin can access admin audit logs
    resp = await async_client.get("/api/admin/audit-logs", headers={"Authorization": f"Bearer {users['admin']['token']}"})
    assert resp.status_code == 200

@pytest.mark.asyncio
async def test_community_workflow(async_client, setup_users):
    users = setup_users
    student_headers = {"Authorization": f"Bearer {users['student']['token']}"}

    # Create question
    post_data = {"title": "Test Question", "content": "How do I do X?", "category": "ACADEMIC", "attachments": []}
    resp = await async_client.post("/api/community/posts", json=post_data, headers=student_headers)
    print("RESPONSE:", resp.text)
    assert resp.status_code == 201
    post_id = resp.json()["id"]

    # Retrieve question
    resp = await async_client.get("/api/community/posts", headers=student_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    # Add answer
    answer_data = {"content": "You do X like this."}
    resp = await async_client.post(f"/api/community/posts/{post_id}/answers", json=answer_data, headers=student_headers)
    print("RESPONSE:", resp.text)
    assert resp.status_code == 201
    answer_id = resp.json()["id"]

    # Vote
    resp = await async_client.post("/api/community/vote", json={"target_type": "POST", "target_id": post_id, "vote_type": "UPVOTE"}, headers=student_headers)
    assert resp.status_code == 200

@pytest.mark.asyncio
async def test_complaints_workflow(async_client, setup_users):
    users = setup_users
    student_headers = {"Authorization": f"Bearer {users['student']['token']}"}
    admin_headers = {"Authorization": f"Bearer {users['admin']['token']}"}

    # Submit complaint
    comp_data = {"title": "Broken AC", "description": "AC is broken", "category_id": users["category_id"], "priority": "HIGH"}
    import json
    resp = await async_client.post("/api/complaints/", json=comp_data, headers=student_headers)
    print("RESPONSE:", resp.text)
    assert resp.status_code == 201
    comp_id = resp.json()["id"]

    # Admin view complaint
    resp = await async_client.get("/api/admin/audit-logs", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 1

@pytest.mark.asyncio
async def test_admin_audit(async_client, setup_users):
    users = setup_users
    admin_headers = {"Authorization": f"Bearer {users['admin']['token']}"}

    resp = await async_client.get("/api/admin/audit-logs", headers=admin_headers)
    assert resp.status_code == 200

@pytest.mark.asyncio
async def test_ai_mocked(async_client, setup_users, monkeypatch):
    users = setup_users
    student_headers = {"Authorization": f"Bearer {users['student']['token']}"}

    # Mock the Gemini function internally so it's deterministic
    from app.services import ai_service
    async def mock_generate_guidance(*args, **kwargs):
        from app.schemas.ai import AIChatResponse, AIProcedureAdvice
        return AIChatResponse(
            reply="Mocked AI Response",
            structured_advice=AIProcedureAdvice(suggested_category="GENERAL", suggested_priority="LOW", recommended_action="", required_documents=[], contact_office="", guidance_text="", disclaimer="")
        )
    import app.api.ai_assistant
    monkeypatch.setattr(app.api.ai_assistant, "generate_guidance", mock_generate_guidance)

    payload = {"messages": [{"role": "user", "content": "help me file a complaint"}], "context_category": "GENERAL"}
    resp = await async_client.post("/api/ai/chat", json=payload, headers=student_headers)
    assert resp.status_code == 200
    assert resp.json()["reply"] == "Mocked AI Response"

@pytest.mark.asyncio
async def test_ai_static_greeting(async_client, setup_users):
    users = setup_users
    student_headers = {"Authorization": f"Bearer {users['student']['token']}"}
    payload = {"messages": [{"role": "user", "content": "hi"}], "context_category": "GENERAL"}
    resp = await async_client.post("/api/ai/chat", json=payload, headers=student_headers)
    assert resp.status_code == 200
    assert len(resp.json()["reply"]) > 20
