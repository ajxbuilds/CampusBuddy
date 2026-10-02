import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';

export const AdminEscalationsPage = () => {
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEscalations = async () => {
      setLoading(true);
      try {
        // Fetch complaints with status ESCALATED
        const data = await api.listComplaints({ status_filter: 'ESCALATED' });
        setEscalations(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEscalations();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-rose-500" />
          Escalation Monitoring
        </h1>
        <p className="text-sm text-slate-500">Monitor and review unresolved escalated campus grievances.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-6 py-4 font-semibold">Code</th>
              <th className="px-6 py-4 font-semibold">Title</th>
              <th className="px-6 py-4 font-semibold">Student</th>
              <th className="px-6 py-4 font-semibold">Priority</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : escalations.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No active escalations.</td></tr>
            ) : escalations.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-mono font-bold text-slate-600">{c.complaint_code}</td>
                <td className="px-6 py-4 font-bold text-slate-900">{c.title}</td>
                <td className="px-6 py-4 text-slate-600">{c.student?.full_name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${c.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                    {c.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-[10px] font-bold rounded uppercase bg-orange-100 text-orange-700">
                    ESCALATED
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link to={`/complaints/${c.id}`} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold text-xs transition">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
