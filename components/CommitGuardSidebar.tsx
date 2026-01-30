import React from 'react';
import { User, Language } from '../types';
import { 
  Home, 
  Layers, 
  History, 
  Zap, 
  BarChart3,
  BoxSelect,
  Briefcase,
  Cpu,
  Radio,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  user: User;
  isCollapsed: boolean;
  onToggle: () => void;
  activeTab: 'home' | 'analysis' | 'projects' | 'audit';
  onTabChange: (tab: any) => void;
  onExit: () => void;
  language: Language;
  onToggleLanguage: () => void;
}

const CommitGuardSidebar: React.FC<SidebarProps> = ({ 
  user, 
  isCollapsed, 
  onToggle, 
  activeTab, 
  onTabChange, 
  onExit,
  language,
  onToggleLanguage
}) => {
  return (
    <aside 
      className={`bg-white/95 backdrop-blur-3xl rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.12)] flex flex-col py-14 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) relative z-50 shrink-0 border border-white items-center ${
        isCollapsed ? 'w-24' : 'w-80'
      }`}
    >
      <div 
        className={`cursor-pointer select-none mb-16 flex group ${
          isCollapsed ? 'flex-col items-center' : 'flex-row items-center gap-5 px-10 w-full'
        }`}
        onClick={onToggle}
      >
        <div className="sidebar-logo-container group-hover:scale-105 transition-transform">
           <BoxSelect className="w-8 h-8 text-white" strokeWidth={2.5} />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col items-start animate-in fade-in slide-in-from-left-2 duration-700 overflow-hidden whitespace-nowrap">
             <span className="text-[26px] font-black font-heading text-[#0f172a] tracking-tight leading-none uppercase">COMMIT<span className="text-[#ff5d2a]">G</span></span>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono mt-1 opacity-70">CONSOLE V2.4</span>
          </div>
        )}
      </div>

      <nav className="flex-1 w-full px-5 flex flex-col items-center gap-4">
        {[
          { id: 'home', icon: Home, label: 'HOME' },
          { id: 'projects', icon: Briefcase, label: 'PROJECTS' },
          { id: 'analysis', icon: BarChart3, label: 'ANALYSIS' },
          { id: 'audit', icon: History, label: 'AUDIT' },
        ].map(item => {
          const isActive = activeTab === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center justify-center transition-all duration-500 relative group overflow-hidden ${
                isCollapsed 
                  ? (isActive ? 'w-[54px] h-[54px] bg-[#0f172a] rounded-full shadow-lg text-[#ff5d2a]' : 'w-[54px] h-[54px] rounded-[1.2rem] hover:bg-slate-50 text-slate-400') 
                  : `w-full py-5 px-8 rounded-[2rem] ${isActive ? 'nav-pill-active' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`
              }`}
            >
              <div className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'gap-6'}`}>
                <item.icon size={22} strokeWidth={3} className={`${isActive ? 'text-[#ff5d2a]' : 'text-slate-400 transition-colors'}`} />
                {!isCollapsed && (
                  <span className={`text-[13px] font-black uppercase tracking-[0.4em] font-heading transition-colors flex-1 text-left ${isActive ? 'text-white' : ''}`}>
                    {item.label}
                  </span>
                )}
                {isActive && !isCollapsed && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5d2a] shadow-[0_0_12px_#ff5d2a] animate-pulse" />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto w-full flex flex-col items-center gap-4 px-5">
        {/* --- PLANIX NAVIGATION BUTTON --- */}
        <button 
          onClick={onExit}
          className={`relative group/planix transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] ${
            isCollapsed ? 'w-[54px] h-[54px]' : 'w-full'
          }`}
        >
          {/* Outer Glow Effect (Blue-Indigo) */}
          {!isCollapsed && (
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-[1.5rem] opacity-0 group-hover/planix:opacity-40 blur-sm transition-opacity" />
          )}

          <div className={`relative flex items-center bg-[#0b1221] border border-white/5 overflow-hidden shadow-2xl transition-all duration-500 h-full ${
            isCollapsed ? 'rounded-[1.2rem] justify-center' : 'rounded-[1.5rem] p-3.5 justify-between pr-5'
          }`}>
             <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3.5'}`}>
                <div className={`${isCollapsed ? 'bg-transparent border-none shadow-none' : 'w-10 h-10 bg-indigo-600/10 rounded-xl border border-indigo-500/20 shadow-inner group-hover/planix:rotate-12 transition-transform'} flex items-center justify-center text-indigo-400 shrink-0`}>
                   <BoxSelect size={isCollapsed ? 22 : 18} strokeWidth={2.5} className="opacity-90" />
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col items-start">
                     <span className="text-[9px] font-black text-[#6366f1] uppercase tracking-[0.1em] leading-none mb-1">SYSTEM CORE</span>
                     <span className="text-[16px] font-black text-white tracking-tighter uppercase italic leading-none font-heading">PLANIX OS</span>
                  </div>
                )}
             </div>
             {!isCollapsed && <Radio size={16} className="text-emerald-500 animate-pulse drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />}
             
             {/* Bottom Line Gradient Effect (Blue-Indigo) */}
             {!isCollapsed && (
               <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent opacity-0 group-hover/planix:opacity-100 transition-opacity" />
             )}
          </div>
        </button>

        {/* --- PROFILE BUTTON (COMPACT DESIGN) --- */}
        <button 
          className={`w-full relative group/profile transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] ${
            isCollapsed ? 'px-1' : ''
          }`}
        >
          <div className={`relative flex items-center transition-all duration-500 bg-transparent border border-transparent rounded-[1.5rem] ${
            isCollapsed ? 'p-2 justify-center' : 'p-1.5 px-3 justify-between group-hover/profile:bg-slate-50 group-hover/profile:border-slate-100'
          }`}>
             <div className={`flex items-center transition-all duration-500 min-w-0 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                <div className="user-logo-box shrink-0 scale-[0.8] origin-left">
                   <img src={user.avatar} alt={user.name} />
                   <div className="presence-marker" />
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col items-start transition-all duration-500 animate-in fade-in slide-in-from-left-2 overflow-hidden text-left min-w-0">
                     <p className="text-[13px] font-black text-[#0f172a] truncate leading-tight tracking-tight uppercase w-full">{user.name}</p>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono mt-0.5 opacity-60 truncate w-full">{user.role}</p>
                  </div>
                )}
             </div>
             {!isCollapsed && (
               <ChevronRight size={16} className="text-slate-300 group-hover/profile:text-indigo-600 transition-colors shrink-0" strokeWidth={3} />
             )}
          </div>
        </button>
      </div>
    </aside>
  );
};

export default CommitGuardSidebar;