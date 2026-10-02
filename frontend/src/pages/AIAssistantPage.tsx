import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  ShieldAlert,
  MessageSquare,
  Building,
  FileText,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  MoreHorizontal,
} from 'lucide-react';
import { api } from '../services/api';
import { AIChatMessage, AIProcedureAdvice } from '../types';

interface MessageItem extends AIChatMessage {
  advice?: AIProcedureAdvice | null;
}

export const AIAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      role: 'assistant',
      content:
        "Hello! I am your **CampusBuddy Procedure Assistant**. I can help you understand college regulations, figure out whether you should ask the peer community or file a formal complaint, identify the right department, and prepare the required documents.\n\nWhat campus issue are you facing today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const newMsgs: MessageItem[] = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMsgs);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const resp = await api.askAI(
        newMsgs.map((m) => ({ role: m.role, content: m.content }))
      );

      setMessages([
        ...newMsgs,
        {
          role: 'assistant',
          content: resp.reply,
          advice: resp.structured_advice,
        },
      ]);
    } catch (err: any) {
      setMessages([
        ...newMsgs,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue processing your request. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'My semester fee payment was debited but portal shows unpaid',
    'Typo in my mother name on my semester marksheet',
    'Hostel 3rd floor Wi-Fi access point down for 3 days',
    'Which elective is best between Cloud Computing and AI/ML?',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-t-3xl border border-b-0 border-slate-200 px-6 sm:px-8 py-6 flex items-center justify-between gap-4 shrink-0 shadow-sm relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-extrabold text-blue-950 tracking-tight">
              Procedure & Diagnostic Guide
            </h1>
          </div>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
            Get instant clarity on college processes, document checklists, and the right department to approach.
          </p>
        </div>
        <div className="hidden sm:flex px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full items-center gap-1.5 text-xs font-semibold text-blue-700">
          <Sparkles className="w-4 h-4 text-blue-600" />
          Powered by AI
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-slate-50 border border-slate-200 flex-1 flex flex-col overflow-hidden relative shadow-sm rounded-b-3xl">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 scroll-smooth">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              {m.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-blue-600 shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-5 text-sm leading-relaxed shadow-sm ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                {/* Text Markdown rendering */}
                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Structured Advice Box if present */}
                {m.advice && (
                  <div className="mt-5 pt-5 border-t border-slate-100 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {m.advice.suggested_category && (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Recommended Category
                          </span>
                          <span className="font-bold text-blue-800">{m.advice.suggested_category}</span>
                        </div>
                      )}

                      {m.advice.contact_office && (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Department Office
                          </span>
                          <span className="font-semibold text-slate-700">{m.advice.contact_office}</span>
                        </div>
                      )}
                    </div>

                    {/* Documents checklist */}
                    {m.advice.required_documents.length > 0 && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Required Documents Checklist
                        </span>
                        <ul className="space-y-2">
                          {m.advice.required_documents.map((doc, dIdx) => (
                            <li key={dIdx} className="flex items-start gap-2.5 text-slate-700 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                              <FileText className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                              <span className="font-medium">{doc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Route CTA */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {m.advice.recommended_action === 'PEER_COMMUNITY' ? (
                        <button
                          onClick={() => navigate('/community')}
                          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold shadow-sm transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Ask Peer Community
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('/complaints')}
                          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          File Formal Complaint
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 italic bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-100/50 mt-4">
                      <AlertCircle className="w-4 h-4 inline mr-1 -mt-0.5" />
                      {m.advice.disclaimer}
                    </p>
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-sm">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-4 items-start animate-in fade-in duration-300">
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-blue-600 shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-2xl text-sm text-slate-500 shadow-sm flex items-center gap-3">
                <MoreHorizontal className="w-5 h-5 text-blue-400 animate-pulse" />
                <span className="font-medium">Consulting college procedures...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Empty State / Suggestions (Only show if no user messages yet) */}
        {messages.length === 1 && !loading && (
          <div className="absolute inset-x-0 bottom-24 p-6 sm:px-12 flex flex-col items-center justify-center text-center space-y-4 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent pointer-events-none">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Try asking about</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl pointer-events-auto">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p)}
                  className="p-3 bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md rounded-xl text-sm text-slate-600 text-left transition-all active:scale-95 flex items-center justify-between group"
                >
                  <span className="truncate mr-2">{p}</span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 sm:p-6 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3 relative max-w-4xl mx-auto"
          >
            <input
              type="text"
              placeholder="Type your campus issue here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 pl-5 pr-14 py-3.5 text-base bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-3">
             <p className="text-[11px] text-slate-400 font-medium">AI may produce inaccurate information about procedures. Verify critical policies with department heads.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

