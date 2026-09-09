import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  MessageSquare,
  Award,
  Sparkles,
  LayoutDashboard,
  Bell,
  LogOut,
  ChevronDown,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AppNotification, UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const { user, logout, quickLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const fetchNotifs = async () => {
    if (user) {
      try {
        const notifs = await api.getNotifications();
        setNotifications(notifs);
      } catch (e) {
        console.error('Failed to load notifications', e);
      }
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 20000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleSwitch = async (role: UserRole) => {
    setShowRoleSwitcher(false);
    await quickLogin(role);
    if (role === 'ADMIN') navigate('/admin');
    else if (role === 'TEACHER') navigate('/teacher');
    else if (role === 'PARENT') navigate('/parent');
    else navigate('/dashboard');
  };

  const getRoleBadgeColor = (role?: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'TEACHER':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PARENT':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const navLinkClass = (path: string) => {
    const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    return `flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-600 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">
                  CampusBuddy
                </span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 rounded">
                  PBL Edition
                </span>
              </div>
            </Link>

            {/* Navigation links for logged-in users */}
            {user && (
              <nav className="hidden md:flex items-center gap-1">
                {user.role === 'ADMIN' ? (
                  <>
                    <Link to="/admin" className={navLinkClass('/admin')}>
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link to="/complaints" className={navLinkClass('/complaints')}>
                      <ShieldAlert className="w-4 h-4" />
                      Complaints
                    </Link>
                    <Link to="/community" className={navLinkClass('/community')}>
                      <MessageSquare className="w-4 h-4" />
                      Community
                    </Link>
                    <Link to="/leaderboard" className={navLinkClass('/leaderboard')}>
                      <Award className="w-4 h-4" />
                      Leaderboard
                    </Link>
                  </>
                ) : user.role === 'TEACHER' ? (
                  <>
                    <Link to="/teacher" className={navLinkClass('/teacher')}>
                      <LayoutDashboard className="w-4 h-4" />
                      Teacher Hub
                    </Link>
                    <Link to="/complaints" className={navLinkClass('/complaints')}>
                      <ShieldAlert className="w-4 h-4" />
                      Complaints
                    </Link>
                    <Link to="/community" className={navLinkClass('/community')}>
                      <MessageSquare className="w-4 h-4" />
                      Peer Forum
                    </Link>
                    <Link to="/leaderboard" className={navLinkClass('/leaderboard')}>
                      <Award className="w-4 h-4" />
                      Leaderboard
                    </Link>
                  </>
                ) : user.role === 'PARENT' ? (
                  <>
                    <Link to="/parent" className={navLinkClass('/parent')}>
                      <LayoutDashboard className="w-4 h-4" />
                      Parent Portal
                    </Link>
                    <Link to="/complaints" className={navLinkClass('/complaints')}>
                      <ShieldAlert className="w-4 h-4" />
                      Student Complaints
                    </Link>
                  </>
                ) : (
                  // Student
                  <>
                    <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link to="/complaints" className={navLinkClass('/complaints')}>
                      <ShieldAlert className="w-4 h-4" />
                      Complaints
                    </Link>
                    <Link to="/community" className={navLinkClass('/community')}>
                      <MessageSquare className="w-4 h-4" />
                      Community
                    </Link>
                    <Link to="/ai-assistant" className={navLinkClass('/ai-assistant')}>
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                      AI Guide
                    </Link>
                    <Link to="/leaderboard" className={navLinkClass('/leaderboard')}>
                      <Award className="w-4 h-4" />
                      Leaderboard
                    </Link>
                  </>
                )}
              </nav>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Demo Quick Switcher Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
                    title="Switch user demo role"
                  >
                    <span className={`px-1.5 py-0.5 rounded border text-[11px] ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                    <span className="hidden sm:inline text-slate-500">Switch</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showRoleSwitcher && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Demo Account Switcher
                      </div>
                      <button
                        onClick={() => handleRoleSwitch('STUDENT')}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex items-center justify-between text-slate-700"
                      >
                        <div>
                          <p className="font-semibold">Student (Aarav)</p>
                          <p className="text-[10px] text-slate-400">Full access & points</p>
                        </div>
                        {user.role === 'STUDENT' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </button>
                      <button
                        onClick={() => handleRoleSwitch('TEACHER')}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 flex items-center justify-between text-slate-700"
                      >
                        <div>
                          <p className="font-semibold">Teacher (Prof. Vikram)</p>
                          <p className="text-[10px] text-slate-400">Resolve & Endorse</p>
                        </div>
                        {user.role === 'TEACHER' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </button>
                      <button
                        onClick={() => handleRoleSwitch('PARENT')}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 flex items-center justify-between text-slate-700"
                      >
                        <div>
                          <p className="font-semibold">Parent (Sunil Sharma)</p>
                          <p className="text-[10px] text-slate-400">Ward transparency</p>
                        </div>
                        {user.role === 'PARENT' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                      </button>
                      <button
                        onClick={() => handleRoleSwitch('ADMIN')}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 flex items-center justify-between text-slate-700"
                      >
                        <div>
                          <p className="font-semibold">Administrator (Dean)</p>
                          <p className="text-[10px] text-slate-400">Manage all & Analytics</p>
                        </div>
                        {user.role === 'ADMIN' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Points Pill (For Students) */}
                {user.student_profile && (
                  <Link
                    to="/leaderboard"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold hover:bg-amber-100 transition shadow-sm"
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{user.student_profile.total_points} pts</span>
                  </Link>
                )}

                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                        <span className="font-semibold text-sm text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-3 text-xs hover:bg-slate-50 transition ${
                                !n.is_read ? 'bg-blue-50/50' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-slate-800">{n.title}</p>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                  {new Date(n.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-slate-600 mt-1">{n.message}</p>
                              {n.link && (
                                <Link
                                  to={n.link}
                                  onClick={() => setShowNotifications(false)}
                                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-medium mt-1 hover:underline"
                                >
                                  View details <ExternalLink className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Link */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 pl-2 border-l border-slate-200 text-sm font-medium text-slate-700 hover:text-blue-600 transition"
                >
                  <img
                    src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`}
                    alt={user.full_name}
                    className="w-8 h-8 rounded-full border border-slate-200 bg-slate-100"
                  />
                  <span className="hidden lg:inline">{user.full_name.split(' ')[0]}</span>
                </Link>

                {/* Logout */}
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
