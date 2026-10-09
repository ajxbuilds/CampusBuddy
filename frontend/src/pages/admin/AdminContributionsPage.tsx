import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../services/api';

import {
  Trophy,
  Star,
  Users,
  CheckCircle,
  RefreshCw,
  Search,
  Filter,
  ArrowDownToLine,
  Activity,
  MessageSquare,
  Award,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Inbox
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface Stats {
  total_contributions: number;
  points_awarded: number;
  active_contributors: number;
  accepted_answers: number;
}

interface ChartPoint {
  date: string;
  count: number;
  points: number;
}

interface Breakdown {
  event_type: string;
  count: number;
  points: number;
}

interface TopContributor {
  user_id: number;
  user_name: string;
  points: number;
  contributions: number;
}

interface Transaction {
  id: number;
  user_id: number;
  user_name: string;
  event_type: string;
  reason: string;
  points: number;
  created_at: string;
}

const StatCard = ({ title, value, icon: Icon, subtitle, loading }: any) => (
  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm anim-card">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-indigo-50 rounded-lg">
        <Icon className="w-6 h-6 text-indigo-600" />
      </div>
    </div>
    {loading ? (
      <div className="animate-pulse space-y-2">
        <div className="h-8 bg-slate-200 rounded w-1/2"></div>
        <div className="h-4 bg-slate-100 rounded w-3/4"></div>
      </div>
    ) : (
      <>
        <h3 className="text-3xl font-bold text-slate-800">{value.toLocaleString()}</h3>
        <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </>
    )}
  </div>
);

const AdminContributionsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dateRange, setDateRange] = useState('30d');

  const [stats, setStats] = useState<Stats | null>(null);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [breakdown, setBreakdown] = useState<Breakdown[]>([]);
  const [top, setTop] = useState<TopContributor[]>([]);

  const [txs, setTxs] = useState<Transaction[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txSearch, setTxSearch] = useState('');

  const headerRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      let sd = null;
      if (dateRange !== 'all') {
        const d = new Date();
        if (dateRange === '7d') d.setDate(d.getDate() - 7);
        if (dateRange === '30d') d.setDate(d.getDate() - 30);
        if (dateRange === '90d') d.setDate(d.getDate() - 90);
        sd = d.toISOString();
      }

      const params = sd ? { start_date: sd } : {};

      const [s, c, b, t, tx] = await Promise.all([
        api.getAdminGamificationStats(params),
        api.getAdminGamificationChart(params),
        api.getAdminGamificationBreakdown(params),
        api.getAdminGamificationTopContributors(),
        api.getAdminGamificationTransactions({ page: txPage, limit: 15, event_type: txSearch || undefined })
      ]);

      setStats(s);
      setChart(c);
      setBreakdown(b);
      setTop(t);
      setTxs(tx);



    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, txPage, txSearch]);

  const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'];

  if (error) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-8 lg:px-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">Unable to load contribution activity</h2>
          <button onClick={fetchData} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 lg:px-8">
      {/* Header */}
      <div ref={headerRef} className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 anim-card ">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Contributions</h1>
          <p className="text-slate-500 mt-1">Monitor community participation, rewards and contribution activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border-slate-300 rounded-lg text-sm focus:ring-indigo-500 h-10 px-3 border bg-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button onClick={fetchData} className="flex items-center gap-2 px-4 h-10 border border-slate-300 rounded-lg hover:bg-slate-50 bg-white text-sm font-medium transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Contributions"
          value={stats?.total_contributions || 0}
          icon={Activity}
          subtitle="Verified contribution events"
          loading={loading}
        />
        <StatCard
          title="Points Awarded"
          value={stats?.points_awarded || 0}
          icon={Star}
          subtitle="Total gamification points"
          loading={loading}
        />
        <StatCard
          title="Active Contributors"
          value={stats?.active_contributors || 0}
          icon={Users}
          subtitle="Unique contributing users"
          loading={loading}
        />
        <StatCard
          title="Accepted Answers"
          value={stats?.accepted_answers || 0}
          icon={CheckCircle}
          subtitle="High-quality resolutions"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm anim-card ">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Contribution Activity</h3>
          {loading ? (
            <div className="h-72 bg-slate-50 rounded-lg animate-pulse"></div>
          ) : chart.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-lg">
              <Inbox className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-slate-500 font-medium">No contribution activity yet</p>
              <p className="text-sm text-slate-400 text-center max-w-sm mt-1">Contributions will appear here when students begin participating in the community.</p>
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#0f172a', fontWeight: 500 }}
                  />
                  <Area type="monotone" dataKey="count" name="Contributions" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm anim-card ">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Contribution Breakdown</h3>
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse"></div>)}
            </div>
          ) : breakdown.length === 0 ? (
             <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-lg">
                <p className="text-slate-500 font-medium">No contribution data available.</p>
             </div>
          ) : (
            <div className="space-y-4">
              {breakdown.map((b, i) => (
                <div key={b.event_type} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-slate-700">{b.event_type.replace(/_/g, ' ')}</span>
                    <span className="text-slate-900">{b.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(100, (b.count / stats!.total_contributions) * 100)}%`, backgroundColor: COLORS[i % COLORS.length] }}></div>
                  </div>
                  <p className="text-xs text-slate-400 text-right">{b.points} pts awarded</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Top Contributors */}
        <div className="bg-white rounded-xl border border-slate-200 p-0 shadow-sm overflow-hidden anim-card ">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Top Contributors</h3>
          </div>
          {loading ? (
             <div className="p-6 space-y-4">
                {[1,2,3,4].map(i => <div key={i} className="h-10 bg-slate-50 rounded animate-pulse"></div>)}
             </div>
          ) : top.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No contributors yet.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {top.map((t, i) => (
                <li key={t.user_id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-indigo-50 text-indigo-700'}`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{t.user_name}</p>
                      <p className="text-xs text-slate-500">{t.contributions} contributions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600">{t.points}</p>
                    <p className="text-xs text-slate-400">pts</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Transactions / Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-0 shadow-sm overflow-hidden anim-card ">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Recent Contribution Activity</h3>
            <div className="relative w-48">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter event..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                value={txSearch}
                onChange={e => setTxSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Contributor</th>
                  <th className="px-6 py-3">Event</th>
                  <th className="px-6 py-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                   [1,2,3,4,5].map(i => (
                     <tr key={i}>
                       <td className="px-6 py-4"><div className="w-24 h-4 bg-slate-100 rounded animate-pulse"></div></td>
                       <td className="px-6 py-4"><div className="w-32 h-4 bg-slate-100 rounded animate-pulse"></div></td>
                       <td className="px-6 py-4"><div className="w-40 h-4 bg-slate-100 rounded animate-pulse"></div></td>
                       <td className="px-6 py-4"><div className="w-8 h-4 bg-slate-100 rounded animate-pulse ml-auto"></div></td>
                     </tr>
                   ))
                ) : txs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No point transactions yet.</td>
                  </tr>
                ) : (
                  txs.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 text-slate-500">{new Date(tx.created_at).toLocaleString()}</td>
                      <td className="px-6 py-3 font-medium text-slate-700">{tx.user_name}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {tx.event_type}
                        </span>
                      </td>
                      <td className={`px-6 py-3 text-right font-bold ${tx.points > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.points > 0 ? '+' : ''}{tx.points}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm text-slate-500">Page {txPage}</span>
            <div className="flex gap-2">
              <button
                disabled={txPage === 1}
                onClick={() => setTxPage(p => p - 1)}
                className="p-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTxPage(p => p + 1)}
                disabled={txs.length < 15}
                className="p-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContributionsPage;
