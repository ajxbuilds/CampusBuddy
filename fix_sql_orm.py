import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/backend/app/api/auth.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_sql = '''    await db.execute(
        text("UPDATE parent_link_codes SET is_active = FALSE WHERE student_id = :student_id"),
        {"student_id": current_user.id}
    )'''

new_sql = '''    stmt = select(ParentLinkCode).where(ParentLinkCode.student_id == current_user.id, ParentLinkCode.is_active == True)
    res = await db.execute(stmt)
    for code_obj in res.scalars().all():
        code_obj.is_active = False'''

content = content.replace(old_sql, new_sql)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated SQL logic")
