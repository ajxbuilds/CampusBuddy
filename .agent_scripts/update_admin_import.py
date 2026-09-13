import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/backend/app/api/admin.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

endpoints = """
from fastapi import UploadFile, File
import csv
import io
from app.core.security import get_password_hash

@router.post("/students/import")
async def import_students(
    file: UploadFile = File(...),
    admin_user: User = Depends(require_roles(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file format. Only CSV allowed.")
        
    contents = await file.read()
    decoded = contents.decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(decoded))
    
    created_count = 0
    updated_count = 0
    
    for row in reader:
        email = row.get('email', '').strip()
        full_name = row.get('full_name', '').strip()
        roll_number = row.get('roll_number', '').strip()
        
        if not email or not full_name:
            continue
            
        # Check existing
        stmt = select(User).where(User.email == email)
        res = await db.execute(stmt)
        user = res.scalars().first()
        
        if user:
            # Update
            user.full_name = full_name
            updated_count += 1
            if user.student_profile and roll_number:
                user.student_profile.roll_number = roll_number
        else:
            # Create
            user = User(
                email=email,
                hashed_password=get_password_hash("changeme123"),
                full_name=full_name,
                role=UserRole.STUDENT,
                is_active=True
            )
            db.add(user)
            await db.flush() # get user.id
            
            profile = StudentProfile(
                user_id=user.id,
                roll_number=roll_number or f"CB-{user.id:04d}",
                semester=1,
                program="Imported",
                total_points=0
            )
            db.add(profile)
            created_count += 1

    await create_audit_log(
        db=db,
        actor_id=admin_user.id,
        action="BULK_IMPORT_STUDENTS",
        resource_type="USER",
        resource_id="batch",
        details=f"Imported CSV. Created {created_count}, Updated {updated_count}"
    )
    
    await db.commit()
    return {"status": "success", "created": created_count, "updated": updated_count}
"""

if "@router.post(\"/students/import\")" not in content:
    content += endpoints

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added Bulk Import API")
