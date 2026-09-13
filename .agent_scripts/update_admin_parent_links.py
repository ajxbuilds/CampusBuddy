import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/backend/app/api/admin.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

endpoints = """
from app.models.user import ParentLink
from pydantic import BaseModel

class ParentLinkCreate(BaseModel):
    parent_id: int
    student_id: int

@router.get("/parent-links")
async def list_parent_links(db: AsyncSession = Depends(get_db)):
    stmt = select(ParentLink).options(selectinload(ParentLink.parent), selectinload(ParentLink.student)).order_by(desc(ParentLink.created_at))
    res = await db.execute(stmt)
    links = res.scalars().all()
    
    return [
        {
            "id": l.id,
            "parent_id": l.parent_id,
            "student_id": l.student_id,
            "parent_name": l.parent.full_name if l.parent else "Unknown",
            "student_name": l.student.full_name if l.student else "Unknown",
            "is_verified": l.is_verified,
            "created_at": l.created_at
        } for l in links
    ]

@router.post("/parent-links")
async def create_parent_link(
    data: ParentLinkCreate,
    admin_user: User = Depends(require_roles(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    # Verify both exist
    p_stmt = select(User).where(User.id == data.parent_id, User.role == UserRole.PARENT)
    s_stmt = select(User).where(User.id == data.student_id, User.role == UserRole.STUDENT)
    
    p = (await db.execute(p_stmt)).scalars().first()
    s = (await db.execute(s_stmt)).scalars().first()
    
    if not p or not s:
        raise HTTPException(status_code=400, detail="Invalid parent or student ID")
        
    # Check existing
    ex_stmt = select(ParentLink).where(ParentLink.parent_id == p.id, ParentLink.student_id == s.id)
    if (await db.execute(ex_stmt)).scalars().first():
        raise HTTPException(status_code=400, detail="Relationship already exists")
        
    new_link = ParentLink(
        parent_id=p.id,
        student_id=s.id,
        relation_type="Parent",
        is_verified=True
    )
    db.add(new_link)
    
    await create_audit_log(
        db=db,
        actor_id=admin_user.id,
        action="CREATE_PARENT_LINK",
        resource_type="PARENT_LINK",
        resource_id=f"{p.id}-{s.id}",
        details=f"Admin manually linked Parent {p.id} to Student {s.id}"
    )
    await db.commit()
    return {"status": "success"}

@router.delete("/parent-links/{link_id}")
async def delete_parent_link(
    link_id: int,
    admin_user: User = Depends(require_roles(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ParentLink).where(ParentLink.id == link_id)
    link = (await db.execute(stmt)).scalars().first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
        
    db.delete(link)
    await create_audit_log(
        db=db,
        actor_id=admin_user.id,
        action="DELETE_PARENT_LINK",
        resource_type="PARENT_LINK",
        resource_id=str(link_id),
        details=f"Admin removed link between Parent {link.parent_id} and Student {link.student_id}"
    )
    await db.commit()
    return {"status": "success"}
"""

if "@router.get(\"/parent-links\")" not in content:
    content += endpoints

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated admin.py with parent links endpoints")
