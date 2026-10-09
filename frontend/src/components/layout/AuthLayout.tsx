import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, FileText, Users, Trophy } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans">
      {/* Top Navigation - Mobile Only */}
      <div className="md:hidden p-4 absolute top-0 left-0 w-full z-20 flex justify-between">
        <Link to="/" className="inline-flex items-center text-xs font-medium text-white bg-black/20 backdrop-blur px-3 py-1.5 rounded-full">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back
        </Link>
      </div>

      {/* Left Panel - Branding */}
      <div className="w-full md:w-[45%] lg:w-[45%] bg-[#0A192F] p-8 md:p-10 lg:p-16 flex flex-col relative overflow-hidden text-white min-h-[300px] md:min-h-screen justify-center">

        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-blue-600 blur-[120px]" />
          <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-teal-500 blur-[100px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-600 blur-[120px]" />
        </div>

        <div className="relative z-10 h-full flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-8 md:mb-16 mt-8 md:mt-0">
            <img src="/logo.jpg" alt="CampusBuddy" className="h-10 w-10 md:h-12 md:w-12 rounded-xl shadow-lg border border-white/10" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">CampusBuddy</h1>
              <p className="text-[10px] md:text-xs text-blue-200 uppercase tracking-widest font-semibold mt-0.5">Your Campus. Your Community. Your Voice.</p>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.15] mb-4 md:mb-6 tracking-tight">
            Connect.<br />
            Understand.<br />
            Help.<br />
            <span className="text-blue-400">Solve.</span>
          </h2>

          <p className="text-blue-100/80 text-sm md:text-base mb-8 md:mb-12 max-w-md leading-relaxed">
            CampusBuddy brings students and teachers together to solve problems, share knowledge and build a stronger campus community.
          </p>

          <div className="space-y-5 max-w-md hidden md:block">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                <MessageSquare className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-0.5">Ask & Connect</h3>
                <p className="text-xs text-blue-200/70 leading-relaxed">Find answers and connect with peers.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                <FileText className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-0.5">Raise & Track</h3>
                <p className="text-xs text-blue-200/70 leading-relaxed">Submit complaints and follow their progress.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                <Users className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-0.5">Learn Together</h3>
                <p className="text-xs text-blue-200/70 leading-relaxed">Find study partners and share knowledge.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                <Trophy className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-0.5">Make an Impact</h3>
                <p className="text-xs text-blue-200/70 leading-relaxed">Contribute, earn points and help your campus.</p>
              </div>
            </div>
          </div>

          {/* Abstract network visual */}
          <div className="mt-auto pt-12 hidden lg:block opacity-60">
             <div className="flex items-center gap-4 text-xs font-medium text-blue-200/50">
               <span className="px-3 py-1.5 rounded-full border border-blue-200/20 bg-blue-900/20 backdrop-blur-sm">Student</span>
               <div className="h-[1px] w-8 bg-blue-200/20"></div>
               <span className="px-3 py-1.5 rounded-full border border-blue-400/30 bg-blue-600/20 text-blue-300 backdrop-blur-sm">CampusBuddy</span>
               <div className="h-[1px] w-8 bg-blue-200/20"></div>
               <span className="px-3 py-1.5 rounded-full border border-blue-200/20 bg-blue-900/20 backdrop-blur-sm">Community</span>
             </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full md:w-[55%] flex flex-col bg-[#F8FAFC] relative">
        {/* Top Navigation - Desktop */}
        <div className="hidden md:flex justify-end p-6 absolute top-0 right-0 w-full z-10 pointer-events-none">
          <Link to="/" className="pointer-events-auto inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to CampusBuddy
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 md:p-12 lg:p-16 overflow-y-auto">
          <div className="w-full max-w-[520px] animate-in fade-in slide-in-from-bottom-4 duration-700 bg-white p-8 md:p-10 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
