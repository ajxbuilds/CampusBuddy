import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  ChevronUp,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  Send,
  Flag,
  AlertCircle,
  Clock,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CommunityPost, CommunityAnswer } from '../types';
import { Skeleton } from '../components/ui/Skeleton';

export const QuestionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newAnswer, setNewAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Report Modal
  const [reportTarget, setReportTarget] = useState<{ type: 'POST' | 'ANSWER'; id: number } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  const fetchPost = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getPost(Number(id));
      setPost(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load question thread.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const handleVote = async (type: 'POST' | 'ANSWER', targetId: number) => {
    try {
      await api.toggleVote(type, targetId);
      await fetchPost();
    } catch (err: any) {
      alert(err.message || 'Vote failed');
    }
  };

  const handleAcceptAnswer = async (answerId: number) => {
    try {
      await api.acceptAnswer(answerId);
      await fetchPost();
    } catch (err: any) {
      alert(err.message || 'Could not accept answer');
    }
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswer.trim() || !post) return;

    setIsSubmitting(true);
    try {
      await api.createAnswer(post.id, newAnswer.trim());
      setNewAnswer('');
      await fetchPost();
    } catch (err: any) {
      alert(err.message || 'Failed to post answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget || !reportReason.trim()) return;

    setIsReporting(true);
    try {
      await api.reportContent(reportTarget.type, reportTarget.id, reportReason.trim());
      setReportTarget(null);
      setReportReason('');
      alert('Content flagged for administrator moderation.');
    } catch (err: any) {
      alert(err.message || 'Report failed');
    } finally {
      setIsReporting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Skeleton className="h-4 w-32" />
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex items-start gap-5">
          <Skeleton className="h-14 w-12 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <div className="flex justify-between border-t border-slate-100 pt-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Question not found</h2>
        <p className="text-xs text-slate-500">{error || 'This question may have been removed.'}</p>
        <button
          onClick={() => navigate('/community')}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl"
        >
          Back to Community Forum
        </button>
      </div>
    );
  }

  const isPostAuthor = user?.id === post.author_id;
  const canAcceptSolutions = isPostAuthor || user?.role === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/community')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Discussions
      </button>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex items-start gap-5">
        {/* Upvote Button */}
        <button
          onClick={() => handleVote('POST', post.id)}
          className={`flex flex-col items-center justify-center min-w-[54px] py-3 px-1 rounded-2xl border transition-all ${
            post.has_voted
              ? 'bg-blue-600 border-blue-600 text-white shadow-md'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600'
          }`}
        >
          <ChevronUp className="w-6 h-6 -mb-1" />
          <span className="text-sm font-black">{post.upvotes_count}</span>
        </button>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                {post.category}
              </span>
              {post.has_accepted_answer && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" /> Solved
                </span>
              )}
            </div>

            <button
              onClick={() => setReportTarget({ type: 'POST', id: post.id })}
              className="text-slate-400 hover:text-rose-600 transition p-1"
              title="Report inappropriate content"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {post.title}
          </h1>

          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <img
                src={
                  post.author?.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.full_name || 'User'}`
                }
                alt=""
                className="w-6 h-6 rounded-full bg-slate-100"
              />
              <span className="font-semibold text-slate-700">{post.author?.full_name}</span>
              {post.author?.department && (
                <span className="text-slate-400">({post.author.department})</span>
              )}
            </div>
            <span>Posted {new Date(post.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {post.answers?.length || 0} {(post.answers?.length === 1 ? 'Community Answer' : 'Community Answers')}
          </h2>
          <span className="text-xs text-slate-400">Upvote helpful responses to award reputation</span>
        </div>

        {post.answers && post.answers.length > 0 ? (
          <div className="space-y-4">
            {post.answers.map((ans) => (
              <div
                key={ans.id}
                className={`p-6 rounded-3xl border transition-all flex items-start gap-4 ${
                  ans.is_accepted
                    ? 'bg-emerald-50/40 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                {/* Answer Upvote */}
                <button
                  onClick={() => handleVote('ANSWER', ans.id)}
                  className={`flex flex-col items-center justify-center min-w-[44px] py-2 px-1 rounded-xl border transition-all ${
                    ans.has_voted
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <ChevronUp className="w-5 h-5 -mb-1" />
                  <span className="text-xs font-bold">{ans.upvotes_count}</span>
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          ans.author?.avatar_url ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${ans.author?.full_name || 'User'}`
                        }
                        alt=""
                        className="w-6 h-6 rounded-full bg-slate-100"
                      />
                      <span className="text-xs font-bold text-slate-800">{ans.author?.full_name}</span>

                      {ans.is_faculty_endorsed && (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <GraduationCap className="w-3.5 h-3.5" /> Faculty Endorsed
                        </span>
                      )}

                      {ans.is_accepted && (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Accepted Solution
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setReportTarget({ type: 'ANSWER', id: ans.id })}
                      className="text-slate-400 hover:text-rose-600 transition p-1"
                      title="Report inappropriate content"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {ans.content}
                  </p>

                  <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                    <span>Answered {new Date(ans.created_at).toLocaleDateString()}</span>

                    {/* Accept solution button for question author */}
                    {canAcceptSolutions && !ans.is_accepted && (
                      <button
                        onClick={() => handleAcceptAnswer(ans.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Accepted Solution (+20 Pts)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
            No answers yet. Share your insight below to help your peer!
          </div>
        )}

        {/* Submit Answer Box */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Your Answer &bull; Earn +5 Points
          </div>

          <form onSubmit={handleAnswerSubmit} className="space-y-3">
            <textarea
              required
              rows={4}
              placeholder="Provide a clear, detailed, and constructive solution..."
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Helpful answers upvoted by peers earn +10 points each.
              </span>
              <button
                type="submit"
                disabled={isSubmitting || !newAnswer.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50 transition"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Posting...' : 'Post Your Answer'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Report Inappropriate Content Modal */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Report Inappropriate Content</h3>
            <p className="text-xs text-slate-500">
              CampusBuddy moderators will review this {reportTarget.type.toLowerCase()} against college guidelines.
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <textarea
                required
                rows={3}
                placeholder="Describe why this content violates community standards (spam, offensive, misleading)..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportTarget(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReporting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {isReporting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
