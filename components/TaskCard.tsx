import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Task, TaskPriority, TaskStatus, Language } from '../types';
import { ExternalLink, Trash2, GripVertical, Clock, Hash, Calendar, Eye, Sparkles, ArrowRightLeft, Pencil, CheckCircle2, Lock, Unlock } from 'lucide-react';
import Timer from './Timer';
import { translations } from '../translations';

interface TaskCardProps {
  task: Task;
  language: Language;
  userName: string;
  userAvatar: string;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onPreview: (url: string) => void;
  onStatusChange: (status: TaskStatus) => void;
  onPriorityChange: (priority: TaskPriority) => void;
  onViewed: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onCloseToggle: (closed: boolean) => void;
  isDragging?: boolean;
}

// Global mouse tracker to handle scroll-hover synchronization
let globalMouseX = -1;
let globalMouseY = -1;

if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', (e) => {
    globalMouseX = e.clientX;
    globalMouseY = e.clientY;
  }, { passive: true });
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  language,
  userName,
  userAvatar,
  onPause,
  onResume,
  onDelete,
  onEdit,
  onPreview,
  onStatusChange,
  onPriorityChange,
  onViewed,
  onDragStart,
  onDragEnd,
  onCloseToggle,
  isDragging = false
}) => {
  const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);
  const [isPriorityMenuOpen, setIsPriorityMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const cardRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);

  const t = translations[language].task;
  const statusLabels = translations[language].statuses;

  const priorityStyles = {
    [TaskPriority.LOW]: { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500/20', dot: 'bg-sky-500', glow: 'rgba(14, 165, 233, 0.5)' },
    [TaskPriority.MEDIUM]: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20', dot: 'bg-indigo-500', glow: 'rgba(99, 102, 241, 0.5)' },
    [TaskPriority.HIGH]: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-500', glow: 'rgba(245, 158, 11, 0.5)' },
    [TaskPriority.URGENT]: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20', dot: 'bg-rose-500', glow: 'rgba(244, 63, 94, 0.5)' }
  };

  const statusThemes = {
    [TaskStatus.TO_DO]: { 
      dot: 'bg-slate-400', 
      active: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      icon: 'text-slate-400'
    },
    [TaskStatus.IN_PROGRESS]: { 
      dot: 'bg-indigo-500', 
      active: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      icon: 'text-indigo-500'
    },
    [TaskStatus.REVIEW]: { 
      dot: 'bg-amber-500', 
      active: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      icon: 'text-amber-500'
    },
    [TaskStatus.DONE]: { 
      dot: 'bg-emerald-500', 
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      icon: 'text-emerald-500'
    },
  };

  const checkHoverState = useCallback(() => {
    if (!cardRef.current || globalMouseX === -1) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const isInside = (
      globalMouseX >= rect.left &&
      globalMouseX <= rect.right &&
      globalMouseY >= rect.top &&
      globalMouseY <= rect.bottom
    );

    if (isInside) {
      setIsHovered(true);
      setMousePos({
        x: globalMouseX - rect.left,
        y: globalMouseY - rect.top
      });
    } else {
      setIsHovered(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', checkHoverState, true);
    const interval = setInterval(checkHoverState, 100);
    return () => {
      window.removeEventListener('scroll', checkHoverState, true);
      clearInterval(interval);
    };
  }, [checkHoverState]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMoveMenuOpen(false);
      if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) setIsPriorityMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsHovered(true);
  };

  const formatDuration = (total: number) => {
    if (total === 0) return '0s';
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const isDone = task.status === TaskStatus.DONE;
  const isClosed = task.is_closed;
  const currentPriority = priorityStyles[task.priority];
  const anyMenuOpen = isMoveMenuOpen || isPriorityMenuOpen;

  return (
    <div
      ref={cardRef}
      draggable={!isClosed}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative bg-white dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[1.75rem] p-5 transition-all duration-500 ${
        isClosed ? 'opacity-60 cursor-default' : 'cursor-grab active:cursor-grabbing hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-1.5'
      } ${isDragging ? 'opacity-40 grayscale scale-95' : ''} ${
        isHovered && !isClosed ? 'shadow-2xl shadow-indigo-500/10 -translate-y-1' : ''
      } ${anyMenuOpen ? 'z-50' : 'z-20'}`}
    >
      {!isClosed && (
        <div 
          className={`absolute inset-0 rounded-[1.75rem] pointer-events-none transition-opacity duration-300 z-10 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          style={{
            padding: '1.5px',
            background: `radial-gradient(150px circle at ${mousePos.x}px ${mousePos.y}px, ${isDone ? 'rgba(16, 185, 129, 0.6)' : currentPriority.glow}, transparent 100%)`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'destination-out',
            maskComposite: 'exclude',
          }}
        />
      )}

      <div className={`absolute top-6 left-1.5 w-1 h-[calc(100%-48px)] transition-all duration-500 rounded-full ${isDone ? 'bg-emerald-500' : currentPriority.dot} ${isHovered ? 'opacity-100 w-1.5' : 'opacity-20'}`} />
      
      <div className="flex justify-between items-center mb-4 pl-1.5 relative z-40">
        <div className="flex items-center gap-1.5">
           <div className={`p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 transition-colors border border-slate-100 dark:border-slate-800/50 shadow-sm ${!isClosed && isHovered ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-700'}`}><GripVertical size={12} /></div>
           <div className="flex items-center bg-indigo-500/10 rounded-full border border-indigo-500/15 overflow-hidden shadow-sm relative">
              <a 
                href={task.external_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={onViewed}
                className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all border-r border-indigo-500/15"
              >
                <Hash size={10} className="opacity-60" /><span className="tracking-tighter">{task.external_id}</span><ExternalLink size={9} className="opacity-40" />
              </a>
              <button onClick={(e) => { e.stopPropagation(); onPreview(task.external_url); }} className="p-1 px-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all" title={translations[language].task.preview}>
                <Eye size={12} />
              </button>
           </div>
        </div>

        {!isClosed && (
          <div className="flex items-center gap-1.5" ref={menuRef}>
            <div className={`flex items-center bg-white/95 dark:bg-slate-950/95 backdrop-blur-md rounded-full px-1.5 py-1 border border-slate-200 dark:border-slate-800 transition-all duration-300 shadow-xl ${isHovered || isMoveMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}`}>
              <button onClick={(e) => { e.stopPropagation(); setIsMoveMenuOpen(!isMoveMenuOpen); }} className={`p-1.5 rounded-full transition-all ${isMoveMenuOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-indigo-500'}`} title={translations[language].task.move_status}><ArrowRightLeft size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 text-slate-400 hover:text-indigo-500 transition-all"><Pencil size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-slate-400 hover:text-rose-500 transition-all"><Trash2 size={14} /></button>
            </div>
            {isMoveMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-in zoom-in-95 duration-200 p-1.5 ring-1 ring-black/5 dark:ring-white/5 isolate">
                <div className="space-y-1">
                  {Object.values(TaskStatus).map((status) => {
                    const isActive = task.status === status;
                    const theme = statusThemes[status];
                    return (
                      <button 
                        key={status} 
                        onClick={(e) => { e.stopPropagation(); onStatusChange(status); setIsMoveMenuOpen(false); }} 
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-bold transition-all border ${
                          isActive 
                            ? `${theme.active} shadow-sm` 
                            : 'text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full shadow-sm ${theme.dot}`} />
                          <span className="tracking-tight">{statusLabels[status]}</span>
                        </div>
                        {isActive && <CheckCircle2 size={14} strokeWidth={3} className={theme.icon} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {isClosed && (
          <div className="flex items-center gap-2 px-2 py-1 bg-slate-950/50 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/5">
            <Lock size={10} />
            <span>{translations[language].task.closed}</span>
          </div>
        )}
      </div>

      <div className="space-y-3 mb-6 pl-1.5 relative z-20">
        <h4 className={`text-[15px] md:text-[16px] font-black leading-snug tracking-tight transition-colors ${isDone || isClosed ? 'text-slate-400 line-through opacity-50' : isHovered ? 'text-indigo-500' : 'text-slate-900 dark:text-slate-100'}`}>{task.title}</h4>
        {task.description && <p className="text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 font-medium opacity-70 leading-relaxed">{task.description}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-8 pl-1.5 relative z-30">
        <div className="relative" ref={priorityRef}>
          <button 
            disabled={isClosed}
            onClick={(e) => { e.stopPropagation(); setIsPriorityMenuOpen(!isPriorityMenuOpen); }} 
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.05em] px-3 py-1.5 rounded-full border shadow-sm transition-all ${currentPriority.bg} ${currentPriority.text} ${currentPriority.border} ${!isClosed && isHovered ? 'scale-105' : ''} ${isPriorityMenuOpen ? 'ring-2 ring-indigo-500/20' : ''}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${currentPriority.dot} ${!isDone && !isClosed && 'animate-pulse'}`} />{task.priority}
          </button>
          {isPriorityMenuOpen && !isClosed && (
            <div className="absolute left-0 top-full mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] z-[100] overflow-hidden animate-in zoom-in-95 p-1.5 isolate ring-1 ring-black/5 dark:ring-white/5">
                {Object.values(TaskPriority).map((p) => (
                  <button 
                    key={p} 
                    onClick={(e) => { e.stopPropagation(); onPriorityChange(p); setIsPriorityMenuOpen(false); }} 
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                      task.priority === p 
                        ? 'bg-indigo-600 text-white shadow-lg' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${priorityStyles[p].dot}`} />{p}
                  </button>
                ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase bg-slate-50 dark:bg-slate-950 px-3.5 py-1.5 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm"><Clock size={10} className="opacity-40" />{new Date(task.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>

      <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800/50 pl-1.5 relative z-20 gap-3">
        <div className="flex items-center gap-3 group/user min-w-0">
          <div className="relative shrink-0"><img src={userAvatar} className={`w-8 h-8 rounded-xl shadow-md border border-white dark:border-slate-800 transition-transform object-cover ${isHovered ? 'scale-110' : ''}`} alt={userName} /><div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border border-white dark:border-slate-900 rounded-full ${isDone ? 'bg-emerald-500' : 'bg-emerald-500 animate-pulse'}`} /></div>
          <div className="flex flex-col min-w-0"><span className="text-[12px] font-black text-slate-800 dark:text-slate-100 truncate leading-tight">{userName}</span><span className="text-[9px] font-bold text-slate-400 dark:text-slate-700 uppercase tracking-widest">{translations[language].task.assignee}</span></div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {task.is_new && task.status === TaskStatus.TO_DO && (
              <div className="px-2.5 py-1 bg-amber-400 dark:bg-amber-500 text-[9px] font-black text-slate-950 rounded-lg shadow-lg flex items-center gap-1.5 animate-pulse uppercase tracking-tighter border border-white/20">
                <Sparkles size={11} fill="currentColor" />
                <span>NEW</span>
              </div>
          )}
          {task.status === TaskStatus.IN_PROGRESS ? (
            <Timer 
              startedAt={task.in_progress_started_at} 
              baseSeconds={task.total_work_seconds} 
              isPaused={task.is_timer_paused} 
              onPause={onPause} 
              onResume={onResume} 
            />
          ) : isDone ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">{translations[language].task.time_logged}</span>
                <span className="text-[14px] font-black dark:text-white font-mono leading-none tracking-tight">{formatDuration(task.total_work_seconds)}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onCloseToggle(!isClosed); }}
                className={`p-2 rounded-xl border transition-all shadow-sm ${
                  isClosed 
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20' 
                  : 'bg-slate-900 dark:bg-indigo-600 text-white border-white/10 hover:bg-slate-800 dark:hover:bg-indigo-700'
                }`}
                title={isClosed ? translations[language].task.unclose : translations[language].task.close}
              >
                {isClosed ? <Unlock size={14} strokeWidth={2.5} /> : <Lock size={14} strokeWidth={2.5} />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase bg-slate-50 dark:bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner">
                <Calendar size={12} className="opacity-40" />
                <span>{new Date(task.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;