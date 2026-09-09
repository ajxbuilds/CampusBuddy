from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import require_roles
from app.models.complaint import Complaint, ComplaintCategory, ComplaintStatus
from app.schemas.admin import CategoryDistribution, ComplaintsTrendPoint

router = APIRouter(prefix="/analytics", tags=["Analytics"], dependencies=[Depends(require_roles(["ADMIN"]))])

@router.get("/by-category", response_model=List[CategoryDistribution])
async def get_complaints_by_category(db: AsyncSession = Depends(get_db)):
    cat_stmt = select(ComplaintCategory)
    cat_res = await db.execute(cat_stmt)
    categories = cat_res.scalars().all()

    distributions = []
    for cat in categories:
        total_stmt = select(func.count(Complaint.id)).where(Complaint.category_id == cat.id)
        total_count = await db.scalar(total_stmt) or 0

        res_stmt = select(func.count(Complaint.id)).where(
            Complaint.category_id == cat.id,
            Complaint.status == ComplaintStatus.RESOLVED
        )
        resolved_count = await db.scalar(res_stmt) or 0

        distributions.append(CategoryDistribution(
            category=cat.name,
            count=total_count,
            resolved_count=resolved_count
        ))

    return distributions

@router.get("/trends", response_model=List[ComplaintsTrendPoint])
async def get_complaints_trends(days: int = 7, db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    points = []

    for i in range(days - 1, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        date_label = day_start.strftime("%b %d")

        c_stmt = select(func.count(Complaint.id)).where(
            Complaint.created_at >= day_start,
            Complaint.created_at < day_end
        )
        count = await db.scalar(c_stmt) or 0

        r_stmt = select(func.count(Complaint.id)).where(
            Complaint.resolved_at >= day_start,
            Complaint.resolved_at < day_end
        )
        resolved = await db.scalar(r_stmt) or 0

        points.append(ComplaintsTrendPoint(
            date=date_label,
            count=count,
            resolved=resolved
        ))

    return points
