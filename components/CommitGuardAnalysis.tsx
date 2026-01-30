import React from 'react';
import { 
  Users, 
  Lock, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Flame,
  ShieldAlert,
  Info
} from 'lucide-react';
import { CommitNode } from '../types';

interface AnalysisDashboardProps {
  stats: {
    syncsToday: number;
    activeDevs: number;
    lockedNodes: number;
    riskLevel: string;
    heatmap: number[];
    topSyncers: [string, { count: number; avatar: string }][];
    projectLockCount: Record<string, number>;
  };
  nodes: CommitNode[];
}

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="group/info relative inline-block shrink-0">
    <div className="p-2 bg-slate-50 text-slate-300 rounded-[0.7rem] hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-help border border-slate-100 shadow-sm group-hover/info:scale-110">
      {/* FIX: Removed invalid md:size prop */}
      <Info size={14} strokeWidth={3} />
    </div>
    
    <div className="absolute top-full right-0 mt-3 px-5 py-3.5 bg-white text-slate-900 text-[10px] font-black uppercase tracking-[0.1em] rounded-[1.2rem] opacity-0 group-hover/info:opacity-100 translate-y-2 group-hover/info:translate-y-0 transition-all duration-300 pointer-events-none whitespace-nowrap z-[100] shadow-[0_25px_60px_-12px_rgba(0,0,0,0.15)] border border-slate-100 ring-1 ring-black/5">
      <div className="relative z-10 flex items-center gap-2">
         <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
         {text}
      </div>
      <div className="absolute bottom-full right-3 border-[8px] border-transparent border-b-white" />
    </div>
  </div>
);

