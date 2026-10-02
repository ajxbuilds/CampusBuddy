import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, User as UserIcon, LogOut, Settings } from 'lucide-react';

interface TopBarProps {
  onToggleMobileSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifications = await api.getNotifications();
        const unread = notifications.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return 'Dashboard';
    
    const title = parts[0].replace(/-/g, ' ');
    return title.charAt(0).toUpperCase() + title.slice(1);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 shrink-0 flex items-center justify-between px-6 z-20 sticky top-0 transition-all">
      <div className="flex items-center flex-1">
        <button 
          onClick={onToggleMobileSidebar}
          className="mr-4 p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:scale-95 md:hidden transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 capitalize hidden sm:block tracking-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4 flex-1 justify-end">
        {/* Notifications */}
        <Link 
          to="/notifications" 
          className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
          )}
        </Link>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 focus:outline-none p-1.5 pr-3 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 active:scale-95"
          >
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt="Profile" 
                className="h-8 w-8 rounded-full object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-semibold text-sm border border-brand-100 shadow-sm">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-700 leading-tight truncate max-w-[120px]">{user?.full_name || 'User'}</p>
              <p className="text-xs text-slate-500 leading-tight capitalize">{user?.role?.toLowerCase() || 'Student'}</p>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 py-2 z-50 animate-fade-in origin-top-right">
              <div className="px-4 py-3 border-b border-slate-50 md:hidden">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.full_name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || 'user@example.com'}</p>
              </div>
              
              <div className="px-2 mt-1">
                <Link 
                  to="/profile" 
                  className="flex items-center px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <UserIcon className="w-4 h-4 mr-3" />
                  Profile
                </Link>
                <Link 
                  to="/settings" 
                  className="flex items-center px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </Link>
              </div>
              
              <div className="h-px bg-slate-100 my-2"></div>
              
              <div className="px-2 mb-1">
                <button 
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
