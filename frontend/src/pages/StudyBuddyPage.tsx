import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Inbox, Settings, Activity, Clock, BookOpen, Target, Brain } from 'lucide-react';
import { api } from '../services/api';
import { StudyBuddyProfile, StudyBuddyDiscover, StudyBuddyConnection } from '../types';
import { Skeleton } from '../components/ui/Skeleton';

export const StudyBuddyPage = () => {
  const [activeTab, setActiveTab] = useState('discover');
  const [profile, setProfile] = useState<StudyBuddyProfile | null>(null);
  const [buddies, setBuddies] = useState<StudyBuddyDiscover[]>([]);
  const [connections, setConnections] = useState<StudyBuddyConnection[]>([]);
  const [requests, setRequests] = useState<{incoming: any[], outgoing: any[]}>({incoming: [], outgoing: []});
  const [loading, setLoading] = useState(true);

  // Profile form
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [goals, setGoals] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      try {
        const p = await api.studyBuddy.getProfile();
        setProfile(p);
        setSkills(p.skills || '');
        setInterests(p.interests || '');
        setGoals(p.goals || '');
      } catch (e: any) {
        if (e.response && e.response.status === 404) {
          // Needs profile creation
        }
      }
      
      const [disc, conns, reqs] = await Promise.all([
        api.studyBuddy.discover(),
        api.studyBuddy.getConnections(),
        api.studyBuddy.getRequests()
      ]);
      setBuddies(disc);
      setConnections(conns);
      setRequests(reqs);
    } catch (error) {
      console.error('Error loading study buddy data', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      if (profile) {
        await api.studyBuddy.updateProfile({ skills, interests, goals });
      } else {
        await api.studyBuddy.createProfile({ skills, interests, goals, is_active: true });
      }
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequest = async (receiverId: number) => {
    try {
      await api.studyBuddy.sendRequest(receiverId, "Hi! I'd love to connect as a study buddy.");
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAccept = async (reqId: number) => {
    try {
      await api.studyBuddy.acceptRequest(reqId);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (reqId: number) => {
    try {
      await api.studyBuddy.rejectRequest(reqId);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="flex space-x-4 mb-6 border-b pb-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 h-64 flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
              </div>
              <Skeleton className="h-10 w-full rounded-lg mt-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!profile && activeTab !== 'profile') {
    return (
      <div className="p-12 max-w-3xl mx-auto text-center space-y-6 bg-white rounded-2xl border border-slate-200 mt-8 shadow-sm">
        <BookOpen className="w-16 h-16 text-brand-500 mx-auto" />
        <h1 className="text-3xl font-bold text-navy-900">Academic Collaboration Network</h1>
        <p className="text-slate-600 max-w-lg mx-auto text-lg">Set up your academic profile to discover peers with complementary skills, join study groups, and achieve your learning goals together.</p>
        <button onClick={() => setActiveTab('profile')} className="px-8 py-3 bg-brand-600 hover:bg-brand-700 transition-colors text-white rounded-xl font-medium shadow-sm">Create Academic Profile</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Academic Collaboration Network</h1>
          <p className="text-sm text-slate-500 mt-1">Connect with peers for mutual learning and project collaboration</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        {[
          { id: 'discover', label: 'Discover Peers', icon: Users },
          { id: 'connections', label: 'My Network', icon: Activity },
          { id: 'requests', label: 'Requests', icon: Inbox },
          { id: 'profile', label: 'Academic Profile', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-5 py-3 border-b-2 transition-colors ${activeTab === tab.id ? 'border-brand-600 text-brand-600 font-semibold' : 'border-transparent text-slate-500 hover:text-navy-900'}`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.id === 'requests' && requests.incoming.length > 0 && (
                <span className="ml-2 bg-brand-100 text-brand-700 py-0.5 px-2 rounded-full text-xs font-bold">{requests.incoming.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Discover Tab */}
      {activeTab === 'discover' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buddies.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-navy-900 font-semibold">No peers found</h3>
              <p className="text-sm text-slate-500">Check back later for new potential study partners.</p>
            </div>
          ) : (
            buddies.map(b => (
              <div key={b.user_id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-lg overflow-hidden">
                    {b.avatar_url ? <img src={b.avatar_url} alt={b.name} className="w-full h-full object-cover" /> : b.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-900">{b.name}</h3>
                    <p className="text-sm text-slate-500">{b.department || 'Student'}</p>
                  </div>
                </div>
                <div className="flex-1 space-y-3 mb-6">
                  {b.skills && (
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase">Skills</span>
                      <p className="text-sm text-slate-800">{b.skills}</p>
                    </div>
                  )}
                  {b.interests && (
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase">Interests</span>
                      <p className="text-sm text-slate-800">{b.interests}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleRequest(b.user_id)}
                  className="w-full py-2 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-lg font-medium flex justify-center items-center space-x-2 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Connect</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Connections Tab */}
      {activeTab === 'connections' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">You don't have any connections yet. Start exploring!</div>
          ) : (
            connections.map(c => (
              <div key={c.connection_id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
                <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-xl overflow-hidden shadow-inner">
                  {c.user.avatar_url ? <img src={c.user.avatar_url} alt={c.user.name} className="w-full h-full object-cover" /> : c.user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-navy-900 text-lg">{c.user.name}</h3>
                  <p className="text-sm text-slate-500">{c.user.department || 'Student'}</p>
                  <span className="text-xs text-brand-500 mt-1 block">Connected</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium text-navy-900 mb-4">Incoming Requests</h3>
            {requests.incoming.length === 0 ? (
              <p className="text-slate-500 bg-slate-50 p-4 rounded-lg">No incoming requests.</p>
            ) : (
              <div className="space-y-4">
                {requests.incoming.map((req: any) => (
                  <div key={req.request.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold">
                        {req.user.avatar_url ? <img src={req.user.avatar_url} alt={req.user.name} className="w-full h-full object-cover rounded-full" /> : req.user.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-medium text-navy-900">{req.user.name}</h4>
                        <p className="text-sm text-slate-500">{req.request.message}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleAccept(req.request.id)} className="px-4 py-2 bg-brand-600 text-white rounded-md text-sm font-medium hover:bg-brand-700">Accept</button>
                      <button onClick={() => handleReject(req.request.id)} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md text-sm font-medium hover:bg-slate-300">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium text-navy-900 mb-4">Outgoing Requests</h3>
            {requests.outgoing.length === 0 ? (
              <p className="text-slate-500 bg-slate-50 p-4 rounded-lg">No outgoing requests.</p>
            ) : (
              <div className="space-y-4">
                {requests.outgoing.map((req: any) => (
                  <div key={req.request.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex justify-between items-center opacity-75">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">
                        {req.user.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-medium text-navy-900">To: {req.user.name}</h4>
                        <p className="text-sm text-slate-500 flex items-center"><Clock className="w-3 h-3 mr-1" /> Pending</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-navy-900 mb-6">Edit Your Academic Profile</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Your Skills (comma separated)</label>
              <input type="text" value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. Python, React, Data Structures" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Interests</label>
              <input type="text" value={interests} onChange={e => setInterests(e.target.value)} placeholder="e.g. Machine Learning, UI/UX, Startups" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Learning Goals</label>
              <textarea value={goals} onChange={e => setGoals(e.target.value)} placeholder="What are you looking to achieve?" rows={3} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"></textarea>
            </div>
            <button onClick={saveProfile} className="px-6 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-sm">
              Save Profile
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