const CommitGuardAnalysis: React.FC<AnalysisDashboardProps> = ({ stats, nodes }) => {
  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in zoom-in-95 duration-1000 overflow-visible">
      {/* TOP STAT CARDS GRID - RESPONSIVE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 shrink-0 relative z-50">
        {[
          { label: 'Syncs Today', val: stats.syncsToday, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', info: 'Total finalized synchronization events today' },
          { label: 'Active Devs', val: stats.activeDevs, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50', info: 'Unique operators currently managing node states' },
          { label: 'Locked Nodes', val: stats.lockedNodes, icon: Lock, color: 'text-[#ff5d2a]', bg: 'bg-orange-50', info: 'Committable units currently under exclusive sync' },
          { label: 'Risk Protocol', val: stats.riskLevel, icon: AlertTriangle, color: stats.riskLevel === 'HIGH' ? 'text-rose-500' : 'text-emerald-500', bg: stats.riskLevel === 'HIGH' ? 'bg-rose-50' : 'bg-emerald-50', info: 'System integrity assessment based on sync overlap' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-8 shadow-xl border border-white flex items-center justify-between group/stat hover:translate-y-[-4px] transition-all duration-500 overflow-visible">
            <div className="flex items-center gap-4 md:gap-6 min-w-0">
              {/* FIX: Removed invalid md:size prop */}
              <div className={`p-4 md:p-5 ${stat.bg} ${stat.color} rounded-2xl md:rounded-[1.5rem] group-hover/stat:scale-110 transition-transform shadow-sm border border-white/50 shrink-0`}><stat.icon size={26} strokeWidth={2.5} /></div>
              <div className="min-w-0">
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate">{stat.label}</p>
                <h4 className={`text-3xl md:text-4xl font-black ${stat.color} tracking-tighter leading-none`}>{stat.val}</h4>
              </div>
            </div>
            <InfoTooltip text={stat.info} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
        <div className="xl:col-span-8 flex flex-col gap-6 md:gap-8">
          <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 shadow-2xl border border-white relative flex flex-col group/card overflow-visible">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 shrink-0">
              <div className="flex items-center gap-4 md:gap-5">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20"><Activity size={20} strokeWidth={2.5} /></div>
                <h3 className="text-xl md:text-3xl font-black text-slate-950 tracking-tight italic uppercase">Project Performance Matrix</h3>
              </div>
              <div className="flex justify-end">
                <InfoTooltip text="Comparative density of active synchronization sessions" />
              </div>
            </div>
            <div className="space-y-4 md:space-y-5">
              {nodes.map(node => {
                const lockedCount = stats.projectLockCount[node.id] || 0;
                const hasConflict = lockedCount > 1;
                return (
                  <div key={node.id} className={`p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col sm:flex-row items-center justify-between gap-4 ${hasConflict ? 'bg-rose-50 border-rose-200 shadow-xl' : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-100 hover:shadow-lg'}`}>
                    <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto">
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-black text-lg md:text-xl shadow-inner shrink-0 ${hasConflict ? 'bg-rose-500 text-white animate-pulse' : 'bg-white text-indigo-600 border border-slate-100'}`}>{node.name[0]}</div>
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-lg md:text-xl font-black text-slate-950 leading-none uppercase truncate">{node.name}</p>
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Instance</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 md:gap-10 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 whitespace-nowrap">Engaged Nodes</p>
                        <div className="flex items-center justify-end gap-2 md:gap-3">
                          <span className={`text-xl md:text-2xl font-black ${lockedCount > 0 ? 'text-[#ff5d2a]' : 'text-slate-200'}`}>{lockedCount}</span>
                          {/* FIX: Removed invalid md:size prop */}
                          {hasConflict && <AlertTriangle size={18} className="text-rose-500" />}
                        </div>
                      </div>
                      <div className="w-24 md:w-32 h-1.5 md:h-2 bg-slate-200/50 rounded-full overflow-hidden shadow-inner shrink-0">
                        <div className={`h-full transition-all duration-1000 ${hasConflict ? 'bg-rose-500 w-full shadow-[0_0_10px_#f43f5e]' : lockedCount > 0 ? 'bg-[#ff5d2a] w-1/2' : 'w-0'}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 shadow-xl border border-white relative group/card overflow-hidden">
            {/* FIX: Removed invalid md:size prop */}
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Flame size={180} className="text-[#ff5d2a]" /></div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4 relative z-10">
              <div className="flex items-center gap-4 md:gap-5">
                <div className="p-3 bg-[#ff5d2a] text-white rounded-2xl shadow-xl shadow-orange-500/20"><Clock size={20} strokeWidth={2.5} /></div>
                <h3 className="text-xl md:text-3xl font-black text-slate-950 tracking-tight italic uppercase">Temporal Intensity</h3>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-6">
                 <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] md:tracking-[0.5em] font-mono whitespace-nowrap">24H CYCLE ENGINE</span>
                 <InfoTooltip text="Volume analysis of events across the temporal axis" />
              </div>
            </div>
            <div className="flex items-end gap-1 md:gap-2 h-40 md:h-48 relative z-10 px-2 md:px-4">
              {stats.heatmap.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 md:gap-3 group/bar h-full">
                  <div className="w-full relative flex items-end h-full">
                    <div 
                      className={`w-full rounded-t-lg md:rounded-t-xl transition-all duration-1000 ${count > 5 ? 'bg-[#ff5d2a] shadow-[0_0_20px_#ff5d2a]' : count > 0 ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-slate-100 opacity-60'}`}
                      style={{ height: `${Math.max(10, (count / (Math.max(...stats.heatmap, 1))) * 100)}%` }}
                    />
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 bg-slate-950 text-white rounded-xl text-[9px] font-black opacity-0 group-hover/bar:opacity-100 transition-all scale-75 group-hover/bar:scale-100 shadow-2xl z-50 pointer-events-none border border-white/10 whitespace-nowrap">
                      {count} EVENTS
                    </div>
                  </div>
                  <span className="text-[7px] md:text-[8px] font-black text-slate-400 font-mono hidden sm:block">{i}H</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-6 md:gap-8 overflow-visible">
          <div className="flex-1 bg-white rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 shadow-2xl border border-white flex flex-col group/card overflow-visible">
            <div className="flex items-center justify-between mb-10 shrink-0">
              <div className="flex items-center gap-4 md:gap-5">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20"><TrendingUp size={20} strokeWidth={2.5} /></div>
                <h3 className="text-xl md:text-3xl font-black text-slate-950 tracking-tight italic uppercase">Top Syncers</h3>
              </div>
              <InfoTooltip text="Master engineers ranked by finalized data units" />
            </div>
            <div className="space-y-6 md:space-y-8 pr-2">
              {stats.topSyncers.length > 0 ? stats.topSyncers.map(([name, data], i) => (
                <div key={name} className="flex items-center justify-between group/user animate-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-4 md:gap-5 min-w-0">
                    <div className="relative shrink-0">
                      <img src={data.avatar} className="w-12 h-12 md:w-14 md:h-14 rounded-2xl border-4 border-slate-50 shadow-lg group-hover/user:scale-110 group-hover/user:rotate-2 transition-all duration-500 object-cover" alt="" />
                      <div className="absolute -top-2 -left-2 w-6 h-6 md:w-7 md:h-7 bg-[#ff5d2a] text-white rounded-full flex items-center justify-center text-[8px] md:text-[9px] font-black border-4 border-white shadow-xl">#{i+1}</div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-base md:text-lg font-black text-slate-950 tracking-tight uppercase leading-none mb-1 truncate">{name}</p>
                      <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Authorized Operator</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl md:text-2xl font-black text-indigo-600 italic tracking-tighter leading-none">{data.count}</p>
                    <p className="text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">UNITS</p>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center opacity-20 italic">
                  <Users size={64} className="mx-auto text-slate-300 mb-6" />
                  <p className="text-[12px] font-black uppercase tracking-[0.4em]">Registry Empty</p>
                </div>
              )}
            </div>
            <div className="mt-auto pt-10">
              <div className="p-6 md:p-8 bg-rose-50/50 rounded-[2rem] md:rounded-[2.5rem] border-2 border-rose-100 shadow-sm shrink-0 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/30" />
                <div className="flex items-center gap-3 mb-3 text-rose-600">
                  {/* FIX: Removed invalid md:size prop */}
                  <ShieldAlert size={20} strokeWidth={2.5} />
                  <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">Security Alert</span>
                </div>
                <p className="text-[11px] md:text-[13px] font-bold text-slate-600 leading-relaxed italic">
                  Active multi-node overlap increases protocol collisions by <span className="text-rose-600 font-black">84.2%</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitGuardAnalysis;
