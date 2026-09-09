import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Complaint } from '../types';
import { ComplaintCard } from '../components/complaints/ComplaintCard';

export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await api.listComplaints();
        setComplaints(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const activeCount = complaints.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-800 via-amber-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider">
              Parent Portal Transparency
            </span>
            <span className="text-xs text-amber-200">
              Verified Guardian Account
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-sm text-amber-100 max-w-xl mt-1 leading-relaxed">
            Track all formal complaints and administrative inquiries submitted by your ward in real-time. CampusBuddy ensures complete accountability and transparent resolution timelines.
          </p>
        </div>

        <div className="p-4 bg-white/10 backdrop-blur rounded-2xl border border-white/20 text-xs space-y-1">
          <p className="font-bold text-amber-200">Linked Ward Information</p>
          <p className="text-white font-semibold">Aarav Sharma (B.Tech CS)</p>
          <p className="text-amber-100/80 text-[11px]">Roll: CS2023042 &bull; Semester 4</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Inquiries / Complaints
            </p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Resolved Inquiries
            </p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{resolvedCount}</p>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Your Ward's Complaint History</h2>
          <p className="text-xs text-slate-500">
            Click any complaint to inspect the chronological timeline and official administration remarks
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            Loading student records...
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <p className="text-sm font-bold text-slate-700">No active complaints filed by your ward.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complaints.map((c) => (
              <ComplaintCard key={c.id} complaint={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
