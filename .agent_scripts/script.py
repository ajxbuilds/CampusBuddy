import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/backend/app/api/auth.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Register logic
old_register_logic = '''    # If parent, link to student if provided
    if user_in.role == UserRole.PARENT and user_in.linked_student_id:
        parent_link = ParentLink(
            parent_id=user.id,
            student_id=user_in.linked_student_id,
            relation_type="Parent",
            is_verified=True
        )
        db.add(parent_link)'''

new_register_logic = '''    # If parent, link to student using parent_link_code if provided
    if user_in.role == UserRole.PARENT and user_in.parent_link_code:
        code_str = user_in.parent_link_code.strip().upper()
        stmt = select(ParentLinkCode).where(ParentLinkCode.code == code_str, ParentLinkCode.is_active == True)
        res = await db.execute(stmt)
        code_obj = res.scalars().first()
        if code_obj and code_obj.expires_at >= datetime.now(timezone.utc):
            parent_link = ParentLink(
                parent_id=user.id,
                student_id=code_obj.student_id,
                relation_type="Parent",
                is_verified=True
            )
            db.add(parent_link)
            code_obj.is_active = False
            code_obj.used_at = datetime.now(timezone.utc)
            code_obj.used_by_parent_id = user.id'''

content = content.replace(old_register_logic, new_register_logic)

# Replace Onboarding logic
old_onboard_logic = '''    if onboard_in.role == UserRole.PARENT and onboard_in.linked_student_id:
        stu = await db.scalar(select(User).where(User.id == onboard_in.linked_student_id, User.role == UserRole.STUDENT))
        if stu:
            parent_link = ParentLink(
                parent_id=user.id,
                student_id=onboard_in.linked_student_id,
                relation_type="Parent",
                is_verified=True
            )
            db.add(parent_link)'''

new_onboard_logic = '''    if onboard_in.role == UserRole.PARENT and onboard_in.parent_link_code:
        code_str = onboard_in.parent_link_code.strip().upper()
        stmt = select(ParentLinkCode).where(ParentLinkCode.code == code_str, ParentLinkCode.is_active == True)
        res = await db.execute(stmt)
        code_obj = res.scalars().first()
        if code_obj and code_obj.expires_at >= datetime.now(timezone.utc):
            parent_link = ParentLink(
                parent_id=user.id,
                student_id=code_obj.student_id,
                relation_type="Parent",
                is_verified=True
            )
            db.add(parent_link)
            code_obj.is_active = False
            code_obj.used_at = datetime.now(timezone.utc)
            code_obj.used_by_parent_id = user.id'''

content = content.replace(old_onboard_logic, new_onboard_logic)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
