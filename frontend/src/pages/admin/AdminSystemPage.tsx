import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../../services/api';
import {
  Settings, AlertCircle, MessageSquare, Trophy, Bell, Shield,
  Check, ChevronsUpDown, Search, Save, X
} from 'lucide-react';

// --- Shared Types ---
type Setting = { key: string; value: string; value_type: string; category: string; description: string };

// --- Constants ---
const CATEGORIES = [
  { id: 'General', icon: Settings, label: 'General', desc: 'Platform and institution' },
  { id: 'Complaints', icon: AlertCircle, label: 'Complaints', desc: 'Complaint workflow' },
  { id: 'Community', icon: MessageSquare, label: 'Community', desc: 'Peer Forum settings' },
  { id: 'Gamification', icon: Trophy, label: 'Gamification', desc: 'Points and rewards' },
  { id: 'Notifications', icon: Bell, label: 'Notifications', desc: 'Notification behavior' },
  { id: 'Moderation', icon: Shield, label: 'Moderation', desc: 'Reports and moderation' }
];

const TIMEZONES = [
  "UTC", "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo", "Asia/Shanghai",
  "Asia/Seoul", "Asia/Dhaka", "Asia/Karachi", "Asia/Kabul", "Asia/Riyadh", "Asia/Tehran",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Rome", "Europe/Madrid",
  "Europe/Moscow", "Europe/Istanbul", "Europe/Amsterdam", "Europe/Zurich",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Toronto", "America/Vancouver", "America/Sao_Paulo", "America/Buenos_Aires",
  "America/Mexico_City", "America/Bogota", "America/Lima",
  "Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Perth",
  "Pacific/Auckland", "Pacific/Fiji", "Pacific/Honolulu",
  "Africa/Cairo", "Africa/Johannesburg", "Africa/Lagos", "Africa/Nairobi"
].sort();


const SUPPORTED_FILE_TYPES = [
  { ext: 'pdf', label: 'PDF', desc: 'Portable Document Format' },
  { ext: 'png', label: 'PNG', desc: 'Image' },
  { ext: 'jpg', label: 'JPG', desc: 'Image' },
  { ext: 'jpeg', label: 'JPEG', desc: 'Image' },
  { ext: 'webp', label: 'WEBP', desc: 'Image' },
  { ext: 'gif', label: 'GIF', desc: 'Image' },
  { ext: 'doc', label: 'DOC', desc: 'Word document' },
  { ext: 'docx', label: 'DOCX', desc: 'Word document' },
  { ext: 'xls', label: 'XLS', desc: 'Spreadsheet' },
  { ext: 'xlsx', label: 'XLSX', desc: 'Spreadsheet' },
  { ext: 'txt', label: 'TXT', desc: 'Text document' },
  { ext: 'csv', label: 'CSV', desc: 'Spreadsheet' },
  { ext: 'ppt', label: 'PPT', desc: 'Presentation' },
  { ext: 'pptx', label: 'PPTX', desc: 'Presentation' },
  { ext: 'mp4', label: 'MP4', desc: 'Video' }
];

