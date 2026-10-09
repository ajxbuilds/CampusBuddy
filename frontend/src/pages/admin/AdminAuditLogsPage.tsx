import React, { useState, useEffect } from 'react';
import { Shield, Clock, User, Activity, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';

export const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [skip, setSkip] = useState(0);
  const limit = 50;

  // Filters
  const [quickFilter, setQuickFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [action, setAction] = useState('');

    const fetchLogsWithArgs = async (
    qFilter: string,
    sDate: string,
    eDate: string,
    act: string,
    sSkip: number
  ) => {
    setLoading(true);
    try {
      let queryStart = sDate;
      let queryEnd = eDate;

      if (qFilter) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let from = new Date(today);
        let to = new Date(today);

        if (qFilter === 'today') {
          // already today
        } else if (qFilter === 'yesterday') {
          from.setDate(today.getDate() - 1);
          to.setDate(today.getDate() - 1);
        } else if (qFilter === '7days') {
          from.setDate(today.getDate() - 7);
        } else if (qFilter === '30days') {
          from.setDate(today.getDate() - 30);
        } else if (qFilter === 'this_month') {
          from.setDate(1);
        }

        if (qFilter !== 'yesterday') {
          to = new Date();
        } else {
          to.setHours(23, 59, 59, 999);
        }

        queryStart = from.toISOString();
        queryEnd = to.toISOString();
      } else if (sDate || eDate) {
         if (sDate) {
           const s = new Date(sDate);
           queryStart = s.toISOString();
         }
         if (eDate) {
           const e = new Date(eDate);
           e.setHours(23, 59, 59, 999);
           queryEnd = e.toISOString();
         }
      }

      const data = await api.listAuditLogs({
        limit,
        skip: sSkip,
        start_date: queryStart || undefined,
        end_date: queryEnd || undefined,
        action: act || undefined
      });
      setLogs(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = () => fetchLogsWithArgs(quickFilter, startDate, endDate, action, skip);
  useEffect(() => {
    fetchLogs();
  }, [skip, quickFilter]); // auto refetch on these

  const handleApplyCustom = () => {
    setQuickFilter('');
    setSkip(0);
    fetchLogsWithArgs('', startDate, endDate, action, 0);
  };

  const handleClearFilters = () => {
    setQuickFilter('');
    setStartDate('');
    setEndDate('');
    setAction('');
    setSkip(0);
    fetchLogsWithArgs('', '', '', '', 0);
  };

  const groupedLogs = logs.reduce((acc, log) => {
    const d = new Date(log.created_at);
    const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(log);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Security Audit Logs</h1>
          <p className="text-sm text-slate-500">Immutable record of all administrative and sensitive operations.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="border-slate-300 rounded-lg text-sm"
            value={quickFilter}
            onChange={(e) => {
              setQuickFilter(e.target.value);
              setStartDate('');
              setEndDate('');
              setSkip(0);
            }}
          >
            <option value="">Quick Filters...</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="this_month">This Month</option>
          </select>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          <input
            type="date"
            className="border-slate-300 rounded-lg text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            className="border-slate-300 rounded-lg text-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button
            onClick={handleApplyCustom}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700"
          >
            Apply Filters
          </button>

          {(quickFilter || startDate || endDate || action) && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg text-sm font-semibold hover:bg-slate-200 flex items-center gap-1 ml-auto"
            >
              <X className="w-4 h-4" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading secure logs...</div>
        ) : Object.keys(groupedLogs).length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No audit activity found for the selected period.</p>
          </div>
        ) : (
          <div>
            {Object.entries(groupedLogs).map(([dateStr, dayLogs]) => (
              <div key={dateStr} className="mb-6 last:mb-0">
                <div className="bg-slate-100/80 px-6 py-2 border-y border-slate-200">
                  <h3 className="font-bold text-slate-800 text-sm">{dateStr}</h3>
                </div>
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {(dayLogs as any[]).map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3 whitespace-nowrap text-slate-500 font-medium w-32">
                          {new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="px-6 py-3 font-bold text-slate-900 w-48">
                          {l.actor?.full_name || 'System'}
                          <div className="text-xs font-normal text-slate-500">{l.actor?.role || 'SYSTEM'}</div>
                        </td>
                        <td className="px-6 py-3 w-48">
                          <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase">
                            {l.action}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-mono text-xs text-slate-600 w-48">
                          {l.resource_type}:{l.resource_id}
                        </td>
                        <td className="px-6 py-3 text-slate-600 text-xs">
                          {l.details || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && total > limit && (
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">
            Showing {skip + 1} to {Math.min(skip + limit, total)} of {total} events
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={skip === 0}
              onClick={() => setSkip(Math.max(0, skip - limit))}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={skip + limit >= total}
              onClick={() => setSkip(skip + limit)}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
