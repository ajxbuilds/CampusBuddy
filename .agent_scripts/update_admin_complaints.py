import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/backend/app/api/admin.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

endpoints = """
@router.get("/complaints")
async def list_admin_complaints(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Complaint).options(selectinload(Complaint.student)).order_by(desc(Complaint.created_at))
    
    if status and status.upper() != 'ALL':
        stmt = stmt.where(Complaint.status == status.upper())
    if priority and priority.upper() != 'ALL':
        stmt = stmt.where(Complaint.priority == priority.upper())
        
    res = await db.execute(stmt)
    comps = res.scalars().all()
    
    # We can just return standard complaint dicts
    return [
        {
            "id": c.id,
            "complaint_code": c.complaint_code,
            "title": c.title,
            "status": c.status.value if hasattr(c.status, 'value') else c.status,
            "priority": c.priority.value if hasattr(c.priority, 'value') else c.priority,
            "created_at": c.created_at,
            "student_name": c.student.full_name if c.student else "Unknown"
        } for c in comps
    ]
"""

if "@router.get(\"/complaints\")" not in content:
    content += endpoints

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added Admin Complaints endpoint")
