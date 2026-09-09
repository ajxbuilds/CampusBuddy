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
} from 'lucide-react';
import { api } from '../services/api';
import { LeaderboardResponse, Badge } from '../types';

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
        return '🥇 #1 Gold';
      case 2:
        return '🥈 #2 Silver';
      case 3:
        return '🥉 #3 Bronze';
      default:
        return `#${rank}`;
    }
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'HandHeart':
        return <HandHeart className="w-4 h-4 text-rose-500" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'Star':
        return <Star className="w-4 h-4 text-amber-500 fill-amber-500" />;
      case 'Award':
        return <Award className="w-4 h-4 text-indigo-500" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-4 h-4 text-blue-500" />;
      default:
        return <Medal className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider">
              Gamification & Reputation
            </span>
            <span className="text-xs text-amber-100">
              Solve peer queries & earn points
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Campus Contributor Leaderboard
          </h1>
          <p className="text-sm text-amber-100 max-w-xl mt-1 leading-relaxed">
            Recognizing the top students and faculty who solve peer issues, provide accepted answers, and uphold campus community guidelines.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-black/20 backdrop-blur p-1 rounded-2xl border border-white/20 shrink-0">
          {(['weekly', 'monthly', 'all-time'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${
                period === p ? 'bg-white text-amber-900 shadow-md' : 'text-white/80 hover:text-white'
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
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Top Helpers ({period.replace('-', ' ')})
            </h2>
            <span className="text-xs text-slate-400 font-medium">Ranked by reputation points</span>
          </div>

          {loading ? (
            <div className="p-16 text-center text-xs text-slate-400">Loading leaderboard...</div>
          ) : !data || data.leaders.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400">No transactions recorded for this period.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Rank</th>
                    <th className="px-6 py-3">Contributor</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Badges</th>
                    <th className="px-6 py-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.leaders.map((leader) => (
                    <tr key={leader.user_id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs ${
                            leader.rank === 1
                              ? 'bg-amber-100 text-amber-800'
                              : leader.rank === 2
                              ? 'bg-slate-200 text-slate-800'
                              : leader.rank === 3
                              ? 'bg-orange-100 text-orange-800'
                              : 'text-slate-500'
                          }`}
                        >
                          {getRankBadge(leader.rank)}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              leader.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.full_name}`
                            }
                            alt=""
                            className="w-8 h-8 rounded-full bg-slate-100"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{leader.full_name}</p>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                              {leader.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {leader.department || 'General'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {leader.badges.map((b) => (
                            <span
                              key={b.id}
                              title={`${b.name}: ${b.description}`}
                              className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center cursor-help border border-slate-200"
                            >
                              {getBadgeIcon(b.icon)}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right font-mono font-black text-amber-600 text-sm whitespace-nowrap">
                        {leader.points} pts
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
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Unlockable Badges</h3>
              <p className="text-xs text-slate-500">Achieve milestones to earn recognition</p>
            </div>

            <div className="space-y-3">
              {badges.map((b) => (
                <div key={b.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                    {getBadgeIcon(b.icon)}
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{b.name}</h4>
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                        {b.points_threshold} pts req
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Points Rules Box */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-200 rounded-3xl p-6 space-y-3">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Points Earning Rules
            </h4>
            <ul className="text-xs text-slate-700 space-y-2">
              <li className="flex items-center justify-between">
                <span>Post community answer:</span>
                <span className="font-bold text-indigo-600">+5 pts</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Upvoted by peer student:</span>
                <span className="font-bold text-indigo-600">+10 pts</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Accepted as verified solution:</span>
                <span className="font-bold text-emerald-600">+20 pts</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
