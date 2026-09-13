import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/frontend/src/pages/ProfilePage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

ui_section = '''
        {/* Parent Access Section */}
        {user?.role === 'STUDENT' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Link className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Parent Access</h2>
                <p className="text-xs text-slate-500">Link a parent to your CampusBuddy account.</p>
              </div>
            </div>

            {parentCode ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-sm font-semibold text-slate-700 mb-2">Parent Link Code</p>
                <div className="text-2xl font-mono font-black text-slate-900 tracking-widest mb-4">
                  {parentCode.code}
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button 
                    onClick={handleCopy}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </button>
                  <button 
                    onClick={handleGenerateCode}
                    disabled={generatingCode}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition flex items-center gap-2"
                  >
                    <RefreshCw className={w-4 h-4 } />
                    Regenerate
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-4">
                  Share this code with your parent to link their CampusBuddy account. Expires in 48 hours.
                </p>
              </div>
            ) : (
              <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl">
                <p className="text-sm text-slate-600 mb-4">Your parent has not been linked yet.</p>
                <button
                  onClick={handleGenerateCode}
                  disabled={generatingCode}
                  className="px-5 py-2.5 text-sm font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm inline-flex items-center gap-2"
                >
                  {generatingCode ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                  Generate Parent Link Code
                </button>
              </div>
            )}
          </div>
        )}'''

if "Parent Access Section" not in content:
    content = content.replace("      </div>\n    </div>\n  );\n};", ui_section + "\n      </div>\n    </div>\n  );\n};")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected Parent Access Section")
