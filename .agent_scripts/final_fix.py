import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/frontend/src/pages/RegisterPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'<div className="p-3 bg-amber-50/50.*?<label.*?>\s*Link to Student Ward\s*</label>.*?<select.*?>.*?</select>\s*<p.*?>\s*Enables verified access to track your ward\'s complaints.\s*</p>\s*</div>', '''<div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Parent Link Code
              </label>
              <input
                type="text"
                placeholder="CB-XXXX-XXXX"
                value={parentLinkCode}
                onChange={(e) => setParentLinkCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none uppercase font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Enables verified access to track your ward's complaints.
              </p>
            </div>''', content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Replaced!")
