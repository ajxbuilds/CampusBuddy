import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from '../../components/layout/AuthLayout';

export const AdminLoginPage: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('admin@campusbuddy.edu');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get('error')
      ? decodeURIComponent(searchParams.get('error') || 'Authentication failed.')
      : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password, 'ADMIN');
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async () => {
    setLoading(true);
    setError(null);
    try {
      await quickLogin('ADMIN');
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Administration Portal</h2>
        <p className="text-sm text-slate-500">Manage your campus community.</p>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium">
        Administrator accounts are provisioned by authorized personnel only.
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
          <div className="relative">
            <input 
              type="email" 
              required 
              placeholder="admin@campusbuddy.edu" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full pl-11 pr-4 h-14 text-base bg-[#F8FAFC] border border-[#DCE3EF] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400" 
            />
            <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-[18px]" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-slate-700">Password</label>
            <button type="button" onClick={() => alert('Please contact IT support to reset your administrator password.')} className="text-[13px] text-blue-600 hover:underline font-semibold">Forgot password?</button>
          </div>
          <div className="relative">
            <input 
              type={showPassword ? 'text' : 'password'} 
              required 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full pl-11 pr-11 h-14 text-base bg-[#F8FAFC] border border-[#DCE3EF] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400" 
            />
            <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-[18px]" />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[18px] text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 font-medium select-none">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
            <span>Remember me</span>
          </label>
        </div>
        <button type="submit" disabled={loading} className="w-full h-14 mt-2 text-[15px] font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? 'Authenticating...' : 'Sign In'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      <div className="mt-8 pt-8 border-t border-[#DCE3EF]">
        <button type="button" onClick={handleQuick} className="w-full py-3 text-sm font-bold rounded-xl bg-[#F8FAFC] border border-[#DCE3EF] text-slate-700 hover:bg-slate-100 transition-all text-center">
          Demo Admin Access
        </button>
      </div>
    </AuthLayout>
  );
};
