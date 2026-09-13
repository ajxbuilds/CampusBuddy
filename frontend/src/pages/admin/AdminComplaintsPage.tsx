import React, { useState, useEffect } from 'react';
import { HelpCircle, Search, Filter } from 'lucide-react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';

export const AdminComplaintsPage = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const data = await api.listAdminComplaints(statusFilter, priorityFilter);
      setComplaints(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, priorityFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED': return 'bg-emerald-100 text-emerald-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'ESCALATED': return 'bg-orange-100 text-orange-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Complaints Oversight</h1>
        <p className="text-sm text-slate-500">Monitor and manage all campus grievances.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full md:w-64 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
          <option value="ALL">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="ESCALATED">Escalated</option>
          <option value="RESOLVED">Resolved</option>
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="w-full md:w-64 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
          <option value="ALL">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
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
            ) : complaints.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-mono font-bold text-slate-600">{c.complaint_code}</td>
                <td className="px-6 py-4 font-bold text-slate-900">{c.title}</td>
                <td className="px-6 py-4 text-slate-600">{c.student_name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${c.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                    {c.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${getStatusColor(c.status)}`}>
                    {c.status.replace('_', ' ')}
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
