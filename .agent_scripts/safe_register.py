import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/frontend/src/pages/RegisterPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const [linkedStudentId, setLinkedStudentId] = useState<number | undefined>(undefined);", "const [parentLinkCode, setParentLinkCode] = useState('');")
content = content.replace("linked_student_id: role === 'PARENT' ? Number(linkedStudentId) : undefined,", "parent_link_code: role === 'PARENT' ? parentLinkCode : undefined,")

old_ui = '''              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Link to Student Ward
                </label>
                <select
                  value={linkedStudentId}
                  onChange={(e) => setLinkedStudentId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="">-- Select Student to Link --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.student_profile?.roll_number})
                    </option>
                  ))}
                </select>
              </div>'''

new_ui = '''              <div>
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
              </div>'''

if old_ui in content:
    content = content.replace(old_ui, new_ui)
else:
    print("WARNING: Exact UI string not found in RegisterPage")
    # try regex again but target the whole div safely
    content = re.sub(r'<div>\s*<label[^>]*>.*?Link to Student Ward.*?</label>\s*<select.*?value=\{linkedStudentId\}.*?</select>\s*</div>', new_ui, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
