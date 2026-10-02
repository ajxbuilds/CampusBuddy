from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.complaint import Complaint
from app.models.services import CollegeNotice, ELearningResource
from app.models.academic import Subject

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("", response_model=dict)
async def global_search(
    q: str = Query(..., min_length=1, description="Global search query string"),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    search_term = f"%{q.strip()}%"
    results = []

    # 1. Search Notices
    notice_query = select(CollegeNotice).where(
        or_(
            CollegeNotice.title.ilike(search_term),
            CollegeNotice.content.ilike(search_term),
            CollegeNotice.category.ilike(search_term)
        )
    ).limit(5)
    notice_res = await db.execute(notice_query)
    for n in notice_res.scalars().all():
        results.append({
            "type": "NOTICE",
            "id": n.id,
            "title": n.title,
            "subtitle": f"Circular • {n.category}",
            "description": (n.content[:120] + "...") if len(n.content) > 120 else n.content,
            "url": "/notices",
            "badge": "Notice"
        })

    # 2. Search Subjects
    subject_query = select(Subject).where(
        or_(
            Subject.name.ilike(search_term),
            Subject.code.ilike(search_term),
            Subject.department.ilike(search_term)
        )
    ).limit(5)
    sub_res = await db.execute(subject_query)
    for s in sub_res.scalars().all():
        results.append({
            "type": "SUBJECT",
            "id": s.id,
            "title": f"{s.code}: {s.name}",
            "subtitle": f"Academic Course • {s.department}",
            "description": f"Semester {s.semester} • {s.credits} Credits",
            "url": "/syllabus",
            "badge": "Course"
        })

    # 3. Search E-Learning Resources
    elearn_query = select(ELearningResource).where(
        or_(
            ELearningResource.title.ilike(search_term),
            ELearningResource.description.ilike(search_term),
            ELearningResource.resource_type.ilike(search_term)
        )
    ).limit(5)
    el_res = await db.execute(elearn_query)
    for el in el_res.scalars().all():
        results.append({
            "type": "ELEARNING",
            "id": el.id,
            "title": el.title,
            "subtitle": f"Study Material • {el.resource_type}",
            "description": el.description or "E-learning study material & reference document.",
            "url": "/elearning",
            "badge": "E-Learning"
        })

    # 4. Search Complaints
    complaint_query = select(Complaint).where(
        or_(
            Complaint.title.ilike(search_term),
            Complaint.complaint_code.ilike(search_term),
            Complaint.description.ilike(search_term)
        )
    ).limit(5)
    cmp_res = await db.execute(complaint_query)
    for c in cmp_res.scalars().all():
        results.append({
            "type": "COMPLAINT",
            "id": c.id,
            "title": f"[{c.complaint_code}] {c.title}",
            "subtitle": f"Grievance Ticket • {c.status}",
            "description": (c.description[:120] + "...") if len(c.description) > 120 else c.description,
            "url": f"/complaints/{c.id}",
            "badge": c.status
        })

    return {
        "query": q,
        "total_results": len(results),
        "results": results[:limit]
    }
