import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Language, ActivityLog } from '../types';
import { AuthService } from '../services/taskService';
import { translations } from '../translations';
import { 
  User as UserIcon, 
  Mail, 
  Save, 
  Shield, 
  BadgeCheck, 
  Camera, 
  Lock, 
  Settings, 
  ShieldCheck, 
  LogOut, 
  Key, 
  CheckCircle2, 
  AlertCircle,
  Palette,
  Globe,
  Loader2,
  Fingerprint,
  Zap,
  Activity,
  Cpu,
  Check,
  ChevronRight,
  Monitor,
  Moon,
  Sun,
  History,
  Clock,
  CircleDot,
  ChevronDown,
  Languages,
  Sparkles,
  Command,
  ShieldAlert,
  Info,
  Circle,
  Layout,
  Terminal,
  Server,
  Cloud,
  Layers,
  Maximize2,
  Minimize2,
  Volume2,
  RotateCcw,
  Building2,
  CalendarDays,
  Calendar,
  Flag,
  Asterisk,
  Search,
  ChevronLeft,
  Settings2,
  MonitorSmartphone,
  Eye,
  AlertTriangle,
  X,
  ArrowRight,
  ShieldX,
  Ban,
  Trash2
} from 'lucide-react';

interface ProfileViewProps {
  user: User;
  language: Language;
  onUpdate: (user: User) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
}

