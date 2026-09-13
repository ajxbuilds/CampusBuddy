import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/frontend/src/pages/ParentDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'const \[w, comps\].*?setWard\(w\);', '''const [ws, comps] = await Promise.all([
            api.getLinkedStudents(),
            api.listComplaints()
          ]);
          setWards(ws);
          if (ws.length > 0) setActiveWardId(ws[0].id);''', content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
