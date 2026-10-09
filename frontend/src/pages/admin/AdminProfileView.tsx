import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User, Shield, Mail, Calendar, Key, ShieldAlert, LogOut, CheckCircle, Clock, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminProfileView({ user }: { user: any }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [gAuth, logs] = await Promise.all([
          api.getGoogleAuthStatus().catch(() => ({ configured: false })),
          api.listAuditLogs({ limit: 5 }).catch(() => ({ items: [] }))
        ]);
        setGoogleConnected((gAuth as any).configured);
        setAuditLogs(logs.items || []);
      } catch (e) {
        console.error("Failed to load admin profile data");
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 lg:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Administrator Profile</h1>
          <p className="text-slate-500 mt-1">Manage your account, security and preferences</p>
        </div>
      </div>

      {/* Identity Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-24 h-24 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 overflow-hidden">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-10 h-10 text-indigo-500" />
          )}
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row items-center md:items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800">{user?.full_name || 'System Administrator'}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200">
              {user?.role}
            </span>
          </div>
          <p className="text-slate-500 flex items-center justify-center md:justify-start gap-1.5">
            <Mail className="w-4 h-4" /> {user?.email}
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 border border-emerald-100 text-emerald-700 mt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Active
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Account Information */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" /> Account Information
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 border-b border-slate-50 pb-4">
                <div className="col-span-1 text-sm font-medium text-slate-500">Name</div>
                <div className="col-span-2 text-sm font-semibold text-slate-800">{user?.full_name}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-slate-50 pb-4">
                <div className="col-span-1 text-sm font-medium text-slate-500">Email</div>
                <div className="col-span-2 text-sm font-semibold text-slate-800">{user?.email}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-slate-50 pb-4">
                <div className="col-span-1 text-sm font-medium text-slate-500">Role</div>
                <div className="col-span-2 text-sm font-semibold text-slate-800">Administrator</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 text-sm font-medium text-slate-500">Member Since</div>
                <div className="col-span-2 text-sm font-semibold text-slate-800">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Not available'}
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-500" /> Security
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100"><Globe className="w-5 h-5 text-slate-600" /></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Google Account</p>
                    <p className="text-xs text-slate-500">Connected authentication</p>
                  </div>
                </div>
                {loading ? (
                  <div className="w-20 h-6 bg-slate-100 animate-pulse rounded"></div>
                ) : googleConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-700">
                    <CheckCircle className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-slate-100 text-slate-600">
                    Not connected
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100"><Key className="w-5 h-5 text-slate-600" /></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Password</p>
                    <p className="text-xs text-slate-500">Last changed recently</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors">
                  Change
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Administrative Access */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-slate-500" /> Administrative Access
              </h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-800">Full Administrative Access</p>
                <p className="text-xs text-slate-500">You have unrestricted permissions to manage the system.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {['User Management', 'Gamification Oversight', 'Community Moderation', 'System Settings', 'Complaint Management', 'Audit Logs'].map((perm, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>{perm}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Administrative Activity */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[350px]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" /> Recent Administrative Activity
              </h3>
              <button onClick={() => navigate('/admin/audit-logs')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                View All
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              {loading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg"></div>)}
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Clock className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No recent activity recorded.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="flex gap-4">
                      <div className="mt-1 w-2 h-2 rounded-full bg-indigo-400 shrink-0"></div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{log.action}</p>
                        <p className="text-xs text-slate-500">
                          {log.resource_type} {log.resource_id ? `#${log.resource_id}` : ''}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{new Date(log.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="pt-6 border-t border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Account Actions</h3>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-semibold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>

    </div>
  );
}
