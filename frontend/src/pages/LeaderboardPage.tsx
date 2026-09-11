import React, { useState, useEffect } from 'react';
import {
  Award,
  Flame,
  Medal,
  Star,
  ShieldCheck,
  CheckCircle2,
  HandHeart,
  Calendar,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';
import { LeaderboardResponse, Badge } from '../types';
import { Skeleton } from '../components/ui/Skeleton';

export const LeaderboardPage: React.FC = () => {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all-time'>('all-time');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const [leadData, badgeData] = await Promise.all([
          api.getLeaderboard(period),
          api.listBadges(),
        ]);
        setData(leadData);
        setBadges(badgeData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [period]);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return '1st Place';
      case 2:
        return '2nd Place';
      case 3:
        return '3rd Place';
      default:
        return `Rank ${rank}`;
    }
  };

  const getBadgeIcon = (iconName: string) => {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-blue-950 rounded-3xl p-8 sm:p-10 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/50 to-blue-950 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-blue-900/50 border border-blue-800 rounded-full text-xs font-semibold uppercase tracking-wider text-blue-200">
              Academic Recognition
            </span>
            <span className="text-sm font-medium text-blue-300">
              Community Contributions
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
            Campus Leaderboard
          </h1>
          <p className="text-base text-blue-200 max-w-xl leading-relaxed">
            Recognizing outstanding students and faculty who consistently support peers and foster a collaborative academic environment.
          </p>
        </div>

        {/* Period Selector */}
        <div className="relative z-10 flex items-center gap-1.5 bg-blue-900/50 p-1.5 rounded-2xl border border-blue-800 shrink-0 shadow-inner">
          {(['weekly', 'monthly', 'all-time'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-200 ${
                period === p ? 'bg-white text-blue-950 shadow-md scale-105' : 'text-blue-200 hover:text-white hover:bg-blue-800/50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Leaderboard Table & Badges Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Top Contributors ({period.replace('-', ' ')})
              </h2>
              <p className="text-sm text-slate-500 mt-1">Ranked by academic reputation and community impact</p>
            </div>
          </div>

          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : !data || data.leaders.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-16 text-center text-sm text-slate-500">
              No contributions recorded for this period yet.
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Scholar</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Achievements</th>
                    <th className="px-6 py-4 text-right">Reputation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.leaders.map((leader) => (
                    <tr key={leader.user_id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-5 font-bold text-slate-900 whitespace-nowrap">
                        <span
                          className={`px-3 py-1.5 rounded-lg text-xs tracking-wide ${
                            leader.rank === 1
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : leader.rank === 2
                              ? 'bg-slate-200 text-slate-800 border border-slate-300'
                              : leader.rank === 3
                              ? 'bg-orange-100 text-orange-800 border border-orange-200'
                              : 'text-slate-500 bg-slate-50 border border-slate-100'
                          }`}
                        >
                          {getRankBadge(leader.rank)}
                        </span>
                      </td>

                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <img
                            src={
                              leader.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.full_name}`
                            }
                            alt=""
                            className="w-10 h-10 rounded-full border border-slate-200 shadow-sm group-hover:border-blue-300 transition-colors"
                          />
                          <div>
                            <p className="font-bold text-blue-950 text-base">{leader.full_name}</p>
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                              {leader.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-slate-600 whitespace-nowrap font-medium">
                        {leader.department || 'University Wide'}
                      </td>

                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {leader.badges.map((b) => (
                            <span
                              key={b.id}
                              title={`${b.name}: ${b.description}`}
                              className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center cursor-help hover:scale-110 transition-transform"
                            >
                              {getBadgeIcon(b.icon)}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-right font-semibold text-blue-700 text-base whitespace-nowrap">
                        {leader.points} <span className="text-sm font-normal text-slate-500">pts</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Badges Showcase (1 col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-xl font-bold text-blue-950 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Community Badges
              </h3>
              <p className="text-sm text-slate-500 mt-1">Milestones of academic contribution</p>
            </div>

            <div className="space-y-4">
              {loading ? (
                [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
              ) : (
                badges.map((b) => (
                  <div key={b.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4 hover:bg-white hover:shadow-sm hover:border-slate-200 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                      {getBadgeIcon(b.icon)}
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-bold text-blue-950">{b.name}</h4>
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                          {b.points_threshold} pts
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{b.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Points Rules Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4">
            <h4 className="text-sm font-bold text-blue-950 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" /> Reputation Guide
            </h4>
            <ul className="text-sm text-slate-600 space-y-3">
              <li className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100">
                <span className="font-medium">Post helpful answer</span>
                <span className="font-bold text-blue-600">+5 pts</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100">
                <span className="font-medium">Receive peer upvote</span>
                <span className="font-bold text-blue-600">+10 pts</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100">
                <span className="font-medium">Accepted as solution</span>
                <span className="font-bold text-emerald-600">+20 pts</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

