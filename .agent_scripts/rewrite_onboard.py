import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/frontend/src/pages/OnboardingPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const [linkedStudentId, setLinkedStudentId] = useState<number | ''>('');", "const [parentLinkCode, setParentLinkCode] = useState('');")
content = content.replace("linked_student_id: selectedRole === 'PARENT' && linkedStudentId ? Number(linkedStudentId) : undefined,", "parent_link_code: selectedRole === 'PARENT' ? parentLinkCode : undefined,")

old_select_block = '''                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Student ID to Link
                  </label>
                  <input
                    type="number"
                    value={linkedStudentId}
                    onChange={(e) => setLinkedStudentId(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 1 (Aarav Sharma)"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Temporary for beta: Enter '1' for Aarav, '2' for Priya.
                  </p>
                </div>'''

new_input_block = '''                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Parent Link Code
                  </label>
                  <input
                    type="text"
                    value={parentLinkCode}
                    onChange={(e) => setParentLinkCode(e.target.value.toUpperCase())}
                    placeholder="CB-XXXX-XXXX"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Enter the unique link code provided by your student.
                  </p>
                </div>'''

content = content.replace(old_select_block, new_input_block)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
