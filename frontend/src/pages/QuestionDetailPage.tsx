import { animate, stagger } from 'animejs';

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare, ChevronUp, ChevronDown, Trash2, CheckCircle2,
  ArrowLeft, Send, AlertCircle, Clock, Paperclip, ExternalLink, Share2, Flag,
  GraduationCap, Sparkles, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CommunityPost, CommunityAnswer, CommunityReply, ComplaintAttachment } from '../types';
import { Skeleton } from '../components/ui/Skeleton';
import { AttachmentViewer } from '../components/common/AttachmentViewer';

export const QuestionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [viewAttachment, setViewAttachment] = useState<ComplaintAttachment | null>(null);
  const [loading, setLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
        const [sortMethod, setSortMethod] = useState<'helpful' | 'newest'>('helpful');

  const fetchPost = async () => {
    if (!id) return;
    try {
      const data = await api.getPost(parseInt(id));
      setPost(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const handleVote = async (type: 'POST' | 'ANSWER' | 'REPLY', targetId: number, voteType: 'UPVOTE' | 'DOWNVOTE' = 'UPVOTE') => {
    if (!post) return;

    // Helper to calculate new vote state
    const calculateNewState = (item: any) => {
      let newUp = item.upvotes_count;
      let newDown = item.downvotes_count;
      let newVote = voteType;
      if (item.user_vote === voteType) {
        if (voteType === 'UPVOTE') newUp = Math.max(0, newUp - 1);
        else newDown = Math.max(0, newDown - 1);
        newVote = null as any;
      } else {
        if (voteType === 'UPVOTE') {
          newUp += 1;
          if (item.user_vote === 'DOWNVOTE') newDown = Math.max(0, newDown - 1);
        } else {
          newDown += 1;
          if (item.user_vote === 'UPVOTE') newUp = Math.max(0, newUp - 1);
        }
      }
      return { newUp, newDown, newVote };
    };

    // 1. Optimistic UI update
    const previousPost = { ...post };
    let optimisticPost = { ...post };

    if (type === 'POST') {
      const { newUp, newDown, newVote } = calculateNewState(optimisticPost);
      optimisticPost = { ...optimisticPost, upvotes_count: newUp, downvotes_count: newDown, user_vote: newVote };
    } else if (type === 'ANSWER') {
      optimisticPost.answers = optimisticPost.answers?.map(ans => {
        if (ans.id !== targetId) return ans;
        const { newUp, newDown, newVote } = calculateNewState(ans);
        return { ...ans, upvotes_count: newUp, downvotes_count: newDown, user_vote: newVote };
      });
    } else if (type === 'REPLY') {
      optimisticPost.answers = optimisticPost.answers?.map(ans => {
        if (!ans.replies) return ans;

        // Deep map to find the reply (handles up to 2 levels deep)
        const mapReplies = (replies: any[]): any[] => {
          return replies.map(rep => {
            if (rep.id === targetId) {
              const { newUp, newDown, newVote } = calculateNewState(rep);
              return { ...rep, upvotes_count: newUp, downvotes_count: newDown, user_vote: newVote };
            }
            if (rep.replies) {
              return { ...rep, replies: mapReplies(rep.replies) };
            }
            return rep;
          });
        };

        return { ...ans, replies: mapReplies(ans.replies) };
      });
    }

    setPost(optimisticPost as CommunityPost);

    // 2. Perform API request
    try {
      const response = await api.toggleVote(type, targetId, voteType);

      // 3. Sync with exact backend counts
      if (response && response.upvotes !== undefined) {
        setPost(current => {
          if (!current) return current;
          let synced = { ...current };

          if (type === 'POST') {
            synced.upvotes_count = response.upvotes;
            synced.downvotes_count = response.downvotes;
          } else if (type === 'ANSWER') {
            synced.answers = synced.answers?.map(ans =>
              ans.id === targetId ? { ...ans, upvotes_count: response.upvotes, downvotes_count: response.downvotes } : ans
            );
          } else if (type === 'REPLY') {
            const syncReplies = (replies: any[]): any[] => {
              return replies.map(rep => {
                if (rep.id === targetId) return { ...rep, upvotes_count: response.upvotes, downvotes_count: response.downvotes };
                if (rep.replies) return { ...rep, replies: syncReplies(rep.replies) };
                return rep;
              });
            };
            synced.answers = synced.answers?.map(ans =>
              ans.replies ? { ...ans, replies: syncReplies(ans.replies) } : ans
            );
          }
          return synced as CommunityPost;
        });
      }
    } catch (err: any) {
      // Rollback
      setPost(previousPost as CommunityPost);
      alert(err.message || 'Vote failed');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this question? This cannot be undone.')) return;
    try {
      await api.deletePost(post!.id);
      navigate('/community');
    } catch (err: any) {
      alert(err.message || 'Could not delete question');
    }
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswer.trim() || !post) return;

    setIsSubmitting(true);
    try {
      const created = await api.createAnswer(post.id, newAnswer);
      if (created.points_awarded) {
        window.dispatchEvent(new CustomEvent("gamification-toast", { detail: `+${created.points_awarded} points` }));

      }
      setNewAnswer('');
      await fetchPost();
    } catch (err: any) {
      alert(err.message || 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="bg-white rounded-3xl p-8 border border-slate-200">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Question Not Found</h2>
        <p className="text-slate-500 mt-2 mb-6">The discussion you're looking for might have been removed or doesn't exist.</p>
        <button onClick={() => navigate('/community')} className="px-6 py-2.5 bg-brand-600 text-white font-bold rounded-xl shadow-sm hover:bg-brand-700 transition">
          Return to Community
        </button>
      </div>
    );
  }

  const sortedAnswers = [...(post.answers || [])].sort((a, b) => {
    if (a.is_accepted) return -1;
    if (b.is_accepted) return 1;
    if (sortMethod === 'helpful') {
      return (b.upvotes_count - b.downvotes_count) - (a.upvotes_count - a.downvotes_count);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10 min-h-screen bg-slate-50/30">

      <button
        onClick={() => navigate('/community')}
        className="flex items-center gap-2 text-slate-500 hover:text-brand-700 font-bold text-[13px] mb-8 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Forum
      </button>

      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* Main Left Content */}
        <div className="flex-1 min-w-0 space-y-8">

          {/* QUESTION CARD (Creative modern UI instead of generic Reddit) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider rounded-lg border border-indigo-100">
                  {post.category}
                </span>
                {post.has_accepted_answer && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider rounded-lg border border-emerald-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Solved
                  </span>
                )}
              </div>
              <div className="text-[13px] font-bold text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {new Date(post.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-[1.2] tracking-tight mb-6 break-words">
              {post.title}
            </h1>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-100 to-indigo-100 border border-slate-200 flex items-center justify-center font-bold text-brand-700 shadow-inner">
                {post.author?.full_name?.charAt(0) || 'U'}
              </div>
              <div>
                <div className="text-[14px] font-bold text-slate-900">{post.author?.full_name || 'Anonymous Peer'}</div>
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">{post.author?.role === 'TEACHER' ? 'Faculty Member' : 'Student'}</div>
              </div>
            </div>

            <div className="text-[16px] text-slate-700 leading-relaxed whitespace-pre-wrap break-words mb-10 pb-8 border-b border-slate-100">
              {post.content}
            </div>

            {/* Resources Section */}
            {((post.attachments && post.attachments.length > 0) || (post.resources && post.resources.length > 0)) && (
              <div className="mb-8 space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Paperclip className="w-3.5 h-3.5" /> Attached Resources
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {post.attachments?.map((att) => (
                    <button
                      key={att.id}
                      onClick={() => setViewAttachment(att)}
                      className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 shadow-sm transition"
                    >
                      <Paperclip className="w-4 h-4 text-slate-400" />
                      <span className="max-w-[200px] truncate">{att.original_filename || 'File'}</span>
                    </button>
                  ))}
                  {post.resources?.map((res) => (
                    <a
                      key={res.id}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-[13px] font-bold text-blue-700 shadow-sm transition group"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                      <span className="max-w-[200px] truncate">{res.title || res.url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Footer (Creative Voting) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

              {/* Pill-shaped Voting Component */}
              <div className="flex items-center bg-slate-100 rounded-full p-1 shadow-inner">
                <button
                  onClick={() => handleVote('POST', post.id, 'UPVOTE')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-[13px] transition-all duration-200 ${
                    post.user_vote === 'UPVOTE'
                      ? 'bg-brand-600 text-white shadow-md scale-105'
                      : 'text-slate-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  Helpful
                </button>
                <div className="px-3 font-black text-[15px] text-slate-800 tabular-nums">
                  {post.upvotes_count - post.downvotes_count}
                </div>
                <button
                  onClick={() => handleVote('POST', post.id, 'DOWNVOTE')}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                    post.user_vote === 'DOWNVOTE'
                      ? 'bg-red-500 text-white shadow-md scale-105'
                      : 'text-slate-500 hover:bg-white hover:shadow-sm'
                  }`}
                  aria-label="Downvote"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 sm:gap-4">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-100 transition">
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-100 transition">
                  <Flag className="w-4 h-4" /> Report
                </button>
                {user?.id === post.author_id && (
                  <button onClick={handleDeletePost} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold text-red-600 hover:bg-red-50 transition">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ANSWERS SECTION */}
          <div className="space-y-6">
            <div className="flex items-end justify-between border-b-2 border-slate-200 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {post.answers_count} {post.answers_count === 1 ? 'Answer' : 'Answers'}
              </h2>
              {post.answers_count > 0 && (
                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setSortMethod('helpful')}
                    className={`px-4 py-1.5 rounded-md text-[13px] font-bold transition-all ${sortMethod === 'helpful' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >Top Voted</button>
                  <button
                    onClick={() => setSortMethod('newest')}
                    className={`px-4 py-1.5 rounded-md text-[13px] font-bold transition-all ${sortMethod === 'newest' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >Newest</button>
                </div>
              )}
            </div>

            {post.answers_count === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-slate-800 font-bold text-lg mb-2">No answers yet</h3>
                <p className="text-[14px] text-slate-500 max-w-sm mx-auto">CampusBuddy relies on students like you to share knowledge. Write an answer below to help out!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedAnswers.map((ans) => (
                  <AnswerItem
                    key={ans.id}
                    answer={ans}
                    currentUserId={user?.id}
                    onVote={(targetId, vType) => handleVote('ANSWER', targetId, vType)}
                    onReplyVote={(targetId, vType) => handleVote('REPLY', targetId, vType)}
                    onRefresh={fetchPost}
                    isPostAuthor={user?.id === post.author_id}
                  />
                ))}
              </div>
            )}

            {/* ANSWER COMPOSER */}
            <div className="bg-white border-2 border-brand-100 rounded-3xl p-6 sm:p-8 shadow-sm mt-10">
              <h3 className="font-black text-slate-900 mb-2 flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-brand-500" /> Add Your Answer
              </h3>
              <p className="text-slate-500 text-[13px] mb-6">Contribute a high-quality answer and earn +5 reputation points if it's marked as accepted.</p>
              <form onSubmit={handleAnswerSubmit}>
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Type your detailed explanation here..."
                  className="w-full min-h-[140px] p-4 text-[15px] text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-y mb-4"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !newAnswer.trim()}
                    className="px-8 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-[14px] font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
                  >
                    {isSubmitting ? 'Posting...' : <><Send className="w-4 h-4" /> Submit Answer</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar (Context & Guidelines) */}
        <div className="hidden lg:flex flex-col w-[320px] shrink-0 space-y-6 sticky top-24">
          <div className="bg-gradient-to-b from-brand-50 to-white rounded-3xl border border-brand-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-brand-900 leading-tight">Campus Forum</h3>
                <p className="text-[11px] font-bold text-brand-600/70 uppercase tracking-widest">Discussion Guidelines</p>
              </div>
            </div>

            <ul className="space-y-4 text-[13px] font-medium text-slate-700">
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-xs font-black">1</div>
                <div className="pt-1">Read the question fully before answering.</div>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-xs font-black">2</div>
                <div className="pt-1">Provide clear, step-by-step instructions.</div>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-xs font-black">3</div>
                <div className="pt-1">Include official URL resources if possible.</div>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-xs font-black">4</div>
                <div className="pt-1">Be polite, respectful, and constructive.</div>
              </li>
            </ul>
          </div>

          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6">
            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-4">Post Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[13px]">
                <span className="font-medium text-slate-500">Views</span>
                <span className="font-black text-slate-800">{post.views}</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="font-medium text-slate-500">Answers</span>
                <span className="font-black text-slate-800">{post.answers_count}</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="font-medium text-slate-500">Score</span>
                <span className="font-black text-brand-600">{post.upvotes_count - post.downvotes_count}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {viewAttachment && (
        <AttachmentViewer
          attachment={viewAttachment}
          onClose={() => setViewAttachment(null)}
        />
      )}
    </div>
  );
};

// ---- Sub Components ----

interface AnswerItemProps {
  answer: CommunityAnswer;
  currentUserId?: number;
  isPostAuthor: boolean;
  onVote: (id: number, type: 'UPVOTE' | 'DOWNVOTE') => void;
  onReplyVote: (id: number, type: 'UPVOTE' | 'DOWNVOTE') => void;
  onRefresh: () => void;
}

const AnswerItem: React.FC<AnswerItemProps> = ({ answer, currentUserId, isPostAuthor, onVote, onReplyVote, onRefresh }) => {
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
        const handleDeleteAnswer = async () => {
    if (!window.confirm('Delete this answer?')) return;
    try {
      await api.deleteAnswer(answer.id);
      onRefresh();
    } catch(e: any) { alert(e.message); }
  }

  const handleAcceptAnswer = async () => {
    try {
      const res = await api.acceptAnswer(answer.id);
      if (res.points_awarded) {
        window.dispatchEvent(new CustomEvent("gamification-toast", { detail: `Answer accepted +${res.points_awarded} points` }));

      }
      onRefresh();
    } catch(e: any) { alert(e.message); }
  }

  const handleReplySubmit = async (parentId?: number) => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    try {
      await api.createReply(answer.id, replyContent.trim(), parentId);
      setReplyContent('');
      setShowReplyComposer(false);
      onRefresh();
    } catch(e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={`bg-white rounded-3xl border ${answer.is_accepted ? 'border-emerald-300 ring-2 ring-emerald-100 shadow-md relative' : 'border-slate-200 shadow-sm'} p-6 sm:p-8`}>
      {answer.is_accepted && (
        <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-500 text-white text-[12px] font-black rounded-bl-xl flex items-center gap-1.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4" /> ACCEPTED SOLUTION
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
            {answer.author?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="text-[13px] font-black text-slate-900">{answer.author?.full_name || 'User'}</div>
            <div className="text-[11px] font-bold text-slate-400">
              {answer.author?.role === 'TEACHER' ? 'Teacher' : 'Student'} • {new Date(answer.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div className="text-[15px] text-slate-800 leading-relaxed whitespace-pre-wrap break-words mb-6">
        {answer.content}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        {/* Answer Pill Vote */}
        <div className="flex items-center bg-slate-100 rounded-full p-1">
          <button onClick={() => onVote(answer.id, 'UPVOTE')} className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${answer.user_vote === 'UPVOTE' ? 'bg-brand-600 text-white shadow' : 'text-slate-500 hover:bg-white hover:text-brand-600'}`}>
            <ChevronUp className="w-5 h-5" />
          </button>
          <span className="px-2 font-black text-[13px] text-slate-800">{answer.upvotes_count - answer.downvotes_count}</span>
          <button onClick={() => onVote(answer.id, 'DOWNVOTE')} className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${answer.user_vote === 'DOWNVOTE' ? 'bg-red-500 text-white shadow' : 'text-slate-500 hover:bg-white hover:text-red-500'}`}>
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 text-[12px] font-bold text-slate-500">
          <button onClick={() => setShowReplyComposer(!showReplyComposer)} className="hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition">
            Reply
          </button>

          {isPostAuthor && !answer.is_accepted && (
            <button onClick={handleAcceptAnswer} className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition">
              <CheckCircle2 className="w-4 h-4" /> Mark as Answer
            </button>
          )}

          {currentUserId === answer.author_id && (
            <button onClick={handleDeleteAnswer} className="text-red-500 hover:text-red-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Composer */}
      {showReplyComposer && (
        <div className="mt-5 bg-slate-50 rounded-2xl border border-slate-200 p-4">
          <textarea
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            placeholder="Add your reply to this discussion..."
            className="w-full text-[13px] p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white mb-3"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowReplyComposer(false)} className="px-4 py-2 text-[12px] font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition">Cancel</button>
            <button onClick={() => handleReplySubmit()} disabled={isSubmitting || !replyContent.trim()} className="px-4 py-2 text-[12px] font-bold bg-slate-900 text-white hover:bg-brand-600 rounded-lg disabled:opacity-50 transition shadow-sm">Post Reply</button>
          </div>
        </div>
      )}

      {/* Replies */}
      {answer.replies && answer.replies.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-5">
          {answer.replies.map(reply => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              answerId={answer.id}
              currentUserId={currentUserId}
              onVote={onReplyVote}
              onRefresh={onRefresh}
              level={1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ReplyItem: React.FC<{ reply: CommunityReply, answerId: number, currentUserId?: number, level: number, onVote: (id: number, type: 'UPVOTE' | 'DOWNVOTE') => void, onRefresh: () => void }> = ({ reply, answerId, currentUserId, level, onVote, onRefresh }) => {
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
        const handleDelete = async () => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      await api.deleteReply(reply.id);
      onRefresh();
    } catch(e: any) { alert(e.message); }
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    try {
      await api.createReply(answerId, replyContent.trim(), reply.id);
      setReplyContent('');
      setShowReplyComposer(false);
      onRefresh();
    } catch(e: any) { alert(e.message); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="relative pl-5 before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-0 before:w-[2px] before:bg-slate-200 before:rounded-full group">

      <div className="flex items-center gap-2 mb-2">
        <span className="font-bold text-[13px] text-slate-900">{reply.author?.full_name || 'User'}</span>
        <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{reply.author?.role === 'TEACHER' ? 'Faculty' : 'Student'}</span>
      </div>

      <p className="text-[14px] text-slate-700 leading-relaxed break-words mb-3">{reply.content}</p>

      <div className="flex items-center gap-3 text-[12px] font-bold text-slate-500">
        {/* Reply Vote Control */}
        <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-100">
          <button onClick={() => onVote(reply.id, 'UPVOTE')} className={`p-1 rounded-md hover:bg-white hover:text-brand-600 transition ${reply.user_vote === 'UPVOTE' ? 'text-brand-600 bg-white shadow-sm' : ''}`}><ChevronUp className="w-3.5 h-3.5" /></button>
          <span className="px-1.5 text-[11px] font-black">{reply.upvotes_count - reply.downvotes_count}</span>
          <button onClick={() => onVote(reply.id, 'DOWNVOTE')} className={`p-1 rounded-md hover:bg-white hover:text-red-500 transition ${reply.user_vote === 'DOWNVOTE' ? 'text-red-500 bg-white shadow-sm' : ''}`}><ChevronDown className="w-3.5 h-3.5" /></button>
        </div>

        {level < 2 && <button onClick={() => setShowReplyComposer(!showReplyComposer)} className="hover:text-slate-800 transition px-2 py-1 hover:bg-slate-50 rounded-md">Reply</button>}

        {currentUserId === reply.author_id && (
          <button onClick={handleDelete} className="text-red-500 hover:text-red-700 transition px-2 py-1 hover:bg-red-50 rounded-md ml-auto">Delete</button>
        )}
      </div>

      {showReplyComposer && level < 2 && (
        <div className="mt-3 bg-white rounded-xl border border-slate-200 p-3 max-w-lg shadow-sm">
          <textarea
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="w-full text-[13px] p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 mb-2"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowReplyComposer(false)} className="px-3 py-1.5 text-[12px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button onClick={handleReplySubmit} disabled={isSubmitting || !replyContent.trim()} className="px-3 py-1.5 text-[12px] font-bold bg-slate-900 text-white hover:bg-brand-600 rounded-lg disabled:opacity-50">Post Reply</button>
          </div>
        </div>
      )}

      {reply.replies && reply.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {reply.replies.map(sub => (
            <ReplyItem key={sub.id} reply={sub} answerId={answerId} currentUserId={currentUserId} level={level + 1} onVote={onVote} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
};
