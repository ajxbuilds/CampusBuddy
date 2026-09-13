import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/frontend/src/pages/RegisterPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'<div>\s*<label[^>]*>\s*Link to Student Ward\s*</label>.*?<select[^>]*>.*?</select>\s*</div>', '''<div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Parent Link Code
                </label>
                <input
                  type="text"
                  placeholder="CB-XXXX-XXXX"
                  value={parentLinkCode}
                  onChange={(e) => setParentLinkCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none uppercase font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Enter the unique link code provided by your student.</p>
              </div>''', content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Regex replace done")
