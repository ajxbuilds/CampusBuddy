import re
from datetime import datetime, timezone
from typing import List, Optional
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc

from app.core.config import settings
from app.models.user import User, UserRole, ParentLink
from app.models.academic import FacultyMember, Subject, AttendanceRecord, TimetableEntry, Exam, AcademicResult
from app.models.services import FeeItem, FeePayment, CollegeNotice
from app.models.complaint import Complaint
from app.schemas.ai import AIChatMessage, AIChatResponse, AIProcedureAdvice

COLLEGE_PROCEDURE_KB = {
    "fees": {
        "category": "FEES",
        "priority": "HIGH",
        "action": "FORMAL_COMPLAINT",
        "office": "Finance & Accounts Section (Admin Block, Room 102)",
        "docs": ["Bank Transaction UTR / Reference Slip", "Student ID Card", "Fee Challan copy"],
        "advice": (
            "Payment reconciliations typically take 24 to 48 banking hours to reflect on the college portal. "
            "If your transaction shows debited from your bank account but pending after 48 hours, "
            "submit a formal complaint under the Fees category with your transaction ID attached."
        )
    },
    "exam": {
        "category": "EXAMINATION",
        "priority": "HIGH",
        "action": "FORMAL_COMPLAINT",
        "office": "Controller of Examinations (Exam Section, Block B)",
        "docs": ["Hall Ticket / Admit Card", "Semester Fee Clearance Receipt", "Application for Re-evaluation"],
        "advice": (
            "Examination issues such as hall ticket corrections, timetable clashes, or re-evaluation requests "
            "must be submitted within 10 days of schedule release through the Examination section."
        )
    },
    "hostel": {
        "category": "HOSTEL",
        "priority": "MEDIUM",
        "action": "PEER_COMMUNITY",
        "office": "Hostel Warden Office & Estate Maintenance Cell",
        "docs": ["Hostel Room Allotment Letter", "Maintenance Request Slip"],
        "advice": (
            "For routine hostel queries, the Campus Community is great. For physical maintenance (plumbing, electrical repairs, water purifier), "
            "submit a formal complaint under the Hostel category."
        )
    },
    "academic": {
        "category": "ACADEMIC",
        "priority": "MEDIUM",
        "action": "PEER_COMMUNITY",
        "office": "Department Head Office / Academic Counselor",
        "docs": ["Course Registration Form", "Attendance Certificate / Medical Certificate if applicable"],
        "advice": (
            "For study resources, check the Campus Community forum where peers share notes. If your concern is related to official attendance shortage, "
            "medical leave regularization, or subject elective assignment, file a formal complaint under Academic category."
        )
    },
    "transport": {
        "category": "TRANSPORT",
        "priority": "LOW",
        "action": "FORMAL_COMPLAINT",
        "office": "Transport Coordination Desk (Main Gate Building)",
        "docs": ["Bus Pass ID", "Fee Receipt for Transportation"],
        "advice": (
            "Route changes, bus delay grievances, or pass renewals are handled by the Transport Department. "
            "Submit a formal complaint detailing the route number and timing."
        )
    },
    "harassment": {
        "category": "HARASSMENT",
        "priority": "CRITICAL",
        "action": "FORMAL_COMPLAINT",
        "office": "Internal Complaints Committee (ICC) & Anti-Ragging Cell",
        "docs": ["Detailed Statement of Incident", "Any supporting communication/evidence"],
        "advice": (
            "The college maintains a strict Zero-Tolerance Policy towards any form of ragging, bullying, or harassment. "
            "This matter is immediately escalated with top priority to the Internal Complaints Committee (ICC)."
        )
    },
    "infrastructure": {
        "category": "INFRASTRUCTURE",
        "priority": "MEDIUM",
        "action": "FORMAL_COMPLAINT",
        "office": "Campus Estate & Facilities Management",
        "docs": ["Photograph of damaged facility / location details"],
        "advice": (
            "Damaged classroom projectors, lab equipment malfunction, or elevator downtime should be reported as formal infrastructure complaints."
        )
    }
}

