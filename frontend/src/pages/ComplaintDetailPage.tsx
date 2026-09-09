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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Complaint, ComplaintStatus } from '../types';
import { ComplaintTimeline } from '../components/complaints/ComplaintTimeline';

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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading complaint record...
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Unable to load complaint</h2>
        <p className="text-xs text-slate-500">{error || 'Complaint record not found.'}</p>
        <button
          onClick={() => navigate('/complaints')}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl"
        >
          Back to Complaints
        </button>
      </div>
    );
  }

  const isStudentAuthor = user?.id === complaint.student_id;
  const canManage = user?.role === 'ADMIN' || user?.role === 'TEACHER';
  const isSlaBreached =
    complaint.sla_deadline &&
    new Date() > new Date(complaint.sla_deadline) &&
    complaint.status !== 'RESOLVED' &&
    complaint.status !== 'CLOSED';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                {complaint.complaint_code}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {complaint.category?.name}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                Priority: {complaint.priority}
              </span>
              {complaint.is_escalated && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-pulse">
                  ESCALATED
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
              {complaint.title}
            </h1>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider bg-slate-100 text-slate-800">
              {complaint.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Student</span>
            <p className="font-bold text-slate-800">{complaint.student?.full_name}</p>
            <p className="text-slate-500">{complaint.student?.email}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Department In Charge</span>
            <p className="font-bold text-slate-800">{complaint.category?.department}</p>
            <p className="text-slate-500">SLA: {complaint.category?.sla_hours} Hours Target</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Assigned Staff</span>
            <p className="font-bold text-slate-800">
              {complaint.assignee?.full_name || 'Under Administrative Assignment'}
            </p>
            <p className="text-slate-500">{complaint.assignee?.department || '-'}</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Statement of Problem
          </h3>
          <p className="text-sm text-slate-800 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
            {complaint.description}
          </p>
        </div>

        {/* Attachment if present */}
        {complaint.attachment_url && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Document Attachment
            </h3>
            <a
              href={complaint.attachment_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-blue-600 transition"
            >
              <Paperclip className="w-4 h-4" /> View Supporting Attachment File
            </a>
          </div>
        )}

        {/* Action Panel for Student: Escalation Request */}
        {isStudentAuthor && complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED' && !complaint.is_escalated && (
          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                <TrendingUp className="w-4 h-4" /> Need Expedited Review?
              </div>
              <p className="text-[11px] text-rose-700/90 mt-0.5">
                If the departmental SLA is breached or you require administrative escalation, you can escalate this ticket.
              </p>
            </div>
            <button
              onClick={() => setIsEscalateModalOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition whitespace-nowrap"
            >
              Request Escalation
            </button>
          </div>
        )}

        {/* Action Panel for Teachers / Admins: Status Update */}
        {canManage && (
          <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
              <Edit className="w-4 h-4 text-indigo-600" />
              Administrative Action & Progress Update
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Update Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
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
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Official Remarks / Action Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Investigated with finance gateway, receipt verified."
                    value={statusRemarks}
                    onChange={(e) => setStatusRemarks(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Commit Status Update'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Visual Resolution Timeline */}
      <ComplaintTimeline
        history={complaint.history || []}
        currentStatus={complaint.status}
      />

      {/* Escalation Request Modal */}
      {isEscalateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Request Official Escalation</h3>
              <button
                onClick={() => setIsEscalateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestEscalation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Escalation Level
                </label>
                <select
                  value={escalateLevel}
                  onChange={(e) => setEscalateLevel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="LEVEL_1">Level 1 - Department Head Review</option>
                  <option value="LEVEL_2">Level 2 - Dean / Grievance Redressal Cell</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Escalation
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why standard turnaround or resolution was unsatisfactory..."
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEscalateModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEscalating}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
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
