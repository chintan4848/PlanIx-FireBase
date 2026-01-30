import React, { useState } from 'react';
import { CommitNode, CommitLock, CommitAudit, User } from '../types';
import { X, Maximize2, Zap, RotateCcw, CheckCircle2, Circle, AlertCircle, ShieldAlert, Lock } from 'lucide-react';

interface MatrixProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  selectedProject: CommitNode | null;
  locks: CommitLock[];
  audit: CommitAudit[];
  allUsers: User[];
  onResetRelease: (nodeId: string) => void;
}

type ReleaseStatus = 'COMMITTING' | 'COMMITTED' | 'NOT_COMMITTED';

const CommitGuardMatrix: React.FC<MatrixProps> = ({ 
  isOpen, 
  onClose, 
  currentUser,
  selectedProject, 
  locks, 
  audit,
  allUsers,
  onResetRelease
}) => {
  const [showWarning, setShowWarning] = useState(false);

  if (!isOpen || !selectedProject) return null;

  const isAdmin = currentUser.role === 'Admin';
  const isGlobalProjectDone = selectedProject.doneUserIds?.length === selectedProject.assignedUserIds.length;
  
  // Show only the Project Members explicitly assigned to this node.
  const projectUsers = allUsers.filter(u => selectedProject.assignedUserIds.includes(u.id));

  // Check if any node is currently engaged (locked)
  const isAnyNodeLocked = locks.some(l => l.nodeId === selectedProject.id);

  const handleResetClick = () => {
    if (!isAdmin) return;
    // Admins are allowed to force reset even if locks exist; the service will handle decommissioning them.
    onResetRelease(selectedProject.id);
  };

  const getCellStatus = (user: User, subNode: any): ReleaseStatus => {
    const activeLock = locks.find(l => l.subNodeId === subNode.id && l.userId === user.id);
    if (activeLock) return 'COMMITTING';

    const hasCommitted = audit.some(a => 
      a.type === 'SYNC_COMPLETE' && 
      a.userName === user.name && 
      a.nodeName === selectedProject.name &&
      a.subNodeName === subNode.name
    );
    if (hasCommitted) return 'COMMITTED';

    return 'NOT_COMMITTED';
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 md:p-12 bg-slate-950/98 backdrop-blur-3xl animate-in fade-in duration-700">
       <div className="w-full h-full bg-white rounded-[3rem] overflow-hidden flex flex-col relative shadow-2xl border border-slate-200">
          
          {/* HEADER SECTION */}
          <div className="px-10 py-10 md:px-14 md:py-12 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 bg-[#fdfcfa]">
             <div className="flex items-center gap-8 min-w-0">
                <div className={`p-5 rounded-2xl shadow-xl shrink-0 ${isGlobalProjectDone ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>
                  {isGlobalProjectDone ? <CheckCircle2 size={28} strokeWidth={2.5} /> : <Maximize2 size={28} strokeWidth={2.5} />}
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="text-2xl md:text-4xl font-black text-slate-950 uppercase leading-none italic truncate">
                    {selectedProject.name} <span className={isGlobalProjectDone ? 'text-emerald-600' : 'text-[#ff5d2a]'}>Release Matrix</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono truncate">
                      Enterprise Workflow Synchronization Hub
                    </p>
                    {isGlobalProjectDone && (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                         ALL_OPERATORS_SYNCED
                      </span>
                    )}
                  </div>
                </div>
             </div>
             
             <div className="flex items-center gap-5 md:gap-8 shrink-0">
                {isAdmin && (
                  <button 
                    onClick={handleResetClick}
                    className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-sm hover:border-[#ff5d2a] hover:text-[#ff5d2a] transition-all active:scale-95 flex items-center gap-3 group/reset"
                  >
                    <RotateCcw size={16} strokeWidth={3} className="group-hover/reset:rotate-[-180deg] transition-transform duration-700" /> 
                    Reset Release
                  </button>
                )}
                
                <button onClick={onClose} className="p-4 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-90 group shadow-sm">
                   <X size={24} strokeWidth={3} className="text-slate-400 group-hover:text-slate-900" />
                </button>
             </div>
          </div>

          {/* WARNING POPUP - KEPT FOR REFERENCE BUT BYPASSED BY ADMIN OVERRIDE */}
          {showWarning && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2100] w-full max-w-md animate-in zoom-in-95 duration-300">
               <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] border border-rose-100 flex flex-col items-center text-center space-y-6">
                  <div className="p-6 bg-rose-50 text-rose-500 rounded-3xl"><ShieldAlert size={48} /></div>
                  <div className="space-y-2">
                     <h4 className="text-2xl font-black text-slate-900 uppercase">Sync In Progress</h4>
                     <p className="text-slate-500 font-bold text-sm leading-relaxed">Cannot reset release while project nodes are engaged. Wait for all operators to finalize or abort their sessions.</p>
                  </div>
                  <button onClick={() => setShowWarning(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest">Acknowledge</button>
               </div>
            </div>
          )}

          {/* MAIN MATRIX GRID */}
          <div className="flex-1 overflow-auto p-10 bg-white custom-scrollbar relative z-10">
             <div className="inline-block min-w-full">
                <div 
                  className="grid gap-1 border-collapse"
                  style={{ gridTemplateColumns: `300px repeat(${selectedProject.subNodes.length}, minmax(200px, 1fr))` }}
                >
                   {/* POD HEADERS */}
                   <div className="p-6 bg-slate-50 rounded-tl-3xl flex items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Operators</span>
                   </div>
                   {selectedProject.subNodes.map((sn, idx) => (
                     <div key={sn.id} className={`p-8 flex flex-col items-center justify-center text-center bg-slate-50 border-l border-white ${idx === selectedProject.subNodes.length - 1 ? 'rounded-tr-3xl' : ''}`}>
                        <span className="text-[14px] font-black uppercase tracking-[0.1em] text-slate-900">{sn.name}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Uplink Target</span>
                     </div>
                   ))}

                   {/* PROJECT USERS MAPPING */}
                   {projectUsers.length > 0 ? projectUsers.map((dev, uIdx) => {
                     const isDevDone = selectedProject.doneUserIds?.includes(dev.id);
                     return (
                     <React.Fragment key={dev.id}>
                        <div className={`p-8 flex items-center gap-6 border-t relative transition-all duration-500 ${uIdx === projectUsers.length - 1 ? 'rounded-bl-3xl' : ''} ${isDevDone ? 'border-2 border-emerald-500 bg-emerald-50/20 z-10 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]' : 'border-slate-50'}`}>
                           <div className="relative">
                              <img src={dev.avatar} className="w-12 h-12 rounded-xl shadow-md border-2 border-white object-cover" alt="" />
                              {isDevDone && (
                                <div className="absolute -top-1 -right-1 p-1 bg-emerald-500 text-white rounded-full shadow-lg border border-white">
                                   <CheckCircle2 size={10} strokeWidth={3} />
                                </div>
                              )}
                           </div>
                           <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[16px] font-black text-slate-900 truncate leading-none uppercase">{dev.name}</span>
                                {isDevDone && <span className="text-[7px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-widest">DONE</span>}
                              </div>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Authorized Node</span>
                           </div>
                        </div>
                        
                        {selectedProject.subNodes.map((sn, snIdx) => {
                          const status = getCellStatus(dev, sn);
                          return (
                            <div key={sn.id} className={`flex items-center justify-center border-t border-l border-slate-50 transition-all duration-300 ${
                              uIdx === projectUsers.length - 1 && snIdx === selectedProject.subNodes.length - 1 ? 'rounded-br-3xl' : ''
                            } ${isDevDone ? 'bg-emerald-50/20' : ''}`}>
                               {status === 'COMMITTING' && (
                                 <div className="flex flex-col items-center gap-2 group animate-in zoom-in-75">
                                    <Zap size={32} fill="#ff5d2a" className="text-[#ff5d2a] animate-pulse" />
                                    <span className="text-[8px] font-black text-[#ff5d2a] uppercase tracking-widest">Active Sync</span>
                                 </div>
                               )}
                               {status === 'COMMITTED' && (
                                 <div className="flex flex-col items-center gap-2 animate-in fade-in">
                                    <CheckCircle2 size={32} className="text-emerald-500" />
                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Finalized</span>
                                 </div>
                               )}
                               {status === 'NOT_COMMITTED' && (
                                 isDevDone ? (
                                   <div className="flex flex-col items-center gap-1 opacity-20">
                                      <Lock size={12} className="text-slate-400" />
                                      <span className="text-[7px] font-black uppercase">Locked</span>
                                   </div>
                                 ) : (
                                   <div className="w-2 h-2 rounded-full bg-slate-100" />
                                 )
                               )}
                            </div>
                          );
                        })}
                     </React.Fragment>
                   )}) : (
                     <div className="col-span-full py-20 text-center opacity-20 italic text-[11px] font-black uppercase tracking-[0.5em]">No Operators Associated with Node</div>
                   )}
                </div>
             </div>
          </div>

          {/* LEGEND FOOTER BAR */}
          <div className="px-14 py-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-10 bg-[#fdfcfa]">
             <div className="flex flex-wrap items-center justify-center gap-12">
                <div className="flex items-center gap-4">
                   <Zap size={16} fill="#ff5d2a" className="text-[#ff5d2a]" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Committing</span>
                </div>
                <div className="flex items-center gap-4">
                   <CheckCircle2 size={16} className="text-emerald-500" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Committed</span>
                </div>
                <div className="flex items-center gap-4">
                   <CheckCircle2 size={14} className="text-emerald-500" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">User Sync Done</span>
                </div>
                <div className="flex items-center gap-4">
                   <Circle size={10} className="text-slate-200" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Standby</span>
                </div>
             </div>
             
             <div className="px-8 py-3 bg-slate-900 rounded-full text-white flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Project Integrity:</span>
                <span className={`text-[10px] font-black font-mono ${isGlobalProjectDone ? 'text-emerald-400' : 'text-[#ff5d2a]'}`}>{isGlobalProjectDone ? 'FULLY_SYNCED' : 'STABLE_V4'}</span>
             </div>
          </div>
       </div>
    </div>
  );
};

export default CommitGuardMatrix;
