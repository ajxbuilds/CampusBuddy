import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageSquare, AlertCircle, Sparkles, Send, Paperclip, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';

interface AskQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (post: any) => void;
  initialCategory?: string;
}

const CATEGORIES = [
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

export const AskQuestionModal: React.FC<AskQuestionModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  initialCategory = 'Academics',
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [resources, setResources] = useState<{ url: string; title: string }[]>([]);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tempUrl, setTempUrl] = useState('');
  const [tempTitle, setTempTitle] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Please provide a specific title and question description.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await api.createPost({
        title: title.trim(),
        content: content.trim(),
        category,
      });
      if (attachment) { await api.uploadCommunityAttachment(created.id, attachment); }
        onCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to post question.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Ask Peer Community</h3>
              <p className="text-xs text-slate-500">Connect with classmates, seniors & faculty</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Topic Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Title / Summary
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Which elective has better placement relevance in Sem 5?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Details & Context
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe your question clearly. Mention specific course codes, labs, professors, or steps you've already tried..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Resources (Optional)
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition">
                  <Paperclip className="w-4 h-4" />
                  {attachment ? 'Change File' : 'Add File'}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.mp4,.txt"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition"
                >
                  <LinkIcon className="w-4 h-4" />
                  Add URL
                </button>
              </div>

              {attachment && (
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                  <Paperclip className="w-4 h-4 text-slate-400" />
                  <span className="truncate max-w-[200px]">{attachment.name}</span>
                  <button type="button" onClick={() => setAttachment(null)} className="ml-auto text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {resources.map((res, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                  <LinkIcon className="w-4 h-4 text-slate-400" />
                  <div className="flex flex-col overflow-hidden">
                    {res.title && <span className="truncate max-w-[250px] font-bold text-xs">{res.title}</span>}
                    <span className="truncate max-w-[250px] text-xs text-slate-500">{res.url}</span>
                  </div>
                  <button type="button" onClick={() => setResources(r => r.filter((_, i) => i !== idx))} className="ml-auto text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {showUrlInput && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Link title (optional)"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => { setShowUrlInput(false); setTempUrl(''); setTempTitle(''); }} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!tempUrl.trim()) return;
                        setResources([...resources, { url: tempUrl.trim(), title: tempTitle.trim() }]);
                        setTempUrl('');
                        setTempTitle('');
                        setShowUrlInput(false);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg"
                    >
                      Add Link
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-indigo-900 leading-relaxed">
              <strong>Reputation Rules:</strong> Answering peer questions awards <span className="font-bold">+5 points</span>. When an author marks an answer as accepted, the solver gets <span className="font-bold">+20 points</span> and unlocks badges!
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md disabled:opacity-50 transition"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Posting...' : 'Post Question'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
