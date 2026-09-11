import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { AppLayout } from './components/layout/AppLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { OnboardingPage } from './pages/OnboardingPage';

// Login Pages
import { StudentLoginPage } from './pages/login/StudentLoginPage';
import { TeacherLoginPage } from './pages/login/TeacherLoginPage';
import { ParentLoginPage } from './pages/login/ParentLoginPage';
import { AdminLoginPage } from './pages/login/AdminLoginPage';

// Role Dashboards
import { StudentDashboard } from './pages/StudentDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { ParentDashboard } from './pages/ParentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

// Community & Support Pages
import { ComplaintsPage } from './pages/ComplaintsPage';
import { ComplaintDetailPage } from './pages/ComplaintDetailPage';
import { CommunityPage } from './pages/CommunityPage';
import { QuestionDetailPage } from './pages/QuestionDetailPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { StudyBuddyPage } from './pages/StudyBuddyPage';


// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-50/50">
        <div className="text-center space-y-4 animate-fade-in">
          <img src="/logo.jpg" alt="CampusBuddy Logo" className="h-16 w-auto mx-auto drop-shadow-md rounded-2xl" />
          <div className="w-48 h-1 bg-slate-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-brand-600 rounded-full animate-[shimmer_1.5s_infinite] w-1/2"></div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Authenticating
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Smart Dashboard Redirection based on Role
const SmartDashboard: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') return <AdminDashboard />;
  if (user?.role === 'TEACHER') return <TeacherDashboard />;
  if (user?.role === 'PARENT') return <ParentDashboard />;
  return <StudentDashboard />;
};

// Public layout wrapper (uses top navbar)
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-slate-50">
    <Navbar />
    <main className="flex-1">{children}</main>
  </div>
);

// Authenticated layout wrapper (uses sidebar + topbar)
const AuthenticatedLayout: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => (
  <ProtectedRoute allowedRoles={allowedRoles}>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ============ PUBLIC ROUTES (Top Navbar) ============ */}
          <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
          <Route path="/login/student" element={<PublicLayout><StudentLoginPage /></PublicLayout>} />
          <Route path="/login/teacher" element={<PublicLayout><TeacherLoginPage /></PublicLayout>} />
          <Route path="/login/parent" element={<PublicLayout><ParentLoginPage /></PublicLayout>} />
          <Route path="/login/admin" element={<PublicLayout><AdminLoginPage /></PublicLayout>} />
          <Route path="/register" element={<PublicLayout><RegisterPage /></PublicLayout>} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/onboarding" element={<PublicLayout><OnboardingPage /></PublicLayout>} />

          {/* ============ AUTHENTICATED ROUTES (Sidebar Layout) ============ */}
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<AuthenticatedLayout><SmartDashboard /></AuthenticatedLayout>} />
          <Route path="/student/dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/teacher/dashboard" element={<Navigate to="/teacher" replace />} />
          <Route path="/parent/dashboard" element={<Navigate to="/parent" replace />} />
          <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />

          {/* Role-Specific Dashboards */}
          <Route path="/teacher" element={<AuthenticatedLayout allowedRoles={['TEACHER', 'ADMIN']}><TeacherDashboard /></AuthenticatedLayout>} />
          <Route path="/parent" element={<AuthenticatedLayout allowedRoles={['PARENT', 'ADMIN']}><ParentDashboard /></AuthenticatedLayout>} />
          <Route path="/admin" element={<AuthenticatedLayout allowedRoles={['ADMIN']}><AdminDashboard /></AuthenticatedLayout>} />

          {/* Complaints & Community */}
          <Route path="/complaints" element={<AuthenticatedLayout><ComplaintsPage /></AuthenticatedLayout>} />
          <Route path="/complaints/:id" element={<AuthenticatedLayout><ComplaintDetailPage /></AuthenticatedLayout>} />
          <Route path="/community" element={<AuthenticatedLayout><CommunityPage /></AuthenticatedLayout>} />
          <Route path="/community/:id" element={<AuthenticatedLayout><QuestionDetailPage /></AuthenticatedLayout>} />
          <Route path="/ai-assistant" element={<AuthenticatedLayout><AIAssistantPage /></AuthenticatedLayout>} />
          <Route path="/leaderboard" element={<AuthenticatedLayout><LeaderboardPage /></AuthenticatedLayout>} />

          {/* System Pages */}
          <Route path="/profile" element={<AuthenticatedLayout><ProfilePage /></AuthenticatedLayout>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

