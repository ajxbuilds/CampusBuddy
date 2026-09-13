import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { HelpCircle, User as UserIcon, ShieldAlert, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { Complaint, User } from '../types';
import { Skeleton } from '../components/ui/Skeleton';

export const ParentDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [wards, setWards] = useState<User[]>([]);
  const [activeWardId, setActiveWardId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkCode, setLinkCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string|null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string|null>(null);

  const handleLinkStudent = async () => {
    if (!linkCode.trim()) return;
    setLinking(true);
    setLinkError(null);
    setLinkSuccess(null);
    try {
      const res = await api.linkParent(linkCode);
      setLinkSuccess(res.message);
      const ws = await api.getLinkedStudents();
      setWards(ws);
      if (ws.length > 0 && !activeWardId) setActiveWardId(ws[0].id);
      setLinkCode('');
    } catch(err: any) {
      setLinkError(err.message || 'Failed to link student.');
    } finally {
      setLinking(false);
    }
  };


  useEffect(() => {
    const loadData = async () => {
      try {
        const [ws, comps] = await Promise.all([
            api.getLinkedStudents(),
            api.listComplaints()
          ]);
          setWards(ws);
          if (ws.length > 0) setActiveWardId(ws[0].id);
        setComplaints(comps.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const ward = wards.find(w => w.id === activeWardId) || null;

  const getStatusColor = (status: string) => {
    switch(status.toUpperCase()) {
      case 'RESOLVED': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'IN_PROGRESS': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'ESCALATED': return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'REJECTED': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-amber-700 bg-amber-50 border-amber-200';
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Parent Welcome Banner */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldAlert className="w-48 h-48 text-white" />
        </div>
        <div className="relative z-10 w-full">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-200 border border-blue-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Parent Guardian Portal
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Monitor your ward's campus issues, track their resolution timeline, and escalate concerns if needed.
          </p>
        </div>
      </div>

      {/* Linked Ward Panel */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center md:justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 shadow-inner">
            <UserIcon className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Linked Student Record</h2>
            {ward ? (
              <div>
                <p className="text-xl font-black text-slate-900">{ward.full_name}</p>
                <p className="text-sm font-medium text-slate-500 mt-0.5">{ward.department || 'Enrolled Student'}</p>
              </div>
            ) : (
              <p className="text-sm font-bold text-red-500 bg-red-50 px-3 py-1 rounded-lg inline-block border border-red-100">
                No student record linked to your account.
              </p>
            )}
          </div>
        </div>
        
        {ward && (
          <Link to="/complaints" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-sm transition flex items-center gap-2 whitespace-nowrap">
            View All Records <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Ward's Timeline / Complaints */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-500" />
          <div>
            <h2 className="text-lg font-black text-slate-900">Recent Campus Requests</h2>
            <p className="text-xs text-slate-500 font-medium">Tracking timeline for {ward?.full_name?.split(' ')[0] || 'your ward'}</p>
          </div>
        </div>

        <div className="p-6">
          {complaints.length > 0 ? (
            <div className="relative pl-4 space-y-8 before:absolute before:inset-0 before:ml-[1.4rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {complaints.map((c, idx) => (
                <div key={c.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    {c.status === 'RESOLVED' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-amber-600" />}
                  </div>
                  <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${getStatusColor(c.status)}`}>
                        {c.status.replace('_', ' ')}
                      </span>
                      <time className="text-xs font-bold text-slate-400">{new Date(c.created_at).toLocaleDateString()}</time>
                    </div>
                    <Link to={'/complaints/' + c.id} className="block text-base font-bold text-slate-900 hover:text-blue-600 mb-1 leading-snug">
                      {c.title}
                    </Link>
                    <p className="text-xs font-medium text-slate-500">ID: {c.complaint_code}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <CheckCircle2 className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-600">No recent campus requests found.</p>
              <p className="text-xs font-medium text-slate-400 mt-1">If {ward?.full_name?.split(' ')[0]} files an issue, it will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
