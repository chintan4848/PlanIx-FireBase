
import React from 'react';
import { CommitNode, CommitLock, User, CommitAudit } from '../types';
import { ArrowRight, User as UserIcon, CheckCircle2, Zap, Clock } from 'lucide-react';

interface ProjectListProps {
  nodes: CommitNode[];
  locks: CommitLock[];
  audit: CommitAudit[];
  allUsers: User[];
  onSelectProject: (id: string) => void;
}

const CommitGuardProjectList: React.FC<ProjectListProps> = ({ 
  nodes, 
  locks, 
  audit,
  allUsers, 
  onSelectProject 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-12">
      {nodes.map((node) => {
        const projectLocks = locks.filter(l => l.nodeId === node.id);
        const isInSync = projectLocks.length > 0;
        const lockHolders = Array.from(new Set(projectLocks.map(l => l.userName.toUpperCase())));

        const CardContent = (
          <div 
            key={node.id} 
            onClick={() => onSelectProject(node.id)}
            className={`cursor-pointer bg-white rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-10 border-2 shadow-xl transition-all duration-700 hover:shadow-2xl hover:translate-y-[-8px] group relative overflow-hidden h-full flex flex-col justify-between ${isInSync ? 'border-transparent' : 'border-white'}`}
          >
            <div className="flex justify-between items-start mb-8 md:mb-10">
              <div className="flex flex-col gap-2.5 min-w-0">
                <div className="px-4 py-1.5 bg-slate-50 rounded-full text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono self-start">PROJECT</div>
                {isInSync && (
                  <div className="px-4 py-1.5 bg-[#ff5d2a] text-white rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] shadow-lg shadow-orange-500/30 animate-pulse flex items-center gap-2 max-w-full">
                    <UserIcon size={10} className="shrink-0" /> <span className="truncate">SYNCING: {lockHolders.join(', ')}</span>
                  </div>
                )}
              </div>
              <div className="p-3 md:p-4 bg-slate-50 text-slate-200 rounded-full group-hover:bg-[#ff5d2a]/10 group-hover:text-[#ff5d2a] transition-all duration-700 shrink-0">
                <ArrowRight size={22} strokeWidth={3} />
              </div>
            </div>
            
            <div className="space-y-3 md:space-y-4 mb-10 md:mb-16 relative z-10">
              <h3 className={`text-3xl md:text-5xl font-black font-heading tracking-tighter leading-[1.1] uppercase group-hover:text-[#ff5d2a] transition-all duration-700`}>{node.name}</h3>
              <p className="text-base md:text-lg font-bold text-slate-500 leading-relaxed max-w-xs opacity-70 line-clamp-3">{node.description}</p>
            </div>

            <div className="mt-auto pt-6 md:pt-8 border-t border-slate-50">
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                   <div className="user-icon-stack">
                    {node.assignedUserIds.map((uid) => {
                      const u = allUsers.find(au => au.id === uid);
                      if (!u) return null;
                      
                      const isCommitting = locks.some(l => l.nodeId === node.id && l.userId === u.id);
                      const isDone = node.doneUserIds?.includes(u.id);

                      return (
                        <div key={uid} className="relative group/avatar">
                          <img 
                            src={u.avatar} 
                            alt={u.name} 
                            className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm transition-all duration-300 -ml-2.5 first:ml-0 group-hover/avatar:scale-125 group-hover/avatar:z-30 object-cover ${isDone ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`} 
                            title={`${u.name} - ${isDone ? 'Done' : isCommitting ? 'Syncing' : 'Standby'}`} 
                          />
                          {isDone && (
                            <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-lg border border-white z-40 scale-75 md:scale-100">
                               <CheckCircle2 size={8} strokeWidth={3} />
                            </div>
                          )}
                          {isCommitting && (
                            <div className="absolute -top-1 -right-1 bg-[#ff5d2a] text-white rounded-full p-0.5 shadow-lg border border-white z-40 animate-pulse scale-75 md:scale-100">
                               <Zap size={8} strokeWidth={3} fill="currentColor" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] md:text-[10px] font-black text-[#ff5d2a] uppercase tracking-[0.3em] md:tracking-[0.4em] font-mono">{node.subNodes.length} SEGMENTS</p>
                  </div>
                </div>

                {/* Audit Summary Mini-Stream */}
                <div className="flex gap-2 items-center overflow-hidden">
                   <Clock size={10} className="text-slate-300 shrink-0" />
                   <div className="flex gap-4 animate-in fade-in duration-1000 whitespace-nowrap overflow-hidden">
                      {audit.filter(a => a.nodeName === node.name).slice(0, 1).map(a => (
                         <span key={a.id} className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">
                            Latest: {a.userName.split(' ')[0]} {a.type.replace('_', ' ')}
                         </span>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        );
        return isInSync ? (
          <div key={node.id} className="conic-border-wrap">{CardContent}</div>
        ) : CardContent;
      })}
    </div>
  );
};

export default CommitGuardProjectList;
