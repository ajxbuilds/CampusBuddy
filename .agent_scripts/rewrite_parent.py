import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/frontend/src/pages/ParentDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update state variables
content = content.replace("const [ward, setWard] = useState<User | null>(null);", "const [wards, setWards] = useState<User[]>([]);\n  const [activeWardId, setActiveWardId] = useState<number | null>(null);")

# Update data fetching
old_fetch = '''        try {
          const [w, comps] = await Promise.all([
            api.getLinkedStudent(),
            api.listComplaints() // Assuming backend filters by parent's ward
          ]);
          setWard(w);
          setComplaints(comps.slice(0, 5));
        } catch (err) {'''

new_fetch = '''        try {
          const [ws, comps] = await Promise.all([
            api.getLinkedStudents(),
            api.listComplaints()
          ]);
          setWards(ws);
          if (ws.length > 0) setActiveWardId(ws[0].id);
          setComplaints(comps.slice(0, 5));
        } catch (err) {'''

content = content.replace(old_fetch, new_fetch)

# Add derived ward
content = content.replace("  const getStatusColor = (status: string) => {", "  const ward = wards.find(w => w.id === activeWardId) || null;\n\n  const getStatusColor = (status: string) => {")

# Update Linked Student Record UI
old_ward_ui = '''        {/* Linked Ward Panel */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center md:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 shadow-inner">
              <UserIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Linked Student Record</h2>
              {ward ? (
                <div>
                  <p className="text-xl font-black text-slate-900">{ward.full_name}</p>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">{ward.department || 'Enrolled Student'}</p>
                </div>
              ) : (
                <p className="text-sm font-bold text-red-500 bg-red-50 px-3 py-1 rounded-lg inline-block border border-red-100">
                  No student record linked to your account.
                </p>
              )}
            </div>
          </div>
          
          {ward && (
            <Link to="/complaints" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-sm transition flex items-center gap-2 whitespace-nowrap">
              View All Records <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>'''

new_ward_ui = '''        {/* Linked Wards Panel */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 shadow-inner">
              <UserIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">My Students</h2>
              {wards.length > 0 ? (
                wards.length === 1 ? (
                  <div>
                    <p className="text-xl font-black text-slate-900">{wards[0].full_name}</p>
                    <p className="text-sm font-medium text-slate-500 mt-0.5">{wards[0].department || 'Enrolled Student'}</p>
                  </div>
                ) : (
                  <select 
                    value={activeWardId || ''} 
                    onChange={(e) => setActiveWardId(Number(e.target.value))}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {wards.map(w => (
                      <option key={w.id} value={w.id}>{w.full_name} ({w.department})</option>
                    ))}
                  </select>
                )
              ) : (
                <p className="text-sm font-bold text-red-500 bg-red-50 px-3 py-1 rounded-lg inline-block border border-red-100">
                  No student records linked to your account.
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {ward && (
              <Link to="/complaints" className="flex-1 md:flex-none justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-sm transition flex items-center gap-2 whitespace-nowrap">
                View Records <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>'''

content = content.replace(old_ward_ui, new_ward_ui)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("ParentDashboard updated")
