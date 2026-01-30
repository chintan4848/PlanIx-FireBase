import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Task, TaskPriority, TaskStatus, Language } from '../types';
import { X, Save, AlignLeft, Type, Hash, ExternalLink, Flag, Layout, ChevronDown, Check } from 'lucide-react';
import { translations } from '../translations';

interface EditTaskModalProps {
  task: Task;
  language: Language;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => void;
}

const CustomDropdown = <T extends string>({ 
  label, 
  value, 
  options, 
  optionLabels,
  onChange,
  icon: Icon
}: { 
  label: string, 
  value: T, 
  options: T[], 
  optionLabels?: Record<T, string>,
  onChange: (val: T) => void,
  icon: any
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4 relative" ref={dropdownRef}>
      <div className="flex items-center gap-3 px-1 text-slate-400">
        <Icon size={14} strokeWidth={3} />
        <label className="text-[10px] font-black uppercase tracking-[0.3em]">{label}</label>
      </div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 focus:border-indigo-600 outline-none transition-all text-left shadow-sm"
      >
        {optionLabels ? optionLabels[value] : value}
        <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[110] overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-2 space-y-1">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                  value === opt ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {optionLabels ? optionLabels[opt] : opt}
                {value === opt && <Check size={14} strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, language, onClose, onSave }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);

  const t = translations[language].task;
  const statusLabels = translations[language].statuses;

  const hasChanges = useMemo(() => {
    return (
      title !== task.title ||
      description !== task.description ||
      priority !== task.priority ||
      status !== task.status
    );
  }, [title, description, priority, status, task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;
    onSave(task.id, { title, description, priority, status });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center py-20 px-4 bg-slate-950/20 backdrop-blur-md animate-in fade-in duration-500 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.6)] w-full max-w-6xl overflow-hidden border border-white/10 animate-in zoom-in-90 slide-in-from-bottom-12 duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
        {/* HEADER - MATCHING IMPORT ID POPUP PADDING (px-10 py-12) */}
        <div className="px-10 py-12 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -mr-48 -mt-48 blur-[120px] opacity-40" />
          <div className="relative z-10 flex items-center gap-10">
            <div className="space-y-1">
              <div className="flex items-center gap-4">
                <div className="px-4 py-1.5 bg-white/20 backdrop-blur-xl rounded-full border border-white/20 flex items-center gap-2.5 shadow-lg">
                  <Hash size={12} strokeWidth={3} className="opacity-80" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">{task.external_id}</span>
                </div>
                <a href={task.external_url} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 shadow-lg"><ExternalLink size={16} /></a>
              </div>
              <h2 className="text-4xl font-black tracking-tighter leading-tight">{t.edit}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-4 bg-white/10 hover:bg-rose-500/20 text-white rounded-2xl transition-all relative z-10 border border-white/10 active:scale-90 shadow-xl group">
            <X size={28} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* FORM - MATCHING IMPORT ID POPUP PADDING (p-10) AND SPACING (space-y-8) */}
        <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-white dark:bg-slate-900">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* LEFT COLUMN: CORE INPUTS */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-1 text-slate-400">
                  <Type size={16} strokeWidth={3} />
                  <label className="text-[10px] font-black uppercase tracking-[0.4em]">Core Identifier</label>
                </div>
                <input 
                  autoFocus 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] text-xl font-black text-slate-900 dark:text-white focus:border-indigo-600 outline-none shadow-inner transition-all" 
                  required 
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 px-1 text-slate-400">
                  <AlignLeft size={16} strokeWidth={3} />
                  <label className="text-[10px] font-black uppercase tracking-[0.4em]">Technical Context</label>
                </div>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Details, ACs, or logs..." 
                  className="w-full h-[260px] px-8 py-7 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] text-sm font-medium leading-relaxed outline-none focus:border-indigo-600 transition-all resize-none shadow-inner" 
                />
              </div>
            </div>

            {/* RIGHT COLUMN: METADATA & SELECTORS */}
            <div className="lg:col-span-5 flex flex-col gap-8 h-full">
              <div className="bg-slate-50/50 dark:bg-slate-950/40 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 flex-1">
                <CustomDropdown 
                  label={t.priority} 
                  value={priority} 
                  options={Object.values(TaskPriority)} 
                  onChange={(val) => setPriority(val)} 
                  icon={Flag} 
                />
                
                <CustomDropdown 
                  label={t.stage} 
                  value={status} 
                  options={Object.values(TaskStatus)} 
                  optionLabels={statusLabels} 
                  onChange={(val) => setStatus(val)} 
                  icon={Layout} 
                />

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 opacity-60">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Node Assignment Required for Commit</p>
                </div>
              </div>

              {/* FOOTER - INTEGRATED IN RIGHT COL FOR BALANCED HEIGHT */}
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={!hasChanges}
                  className={`w-full py-7 font-black text-[13px] uppercase tracking-[0.6em] rounded-full transition-all flex items-center justify-center gap-5 active:scale-95 border group/btn overflow-hidden relative ${
                    hasChanges 
                      ? 'bg-indigo-600 text-white shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] hover:bg-indigo-700 border-white/10' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border-transparent'
                  }`}
                >
                  {hasChanges && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-shimmer-fast" />}
                  <Save size={22} className={`${hasChanges ? 'group-hover/btn:rotate-12' : ''} transition-transform`} />
                  {t.commit}
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;