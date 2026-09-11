import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { MessageSquare, HelpCircle, AlertCircle, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { Complaint, CommunityPost } from '../types';
import { Skeleton } from '../components/ui/Skeleton';

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [comps, psts] = await Promise.all([
          api.listComplaints(),
          api.listPosts()
        ]);
        setComplaints(comps.filter((c: Complaint) => c.assigned_to === user?.id).slice(0, 5));
        setPosts(psts.slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const pendingComplaints = complaints.filter(c => !['RESOLVED', 'REJECTED'].includes(c.status)).length;

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Faculty Header Panel */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <CheckCircle2 className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 w-full">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-blue-600/30 text-blue-200 border border-blue-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Faculty Portal
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2 text-white">
            Welcome, Professor {user?.full_name?.split(' ')[1] || user?.full_name}
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Monitor assigned student issues, participate in academic discussions, and help maintain an excellent campus environment.
          </p>
        </div>
        
        <div className="relative z-10 shrink-0 bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 flex items-center gap-4 min-w-fit">
           <div className="text-center px-2">
             <span className="block text-2xl font-black text-white">{pendingComplaints}</span>
             <span className="block text-[10px] font-bold uppercase text-amber-400 tracking-wider">Pending Action</span>
           </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/complaints" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group flex items-start gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <AlertCircle className="w-6 h-6"/>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">Assigned Issues</h3>
            <p className="text-sm text-slate-500 mt-1">Resolve student complaints and requests.</p>
          </div>
        </Link>
        
        <Link to="/community" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-6 h-6"/>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">Q&A Forums</h3>
            <p className="text-sm text-slate-500 mt-1">Answer academic queries from students.</p>
          </div>
        </Link>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6"/>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Your Impact</h3>
            <p className="text-sm text-slate-500 mt-1">You've helped resolve {complaints.filter(c => c.status === 'RESOLVED').length} issues.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Assigned Complaints */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" /> Action Required
              </h2>
              <p className="text-xs text-slate-500 mt-1">Complaints assigned to you</p>
            </div>
            <Link to="/complaints" className="text-sm font-bold text-blue-600 hover:text-blue-700">View All</Link>
          </div>
          
          <div className="divide-y divide-slate-100 flex-1">
            {complaints.length > 0 ? complaints.map(c => (
              <div key={c.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <Link to={'/complaints/' + c.id} className="text-base font-bold text-slate-900 hover:text-blue-600 line-clamp-1">
                    {c.title}
                  </Link>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    c.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : 
                    c.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {c.priority} Priority
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                  <span className="text-slate-400">{c.complaint_code}</span>
                  <span>•</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${
                    c.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center flex flex-col items-center justify-center h-full text-slate-500">
                <CheckCircle2 className="w-10 h-10 text-slate-300 mb-3" />
                <p className="font-semibold text-sm">All caught up!</p>
                <p className="text-xs mt-1">No pending complaints assigned to you.</p>
              </div>
            )}
          </div>
        </div>

        {/* Community Questions */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-500" /> Student Queries
              </h2>
              <p className="text-xs text-slate-500 mt-1">Recent community discussions</p>
            </div>
            <Link to="/community" className="text-sm font-bold text-blue-600 hover:text-blue-700">Explore</Link>
          </div>
          
          <div className="divide-y divide-slate-100 flex-1">
            {posts.length > 0 ? posts.map(p => (
              <div key={p.id} className="p-6 hover:bg-slate-50 transition-colors">
                <span className="inline-block px-2.5 py-1 mb-2 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                  {p.category}
                </span>
                <Link to={'/community/' + p.id} className="block text-base font-bold text-slate-900 hover:text-blue-600 mb-2 line-clamp-2">
                  {p.title}
                </Link>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                  <span className="text-slate-600 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {p.upvotes_count} upvotes</span>
                  <span>•</span>
                  <span>By {p.author?.full_name}</span>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-slate-500 text-sm font-medium">No recent questions.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
