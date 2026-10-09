import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy.future import select

from app.core.database import AsyncSessionLocal, engine, Base
from app.models.complaint import ComplaintCategory
from app.models.gamification import Badge

async def seed_database():
    print("[INIT] Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        print("[SEED] Seeding categories idempotently...")
        categories_data = [
            {"name": "Academic", "code": "ACADEMIC", "department": "Academic Affairs", "sla_hours": 48, "description": "Curriculum, attendance, syllabus, and course credit queries"},
            {"name": "Faculty", "code": "FACULTY", "department": "Faculty Affairs", "sla_hours": 72, "description": "Faculty grievances, lecture scheduling, and mentorship"},
            {"name": "Examination", "code": "EXAMINATION", "department": "Exam Section", "sla_hours": 36, "description": "Hall tickets, re-evaluation, marksheet corrections, and timetables"},
            {"name": "Fees & Accounts", "code": "FEES", "department": "Finance & Accounts", "sla_hours": 24, "description": "Payment receipts, refund requests, challans, and portal dues"},
            {"name": "Scholarship", "code": "SCHOLARSHIP", "department": "Student Welfare", "sla_hours": 72, "description": "Government and merit scholarship approvals and verifications"},
            {"name": "Hostel", "code": "HOSTEL", "department": "Hostel Wardens Cell", "sla_hours": 24, "description": "Room maintenance, mess food quality, water, and electricity"},
            {"name": "Infrastructure", "code": "INFRASTRUCTURE", "department": "Estate & Maintenance", "sla_hours": 48, "description": "Classroom projectors, labs, air conditioning, and elevators"},
            {"name": "Transport", "code": "TRANSPORT", "department": "Campus Transport Desk", "sla_hours": 48, "description": "College bus routes, driver conduct, and bus pass renewals"},
            {"name": "Administration", "code": "ADMINISTRATION", "department": "Registrar Office", "sla_hours": 48, "description": "Bonafide certificates, transfer documents, and ID cards"},
            {"name": "Harassment / ICC", "code": "HARASSMENT", "department": "Internal Complaints Committee", "sla_hours": 12, "description": "Zero-tolerance anti-ragging, bullying, and grievance cell"},
            {"name": "Technical / IT", "code": "TECHNICAL", "department": "IT Support Services", "sla_hours": 24, "description": "Campus Wi-Fi, ERP login issues, and lab software"}
        ]

        for c in categories_data:
            existing = await db.execute(select(ComplaintCategory).where(ComplaintCategory.code == c["code"]))
            if not existing.scalars().first():
                cat = ComplaintCategory(**c)
                db.add(cat)

        print("[SEED] Seeding badges idempotently...")
        badges_data = [
            {"name": "First Helper", "points_threshold": 5, "icon": "HandHeart", "description": "Contributed first helpful community answer"},
            {"name": "Problem Solver", "points_threshold": 25, "icon": "CheckCircle2", "description": "Had an answer accepted as the official solution"},
            {"name": "Community Star", "points_threshold": 50, "icon": "Star", "description": "Accumulated 50 reputation points in the community"},
            {"name": "Top Contributor", "points_threshold": 150, "icon": "Award", "description": "Demonstrated persistent college problem-solving expertise"},
            {"name": "Trusted Buddy", "points_threshold": 300, "icon": "ShieldCheck", "description": "Elite campus helper trusted by students and faculty"}
        ]

        for b in badges_data:
            existing = await db.execute(select(Badge).where(Badge.name == b["name"]))
            if not existing.scalars().first():
                badge = Badge(**b)
                db.add(badge)

        await db.commit()
        print("[SEED] Reference data seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_database())
