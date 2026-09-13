import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/frontend/src/pages/admin/AdminReportsPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'\{r\.details && <p.*?Details: \{r\.details\}</p>\}', "", content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
