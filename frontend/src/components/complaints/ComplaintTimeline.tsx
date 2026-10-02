import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  FileCheck2,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { ComplaintStatusHistory } from '../../types';

interface ComplaintTimelineProps {
  history: ComplaintStatusHistory[];
  currentStatus: string;
}

export const ComplaintTimeline: React.FC<ComplaintTimelineProps> = ({ history, currentStatus }) => {
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

  // Sort chronological order (oldest to newest for timeline presentation)
  const chronologicalHistory = [...history].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Resolution Progress Timeline</h3>
          <p className="text-xs text-slate-500 mt-0.5">Real-time verifiable tracking of all official department updates</p>
        </div>
        <span className="px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider bg-slate-100 text-slate-700">
          Status: {currentStatus}
        </span>
      </div>

      <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {chronologicalHistory.map((entry, index) => {
          const isLatest = index === chronologicalHistory.length - 1;
          return (
            <div key={entry.id} className="relative group">
              {/* Dot Icon */}
              <div
                className={`absolute -left-6 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white shadow-sm ${
                  isLatest ? getStatusColor(entry.to_status) : 'border-slate-300 text-slate-400'
                }`}
              >
                {getStatusIcon(entry.to_status)}
              </div>

              {/* Event Box */}
              <div className={`p-4 rounded-xl border transition-all ${
                isLatest
                  ? 'border-blue-200 bg-blue-50/40 shadow-sm ring-1 ring-blue-500/10'
                  : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {entry.to_status.replace('_', ' ')}
                    </span>
                    {entry.actor && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 font-medium">
                        By {entry.actor.full_name} ({entry.actor.role})
                      </span>
                    )}
                  </div>
                  <time className="text-[11px] text-slate-400 font-medium">
                    {new Date(entry.created_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>

                {entry.remarks && (
                  <p className="text-xs text-slate-700 mt-2 font-normal leading-relaxed bg-white/80 p-2.5 rounded-lg border border-slate-100">
                    {entry.remarks}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
