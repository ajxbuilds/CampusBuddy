import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

async def test_wave3():
    print("=" * 60)
    print("TESTING WAVE 3: STUDENT SERVICES (DOCUMENTS, FEES, E-LEARNING)")
    print("=" * 60)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Student Auth
        res = await client.post("/api/auth/login", json={"email": "student@campusbuddy.edu", "password": "Student@123"})
        assert res.status_code == 200, f"Student login failed: {res.text}"
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("[PASS] 1. Authenticated as student (Aarav Sharma)")

        # 2. Test Multipart Document Upload
        test_file_content = b"%PDF-1.4 Mock ID Proof Document Content for Verification"
        files = {"file": ("student_id_proof.pdf", test_file_content, "application/pdf")}
        data = {"title": "Semester 4 College ID Proof", "category": "ID_PROOF"}
        res = await client.post("/api/services/documents/upload-file", files=files, data=data, headers=headers)
        assert res.status_code == 201, f"Upload document failed: {res.text}"
        doc_data = res.json()
        doc_id = doc_data["id"]
        print(f"[PASS] 2. Multipart file upload successful: Doc ID={doc_id}, Title='{doc_data['title']}'")

        # 3. Test Authenticated Document Download
        res = await client.get(f"/api/services/documents/{doc_id}/download", headers=headers)
        assert res.status_code == 200, f"Download document failed: {res.text}"
        assert len(res.content) > 0, "Downloaded content is empty"
        print(f"[PASS] 3. Authenticated file download verified: Received {len(res.content)} bytes")

        # 4. Test List Documents
        res = await client.get("/api/services/documents", headers=headers)
        assert res.status_code == 200, f"List documents failed: {res.text}"
        docs = res.json()
        assert len(docs) > 0, "Document list returned empty"
        print(f"[PASS] 4. Document listing verified: {len(docs)} documents on record")

        # 5. Test E-Learning Resources Retrieval
        res = await client.get("/api/services/elearning", headers=headers)
        assert res.status_code == 200, f"E-learning resources failed: {res.text}"
        resources = res.json()
        assert len(resources) >= 5, f"Expected at least 5 seeded resources, found {len(resources)}"
        print(f"[PASS] 5. E-Learning repository verified: {len(resources)} resources active")

        # 6. Test E-Learning Resource Download
        el_id = resources[0]["id"]
        res = await client.get(f"/api/services/elearning/{el_id}/download", headers=headers)
        assert res.status_code == 200, f"E-learning download failed: {res.text}"
        assert len(res.content) > 0
        print(f"[PASS] 6. E-Learning download verified: Resource '{resources[0]['title']}' downloaded")

        # 7. Test Fees Summary
        res = await client.get("/api/services/fees", headers=headers)
        assert res.status_code == 200, f"Get fees failed: {res.text}"
        fee_data = res.json()
        assert "pending_fees" in fee_data
        print(f"[PASS] 7. Fee summary verified: Pending=Rs. {fee_data['pending_fees']}, Total=Rs. {fee_data['total_fees']}")

        # 8. Test Delete Document
        res = await client.delete(f"/api/services/documents/{doc_id}", headers=headers)
        assert res.status_code == 200, f"Delete document failed: {res.text}"
        print(f"[PASS] 8. Document cleanup verified: Deleted Doc ID={doc_id}")

        print("=" * 60)
        print("ALL WAVE 3 SERVICES VERIFIED (100% PASS)!")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_wave3())
