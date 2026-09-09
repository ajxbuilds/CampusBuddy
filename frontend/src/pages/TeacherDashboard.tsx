import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  ShieldAlert,
  MessageSquare,
  CheckCircle2,
  Clock,
  UserCheck,
  Building,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Complaint, CommunityPost } from '../types';
import { ComplaintCard } from '../components/complaints/ComplaintCard';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cmpData, postData] = await Promise.all([
        api.listComplaints(),
        api.listPosts({ category: 'Academics' }),
      ]);
      setComplaints(cmpData);
      setPosts(postData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const assignedToMe = complaints.filter((c) => c.assigned_to === user?.id);
  const pendingCount = assignedToMe.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
  const resolvedCount = assignedToMe.filter((c) => c.status === 'RESOLVED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider">
              Faculty / Department Liaison
            </span>
            <span className="text-xs text-emerald-200">
              Department: {user?.department || 'Academic Affairs'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-sm text-emerald-100 max-w-xl mt-1 leading-relaxed">
            Review student complaints assigned to your department, log progress notes, and share faculty answers on the peer community.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/community"
            className="px-5 py-3 bg-white text-emerald-900 rounded-2xl text-xs font-black shadow-md hover:bg-emerald-50 transition flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-emerald-700" />
            Answer Student Questions
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Pending</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Successfully Resolved</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{resolvedCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Department Total</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{complaints.length}</p>
          </div>
        </div>
      </div>

      {/* Assigned Complaints List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Complaints Requiring Your Action</h2>
            <p className="text-xs text-slate-500">Investigate and update resolution status</p>
          </div>
          <Link to="/complaints" className="text-xs font-bold text-blue-600 hover:underline">
            View all department tickets &rarr;
          </Link>
        </div>

        {complaints.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <p className="text-sm font-bold text-slate-700">No complaints currently pending your review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complaints.map((c) => (
              <ComplaintCard key={c.id} complaint={c} />
            ))}
          </div>
        )}
      </div>

      {/* Academic Discussions Preview */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Academic Questions</h3>
            <p className="text-xs text-slate-500">Your answers carry a verified Faculty Endorsement badge</p>
          </div>
          <Link to="/community" className="text-xs font-bold text-emerald-700 hover:underline">
            Participate in Forum &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.slice(0, 4).map((p) => (
            <div key={p.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                {p.category}
              </span>
              <Link
                to={`/community/${p.id}`}
                className="text-sm font-bold text-slate-900 hover:text-emerald-700 transition block line-clamp-1"
              >
                {p.title}
              </Link>
              <p className="text-xs text-slate-500 line-clamp-2">{p.content}</p>
              <div className="text-[11px] text-slate-400 pt-2 flex items-center justify-between">
                <span>By {p.author?.full_name}</span>
                <span className="font-semibold text-emerald-600">{p.answers_count} answers</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
