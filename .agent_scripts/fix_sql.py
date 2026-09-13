import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/backend/app/api/auth.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_sql = 'text("UPDATE parent_link_codes SET is_active = 0 WHERE student_id = :student_id")'
new_sql = 'text("UPDATE parent_link_codes SET is_active = FALSE WHERE student_id = :student_id")'
content = content.replace(old_sql, new_sql)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated SQL boolean")
