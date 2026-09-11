import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, MessageSquare, Bot, Trophy, HelpCircle, User, Users,
  LogOut, ChevronLeft, ChevronRight, GraduationCap, X
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

type NavItem = {
  label: string;
  path: string;
  icon: React.ElementType;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavigation = (): NavSection[] => {
    const role = user?.role || 'STUDENT';
    
    switch (role) {
      case 'STUDENT':
        return [
          {
            title: 'Academic',
            items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }]
          },
          {
            title: 'Campus Life',
            items: [
              { label: 'Peer Forum', path: '/community', icon: MessageSquare },
              { label: 'Study Buddy', path: '/study-buddy', icon: Users },
              { label: 'Leaderboard', path: '/leaderboard', icon: Trophy }
            ]
          },
          {
            title: 'Resources',
            items: [
              { label: 'AI Assistant', path: '/ai-assistant', icon: Bot },
              { label: 'Complaints', path: '/complaints', icon: HelpCircle }
            ]
          }
        ];
      case 'TEACHER':
        return [
          {
            title: 'Academic',
            items: [{ label: 'Dashboard', path: '/teacher', icon: LayoutDashboard }]
          },
          {
            title: 'Campus Life',
            items: [
              { label: 'Community', path: '/community', icon: MessageSquare },
              { label: 'Study Buddy', path: '/study-buddy', icon: Users }
            ]
          },
          {
            title: 'Resources',
            items: [
              { label: 'Complaints', path: '/complaints', icon: HelpCircle }
            ]
          }
        ];
      case 'PARENT':
        return [
          {
            title: 'Academic',
            items: [{ label: 'Dashboard', path: '/parent', icon: LayoutDashboard }]
          },
          {
            title: 'Resources',
            items: [
              { label: 'Complaints', path: '/complaints', icon: HelpCircle }
            ]
          }
        ];
      case 'ADMIN':
        return [
          {
            title: 'Management',
            items: [{ label: 'Dashboard', path: '/admin', icon: LayoutDashboard }]
          },
          {
            title: 'Resources',
            items: [
              { label: 'All Complaints', path: '/complaints', icon: HelpCircle }
            ]
          },
          {
            title: 'Campus Life',
            items: [
              { label: 'Community', path: '/community', icon: MessageSquare },
              { label: 'Study Buddy', path: '/study-buddy', icon: Users },
              { label: 'Leaderboard', path: '/leaderboard', icon: Trophy }
            ]
          }
        ];
      default:
        return [];
    }
  };

  const navSections = getNavigation();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-navy-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Content */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-50
          flex flex-col bg-navy-900 border-r border-navy-800
          transition-all duration-300 ease-in-out text-slate-300
          ${collapsed ? 'md:w-[76px]' : 'md:w-[260px]'}
          ${mobileOpen ? 'w-[260px] translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="flex items-center h-16 px-5 border-b border-navy-800/50 shrink-0">
          <img src="/logo.jpg" alt="CampusBuddy" className={`rounded-xl object-cover bg-white shadow-sm transition-all duration-300 ${collapsed ? 'w-8 h-8' : 'w-auto h-12'}`} />
          {mobileOpen && (
            <button 
              onClick={onMobileClose}
              className="ml-auto p-1.5 rounded-lg text-slate-400 hover:bg-navy-800 hover:text-white md:hidden transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 scrollbar-none">
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              {!collapsed && (
                <h3 className={`
                  px-3 mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase
                  md:block ${collapsed ? 'md:hidden' : ''}
                `}>
                  {section.title}
                </h3>
              )}
              {collapsed && sIdx > 0 && (
                <div className="hidden md:block mx-auto w-8 border-t border-navy-800 mb-2 mt-4" />
              )}
              <ul className="space-y-1.5">
                {section.items.map((item, iIdx) => {
                  const isActive = location.pathname.startsWith(item.path);
                  const Icon = item.icon;
                  
                  return (
                    <li key={iIdx}>
                      <Link
                        to={item.path}
                        title={collapsed ? item.label : undefined}
                        className={`
                          flex items-center px-3 py-2 rounded-xl transition-all duration-200 group relative
                          active:scale-95
                          ${isActive 
                            ? 'bg-brand-600/10 text-brand-500 font-medium' 
                            : 'text-slate-400 hover:bg-navy-800 hover:text-slate-200'
                          }
                        `}
                      >
                        <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-brand-500' : 'text-slate-400 group-hover:text-slate-300'}`} />
                        <span className={`ml-3 text-sm whitespace-nowrap transition-opacity duration-300 ${collapsed ? 'md:opacity-0 md:w-0 md:hidden' : 'opacity-100'}`}>
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-navy-800/50 shrink-0 space-y-2">
          {!collapsed && (
            <Link
              to="/profile"
              className="flex items-center px-3 py-2 text-slate-400 rounded-xl hover:bg-navy-800 hover:text-slate-200 transition-colors group active:scale-95"
            >
              <User className="w-5 h-5 shrink-0" />
              <span className="ml-3 text-sm font-medium">Profile</span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center px-3 py-2 text-slate-400 rounded-xl
              hover:bg-red-500/10 hover:text-red-400 transition-colors group active:scale-95
              ${collapsed ? 'md:justify-center' : ''}
            `}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={`ml-3 text-sm font-medium transition-opacity duration-300 ${collapsed ? 'md:hidden' : 'opacity-100'}`}>
              Logout
            </span>
          </button>
          
          <button
            onClick={onToggle}
            className={`
              hidden md:flex w-full items-center px-3 py-2 text-slate-500 rounded-xl
              hover:bg-navy-800 hover:text-slate-300 transition-colors active:scale-95
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            <span className={`ml-3 text-sm font-medium transition-opacity duration-300 ${collapsed ? 'hidden' : 'opacity-100'}`}>
              Collapse
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
