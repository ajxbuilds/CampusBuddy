import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  MessageSquare,
  Sparkles,
  Award,
  Users,
  Clock,
  ArrowRight,
  CheckCircle2,
  Lock,
  ChevronRight,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LandingPage: React.FC = () => {
  const { quickLogin } = useAuth();
  const navigate = useNavigate();

  const handleQuickDemo = async (role: UserRole) => {
    await quickLogin(role);
    if (role === 'ADMIN') navigate('/admin');
    else if (role === 'TEACHER') navigate('/teacher');
    else if (role === 'PARENT') navigate('/parent');
    else navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white py-2 px-4 text-center text-xs font-medium">
        🎓 Project Based Learning (PBL) Demonstration Platform &bull; Full-Stack Campus Problem Resolution Ecosystem
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-6">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Connect &bull; Understand &bull; Help &bull; Solve &bull; Earn Points</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-tight">
              Transforming Campus Grievances Into{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Collaborative Solutions
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              CampusBuddy connects <strong>students, teachers, parents, and administrators</strong> in a transparent college problem-solving system featuring AI procedure guidance, peer Q&A, formal SLA complaints, and gamification.
            </p>

            {/* Quick Demo Login Grid for Evaluator / Viva */}
            <div className="mt-10 p-6 bg-slate-50 border border-slate-200 rounded-3xl shadow-sm text-left max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  ⚡ 1-Click Interactive Evaluation Sandbox
                </span>
                <span className="text-[11px] text-blue-600 font-semibold">No typing required</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => handleQuickDemo('STUDENT')}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md transition text-center group"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    👨‍🎓
                  </div>
                  <span className="text-xs font-bold text-slate-800">Student</span>
                  <span className="text-[10px] text-slate-400">Aarav (CS)</span>
                </button>

                <button
                  onClick={() => handleQuickDemo('TEACHER')}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50 hover:shadow-md transition text-center group"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    👩‍🏫
                  </div>
                  <span className="text-xs font-bold text-slate-800">Teacher</span>
                  <span className="text-[10px] text-slate-400">Prof. Vikram</span>
                </button>

                <button
                  onClick={() => handleQuickDemo('PARENT')}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50/50 hover:shadow-md transition text-center group"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    👨‍👧
                  </div>
                  <span className="text-xs font-bold text-slate-800">Parent</span>
                  <span className="text-[10px] text-slate-400">Sunil Sharma</span>
                </button>

                <button
                  onClick={() => handleQuickDemo('ADMIN')}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-50/50 hover:shadow-md transition text-center group"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    🏛️
                  </div>
                  <span className="text-xs font-bold text-slate-800">Admin</span>
                  <span className="text-[10px] text-slate-400">Dean S. K. Rao</span>
                </button>
              </div>
            </div>

            {/* Standard Auth CTA */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <Link
                to="/login"
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
              >
                Sign In With Credentials <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Core Pillars */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Core System Architecture</h2>
          <p className="text-3xl font-extrabold text-slate-900">Engineered For Real College Environments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">1. AI Procedure Guide</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Provides intelligent diagnosis on college policies, required documents, and whether an issue needs peer discussion or formal department review.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">2. Peer Support Community</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              StackOverflow-style Q&A with category filters, upvotes, verified solution acceptance, and faculty endorsements.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">3. Formal Grievance Engine</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Generates unique codes (<span className="font-mono font-bold text-xs">CB-2026-XXXXXX</span>), chronological status history, and configurable SLA countdowns.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">4. SLA Breach Escalation</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Automatic breach detection empowers students to escalate overdue or rejected complaints directly to the Dean and college administration.
            </p>
          </div>

          {/* Pillar 5 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">5. Reputation & Gamification</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Points transactions (+5, +10, +20), anti-spam protection, unlocked achievement badges, and weekly/monthly/all-time leaderboards.
            </p>
          </div>

          {/* Pillar 6 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">6. 4-Tier Role Isolation</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Strict RBAC authorization: Students access their own records, parents monitor linked wards, teachers manage assigned tickets, and admins supervise.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-800">CampusBuddy &bull; College Problem Solving Platform</p>
          <p className="mt-1">Built with FastAPI, React, TypeScript, Tailwind CSS & SQLAlchemy</p>
        </div>
      </footer>
    </div>
  );
};
