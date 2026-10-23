import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.complaint import ComplaintCategory
from app.models.gamification import Badge

DEFAULT_CATEGORIES = [
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

DEFAULT_BADGES = [
    {"name": "First Helper", "points_threshold": 5, "icon": "HandHeart", "description": "Contributed first helpful community answer"},
    {"name": "Problem Solver", "points_threshold": 25, "icon": "CheckCircle2", "description": "Had an answer accepted as the official solution"},
    {"name": "Community Star", "points_threshold": 50, "icon": "Star", "description": "Accumulated 50 reputation points in the community"},
    {"name": "Top Contributor", "points_threshold": 150, "icon": "Award", "description": "Demonstrated persistent college problem-solving expertise"},
    {"name": "Trusted Buddy", "points_threshold": 300, "icon": "ShieldCheck", "description": "Elite campus helper trusted by students and faculty"}
]

async def seed_categories_if_empty(db: AsyncSession):
    try:
        added = False
        for c in DEFAULT_CATEGORIES:
            existing = await db.execute(select(ComplaintCategory).where(ComplaintCategory.code == c["code"]))
            if not existing.scalars().first():
                db.add(ComplaintCategory(**c))
                added = True
        if added:
            await db.commit()
    except Exception as e:
        await db.rollback()
        logging.warning(f"Error seeding categories: {e}")

async def seed_badges_if_empty(db: AsyncSession):
    try:
        added = False
        for b in DEFAULT_BADGES:
            existing = await db.execute(select(Badge).where(Badge.name == b["name"]))
            if not existing.scalars().first():
                db.add(Badge(**b))
                added = True
        if added:
            await db.commit()
    except Exception as e:
        await db.rollback()
        logging.warning(f"Error seeding badges: {e}")

async def seed_all_reference_data(db: AsyncSession):
    await seed_categories_if_empty(db)
    await seed_badges_if_empty(db)
