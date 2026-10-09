import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Award,
  Flame,
  Calendar,
  Lock,
  ShieldCheck,
  CheckCircle2,
  HandHeart,
  Star,
  Medal,
  Clock,
  BookOpen,
  GraduationCap,
  Users, Link, Copy, RefreshCw,
  Building,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AdminProfileView from './admin/AdminProfileView';
import { UserBadge, PointTransaction, GamificationSummary } from '../types';
import { Skeleton } from '../components/ui/Skeleton';
import { animate, stagger } from 'animejs';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [allBadges, setAllBadges] = useState<any[]>([]);
    const [badges, setBadges] = useState<UserBadge[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [summary, setSummary] = useState<GamificationSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    skills: user?.student_profile?.skills || '',
    interests: user?.student_profile?.interests || '',
    help_areas: user?.student_profile?.help_areas || '',
    goals: user?.student_profile?.goals || '',
    department: user?.department || '',
    year: user?.student_profile?.year || '',
    division: user?.student_profile?.division || '',
    roll_number: user?.student_profile?.roll_number || '',
    program: user?.student_profile?.program || ''
  });
  const [sbActive, setSbActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.student_profile) {
      setFormData({
        skills: user.student_profile.skills || '',
        interests: user.student_profile.interests || '',
        help_areas: user.student_profile.help_areas || '',
        goals: user.student_profile.goals || '',
        department: user.department || '',
        year: user.student_profile.year || '',
        division: user.student_profile.division || '',
        roll_number: user.student_profile.roll_number || '',
        program: user.student_profile.program || ''
      });
    }
  }, [user]);

  useEffect(() => {
    api.studyBuddy.getProfile().then(p => setSbActive(p.is_active)).catch(() => setSbActive(false));
  }, []);

  useEffect(() => {
    if (!loading && summary) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        // Animate progress bar
        animate('.gamification-progress-bar', {

          width: [0, summary.progress_percentage + '%'],
          easing: 'easeOutExpo',
          duration: 1500,
          delay: 200
        })

        const el = document.getElementById('gamification-total-points');
        if (el) el.innerHTML = summary.points.toString();

        // Stagger list items
        animate('.ledger-row', {

          translateY: [20, 0],
          opacity: [0, 1],
          delay: stagger(100),
          easing: 'easeOutExpo',
          duration: 800
        })
      }
    }
  }, [loading, summary]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.updateMyProfile(formData);
      try {
        await api.studyBuddy.updateProfile({ is_active: sbActive });
      } catch (e) {
        await api.studyBuddy.createProfile({ is_active: sbActive });
      }
      setIsEditing(false);
      // optionally refresh user data from AuthContext
      if (refreshUser) { await refreshUser(); }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };












  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      try {
        const [allB, bData, tData, sumData] = await Promise.all([
          api.listBadges(),
          api.getMyBadges(),
          api.getMyTransactions(),
          api.getGamificationSummary()
        ]);
        setAllBadges(allB);
        setBadges(bData);
        setTransactions(tData);
        setSummary(sumData);
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

    if (user?.role === 'ADMIN') {
    return <AdminProfileView user={user} />;
  }

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


      {/* Academic & Peer Learning Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Academic & Peer Learning Profile
          </h2>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="px-4 py-1.5 text-sm font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(false)} className="px-4 py-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700">Cancel</button>
              <button onClick={handleSaveProfile} disabled={saving} className="px-4 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Skills</label>
            {isEditing ? (
              <input type="text" className="w-full border rounded-lg p-2 text-sm" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="e.g. React, Python, Data Structures" />
            ) : (
              <p className="text-sm text-slate-600">{formData.skills || 'Not specified'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Interests</label>
            {isEditing ? (
              <input type="text" className="w-full border rounded-lg p-2 text-sm" value={formData.interests} onChange={e => setFormData({...formData, interests: e.target.value})} placeholder="e.g. Machine Learning, Open Source" />
            ) : (
              <p className="text-sm text-slate-600">{formData.interests || 'Not specified'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Areas I need help with</label>
            {isEditing ? (
              <input type="text" className="w-full border rounded-lg p-2 text-sm" value={formData.help_areas} onChange={e => setFormData({...formData, help_areas: e.target.value})} placeholder="e.g. Advanced Calculus, System Design" />
            ) : (
              <p className="text-sm text-slate-600">{formData.help_areas || 'Not specified'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Learning Goals</label>
            {isEditing ? (
              <textarea className="w-full border rounded-lg p-2 text-sm" rows={3} value={formData.goals} onChange={e => setFormData({...formData, goals: e.target.value})} placeholder="What are you trying to achieve?" />
            ) : (
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{formData.goals || 'Not specified'}</p>
            )}
          </div>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">Appear in Study Buddy Discover</p>
              <p className="text-xs text-slate-500">Allow other students to find you and connect.</p>
            </div>
            {isEditing ? (
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={sbActive} onChange={e => setSbActive(e.target.checked)} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            ) : (
              <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${sbActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {sbActive ? 'Visible' : 'Hidden'}
              </span>
            )}
          </div>
        </div>
      </div>

              {/* Level Progression Widget */}
        {!loading && summary && (
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl border border-blue-800 p-6 sm:p-8 shadow-lg text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Award className="w-48 h-48" />
            </div>

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
                <div>
                  <h3 className="text-blue-200 font-bold tracking-widest uppercase text-xs mb-1">Current Standing</h3>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-black">Level {summary.level}</span>
                    <span className="text-xl sm:text-2xl text-blue-100 font-medium tracking-tight">· {summary.level_name}</span>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-3xl font-black text-amber-400">{summary.points} <span className="text-sm text-blue-200 font-medium">total points</span></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-blue-100">{summary.current_threshold} pts</span>
                  {summary.next_threshold ? (
                    <span className="text-blue-100">{summary.next_threshold} pts</span>
                  ) : (
                    <span className="text-amber-400">Max Level</span>
                  )}
                </div>
                <div className="h-4 w-full bg-blue-950/50 rounded-full overflow-hidden border border-blue-800/50 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: summary.progress_percentage + "%" }}
                  />
                </div>
                {summary.next_threshold && (
                  <p className="text-sm text-blue-200 font-medium text-center sm:text-right">
                    <span className="text-white font-bold">{summary.points_remaining} points</span> until Level {summary.level + 1}
                  </p>
                )}
              </div>
            </div>
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
