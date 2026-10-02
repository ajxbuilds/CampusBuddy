import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, User as UserIcon, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, UserRole } from '../types';
import { AuthLayout } from '../components/layout/AuthLayout';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('STUDENT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [rollNumber, setRollNumber] = useState('');
  const [semester, setSemester] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register({
        full_name: fullName,
        email,
        password,
        role,
        department: role === 'STUDENT' || role === 'TEACHER' ? department : undefined,
        roll_number: role === 'STUDENT' ? rollNumber || undefined : undefined,
        semester: role === 'STUDENT' ? Number(semester) : undefined,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Account</h2>
        <p className="text-sm text-slate-500">Join your campus community.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Your Role
          </label>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['STUDENT', 'TEACHER'] as UserRole[]).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  role === r
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {r === 'STUDENT' ? 'Student' : 'Teacher'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="e.g. Aarav Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full pl-11 pr-4 h-14 text-base bg-[#F8FAFC] border border-[#DCE3EF] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
            <UserIcon className="w-5 h-5 text-slate-400 absolute left-4 top-[18px]" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              required
              placeholder="user@campusbuddy.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 h-14 text-base bg-[#F8FAFC] border border-[#DCE3EF] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
            <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-[18px]" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Password
          </label>
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

        {role === 'STUDENT' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Roll Number</label>
              <input
                type="text"
                required
                placeholder="CS2023042"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="w-full px-4 h-14 text-base bg-[#F8FAFC] border border-[#DCE3EF] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full px-4 h-14 text-base bg-[#F8FAFC] border border-[#DCE3EF] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 mt-2 text-[15px] font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Complete Registration'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-8">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};
