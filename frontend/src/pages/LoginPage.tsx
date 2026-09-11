import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, GraduationCap, BookOpen, Heart, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { quickLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuick = async (role: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      await quickLogin(role);
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'TEACHER') navigate('/teacher');
      else if (role === 'PARENT') navigate('/parent');
      else navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/60 p-8 shadow-xl shadow-slate-200/40 relative">
        <div className="text-center mb-8">
          <img src="/logo.jpg" alt="CampusBuddy" className="h-20 w-auto mx-auto object-contain drop-shadow-md mb-2" />
          <p className="text-sm text-slate-500 mt-2 font-medium">Your college community platform</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-8">
          <Link
            to="/login/student"
            className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/50 hover:shadow-md hover:shadow-brand-500/5 transition-all group active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors border border-slate-100 group-hover:border-brand-600">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-slate-900">Student Portal</h3>
                <p className="text-xs text-slate-500 font-medium">Academic & campus services</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors group-hover:translate-x-1" />
          </Link>

          <Link
            to="/login/teacher"
            className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-md transition-all group active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-500/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-slate-700 group-hover:text-white transition-colors border border-slate-100 group-hover:border-slate-700">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-slate-900">Faculty Portal</h3>
                <p className="text-xs text-slate-500 font-medium">Manage courses & records</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition-colors group-hover:translate-x-1" />
          </Link>

          <Link
            to="/login/parent"
            className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-md transition-all group active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-500/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-slate-700 group-hover:text-white transition-colors border border-slate-100 group-hover:border-slate-700">
                <Heart className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-slate-900">Parent Portal</h3>
                <p className="text-xs text-slate-500 font-medium">Monitor progress & activities</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition-colors group-hover:translate-x-1" />
          </Link>
          
          <Link
            to="/login/admin"
            className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-md transition-all group active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-500/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors border border-slate-100 group-hover:border-slate-800">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-slate-900">Admin Portal</h3>
                <p className="text-xs text-slate-500 font-medium">System management</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-800 transition-colors group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 mb-6">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3 text-center">
            Development Quick Access
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuick('STUDENT')}
              className="px-3 py-2.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-brand-300 hover:text-brand-700 hover:shadow-sm transition-all text-center disabled:opacity-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              🎓 Student
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuick('TEACHER')}
              className="px-3 py-2.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:text-slate-900 hover:shadow-sm transition-all text-center disabled:opacity-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-500/20"
            >
              👩‍🏫 Teacher
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuick('PARENT')}
              className="px-3 py-2.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:text-slate-900 hover:shadow-sm transition-all text-center disabled:opacity-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-500/20"
            >
              👨‍👧 Parent
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuick('ADMIN')}
              className="px-3 py-2.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:text-slate-900 hover:shadow-sm transition-all text-center disabled:opacity-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-500/20"
            >
              🏛️ Admin
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 rounded">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
};

