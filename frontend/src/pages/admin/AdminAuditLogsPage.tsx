import React, { useState, useEffect } from 'react';
import { Shield, Clock, User, Activity } from 'lucide-react';
import { api } from '../../services/api';

export const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await api.listAuditLogs(100);
        setLogs(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Security Audit Logs</h1>
        <p className="text-sm text-slate-500">Immutable record of all administrative and sensitive operations.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-6 py-4 font-semibold">Timestamp</th>
              <th className="px-6 py-4 font-semibold">Actor</th>
              <th className="px-6 py-4 font-semibold">Action</th>
              <th className="px-6 py-4 font-semibold">Target</th>
              <th className="px-6 py-4 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading secure logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No logs found.</td></tr>
            ) : logs.map(l => (
              <tr key={l.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">
                  {new Date(l.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-bold text-slate-900">
                  {l.actor?.full_name || 'System'}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase">
                    {l.action}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-600">
                  {l.resource_type}:{l.resource_id}
                </td>
                <td className="px-6 py-4 text-slate-600 text-xs">
                  {l.details || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
