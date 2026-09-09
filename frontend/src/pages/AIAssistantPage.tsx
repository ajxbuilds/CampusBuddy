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
        "Hello! I am your **CampusBuddy AI Procedure Assistant**. I can help you understand college regulations, figure out whether you should ask the peer community or file a formal complaint, identify the right department, and prepare the required documents.\n\nWhat campus issue are you facing today?",
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
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Guidance Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            College Procedure & Diagnostic Guide
          </h1>
          <p className="text-sm text-blue-100 max-w-2xl mt-2 leading-relaxed">
            Get instant clarity on whether your problem can be solved by peer students or requires a formal department complaint, the exact office in charge, and checklist of required documents.
          </p>
        </div>

        {/* Decorative Circles */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/5 blur-xl pointer-events-none" />
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[620px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                {/* Text Markdown rendering */}
                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Structured Advice Box if present */}
                {m.advice && (
                  <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {m.advice.suggested_category && (
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Recommended Category
                          </span>
                          <span className="font-bold text-blue-700">{m.advice.suggested_category}</span>
                        </div>
                      )}

                      {m.advice.contact_office && (
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Department Office
                          </span>
                          <span className="font-semibold text-slate-700">{m.advice.contact_office}</span>
                        </div>
                      )}
                    </div>

                    {/* Documents checklist */}
                    {m.advice.required_documents.length > 0 && (
                      <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Required Documents Checklist
                        </span>
                        <ul className="space-y-1">
                          {m.advice.required_documents.map((doc, dIdx) => (
                            <li key={dIdx} className="flex items-center gap-2 text-slate-700">
                              <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span>{doc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Route CTA */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {m.advice.recommended_action === 'PEER_COMMUNITY' ? (
                        <button
                          onClick={() => navigate('/community')}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Ask on Peer Community Forum
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('/complaints')}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Proceed to File Formal Complaint
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 italic">
                      ⚠️ {m.advice.disclaimer}
                    </p>
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-9 h-9 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3.5 items-start">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <Bot className="w-5 h-5 animate-spin" />
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Consulting college procedures & knowledge base...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs text-slate-600 scrollbar-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Quick Prompts:
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="px-3 py-1 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 rounded-full text-xs whitespace-nowrap transition"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about college procedures, fees, hostels, re-evaluation, or hall tickets..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-md disabled:opacity-40 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