const COUNTRY_OPTIONS = [
  "Thailand", "Japan", "United States", "United Kingdom", "Germany", 
  "France", "Singapore", "Australia", "Canada", "India", 
  "South Korea", "China", "Vietnam", "Indonesia", "Netherlands",
  "Sweden", "Israel", "Ireland", "Brazil", "UAE", "Switzerland", "Norway", "Denmark"
].sort();

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ProfileView: React.FC<ProfileViewProps> = ({ 
  user, 
  language, 
  onUpdate,
  theme,
  onToggleTheme,
  onLanguageChange,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'preferences' | 'activity'>('account');
  const [pendingTab, setPendingTab] = useState<'account' | 'security' | 'preferences' | 'activity' | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  
  // Personal Info Fields
  const [email, setEmail] = useState(user.email || '');
  const [recoveryEmail, setRecoveryEmail] = useState(user.recoveryEmail || '');
  const [company, setCompany] = useState(user.company || '');
  const [country, setCountry] = useState(user.country || '');
  const [countrySearch, setCountrySearch] = useState('');
  
  // Unified DOB State
  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth || '');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isSyncingLang, setIsSyncingLang] = useState<string | null>(null);
  
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const t = translations[language].profile;

  const isAdmin = useMemo(() => user.role === 'Admin' || user.role === 'Project Leader' || user.role === 'Team Lead', [user.role]);

  const languages: { code: Language; name: string; local: string; desc: string }[] = [
    { code: 'EN', name: 'English', local: 'United States', desc: 'Universal Protocol' },
    { code: 'JA', name: '日本語', local: '日本', desc: '東アジア言語基盤' },
    { code: 'TH', name: 'ไทย', local: 'ประเทศไทย', desc: 'ระบบภาษาไทยหลัก' }
  ];

  const currentLangIndex = useMemo(() => languages.findIndex(l => l.code === language), [language]);

  const passwordStrength = useMemo(() => {
    const val = newPass;
    if (!val) return { score: 0, label: 'Waiting...', color: 'bg-slate-200 dark:bg-slate-800' };
    let score = 0;
    if (val.length >= 8) score += 1;
    if (/[0-9]/.test(val)) score += 1;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score += 1;
    if (/[^A-Za-z0-9]/.test(val)) score += 1;
    switch (score) {
      case 1: return { score, label: 'Weak', color: 'bg-rose-500' };
      case 2: return { score, label: 'Fair', color: 'bg-amber-500' };
      case 3: return { score, label: 'Good', color: 'bg-indigo-500' };
      case 4: return { score, label: 'Strong', color: 'bg-emerald-500' };
      default: return { score, label: 'Very Weak', color: 'bg-rose-600' };
    }
  }, [newPass]);

  const filteredCountries = useMemo(() => {
    return COUNTRY_OPTIONS.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()));
  }, [countrySearch]);

  const validateEmailFormat = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isEmailValid = useMemo(() => {
    if (!email.trim()) return false; 
    return validateEmailFormat(email);
  }, [email]);

  const isRecoveryEmailValid = useMemo(() => {
    if (!recoveryEmail.trim()) return true; 
    return validateEmailFormat(recoveryEmail);
  }, [recoveryEmail]);

  useEffect(() => {
    setName(user.name);
    setUsername(user.username);
    setEmail(user.email || '');
    setRecoveryEmail(user.recoveryEmail || '');
    setCompany(user.company || '');
    setCountry(user.country || '');
    setDateOfBirth(user.dateOfBirth || '');
    setActivities(AuthService.getActivities(user.id));
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasChanges = useMemo(() => {
    return name.trim() !== user.name.trim() || 
           username.trim() !== user.username.trim() ||
           email.trim() !== (user.email || '').trim() ||
           recoveryEmail.trim() !== (user.recoveryEmail || '').trim() ||
           company.trim() !== (user.company || '').trim() ||
           dateOfBirth !== (user.dateOfBirth || '') ||
           country.trim() !== (user.country || '').trim();
  }, [name, username, email, recoveryEmail, company, dateOfBirth, country, user]);

  const isSecurityDirty = useMemo(() => {
    return currentPass.trim() !== '' || newPass.trim() !== '' || confirmPass.trim() !== '';
  }, [currentPass, newPass, confirmPass]);

  const canSave = useMemo(() => {
    return hasChanges && isEmailValid && isRecoveryEmailValid;
  }, [hasChanges, isEmailValid, isRecoveryEmailValid]);

  const isSecurityFormReady = useMemo(() => {
    return (
      currentPass.trim().length > 0 &&
      newPass.trim().length > 0 &&
      confirmPass.trim().length > 0 &&
      newPass === confirmPass
    );
  }, [currentPass, newPass, confirmPass]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleLanguageUpdate = (lang: Language) => {
    if (lang === language) return;
    setIsSyncingLang(lang);
    setTimeout(() => {
      onLanguageChange(lang);
      setIsSyncingLang(null);
    }, 600);
  };

  const handleSaveProfile = (callback?: () => void) => {
    if (!canSave) return;
    setLoading(true);
    setTimeout(() => {
      try {
        const updated = AuthService.updateProfile(user.id, { 
          name, 
          username, 
          email, 
          recoveryEmail, 
          company, 
          dateOfBirth, 
          country 
        });
        onUpdate(updated);
        setActivities(AuthService.getActivities(user.id));
        showFeedback('success', t.updated);
        if (callback) callback();
      } catch (err: any) {
        showFeedback('error', err.message);
      } finally {
        setLoading(false);
      }
    }, 600);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setTimeout(() => {
        try {
          const updated = AuthService.updateProfile(user.id, { avatar: base64String });
          onUpdate(updated);
          setActivities(AuthService.getActivities(user.id));
          showFeedback('success', 'Identity avatar updated successfully');
        } catch (err: any) {
          showFeedback('error', 'Failed to save avatar.');
        } finally {
          setIsUploading(false);
        }
      }, 1000);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    try {
      const uniqueAvatar = await AuthService.generateAvatar(user.name);
      const updated = AuthService.updateProfile(user.id, { avatar: uniqueAvatar });
      onUpdate(updated);
      setActivities(AuthService.getActivities(user.id));
      showFeedback('success', 'Unique identity avatar regenerated');
    } catch (err: any) {
      showFeedback('error', 'Failed to regenerate unique avatar.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasswordChange = (callback?: () => void) => {
    if (!isSecurityFormReady) return;
    setLoading(true);
    setTimeout(() => {
      try {
        AuthService.changePassword(user.id, currentPass, newPass);
        setActivities(AuthService.getActivities(user.id));
        showFeedback('success', t.security.pass_updated);
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
        if (callback) callback();
      } catch (err: any) {
        showFeedback('error', err.message);
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  const attemptTabSwitch = (id: any) => {
    if (activeTab === id) return;
    const hasAccountChanges = activeTab === 'account' && hasChanges;
    const hasSecurityChanges = activeTab === 'security' && isSecurityDirty;
    if (hasAccountChanges || hasSecurityChanges) {
      setPendingTab(id);
      setShowUnsavedModal(true);
    } else {
      setActiveTab(id);
    }
  };

  const handleResolveUnsaved = (action: 'save' | 'discard') => {
    if (!pendingTab) return;
    if (action === 'discard') {
      if (activeTab === 'account') {
        setName(user.name);
        setUsername(user.username);
        setEmail(user.email || '');
        setRecoveryEmail(user.recoveryEmail || '');
        setCompany(user.company || '');
        setCountry(user.country || '');
        setDateOfBirth(user.dateOfBirth || '');
      } else if (activeTab === 'security') {
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      }
      setActiveTab(pendingTab);
      setShowUnsavedModal(false);
      setPendingTab(null);
    } else if (action === 'save') {
      if (activeTab === 'account') {
        if (!canSave) {
          showFeedback('error', 'Correct validation errors before saving.');
          setShowUnsavedModal(false);
          return;
        }
        handleSaveProfile(() => {
          setActiveTab(pendingTab);
          setShowUnsavedModal(false);
          setPendingTab(null);
        });
      } else if (activeTab === 'security') {
        if (!isSecurityFormReady) {
          showFeedback('error', 'Provide all cryptographic keys correctly before saving.');
          setShowUnsavedModal(false);
          return;
        }
        handlePasswordChange(() => {
          setActiveTab(pendingTab);
          setShowUnsavedModal(false);
          setPendingTab(null);
        });
      }
    }
  };

  const getActivityIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'profile': return <UserIcon size={16} className="text-indigo-500" />;
      case 'security': return <Lock size={16} className="text-rose-500" />;
      case 'session': return <Fingerprint size={16} className="text-emerald-500" />;
      default: return <CircleDot size={16} className="text-slate-400" />;
    }
  };

  const GlassCalendar: React.FC<{ 
    currentValue: string, 
    onSelect: (date: string) => void,
    onClose: () => void 
  }> = ({ currentValue, onSelect, onClose }) => {
    const initialDate = currentValue ? new Date(currentValue) : new Date(2000, 0, 1);
    const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
    const [viewYear, setViewYear] = useState(initialDate.getFullYear());
    const [isYearPicking, setIsYearPicking] = useState(false);
    const [isMonthPicking, setIsMonthPicking] = useState(false);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const selectedDay = currentValue ? new Date(currentValue).getDate() : null;
    const isSelectedMonth = currentValue && new Date(currentValue).getMonth() === viewMonth && new Date(currentValue).getFullYear() === viewYear;
    const handleDateClick = (day: number) => {
      const monthStr = (viewMonth + 1).toString().padStart(2, '0');
      const dayStr = day.toString().padStart(2, '0');
      onSelect(`${viewYear}-${monthStr}-${dayStr}`);
      onClose();
    };
    const changeMonth = (offset: number) => {
      let newMonth = viewMonth + offset;
      let newYear = viewYear;
      if (newMonth < 0) { newMonth = 11; newYear--; }
      else if (newMonth > 11) { newMonth = 0; newYear++; }
      setViewMonth(newMonth);
      setViewYear(newYear);
    };
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= 1940; i--) years.push(i);
    return (
      <div className="absolute bottom-full left-0 mb-3 w-[360px] md:w-[400px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.6)] z-[200] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 isolate">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-[40px] -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-[40px] -ml-16 -mb-16 pointer-events-none" />
        <div className="p-6 md:p-8 space-y-6 relative z-10">
          <div className="flex flex-col space-y-1">
             <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setIsYearPicking(!isYearPicking); setIsMonthPicking(false); }} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.1em] transition-all ${isYearPicking ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20'}`}>
                    {viewYear} <ChevronDown size={12} className={isYearPicking ? 'rotate-180' : ''} />
                  </button>
                  <button type="button" onClick={() => { setIsMonthPicking(!isMonthPicking); setIsYearPicking(false); }} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.1em] transition-all ${isMonthPicking ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20'}`}>
                    {MONTHS[viewMonth].slice(0, 3)} <ChevronDown size={12} className={isMonthPicking ? 'rotate-180' : ''} />
                  </button>
                </div>
                <div className="flex gap-2">
                   <button type="button" onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400"><ChevronLeft size={16} /></button>
                   <button type="button" onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400"><ChevronRight size={16} /></button>
                </div>
             </div>
             <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setIsMonthPicking(!isMonthPicking)}>
               {MONTHS[viewMonth]} <span className="text-indigo-600 italic font-orbitron">{isSelectedMonth ? selectedDay : ''}</span>
             </h3>
          </div>
          {isYearPicking ? (
            <div className="grid grid-cols-4 gap-2 h-[260px] md:h-[300px] overflow-y-auto scrollbar-hide pr-1">
               {years.map(y => (
                 <button key={y} onClick={() => { setViewYear(y); setIsYearPicking(false); }} className={`py-3.5 text-[12px] font-black rounded-xl transition-all ${viewYear === y ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}>
                   {y}
                 </button>
               ))}
            </div>
          ) : isMonthPicking ? (
            <div className="grid grid-cols-3 gap-2 h-[260px] md:h-[300px] overflow-y-auto scrollbar-hide pr-1">
               {MONTHS.map((m, idx) => (
                 <button key={m} onClick={() => { setViewMonth(idx); setIsMonthPicking(false); }} className={`py-6 text-[12px] font-black rounded-xl transition-all uppercase tracking-widest ${viewMonth === idx ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}>
                   {m.slice(0, 3)}
                 </button>
               ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-1.5">
                 {WEEK_DAYS.map(d => (
                   <span key={d} className="text-[10px] font-black text-slate-400 uppercase text-center tracking-[0.2em]">{d}</span>
                 ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                 {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                 {Array.from({ length: daysInMonth }).map((_, i) => {
                   const day = i + 1;
                   const active = isSelectedMonth && selectedDay === day;
                   return (
                     <button key={day} onClick={() => handleDateClick(day)} className={`aspect-square flex items-center justify-center text-[14px] font-black rounded-xl transition-all relative overflow-hidden group/day ${active ? 'bg-indigo-600 text-white shadow-[0_8px_20px_-4px_rgba(79,70,229,0.5)] scale-110 z-10' : 'text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white'}`}>{day}{active && <div className="absolute inset-0 bg-white/10 group-hover/day:opacity-20 opacity-0 transition-opacity" />}</button>
                   );
                 })}
              </div>
            </div>
          )}
          <button onClick={onClose} className="w-full py-4 bg-slate-950 dark:bg-slate-800 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-rose-600 transition-all transform active:scale-[0.98]">Close</button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full relative min-h-full bg-slate-50 dark:bg-transparent">
      <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />

      {showUnsavedModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-transparent backdrop-blur-md animate-in fade-in duration-500">
           <div className="w-full max-w-md bg-white dark:bg-[#0b1221] rounded-[4rem] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.8)] border border-slate-200 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-500 group/modal my-auto">
              <div className="relative px-8 py-10 bg-gradient-to-br from-rose-500/[0.03] to-rose-600/[0.08] overflow-hidden border-b border-rose-500/10 dark:border-rose-500/5">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none group-hover/modal:scale-125 transition-transform duration-1000" />
                 <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="relative">
                       <div className="absolute inset-0 bg-rose-500/20 rounded-[2.5rem] blur-2xl animate-pulse" />
                       <div className="p-8 bg-white/90 dark:bg-slate-950/90 backdrop-blur-3xl rounded-[2.5rem] border border-rose-500/20 shadow-[0_20px_40px_-12px_rgba(244,63,94,0.3)] relative">
                          <ShieldX size={48} strokeWidth={1.5} className="text-rose-500" />
                       </div>
                    </div>
                    <div className="text-center space-y-2">
                       <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none">Intercept <span className="text-rose-500">Protocol</span></h2>
                       <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em]">Metadata Conflict Detected</p>
                    </div>
                 </div>
              </div>
              <div className="p-8 space-y-8 bg-white/50 dark:bg-transparent">
                 <p className="text-center text-slate-500 dark:text-slate-400 font-bold text-sm leading-relaxed px-4">Uncommitted constants detected. Redirecting will trigger a protocol purge.</p>
                 <div className="flex flex-col gap-3">
                    <button onClick={() => handleResolveUnsaved('save')} className="w-full py-5 bg-indigo-600 text-white font-black text-[13px] uppercase tracking-[0.5em] rounded-[1.75rem] shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-5 active:scale-98 group/save"><Save size={18} strokeWidth={2.5} />Save & Commit</button>
                    <button onClick={() => handleResolveUnsaved('discard')} className="w-full py-5 bg-transparent hover:bg-rose-600 text-rose-600 hover:text-white font-black text-[13px] uppercase tracking-[0.5em] rounded-[1.75rem] border-2 border-rose-500/20 hover:border-rose-600 transition-all flex items-center justify-center gap-5 active:scale-98 group/discard"><X size={18} strokeWidth={2.5} />Discard & Purge</button>
                    <button onClick={() => { setShowUnsavedModal(false); setPendingTab(null); }} className="w-full py-4 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-black text-[10px] uppercase tracking-[0.4em] rounded-[1.5rem] hover:bg-slate-100 dark:hover:bg-white/10 transition-all">Abort</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="sticky top-0 z-[60] w-full bg-slate-950 overflow-hidden border-b border-white/5 shadow-2xl">
        <div className="absolute inset-0 overflow-hidden"><div className="absolute top-0 left-0 w-full h-full bg-indigo-600 opacity-10 blur-[120px]" /></div>
        <div className="relative z-10 p-6 lg:p-10 max-w-[1920px] mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 lg:gap-10">
               <div className="relative group shrink-0 animate-in zoom-in-95 duration-1000 ease-out">
                  <div className="relative cursor-pointer overflow-hidden rounded-[2.5rem] bg-slate-900 border-[6px] border-slate-950 shadow-2xl transition-all duration-700 hover:border-indigo-500/40" onClick={() => !isUploading && fileInputRef.current?.click()}>
                    <img src={user.avatar} className={`w-24 h-24 lg:w-32 lg:h-32 object-cover transition-all duration-700 ${isUploading ? 'opacity-30 blur-sm' : ''}`} alt={user.name} />
                    {isUploading && <div className="absolute inset-0 z-20 flex items-center justify-center"><Loader2 size={36} className="text-white animate-spin" /></div>}
                    <div className="absolute inset-0 bg-indigo-900 bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center"><Camera size={28} className="text-white transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-500" /></div>
                  </div>
                  {/* Remove Identity Avatar Toggle */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRemoveAvatar(); }}
                    className="absolute -top-2 -right-2 p-2.5 bg-rose-600 text-white rounded-xl shadow-xl border-2 border-slate-950 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 z-30"
                    title="Remove Identity Photo"
                  >
                    <Trash2 size={16} strokeWidth={2.5} />
                  </button>
               </div>
               <div className="text-center sm:text-left space-y-2 lg:space-y-4 animate-in slide-in-from-left-12 duration-1000 ease-out">
                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3">
                    <div className="px-3.5 py-1 bg-slate-800 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] border border-white/5 flex items-center gap-2"><Shield size={10} />MEMBER IDENTITY</div>
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] font-mono">{user.id}</span>
                  </div>
                  <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-white">{user.name}<span className="text-indigo-500">.</span></h1>
               </div>
            </div>
            <div className="hidden xl:flex items-center gap-6 animate-in slide-in-from-right-12 duration-1000">
               {[
                 { label: 'Latency Pulse', value: '24ms', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                 { label: 'Node Authority', value: 'Level 5', icon: ShieldCheck, color: 'text-sky-400', bg: 'bg-sky-400/10' },
               ].map((mod, idx) => (
                 <div key={idx} className="px-6 py-4 lg:px-7 lg:py-5 bg-slate-900 rounded-[2rem] border border-white/5 flex items-center gap-5">
                    <div className={`p-3 rounded-2xl ${mod.bg} ${mod.color}`}><mod.icon size={20} strokeWidth={2.5} /></div>
                    <div className="flex flex-col"><span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">{mod.label}</span><span className="text-lg lg:text-xl font-black text-white leading-none">{mod.value}</span></div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-6 lg:px-10 py-10 lg:py-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-3 lg:sticky lg:top-[200px]">
             <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xl animate-in slide-in-from-left-8 duration-1000">
                <div className="space-y-2">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-6 pl-4">System Context</h3>
                   {[
                     { id: 'account', icon: UserIcon, label: t.tabs.account, desc: 'Identity Profile' },
                     { id: 'security', icon: Lock, label: t.tabs.security, desc: 'Encryption Core' },
                     { id: 'preferences', icon: Settings, label: t.tabs.preferences, desc: 'Visual Interface' },
                     { id: 'activity', icon: History, label: 'Activity', desc: 'Event Logging' },
                   ].map((tab) => (
                     <button key={tab.id} onClick={() => attemptTabSwitch(tab.id as any)} className={`w-full flex items-center gap-5 px-6 py-5 rounded-[2.2rem] transition-all duration-500 relative group overflow-hidden ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                       <tab.icon size={20} className="relative z-10" />
                       <div className="relative z-10 flex flex-col items-start text-left">
                          <span className="text-[13px] font-black uppercase tracking-widest">{tab.label}</span>
                          <span className={`text-[8px] font-bold uppercase tracking-[0.3em] ${activeTab === tab.id ? 'text-indigo-200' : 'text-slate-400'}`}>{tab.desc}</span>
                       </div>
                     </button>
                   ))}
                </div>
             </div>
          </div>

          <div className="lg:col-span-9 space-y-10">
            {feedback && (
              <div className={`flex items-center gap-6 px-10 py-7 rounded-[3rem] border animate-in zoom-in-95 slide-in-from-top-8 duration-700 shadow-2xl ${feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                <div className={`p-3 rounded-2xl ${feedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{feedback.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}</div>
                <div className="flex flex-col"><span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60">Operational Feedback</span><span className="text-lg font-black tracking-tight">{feedback.message}</span></div>
              </div>
            )}

            <div className="relative">
              {activeTab === 'account' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-in fade-in slide-in-from-right-12 duration-1000 ease-out">
                   <div className="xl:col-span-12 bg-white dark:bg-slate-900 rounded-[4rem] p-10 lg:p-16 border border-slate-200 dark:border-slate-800 shadow-2xl relative group">
                      <div className="flex items-center gap-8 mb-16"><div className="p-5 bg-indigo-600 text-white rounded-[2rem] shadow-xl"><UserIcon size={28} strokeWidth={2.5} /></div><div><h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Identity Schema</h3><p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Personal Data Synchronization</p></div></div>
                      <div className="space-y-16">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4 group/field"><div className="flex items-center gap-3 px-3 text-slate-400"><Command size={14} /><label className="text-[10px] font-black uppercase tracking-[0.4em]">Protocol Alias</label></div><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[2.2rem] text-xl font-black text-slate-900 dark:text-white focus:border-indigo-600 outline-none transition-all shadow-inner" /></div>
                            <div className="space-y-4 group/field">
                              <div className="flex items-center gap-3 px-3 text-slate-400">
                                <Terminal size={14} />
                                <label className="text-[10px] font-black uppercase tracking-[0.4em]">Auth UID</label>
                              </div>
                              <input 
                                type="text" 
                                disabled={!isAdmin}
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                className={`w-full px-8 py-6 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[2.2rem] text-xl font-black text-slate-900 dark:text-white focus:border-indigo-600 outline-none transition-all shadow-inner ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`} 
                              />
                            </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4 group/field"><div className="flex items-center gap-3 px-3 text-slate-400"><Mail size={14} /><label className="text-[10px] font-black uppercase tracking-[0.4em]">Primary Email</label></div><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full px-8 py-6 bg-slate-50 dark:bg-slate-950 border-2 rounded-[2.2rem] text-lg font-bold text-slate-900 dark:text-white focus:border-indigo-600 outline-none transition-all shadow-inner ${!isEmailValid ? 'border-rose-500' : 'border-slate-100 dark:border-slate-800'}`} /></div>
                            <div className="space-y-4 group/field"><div className="flex items-center gap-3 px-3 text-slate-400"><RotateCcw size={14} /><label className="text-[10px] font-black uppercase tracking-[0.4em]">Recovery Uplink</label></div><input type="email" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} className={`w-full px-8 py-6 bg-slate-50 dark:bg-slate-950 border-2 rounded-[2.2rem] text-lg font-bold text-slate-900 dark:text-white focus:border-indigo-600 outline-none transition-all shadow-inner ${!isRecoveryEmailValid ? 'border-rose-500' : 'border-slate-100 dark:border-slate-800'}`} /></div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="space-y-4 group/field"><div className="flex items-center gap-3 px-3 text-slate-400"><Building2 size={14} /><label className="text-[10px] font-black uppercase tracking-[0.4em]">Entity</label></div><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[2.2rem] text-lg font-bold text-slate-900 dark:text-white focus:border-indigo-600 outline-none transition-all shadow-inner" /></div>
                            <div className="space-y-4 group/field relative" ref={calendarRef}><div className="flex items-center gap-3 px-3 text-slate-400"><CalendarDays size={14} /><label className="text-[10px] font-black uppercase tracking-[0.4em]">Genesis Node (DOB)</label></div><button type="button" onClick={() => setIsCalendarOpen(!isCalendarOpen)} className={`w-full px-8 py-6 bg-slate-50 dark:bg-slate-950 border-2 rounded-[2.2rem] flex items-center justify-between transition-all shadow-inner h-[72px] ${isCalendarOpen ? 'border-indigo-600 ring-4 ring-indigo-500/5' : 'border-slate-100 dark:border-slate-800'}`}><span className={`font-black ${dateOfBirth ? 'text-xl text-slate-900 dark:text-white' : 'text-[13px] font-black uppercase tracking-widest text-slate-400'}`}>{dateOfBirth ? new Date(dateOfBirth).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'SELECT_DATE'}</span><Calendar size={20} className="text-indigo-500" /></button>{isCalendarOpen && <GlassCalendar currentValue={dateOfBirth} onSelect={(val) => setDateOfBirth(val)} onClose={() => setIsCalendarOpen(false)} />}</div>
                            <div className="space-y-4 group/field relative" ref={countryDropdownRef}><div className="flex items-center gap-3 px-3 text-slate-400"><Flag size={14} /><label className="text-[10px] font-black uppercase tracking-[0.4em]">Regional Node</label></div><button type="button" onClick={() => { setIsCountryDropdownOpen(!isCountryDropdownOpen); setCountrySearch(''); }} className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[2.2rem] text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between h-[72px]"><span className={`text-[13px] font-black uppercase tracking-widest ${country ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{country || 'SELECT_NODE'}</span><ChevronDown size={20} /></button>{isCountryDropdownOpen && <div className="absolute bottom-full mb-3 left-0 right-0 max-h-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl z-[100] overflow-hidden flex flex-col backdrop-blur-3xl"><div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 backdrop-blur-md sticky top-0 z-10"><div className="relative group"><Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input autoFocus type="text" value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} placeholder="PROBE REGISTRY..." className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] outline-none shadow-inner" /></div></div><div className="overflow-y-auto scrollbar-hide p-2 space-y-1 flex-1">{filteredCountries.map((c) => (<button key={c} type="button" onClick={() => { setCountry(c); setIsCountryDropdownOpen(false); }} className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${country === c ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-indigo-50 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white'}`}>{c}{country === c && <CheckCircle2 size={16} strokeWidth={3} />}</button>))}</div></div>}</div>
                         </div>
                         <div className="flex justify-start pt-4"><button onClick={() => handleSaveProfile()} disabled={loading || !canSave} className="px-16 py-6 bg-indigo-600 text-white font-black text-[14px] uppercase tracking-[0.4em] rounded-full shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-5 active:scale-95 disabled:opacity-30 group/save border border-white/10 relative overflow-hidden isolate"><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/save:translate-x-full transition-transform duration-1000" /><div className="relative z-10 flex items-center justify-center w-5 h-5">{loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}</div><span className="relative z-10">Commit Identity Updates</span></button></div>
                      </div>
                   </div>
                </div>
              )}
              
              {activeTab === 'security' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-in fade-in slide-in-from-right-12 duration-1000 ease-out">
                   <div className="xl:col-span-8 bg-white dark:bg-slate-900 rounded-[4rem] p-10 lg:p-16 border border-slate-200 dark:border-slate-800 shadow-2xl relative group">
                      <div className="flex flex-col md:flex-row md:items-center gap-8 justify-between mb-16"><div className="flex items-center gap-8"><div className="p-6 bg-rose-600 text-white rounded-[2.2rem] shadow-xl"><ShieldCheck size={32} /></div><div><h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Security Overrides</h3><p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2 mt-1"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Active Defense Grid</p></div></div></div>
                      <div className="space-y-12">
                         <div className="space-y-4 group/field"><label className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 pl-2">Master Passkey</label><input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[2.2rem] text-xl font-bold tracking-[0.5em] text-slate-900 dark:text-white focus:border-rose-600 outline-none shadow-inner" placeholder="••••••••••••" /></div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4 group/field"><div className="flex justify-between items-center px-2"><label className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">New Key</label><div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${passwordStrength.color} bg-opacity-100 text-white border-transparent`}>{passwordStrength.label}</div></div><input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[2.2rem] text-xl font-bold focus:border-indigo-600 outline-none shadow-inner" /><div className="flex gap-2 h-2 w-full px-2">{[1, 2, 3, 4].map(s => <div key={s} className={`flex-1 rounded-full transition-all duration-700 ${s <= passwordStrength.score ? passwordStrength.color : 'bg-slate-100 dark:bg-slate-800'}`} />)}</div></div>
                            <div className="space-y-4 group/field"><label className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 pl-2">Key Verification</label><input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[2.2rem] text-xl font-bold focus:border-indigo-600 outline-none shadow-inner" />{confirmPass && confirmPass !== newPass && <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest px-4 animate-pulse">Verification Failure</p>}</div>
                         </div>
                         <div className="flex justify-start pt-4"><button onClick={() => handlePasswordChange()} disabled={loading || !isSecurityFormReady} className={`px-16 py-6 bg-slate-950 text-white font-black text-[14px] uppercase tracking-[0.4em] rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center gap-5 active:scale-95 disabled:opacity-30 group/security border border-white/10 relative overflow-hidden isolate ${!isSecurityFormReady ? 'opacity-20 grayscale' : 'hover:bg-rose-600'}`}><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/security:translate-x-full transition-transform duration-1000" /><div className="relative z-10 flex items-center justify-center w-5 h-5">{loading ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}</div><span className="relative z-10">Update Security Protocol</span></button></div>
                      </div>
                   </div>
                </div>
              )}
              
              {activeTab === 'preferences' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-in fade-in slide-in-from-right-12 duration-1000 ease-out">
                   <div className="xl:col-span-12 bg-white dark:bg-slate-900 rounded-[4rem] p-10 lg:p-16 border border-slate-200 dark:border-slate-800 shadow-2xl relative group overflow-visible">
                      <div className="flex flex-col md:flex-row md:items-center gap-8 justify-between border-b border-slate-100 dark:border-slate-800 pb-12 mb-16 relative z-10"><div className="flex items-center gap-8"><div className="p-6 bg-indigo-600 text-white rounded-[2.2rem] shadow-2xl transform group-hover:rotate-6 transition-transform duration-700"><Settings2 size={32} /></div><div className="space-y-1"><h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">System Registry</h3><p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2 mt-1"><Monitor size={12} className="text-indigo-500" /> Interface Hardware & Global Logic</p></div></div><div className="px-6 py-2 bg-slate-50 dark:bg-slate-950 rounded-full border border-slate-200 dark:border-slate-800 flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol 4.2 Stable</span></div></div>
                      <div className="space-y-20 relative z-10">
                         <div className="space-y-10"><div className="flex items-center justify-between px-4"><div className="flex items-center gap-4"><div className="p-4 bg-amber-500/10 text-amber-600 rounded-[1.5rem] border border-amber-500/20"><Sun size={24} strokeWidth={2.5} /></div><div className="flex flex-col"><h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Luminance Protocol</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calibrate visual environment node</p></div></div></div><div className="flex justify-center md:justify-start"><div className="relative p-2 bg-slate-100 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-[3.2rem] flex items-center w-full max-w-xl h-24 overflow-hidden group/switch shadow-inner isolate"><div className={`absolute inset-y-2 w-[calc(50%-8px)] bg-indigo-600 rounded-[2.5rem] transition-all duration-700 cubic-bezier(0.68, -0.6, 0.32, 1.6) shadow-2xl ${theme === 'dark' ? 'translate-x-full ml-1' : 'translate-x-0'}`}/><button onClick={() => theme === 'dark' && onToggleTheme()} className={`relative z-10 flex-1 h-full flex items-center justify-center gap-5 transition-all duration-500 ${theme === 'light' ? 'text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}><Sun size={28} strokeWidth={3} className={`transition-transform duration-700 ${theme === 'light' ? 'rotate-12 scale-110 drop-shadow-lg' : ''}`} /><div className="flex flex-col items-start text-left"><span className="text-[14px] font-black uppercase tracking-[0.1em]">Solar Mode</span><span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-60">High Luminance</span></div></button><button onClick={() => theme === 'light' && onToggleTheme()} className={`relative z-10 flex-1 h-full flex items-center justify-center gap-5 transition-all duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}><Moon size={28} strokeWidth={3} className={`transition-transform duration-700 ${theme === 'dark' ? '-rotate-12 scale-110 drop-shadow-lg' : ''}`} /><div className="flex flex-col items-start text-left"><span className="text-[14px] font-black uppercase tracking-0.1em">Lunar Mode</span><span className="text-[8px] font-bold uppercase tracking-0.2em opacity-60">Low Emissions</span></div></button></div></div></div>
                         <div className="space-y-10"><div className="flex items-center gap-4 px-4"><div className="p-4 bg-indigo-500/10 text-indigo-600 rounded-[1.5rem] border border-indigo-500/20"><Globe size={24} strokeWidth={2.5} /></div><div className="flex flex-col"><h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Linguistic Core</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active locale synchronization layer</p></div></div><div className="relative w-full p-2 bg-slate-100 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-inner overflow-hidden isolate"><div className="absolute inset-y-2 bg-indigo-600 rounded-[2.5rem] shadow-2xl transition-all duration-700 cubic-bezier(0.68, -0.6, 0.32, 1.6)" style={{ width: `calc(${100 / languages.length}% - 12px)`, left: `calc(${(currentLangIndex * (100 / languages.length))}% + 6px)`, margin: '0 2px' }}/><div className="relative flex items-center h-24 md:h-28">{languages.map((lang, idx) => { const isSelected = language === lang.code; const syncing = isSyncingLang === lang.code; return (<button key={lang.code} type="button" onClick={() => handleLanguageUpdate(lang.code)} className={`relative z-10 flex-1 h-full flex flex-col items-center justify-center gap-1.5 transition-all duration-500 group/langbtn ${isSelected ? 'text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}>{syncing ? (<Loader2 size={24} className="animate-spin mb-1" />) : (<span className={`text-[10px] font-black font-mono tracking-[0.4em] mb-0.5 transition-transform duration-700 ${isSelected ? 'scale-110 opacity-70' : 'opacity-20'}`}>ID:0{idx + 1}</span>)}<div className="flex flex-col items-center text-center"><span className={`text-xl md:text-2xl font-black tracking-tighter uppercase transition-all duration-700 ${isSelected ? 'scale-105' : ''}`}>{lang.name}</span><span className={`text-[9px] font-black uppercase tracking-[0.5em] mt-0.5 transition-all duration-700 ${isSelected ? 'opacity-80' : 'opacity-40'}`}>{lang.desc}</span></div></button>); })}</div></div></div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-in fade-in slide-in-from-right-12 duration-1000 ease-out">
                   <div className="xl:col-span-12 bg-white dark:bg-slate-900 rounded-[4rem] p-10 lg:p-16 border border-slate-200 dark:border-slate-800 shadow-2xl relative group overflow-hidden">
                      <div className="flex items-center gap-8 mb-16">
                         <div className="p-5 bg-indigo-600 text-white rounded-[2rem] shadow-xl">
                            <History size={28} strokeWidth={2.5} />
                         </div>
                         <div>
                            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Event Protocol</h3>
                            <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Identity Activity Logs</p>
                         </div>
                      </div>
                      <div className="space-y-6">
                        {activities.length > 0 ? (
                          activities.map((log, i) => (
                            <div key={log.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-3xl group/log hover:bg-white dark:hover:bg-slate-900 transition-all duration-300">
                               <div className="flex items-center gap-6">
                                  <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 group-hover/log:scale-110 transition-transform">
                                     {getActivityIcon(log.type)}
                                  </div>
                                  <div className="flex flex-col">
                                     <span className="text-[15px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{log.action}</span>
                                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">{log.type} Event</span>
                                  </div>
                               </div>
                               <div className="flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                     <Clock size={12} />
                                     <span className="text-[12px] font-black font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString()}</span>
                               </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-20 text-center opacity-20 italic">
                             <Fingerprint size={64} className="mx-auto text-slate-300 mb-6" />
                             <p className="text-[12px] font-black uppercase tracking-[0.4em]">No activity detected in the local buffer.</p>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;