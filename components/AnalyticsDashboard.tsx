
import React, { useMemo, useState } from 'react';
import { Task, TaskStatus, TaskPriority, Language } from '../types';
import { 
  Zap, 
  Timer, 
  Activity,
  Layers,
  ShieldAlert,
  Clock,
  Target,
  Trophy,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronDown,
  Check,
  Info
} from 'lucide-react';
import { translations } from '../translations';

interface AnalyticsDashboardProps {
  tasks: Task[];
  language: Language;
}

type AnalysisDuration = 'Week' | 'Month' | 'Year';

/**
 * Robust date comparison helper.
 * Prevents timezone shifting by normalizing all inputs to YYYY-MM-DD in local time.
 * For ISO strings (UTC), it ensures we extract the local date components accurately.
 */
const getLocalDateString = (dateInput: Date | string | null | undefined) => {
  if (!dateInput) return '';
  
  // If it's already YYYY-MM-DD
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  
  // Use local components to ensure the string reflects what the user sees in their UI
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ tasks, language }) => {
  const [duration, setDuration] = useState<AnalysisDuration>('Week');
  const [isDurationMenuOpen, setIsDurationMenuOpen] = useState(false);

  const statusLabels = translations[language].statuses;

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = getLocalDateString(now);
    const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE);
    
    // 1. Velocity Engine - Strict Temporal Integrity
    let velocityData: { label: string; doneCount: number; totalCount: number; prevDoneCount: number; growth: number; isFuture: boolean }[] = [];

    if (duration === 'Week') {
      const getMonday = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay(); // Sun=0, Mon=1...
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
      };
      
      const startOfWeek = getMonday(now);

      velocityData = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const dateStr = getLocalDateString(d);
        const isToday = dateStr === todayStr;
        const isFuture = d > now && !isToday;
        
        // --- Metrics Calculation ---
        
        // 1. Completed strictly on this day (Inner Pill)
        const doneCount = tasks.filter(t => 
          t.status === TaskStatus.DONE && 
          getLocalDateString(t.updated_at) === dateStr
        ).length;
        
        // 2. Total Workload distribution (Ghost Bar / Pill Container)
        // We no longer pile "Active No Due Date" tasks onto "Today".
        // Instead, we map tasks to their due date OR their creation date if no due date exists.
        // This spreads the workload realistically across the timeline.
        const workloadCount = tasks.filter(t => {
          const targetDate = t.due_date ? getLocalDateString(t.due_date) : getLocalDateString(t.created_at);
          return targetDate === dateStr;
        }).length;

        // Ensure total bar is at least as high as the done count (safety check)
        const totalCount = Math.max(workloadCount, doneCount);
        
        // 3. Growth Comparison (Previous Period)
        const prevD = new Date(d);
        prevD.setDate(prevD.getDate() - 7);
        const prevDateStr = getLocalDateString(prevD);
        const prevDoneCount = tasks.filter(t => 
          t.status === TaskStatus.DONE && 
          getLocalDateString(t.updated_at) === prevDateStr
        ).length;
        
        return {
          label: d.toLocaleDateString(language === 'EN' ? 'en-US' : language === 'JA' ? 'ja-JP' : 'th-TH', { weekday: 'short' }),
          doneCount,
          totalCount,
          prevDoneCount,
          growth: prevDoneCount === 0 ? (doneCount > 0 ? 100 : 0) : ((doneCount - prevDoneCount) / prevDoneCount) * 100,
          isFuture
        };
      });
    } else if (duration === 'Month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

      velocityData = Array.from({ length: daysInMonth }).map((_, i) => {
        const d = new Date(startOfMonth);
        d.setDate(i + 1);
        const dateStr = getLocalDateString(d);
        
        const doneCount = tasks.filter(t => t.status === TaskStatus.DONE && getLocalDateString(t.updated_at) === dateStr).length;
        const workloadCount = tasks.filter(t => {
          const targetDate = t.due_date ? getLocalDateString(t.due_date) : getLocalDateString(t.created_at);
          return targetDate === dateStr;
        }).length;

        const prevD = new Date(d);
        prevD.setMonth(prevD.getMonth() - 1);
        const prevDoneCount = tasks.filter(t => t.status === TaskStatus.DONE && getLocalDateString(t.updated_at) === getLocalDateString(prevD)).length;
        
        return {
          label: (i + 1).toString(),
          doneCount,
          totalCount: Math.max(workloadCount, doneCount),
          prevDoneCount,
          growth: prevDoneCount === 0 ? (doneCount > 0 ? 100 : 0) : ((doneCount - prevDoneCount) / prevDoneCount) * 100,
          isFuture: d > now && getLocalDateString(d) !== todayStr
        };
      });
    } else if (duration === 'Year') {
      velocityData = Array.from({ length: 12 }).map((_, i) => {
        const monthIndex = i;
        const year = now.getFullYear();
        const isFutureMonth = monthIndex > now.getMonth();
        
        const doneCount = tasks.filter(t => {
          const taskDate = new Date(t.updated_at);
          return t.status === TaskStatus.DONE && taskDate.getMonth() === monthIndex && taskDate.getFullYear() === year;
        }).length;
        
        const workloadCount = tasks.filter(t => {
          const taskDate = new Date(t.due_date || t.created_at);
          return taskDate.getMonth() === monthIndex && taskDate.getFullYear() === year;
        }).length;

        const prevDoneCount = tasks.filter(t => {
          const taskDate = new Date(t.updated_at);
          return t.status === TaskStatus.DONE && taskDate.getMonth() === monthIndex && taskDate.getFullYear() === (year - 1);
        }).length;

        return {
          label: new Date(year, monthIndex, 1).toLocaleDateString(language === 'EN' ? 'en-US' : language === 'JA' ? 'ja-JP' : 'th-TH', { month: 'short' }),
          doneCount,
          totalCount: Math.max(workloadCount, doneCount),
          prevDoneCount,
          growth: prevDoneCount === 0 ? (doneCount > 0 ? 100 : 0) : ((doneCount - prevDoneCount) / prevDoneCount) * 100,
          isFuture: isFutureMonth
        };
      });
    }

    const totalDoneThisPeriod = velocityData.reduce((acc, d) => acc + d.doneCount, 0);
    const totalDoneLastPeriod = velocityData.reduce((acc, d) => acc + d.prevDoneCount, 0);
    const trend = totalDoneLastPeriod === 0 ? 100 : ((totalDoneThisPeriod - totalDoneLastPeriod) / totalDoneLastPeriod) * 100;

    // 2. Performance Metrics
    const cutoffDate = duration === 'Week' 
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
      : duration === 'Month'
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : new Date(now.getFullYear(), 0, 1);

    const filteredCompletedTasks = completedTasks.filter(t => new Date(t.updated_at) >= cutoffDate);
    const avgLeadTime = filteredCompletedTasks.length > 0 
      ? filteredCompletedTasks.reduce((acc, t) => acc + (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()), 0) / filteredCompletedTasks.length / (1000 * 60 * 60)
      : 0;

    const totalManHours = tasks.reduce((acc, t) => acc + t.total_work_seconds, 0) / 3600;

    const statusAnalysis = Object.values(TaskStatus).map(status => {
      const count = tasks.filter(t => t.status === status).length;
      const pct = (count / (tasks.length || 1)) * 100;
      return { status, count, pct, isSaturated: status !== TaskStatus.DONE && pct > 45 };
    });

    const priorityCounts = {
      [TaskPriority.URGENT]: tasks.filter(t => t.priority === TaskPriority.URGENT).length,
      [TaskPriority.HIGH]: tasks.filter(t => t.priority === TaskPriority.HIGH).length,
      [TaskPriority.MEDIUM]: tasks.filter(t => t.priority === TaskPriority.MEDIUM).length,
      [TaskPriority.LOW]: tasks.filter(t => t.priority === TaskPriority.LOW).length,
    };

    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
    const healthIndex = Math.max(0, Math.min(100, (completionRate * 0.9) - (priorityCounts[TaskPriority.URGENT] * 4) + 10));

    return {
      velocityData,
      trend,
      totalDoneThisPeriod,
      statusAnalysis,
      healthIndex,
      avgLeadTime,
      totalManHours,
      totalTasks: tasks.length,
      completionRate,
      priorityCounts,
      activeTasks: tasks.filter(t => t.status !== TaskStatus.DONE).length
    };
  }, [tasks, language, duration]);

  const maxTotalInView = Math.max(...stats.velocityData.map(d => d.totalCount), 1);
  const targetThreshold = Math.ceil(maxTotalInView * 0.75) || 5;

  return (
    <div className="space-y-10 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 01. PERFORMANCE OVERVIEW HERO */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 p-10 bg-slate-900 text-white rounded-[3rem] relative overflow-hidden shadow-2xl border border-white/5 group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-125" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 rounded-full border border-indigo-500/30">
                  <Target size={14} className="text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">Operational Integrity</span>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setIsDurationMenuOpen(!isDurationMenuOpen)}
                    className="flex items-center gap-2 px-4 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg"
                  >
                    <Calendar size={12} />
                    {duration}
                    <ChevronDown size={12} className={`transition-transform duration-300 ${isDurationMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isDurationMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-32 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in zoom-in-95 duration-200 p-1.5">
                      {(['Week', 'Month', 'Year'] as AnalysisDuration[]).map((d) => (
                        <button
                          key={d}
                          onClick={() => { setDuration(d); setIsDurationMenuOpen(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            duration === d ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {d}
                          {duration === d && <Check size={10} strokeWidth={3} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <h2 className="text-5xl font-black tracking-tighter">Project <span className="text-indigo-400">Health</span> Index</h2>
              <p className="text-slate-400 font-bold text-sm max-w-sm">Weighted efficiency score derived from completion rates and critical task resolution.</p>
            </div>
            <div className="flex items-center gap-8">
               <div className="text-center">
                  <p className="text-7xl font-black tracking-tighter text-indigo-400">{Math.round(stats.healthIndex)}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Global Score</p>
               </div>
               <div className="w-px h-16 bg-white/10" />
               <div className="text-center">
                  <p className="text-7xl font-black tracking-tighter text-white">{Math.round(stats.completionRate)}%</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Utilization</p>
               </div>
            </div>
          </div>
        </div>

        <div className="p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-xl flex flex-col justify-between group">
           <div className="space-y-6">
              <div className="flex items-center justify-between">
                 <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 group-hover:rotate-12 transition-transform"><Timer size={20} /></div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg. Cycle Time</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.avgLeadTime.toFixed(1)} <span className="text-sm">hrs</span></p>
                 </div>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800" />
              <div className="flex items-center justify-between">
                 <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20 group-hover:-rotate-12 transition-transform"><Clock size={20} /></div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged Effort</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{Math.round(stats.totalManHours)} <span className="text-sm">hrs</span></p>
                 </div>
              </div>
           </div>
           <div className="mt-8 flex items-center justify-between px-2">
              <div className="flex flex-col">
                 <span className="text-[18px] font-black text-slate-900 dark:text-white leading-none">{stats.totalTasks}</span>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Units</span>
              </div>
              <div className="flex flex-col text-right">
                 <span className="text-[18px] font-black text-indigo-500 leading-none">{stats.activeTasks}</span>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Units</span>
              </div>
           </div>
        </div>
      </div>

      {/* 02. CORE METRICS ENGINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Workflow Velocity Card Redesign with Fixed Alignment */}
        <div className="lg:col-span-8 p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-2xl relative overflow-hidden group">
           <div className="flex flex-col md:flex-row md:items-start justify-between mb-16 gap-6 relative z-10">
              <div className="space-y-1.5">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20">
                       <Activity size={18} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Workflow Velocity</h3>
                 </div>
                 <div className="flex items-center gap-2 pl-11">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{duration} analysis cycle</p>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${stats.trend >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                       {stats.trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                       {Math.abs(Math.round(stats.trend))}% Growth
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col items-center min-w-[110px]">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Done</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">{stats.totalDoneThisPeriod}</span>
                 </div>
                 <div className="px-5 py-3 bg-indigo-600/5 dark:bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex flex-col items-center min-w-[110px]">
                    <span className="text-[8px] font-black text-indigo-500/60 uppercase tracking-widest mb-0.5">Threshold</span>
                    <span className="text-xl font-black text-indigo-500">{targetThreshold}</span>
                 </div>
              </div>
           </div>

           <div className="relative h-72 px-4">
              {/* Threshold Line */}
              <div 
                className="absolute left-0 right-0 border-t-2 border-dashed border-indigo-500/20 z-0 transition-all duration-700"
                style={{ bottom: `${(targetThreshold / maxTotalInView) * 100}%` }}
              >
                 <div className="absolute right-0 -top-5 flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-slate-800 text-indigo-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-indigo-200 dark:border-indigo-900/50">
                    <Info size={8} /> Target Limit
                 </div>
              </div>

              <div className="absolute inset-0 flex items-end justify-between gap-2 md:gap-4 z-10 pb-10">
                {stats.velocityData.map((data, i) => {
                  const totalHeight = (data.totalCount / maxTotalInView) * 100;
                  const doneHeight = data.totalCount > 0 ? (data.doneCount / data.totalCount) * 100 : 0;
                  const isPeak = data.doneCount === maxTotalInView && maxTotalInView > 0;
                  const isInRange = data.doneCount >= targetThreshold;
                  const isCompact = duration === 'Month' || duration === 'Year';

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-5 group/bar h-full">
                      <div className="w-full relative flex items-end justify-center h-full">
                        {/* Workload Container (Pill Shaped) */}
                        <div 
                          className={`absolute inset-x-0 bottom-0 w-full rounded-full transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) ${
                            data.isFuture 
                              ? 'bg-transparent border-2 border-dashed border-slate-200 dark:border-slate-800' 
                              : 'bg-slate-100 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 shadow-inner'
                          }`}
                          style={{ height: `${data.totalCount === 0 && !data.isFuture ? 0 : Math.max(8, totalHeight)}%` }}
                        >
                          {/* Inner Done Metric (Growth Indicator) */}
                          {!data.isFuture && data.doneCount > 0 && (
                            <div 
                              className={`absolute bottom-0 left-0 right-0 rounded-full transition-all duration-1000 delay-100 ${
                                isPeak 
                                  ? 'bg-gradient-to-t from-indigo-700 via-indigo-500 to-indigo-400 shadow-[0_8px_20px_-4px_rgba(79,70,229,0.4)]' 
                                  : isInRange 
                                    ? 'bg-indigo-500 shadow-[0_4px_12px_-2px_rgba(79,70,229,0.3)]'
                                    : 'bg-slate-300 dark:bg-slate-600'
                              }`}
                              style={{ height: `${doneHeight}%` }}
                            />
                          )}
                          <div className="absolute inset-0 rounded-full opacity-0 group-hover/bar:opacity-100 bg-indigo-500/10 transition-opacity pointer-events-none" />
                        </div>

                        {/* Hover Tooltip */}
                        <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-slate-950 text-white rounded-2xl py-3 px-4 opacity-0 group-hover/bar:opacity-100 transition-all scale-75 group-hover/bar:scale-100 shadow-2xl z-50 pointer-events-none min-w-[140px] border border-white/10 isolate">
                           <div className="flex flex-col gap-1.5">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/10 pb-1 mb-1">{data.label} Analysis</span>
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-[10px] font-bold text-slate-400">Capacity:</span>
                                <span className="text-[11px] font-black">{data.totalCount}</span>
                              </div>
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-[10px] font-bold text-emerald-400">Done:</span>
                                <span className="text-[11px] font-black text-emerald-400">{data.doneCount}</span>
                              </div>
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-[10px] font-bold text-amber-400">Open:</span>
                                <span className="text-[11px] font-black text-amber-400">{Math.max(0, data.totalCount - data.doneCount)}</span>
                              </div>
                           </div>
                        </div>
                      </div>

                      {(!isCompact || i % 5 === 0 || duration === 'Year') && (
                        <span className={`text-[9px] font-black transition-colors uppercase tracking-[0.1em] ${isPeak ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                          {data.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
           </div>

           <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 pt-10 border-t border-slate-50 dark:border-slate-800/50">
              <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-gradient-to-t from-indigo-700 to-indigo-400 shadow-sm" />
                 <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Peak Performance</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-indigo-500/90 shadow-sm" />
                 <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">In Range</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-sm" />
                 <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Planned / Entry</span>
              </div>
           </div>
        </div>

        {/* Pipeline Audit */}
        <div className="lg:col-span-4 p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-xl overflow-hidden relative">
           <div className="flex items-center gap-4 mb-10 relative z-10">
              <div className="p-3 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20"><Zap size={18} /></div>
              <div>
                 <h3 className="text-xl font-black text-slate-900 dark:text-white">Pipeline Audit</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bottleneck Detection</p>
              </div>
           </div>

           <div className="space-y-5 relative z-10">
              {stats.statusAnalysis.map((item, i) => (
                <div key={i} className={`p-4 rounded-2xl border transition-all duration-300 ${item.isSaturated ? 'bg-rose-500/5 border-rose-500/20 shadow-lg' : 'bg-slate-50 dark:bg-slate-950 border-transparent hover:border-slate-200 dark:hover:border-slate-800'}`}>
                   <div className="flex justify-between items-center mb-2.5">
                      <div className="flex items-center gap-2">
                         <span className={`text-[11px] font-black uppercase tracking-widest ${item.isSaturated ? 'text-rose-600' : 'text-slate-600 dark:text-slate-400'}`}>
                           {statusLabels[item.status]}
                         </span>
                         {item.isSaturated && <ShieldAlert size={12} className="text-rose-500 animate-pulse" />}
                      </div>
                      <span className="text-[14px] font-black text-slate-900 dark:text-white">{item.count}</span>
                   </div>
                   <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) ${item.isSaturated ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'bg-indigo-500'}`} 
                        style={{ width: `${item.pct}%` }} 
                      />
                   </div>
                </div>
              ))}
           </div>

           <div className="mt-8 p-5 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-600/20 relative group cursor-default">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Trophy size={48} />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">Peak Cycle</p>
              <h4 className="text-lg font-black tracking-tight leading-none mb-1">Optimal Delivery</h4>
              <p className="text-[11px] font-bold opacity-80 leading-snug">Throughput is currently operating within 85% of expected performance.</p>
           </div>
        </div>
      </div>

      {/* 03. TASK COMPLEXITY HEATMAP */}
      <div className="p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[4rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-20" />
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-md space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-800 transition-colors group-hover:border-indigo-500/30">
                <Layers size={14} className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Distribution Intel</span>
              </div>
              <h3 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">Priority <span className="text-indigo-500">Pressure</span></h3>
              <p className="text-[13px] font-bold text-slate-500 leading-relaxed max-w-sm">Cross-sectional analysis of task criticality levels across the entire active workspace.</p>
            </div>

            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-8 w-full px-4">
              {[
                { label: 'Urgent', count: stats.priorityCounts[TaskPriority.URGENT], color: 'bg-rose-500' },
                { label: 'High', count: stats.priorityCounts[TaskPriority.HIGH], color: 'bg-amber-500' },
                { label: 'Medium', count: stats.priorityCounts[TaskPriority.MEDIUM], color: 'bg-indigo-500' },
                { label: 'Low', count: stats.priorityCounts[TaskPriority.LOW], color: 'bg-emerald-500' },
              ].map((p, i) => (
                <div key={i} className="flex flex-col items-center gap-6 group/item">
                   <div className={`w-28 h-28 lg:w-36 lg:h-36 rounded-[2.5rem] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center relative shadow-xl transition-all duration-500 group-hover/item:scale-110 group-hover/item:border-indigo-500/20`}>
                      <span className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white group-hover/item:text-indigo-500 transition-colors">{p.count}</span>
                      <div className={`absolute -top-1.5 -right-1.5 w-7 h-7 ${p.color} border-[4px] border-white dark:border-slate-900 rounded-full shadow-lg transition-transform group-hover/item:rotate-12`} />
                   </div>
                   <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 group-hover/item:text-indigo-500 transition-colors">{p.label}</span>
                </div>
              ))}
            </div>
          </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
