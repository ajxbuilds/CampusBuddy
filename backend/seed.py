import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy.future import select

from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole, StudentProfile, ParentLink
from app.models.complaint import (
    Complaint,
    ComplaintCategory,
    ComplaintStatus,
    ComplaintPriority,
    ComplaintStatusHistory,
    ComplaintEscalation,
    EscalationStatus,
)
from app.models.community import CommunityPost, CommunityAnswer, Vote, VoteTargetType
from app.models.gamification import Badge, UserBadge, PointTransaction
from app.models.notification import Notification, NotificationType
from app.models.audit import AuditLog


async def seed_database():
    print("[INIT] Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Check if base seeded
        res = await db.execute(select(User).where(User.email == "admin@campusbuddy.edu"))
        if res.scalars().first():
            print("[INFO] Base users already seeded. Skipping.")
            return

        print("[SEED] Seeding categories...")
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
        cat_objs = {}
        for c in categories_data:
            cat = ComplaintCategory(**c)
            db.add(cat)
            cat_objs[c["code"]] = cat
        await db.flush()

        print("[SEED] Seeding badges...")
        badges_data = [
            {"name": "First Helper", "points_threshold": 5, "icon": "HandHeart", "description": "Contributed first helpful community answer"},
            {"name": "Problem Solver", "points_threshold": 25, "icon": "CheckCircle2", "description": "Had an answer accepted as the official solution"},
            {"name": "Community Star", "points_threshold": 50, "icon": "Star", "description": "Accumulated 50 reputation points in the community"},
            {"name": "Top Contributor", "points_threshold": 150, "icon": "Award", "description": "Demonstrated persistent college problem-solving expertise"},
            {"name": "Trusted Buddy", "points_threshold": 300, "icon": "ShieldCheck", "description": "Elite campus helper trusted by students and faculty"}
        ]
        badge_objs = {}
        for b in badges_data:
            badge = Badge(**b)
            db.add(badge)
            badge_objs[b["name"]] = badge
        await db.flush()

        print("[SEED] Seeding demo users...")
        now = datetime.now(timezone.utc)

        # 1. Admin
        admin = User(
            email="admin@campusbuddy.edu",
            hashed_password=get_password_hash("Admin@123"),
            full_name="System Admin",
            role=UserRole.ADMIN,
            department="Central Administration",
            phone="+91 98765 43210",
            avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=SysAdmin",
            is_active=True,
            created_at=now - timedelta(days=60)
        )
        db.add(admin)

        # 2. Teacher
        teacher = User(
            email="teacher@campusbuddy.edu",
            hashed_password=get_password_hash("Teacher@123"),
            full_name="Prof. Vikram Malhotra",
            role=UserRole.TEACHER,
            department="Academic Affairs",
            phone="+91 98765 43211",
            avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=ProfVikram",
            is_active=True,
            created_at=now - timedelta(days=45)
        )
        db.add(teacher)

        # 3. Student 1 (Aarav Sharma)
        student1 = User(
            email="student@campusbuddy.edu",
            hashed_password=get_password_hash("Student@123"),
            full_name="Aarav Sharma",
            role=UserRole.STUDENT,
            department="Computer Science & Engineering",
            phone="+91 98765 43212",
            avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav",
            is_active=True,
            created_at=now - timedelta(days=30)
        )
        db.add(student1)
        await db.flush()

        prof1 = StudentProfile(
            user_id=student1.id,
            roll_number="CS2023042",
            semester=4,
            program="B.Tech Computer Science",
            total_points=85
        )
        db.add(prof1)

        # 4. Student 2 (Priya Patel)
        student2 = User(
            email="priya@campusbuddy.edu",
            hashed_password=get_password_hash("Student@123"),
            full_name="Priya Patel",
            role=UserRole.STUDENT,
            department="Information Technology",
            phone="+91 98765 43213",
            avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
            is_active=True,
            created_at=now - timedelta(days=25)
        )
        db.add(student2)
        await db.flush()

        prof2 = StudentProfile(
            user_id=student2.id,
            roll_number="IT2023018",
            semester=4,
            program="B.Tech Information Technology",
            total_points=40
        )
        db.add(prof2)

        # 5. Parent (Linked to Aarav Sharma)
        parent = User(
            email="parent@campusbuddy.edu",
            hashed_password=get_password_hash("Parent@123"),
            full_name="Sunil Sharma",
            role=UserRole.PARENT,
            department=None,
            phone="+91 98765 43214",
            avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=SunilSharma",
            is_active=True,
            created_at=now - timedelta(days=20)
        )
        db.add(parent)
        await db.flush()

        parent_link = ParentLink(
            parent_id=parent.id,
            student_id=student1.id,
            relation_type="Father",
            is_verified=True
        )
        db.add(parent_link)

        print("[SEED] Seeding Badges & Points awards...")
        # Assign badges to Aarav
        db.add(UserBadge(user_id=student1.id, badge_id=badge_objs["First Helper"].id, awarded_at=now - timedelta(days=20)))
        db.add(UserBadge(user_id=student1.id, badge_id=badge_objs["Problem Solver"].id, awarded_at=now - timedelta(days=12)))
        db.add(UserBadge(user_id=student1.id, badge_id=badge_objs["Community Star"].id, awarded_at=now - timedelta(days=5)))

        # Assign First Helper to Priya
        db.add(UserBadge(user_id=student2.id, badge_id=badge_objs["First Helper"].id, awarded_at=now - timedelta(days=10)))

        # Points ledger for Aarav
        db.add(PointTransaction(user_id=student1.id, points=5, reason="Answered peer question on Semester 4 Electives", reference_type="ANSWER_POSTED", reference_id=1, created_at=now - timedelta(days=20)))
        db.add(PointTransaction(user_id=student1.id, points=10, reason="Received helpful upvote on Electives answer", reference_type="HELPFUL_UPVOTE", reference_id=1, created_at=now - timedelta(days=18)))
        db.add(PointTransaction(user_id=student1.id, points=20, reason="Answer marked as accepted solution", reference_type="ACCEPTED_ANSWER", reference_id=1, created_at=now - timedelta(days=12)))
        db.add(PointTransaction(user_id=student1.id, points=50, reason="Active community peer support bonus", reference_type="COMMUNITY_BONUS", reference_id=None, created_at=now - timedelta(days=5)))

        # Points ledger for Priya
        db.add(PointTransaction(user_id=student2.id, points=5, reason="Answered question on Hostel Wi-Fi setup", reference_type="ANSWER_POSTED", reference_id=2, created_at=now - timedelta(days=10)))
        db.add(PointTransaction(user_id=student2.id, points=10, reason="Received helpful upvote", reference_type="HELPFUL_UPVOTE", reference_id=2, created_at=now - timedelta(days=8)))
        db.add(PointTransaction(user_id=student2.id, points=25, reason="Active peer contributor bonus", reference_type="COMMUNITY_BONUS", reference_id=None, created_at=now - timedelta(days=2)))

        print("[SEED] Seeding Complaints...")
        # 1. Aarav's In-Progress Complaint (Fee portal discrepancy)
        cmp1 = Complaint(
            complaint_code="CB-2026-001245",
            student_id=student1.id,
            category_id=cat_objs["FEES"].id,
            title="Semester 4 Tuition Fee payment debited but showing pending on ERP",
            description="I paid my Semester 4 tuition fee of Rs 48,500 via NetBanking on 2nd March. Bank UTR reference is HDFC98432174. However, the student ERP still shows tuition fee pending and late fine warnings.",
            priority=ComplaintPriority.HIGH,
            status=ComplaintStatus.IN_PROGRESS,
            assigned_to=teacher.id,
            attachment_url="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60",
            sla_deadline=now + timedelta(hours=14),
            created_at=now - timedelta(days=2),
            updated_at=now - timedelta(hours=6)
        )
        db.add(cmp1)
        await db.flush()

        db.add(ComplaintStatusHistory(
            complaint_id=cmp1.id,
            changed_by=student1.id,
            from_status=None,
            to_status="SUBMITTED",
            remarks="Complaint registered by student with transaction receipt.",
            created_at=now - timedelta(days=2)
        ))
        db.add(ComplaintStatusHistory(
            complaint_id=cmp1.id,
            changed_by=admin.id,
            from_status="SUBMITTED",
            to_status="UNDER_REVIEW",
            remarks="Admin reviewed UTR number, escalated to Accounts desk.",
            created_at=now - timedelta(days=1, hours=18)
        ))
        db.add(ComplaintStatusHistory(
            complaint_id=cmp1.id,
            changed_by=admin.id,
            from_status="UNDER_REVIEW",
            to_status="IN_PROGRESS",
            remarks="Assigned to Prof. Vikram Malhotra (Finance & Accounts liaison) for merchant bank reconciliation.",
            created_at=now - timedelta(hours=6)
        ))

        # 2. Aarav's Escalated Complaint (Hostel Wi-Fi down)
        cmp2 = Complaint(
            complaint_code="CB-2026-001246",
            student_id=student1.id,
            category_id=cat_objs["HOSTEL"].id,
            title="Block C 3rd Floor Wi-Fi access point completely dead for 5 days",
            description="The Wi-Fi router on Block C, 3rd floor went down on Monday. Over 30 students are unable to submit lab assignments. Standard SLA of 24h was exceeded.",
            priority=ComplaintPriority.CRITICAL,
            status=ComplaintStatus.ESCALATED,
            assigned_to=admin.id,
            is_escalated=True,
            sla_deadline=now - timedelta(hours=48), # Breached SLA
            created_at=now - timedelta(days=4),
            updated_at=now - timedelta(hours=12)
        )
        db.add(cmp2)
        await db.flush()

        db.add(ComplaintStatusHistory(
            complaint_id=cmp2.id,
            changed_by=student1.id,
            from_status=None,
            to_status="SUBMITTED",
            remarks="Initial report filed.",
            created_at=now - timedelta(days=4)
        ))
        db.add(ComplaintStatusHistory(
            complaint_id=cmp2.id,
            changed_by=student1.id,
            from_status="SUBMITTED",
            to_status="ESCALATED",
            remarks="SLA breached (>72h without technician visit). Student requested priority admin escalation.",
            created_at=now - timedelta(hours=12)
        ))

        db.add(ComplaintEscalation(
            complaint_id=cmp2.id,
            requested_by=student1.id,
            level="LEVEL_1",
            reason="SLA exceeded by over 48 hours. Exams are approaching and internet access in hostel is essential for project submissions.",
            sla_breached=True,
            status=EscalationStatus.PENDING,
            created_at=now - timedelta(hours=12)
        ))

        # 3. Priya's Resolved Complaint (Marksheet name typo)
        cmp3 = Complaint(
            complaint_code="CB-2026-001247",
            student_id=student2.id,
            category_id=cat_objs["EXAMINATION"].id,
            title="Typo in mother's name on Semester 3 Grade Card",
            description="My Sem 3 grade card printed 'Sunitaben' instead of 'Sunita Patel'. Submitted 10th marksheet for verification.",
            priority=ComplaintPriority.MEDIUM,
            status=ComplaintStatus.RESOLVED,
            assigned_to=admin.id,
            created_at=now - timedelta(days=10),
            updated_at=now - timedelta(days=3),
            resolved_at=now - timedelta(days=3)
        )
        db.add(cmp3)
        await db.flush()

        db.add(ComplaintStatusHistory(
            complaint_id=cmp3.id,
            changed_by=admin.id,
            from_status="IN_PROGRESS",
            to_status="RESOLVED",
            remarks="Corrected in the university master ledger. Revised marksheet issued at Exam Cell Counter 4.",
            created_at=now - timedelta(days=3)
        ))

        print("[SEED] Seeding Community Q&A...")
        # Question 1
        post1 = CommunityPost(
            author_id=student2.id,
            title="Which elective to choose between Cloud Computing and AI/ML for Sem 5?",
            content="Looking for guidance on grading curves, lab workload, and placement opportunities between Cloud Computing (Prof. Deshmukh) and AI/ML (Prof. Vikram). Any insights from seniors who took them?",
            category="Academics",
            views=142,
            upvotes_count=8,
            answers_count=2,
            has_accepted_answer=True,
            created_at=now - timedelta(days=15)
        )
        db.add(post1)
        await db.flush()

        # Answer 1 (Accepted Solution by Aarav)
        ans1 = CommunityAnswer(
            post_id=post1.id,
            author_id=student1.id,
            content="Both courses are high quality. If your goal is DevOps/Backend, Cloud Computing gives hands-on AWS credits and Terraform experience. If you enjoy Python, mathematics, and data pipelines, AI/ML is fantastic. Grading in AI/ML is slightly stricter on project vivas, while Cloud focuses more on lab submissions.",
            upvotes_count=12,
            is_accepted=True,
            is_faculty_endorsed=False,
            created_at=now - timedelta(days=14)
        )
        db.add(ans1)

        # Answer 2 (Faculty Endorsed by Prof. Vikram)
        ans2 = CommunityAnswer(
            post_id=post1.id,
            author_id=teacher.id,
            content="Official note from the Academic department: Both electives count equally for honors degrees. We recommend choosing based on your final year capstone domain. Detailed syllabus comparisons are available in the department notice board.",
            upvotes_count=15,
            is_accepted=False,
            is_faculty_endorsed=True,
            created_at=now - timedelta(days=13)
        )
        db.add(ans2)

        # Question 2
        post2 = CommunityPost(
            author_id=student1.id,
            title="How do I get library remote VPN access during vacation?",
            content="I need IEEE Xplore and Springer access from home for my research paper literature review. Does the college IT cell offer OpenVPN credentials?",
            category="Technical",
            views=98,
            upvotes_count=5,
            answers_count=1,
            has_accepted_answer=False,
            created_at=now - timedelta(days=6)
        )
        db.add(post2)
        await db.flush()

        ans3 = CommunityAnswer(
            post_id=post2.id,
            author_id=student2.id,
            content="Yes! Go to library.campusbuddy.edu/remote-access, login with your college email (roll@campusbuddy.edu), and activate FortiClient SSO. No manual ticket needed!",
            upvotes_count=4,
            is_accepted=False,
            is_faculty_endorsed=False,
            created_at=now - timedelta(days=5)
        )
        db.add(ans3)

        print("[SEED] Seeding Notifications...")
        db.add(Notification(
            user_id=student1.id,
            title="Complaint Assigned: #CB-2026-001245",
            message="Your fee complaint has been assigned to Prof. Vikram Malhotra for verification.",
            type=NotificationType.COMPLAINT,
            link=f"/complaints/{cmp1.id}",
            is_read=False,
            created_at=now - timedelta(hours=6)
        ))
        db.add(Notification(
            user_id=student1.id,
            title="Answer Accepted as Verified Solution!",
            message="Priya Patel marked your advice on Sem 5 Electives as the accepted solution (+20 Points)!",
            type=NotificationType.COMMUNITY,
            link=f"/community/{post1.id}",
            is_read=True,
            created_at=now - timedelta(days=12)
        ))
        db.add(Notification(
            user_id=parent.id,
            title="Student Complaint In Progress",
            message="Aarav's complaint #CB-2026-001245 is currently under active review by the Accounts department.",
            type=NotificationType.COMPLAINT,
            link=f"/complaints/{cmp1.id}",
            is_read=False,
            created_at=now - timedelta(hours=6)
        ))

        print("[SEED] Seeding Audit Logs...")
        db.add(AuditLog(
            actor_id=admin.id,
            action="SYSTEM_INIT",
            resource_type="SYSTEM",
            resource_id="0",
            details="Database seeded with initial categories, badges, and demo users",
            created_at=now - timedelta(days=30)
        ))

        await db.commit()
        print("[SUCCESS] Database successfully seeded with rich demo data!")


if __name__ == "__main__":
    asyncio.run(seed_database())
