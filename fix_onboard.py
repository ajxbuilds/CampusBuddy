import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/frontend/src/pages/OnboardingPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'<input\s+type="number"\s+value=\{linkedStudentId\}.*?/>\s*<p.*?</p>', '''<input
                    type="text"
                    value={parentLinkCode}
                    onChange={(e) => setParentLinkCode(e.target.value.toUpperCase())}
                    placeholder="CB-XXXX-XXXX"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Enter the unique link code provided by your student.
                  </p>''', content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
