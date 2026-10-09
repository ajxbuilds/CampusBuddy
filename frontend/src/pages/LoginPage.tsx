import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, GraduationCap, BookOpen, Heart, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { AuthLayout } from '../components/layout/AuthLayout';

export const LoginPage: React.FC = () => {
  const {  } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h2>
        <p className="text-sm text-slate-500">Select your portal to continue.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-10">
        <Link
          to="/login/student"
          className="flex items-center justify-between p-5 rounded-[16px] border border-[#DCE3EF] bg-[#F8FAFC] hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm transition-all group active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white text-slate-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors border border-[#DCE3EF] group-hover:border-blue-600 shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="text-[15px] font-bold text-slate-900 mb-0.5">Student Portal</h3>
              <p className="text-xs text-slate-500 font-medium">Academic & campus services</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors group-hover:translate-x-1" />
        </Link>

        <Link
          to="/login/teacher"
          className="flex items-center justify-between p-5 rounded-[16px] border border-[#DCE3EF] bg-[#F8FAFC] hover:border-slate-300 hover:bg-slate-100 hover:shadow-sm transition-all group active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-slate-500/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white text-slate-600 flex items-center justify-center group-hover:bg-slate-700 group-hover:text-white transition-colors border border-[#DCE3EF] group-hover:border-slate-700 shadow-sm">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="text-[15px] font-bold text-slate-900 mb-0.5">Faculty Portal</h3>
              <p className="text-xs text-slate-500 font-medium">Manage courses & records</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-700 transition-colors group-hover:translate-x-1" />
        </Link>

        <Link
          to="/login/admin"
          className="flex items-center justify-between p-5 rounded-[16px] border border-[#DCE3EF] bg-[#F8FAFC] hover:border-slate-300 hover:bg-slate-100 hover:shadow-sm transition-all group active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-slate-500/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white text-slate-600 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors border border-[#DCE3EF] group-hover:border-slate-900 shadow-sm">
              <Shield className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="text-[15px] font-bold text-slate-900 mb-0.5">Admin Portal</h3>
              <p className="text-xs text-slate-500 font-medium">System management</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-900 transition-colors group-hover:translate-x-1" />
        </Link>
      </div>



      <p className="text-center text-sm text-slate-500 font-medium">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded">
          Register now
        </Link>
      </p>
    </AuthLayout>
  );
};
