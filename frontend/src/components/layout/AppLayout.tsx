import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <TopBar 
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
