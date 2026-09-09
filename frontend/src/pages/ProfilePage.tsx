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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserBadge, PointTransaction } from '../types';

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
        return <Award className="w-5 h-5 text-indigo-500" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-blue-500" />;
      default:
        return <Medal className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <img
          src={
            user?.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.full_name || 'User'}`
          }
          alt={user?.full_name}
          className="w-24 h-24 rounded-full border-4 border-slate-100 shadow-md bg-slate-50 shrink-0"
        />

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900">{user?.full_name}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
              {user?.role}
            </span>
          </div>

          <p className="text-xs text-slate-500">{user?.email}</p>

          <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-slate-600 pt-2 flex-wrap">
            {user?.department && (
              <span>Department: <strong>{user.department}</strong></span>
            )}
            {user?.student_profile && (
              <>
                <span>&bull;</span>
                <span>Roll: <strong>{user.student_profile.roll_number}</strong></span>
                <span>&bull;</span>
                <span>Semester <strong>{user.student_profile.semester}</strong></span>
              </>
            )}
          </div>
        </div>

        {user?.student_profile && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center shrink-0">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
              Total Reputation
            </span>
            <span className="text-2xl font-black text-amber-700 flex items-center justify-center gap-1 mt-0.5">
              <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
              {user.student_profile.total_points}
            </span>
          </div>
        )}
      </div>

      {/* Earned Badges Showcase */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Unlocked Badges ({badges.length})</h2>
          <p className="text-xs text-slate-500">Awards earned for helpful contributions and accepted solutions</p>
        </div>

        {badges.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No badges unlocked yet. Answer questions in the community to earn your first badge!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {badges.map((ub) => (
              <div
                key={ub.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                  {getBadgeIcon(ub.badge?.icon)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{ub.badge?.name}</h4>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    {ub.badge?.description}
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Awarded {new Date(ub.awarded_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Points Transactions Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Points History & Ledger</h2>
          <p className="text-xs text-slate-500">Chronological statement of all earned reputation</p>
        </div>

        {transactions.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No points transactions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Activity / Reason</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{t.reason}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {t.reference_type || 'BONUS'}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-emerald-600 whitespace-nowrap">
                      +{t.points} pts
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
