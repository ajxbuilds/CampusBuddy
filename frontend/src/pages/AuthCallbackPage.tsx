import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const processToken = async () => {
      const error = searchParams.get('error');
      if (error) {
        setStatus('error');
        setErrorMessage(
          error === 'google_not_configured'
            ? 'Google OAuth 2.0 is not configured on the server. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env.'
            : error === 'access_denied'
            ? 'Google authentication was cancelled by the user.'
            : `Authentication error: ${decodeURIComponent(error)}`
        );
        return;
      }

      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setErrorMessage('No authentication token received from the callback.');
        return;
      }

      try {
        localStorage.setItem('cb_token', token);
        await refreshUser();
        const me = await api.getMe();
        setStatus('success');

        // Short timeout for visual feedback
        setTimeout(() => {
          if (me.role === 'ADMIN') {
            navigate('/admin');
          } else if (me.role === 'TEACHER') {
            navigate('/teacher');
          } else if (me.role === 'PARENT') {
            navigate('/parent');
          } else {
            navigate('/dashboard');
          }
        }, 600);
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Failed to verify authenticated session.');
      }
    };

    processToken();
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center">
        {status === 'loading' && (
          <div className="py-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Verifying Google Account</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Establishing secure session and loading your CampusBuddy profile...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Welcome to CampusBuddy!</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Authentication successful! Redirecting you to your dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Authentication Failed</h2>
              <p className="text-xs text-rose-600 mt-2 p-3 bg-rose-50 rounded-xl border border-rose-200 text-left">
                {errorMessage}
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition w-full"
              >
                Back to Sign In <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
