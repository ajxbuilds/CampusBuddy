import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Users,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserRole } from '../types';

export const OnboardingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const token = searchParams.get('token');

  const [googleUser, setGoogleUser] = useState<{
    email?: string;
    name?: string;
    picture?: string;
  } | null>(null);

  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [rollNumber, setRollNumber] = useState('');
  const [semester, setSemester] = useState(1);
  const [program, setProgram] = useState('B.Tech Computer Science');
  const [phone, setPhone] = useState('');
  const [parentLinkCode, setParentLinkCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid or expired onboarding session. Please sign in with Google again.');
      return;
    }

    try {
      // Safely decode JWT payload with Unicode character support
      const parts = token.split('.');
      if (parts.length === 3) {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        let jsonStr = '';
        try {
          jsonStr = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
        } catch {
          jsonStr = atob(base64);
        }
        const payload = JSON.parse(jsonStr);
        setGoogleUser({
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
        });
        if (payload.name) {
          const rand = Math.floor(1000 + Math.random() * 9000);
          setRollNumber(`CB-${new Date().getFullYear()}-${rand}`);
        }
      }
    } catch {
      setError('Unable to parse Google session. Please sign in again.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Strict validation: ADMIN is prohibited
    if (selectedRole === 'ADMIN') {
      setError('Administrator accounts cannot be created via public Google registration.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resp = await api.onboardGoogleUser({
        onboarding_token: token,
        role: selectedRole,
        department,
        phone: phone || undefined,
        roll_number: selectedRole === 'STUDENT' ? rollNumber : undefined,
        semester: selectedRole === 'STUDENT' ? semester : undefined,
        program: selectedRole === 'STUDENT' ? program : undefined,
        parent_link_code: selectedRole === 'PARENT' ? parentLinkCode : undefined,
      });

      localStorage.setItem('cb_token', resp.access_token);
      await refreshUser();

      if (resp.user.role === 'TEACHER') {
        navigate('/teacher');
      } else if (resp.user.role === 'PARENT') {
        navigate('/parent');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || error && !googleUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600 mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Session Expired</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">
            {error || 'Your Google onboarding link is no longer valid or has expired.'}
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition w-full"
          >
            Back to Sign In <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 py-8">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl">
        {/* Header with Google User Details */}
        <div className="text-center mb-8">
          {googleUser?.picture ? (
            <img
              src={googleUser.picture}
              alt={googleUser.name || 'User'}
              className="w-16 h-16 rounded-full border-2 border-blue-500 shadow-md mx-auto mb-3 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold mx-auto mb-3 shadow-sm">
              {googleUser?.name?.[0] || 'U'}
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Google Account
          </div>

          <h2 className="text-2xl font-black text-slate-900">
            Welcome, {googleUser?.name || 'Friend'}!
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Linked to <strong className="text-slate-700">{googleUser?.email}</strong>. Select your role to complete your CampusBuddy account.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection (STUDENT, TEACHER, PARENT — ADMIN is strictly excluded) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Your Campus Role <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Student Option */}
              <button
                type="button"
                onClick={() => setSelectedRole('STUDENT')}
                className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                  selectedRole === 'STUDENT'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                {selectedRole === 'STUDENT' && (
                  <CheckCircle2 className="w-4 h-4 text-blue-600 absolute top-3 right-3" />
                )}
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Student</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Complaints, peer Q&A, and gamified badges</p>
                </div>
              </button>

              {/* Teacher Option */}
              <button
                type="button"
                onClick={() => setSelectedRole('TEACHER')}
                className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                  selectedRole === 'TEACHER'
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                {selectedRole === 'TEACHER' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute top-3 right-3" />
                )}
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Faculty</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Resolve complaints & endorse answers</p>
                </div>
              </button>

              {/* Parent Option */}
              <button
                type="button"
                onClick={() => setSelectedRole('PARENT')}
                className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                  selectedRole === 'PARENT'
                    ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                {selectedRole === 'PARENT' && (
                  <CheckCircle2 className="w-4 h-4 text-amber-600 absolute top-3 right-3" />
                )}
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Parent</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Track ward grievance status & transparency</p>
                </div>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic">
              Note: Administrator roles are provisioned exclusively through authorized institutional security keys.
            </p>
          </div>

          {/* Role-Specific Fields */}
          {selectedRole === 'STUDENT' && (
            <div className="space-y-3 p-4 rounded-2xl bg-blue-50/40 border border-blue-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Student Profile Information (+50 Bonus Points)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. CB-2026-0042"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Current Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Program / Degree
                </label>
                <input
                  type="text"
                  required
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Business Administration">Business Administration</option>
                </select>
              </div>
            </div>
          )}

          {selectedRole === 'TEACHER' && (
            <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100">
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                Faculty Department Details
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Hostel Administration">Hostel Administration</option>
                  <option value="Examination Cell">Examination Cell</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {selectedRole === 'PARENT' && (
            <div className="space-y-3 p-4 rounded-2xl bg-amber-50/40 border border-amber-100">
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                Guardian Contact Details
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Linked Student Ward User ID (Optional)
                </label>
                <input
                    type="text"
                    value={parentLinkCode}
                    onChange={(e) => setParentLinkCode(e.target.value.toUpperCase())}
                    placeholder="CB-XXXX-XXXX"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Enter the unique link code provided by your student.
                  </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Completing Setup...' : 'Complete Registration & Enter CampusBuddy'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

