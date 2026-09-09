import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Search,
  Filter,
  Check,
  X,
  Eye,
  FileSpreadsheet,
  Activity,
} from 'lucide-react';
import { api } from '../services/api';
import {
  AdminStats,
  Complaint,
  CategoryDistribution,
  ComplaintsTrendPoint,
  ReportResponse,
  AuditLog,
  User,
} from '../types';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [catDistribution, setCatDistribution] = useState<CategoryDistribution[]>([]);
  const [trends, setTrends] = useState<ComplaintsTrendPoint[]>([]);
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'complaints' | 'reports' | 'audit'>('complaints');

  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const [st, cmps, cats, tr, rep, logs, stf] = await Promise.all([
        api.getAdminStats(),
        api.listComplaints(),
        api.getCategoryDistribution(),
        api.getTrends(7),
        api.listReports('PENDING'),
        api.listAuditLogs(),
        api.listStaff(),
      ]);
      setStats(st);
      setComplaints(cmps);
      setCatDistribution(cats);
      setTrends(tr);
      setReports(rep);
      setAuditLogs(logs);
      setStaff(stf);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (complaintId: number, newStatus: string) => {
    try {
      await api.updateComplaint(complaintId, { status: newStatus, remarks: `Status updated to ${newStatus} by Admin.` });
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Update failed');
    }
  };

  const handleAssignStaff = async (complaintId: number, staffId: number) => {
    try {
      await api.updateComplaint(complaintId, { assigned_to: staffId, remarks: `Assigned to staff by Admin.` });
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Assignment failed');
    }
  };

  const handleModeration = async (reportId: number, action: 'dismiss' | 'hide_content') => {
    try {
      await api.handleReport(reportId, action, `Report ${action} by Admin`);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.complaint_code.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (c.student?.full_name && c.student.full_name.toLowerCase().includes(searchFilter.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider">
              Administration Control Center
            </span>
            <span className="text-xs text-purple-200">
              Dean &bull; Grievance Cell Oversight
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Campus Problem Resolution Command
          </h1>
          <p className="text-sm text-purple-100 max-w-xl mt-1 leading-relaxed">
            Monitor college SLAs, assign complaints, resolve escalations, and moderate community contributions.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold bg-white/10 backdrop-blur p-3.5 rounded-2xl border border-white/20">
          <div>
            <span className="text-purple-200 block text-[10px] uppercase">Resolution Rate</span>
            <span className="text-lg font-bold text-white">{stats?.resolution_rate_percent || 0}%</span>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div>
            <span className="text-purple-200 block text-[10px] uppercase">Avg Turnaround</span>
            <span className="text-lg font-bold text-white">{stats?.avg_resolution_time_hours || 0}h</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Tickets</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total_complaints || 0}</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Pending Review</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats?.pending_complaints || 0}</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">In Progress</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">{stats?.in_progress_complaints || 0}</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Resolved</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.resolved_complaints || 0}</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Escalated</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{stats?.escalated_complaints || 0}</p>
        </div>
      </div>

      {/* Visual Charts / Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Complaints by Category Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Complaints by Category</h3>
              <p className="text-xs text-slate-500">Volume and resolution distribution</p>
            </div>
            <BarChart3 className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-3">
            {catDistribution.slice(0, 6).map((cat) => {
              const maxVal = Math.max(...catDistribution.map((c) => c.count), 1);
              const percentage = Math.round((cat.count / maxVal) * 100);
              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>{cat.category}</span>
                    <span>
                      {cat.count} total ({cat.resolved_count} resolved)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7-Day Trend Overview */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">7-Day Filing vs Resolution Trends</h3>
              <p className="text-xs text-slate-500">Daily intake velocity</p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="grid grid-cols-7 gap-2 pt-6 h-48 items-end">
            {trends.map((t, idx) => {
              const barHeight = Math.min(100, Math.max(15, t.count * 30));
              return (
                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-bold text-slate-600">{t.count}</span>
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg transition-all"
                    style={{ height: `${barHeight}%` }}
                  />
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">{t.date}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Admin Tab Controller */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 px-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('complaints')}
            className={`py-4 text-sm font-bold border-b-2 transition ${
              activeTab === 'complaints'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            All Complaints & Action Center ({complaints.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Moderation Queue ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-4 text-sm font-bold border-b-2 transition ${
              activeTab === 'audit'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            System Audit Logs
          </button>
        </div>

        {/* Tab 1: Complaints Table */}
        {activeTab === 'complaints' && (
          <div className="p-6 space-y-4">
            {/* Search & Status Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="Search code, title, student..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Filter Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ESCALATED">Escalated</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {/* Complaints Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Title & Category</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Assignee</th>
                    <th className="px-4 py-3">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredComplaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        <Link to={`/complaints/${c.id}`} className="hover:underline">
                          {c.complaint_code}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">
                        {c.student?.full_name}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <Link to={`/complaints/${c.id}`} className="font-bold text-slate-900 line-clamp-1 hover:text-blue-600">
                          {c.title}
                        </Link>
                        <span className="text-[10px] text-slate-400">{c.category?.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.priority === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-700'
                              : c.priority === 'HIGH'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={c.status}
                          onChange={(e) => handleUpdateStatus(c.id, e.target.value)}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                        >
                          <option value="SUBMITTED">SUBMITTED</option>
                          <option value="UNDER_REVIEW">UNDER REVIEW</option>
                          <option value="ASSIGNED">ASSIGNED</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="REJECTED">REJECTED</option>
                          <option value="ESCALATED">ESCALATED</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={c.assigned_to || ''}
                          onChange={(e) => handleAssignStaff(c.id, Number(e.target.value))}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
                        >
                          <option value="">Unassigned</option>
                          {staff.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.full_name} ({s.role})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          to={`/complaints/${c.id}`}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-xs inline-flex items-center gap-1 transition"
                        >
                          View Full <Eye className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Moderation Queue */}
        {activeTab === 'reports' && (
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Reported Community Content</h3>
            {reports.length === 0 ? (
              <p className="text-xs text-slate-500">No pending reports in the moderation queue.</p>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                        Reported {r.target_type} #{r.target_id}
                      </span>
                      <p className="text-xs text-slate-800 mt-1">Reason: "{r.reason}"</p>
                      <span className="text-[10px] text-slate-400">Reported by {r.reporter?.full_name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleModeration(r.id, 'dismiss')}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleModeration(r.id, 'hide_content')}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-bold text-white shadow-sm transition"
                      >
                        Hide Content
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">System Audit Trail</h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Resource</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {log.actor?.full_name || `User #${log.actor_id}`}
                      </td>
                      <td className="px-4 py-3 font-mono text-indigo-700">{log.action}</td>
                      <td className="px-4 py-3">{log.resource_type} #{log.resource_id}</td>
                      <td className="px-4 py-3 text-slate-500">{log.details || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
