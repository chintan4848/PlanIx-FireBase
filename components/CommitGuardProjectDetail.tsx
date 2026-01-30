
import React, { useState, useEffect } from 'react';
import { CommitNode, CommitLock, User } from '../types';
import { Zap, Lock, Users, Fingerprint, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';
import CommitGuardStatusBadge from './CommitGuardStatusBadge';
import { AuthService } from '../services/taskService';

interface ProjectDetailProps {
  user: User;
  project: CommitNode;
  locks: CommitLock[];
  isAiLoading: boolean;
  aiBrief: string | null;
  onAction: (subNodeId: string, type: 'engage' | 'abort' | 'finalize') => void;
}

const CommitGuardProjectDetail: React.FC<ProjectDetailProps> = ({
  user,
  project,
  locks,
  isAiLoading,
  aiBrief,
  onAction
}) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const users = await AuthService.getUsers();
      setAllUsers(users);
    };
    fetchUsers();
  }, []);

  const getSubNodeLock = (subNodeId: string) => locks.find(l => l.subNodeId === subNodeId);
  
  // Restriction: Only users in the assignedUserIds list can start a sync
  const isProjectMember = project.assignedUserIds.includes(user.id);
  const isCurrentUserDone = project.doneUserIds?.includes(user.id);

  return (
    <div className={`space-y-12 animate-in fade-in slide-in-from-right-12 duration-1000 ${isCurrentUserDone ? 'grayscale-[0.4] opacity-80' : ''}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pb-32">
        {project.subNodes.map((sn) => {
          const lock = getSubNodeLock(sn.id);
          const isLockedByMe = lock?.userId === user.id;
          const lockHolder = lock ? allUsers.find(u => u.id === lock.userId) : null;

          return (
            <div key={sn.id} className={`bg-white rounded-[3rem] md:rounded-[4rem] p-8 md:p-12 border-2 shadow-xl group transition-all duration-700 hover:shadow-2xl ${lock ? 'border-[#ff5d2a]/20' : 'border-white'}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start mb-12 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                     <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500">{sn.type}</span>
                  </div>
                  <h4 className={`text-4xl md:text-6xl font-black font-heading tracking-tighter uppercase leading-none ${lock ? 'animate-text-glow-red' : ''}`}>{sn.name}</h4>
                  <p className="text-lg md:text-xl font-bold text-slate-400">{sn.description}</p>
                </div>
                <CommitGuardStatusBadge status={lock ? 'ACTIVE' : (isCurrentUserDone ? 'SUCCESS' : 'AVAILABLE')} />
              </div>

              <div className="mt-16">
                {!lock ? (
                  isCurrentUserDone ? (
                    <div className="w-full py-8 md:py-10 bg-slate-100 text-slate-400 rounded-[3rem] text-[12px] md:text-[14px] font-black uppercase tracking-[0.4em] text-center border-2 border-dashed border-slate-200 flex items-center justify-center gap-3 cursor-not-allowed">
                       <Lock size={18} className="opacity-50" /> SYNC LOCKED (DONE)
                    </div>
                  ) : isProjectMember ? (
                    <button onClick={() => onAction(sn.id, 'engage')} className="w-full py-8 md:py-10 bg-[#020617] text-white rounded-[3rem] text-[16px] md:text-[18px] font-black uppercase tracking-[0.6em] shadow-2xl hover:bg-slate-800 transition-all active:scale-95">START SYNC</button>
                  ) : (
                    <div className="w-full py-8 md:py-10 bg-slate-50 dark:bg-slate-900/50 text-slate-400 rounded-[3rem] text-[12px] md:text-[14px] font-black uppercase tracking-[0.4em] text-center border-2 border-dashed border-slate-200 dark:border-white/5 flex items-center justify-center gap-3 cursor-not-allowed">
                      <ShieldAlert size={18} className="opacity-50" /> VIEW ONLY MODE
                    </div>
                  )
                ) : isLockedByMe ? (
                  <div className="p-8 md:p-10 bg-white/80 border-2 border-[#ff5d2a]/30 rounded-[3rem] md:rounded-[4rem] flex flex-col shadow-2xl animate-blink-session animate-heartbeat-zoom-pill gap-10 items-center text-center sm:text-left sm:items-start">
                    <div className="flex flex-col sm:flex-row items-center gap-8 w-full">
                      <div className="engaged-avatar shadow-xl animate-shadow-pulse-orange-intense shrink-0">
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none truncate">{user.name}</span>
                        <div className="flex items-center justify-center sm:justify-start gap-2 mt-4">
                          <div className="w-2 h-2 rounded-full bg-[#ff5d2a] animate-ping" />
                          <span className="text-[11px] md:text-[12px] font-black text-[#ff5d2a] uppercase tracking-[0.5em]">Session Engaged</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full pt-4">
                      <button 
                        onClick={() => onAction(sn.id, 'abort')} 
                        className="w-full sm:flex-1 py-5 md:py-6 bg-white text-slate-400 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] border-2 border-slate-100 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm animate-shadow-pulse-orange-intense"
                      >
                        ABORT
                      </button>
                      <button 
                        onClick={() => onAction(sn.id, 'finalize')} 
                        className="w-full sm:flex-1 py-5 md:py-6 bg-[#ff5d2a] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-orange-500/30 hover:bg-[#e64a19] transition-all active:scale-95 animate-shadow-pulse-orange-intense"
                      >
                        FINALIZE
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border-2 border-orange-100 p-8 md:p-12 rounded-[3rem] flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95 duration-700 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#ff5d2a] animate-pulse" />
                    <div className="flex flex-col sm:flex-row items-center gap-6 w-full text-center sm:text-left">
                       <div className="relative shrink-0">
                          <img src={lockHolder?.avatar} className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] border-4 border-white shadow-2xl object-cover" alt="" />
                          <div className="absolute -bottom-2 -right-2 p-3 bg-white rounded-full shadow-lg border border-orange-100">
                             <Activity size={20} className="text-[#ff5d2a] animate-pulse" />
                          </div>
                       </div>
                       <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-center justify-center sm:justify-start gap-2">
                             <span className="px-3 py-1 bg-orange-50 text-[#ff5d2a] rounded-md text-[9px] font-black uppercase tracking-[0.2em] border border-orange-100">UNDER COMMITTING BY OTHERS</span>
                          </div>
                          <h5 className="text-2xl md:text-3xl font-black text-[#020617] tracking-tighter uppercase truncate">{lock.userName}</h5>
                          <div className="flex items-center justify-center sm:justify-start gap-4 text-slate-400">
                             <div className="flex items-center gap-2">
                                <Fingerprint size={12} />
                                <span className="text-[10px] font-black font-mono tracking-tighter">NODE_UID: {lock.userId.slice(0, 8).toUpperCase()}</span>
                             </div>
                             <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-orange-200" />
                             <span className="text-[10px] font-black uppercase tracking-widest">{new Date(lock.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                       </div>
                       <div className="hidden lg:block">
                          <div className="p-6 bg-[#020617] rounded-full text-[#ff5d2a] border border-white/10 shadow-xl">
                             <Lock size={32} />
                          </div>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommitGuardProjectDetail;
