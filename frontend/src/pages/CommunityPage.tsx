import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Plus,
  Search,
  Flame,
  Clock,
  HelpCircle,
  Award,
  ChevronUp,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { CommunityPost } from '../types';
import { AskQuestionModal } from '../components/community/AskQuestionModal';
import { Skeleton } from '../components/ui/Skeleton';

const CATEGORIES = [
  'All',
  'Academics',
  'Exams',
  'Administration',
  'Scholarships',
  'Fees',
  'Hostel',
  'Transport',
  'Infrastructure',
  'Faculty',
  'Technical',
  'Other',
];

export const CommunityPage: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'recent' | 'trending' | 'unanswered' | 'helpful'>('trending');
  const [search, setSearch] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await api.listPosts({
        category,
        sort_by: sortBy,
        search: search.trim() || undefined,
      });
      setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [category, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleVote = async (postId: number) => {
    try {
      await api.toggleVote('POST', postId);
      await fetchPosts();
    } catch (err: any) {
      alert(err.message || 'Vote failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight mb-2">
            Community Knowledge Base
          </h1>
          <p className="text-sm text-slate-500">Search discussions, share knowledge, and collaborate with peers.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Ask a Question
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg">
              <button
                onClick={() => setSortBy('trending')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === 'trending' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                <Flame className="w-4 h-4" /> Trending
              </button>
              <button
                onClick={() => setSortBy('recent')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === 'recent' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                <Clock className="w-4 h-4" /> Recent
              </button>
              <button
                onClick={() => setSortBy('unanswered')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === 'unanswered' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                <HelpCircle className="w-4 h-4" /> Unanswered
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:max-w-xs">
              <input
                type="text"
                placeholder="Search discussions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </form>
          </div>

          {/* Post List */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {loading ? (
              <div className="divide-y divide-slate-100">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-5 flex gap-4">
                    <div className="flex flex-col gap-2 w-16 items-end">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="flex gap-2 pt-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-24 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="p-16 text-center space-y-4">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                <div>
                  <h4 className="text-base font-semibold text-navy-900">No Discussions Found</h4>
                  <p className="text-sm text-slate-500 mt-1">Be the first to ask a question in this category!</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-5 py-2 mt-2 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-sm font-semibold transition-colors"
                >
                  Ask Community
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {posts.map((post) => (
                  <div key={post.id} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                    {/* Stats Column */}
                    <div className="flex flex-col items-end gap-1.5 min-w-[64px] text-sm shrink-0">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        {post.upvotes_count} <span className="font-normal text-slate-500">votes</span>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${post.has_accepted_answer ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : post.answers_count > 0 ? 'text-brand-600' : 'text-slate-500'}`}>
                        {post.has_accepted_answer && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {post.answers_count} <span className="font-normal">answers</span>
                      </div>
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/community/${post.id}`} className="block group">
                        <h3 className="text-base font-semibold text-brand-700 group-hover:text-brand-600 group-hover:underline line-clamp-1 mb-1.5">
                          {post.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-2.5">
                        {post.content}
                      </p>
                      
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors cursor-pointer" onClick={() => setCategory(post.category)}>
                            {post.category}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <img
                            src={post.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.full_name || 'User'}`}
                            alt=""
                            className="w-5 h-5 rounded-md bg-slate-200"
                          />
                          <span className="font-medium text-navy-900">{post.author?.full_name || 'Anonymous'}</span>
                          <span>asked {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-6">
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <h3 className="text-sm font-semibold text-navy-900 mb-3 uppercase tracking-wider">Categories</h3>
            <ul className="space-y-1">
              {CATEGORIES.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => setCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      category === cat
                        ? 'bg-brand-600 text-white font-medium'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-navy-900'
                    }`}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <AskQuestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => fetchPosts()}
        initialCategory={category === 'All' ? 'Academics' : category}
      />
    </div>
  );
};
