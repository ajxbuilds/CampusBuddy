import asyncio
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.academic import FacultyMember, Subject, AttendanceRecord, TimetableEntry, Exam
from app.models.services import FeeItem, FeePayment, FeeReceipt, DocumentRecord, CollegeNotice
from app.services.ai_service import generate_guidance
from app.schemas.ai import AIChatMessage

async def verify_platform():
    print("--- CAMPUSBUDDY COMPLETE PLATFORM VERIFICATION ---")
    async with AsyncSessionLocal() as db:
        # Check Faculty
        f_res = await db.execute(select(FacultyMember))
        faculties = f_res.scalars().all()
        print(f"[OK] Faculty members: {len(faculties)}")
        assert len(faculties) >= 4, "Expected at least 4 faculty members"

        # Check Subjects
        s_res = await db.execute(select(Subject))
        subjects = s_res.scalars().all()
        print(f"[OK] Subjects: {len(subjects)}")
        assert len(subjects) >= 4, "Expected at least 4 subjects"

        # Check Timetable
        t_res = await db.execute(select(TimetableEntry))
        timetable = t_res.scalars().all()
        print(f"[OK] Timetable entries: {len(timetable)}")
        assert len(timetable) >= 15, "Expected full timetable"

        # Check Attendance
        a_res = await db.execute(select(AttendanceRecord))
        attendance = a_res.scalars().all()
        present = sum(1 for a in attendance if a.status == "PRESENT")
        overall_pct = (present / len(attendance) * 100) if attendance else 0
        print(f"[OK] Attendance records: {len(attendance)}, Overall: {overall_pct:.1f}%")
        assert len(attendance) > 100, "Expected full semester attendance records"

        # Check Fees
        fee_res = await db.execute(select(FeeItem))
        fees = fee_res.scalars().all()
        print(f"[OK] Fee items: {len(fees)}")
        assert len(fees) >= 4, "Expected 4 fee items"

        # Check Receipts
        rec_res = await db.execute(select(FeeReceipt))
        receipts = rec_res.scalars().all()
        print(f"[OK] Fee receipts: {len(receipts)}")
        assert len(receipts) >= 3, "Expected 3 fee receipts"

        # Check Documents
        doc_res = await db.execute(select(DocumentRecord))
        docs = doc_res.scalars().all()
        print(f"[OK] Documents: {len(docs)}")
        assert len(docs) >= 5, "Expected 5 documents"

        # Check Notices
        n_res = await db.execute(select(CollegeNotice))
        notices = n_res.scalars().all()
        print(f"[OK] College notices: {len(notices)}")
        assert len(notices) >= 5, "Expected 5 notices"

        # Check AI live data query
        u_res = await db.execute(select(User).where(User.email == "student@campusbuddy.edu"))
        student = u_res.scalars().first()

        ai_res = await generate_guidance(
            messages=[AIChatMessage(role="user", content="What is my attendance percentage and next class?")],
            current_user=student,
            db=db
        )
        print("\n--- AI Assistant Response Sample ---")
        print(ai_res.reply[:300].encode('ascii', 'replace').decode('ascii') + "...\n")
        assert "Attendance Overview" in ai_res.reply or "Live" in ai_res.reply

    print("ALL BACKEND DIGITAL CAMPUS VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(verify_platform())