const MultiSelect = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: typeof SUPPORTED_FILE_TYPES }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Parse current value
  let selected: string[] = [];
  try {
    if (value.startsWith('[')) selected = JSON.parse(value);
    else selected = value.split(',').filter(x => x.trim()).map(x => x.trim().toLowerCase());
  } catch(e) {
    selected = [];
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter(o =>
    o.ext.toLowerCase().includes(search.toLowerCase()) ||
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    o.desc.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (ext: string) => {
    let next;
    if (selected.includes(ext)) next = selected.filter(x => x !== ext);
    else next = [...selected, ext];
    onChange(JSON.stringify(next));
  };

  const displayText = selected.length === 0 ? "No types selected" :
                      selected.length <= 4 ? selected.map(x => x.toUpperCase()).join('  ') :
                      `${selected.length} file types selected`;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-white border border-slate-300 rounded-lg px-4 h-11 text-sm font-medium text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
      >
        <span className="truncate">{displayText}</span>
        <ChevronsUpDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-100 flex items-center">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="text"
              autoFocus
              className="w-full text-sm outline-none placeholder:text-slate-400"
              placeholder="Search file types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-500 text-center">No file types found.</li>
            ) : (
              filtered.map(opt => {
                const isSelected = selected.includes(opt.ext);
                return (
                  <li
                    key={opt.ext}
                    className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between hover:bg-slate-50 ${isSelected ? 'bg-indigo-50/50 text-indigo-700' : 'text-slate-700'}`}
                    onClick={() => toggleOption(opt.ext)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs text-slate-500">{opt.desc}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};


const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${checked ? 'bg-indigo-600' : 'bg-slate-200'}`}
  >
    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

const TimezoneSelect = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = TIMEZONES.filter(tz => tz.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-white border border-slate-300 rounded-lg px-4 h-11 text-sm font-medium text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
      >
        <span className="truncate">{value || "Select Timezone"}</span>
        <ChevronsUpDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-100 flex items-center">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="text"
              autoFocus
              className="w-full text-sm outline-none placeholder:text-slate-400"
              placeholder="Search timezones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-500 text-center">No timezones found.</li>
            ) : (
              filtered.map(tz => (
                <li
                  key={tz}
                  className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between hover:bg-slate-50 ${value === tz ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-700'}`}
                  onClick={() => { onChange(tz); setOpen(false); setSearch(""); }}
                >
                  {tz}
                  {value === tz && <Check className="w-4 h-4" />}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export const AdminSystemPage = () => {
  const [settings, setSettings] = useState<Record<string, Setting>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState<string>('General');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      const map: Record<string, Setting> = {};
      const draftMap: Record<string, string> = {};
      data.forEach((s: Setting) => {
        map[s.key] = s;
        draftMap[s.key] = s.value;
      });
      setSettings(map);
      setDraft(draftMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (key: string, val: string) => {
    setDraft(prev => ({ ...prev, [key]: val }));
    setSaveSuccess(false);
  };

  const isDirty = useMemo(() => {
    for (const key in draft) {
      if (draft[key] !== settings[key]?.value) return true;
    }
    return false;
  }, [draft, settings]);

  const handleSave = async () => {
    if (!isDirty) return;
    setSaving(true);
    setSaveSuccess(false);

    // Empty selection validation for allowed types
    if (draft['allowed_attachment_types']) {
      try {
        const parsed = JSON.parse(draft['allowed_attachment_types']);
        if (Array.isArray(parsed) && parsed.length === 0) {
          alert("Select at least one allowed file type.");
          setSaving(false);
          return;
        }
      } catch(e) {}
    }

    try {
      // Find all changed keys globally
      const updates = Object.keys(draft)
        .filter(k => draft[k] !== settings[k]?.value)
        .map(k => ({ key: k, value: draft[k] }));

      if (updates.length > 0) {
        await api.updateSettings(updates);
        // Sync local settings to match draft
        const newSettings = { ...settings };
        updates.forEach(u => {
          if (newSettings[u.key]) newSettings[u.key] = { ...newSettings[u.key], value: u.value };
        });
        setSettings(newSettings);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save settings. Please check your inputs.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const draftMap: Record<string, string> = {};
    Object.values(settings).forEach(s => {
      draftMap[s.key] = s.value;
    });
    setDraft(draftMap);
    setSaveSuccess(false);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Filter keys for the active category
  const activeKeys = Object.values(settings)
    .filter(s => s.category.toLowerCase() === activeCategory.toLowerCase())
    .map(s => s.key);

  const activeCategoryData = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 md:py-12 flex flex-col gap-8 h-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-slate-500 mt-2 text-base">Configure global application behavior and platform features.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 pb-24">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap md:whitespace-normal text-left ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div>
                    <div className={isActive ? 'font-bold' : 'font-semibold'}>{cat.label}</div>
                    <div className={`text-xs mt-0.5 hidden lg:block ${isActive ? 'text-indigo-500/80' : 'text-slate-400'}`}>{cat.desc}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Section Header */}
          <div className="px-8 py-6 border-b border-slate-100 bg-white">
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{activeCategoryData?.label}</h2>
            <p className="text-sm text-slate-500 mt-1">{activeCategoryData?.desc}</p>
          </div>

          {/* Settings Grid */}
          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
            {activeKeys.map(k => {
              const s = settings[k];
              const dVal = draft[k];

              // Determine UI component based on key or type
              let control;
              if (k === 'timezone') {
                control = <TimezoneSelect value={dVal} onChange={(v) => handleUpdate(k, v)} />;
              } else if (k === 'allowed_attachment_types') {
                control = <MultiSelect value={dVal || ''} onChange={(v) => handleUpdate(k, v)} options={SUPPORTED_FILE_TYPES} />;
              } else if (s.value_type === 'boolean') {
                control = (
                  <div className="flex items-center gap-3 h-11">
                    <Toggle checked={dVal === 'true'} onChange={(v) => handleUpdate(k, v ? 'true' : 'false')} />
                    <span className="text-sm font-semibold text-slate-700">{dVal === 'true' ? 'Enabled' : 'Disabled'}</span>
                  </div>
                );
              } else if (s.value_type === 'integer') {
                control = (
                  <input
                    type="number"
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 h-11 text-sm font-medium text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                    value={dVal}
                    onChange={(e) => handleUpdate(k, e.target.value)}
                  />
                );
              } else {
                control = (
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 h-11 text-sm font-medium text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                    value={dVal}
                    onChange={(e) => handleUpdate(k, e.target.value)}
                  />
                );
              }

              return (
                <div key={k} className="flex flex-col gap-2">
                  <div>
                    <label className="text-sm font-bold text-slate-800">{s.description || k}</label>
                  </div>
                  {control}
                </div>
              );
            })}

            {activeKeys.length === 0 && (
              <div className="col-span-2 text-center py-12 text-slate-400">
                No configurable settings found in this category.
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="mt-auto px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDirty && <span className="flex items-center gap-2 text-sm font-medium text-amber-600 animate-in fade-in"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Unsaved changes</span>}
              {!isDirty && saveSuccess && <span className="flex items-center gap-2 text-sm font-medium text-emerald-600 animate-in fade-in slide-in-from-bottom-2"><Check className="w-4 h-4" /> Changes saved</span>}
              {!isDirty && !saveSuccess && <span className="text-sm text-slate-500">Changes are saved globally.</span>}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                disabled={!isDirty || saving}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-xl transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:hover:bg-indigo-600"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Optional Context Panel for extreme widths */}
        <div className="hidden xl:block w-64 flex-shrink-0 space-y-6">
          <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Configuration</h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Environment</p>
                <p className="text-sm font-bold text-slate-800">Production</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Config Status</p>
                <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Total Keys</p>
                <p className="text-sm font-bold text-slate-800">{Object.keys(settings).length} settings</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
