import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronUp,
  MessageSquare,
  Eye,
  CheckCircle2,
  GraduationCap,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CommunityPost } from '../../types';

interface PostCardProps {
  post: CommunityPost;
  onVote?: (id: number) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onVote }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all flex items-start gap-4">
      {/* Upvote Box */}
      <button
        onClick={() => onVote && onVote(post.id)}
        className={`flex flex-col items-center justify-center min-w-[48px] py-2 px-1 rounded-xl border transition-all ${
          post.has_voted
            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
        }`}
      >
        <ChevronUp className="w-5 h-5 -mb-1" />
        <span className="text-xs font-bold">{post.upvotes_count}</span>
      </button>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {post.category}
          </span>

          {post.has_accepted_answer && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Solved
            </span>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto">
            <Clock className="w-3 h-3" />
            <span>
              {new Date(post.created_at).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Title */}
        <Link to={`/community/${post.id}`}>
          <h3 className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1 mb-1">
            {post.title}
          </h3>
        </Link>

        {/* Snippet */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
          {post.content}
        </p>

        {/* Footer Meta */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <img
              src={
                post.author?.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.full_name || 'User'}`
              }
              alt=""
              className="w-5 h-5 rounded-full bg-slate-100"
            />
            <span className="font-medium text-slate-700">{post.author?.full_name || 'Anonymous'}</span>
            {post.author?.role === 'TEACHER' && (
              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-700 rounded">
                Faculty
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {post.views}
            </span>
            <span className="flex items-center gap-1 font-semibold text-slate-600">
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
              {post.answers_count} {post.answers_count === 1 ? 'answer' : 'answers'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
