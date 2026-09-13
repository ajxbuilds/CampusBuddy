import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/backend/seed.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'full_name="System Admin",', 'full_name="Admin",', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
