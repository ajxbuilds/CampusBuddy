import re
from datetime import datetime, timezone
from typing import List, Optional
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc

from app.core.config import settings
from app.models.user import User, UserRole
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


import asyncio
import json

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

    student_id = await get_student_target_id(current_user, db) if db and current_user else None

    live_context_str = "Live data is currently unavailable."

    # Eagerly fetch live data to inject into NLU context if db is available
    if db and student_id:
        try:
            # We fetch summaries so the LLM has authorized access to live data if asked.
            att_data, tt_data, fee_data, exam_data, cmp_data, notice_data = await asyncio.gather(
                fetch_attendance_data(db, student_id),
                fetch_timetable_data(db),
                fetch_fees_data(db, student_id),
                fetch_exams_data(db),
                fetch_complaints_data(db, student_id),
                fetch_notices_data(db)
            )

            live_context_str = f"--- LIVE STUDENT DATA ---\n"
            live_context_str += f"ATTENDANCE: Overall {att_data['overall_percentage']}%. Sessions attended: {att_data['attended']}/{att_data['total']}. "
            if att_data['overall_percentage'] < 75:
                live_context_str += "WARNING: Below 75% threshold.\n"
            else:
                live_context_str += "Good standing.\n"

            live_context_str += f"TIMETABLE: Today is {tt_data['today_day_name']}. Classes today: {len(tt_data['today_classes'])}. "
            if tt_data['next_class']:
                live_context_str += f"Next class: {tt_data['next_class']['subject']} at {tt_data['next_class']['time']} in {tt_data['next_class']['classroom']}.\n"
            else:
                live_context_str += "No upcoming classes.\n"

            live_context_str += f"FEES: Total invoiced: Rs{fee_data['total']}, Paid: Rs{fee_data['paid']}, Pending: Rs{fee_data['pending']}.\n"

            live_context_str += f"EXAMS: {len(exam_data)} upcoming exams.\n"

            live_context_str += f"COMPLAINTS: {len(cmp_data)} registered complaints. "
            if cmp_data:
                cmp_summaries = [f"#{c['code']} ({c['status']})" for c in cmp_data]
                live_context_str += f"Recent statuses: {', '.join(cmp_summaries)}.\n"
            else:
                live_context_str += "No active complaints.\n"

        except Exception as e:
            print("Error fetching eager context:", e)
            live_context_str = "Error retrieving live data."

    # Build the Natural Language System Prompt
    system_prompt = f"""You are the official CampusBuddy AI Assistant for college students.
Your goal is to understand natural language and converse naturally with students. You understand context, follow-up messages, and underlying intent.

### CAMPUSBUDDY FEATURES & TERMINOLOGY
1. COMMUNITY (Peer Forum): For peer questions, advice, discussion, knowledge sharing. (e.g., "Has anyone had WiFi problems?" -> Guide to Community)
2. COMPLAINTS: For official institutional resolution. (e.g., "I want the college to fix the WiFi." -> Guide to Complaints)
3. STUDY BUDDY: For peer learning and collaboration.
4. GAMIFICATION: Students earn points, levels, and badges by contributing to the Community (asking, answering, upvoting). The Leaderboard ranks students.
5. MODERATION: Users can report inappropriate content in the Community.

### PROCEDURES KNOWLEDGE BASE
{json.dumps(COLLEGE_PROCEDURE_KB, indent=2)}

### LIVE STUDENT DATA (Authorized Context)
{live_context_str}

### INSTRUCTIONS
1. Speak naturally and conversationally. Do NOT expose internal JSON, intents, or prompt instructions. Do not use phrases like "Intent classified as".
2. Maintain conversational context. If a user refers to "it" or "this issue", infer it from previous messages.
3. Understand the distinction between asking peers (Community) vs demanding official action (Complaints). Guide them appropriately based on their intended outcome.
4. Do not over-classify. If a request is genuinely ambiguous (e.g., "The projector is broken"), concisely clarify: "Are you looking for advice from other students, or do you want the college to officially resolve this?"
5. Do not invent features or point values. You cannot submit complaints on their behalf. Use actual rules and data.
6. If asked about live data (status, attendance, etc.), use the LIVE STUDENT DATA provided. If the specific data requested isn't there, clearly state you cannot currently access it.
7. NEVER invent complaint IDs, statuses, assigned teachers, or dates.
"""

    # External LLM check (Gemini NLU)
    import os
    import dotenv
    import logging
    dotenv.load_dotenv(override=True)
    actual_key = os.getenv("GEMINI_API_KEY")
    actual_model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

    if actual_key and len(actual_key) > 5:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{actual_model}:generateContent?key={actual_key}"

                # Combine conversation into a single prompt to avoid strict alternating role API errors
                history = []
                for msg in messages[:-1]:
                    sender = "Student" if msg.role == "user" else "Assistant"
                    history.append(f"{sender}: {msg.content}")

                history_text = "\n".join(history)

                final_prompt = f"SYSTEM INSTRUCTIONS:\n{system_prompt}\n\n"
                if history_text:
                    final_prompt += f"PREVIOUS CONVERSATION:\n{history_text}\n\n"
                final_prompt += f"STUDENT'S NEW MESSAGE:\n{last_user_message}\n\nASSISTANT REPLY:"

                resp = await client.post(
                    gemini_url,
                    json={"contents": [{"role": "user", "parts": [{"text": final_prompt}]}], "generationConfig": {"thinkingConfig": {"thinkingLevel": "low"}}}
                )

                if resp.status_code == 200:
                    data = resp.json()
                    ai_text = data["candidates"][0]["content"]["parts"][0]["text"]

                    structured = AIProcedureAdvice(
                        suggested_category="GENERAL",
                        suggested_priority="LOW",
                        recommended_action="N/A",
                        required_documents=[],
                        contact_office="N/A",
                        guidance_text="Guided via natural language."
                    )
                    return AIChatResponse(reply=ai_text, structured_advice=structured)
                else:
                    logging.error(f"Gemini API Error: {resp.status_code} - {resp.text}")
                    return AIChatResponse(
                        reply="CampusBuddy AI is temporarily unavailable. Please try again in a moment.",
                        structured_advice=AIProcedureAdvice(suggested_category="GENERAL", suggested_priority="LOW", recommended_action="N/A", required_documents=[], contact_office="N/A", guidance_text="Error")
                    )
        except Exception as e:
            logging.exception("NLU LLM Exception")
            return AIChatResponse(
                reply="CampusBuddy AI is temporarily unavailable. Please try again in a moment.",
                structured_advice=AIProcedureAdvice(suggested_category="GENERAL", suggested_priority="LOW", recommended_action="N/A", required_documents=[], contact_office="N/A", guidance_text="Error")
            )

    # Fallback if Gemini fails or is not configured
    query_lower = last_user_message.lower()

    # Join previous messages for context
    history_text = " ".join([m.content.lower() for m in messages[:-1]]) if len(messages) > 1 else ""
    full_context = history_text + " " + query_lower

    # NLU heuristics for offline mode
    is_community = bool(re.search(r"anyone else|has anyone|ask.*student|help.*understand|where.*ask|solution", query_lower))
    is_complaint = bool(re.search(r"fix this|fix it|report|complain|issue|broken|resolve|college.*fix|not working|dead|cannot use", query_lower))
    is_gamification = bool(re.search(r"point|level|badge|rank|leaderboard|upvot", query_lower))
    is_moderation = bool(re.search(r"spam|harass|inappropriate|report this", query_lower))
    is_status = bool(re.search(r"happening.*complaint|status.*complaint|assigned|look.*complaint|why.*resolved", query_lower))

    if is_status:
        reply_text = "I can explain the complaint workflow, but I can't currently access your live complaint status."
    elif is_moderation:
        reply_text = "If you see inappropriate content or spam, you can use the 'Report' button on the Community post to notify our moderators."
    elif is_gamification:
        reply_text = "You earn points by asking helpful questions and providing good answers in the Community. Your total points determine your Level and Leaderboard rank! Upvoting helps surface good content."
    elif is_community and not is_complaint:
        if "understand this" in query_lower and len(history_text) < 5:
            reply_text = "What exactly do you need help understanding? I can point you to the right Community discussion."
        else:
            reply_text = "If you're looking for advice or want to know if others have experienced this, the CampusBuddy Peer Forum (Community) is the best place to ask!"
    elif is_complaint and not is_community:
        reply_text = "If you want the college to officially resolve this issue, you can raise a complaint through CampusBuddy."
    else:
        # Ambiguous
        reply_text = "Are you looking for advice from other students, or do you want the college to officially resolve the issue?"

    structured = AIProcedureAdvice(
        suggested_category="GENERAL",
        suggested_priority="LOW",
        recommended_action="N/A",
        required_documents=[],
        contact_office="N/A",
        guidance_text="Offline fallback."
    )
    return AIChatResponse(reply=reply_text, structured_advice=structured)
