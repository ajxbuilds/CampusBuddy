import React, { useState, useEffect } from 'react';
import { Settings, User as UserIcon, Bell, Shield, Palette, Save, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';


export const SettingsPage = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const addToast = (text: string, type: 'success'|'error') => { setMessage({type, text}); setTimeout(() => setMessage(null), 3000); };

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<any>(null);
  const [draft, setDraft] = useState<any>(null);
  const [profileDraft, setProfileDraft] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, profileRes] = await Promise.all([
        api.getUserSettings(),
        api.getMe()
      ]);
      setSettings(settingsRes);
      setDraft(settingsRes);

      const sp = profileRes.student_profile || ({} as any);
      setProfileDraft({
        full_name: profileRes.full_name,
        department: profileRes.department || '',
        phone: profileRes.phone || '',
        semester: sp.semester || 1,
        program: sp.program || '',
        skills: sp.skills || '',
        interests: sp.interests || '',
        goals: sp.goals || ''
      });
    } catch (e) {
      console.error(e);
      addToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    if (!settings || !draft) return false;
    for (const key in draft) {
      if (draft[key] !== settings[key]) return true;
    }
    return false;
  };

  const handleSaveSettings = async () => {
    if (!hasChanges()) return;
    try {
      setSaving(true);
      const updated = await api.updateUserSettings(draft);
      setSettings(updated);
      setDraft(updated);
      addToast('Settings saved successfully', 'success');

      // Apply theme if changed
      if (draft.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (draft.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
           document.documentElement.classList.add('dark');
        } else {
           document.documentElement.classList.remove('dark');
        }
      }
    } catch (e) {
      addToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await api.updateMyProfile(profileDraft);
      addToast('Profile updated successfully', 'success');
    } catch (e) {
      addToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <RefreshCw className="w-8 h-8 text-slate-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {message && (
        <div className={`mb-4 p-4 rounded-xl text-sm font-medium border ${message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}`}>
          {message.text}
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-2">Manage your account, privacy, notifications and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0">
            {[
              { id: 'profile', icon: UserIcon, label: 'Account & Profile' },
              { id: 'security', icon: ShieldCheck, label: 'Security' },
              { id: 'notifications', icon: Bell, label: 'Notifications' },
              { id: 'privacy', icon: Shield, label: 'Privacy & Visibility' },
              { id: 'appearance', icon: Palette, label: 'Appearance' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-3xl">

          {/* Profile Section */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Academic Profile</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                    <input type="text" value={user?.email || ''} disabled className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                    <input type="text" value={user?.role || ''} disabled className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={profileDraft?.department || ''}
                      onChange={e => setProfileDraft({...profileDraft, department: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl bg-white border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Program</label>
                    <input
                      type="text"
                      value={profileDraft?.program || ''}
                      onChange={e => setProfileDraft({...profileDraft, program: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl bg-white border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Skills</label>
                    <input
                      type="text"
                      value={profileDraft?.skills || ''}
                      onChange={e => setProfileDraft({...profileDraft, skills: e.target.value})}
                      placeholder="e.g. React, Python, UI Design"
                      className="w-full px-4 py-2 rounded-xl bg-white border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2">
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Profile
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Authentication</h2>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50">
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Sign-in Method</p>
                    <p className="text-sm text-slate-600">Your account is using <strong>{user?.auth_provider === 'google' ? 'Google OAuth' : 'Password Authentication'}</strong>.</p>
                  </div>
                </div>

                {user?.auth_provider === 'google' && (
                  <p className="text-sm text-slate-500 mt-4">
                    Since you signed in with Google, password changes and 2FA are managed through your Google Account settings.
                  </p>
                )}

                {user?.auth_provider === 'local' && (
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors">
                      Change Password
                    </button>
                    <p className="text-xs text-slate-500 mt-2">Password reset workflow is currently disabled in this environment.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Notification Preferences</h2>
                <p className="text-sm text-slate-500 mb-6">Choose what updates you want to receive.</p>

                <div className="space-y-4">
                  {[
                    { key: 'notify_complaints', label: 'Complaint Updates', desc: 'Status changes and assignment updates on your complaints' },
                    { key: 'notify_community', label: 'Community Activity', desc: 'Replies to your posts and @mentions' },
                    { key: 'notify_study_buddy', label: 'Study Buddy', desc: 'New connection requests and study group invites' },
                    { key: 'notify_announcements', label: 'Announcements', desc: 'Important platform updates and alerts' }
                  ].map(item => (
                    <div key={item.key} className="flex items-start justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={draft[item.key]}
                          onChange={e => setDraft({...draft, [item.key]: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                {hasChanges() && (
                  <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button onClick={() => setDraft(settings)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm transition-all">Cancel</button>
                    <button onClick={handleSaveSettings} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2">
                      {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Preferences
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Privacy Section */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Privacy & Visibility</h2>

                <div className="space-y-4">
                  <div className="flex items-start justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Profile Visibility</p>
                      <p className="text-xs text-slate-500">Allow other students to view your academic profile in Study Buddy.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={draft.profile_visibility}
                        onChange={e => setDraft({...draft, profile_visibility: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-start justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Leaderboard Participation</p>
                      <p className="text-xs text-slate-500">Show your name and points on the Gamification leaderboard.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={draft.leaderboard_visible}
                        onChange={e => setDraft({...draft, leaderboard_visible: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {hasChanges() && (
                  <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button onClick={() => setDraft(settings)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm transition-all">Cancel</button>
                    <button onClick={handleSaveSettings} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2">
                      <Save className="w-4 h-4" /> Save Preferences
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Appearance & Accessibility</h2>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Theme Preference</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['light', 'dark', 'system'].map(theme => (
                      <button
                        key={theme}
                        onClick={() => setDraft({...draft, theme})}
                        className={`p-3 rounded-xl border text-sm font-medium capitalize transition-all ${
                          draft.theme === theme ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-start justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Reduced Motion</p>
                    <p className="text-xs text-slate-500">Minimize or disable transitions and UI animations.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={draft.reduced_motion}
                      onChange={e => setDraft({...draft, reduced_motion: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {hasChanges() && (
                  <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button onClick={() => setDraft(settings)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm transition-all">Cancel</button>
                    <button onClick={handleSaveSettings} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2">
                      <Save className="w-4 h-4" /> Save Preferences
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
