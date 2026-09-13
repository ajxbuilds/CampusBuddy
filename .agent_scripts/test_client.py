from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

res = client.post("/api/auth/login", json={
    "email": "student@campusbuddy.edu",
    "password": "Student@123"
})
token = res.json()["access_token"]

try:
    res = client.get("/api/auth/parent/link-code", headers={"Authorization": f"Bearer {token}"})
    print(res.status_code)
    print(res.text)
except Exception as e:
    import traceback
    traceback.print_exc()
