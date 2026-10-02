import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  AlertCircle,
  TrendingUp,
  Paperclip,
  ArrowRight,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { Complaint, ComplaintPriority, ComplaintStatus } from '../../types';

interface ComplaintCardProps {
  complaint: Complaint;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({ complaint }) => {
  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'UNDER_REVIEW':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ESCALATED':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse';
      case 'REJECTED':
      case 'CLOSED':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getPriorityBadge = (priority: ComplaintPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-500 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'MEDIUM':
        return 'bg-amber-400 text-slate-900';
      case 'LOW':
        return 'bg-slate-200 text-slate-700';
      default:
        return 'bg-slate-200 text-slate-700';
    }
  };

  const isSlaBreached =
    complaint.sla_deadline &&
    new Date() > new Date(complaint.sla_deadline) &&
    complaint.status !== 'RESOLVED' &&
    complaint.status !== 'CLOSED';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all group flex flex-col justify-between">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              {complaint.complaint_code}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getPriorityBadge(
                complaint.priority
              )}`}
            >
              {complaint.priority}
            </span>
          </div>

          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(
              complaint.status
            )}`}
          >
            {complaint.status.replace('_', ' ')}
          </span>
        </div>

        {/* Title & Preview */}
        <Link to={`/complaints/${complaint.id}`}>
          <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1.5">
            {complaint.title}
          </h4>
        </Link>
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {complaint.description}
        </p>
      </div>

      {/* Meta info & Footer */}
      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1 font-medium text-slate-600">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            {complaint.category?.name || 'General'}
          </span>

          {complaint.attachment_url && (
            <span className="flex items-center gap-1 text-slate-400">
              <Paperclip className="w-3 h-3" />
              Attachment
            </span>
          )}
        </div>

        {/* SLA / Escalation status */}
        <div className="flex items-center justify-between text-[11px] mt-1">
          {complaint.is_escalated ? (
            <span className="flex items-center gap-1 text-rose-600 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              Escalation Active
            </span>
          ) : isSlaBreached ? (
            <span className="flex items-center gap-1 text-amber-600 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              SLA Overdue
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              Filed {new Date(complaint.created_at).toLocaleDateString()}
            </span>
          )}

          <Link
            to={`/complaints/${complaint.id}`}
            className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            Track <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};
