import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, HelpCircle, Trophy, Users, Clock, AlertCircle, ChevronRight, Activity } from 'lucide-react';
import { Complaint, CommunityPost, LeaderboardResponse } from '../types';
import { Skeleton } from '../components/ui/Skeleton';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [comps, psts, lb] = await Promise.all([
          api.listComplaints(),
          api.listPosts(),
          api.getLeaderboard('monthly')
        ]);
        setComplaints(comps.slice(0, 4));
        setPosts(psts.slice(0, 4));
        setLeaderboard(lb);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3 rounded-lg" />
          <Skeleton className="h-4 w-1/4 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-[400px] lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Activity className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold uppercase tracking-wider text-blue-50">
              CampusBuddy Home
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            Welcome back, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-300 max-w-xl text-sm leading-relaxed">
            Stay updated with your campus community. Help peers, track your requests, and climb the leaderboard!
          </p>
        </div>
        <div className="relative z-10 flex gap-4 bg-white/10 backdrop-blur border border-white/20 p-4 rounded-2xl">
          <div className="text-center px-4">
            <span className="block text-2xl font-black text-white">{leaderboard?.leaders.find(e => e.user_id === user?.id)?.points || 0}</span>
            <span className="block text-[10px] uppercase font-bold text-blue-200">Rep Points</span>
          </div>
          <div className="w-px bg-white/20"></div>
          <div className="text-center px-4">
            <span className="block text-2xl font-black text-white">{complaints.length}</span>
            <span className="block text-[10px] uppercase font-bold text-blue-200">Active Issues</span>
          </div>
        </div>
      </div>

      {/* Quick Nav Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/community" className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all">
          <div className="flex flex-col gap-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5"/>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Discussions</h3>
              <p className="text-xs text-slate-500 mt-0.5">Join the conversation</p>
            </div>
          </div>
        </Link>
        <Link to="/complaints" className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all">
          <div className="flex flex-col gap-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-5 h-5"/>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Issues</h3>
              <p className="text-xs text-slate-500 mt-0.5">Track and report</p>
            </div>
          </div>
        </Link>
        <Link to="/study-buddy" className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all">
          <div className="flex flex-col gap-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5"/>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Study Buddy</h3>
              <p className="text-xs text-slate-500 mt-0.5">Find your peers</p>
            </div>
          </div>
        </Link>
        <Link to="/leaderboard" className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all">
          <div className="flex flex-col gap-4">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5"/>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Rankings</h3>
              <p className="text-xs text-slate-500 mt-0.5">View top contributors</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" /> Community Pulse
            </h2>
            <Link to="/community" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            {posts.length > 0 ? posts.map(p => (
              <div key={p.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                      {p.category}
                    </span>
                    <Link to={'/community/' + p.id} className="block text-lg font-bold text-slate-900 hover:text-blue-600 mt-1">
                      {p.title}
                    </Link>
                    <p className="text-sm text-slate-500 line-clamp-2 mt-2">{p.content}</p>
                  </div>
                  <div className="flex flex-col items-center bg-slate-50 border border-slate-100 rounded-xl p-2 min-w-[3rem]">
                    <span className="text-xs text-slate-400 font-bold mb-1">▲</span>
                    <span className="font-black text-slate-700">{p.upvotes_count}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Discuss</span>
                  <span>•</span>
                  <span>Posted by {p.author?.full_name}</span>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-slate-500 text-sm font-medium">No recent discussions. Start one!</div>
            )}
          </div>
        </div>
        
        {/* Sidebar: Complaints & Updates */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> My Requests
            </h2>
            <Link to="/complaints" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {complaints.length > 0 ? complaints.map(c => (
              <Link to={'/complaints/' + c.id} key={c.id} className="block bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${getStatusColor(c.status)}`}>
                    {c.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold text-slate-400">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 line-clamp-2 leading-snug">{c.title}</h3>
                <div className="mt-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  <span className="text-xs font-semibold text-slate-500">{c.complaint_code}</span>
                </div>
              </Link>
            )) : (
              <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200 border-dashed">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">No active complaints</p>
                <p className="text-xs text-slate-400 mt-1">Everything looks good!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

