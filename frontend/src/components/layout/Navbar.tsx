import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Public Navbar — shown only on public/guest pages (landing, login, register).
 * Authenticated users use the Sidebar + TopBar layout instead.
 */
export const Navbar: React.FC = () => {
  const { user } = useAuth();

  // If user is authenticated, don't render the public navbar
  // (AppLayout's TopBar handles authenticated navigation)
  if (user) return null;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center group">
            <img src="/logo.jpg" alt="CampusBuddy" className="h-12 w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform" />
          </Link>

          {/* Public Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition">
              Home
            </Link>
            <a href="/#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">
              Features
            </a>
            <a href="/#how-it-works" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">
              How It Works
            </a>
            <a href="/#about" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">
              About
            </a>
            <a href="/#contact" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">
              Contact
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
