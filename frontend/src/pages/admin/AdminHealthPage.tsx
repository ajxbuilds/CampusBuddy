import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Activity, ShieldAlert, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

type HealthComponent = {
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'NOT_CONFIGURED';
  message: string;
  latency_ms: number | null;
  checked_at: string;
};

type HealthResponse = {
  overall_status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  last_checked: string;
  components: Record<string, HealthComponent>;
};

export const AdminHealthPage = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSystemHealth();
      setHealth(data);
    } catch (e) {
      console.error(e);
      setError("Could not connect to the health monitoring service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const getStatusIcon = (status: string, className = "w-5 h-5") => {
    if (status === 'HEALTHY') return <CheckCircle2 className={`${className} text-emerald-500`} />;
    if (status === 'DEGRADED') return <ShieldAlert className={`${className} text-amber-500`} />;
    if (status === 'UNAVAILABLE') return <XCircle className={`${className} text-rose-500`} />;
    return <Activity className={`${className} text-slate-400`} />;
  };

  const formatStatus = (status: string) => {
    if (status === 'NOT_CONFIGURED') return 'Connected / Configured';
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  const getComponentDisplayName = (key: string) => {
    const names: Record<string, string> = {
      backend_api: 'Backend API',
      database: 'Database',
      authentication: 'Authentication',
      file_storage: 'File Storage',
      ai_service: 'AI Service',
      notifications: 'Notifications',
    };
    return names[key] || key;
  };

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Activity className="w-7 h-7 text-indigo-600" /> System Health
        </h1>
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to retrieve status</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={fetchHealth}
            className="inline-flex items-center gap-2 px-6 py-2 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-indigo-600" /> System Health
          </h1>
          <p className="text-sm text-slate-500 mt-1">Live infrastructure diagnostics and monitoring.</p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Checking...' : 'Refresh Status'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50">
          <div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Overall Status</h2>
            <div className="flex items-center gap-2">
              {loading ? (
                <div className="flex items-center gap-2 text-slate-500 font-bold text-xl">
                  <Activity className="w-6 h-6 animate-pulse text-indigo-500" /> Checking...
                </div>
              ) : health ? (
                <div className="flex items-center gap-2 text-slate-900 font-black text-2xl">
                  {getStatusIcon(health.overall_status, "w-8 h-8")}
                  {health.overall_status === 'HEALTHY' ? 'Healthy' : health.overall_status === 'DEGRADED' ? 'Degraded' : 'Unavailable'}
                </div>
              ) : null}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Last Checked</h2>
            <p className="text-sm text-slate-600 font-medium">
              {loading || !health ? '...' : new Date(health.last_checked).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {['backend_api', 'database', 'authentication', 'file_storage', 'ai_service', 'notifications'].map((key) => {
            const comp = health?.components[key];
            return (
              <div key={key} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{getComponentDisplayName(key)}</h3>
                  <p className="text-sm text-slate-500">{loading ? 'Checking diagnostics...' : comp?.message || 'Waiting...'}</p>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  {comp?.latency_ms !== undefined && comp?.latency_ms !== null && !loading && (
                    <div className="text-slate-500 font-mono">
                      {comp.latency_ms} ms
                    </div>
                  )}
                  <div className="flex items-center gap-2 font-bold min-w-[120px] justify-start sm:justify-end">
                    {loading ? (
                      <span className="text-slate-400">Checking...</span>
                    ) : comp ? (
                      <>
                        {getStatusIcon(comp.status)}
                        <span className={
                          comp.status === 'HEALTHY' ? 'text-emerald-600' :
                          comp.status === 'DEGRADED' ? 'text-amber-600' :
                          comp.status === 'UNAVAILABLE' ? 'text-rose-600' :
                          'text-slate-500'
                        }>
                          {comp.status === 'NOT_CONFIGURED' ? 'Not Configured' : comp.status.charAt(0) + comp.status.slice(1).toLowerCase()}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
