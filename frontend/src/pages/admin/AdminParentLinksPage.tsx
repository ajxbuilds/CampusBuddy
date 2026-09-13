import React, { useState, useEffect } from 'react';
import { LinkIcon, Trash2, Plus } from 'lucide-react';
import { api } from '../../services/api';

export const AdminParentLinksPage = () => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual linking
  const [parentId, setParentId] = useState('');
  const [studentId, setStudentId] = useState('');

  const fetchLinks = async () => {
    try {
      const data = await api.listParentLinks();
      setLinks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createParentLink(Number(parentId), Number(studentId));
      setParentId('');
      setStudentId('');
      fetchLinks();
      alert('Linked successfully');
    } catch (e: any) {
      alert(e.message || 'Failed to link');
    }
  };

  const handleUnlink = async (linkId: number) => {
    if (!window.confirm('Remove this parent-student link?')) return;
    try {
      await api.deleteParentLink(linkId);
      fetchLinks();
    } catch (e: any) {
      alert(e.message || 'Failed to unlink');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Parent Relationships</h1>
        <p className="text-sm text-slate-500">Manage Parent-Student connections.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Manual Linking Fallback</h2>
        <form onSubmit={handleLink} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">Parent User ID</label>
            <input required type="number" value={parentId} onChange={e => setParentId(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">Student User ID</label>
            <input required type="number" value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
          </div>
          <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Link
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-6 py-4 font-semibold">Parent</th>
              <th className="px-6 py-4 font-semibold">Student</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Created</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : links.map(l => (
              <tr key={l.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-bold text-slate-900">{l.parent_name} (ID: {l.parent_id})</td>
                <td className="px-6 py-4 font-bold text-slate-900">{l.student_name} (ID: {l.student_id})</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded">Verified</span></td>
                <td className="px-6 py-4 text-slate-500">{new Date(l.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleUnlink(l.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
