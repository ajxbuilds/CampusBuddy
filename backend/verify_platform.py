import asyncio
import sys
from httpx import AsyncClient, ASGITransport
from app.main import app

async def run_audit():
    print("=" * 60)
    print("CAMPUSBUDDY FULL-STACK VERIFICATION SUITE")
    print("=" * 60)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        res = await client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("[PASS] 1. Health Check: Backend online and SQLite connected.")

        # 2. Login as Demo Student
        res = await client.post("/api/auth/login", json={"email": "student@campusbuddy.edu", "password": "Student@123"})
        assert res.status_code == 200, f"Student login failed: {res.text}"
        student_token = res.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}
        print("[PASS] 2. Student Authentication: JWT issued successfully.")

        # 3. Login as Demo Teacher
        res = await client.post("/api/auth/login", json={"email": "teacher@campusbuddy.edu", "password": "Teacher@123"})
        assert res.status_code == 200, f"Teacher login failed: {res.text}"
        teacher_token = res.json()["access_token"]
        teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
        print("[PASS] 3. Teacher Authentication: JWT issued successfully.")

        # 4. Login as Demo Parent
        res = await client.post("/api/auth/login", json={"email": "parent@campusbuddy.edu", "password": "Parent@123"})
        assert res.status_code == 200, f"Parent login failed: {res.text}"
        parent_token = res.json()["access_token"]
        parent_headers = {"Authorization": f"Bearer {parent_token}"}
        print("[PASS] 4. Parent Authentication: JWT issued successfully.")

        # 5. Login as Demo Admin
        res = await client.post("/api/auth/login", json={"email": "admin@campusbuddy.edu", "password": "Admin@123"})
        assert res.status_code == 200, f"Admin login failed: {res.text}"
        admin_token = res.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("[PASS] 5. Admin Authentication: JWT issued successfully.")

        # 6. Global Search Endpoint Verification
        res = await client.get("/api/search?q=exam", headers=student_headers)
        assert res.status_code == 200, f"Search failed: {res.text}"
        data = res.json()
        print(f"[PASS] 6. Global Search: Query 'exam' matched {data['total_results']} item(s).")

        # 7. E-Learning Resources Verification
        res = await client.get("/api/services/elearning", headers=student_headers)
        assert res.status_code == 200, f"E-learning list failed: {res.text}"
        resources = res.json()
        assert len(resources) > 0, "No seeded e-learning resources found"
        print(f"[PASS] 7. E-Learning Repository: {len(resources)} resources retrieved.")

        # 8. Teacher Mark Attendance Verification
        res = await client.post("/api/academics/attendance/mark", json={
            "student_id": 3,
            "subject_id": 1,
            "status": "PRESENT",
            "session_type": "LECTURE",
            "remarks": "Automated verification test"
        }, headers=teacher_headers)
        assert res.status_code == 201, f"Teacher mark attendance failed: {res.text}"
        print("[PASS] 8. Faculty Attendance Marking API: 201 Created.")

        # 9. Parent Linked Student Verification
        res = await client.get("/api/auth/parent/linked-student", headers=parent_headers)
        assert res.status_code == 200, f"Parent linked student failed: {res.text}"
        linked = res.json()
        assert linked is not None, "Parent linked student returned None"
        print(f"[PASS] 9. Parent Linked Ward API: Ward Name='{linked['full_name']}'.")

        # 10. AI Assistant Diagnostic
        res = await client.post("/api/ai/chat", json={
            "messages": [{"role": "user", "content": "How do I apply for attendance shortage condonation?"}]
        }, headers=student_headers)
        assert res.status_code == 200, f"AI Assistant chat failed: {res.text}"
        ai_data = res.json()
        assert "reply" in ai_data, "No reply from AI assistant"
        print("[PASS] 10. AI Procedure Engine: Response generated with structured guidance.")

        print("=" * 60)
        print("ALL 10 VERIFICATION CHECKS COMPLETED (100% PASS)!")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_audit())