DAY_NAMES = {1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday", 7: "Sunday"}

async def get_student_target_id(current_user: Optional[User], db: AsyncSession) -> Optional[int]:
    if not current_user:
        return None
    if current_user.role == UserRole.STUDENT:
        return current_user.id
    elif current_user.role == UserRole.PARENT:
        link_res = await db.execute(select(ParentLink).where(ParentLink.parent_id == current_user.id))
        link = link_res.scalars().first()
        return link.student_id if link else None
    else:
        # For teacher or admin, pick first student as context
        s_res = await db.execute(select(User).where(User.role == UserRole.STUDENT).limit(1))
        st = s_res.scalars().first()
        return st.id if st else None

async def fetch_attendance_data(db: AsyncSession, student_id: int) -> dict:
    sub_res = await db.execute(select(Subject).order_by(Subject.code))
    subjects = sub_res.scalars().all()

    att_res = await db.execute(select(AttendanceRecord).where(AttendanceRecord.student_id == student_id))
    all_records = att_res.scalars().all()

    total_sessions = len(all_records)
    attended_sessions = sum(1 for r in all_records if r.status == "PRESENT")
    overall_percentage = round((attended_sessions / total_sessions * 100), 1) if total_sessions > 0 else 0.0

    breakdown = []
    for sub in subjects:
        sub_records = [r for r in all_records if r.subject_id == sub.id]
        s_total = len(sub_records)
        s_att = sum(1 for r in sub_records if r.status == "PRESENT")
        s_pct = round((s_att / s_total * 100), 1) if s_total > 0 else 0.0
        breakdown.append({
            "code": sub.code,
            "name": sub.name,
            "total": s_total,
            "attended": s_att,
            "percentage": s_pct,
            "is_low": s_pct < 75.0
        })

    return {
        "overall_percentage": overall_percentage,
        "total": total_sessions,
        "attended": attended_sessions,
        "absent": total_sessions - attended_sessions,
        "breakdown": breakdown
    }

async def fetch_timetable_data(db: AsyncSession) -> dict:
    query = select(TimetableEntry).options(
        selectinload(TimetableEntry.subject),
        selectinload(TimetableEntry.faculty)
    ).order_by(TimetableEntry.day_of_week, TimetableEntry.start_time)
    result = await db.execute(query)
    entries = result.scalars().all()

    today_weekday = datetime.now().weekday() + 1
    display_today = today_weekday if today_weekday <= 5 else 1

    today_classes = []
    for e in entries:
        if e.day_of_week == display_today:
            today_classes.append({
                "time": f"{e.start_time} - {e.end_time}",
                "subject": f"{e.subject.code}: {e.subject.name}" if e.subject else "Class",
                "classroom": e.classroom,
                "faculty": e.faculty.name if e.faculty else "Faculty"
            })

    return {
        "today_day_name": DAY_NAMES.get(display_today, "Weekday"),
        "today_classes": today_classes,
        "next_class": today_classes[0] if today_classes else None
    }

async def fetch_fees_data(db: AsyncSession, student_id: int) -> dict:
    query = select(FeeItem).where(FeeItem.student_id == student_id).order_by(FeeItem.due_date)
    result = await db.execute(query)
    items = result.scalars().all()

    total = sum(i.amount for i in items)
    paid = sum(i.amount for i in items if i.status == "PAID")
    pending = sum(i.amount for i in items if i.status != "PAID")
    pending_items = [{"title": i.title, "amount": i.amount, "due_date": i.due_date.strftime("%d %b %Y")} for i in items if i.status != "PAID"]

    return {
        "total": total,
        "paid": paid,
        "pending": pending,
        "pending_items": pending_items
    }

async def fetch_exams_data(db: AsyncSession) -> List[dict]:
    query = select(Exam).options(selectinload(Exam.subject)).order_by(Exam.date)
    result = await db.execute(query)
    exams = result.scalars().all()
    return [{
        "subject": f"{e.subject.code} - {e.subject.name}" if e.subject else "Subject",
        "type": e.exam_type,
        "date": e.date.strftime("%A, %d %B %Y"),
        "time": e.time_str,
        "room": e.room
    } for e in exams]

async def fetch_complaints_data(db: AsyncSession, student_id: int) -> List[dict]:
    query = select(Complaint).where(Complaint.student_id == student_id).order_by(desc(Complaint.created_at)).limit(5)
    result = await db.execute(query)
    complaints = result.scalars().all()
    return [{
        "code": c.complaint_code,
        "title": c.title,
        "status": c.status.value,
        "priority": c.priority.value
    } for c in complaints]

async def fetch_faculty_info(db: AsyncSession, query_text: str) -> List[dict]:
    q = select(FacultyMember)
    result = await db.execute(q)
    faculties = result.scalars().all()

    matches = []
    for f in faculties:
        if (f.name.lower() in query_text.lower() or 
            f.department.lower() in query_text.lower() or 
            f.email.lower() in query_text.lower() or 
            any(w in f.name.lower() for w in query_text.lower().split() if len(w) > 3)):
            matches.append({
                "name": f.name,
                "designation": f.designation,
                "department": f.department,
                "email": f.email,
                "phone": f.phone,
                "cabin": f.cabin,
                "office_hours": f.office_hours
            })
    return matches or [{
        "name": f.name,
        "designation": f.designation,
        "department": f.department,
        "cabin": f.cabin,
        "office_hours": f.office_hours
    } for f in faculties[:4]]

async def fetch_notices_data(db: AsyncSession) -> List[dict]:
    query = select(CollegeNotice).order_by(desc(CollegeNotice.is_important), desc(CollegeNotice.published_at)).limit(4)
    result = await db.execute(query)
    notices = result.scalars().all()
    return [{
        "title": n.title,
        "category": n.category,
        "important": n.is_important,
        "content": n.content[:150] + "..." if len(n.content) > 150 else n.content
    } for n in notices]


async def generate_guidance(
    messages: List[AIChatMessage],
    context_category: Optional[str] = None,
    current_page: Optional[str] = None,
    quick_action: Optional[str] = None,
    current_user: Optional[User] = None,
    db: Optional[AsyncSession] = None
) -> AIChatResponse:
    last_user_message = ""
    for msg in reversed(messages):
        if msg.role == "user":
            last_user_message = msg.content
            break

    query_lower = last_user_message.lower()
    student_id = await get_student_target_id(current_user, db) if db and current_user else None

    # Check intent for live database queries
    is_attendance_query = bool(re.search(r"attendance|present|absent|bunk|eligib|shortage|classes.*attended", query_lower)) or current_page == "attendance"
    is_schedule_query = bool(re.search(r"schedule|timetable|next class|today.*class|timing|period|lecture", query_lower)) or current_page == "timetable"
    is_fees_query = bool(re.search(r"fee|receipt|dues|pending.*pay|tuition|hostel fee|pay.*online", query_lower)) or current_page == "fees"
    is_exam_query = bool(re.search(r"exam|midterm|practical|date sheet|hall ticket|room|exam hall", query_lower)) or current_page == "exams"
    is_complaint_query = bool(re.search(r"my complaint|ticket|grievance status|escalat", query_lower))
    is_faculty_query = bool(re.search(r"faculty|professor|teacher|cabin|office hour|hod|dr\.|prof", query_lower))
    is_notice_query = bool(re.search(r"notice|announcement|circular|update|what.*new", query_lower))

    live_context_str = ""

    # Live data extraction if db is available
    if db and student_id:
        if is_attendance_query and ("what" in query_lower or "how" in query_lower or "my" in query_lower or "check" in query_lower or "attendance" in query_lower):
            att_data = await fetch_attendance_data(db, student_id)
            breakdown_lines = [f"- **{b['code']}** ({b['name']}): **{b['percentage']}%** ({b['attended']}/{b['total']} attended){' ⚠️ (Below 75%)' if b['is_low'] else ' ✅'}" for b in att_data['breakdown']]
            live_context_str += f"""
### 📊 Live Attendance Overview
- **Overall Attendance:** **{att_data['overall_percentage']}%** ({att_data['attended']} attended out of {att_data['total']} sessions)
- **Status:** {'✅ Good Standing (Eligible for exams)' if att_data['overall_percentage'] >= 75.0 else '⚠️ Attendance Shortage Warning (<75%)'}

**Subject Breakdown:**
""" + "\n".join(breakdown_lines)

        elif is_schedule_query and ("next" in query_lower or "today" in query_lower or "class" in query_lower or "schedule" in query_lower or "timetable" in query_lower):
            tt_data = await fetch_timetable_data(db)
            today_lines = [f"- **{c['time']}**: {c['subject']} in *{c['classroom']}* ({c['faculty']})" for c in tt_data['today_classes']]
            live_context_str += f"""
### 🗓️ Live Class Schedule ({tt_data['today_day_name']})
""" + ("\n".join(today_lines) if today_lines else "No lectures scheduled for today.") + (f"\n\n**Next Upcoming Session:** {tt_data['next_class']['subject']} at {tt_data['next_class']['time']} ({tt_data['next_class']['classroom']})" if tt_data['next_class'] else "")

        elif is_fees_query and ("fee" in query_lower or "due" in query_lower or "pay" in query_lower or "pending" in query_lower or "receipt" in query_lower):
            fee_data = await fetch_fees_data(db, student_id)
            pending_lines = [f"- **{p['title']}**: ₹{p['amount']:,.2f} (Due: {p['due_date']})" for p in fee_data['pending_items']]
            live_context_str += f"""
### 💳 Live Fee & Accounts Summary
- **Total Invoiced:** ₹{fee_data['total']:,.2f}
- **Total Paid:** ₹{fee_data['paid']:,.2f}
- **Pending Balance:** **₹{fee_data['pending']:,.2f}**

""" + ("**Pending Fee Items:**\n" + "\n".join(pending_lines) if pending_lines else "🎉 All semester fee accounts are fully settled!")

        elif is_exam_query and ("exam" in query_lower or "date" in query_lower or "schedule" in query_lower or "when" in query_lower):
            exam_data = await fetch_exams_data(db)
            exam_lines = [f"- **{e['subject']}** ({e['type']}): {e['date']} from {e['time']} @ *{e['room']}*" for e in exam_data[:4]]
            live_context_str += """
### 📝 Upcoming Examinations Schedule
""" + "\n".join(exam_lines)

        elif is_complaint_query:
            cmp_data = await fetch_complaints_data(db, student_id)
            cmp_lines = [f"- **#{c['code']}** - {c['title']} | Status: **{c['status']}** ({c['priority']} Priority)" for c in cmp_data]
            live_context_str += """
### 🎫 Your Registered Grievances & Status
""" + ("\n".join(cmp_lines) if cmp_lines else "You have no active complaints at present.")

        elif is_faculty_query:
            fac_data = await fetch_faculty_info(db, last_user_message)
            fac_lines = [f"- **{f['name']}** ({f['designation']})\n  - Cabin: {f.get('cabin', 'Main Block')}\n  - Office Hours: {f.get('office_hours', 'Regular')}\n  - Email: {f.get('email', 'N/A')}" for f in fac_data[:2]]
            live_context_str += """
### 👨‍🏫 Faculty Directory Details
""" + "\n".join(fac_lines)

        elif is_notice_query:
            notice_data = await fetch_notices_data(db)
            notice_lines = [f"- **{'🔴 [IMPORTANT] ' if n['important'] else ''}{n['title']}** ({n['category']})\n  {n['content']}" for n in notice_data[:3]]
            live_context_str += """
### 📢 Recent College Circulars & Notices
""" + "\n".join(notice_lines)

    # Standard Knowledge Base procedure lookup
    matched_key = "academic"
    if re.search(r"fee|receipt|refund|challan|payment|tuition|scholarship|portal.*money|due", query_lower):
        matched_key = "fees"
    elif re.search(r"exam|grade|mark|re-eval|hall ticket|admit card|result|supplementary|backlog", query_lower):
        matched_key = "exam"
    elif re.search(r"hostel|room|mess|warden|laundry|water.*hostel|geyser|wifi.*hostel", query_lower):
        matched_key = "hostel"
    elif re.search(r"harass|ragging|bully|threat|safety|abuse", query_lower):
        matched_key = "harassment"
    elif re.search(r"bus|transport|van|pickup|route|driver", query_lower):
        matched_key = "transport"
    elif re.search(r"lab|projector|bench|light|ac|elevator|lift|building|washroom|toilet|infrastructure", query_lower):
        matched_key = "infrastructure"
    elif re.search(r"attendance|professor|syllabus|notes|elective|teacher|faculty|assignment", query_lower):
        matched_key = "academic"

    info = COLLEGE_PROCEDURE_KB[matched_key]
    action_phrase = "creating a post on the Campus Community forum first" if info["action"] == "PEER_COMMUNITY" else "submitting a formal complaint through CampusBuddy"

    structured = AIProcedureAdvice(
        suggested_category=info["category"],
        suggested_priority=info["priority"],
        recommended_action=info["action"],
        required_documents=info["docs"],
        contact_office=info["office"],
        guidance_text=info["advice"]
    )

    # If we have live data, prioritize it with structured procedure context
    if live_context_str:
        final_reply = (
            f"Hello! Here is the latest verified data from your CampusBuddy college records:\n"
            f"{live_context_str}\n\n"
            f"---\n"
            f"### 💡 Institutional Policy Note\n"
            f"{info['advice']}\n\n"
            f"**Office In Charge:** {info['office']}\n\n"
            f"*Need further assistance? You can ask me more about attendance, syllabus, fee receipts, timetable, or file an official grievance.*"
        )
        return AIChatResponse(reply=final_reply, structured_advice=structured)

    # External LLM check (Gemini) if configured
    if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 5:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
                prompt = f"""
You are the official CampusBuddy AI Assistant for college students.
Policy Info:
Category: {info['category']}
Department: {info['office']}
Procedure: {info['advice']}

Student Query: "{last_user_message}"

Provide a structured, helpful answer explaining relevant college procedure, required documents, and whether peer discussion or formal complaint is best.
"""
                resp = await client.post(
                    gemini_url,
                    json={"contents": [{"parts": [{"text": prompt}]}]}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    ai_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    return AIChatResponse(reply=ai_text, structured_advice=structured)
        except Exception:
            pass

    # Intelligent deterministic response
    reply_text = (
        f"Hello! Based on what you described, your inquiry pertains to **{info['category']}**.\n\n"
        f"### 📋 Recommended Next Steps\n"
        f"I recommend **{action_phrase}**.\n\n"
        f"**Office In Charge:** {info['office']}\n"
        f"**Suggested Priority:** {info['priority']}\n\n"
        f"### 💡 Procedure Summary\n"
        f"{info['advice']}\n\n"
        f"### 📑 Documents You May Need:\n" +
        "\n".join([f"- {doc}" for doc in info["docs"]]) +
        f"\n\n*Note: This guidance is informational. You can ask me to check your live attendance, fees, exams, or timetable at any time!*"
    )

    return AIChatResponse(reply=reply_text, structured_advice=structured)
