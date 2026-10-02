import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

async def test_backend():
    print("[TEST] Running automated backend validation test suite...")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Health check
        res = await ac.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("  - [PASS] Health check passed:", res.json())

        # 2. Login as Student
        login_res = await ac.post("/api/auth/login", json={"email": "student@campusbuddy.edu", "password": "Student@123"})
        assert login_res.status_code == 200, f"Student login failed: {login_res.text}"
        data = login_res.json()
        token = data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("  - [PASS] Student login successful (User:", data["user"]["full_name"], "Role:", data["user"]["role"], ")")

        # 3. Categories
        cat_res = await ac.get("/api/complaints/categories", headers=headers)
        assert cat_res.status_code == 200
        cats = cat_res.json()
        assert len(cats) >= 10
        print(f"  - [PASS] Retrieved {len(cats)} complaint categories")

        # 4. Student Complaints
        cmp_res = await ac.get("/api/complaints/", headers=headers)
        assert cmp_res.status_code == 200
        complaints = cmp_res.json()
        print(f"  - [PASS] Student complaints list: {len(complaints)} complaints found (First code: {complaints[0]['complaint_code']})")

        # 5. AI Guidance
        ai_res = await ac.post("/api/ai/chat", headers=headers, json={
            "messages": [{"role": "user", "content": "My semester fee receipt is not reflecting on the portal, what should I do?"}]
        })
        assert ai_res.status_code == 200
        ai_data = ai_res.json()
        assert ai_data["structured_advice"]["suggested_category"] == "FEES"
        print("  - [PASS] AI procedure diagnosis accurate (Category:", ai_data["structured_advice"]["suggested_category"], ", Office:", ai_data["structured_advice"]["contact_office"], ")")

        # 6. Community Q&A
        comm_res = await ac.get("/api/community/posts", headers=headers)
        assert comm_res.status_code == 200
        posts = comm_res.json()
        print(f"  - [PASS] Community Q&A retrieved: {len(posts)} questions found")

        # 7. Gamification Leaderboard
        lead_res = await ac.get("/api/gamification/leaderboard?period=all-time", headers=headers)
        assert lead_res.status_code == 200
        leaders = lead_res.json()["leaders"]
        print(f"  - [PASS] Leaderboard active with {len(leaders)} users. Top leader: {leaders[0]['full_name']} ({leaders[0]['points']} pts)")

        # 8. Admin login and metrics
        admin_login = await ac.post("/api/auth/login", json={"email": "admin@campusbuddy.edu", "password": "Admin@123"})
        assert admin_login.status_code == 200
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        stats_res = await ac.get("/api/admin/stats", headers=admin_headers)
        assert stats_res.status_code == 200
        stats = stats_res.json()
        print(f"  - [PASS] Admin dashboard KPIs: Total={stats['total_complaints']}, Pending={stats['pending_complaints']}, InProgress={stats['in_progress_complaints']}, Escalated={stats['escalated_complaints']}")

    print("[SUCCESS] All backend API validation tests passed with flying colors!")

if __name__ == "__main__":
    asyncio.run(test_backend())
