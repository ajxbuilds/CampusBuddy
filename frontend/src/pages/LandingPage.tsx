import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, MessageSquare, ArrowRight, CheckCircle2,
  ChevronRight, ThumbsUp, AlertCircle, Bot, Zap,
  Check, CircleDashed, ShieldCheck, MapPin, UserCheck, MessageCircle
} from 'lucide-react';

const FadeInSection: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = '' }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (domRef.current) observer.unobserve(domRef.current);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    const currentRef = domRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      
      {/* 1. Hero Section - Two Column */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 bg-white overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)', backgroundSize: '64px 64px' }}>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column - Content */}
            <FadeInSection className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-bold uppercase tracking-widest text-slate-600 mb-8 border border-slate-200 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                KKWIEER • Campus Community Platform
              </div>
              
              <h1 className="text-5xl lg:text-[4rem] font-black text-slate-900 tracking-tight leading-[1.05] mb-6">
                Your campus.<br/>
                <span className="text-blue-700">Your community.</span><br/>
                Your voice.
              </h1>
              
              <p className="text-lg text-slate-600 leading-relaxed font-medium mb-10">
                Ask questions, find peers, solve problems, and make campus better together.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-md shadow-blue-700/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  Join CampusBuddy
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#community"
                  className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  Explore Community
                </a>
              </div>
              
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <div className="w-8 h-[1px] bg-slate-300"></div>
                Built for the K.K. Wagh campus community
              </div>
            </FadeInSection>

            {/* Right Column - Layered Product Previews */}
            <FadeInSection delay={200} className="relative h-[550px] hidden md:block">
              {/* Question Preview */}
              <div className="absolute top-10 right-10 w-[380px] bg-white rounded-2xl border border-slate-200 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] p-5 z-20 hover:scale-105 transition-transform duration-500">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700">Programming</span>
                </div>
                <h3 className="font-bold text-slate-900 leading-tight mb-4">How do I prepare for my DSA viva?</h3>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> 8 answers</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Accepted</span>
                    <span className="flex items-center gap-1 text-blue-600 font-bold"><ThumbsUp className="w-3.5 h-3.5" /> 18</span>
                  </div>
                </div>
              </div>

              {/* Complaint Preview */}
              <div className="absolute top-48 left-0 w-[360px] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-5 z-30 hover:scale-105 transition-transform duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono text-slate-400">#CB-2026-10482</span>
                </div>
                <h3 className="font-bold text-white mb-1">Library Wi-Fi unavailable</h3>
                <p className="text-sm text-slate-400 mb-5 flex items-center gap-1"><MapPin className="w-3 h-3" /> 2nd Floor Reading Room</p>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  <span className="text-amber-400 uppercase tracking-widest">In Progress</span>
                </div>
              </div>

              {/* Study Buddy Preview */}
              <div className="absolute bottom-10 right-20 w-[320px] bg-white rounded-2xl border border-slate-200 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] p-5 z-10 hover:scale-105 transition-transform duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Data Structures Group</h3>
                    <p className="text-xs font-medium text-slate-500">Online</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white"></div>
                    <div className="w-7 h-7 rounded-full bg-slate-300 border-2 border-white"></div>
                    <div className="w-7 h-7 rounded-full bg-slate-400 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">+2</div>
                  </div>
                  <button className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors">Join Group</button>
                </div>
              </div>
            </FadeInSection>

          </div>
        </div>
      </section>

      {/* 2. Trust Strip */}
      <section className="border-y border-slate-200 bg-slate-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-center md:justify-between gap-4">
          <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
            <img src="/kkwagh_logo.png" alt="K.K. Wagh" className="h-8 w-auto object-contain" />
            <span className="font-bold text-sm text-slate-800 hidden md:block">K. K. Wagh Institute of Engineering Education & Research</span>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 text-center">
            Community • Collaboration • Problem Solving
          </div>
        </div>
      </section>

      {/* 3. Core Platform Features */}
      <section id="how-it-works" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Everything happening on campus, connected.
            </h2>
            <p className="text-lg text-slate-600 font-medium leading-relaxed">
              One platform for peer questions, study collaboration, and transparent issue resolution.
            </p>
          </FadeInSection>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Ask */}
            <FadeInSection delay={100} className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-blue-200 transition-colors group">
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-blue-700 transition-colors">Ask</h3>
              <p className="text-slate-600 font-medium mb-8 leading-relaxed">
                Get answers from peers who have already solved the problem.
              </p>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="mb-2"><span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Projects</span></div>
                <div className="text-sm font-bold text-slate-800 leading-snug mb-3">Best resources for learning React?</div>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Solved</span>
                  <span>8 answers</span>
                </div>
              </div>
            </FadeInSection>

            {/* Connect */}
            <FadeInSection delay={200} className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-indigo-200 transition-colors group">
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-indigo-700 transition-colors">Connect</h3>
              <p className="text-slate-600 font-medium mb-8 leading-relaxed">
                Find students to collaborate with on projects and study goals.
              </p>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600"><Users className="w-4 h-4" /></div>
                  <div className="text-sm font-bold text-slate-800">Web Development</div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs font-semibold text-slate-500">6 members</span>
                  <span className="text-xs font-bold text-indigo-600">Join</span>
                </div>
              </div>
            </FadeInSection>

            {/* Solve */}
            <FadeInSection delay={300} className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-amber-200 transition-colors group">
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-amber-600 transition-colors">Solve</h3>
              <p className="text-slate-600 font-medium mb-8 leading-relaxed">
                Raise a college issue and follow it through transparent resolution.
              </p>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
                <div className="flex items-center gap-3 text-xs font-medium text-slate-500"><Check className="w-4 h-4 text-emerald-500" /> Submitted</div>
                <div className="flex items-center gap-3 text-xs font-medium text-slate-500"><Check className="w-4 h-4 text-emerald-500" /> Under Review</div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-800"><CircleDashed className="w-4 h-4 text-amber-500 animate-spin-slow" /> In Progress</div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* 4. Community Preview */}
      <section id="community" className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <FadeInSection className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">Questions worth answering.</h2>
              <p className="text-lg text-slate-600 font-medium leading-relaxed">Tap into the collective knowledge of your peers.</p>
            </FadeInSection>
            <FadeInSection delay={100}>
              <Link to="/register" className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800 transition-colors group">
                Explore Community <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </FadeInSection>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { q: "How should I structure my final-year project documentation?", cat: "Projects", ans: 12, up: 24 },
              { q: "What's the process for getting bonafide certificate quickly?", cat: "Admin", ans: 5, up: 14 },
              { q: "How do I prepare for the upcoming DB viva?", cat: "Academics", ans: 6, up: 11 }
            ].map((item, i) => (
              <FadeInSection key={i} delay={i * 100} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
                <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded mb-4">{item.cat}</span>
                <h4 className="font-bold text-slate-900 leading-snug mb-6 group-hover:text-blue-700 transition-colors">{item.q}</h4>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-4 border-t border-slate-100">
                  <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> {item.ans} answers</span>
                  <span className="flex items-center gap-1.5 text-blue-600"><ThumbsUp className="w-4 h-4" /> {item.up}</span>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Study Buddy Preview */}
      <section id="study-buddy" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <FadeInSection className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">Find your study circle.</h2>
              <p className="text-lg text-slate-600 font-medium leading-relaxed">Connect with peers who share your subjects, projects and learning goals.</p>
            </FadeInSection>
            <FadeInSection delay={100}>
              <Link to="/register" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors group">
                View all groups <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </FadeInSection>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Data Structures", members: 4, mode: "Online", icon: "💻" },
              { name: "Web Development", members: 6, mode: "Project collab", icon: "🚀" },
              { name: "Database Systems", members: 5, mode: "Exam prep", icon: "🗄️" }
            ].map((item, i) => (
              <FadeInSection key={i} delay={i * 100} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-xl">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">{item.name}</h4>
                    <p className="text-xs font-semibold text-slate-500">{item.members} members • {item.mode}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Complaints Section */}
      <section id="complaints" className="py-24 bg-navy-900 text-white relative overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeInSection>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6 leading-[1.1]">
                Your complaint shouldn't disappear into an inbox.
              </h2>
              <p className="text-lg text-slate-300 font-medium leading-relaxed mb-10">
                Track every update, understand what happens next, and follow an issue through resolution.
              </p>
              
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Trackable complaint IDs</h4>
                    <p className="text-sm text-slate-400">Never lose a grievance. Every report gets a unique tracked ID.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Transparent status updates</h4>
                    <p className="text-sm text-slate-400">Watch the progress as it moves from review to resolution.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Structured escalation</h4>
                    <p className="text-sm text-slate-400">Issues that stall are automatically escalated to higher authorities.</p>
                  </div>
                </li>
              </ul>
            </FadeInSection>

            <FadeInSection delay={200} className="relative">
              <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-8">
                <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-6">
                  <div>
                    <h3 className="font-bold text-lg text-white mb-1">Library Wi-Fi unavailable</h3>
                    <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                      <AlertCircle className="w-3.5 h-3.5" /> #CB-2026-10482
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    In Progress
                  </span>
                </div>
                
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                  {/* Timeline Item 1 */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow ring-4 ring-slate-800 z-10">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded bg-slate-700/50 border border-slate-600">
                      <h4 className="font-bold text-white text-sm">Submitted</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Oct 12, 09:41 AM</p>
                    </div>
                  </div>
                  {/* Timeline Item 2 */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow ring-4 ring-slate-800 z-10">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded bg-slate-700/50 border border-slate-600">
                      <h4 className="font-bold text-white text-sm">Under Review</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Oct 12, 10:15 AM</p>
                    </div>
                  </div>
                  {/* Timeline Item 3 */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-amber-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow ring-4 ring-slate-800 z-10">
                      <CircleDashed className="w-3.5 h-3.5 animate-spin-slow" />
                    </div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded bg-amber-500/10 border border-amber-500/30">
                      <h4 className="font-bold text-amber-400 text-sm">Assigned to IT Support</h4>
                      <p className="text-[10px] text-amber-400/70 mt-1">Pending action...</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* 7. AI Guidance */}
      <section className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeInSection>
            <div className="w-16 h-16 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">Not sure where to start?</h2>
            <p className="text-lg text-slate-600 font-medium leading-relaxed mb-12">
              CampusBuddy can help you understand the right procedure, policy, or next step before you submit an issue.
            </p>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 md:p-8 text-left max-w-2xl mx-auto shadow-sm">
              <div className="flex gap-4 mb-6">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4 text-slate-600" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 text-sm font-medium text-slate-700 shadow-sm">
                  The classroom projector isn't working. What should I do?
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl rounded-tl-sm p-4 text-sm font-medium text-slate-800 shadow-sm leading-relaxed">
                  Check whether the issue affects only your classroom or multiple rooms. If it is a persistent infrastructure issue, you can submit it through Complaints and track the request there.
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* 8. Contribution / Reputation */}
      <section className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <FadeInSection>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">Help someone.<br/>Make an impact.</h2>
              <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8">
                Your contributions don't go unnoticed. Earn reputation for helpful answers and build your standing within the college community.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <span className="font-bold text-slate-700 text-sm">Helpful answer</span>
                  <span className="font-black text-emerald-600 text-sm bg-emerald-50 px-2 py-1 rounded">+5 pts</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <span className="font-bold text-slate-700 text-sm">Community upvote</span>
                  <span className="font-black text-blue-600 text-sm bg-blue-50 px-2 py-1 rounded">+10 pts</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-amber-400">
                  <span className="font-bold text-slate-700 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500" /> Accepted answer</span>
                  <span className="font-black text-amber-600 text-sm bg-amber-50 px-2 py-1 rounded">+20 pts</span>
                </div>
              </div>
            </FadeInSection>
            
            <FadeInSection delay={200} className="flex justify-center">
              <div className="w-64 h-64 relative">
                <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
                <div className="relative bg-white w-full h-full rounded-full border-[8px] border-slate-50 shadow-2xl flex flex-col items-center justify-center p-8 text-center">
                  <div className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">1,250</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Reputation</div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Campus Scholar
                  </span>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* 9. Final CTA */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <FadeInSection>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">Make your campus better, together.</h2>
            <p className="text-xl text-slate-600 font-medium mb-10">Ask. Connect. Solve. Contribute.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-10 py-4 text-lg font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                Join CampusBuddy
              </Link>
              <a
                href="#community"
                className="w-full sm:w-auto px-10 py-4 text-lg font-bold text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                Explore Community
              </a>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-cover shadow-sm bg-white" />
                <span className="font-bold text-white text-lg tracking-tight">CampusBuddy</span>
              </div>
              <p className="text-sm text-slate-400 font-medium">Your campus. Your community. Your voice.</p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Platform</h4>
              <ul className="space-y-3 text-sm font-medium">
                <li><a href="#community" className="text-slate-400 hover:text-white transition-colors">Community</a></li>
                <li><a href="#study-buddy" className="text-slate-400 hover:text-white transition-colors">Study Buddy</a></li>
                <li><a href="#complaints" className="text-slate-400 hover:text-white transition-colors">Complaints</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">AI Guidance</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Resources</h4>
              <ul className="space-y-3 text-sm font-medium">
                <li><a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Help</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Institution</h4>
              <p className="text-sm font-medium text-slate-400 mb-2">K. K. Wagh Institute of Engineering Education & Research</p>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
            <p>&copy; {new Date().getFullYear()} CampusBuddy Platform.</p>
            <p>Built for Project Based Learning.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
