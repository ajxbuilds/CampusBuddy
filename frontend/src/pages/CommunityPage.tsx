import { animate, stagger } from 'animejs';

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Plus,
  Search,
  Flame,
  Clock,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Share2,
  Link as LinkIcon,
  MoreHorizontal
} from 'lucide-react';
import { api } from '../services/api';
import { CommunityPost } from '../types';
import { AskQuestionModal } from '../components/community/AskQuestionModal';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const handleVote = async (e: React.MouseEvent, postId: number, voteType: 'UPVOTE' | 'DOWNVOTE' = 'UPVOTE') => {
    e.preventDefault();
    e.stopPropagation();

    // Save previous state for rollback
    const previousPosts = [...posts];

    // 1. Optimistic update (Immediate UI change)
    setPosts(current => current.map(p => {
      if (p.id !== postId) return p;
      let newUp = p.upvotes_count;
      let newDown = p.downvotes_count;
      let newVote = voteType;

      if (p.user_vote === voteType) {
        if (voteType === 'UPVOTE') newUp = Math.max(0, newUp - 1);
        else newDown = Math.max(0, newDown - 1);
        newVote = null as any;
      } else {
        if (voteType === 'UPVOTE') {
          newUp += 1;
          if (p.user_vote === 'DOWNVOTE') newDown = Math.max(0, newDown - 1);
        } else {
          newDown += 1;
          if (p.user_vote === 'UPVOTE') newUp = Math.max(0, newUp - 1);
        }
      }
      return { ...p, upvotes_count: newUp, downvotes_count: newDown, user_vote: newVote };
    }));

    // 2. Perform API request
    try {
      const response = await api.toggleVote('POST', postId, voteType);

      // 3. Sync with exact backend counts instead of a full list refetch
      if (response && (response.upvotes !== undefined)) {
        setPosts(current => current.map(p =>
          p.id === postId
            ? { ...p, upvotes_count: response.upvotes, downvotes_count: response.downvotes }
            : p
        ));
      }
    } catch (err: any) {
      // Rollback on failure
      setPosts(previousPosts);
      alert(err.message || 'Vote failed');
    }
  };

  const unansweredCount = posts.filter(p => p.answers_count === 0).length;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* CENTER: Main Discussion Feed */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Header & Toolbars */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <input
                type="text"
                placeholder="Search discussions, topics, or tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
            </form>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Ask Question
            </button>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
            <button
              onClick={() => setSortBy('trending')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                sortBy === 'trending' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Flame className="w-4 h-4" /> Trending
            </button>
            <button
              onClick={() => setSortBy('recent')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                sortBy === 'recent' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" /> Recent
            </button>
            <button
              onClick={() => setSortBy('unanswered')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                sortBy === 'unanswered' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <HelpCircle className="w-4 h-4" /> Unanswered
            </button>
          </div>

          {/* Feed */}
          <div className="space-y-4">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4">
                  <div className="w-10 flex flex-col items-center gap-2"><Skeleton className="h-6 w-6"/><Skeleton className="h-4 w-4"/><Skeleton className="h-6 w-6"/></div>
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/4 mt-4" />
                  </div>
                </div>
              ))
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-slate-800">No Discussions Found</h4>
                <p className="text-sm text-slate-500 mt-2">Be the first to ask a question in this category!</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} onClick={() => navigate(`/community/${post.id}`)} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-md transition-all flex items-start gap-4 cursor-pointer group">
                  {/* Vote Rail */}
                  <div className="flex flex-col items-center shrink-0 bg-slate-50 rounded-lg p-1 border border-slate-100">
                    <button
                      aria-label="Upvote question"
                      onClick={(e) => handleVote(e, post.id, 'UPVOTE')}
                      className={`p-1 rounded transition-colors ${
                        post.user_vote === 'UPVOTE' ? 'bg-brand-100 text-brand-600' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                      }`}
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-bold text-slate-700 py-1 select-none">
                      {post.upvotes_count - post.downvotes_count}
                    </span>
                    <button
                      aria-label="Downvote question"
                      onClick={(e) => handleVote(e, post.id, 'DOWNVOTE')}
                      className={`p-1 rounded transition-colors ${
                        post.user_vote === 'DOWNVOTE' ? 'bg-red-100 text-red-600' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                      }`}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content Body */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[17px] font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-tight mb-1.5 break-words pr-4">
                      {post.title}
                    </h3>

                    <p className="text-[14px] text-slate-600 line-clamp-2 leading-relaxed mb-3 break-words">
                      {post.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wide">
                        {post.category}
                      </span>
                      {post.has_accepted_answer && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Solved
                        </span>
                      )}
                    </div>

                    {/* Meta & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-medium mt-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <span className="text-slate-700 font-bold">{post.author?.full_name || 'Anonymous'}</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold uppercase tracking-wider">{post.author?.role === 'TEACHER' ? 'Faculty' : 'Student'}</span>
                        <span>• {new Date(post.created_at).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-4 text-slate-500 font-bold ml-auto">
                        <div className="flex items-center gap-1.5 hover:text-slate-700 transition">
                          <MessageSquare className="w-4 h-4" /> {post.answers_count} Answers
                        </div>
                        {((post.resources?.length || 0) + (post.attachments?.length || 0)) > 0 && (
                          <div className="flex items-center gap-1.5 hover:text-slate-700 transition">
                            <LinkIcon className="w-4 h-4" /> {(post.resources?.length || 0) + (post.attachments?.length || 0)} Resources
                          </div>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); }} className="flex items-center gap-1.5 hover:text-slate-700 transition">
                          <Share2 className="w-4 h-4" /> Share
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); }} className="flex items-center gap-1.5 hover:text-slate-700 transition">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Community Sidebar */}
        <div className="hidden lg:flex flex-col w-[300px] shrink-0 space-y-5 sticky top-24">
          {/* Stats Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Community</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm font-bold text-slate-700">
                <span>Total Discussions</span>
                <span className="text-brand-600">{posts.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-slate-700">
                <span>Unanswered</span>
                <span className="text-amber-500">{unansweredCount}</span>
              </div>
            </div>
          </div>

          {/* Categories Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Categories</h3>
            <ul className="space-y-1">
              {CATEGORIES.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => setCategory(cat)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      category === cat ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Guidelines Card */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Guidelines</h3>
            <ul className="space-y-2.5 text-xs font-medium text-slate-600">
              <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1 shrink-0"/>Be respectful to peers and faculty.</li>
              <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1 shrink-0"/>Search before asking to avoid duplicates.</li>
              <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1 shrink-0"/>Do not share private institutional data.</li>
              <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1 shrink-0"/>Use the Complaints tab for official grievances.</li>
            </ul>
          </div>
        </div>

      </div>

      <AskQuestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={(createdPost) => {
          if (createdPost.points_awarded) {
            window.dispatchEvent(new CustomEvent("gamification-toast", { detail: `+${createdPost.points_awarded} points` }));

          }
          setSortBy('recent');
          if (category !== 'All' && category !== createdPost.category) {
            setCategory('All');
          }
          setTimeout(() => fetchPosts(), 100);
        }}
        initialCategory={category === 'All' ? 'Academics' : category}
      />
    </div>
  );
};
