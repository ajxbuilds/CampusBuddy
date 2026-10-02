import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, Lock, Mail, Info, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AuthLayout } from '../../components/layout/AuthLayout';

export const StudentLoginPage: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('student@campusbuddy.edu');
  const [password, setPassword] = useState('Student@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get('error')
      ? decodeURIComponent(searchParams.get('error') || 'Authentication failed.')
      : null
  );
  const [showConfigModal, setShowConfigModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password, 'STUDENT');
      navigate('/dashboard');
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
      await quickLogin('STUDENT');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const res = await api.getGoogleLoginUrl();
      if (res.configured && res.url) {
        window.location.href = res.url;
      } else {
        setShowConfigModal(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Google sign-in.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDevSimulate = async () => {
    setGoogleLoading(true);
    try {
      const res = await api.simulateGoogleLogin(
        'google.student@campusbuddy.edu',
        'Aarav Sharma'
      );
      if (res.action === 'login' && res.token) {
        sessionStorage.setItem('cb_token', res.token);
        navigate('/auth/callback?token=' + res.token);
      } else if (res.action === 'onboard' && res.onboarding_token) {
        navigate('/onboarding?token=' + res.onboarding_token);
      }
    } catch (err: any) {
      setError(err.message || 'Dev simulation failed.');
    } finally {
      setGoogleLoading(false);
      setShowConfigModal(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Student Sign In</h2>
        <p className="text-sm text-slate-500">Your campus community starts here.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={googleLoading || loading}
        className="w-full h-14 rounded-xl border border-[#DCE3EF] bg-white hover:bg-[#F8FAFC] text-slate-700 font-bold text-[15px] shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 disabled:opacity-60 group"
      >
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
      </button>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#DCE3EF]"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-4 text-slate-400 font-bold tracking-widest text-[11px]">OR</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
          <div className="relative">
            <input 
              type="email" 
              required 
              placeholder="student@campusbuddy.edu" 
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
            <button type="button" onClick={() => alert('Password reset link will be sent to your registered campus email address.')} className="text-[13px] text-blue-600 hover:underline font-semibold">Forgot password?</button>
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
        <button type="submit" disabled={loading || googleLoading} className="w-full h-14 mt-2 text-[15px] font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? 'Authenticating...' : 'Sign In'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      <div className="mt-8 pt-8 border-t border-[#DCE3EF]">
        <button type="button" onClick={handleQuick} className="w-full py-3 text-sm font-bold rounded-xl bg-[#F8FAFC] border border-[#DCE3EF] text-slate-700 hover:bg-slate-100 transition-all text-center">
          Try Demo Student Account
        </button>
      </div>

      <p className="text-center text-sm text-slate-500 mt-8">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-blue-600 hover:underline">Register now</Link>
      </p>

      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] border border-slate-200 p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Google OAuth Setup</h3>
                <p className="text-sm text-slate-500 mt-1">Live credentials not yet detected in backend/.env</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-sm text-slate-600 space-y-3 mb-6 font-mono">
              <p className="font-sans text-sm font-semibold text-slate-800">
                To enable production Google OAuth, add to <code className="text-blue-600">backend/.env</code>:
              </p>
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs overflow-x-auto select-all">
                GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com<br />
                GOOGLE_CLIENT_SECRET=GOCSPX-your-secret<br />
                GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
              </div>
            </div>
            <div className="space-y-3">
              <button type="button" onClick={handleDevSimulate} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                Try Google OAuth Simulation (Dev Mode)
              </button>
              <button type="button" onClick={() => setShowConfigModal(false)} className="w-full h-12 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all">
                Close & Use Email/Password
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};
