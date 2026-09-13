import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/frontend/src/pages/RegisterPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'<select.*?value=\{linkedStudentId\}.*?</select>', '''<input
                  type="text"
                  placeholder="CB-XXXX-XXXX"
                  value={parentLinkCode}
                  onChange={(e) => setParentLinkCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none uppercase font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Enter the unique link code provided by your student.</p>''', content, flags=re.DOTALL)

content = content.replace("Link to Student Ward", "Parent Link Code")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
