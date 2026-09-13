import React, { useState, useEffect } from 'react';
import { Flag, Eye, EyeOff, Shield } from 'lucide-react';
import { api } from '../../services/api';
import { ReportResponse } from '../../types';

export const AdminReportsPage = () => {
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.listReports(statusFilter);
      setReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleAction = async (reportId: number, action: 'dismiss' | 'hide_content') => {
    if (!window.confirm(`Are you sure you want to ${action.replace('_', ' ')}?`)) return;
    try {
      await api.handleReport(reportId, action);
      fetchReports();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Community Moderation</h1>
        <p className="text-sm text-slate-500">Review and act upon reported community posts and answers.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full md:w-64 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending Review</option>
          <option value="REVIEWED">Action Taken</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
            <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p>No reports found.</p>
          </div>
        ) : (
          reports.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold text-[10px] uppercase rounded">
                    {r.reason.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Reported by {r.reporter?.full_name || 'Unknown'} on {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 italic border-l-4 border-slate-300">
                  Target ID: {r.target_id} ({r.target_type})
                </div>
                
                {r.admin_notes && <p className="text-xs text-indigo-600 font-bold bg-indigo-50 p-2 rounded-lg">Admin Note: {r.admin_notes}</p>}
              </div>
              
              {r.status === 'PENDING' && (
                <div className="flex items-start gap-2">
                  <button onClick={() => handleAction(r.id, 'dismiss')} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs rounded-xl transition">
                    Dismiss
                  </button>
                  <button onClick={() => handleAction(r.id, 'hide_content')} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 font-bold text-xs rounded-xl transition flex items-center gap-2">
                    <EyeOff className="w-4 h-4" /> Hide Content
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
