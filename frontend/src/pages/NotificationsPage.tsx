import React from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';

export const NotificationsPage = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Bell className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 w-full">
          <h1 className="text-3xl font-black tracking-tight mb-2">Notifications</h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            View all your recent alerts, updates, and community activity.
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">All Caught Up!</h2>
        <p className="text-slate-500 mt-2">You don't have any new notifications at the moment.</p>
      </div>
    </div>
  );
};
