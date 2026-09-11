import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  MessageSquare,
  BookOpen,
  ShieldAlert,
  Sparkles,
  Award,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  ChevronRight,
  Search,
  ThumbsUp,
  MessageCircle,
  HelpCircle,
  Mail,
  Scale
} from 'lucide-react';

// Scroll reveal component for smooth animations
const FadeInSection: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = '' }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
          // Optional: Stop observing once visible to only animate once
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
      className={`transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
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
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-300 py-2.5 px-4 text-center text-xs font-medium border-b border-slate-800">
        <span className="inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          CampusBuddy Platform &bull; Academic & Community Edition
        </span>
      </div>

      {/* 1. Hero Section */}
      <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-40 bg-white border-b border-slate-200 overflow-hidden">
        {/* Subtle background pattern/texture */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, slate 1px, transparent 0)', backgroundSize: '32px 32px' }}>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeInSection className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Your campus. <span className="text-blue-600">Your community.</span> Your voice.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
              Ask questions, find peers, solve problems, and make campus better together. The modern platform built for students, by students.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                Join CampusBuddy
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Explore Community
              </a>
            </div>

            <div className="mt-14 pt-8 border-t border-slate-100 flex flex-wrap justify-center gap-x-12 gap-y-6 text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" /> Verified Students
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" /> Faculty Endorsed
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" /> Secure & Private
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* 2. How CampusBuddy works */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">How it works</h2>
            <p className="text-base text-slate-600 mt-3">A connected ecosystem designed to support you from enrollment to graduation.</p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/8 right-1/8 h-0.5 bg-slate-200 z-0"></div>
            
            {[
              { icon: Search, title: "Discover", desc: "Find answers to academic and campus queries instantly." },
              { icon: MessageSquare, title: "Connect", desc: "Engage with peers and form study groups." },
              { icon: ShieldAlert, title: "Resolve", desc: "Report issues and track them to resolution." },
              { icon: Award, title: "Grow", desc: "Earn reputation and build your academic profile." }
            ].map((step, idx) => (
              <FadeInSection key={idx} delay={idx * 150} className="relative z-10 text-center">
                <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mb-6">
                  <step.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{step.desc}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Community / peer problem solving & 4. Study Buddy */}
      <section className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeInSection>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-6">
                Peer knowledge meets academic collaboration.
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Don't struggle in silence. CampusBuddy's community forums allow you to ask questions anonymously or publicly, share insights, and find study buddies who are tackling the same challenges.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="mt-1 bg-blue-50 p-2 rounded-lg"><MessageCircle className="w-5 h-5 text-blue-600" /></div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Community Q&A</h4>
                    <p className="text-sm text-slate-600">Get answers from peers who have taken the same courses.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 bg-blue-50 p-2 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Study Buddy Finder</h4>
                    <p className="text-sm text-slate-600">Connect with classmates for collaborative studying and project work.</p>
                  </div>
                </li>
              </ul>
            </FadeInSection>
            
            <FadeInSection delay={200} className="relative">
              <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 shadow-sm relative z-10">
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 text-indigo-600 rounded">Data Structures</span>
                      <span className="text-xs text-slate-400">2 hrs ago</span>
                    </div>
                    <p className="font-medium text-slate-900 text-sm">How do I implement a balanced AVL tree in Python?</p>
                    <div className="mt-4 flex gap-4 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> 24</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> 5 Answers</span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm ring-1 ring-blue-50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-xs font-semibold text-blue-700">Faculty Endorsed Answer</span>
                    </div>
                    <p className="text-sm text-slate-600">The key to an AVL tree is updating the height of the nodes after every insertion and performing rotations based on the balance factor...</p>
                  </div>
                </div>
              </div>
              {/* Decorative background blob - subtle */}
              <div className="absolute -inset-4 bg-slate-100/50 rounded-[2.5rem] z-0 transform -rotate-3"></div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* 5. Complaints & escalation */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeInSection className="order-2 lg:order-1 relative">
              <div className="bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-lg relative z-10">
                <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-6">
                  <h3 className="font-bold text-lg">Ticket #CB-9942</h3>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
                    Resolved
                  </span>
                </div>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                      <span className="text-blue-400 font-bold text-sm">S</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-300 mb-1">Library Wi-Fi down on 2nd Floor</p>
                      <p className="text-xs text-slate-500">Reported Oct 12, 09:30 AM</p>
                    </div>
                  </div>
                  
                  <div className="pl-4 ml-4 border-l-2 border-slate-700 space-y-6 py-2">
                    <div className="relative">
                      <div className="absolute -left-[23px] w-3 h-3 rounded-full bg-amber-500"></div>
                      <p className="text-xs text-slate-400">Oct 12, 10:15 AM &bull; Assigned to IT Support</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[23px] w-3 h-3 rounded-full bg-emerald-500"></div>
                      <p className="text-xs text-slate-400">Oct 12, 14:00 PM &bull; Issue fixed, router replaced</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInSection>

            <FadeInSection delay={200} className="order-1 lg:order-2">
              <ShieldAlert className="w-12 h-12 text-blue-400 mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                Transparent issue resolution.
              </h2>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Say goodbye to lost emails and ignored requests. Our formal grievance system tracks every complaint with strict SLAs, ensuring administration is held accountable and campus issues are resolved swiftly.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Trackable complaint IDs
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Automated SLA escalations
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Full transparency for students
                </li>
              </ul>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* 6. AI Guidance */}
      <section className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeInSection className="max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl mb-6">
              <Sparkles className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-6">
              Meet your intelligent campus guide.
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-10">
              CampusBuddy AI isn't just a chatbot. It's contextually aware of your attendance, fees, schedules, and college policies. Ask it anything about your campus life and get accurate, personalized guidance instantly.
            </p>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto text-left overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                <span className="ml-2 text-xs font-medium text-slate-500">CampusBuddy AI Assistant</span>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="text-slate-600 font-medium text-sm">Me</span>
                  </div>
                  <div className="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-slate-700">
                    What happens if I miss tomorrow's OS lab?
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-slate-800">
                    Your current OS lab attendance is at <strong>76%</strong>. If you miss tomorrow's session, it will drop to <strong>72%</strong>, which is below the 75% mandatory threshold. I highly recommend attending.
                  </div>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* 7. Contributions / reputation & 8. Community trust */}
      <section className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <FadeInSection className="bg-slate-50 rounded-3xl p-8 border border-slate-200 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <Award className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Build your reputation</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  Your contributions matter. Answer questions, share resources, and help peers to earn reputation points. Top contributors receive academic recognition and badges.
                </p>
                <Link to="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                  View Leaderboards <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </FadeInSection>

            <FadeInSection delay={150} className="bg-slate-50 rounded-3xl p-8 border border-slate-200 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Trust & Moderation</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  A safe, verified environment. All users are authenticated college members. Information is vetted by faculty endorsements, keeping the community reliable and academic.
                </p>
                <Link to="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                  Read our Guidelines <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* 9. Final CTA */}
      <section className="py-24 bg-blue-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-900 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <FadeInSection>
            <h2 className="text-4xl sm:text-5xl font-black mb-6 tracking-tight">
              Ready to shape your campus?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join thousands of students and faculty already making their college experience better, together.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-blue-600 bg-white hover:bg-slate-50 rounded-xl shadow-lg transition-all gap-2"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-6 text-sm text-blue-200">
              Sign in with your institutional email to verify your status.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              CampusBuddy
            </div>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              The modern college community platform bridging the gap between students, faculty, and administration.
            </p>
            <div className="flex gap-4">
              {/* Social icons could go here */}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/community" className="hover:text-blue-400 transition-colors">Community Forum</Link></li>
              <li><Link to="/login" className="hover:text-blue-400 transition-colors">Study Groups</Link></li>
              <li><Link to="/login" className="hover:text-blue-400 transition-colors">Grievance Desk</Link></li>
              <li><Link to="/login" className="hover:text-blue-400 transition-colors">AI Assistant</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Academic</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/login" className="hover:text-blue-400 transition-colors">Attendance</Link></li>
              <li><Link to="/login" className="hover:text-blue-400 transition-colors">Timetable</Link></li>
              <li><Link to="/login" className="hover:text-blue-400 transition-colors">Results & Marks</Link></li>
              <li><Link to="/login" className="hover:text-blue-400 transition-colors">Fee Management</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> admin@campusbuddy.edu</li>
              <li className="flex items-center gap-2"><HelpCircle className="w-4 h-4" /> Help Center</li>
              <li className="flex items-center gap-2"><Scale className="w-4 h-4" /> Terms & Privacy</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>&copy; {new Date().getFullYear()} CampusBuddy Platform. Built for Project Based Learning.</p>
          <p>Strictly adheres to institutional data isolation.</p>
        </div>
      </footer>
    </div>
  );
};
