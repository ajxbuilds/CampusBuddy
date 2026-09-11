import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Award,
  Flame,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  HandHeart,
  Star,
  Medal,
  Clock,
  BookOpen,
  GraduationCap,
  Users,
  Building,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserBadge, PointTransaction } from '../types';
import { Skeleton } from '../components/ui/Skeleton';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      try {
        const [bData, tData] = await Promise.all([
          api.getMyBadges(),
          api.getMyTransactions(),
        ]);
        setBadges(bData);
        setTransactions(tData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadProfileData();
  }, []);

  const getBadgeIcon = (iconName?: string) => {
    switch (iconName) {
      case 'HandHeart':
        return <HandHeart className="w-5 h-5 text-rose-500" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'Star':
        return <Star className="w-5 h-5 text-amber-500 fill-amber-500" />;
      case 'Award':
        return <Award className="w-5 h-5 text-blue-500" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-indigo-500" />;
      default:
        return <Medal className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-24 w-32 rounded-2xl" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
          <img
            src={
              user?.avatar_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.full_name || 'User'}`
            }
            alt={user?.full_name}
            className="w-28 h-28 rounded-full border-4 border-white shadow-lg bg-slate-50 shrink-0 z-10"
          />

          <div className="flex-1 text-center sm:text-left space-y-2 z-10">
            <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
              <h1 className="text-3xl font-extrabold text-blue-950">{user?.full_name}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                {user?.role}
              </span>
            </div>

            <p className="text-sm font-medium text-slate-500">{user?.email}</p>

            <div className="flex items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-sm text-slate-600 pt-3 flex-wrap">
              {user?.department && (
                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <Building className="w-4 h-4 text-slate-400" />
                  <strong>{user.department}</strong>
                </span>
              )}
              {user?.student_profile && (
                <>
                  <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    Roll: <strong>{user.student_profile.roll_number}</strong>
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    Semester <strong>{user.student_profile.semester}</strong>
                  </span>
                </>
              )}
            </div>
          </div>

          {user?.student_profile && (
            <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl text-center shrink-0 shadow-sm z-10">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">
                Academic Reputation
              </span>
              <span className="text-3xl font-black text-amber-600 flex items-center justify-center gap-1.5">
                <Flame className="w-6 h-6 fill-amber-500 text-amber-500" />
                {user.student_profile.total_points}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Earned Badges Showcase */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Academic Achievements ({badges.length})
          </h2>
          <p className="text-sm text-slate-500 mt-1">Recognitions earned for contributions to the campus community</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
             {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        ) : badges.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl">
            <Award className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">
              No academic badges unlocked yet. Participate in the community to earn your first recognition!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {badges.map((ub) => (
              <div
                key={ub.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex items-start gap-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                  {getBadgeIcon(ub.badge?.icon)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-950">{ub.badge?.name}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    {ub.badge?.description}
                  </p>
                  <span className="text-[10px] font-medium text-slate-400 block mt-2 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Awarded {new Date(ub.awarded_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Points Transactions Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Contribution Ledger
          </h2>
          <p className="text-sm text-slate-500 mt-1">Chronological history of your community reputation</p>
        </div>

        {loading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">No reputation points recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-sm text-slate-600 bg-white">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Contribution Activity</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Points Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-blue-950">{t.reason}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {t.reference_type || 'BONUS'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600 whitespace-nowrap text-base">
                      +{t.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

