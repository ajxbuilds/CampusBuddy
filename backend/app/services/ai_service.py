import re
from typing import List, Optional
import httpx
from app.core.config import settings
from app.schemas.ai import AIChatMessage, AIChatResponse, AIProcedureAdvice

COLLEGE_PROCEDURE_KB = {
    "fees": {
        "category": "FEES",
        "priority": "HIGH",
        "action": "FORMAL_COMPLAINT",
        "office": "Finance & Accounts Section (Admin Block, Room 102)",
        "docs": ["Bank Transaction UTR / Reference Slip", "Student ID Card", "Fee Challan copy"],
        "advice": (
            "Payment reconciliations typically take 24 to 48 banking hours to reflect on the college ERP portal. "
            "If your transaction shows debited from your bank account but pending on the college portal after 48 hours, "
            "you should submit a formal complaint with your bank transaction UTR receipt attached. "
            "The Accounts Office will manually reconcile the gateway log with the bank merchant account."
        )
    },
    "exam": {
        "category": "EXAMINATION",
        "priority": "HIGH",
        "action": "FORMAL_COMPLAINT",
        "office": "Controller of Examinations (Exam Section, Block B)",
        "docs": ["Hall Ticket / Admit Card", "Semester Fee Clearance Receipt", "Application for Correction / Re-evaluation"],
        "advice": (
            "Examination issues such as hall ticket errors, withheld results, or timetable clashes require immediate administrative handling. "
            "Ensure you have cleared your department dues. For re-evaluation or photocopy requests, applications must be registered "
            "within 10 days of result declaration through a formal grievance."
        )
    },
    "hostel": {
        "category": "HOSTEL",
        "priority": "MEDIUM",
        "action": "PEER_COMMUNITY",
        "office": "Hostel Warden Office & Estate Maintenance Cell",
        "docs": ["Hostel Room Allotment Letter", "Maintenance Request Slip"],
        "advice": (
            "For routine hostel queries like laundry schedules, mess timings, or peer recommendations on study hours, "
            "the Campus Community is great. For physical maintenance (plumbing, electrical repairs, Wi-Fi outage, pest control), "
            "you can submit a formal complaint so the hostel warden and facility technician can track and resolve it."
        )
    },
    "academic": {
        "category": "ACADEMIC",
        "priority": "MEDIUM",
        "action": "PEER_COMMUNITY",
        "office": "Department Head Office / Academic Counselor",
        "docs": ["Course Registration Form", "Attendance Certificate / Medical Certificate if applicable"],
        "advice": (
            "For study materials, previous year question papers, or course advice, consider asking on the Campus Community forum "
            "where seniors and peer students can share notes. If your concern is related to official attendance shortage, medical leave approval, "
            "or faculty elective assignments, file a formal complaint under the Academic category."
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
            "Submit a formal complaint detailing the route number, bus number, and timing issues."
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
            "This matter should be escalated formally with the highest priority to the Internal Complaints Committee (ICC). "
            "Your report will be handled under strict confidentiality."
        )
    },
    "infrastructure": {
        "category": "INFRASTRUCTURE",
        "priority": "MEDIUM",
        "action": "FORMAL_COMPLAINT",
        "office": "Campus Estate & Facilities Management",
        "docs": ["Photograph of damaged facility / location details"],
        "advice": (
            "Damaged classroom projectors, broken benches, lab equipment malfunction, or elevator service interruptions "
            "should be submitted as formal infrastructure complaints with location details (building, floor, lab number)."
        )
    }
}

async def generate_guidance(messages: List[AIChatMessage], context_category: Optional[str] = None) -> AIChatResponse:
    last_user_message = ""
    for msg in reversed(messages):
        if msg.role == "user":
            last_user_message = msg.content
            break

    query_lower = last_user_message.lower()

    # Identify matching college domain
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

    # Check if user has an external LLM configured (Gemini)
    if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 5:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
                prompt = f"""
You are the official CampusBuddy AI Assistant for college students.
College Policy Info:
Category: {info['category']}
Department: {info['office']}
Standard Procedure: {info['advice']}

Student Query: "{last_user_message}"

Provide a warm, empathetic, and highly structured answer explaining:
1. Understanding of their situation
2. Relevant college procedure & category
3. Whether peer discussion or formal complaint is best
4. Key documents or steps needed.

Do not claim to be the final administrative authority. Remind the student that you cannot automatically submit complaints on their behalf.
"""
                resp = await client.post(
                    gemini_url,
                    json={"contents": [{"parts": [{"text": prompt}]}]}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    ai_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    structured = AIProcedureAdvice(
                        suggested_category=info["category"],
                        suggested_priority=info["priority"],
                        recommended_action=info["action"],
                        required_documents=info["docs"],
                        contact_office=info["office"],
                        guidance_text=info["advice"]
                    )
                    return AIChatResponse(reply=ai_text, structured_advice=structured)
        except Exception:
            pass # Fall back to rule-based engine smoothly

    # Comprehensive Intelligent Rule-Based Fallback
    structured = AIProcedureAdvice(
        suggested_category=info["category"],
        suggested_priority=info["priority"],
        recommended_action=info["action"],
        required_documents=info["docs"],
        contact_office=info["office"],
        guidance_text=info["advice"]
    )

    action_phrase = "creating a post on the Campus Community forum first to see if other students have encountered this" if info["action"] == "PEER_COMMUNITY" else "submitting a formal complaint through CampusBuddy so the relevant department can formally track and resolve it"

    reply_text = (
        f"Hello! Based on what you described, your issue pertains to the **{info['category']}** category.\n\n"
        f"### 📋 Recommended Next Steps\n"
        f"I recommend **{action_phrase}**.\n\n"
        f"**Office In Charge:** {info['office']}\n"
        f"**Suggested Priority:** {info['priority']}\n\n"
        f"### 💡 Procedure Summary\n"
        f"{info['advice']}\n\n"
        f"### 📑 Documents You May Need:\n" +
        "\n".join([f"- {doc}" for doc in info["docs"]]) +
        f"\n\n*Note: This guidance is informational only. If you decide to file a complaint, click 'File Complaint' on your dashboard to submit it for administrative review.*"
    )

    return AIChatResponse(reply=reply_text, structured_advice=structured)
