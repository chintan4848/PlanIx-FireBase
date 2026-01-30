import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Workflow, 
  Zap, 
  Users, 
  ChevronLeft, 
  BoxSelect,
  Sun,
  Moon,
  Sparkles,
  Code2,
  Globe,
  User as UserIcon,
  Lock,
  Cpu,
  Radio,
  Terminal
} from 'lucide-react';
import { Language, User } from '../types';
import { translations } from '../translations';
import AdminCenterIcon from './AdminCenterIcon';

interface SidebarProps {
  activeProjectName: string;
  user: User | null;
  onUpdateUserName: (name: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  language: Language;
  onToggleLanguage: () => void;
  isOpen: boolean;
  onToggle: () => void;
  activeTab: 'board' | 'analytics' | 'developers' | 'profile' | 'admin';
  onTabChange: (tab: 'board' | 'analytics' | 'developers' | 'profile' | 'admin') => void;
  onOverrideApp: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeProjectName, 
  user, 
  onUpdateUserName,
  theme,
  onToggleTheme,
  language,
  onToggleLanguage,
  isOpen,
  onToggle,
  activeTab,
  onTabChange,
  onOverrideApp
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(user?.name || '');
  const t = translations[language].sidebar;

  const isAdmin = user?.role === 'Admin' || user?.role === 'Project Leader' || user?.role === 'Team Lead';

  const menuItems = [
    { name: t.board, id: 'board' as const, icon: Workflow },
    { name: t.analytics, id: 'analytics' as const, icon: LayoutDashboard },
    { name: t.profile, id: 'profile' as const, icon: UserIcon },
    ...(isAdmin ? [{ name: t.admin, id: 'admin' as const, icon: AdminCenterIcon }] : []),
    { name: t.developers, id: 'developers' as const, icon: Code2 },
  ];

  const handleSaveName = () => {
    if (tempName.trim()) {
      onUpdateUserName(tempName.trim());
      setIsEditingName(false);
    }
  };

  const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.username || 'User')}&backgroundColor=6366f1`;

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[45] lg:hidden transition-opacity duration-500 ease-in-out"
          onClick={onToggle}
        />
      )}

      <aside 
        data-tour="sidebar"
        className={`w-64 bg-[#020617] dark:bg-[#020617] border-r border-slate-900/50 h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-8 flex-1 overflow-y-auto scrollbar-hide relative">
          <button 
            onClick={onToggle}
            className="absolute top-8 right-3 lg:flex hidden p-2 rounded-xl bg-slate-900/40 text-slate-500 hover:text-white transition-all border border-white/5 hover:bg-slate-800 hover:border-indigo-500/30 z-20 group/toggle"
            title="Collapse Sidebar"
          >
            <ChevronLeft size={16} strokeWidth={3} className="group-hover/toggle:-translate-x-0.5 transition-transform" />
          </button>

          <div className="flex items-center mb-12">
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 rotate-1 group-hover:rotate-0 transition-transform duration-500 border border-white/10">
                <BoxSelect size={20} strokeWidth={2.5} />
              </div>
              <span className="text-white font-black text-xl tracking-tighter">Planix</span>
            </div>
          </div>

          <div className={`space-y-10 transition-all duration-700 delay-100 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div>
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-5 pl-1 flex items-center gap-2">
                <Sparkles size={10} className="text-indigo-500" />
                {t.workspace}
              </h3>
              <div className="relative group p-4 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 transition-all hover:border-indigo-500/40 hover:bg-slate-900/60 overflow-hidden cursor-pointer">
                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 flex items-center justify-center text-xs font-black text-indigo-400 border border-indigo-500/20">
                    {activeProjectName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-slate-100 truncate leading-tight mb-0.5">{activeProjectName}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{t.sprint_active}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <nav className="space-y-1">
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-5 pl-1">{t.navigation}</h3>
              {menuItems.map((item, idx) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    style={{ transitionDelay: `${idx * 50}ms` }}
                    onClick={() => onTabChange(item.id as any)}
                    className={`w-full relative flex items-center gap-3.5 px-4 py-3 rounded-xl text-[12px] font-black transition-all group overflow-hidden ${
                      isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                    } ${
                      isActive 
                        ? 'text-white' 
                        : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <>
                        <div className="absolute inset-0 bg-indigo-600 shadow-[0_4px_15px_-5px_rgba(79,70,229,0.4)] z-0" />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-r-full z-10" />
                      </>
                    )}
                    <Icon size={17} className={`relative z-10 transition-colors ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-slate-400'}`} />
                    <span className="relative z-10 flex-1 text-left tracking-wide">{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-6 bg-slate-900/10 border-t border-white/5 space-y-5">
          {/* --- OVERRIDE BUTTON --- */}
          <button 
            onClick={onOverrideApp}
            className="w-full relative group/override transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
             <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 via-rose-500 to-orange-500 rounded-2xl opacity-10 group-hover/override:opacity-40 blur-sm transition-opacity" />
             <div className="relative flex items-center justify-between p-3.5 bg-slate-950 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-orange-600/20 text-orange-500 rounded-lg group-hover/override:rotate-12 transition-transform">
                      <Cpu size={18} strokeWidth={2.5} />
                   </div>
                   <div className="flex flex-col items-start">
                      <span className="text-[8px] font-black text-orange-500 uppercase tracking-[0.2em] leading-none mb-1">Neural Core</span>
                      <span className="text-[11px] font-black text-white tracking-tight uppercase italic leading-none">CommitGuard</span>
                   </div>
                </div>
                <Radio size={12} className="text-rose-500 animate-pulse" />
                <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent opacity-0 group-hover/override:opacity-100 transition-opacity" />
             </div>
          </button>

          <div className="space-y-1">
             <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1 pl-1">Language Preference</p>
             <div className="flex items-center justify-between">
                <button 
                  onClick={onToggleLanguage}
                  className="px-3 py-2 rounded-lg bg-slate-900/50 text-slate-400 font-black text-[9px] border border-white/5 hover:bg-indigo-500/10 hover:text-indigo-400 hover:border-indigo-500/20 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Globe size={11} />
                  {language}
                </button>
                <button 
                  onClick={onToggleTheme}
                  className="p-2 rounded-lg bg-slate-900/50 text-slate-500 hover:text-white transition-all border border-white/5 hover:border-indigo-500/30"
                >
                  {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                </button>
             </div>
          </div>
          
          <div data-tour="user" className="flex items-center gap-3 group/user cursor-pointer p-1.5 rounded-xl transition-colors hover:bg-white/5" onClick={() => onTabChange('profile')}>
            <div className="relative shrink-0">
              <img 
                src={user?.avatar || defaultAvatar} 
                className="w-9 h-9 rounded-lg shadow-xl border border-white/10 transition-transform group-hover/user:scale-105" 
                alt="User" 
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#020617] rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-black text-slate-100 truncate hover:text-indigo-400 transition-colors leading-tight">
                {user?.name}
              </p>
              <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.2em]">{user?.role}</p>
            </div>
          </div>

          <div className="pt-2 text-center">
            <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em]">
              © 2026 PLANIX CORE OS
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;