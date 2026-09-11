import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Paperclip,
  ArrowLeft,
  User as UserIcon,
  Building,
  Edit,
  Send,
  XCircle,
  FileCheck2,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Complaint, ComplaintStatus, ComplaintStatusHistory } from '../types';
import { Skeleton } from '../components/ui/Skeleton';

export const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Escalation Request Modal State
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [escalateLevel, setEscalateLevel] = useState('LEVEL_1');
  const [isEscalating, setIsEscalating] = useState(false);

  // Status Update State (Admin / Teacher)
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchComplaint = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getComplaint(Number(id));
      setComplaint(data);
      setNewStatus(data.status);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleRequestEscalation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !escalateReason.trim()) return;

    setIsEscalating(true);
    try {
      await api.requestEscalation(complaint.id, {
        reason: escalateReason.trim(),
        level: escalateLevel,
      });
      setIsEscalateModalOpen(false);
      setEscalateReason('');
      await fetchComplaint();
    } catch (err: any) {
      alert(err.message || 'Escalation failed');
    } finally {
      setIsEscalating(false);
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !newStatus) return;

    setIsUpdating(true);
    try {
      await api.updateComplaint(complaint.id, {
        status: newStatus,
        remarks: statusRemarks.trim() || `Status updated to ${newStatus}`,
      });
      setStatusRemarks('');
      await fetchComplaint();
    } catch (err: any) {
      alert(err.message || 'Failed to update complaint status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <FileCheck2 className="w-5 h-5 text-blue-600" />;
      case 'UNDER_REVIEW':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return <UserCheck className="w-5 h-5 text-indigo-600" />;
      case 'RESOLVED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'REJECTED':
      case 'CLOSED':
        return <XCircle className="w-5 h-5 text-slate-500" />;
      case 'ESCALATED':
        return <TrendingUp className="w-5 h-5 text-rose-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'border-blue-500 bg-blue-50';
      case 'UNDER_REVIEW':
        return 'border-amber-500 bg-amber-50';
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return 'border-indigo-500 bg-indigo-50';
      case 'RESOLVED':
        return 'border-emerald-500 bg-emerald-50';
      case 'REJECTED':
      case 'CLOSED':
        return 'border-slate-500 bg-slate-50';
      case 'ESCALATED':
        return 'border-rose-500 bg-rose-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Skeleton className="h-4 w-20 rounded" />
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-6 border-b border-slate-100">
            <div className="space-y-3">
              <Skeleton className="h-6 w-48 rounded" />
              <Skeleton className="h-8 w-64 rounded" />
            </div>
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Unable to load complaint</h2>
        <p className="text-sm text-slate-500">{error || 'Complaint record not found.'}</p>
        <button
          onClick={() => navigate('/complaints')}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-sm font-bold rounded-xl transition-colors"
        >
          Back to Complaints
        </button>
      </div>
    );
  }

  const isStudentAuthor = user?.id === complaint.student_id;
  const canManage = user?.role === 'ADMIN' || user?.role === 'TEACHER';
  
  const chronologicalHistory = [...(complaint.history || [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header Badges */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                {complaint.complaint_code}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {complaint.category?.name}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
                Priority: {complaint.priority}
              </span>
              {complaint.is_escalated && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 animate-pulse">
                  ESCALATED
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-950 mt-1">
              {complaint.title}
            </h1>
          </div>

          <div className="text-right shrink-0">
            <span className={`text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider ${getStatusColor(complaint.status)} border`}>
              {complaint.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider mb-1">Where is it?</span>
            <p className="font-bold text-slate-800">{complaint.category?.department}</p>
            <p className="text-slate-500 text-xs">SLA: {complaint.category?.sla_hours} Hours Target</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider mb-1">Who is handling it?</span>
            <p className="font-bold text-slate-800">
              {complaint.assignee?.full_name || 'Under Administrative Assignment'}
            </p>
            <p className="text-slate-500 text-xs">{complaint.assignee?.department || '-'}</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider mb-1">Reported By</span>
            <p className="font-bold text-slate-800">{complaint.student?.full_name}</p>
            <p className="text-slate-500 text-xs">{complaint.student?.email}</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Statement of Problem
          </h3>
          <p className="text-sm text-slate-800 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
            {complaint.description}
          </p>
        </div>

        {/* Attachment if present */}
        {complaint.attachment_url && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Supporting Document
            </h3>
            <a
              href={complaint.attachment_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-blue-600 transition-colors"
            >
              <Paperclip className="w-4 h-4" /> View Attachment File
            </a>
          </div>
        )}

        {/* Action Panel for Student: Escalation Request */}
        {isStudentAuthor && complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED' && !complaint.is_escalated && (
          <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-rose-800">
                <TrendingUp className="w-5 h-5" /> Need Expedited Review?
              </div>
              <p className="text-xs text-rose-700/90 mt-1 max-w-lg">
                If the departmental SLA is breached or you require administrative escalation, you can formally escalate this ticket to higher authorities.
              </p>
            </div>
            <button
              onClick={() => setIsEscalateModalOpen(true)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-sm font-bold shadow-sm transition-all whitespace-nowrap"
            >
              Request Escalation
            </button>
          </div>
        )}

        {/* Action Panel for Teachers / Admins: Status Update */}
        {canManage && (
          <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-4 mt-6">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-900">
              <Edit className="w-5 h-5 text-blue-600" />
              Administrative Action & Progress Update
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Update Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                  >
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="ESCALATED">ESCALATED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Official Remarks / Action Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Investigated with finance gateway, receipt verified."
                    value={statusRemarks}
                    onChange={(e) => setStatusRemarks(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Commit Status Update'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Visual Resolution Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-slate-100 gap-4">
          <div>
            <h3 className="text-lg font-bold text-blue-950">Resolution Timeline</h3>
            <p className="text-sm text-slate-500 mt-1">What has happened and what happens next</p>
          </div>
        </div>

        <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {chronologicalHistory.length === 0 ? (
            <div className="text-sm text-slate-400 py-4">No progress recorded yet.</div>
          ) : (
            chronologicalHistory.map((entry, index) => {
              const isLatest = index === chronologicalHistory.length - 1;
              return (
                <div 
                  key={entry.id} 
                  className="relative group animate-in fade-in slide-in-from-bottom-2 duration-500"
                  style={{ animationFillMode: 'both', animationDelay: `${index * 150}ms` }}
                >
                  {/* Dot Icon */}
                  <div
                    className={`absolute -left-6 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white shadow-sm transition-colors duration-300 ${
                      isLatest ? getStatusColor(entry.to_status) : 'border-slate-300 text-slate-400'
                    }`}
                  >
                    {getStatusIcon(entry.to_status)}
                  </div>

                  {/* Event Box */}
                  <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                    isLatest
                      ? 'border-blue-200 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/10'
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                  }`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                          {entry.to_status.replace('_', ' ')}
                        </span>
                        {entry.actor && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 font-medium">
                            By {entry.actor.full_name} ({entry.actor.role})
                          </span>
                        )}
                      </div>
                      <time className="text-xs text-slate-400 font-medium">
                        {new Date(entry.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>

                    {entry.remarks && (
                      <p className="text-sm text-slate-700 mt-3 font-normal leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-100">
                        {entry.remarks}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Escalation Request Modal */}
      {isEscalateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-blue-950">Request Official Escalation</h3>
              <button
                onClick={() => setIsEscalateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleRequestEscalation} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Escalation Level
                </label>
                <select
                  value={escalateLevel}
                  onChange={(e) => setEscalateLevel(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="LEVEL_1">Level 1 - Department Head Review</option>
                  <option value="LEVEL_2">Level 2 - Admin / Grievance Redressal Cell</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Reason for Escalation
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain why standard turnaround or resolution was unsatisfactory..."
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEscalateModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEscalating}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {isEscalating ? 'Escalating...' : 'Submit Escalation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

