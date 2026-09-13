import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If user is authenticated, don't render the public navbar
  if (user) return null;

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-[0_4px_20px_-15px_rgba(0,0,0,0.1)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Identity - Left */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-4 group">
              <img 
                src="/kkwagh_logo.png" 
                alt="K.K. Wagh Institute" 
                className="h-10 md:h-12 w-auto object-contain transition-opacity hover:opacity-90"
              />
              <div className="w-[1px] h-8 bg-slate-300 hidden sm:block"></div>
              <span className="hidden sm:block text-xl font-black text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                CampusBuddy
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Center/Right */}
          <nav className="hidden lg:flex items-center gap-8 ml-auto mr-8">
            <a href="/#community" className="text-sm font-semibold text-slate-600 hover:text-blue-700 transition-colors">
              Community
            </a>
            <a href="/#study-buddy" className="text-sm font-semibold text-slate-600 hover:text-blue-700 transition-colors">
              Study Buddy
            </a>
            <a href="/#complaints" className="text-sm font-semibold text-slate-600 hover:text-blue-700 transition-colors">
              Complaints
            </a>
            <a href="/#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-blue-700 transition-colors">
              How it Works
            </a>
          </nav>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm hover:shadow transition-all active:scale-[0.98]"
            >
              Join CampusBuddy
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white absolute w-full shadow-lg">
          <div className="px-4 py-4 space-y-4">
            <a href="/#community" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-lg">
              Community
            </a>
            <a href="/#study-buddy" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-lg">
              Study Buddy
            </a>
            <a href="/#complaints" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-lg">
              Complaints
            </a>
            <a href="/#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-lg">
              How it Works
            </a>
            <div className="border-t border-slate-100 pt-4 pb-2 space-y-3">
              <Link to="/login" className="block w-full text-center px-4 py-2 text-base font-bold text-slate-700 bg-slate-50 rounded-lg">
                Sign In
              </Link>
              <Link to="/register" className="block w-full text-center px-4 py-2 text-base font-bold text-white bg-blue-700 rounded-lg shadow-sm">
                Join CampusBuddy
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
