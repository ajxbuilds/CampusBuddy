import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  MessageSquare, ShieldAlert, Users, Calendar,
  Search, Filter, RefreshCw, EyeOff, CheckCircle,
  ChevronLeft, ChevronRight, Activity, AlertTriangle, X
} from 'lucide-react';


export default function AdminCommunityPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [loadingPost, setLoadingPost] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [s, pRes, rRes] = await Promise.all([
        api.getAdminCommunityStats(),
        api.getAdminCommunityPosts({ page, limit: 15, search, status: statusFilter, category: categoryFilter }),
        api.listReports('PENDING')
      ]);
      setStats(s);
      setPosts(pRes.items || []);
      setReports(rRes || []);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(delay);
  }, [page, search, statusFilter, categoryFilter]);


  const handleViewPost = async (id: number) => {
    setSelectedPostId(id);
    setLoadingPost(true);
    try {
      const post = await api.getPost(id);
      setSelectedPost(post);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPost(false);
    }
  };
  const handleAction = async (reportId: number, action: 'dismiss' | 'hide_content') => {
    if (!window.confirm(`Are you sure you want to ${action} this reported content?`)) return;
    try {
      await api.handleReport(reportId, action, "Admin action from Community Dashboard");
      fetchData();
    } catch (e) {
      alert("Failed to process moderation action");
    }
  };

  if (error) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[50vh]">
        <Activity className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Unable to load community data.</h2>
        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">Retry</button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Community Management</h1>
          <p className="text-slate-500 mt-1">Monitor questions, discussions, reports and moderation activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="flex items-center gap-2 px-4 h-10 border border-slate-300 rounded-lg hover:bg-slate-50 bg-white text-sm font-medium transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="p-2 bg-blue-50 rounded-lg"><MessageSquare className="w-6 h-6 text-blue-600" /></div>
          </div>
          {loading && !stats ? <div className="h-10 bg-slate-100 animate-pulse rounded"></div> : (
            <>
              <h3 className="text-3xl font-bold text-slate-800">{stats?.total_questions || 0}</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Total Questions</p>
            </>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="p-2 bg-amber-50 rounded-lg"><Activity className="w-6 h-6 text-amber-600" /></div>
          </div>
          {loading && !stats ? <div className="h-10 bg-slate-100 animate-pulse rounded"></div> : (
            <>
              <h3 className="text-3xl font-bold text-slate-800">{stats?.unanswered_questions || 0}</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Unanswered Questions</p>
            </>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="p-2 bg-rose-50 rounded-lg"><ShieldAlert className="w-6 h-6 text-rose-600" /></div>
          </div>
          {loading && !stats ? <div className="h-10 bg-slate-100 animate-pulse rounded"></div> : (
            <>
              <h3 className="text-3xl font-bold text-slate-800">{stats?.reported_content || 0}</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Reported Content</p>
            </>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg"><Calendar className="w-6 h-6 text-emerald-600" /></div>
          </div>
          {loading && !stats ? <div className="h-10 bg-slate-100 animate-pulse rounded"></div> : (
            <>
              <h3 className="text-3xl font-bold text-slate-800">{stats?.questions_this_week || 0}</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Questions This Week</p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Table */}
        <div className="lg:col-span-3 flex flex-col gap-6">

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search community..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <select className="border-slate-300 rounded-lg text-sm px-3 py-2 border bg-white" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">All Statuses</option>
                <option value="answered">Answered</option>
                <option value="unanswered">Unanswered</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Question</th>
                    <th className="px-6 py-3">Author</th>
                    <th className="px-6 py-3">Answers</th>
                    <th className="px-6 py-3">Votes</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && posts.length === 0 ? (
                    [1,2,3,4,5].map(i => (
                      <tr key={i}>
                        <td className="px-6 py-4"><div className="w-48 h-4 bg-slate-100 rounded animate-pulse"></div></td>
                        <td className="px-6 py-4"><div className="w-24 h-4 bg-slate-100 rounded animate-pulse"></div></td>
                        <td className="px-6 py-4"><div className="w-8 h-4 bg-slate-100 rounded animate-pulse"></div></td>
                        <td className="px-6 py-4"><div className="w-8 h-4 bg-slate-100 rounded animate-pulse"></div></td>
                        <td className="px-6 py-4"><div className="w-16 h-4 bg-slate-100 rounded animate-pulse"></div></td>
                        <td className="px-6 py-4"><div className="w-24 h-4 bg-slate-100 rounded animate-pulse"></div></td>
                      </tr>
                    ))
                  ) : posts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No community questions yet</p>
                        <p className="text-sm text-slate-400 mt-1">Questions created by students will appear here.</p>
                      </td>
                    </tr>
                  ) : (
                    posts.map(p => (
                      <tr key={p.id} onClick={() => handleViewPost(p.id)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                        <td className="px-6 py-4 font-medium text-slate-800 truncate max-w-[250px]">{p.title}</td>
                        <td className="px-6 py-4 text-slate-600">{p.author_name}</td>
                        <td className="px-6 py-4 text-slate-600">{p.answers_count}</td>
                        <td className="px-6 py-4 text-slate-600">{p.votes}</td>
                        <td className="px-6 py-4">
                          {p.is_hidden ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                              <EyeOff className="w-3 h-3" /> Hidden
                            </span>
                          ) : p.has_accepted_answer ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                              <CheckCircle className="w-3 h-3" /> Solved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                              Open
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500">Page {page}</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button disabled={posts.length < 15} onClick={() => setPage(p => p + 1)} className="p-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Moderation Queue Sidebar */}
        <div className="lg:col-span-1">
          <div className={`bg-white rounded-xl border ${reports.length > 0 ? 'border-rose-200 ring-1 ring-rose-50' : 'border-slate-200'} shadow-sm overflow-hidden`}>
            <div className={`p-5 border-b ${reports.length > 0 ? 'bg-rose-50 border-rose-100' : 'border-slate-100'}`}>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {reports.length > 0 && <AlertTriangle className="w-5 h-5 text-rose-500" />}
                Moderation Queue
              </h3>
              {reports.length > 0 ? (
                <p className="text-sm text-rose-600 mt-1 font-medium">{reports.length} reports require review</p>
              ) : (
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> No reports require review
                </p>
              )}
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {reports.map(r => (
                <div key={r.id} className="p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-700">
                      {r.target_type} REPORT
                    </span>
                    <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-800 font-medium mb-1">Reported by {r.reporter?.full_name || 'User'}</p>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3 line-clamp-3">
                    "{r.reason}"
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => handleAction(r.id, 'hide_content')}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium py-2 rounded transition-colors"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => handleAction(r.id, 'dismiss')}
                      className="flex-1 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium py-2 rounded transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {selectedPostId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Community Post Details</h3>
              <button onClick={() => setSelectedPostId(null)} className="p-1 hover:bg-slate-100 rounded text-slate-500"><X className="w-5 h-5"/></button>
            </div>
          {loadingPost ? (
            <div className="p-6 flex justify-center"><Activity className="w-8 h-8 text-indigo-500 animate-spin" /></div>
          ) : selectedPost ? (
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-2">{selectedPost.title}</h2>
              <div className="flex items-center gap-3 text-sm text-slate-500 mb-6">
                <span className="font-medium text-slate-700">{selectedPost.author?.full_name || 'Student'}</span>
                <span>•</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">{selectedPost.category}</span>
                <span>•</span>
                <span>{new Date(selectedPost.created_at).toLocaleString()}</span>
              </div>
              <div className="prose prose-sm max-w-none text-slate-700 mb-8 whitespace-pre-wrap">
                {selectedPost.content}
              </div>

              {selectedPost.answers && selectedPost.answers.length > 0 && (
                <div className="border-t border-slate-200 pt-6 mt-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-500" />
                    Answers ({selectedPost.answers.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedPost.answers.map((ans: any) => (
                      <div key={ans.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-700">{ans.author?.full_name}</span>
                          <span className="text-xs text-slate-500">{new Date(ans.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{ans.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-rose-500">Failed to load post details.</div>
          )}
        </div></div>
      )}
    </div>
  );
}
