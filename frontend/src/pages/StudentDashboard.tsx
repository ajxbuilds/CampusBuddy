import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  MessageSquare,
  Sparkles,
  Award,
  Plus,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Flame,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Complaint, CommunityPost, ComplaintCategory, UserBadge } from '../types';
import { ComplaintCard } from '../components/complaints/ComplaintCard';
import { NewComplaintModal } from '../components/complaints/NewComplaintModal';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cmpData, postData, catData, badgeData] = await Promise.all([
        api.listComplaints(),
        api.listPosts({ sort_by: 'trending' }),
        api.getCategories(),
        api.getMyBadges(),
      ]);
      setComplaints(cmpData);
      setPosts(postData.slice(0, 3));
      setCategories(catData);
      setBadges(badgeData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingCount = complaints.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length;
  const escalatedCount = complaints.filter((c) => c.is_escalated || c.status === 'ESCALATED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider">
              Student Hub
            </span>
            <span className="text-xs text-blue-200">
              Roll: {user?.student_profile?.roll_number || 'CS2023042'} &bull; Sem {user?.student_profile?.semester || 4}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-sm text-blue-100 max-w-xl mt-1 leading-relaxed">
            Need guidance, peer answers, or want to track a campus grievance? Connect with the college problem-solving system below.
          </p>

          {/* Badges preview */}
          {badges.length > 0 && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-xs text-blue-200 font-semibold">Earned Badges:</span>
              {badges.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-xs font-semibold text-white"
                >
                  🏅 {b.badge?.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quick Action CTA Group */}
        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <Link
            to="/ai-assistant"
            className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            AI Guide
          </Link>

          <Link
            to="/community"
            className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition shadow-sm"
          >
            <MessageSquare className="w-4 h-4 text-indigo-200" />
            Peer Community
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 bg-white text-blue-800 hover:bg-blue-50 text-xs font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 transition hover:scale-105"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            File Complaint
          </button>
        </div>

        {/* Glow */}
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-indigo-500/30 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Tickets</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolved</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{resolvedCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reputation Points</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {user?.student_profile?.total_points || 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Escalations</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{escalatedCount}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: My Complaints & Community Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: My Complaints */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Registered Complaints</h2>
              <p className="text-xs text-slate-500">Live SLA countdown and department status</p>
            </div>
            <Link
              to="/complaints"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
            >
              View all ({complaints.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
              Loading complaints...
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Complaints Registered</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Have a fee discrepancy, hostel problem, or exam question? Submit a structured complaint to get official resolution.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition"
              >
                Register Your First Complaint
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {complaints.slice(0, 4).map((c) => (
                <ComplaintCard key={c.id} complaint={c} />
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Community & AI Banner */}
        <div className="space-y-6">
          {/* AI Banner Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg space-y-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <h3 className="text-base font-bold">Unsure about college procedures?</h3>
            <p className="text-xs text-blue-100 leading-relaxed">
              Ask our AI Assistant to find the right department, documents required, and whether peer help or formal grievance is recommended.
            </p>
            <Link
              to="/ai-assistant"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-900 rounded-xl text-xs font-bold hover:bg-blue-50 transition shadow-sm"
            >
              Start AI Diagnostic <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Trending Community Q&A */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Trending Peer Questions</h3>
              <Link to="/community" className="text-xs font-semibold text-blue-600 hover:underline">
                Explore
              </Link>
            </div>

            <div className="space-y-3 divide-y divide-slate-50">
              {posts.map((p) => (
                <div key={p.id} className="pt-2 first:pt-0">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                    {p.category}
                  </span>
                  <Link
                    to={`/community/${p.id}`}
                    className="text-xs font-bold text-slate-800 hover:text-blue-600 transition line-clamp-1 block"
                  >
                    {p.title}
                  </Link>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span>{p.upvotes_count} upvotes</span>
                    <span>&bull;</span>
                    <span>{p.answers_count} answers</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Complaint Modal */}
      <NewComplaintModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        onCreated={() => loadData()}
      />
    </div>
  );
};
