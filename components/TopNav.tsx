import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  FileText, 
  Plus, 
  ArrowUpFromLine, 
  ArrowDownToLine, 
  Edit2,
  Copy,
  CheckCircle,
  Menu,
  ChevronDown,
  Settings2,
  Sun,
  Moon,
  RotateCcw,
  Filter,
  X,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react';
import { TaskPriority, Language, User } from '../types';
import { translations } from '../translations';
import { Users } from 'lucide-react';

interface TopNavProps {
  projectName: string;
  onUpdateProjectName: (name: string) => void;
  onExportPDF: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onNewTask: () => void;
  onSearch: (query: string) => void;
  onCopyAll: () => void;
  onResetBoard: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  language: Language;
  onToggleLanguage: () => void;
  userName: string;
  currentUser: User | null;
  users: User[];
  hasTasks: boolean;
  filterPriority: TaskPriority | 'All';
  onFilterPriority: (p: TaskPriority | 'All') => void;
  filterUserId: string | 'All';
  onFilterUser: (id: string | 'All') => void;
  showClosed: boolean;
  onToggleClosed: () => void;
  activeTab: 'board' | 'analytics' | 'developers' | 'profile' | 'admin';
  onLogout: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ 
  projectName, 
  onUpdateProjectName, 
  onExportPDF, 
  onExportData, 
  onImportData, 
  onNewTask, 
  onSearch,
  onCopyAll,
  onResetBoard,
  sidebarOpen,
  onToggleSidebar,
  theme,
  onToggleTheme,
  language,
  onToggleLanguage,
  userName,
  currentUser,
  users,
  hasTasks,
  filterPriority,
  onFilterPriority,
  filterUserId,
  onFilterUser,
  showClosed,
  onToggleClosed,
  activeTab,
  onLogout
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(projectName);
  const [isCopied, setIsCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isUserFilterOpen, setIsUserFilterOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const userFilterRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const t = translations[language].nav;
  const isDark = theme === 'dark';

  useEffect(() => {
    setEditedName(projectName);
  }, [projectName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (userFilterRef.current && !userFilterRef.current.contains(event.target as Node)) {
        setIsUserFilterOpen(false);
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSaveName = () => {
    if (editedName.trim()) {
      onUpdateProjectName(editedName);
      setIsEditing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
      setIsMenuOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopy = () => {
    if (!hasTasks) return;
    onCopyAll();
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
      setIsMenuOpen(false);
    }, 1500);
  };

  const confirmReset = () => {
    onResetBoard();
    setShowResetConfirm(false);
    setIsMenuOpen(false);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    onSearch('');
    searchInputRef.current?.focus();
  };

  return (
    <header className="h-16 md:h-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 transition-all shadow-sm">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {!sidebarOpen && (
          <button 
            onClick={onToggleSidebar}
            className="p-2 bg-slate-900 text-white rounded-xl shadow-md hover:bg-slate-800 transition-all animate-in slide-in-from-left-4"
          >
            <Menu size={18} />
          </button>
        )}

        <div className="flex items-center gap-2 group max-w-full">
          {isEditing ? (
            <input 
              autoFocus
              type="text"
              className="text-lg font-bold text-slate-900 dark:text-white border-b-2 border-indigo-600 outline-none py-1 w-full bg-transparent"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              onBlur={handleSaveName}
            />
          ) : (
            <div className="flex items-center gap-2 cursor-pointer group shrink-0" onClick={() => setIsEditing(true)}>
              <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-white truncate tracking-tight">{projectName}</h1>
              <div className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all bg-slate-100 dark:bg-slate-800">
                <Edit2 size={10} className="text-slate-400" />
              </div>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'board' && (
        <div className="hidden lg:flex flex-[2] justify-center items-center gap-3 px-8">
          <div className={`relative w-full max-w-md transition-all duration-300 ${isSearchFocused ? 'scale-[1.01]' : 'scale-100'}`}>
            <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
              isSearchFocused 
                ? 'bg-white dark:bg-slate-900 ring-2 ring-indigo-500/20 dark:ring-indigo-500/40 shadow-lg shadow-indigo-500/5' 
                : 'bg-slate-50/50 dark:bg-slate-900/50'
            }`} />
            
            <Search 
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-all duration-300 z-10 ${
                isSearchFocused ? 'text-indigo-600' : 'text-slate-400'
              }`} 
              size={16} 
            />
            
            <input 
              ref={searchInputRef}
              type="text" 
              value={searchValue}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              onChange={(e) => {
                setSearchValue(e.target.value);
                onSearch(e.target.value);
              }}
              placeholder={t.search} 
              className="relative z-10 pl-10 pr-10 py-2.5 bg-transparent border-none rounded-2xl text-sm w-full outline-none font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />

            {searchValue && (
              <button 
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-all z-20"
              >
                <X size={12} strokeWidth={3} />
              </button>
            )}
          </div>
          
          <button
            onClick={onToggleClosed}
            className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
              showClosed 
              ? 'bg-slate-900 text-white border-slate-800 shadow-md' 
              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-sm'
            }`}
          >
            {showClosed ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>

          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                filterPriority !== 'All' 
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' 
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-sm'
              }`}
            >
              <Filter size={16} />
              {filterPriority !== 'All' && <span className="text-[10px] font-black uppercase tracking-widest">{filterPriority}</span>}
            </button>

            {isFilterOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 animate-in zoom-in-95 duration-150">
                <div className="p-1.5 space-y-0.5">
                  <p className="px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.filter_priority}</p>
                  <button 
                    onClick={() => { onFilterPriority('All'); setIsFilterOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold uppercase transition-all ${filterPriority === 'All' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    {t.all_priorities}
                  </button>
                  {Object.values(TaskPriority).map((p) => (
                    <button
                      key={p}
                      onClick={() => { onFilterPriority(p); setIsFilterOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold uppercase transition-all ${
                        filterPriority === p ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {(currentUser?.role === 'Admin' || currentUser?.role === 'Project Leader' || currentUser?.role === 'Team Lead') && (
            <div className="relative" ref={userFilterRef}>
              <button
                onClick={() => setIsUserFilterOpen(!isUserFilterOpen)}
                className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                  filterUserId !== 'All'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-sm'
                }`}
              >
                <Users size={16} />
                {filterUserId !== 'All' && (
                  <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[80px]">
                    {users.find(u => u.id === filterUserId)?.name || 'User'}
                  </span>
                )}
              </button>

              {isUserFilterOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 animate-in zoom-in-95 duration-150">
                  <div className="p-1.5 space-y-0.5">
                    <p className="px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Filter by User</p>
                    <button
                      onClick={() => { onFilterUser('All'); setIsUserFilterOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold uppercase transition-all ${filterUserId === 'All' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      All Users
                    </button>
                    <div className="max-h-60 overflow-y-auto scrollbar-hide">
                      {users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => { onFilterUser(u.id); setIsUserFilterOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold uppercase transition-all ${
                            filterUserId === u.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <img src={u.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                          <span className="truncate">{u.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 shrink-0">
        {activeTab === 'board' && (
          <>
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  isMenuOpen 
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-inner' 
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-sm'
                }`}
              >
                <Settings2 size={16} />
                <span className="hidden sm:inline">{t.actions}</span>
                <ChevronDown size={12} className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className={`absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 transition-all origin-top-right ${
                isMenuOpen 
                  ? 'opacity-100 translate-y-0 scale-100' 
                  : 'opacity-0 -translate-y-1 scale-95 pointer-events-none'
              }`}>
                <div className="p-1.5 space-y-0.5">
                  <button onClick={() => { onExportPDF(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all group text-left">
                    <FileText size={16} className="text-slate-400 group-hover:text-indigo-500" />
                    <p className="text-xs font-bold truncate">{t.export_pdf}</p>
                  </button>
                  
                  <button 
                    onClick={handleCopy}
                    disabled={!hasTasks}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group text-left ${
                      isCopied 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' 
                        : !hasTasks ? 'opacity-40 grayscale cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {isCopied ? <CheckCircle size={16} className="text-emerald-500" /> : <Copy size={16} className="text-slate-400 group-hover:text-indigo-500" />}
                    <p className="text-xs font-bold truncate">{isCopied ? 'Copied!' : t.copy_all}</p>
                  </button>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                  
                  <button onClick={() => { onExportData(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all group text-left">
                    <ArrowUpFromLine size={16} className="text-slate-400" />
                    <p className="text-xs font-bold truncate">{t.backup}</p>
                  </button>
                  
                  <label className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all group cursor-pointer text-left">
                    <ArrowDownToLine size={16} className="text-slate-400" />
                    <p className="text-xs font-bold truncate">{t.restore}</p>
                    <input ref={fileInputRef} type="file" className="hidden" accept=".json" onChange={handleFileChange} />
                  </label>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                  
                  {showResetConfirm ? (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-100 dark:border-rose-900/50 space-y-2">
                      <p className="text-[10px] font-black uppercase text-rose-600 text-center">Clear all tasks?</p>
                      <div className="flex gap-1.5">
                        <button onClick={confirmReset} className="flex-1 py-1.5 bg-rose-600 text-white text-[10px] font-black uppercase rounded-md">Yes</button>
                        <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-1.5 bg-white dark:bg-slate-800 text-slate-400 text-[10px] font-black uppercase rounded-md border border-slate-200 dark:border-slate-700">No</button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowResetConfirm(true); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all text-left"
                    >
                      <RotateCcw size={16} />
                      <p className="text-xs font-bold truncate">{t.reset}</p>
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <button 
              data-tour="import"
              onClick={onNewTask}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0f172a] dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-700 rounded-xl text-sm font-bold transition-all shadow-md group"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              <span className="hidden sm:inline">{t.import_ids}</span>
            </button>
          </>
        )}

        <div className="flex items-center gap-2 ml-1 border-l border-slate-200 dark:border-slate-800 pl-3">
          <button 
            onClick={onToggleTheme}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button 
            onClick={onLogout}
            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNav;