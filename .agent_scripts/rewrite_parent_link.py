import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/frontend/src/pages/ParentDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add state for linking
content = content.replace("  const [loading, setLoading] = useState(true);", "  const [loading, setLoading] = useState(true);\n  const [linkCode, setLinkCode] = useState('');\n  const [linking, setLinking] = useState(false);\n  const [linkError, setLinkError] = useState<string|null>(null);\n  const [linkSuccess, setLinkSuccess] = useState<string|null>(null);\n\n  const handleLinkStudent = async () => {\n    if (!linkCode.trim()) return;\n    setLinking(true);\n    setLinkError(null);\n    setLinkSuccess(null);\n    try {\n      const res = await api.linkParent(linkCode);\n      setLinkSuccess(res.message);\n      const ws = await api.getLinkedStudents();\n      setWards(ws);\n      if (ws.length > 0 && !activeWardId) setActiveWardId(ws[0].id);\n      setLinkCode('');\n    } catch(err: any) {\n      setLinkError(err.message || 'Failed to link student.');\n    } finally {\n      setLinking(false);\n    }\n  };\n")

# Add Link New Student UI
link_ui = '''        {/* Link New Student */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Link a Student</h2>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1 w-full relative">
              <input 
                type="text" 
                value={linkCode}
                onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                placeholder="Enter Parent Link Code (e.g. CB-XXXX-XXXX)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase text-sm"
              />
            </div>
            <button 
              onClick={handleLinkStudent}
              disabled={linking || !linkCode}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-sm transition w-full md:w-auto"
            >
              {linking ? 'Verifying...' : 'Verify & Link'}
            </button>
          </div>
          {linkError && <p className="mt-3 text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg inline-block border border-red-100">{linkError}</p>}
          {linkSuccess && <p className="mt-3 text-xs font-bold text-emerald-600 bg-emerald-50 p-2 rounded-lg inline-block border border-emerald-100">{linkSuccess}</p>}
        </div>'''

content = content.replace("{/* Linked Wards Panel */}", link_ui + "\n\n        {/* Linked Wards Panel */}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Link Student UI added")
