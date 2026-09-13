import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/frontend/src/pages/ProfilePage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'className=\{w-4 h-4 \}', "className={w-4 h-4 }", content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
