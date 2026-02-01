import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CommitNode, CommitLock, CommitAudit, User, Language } from '../types';
import { CommitGuardService, AuthService } from '../services/taskService';
import { 
  Search, 
  Radio, 
  ChevronLeft, 
  ShieldAlert,
  Zap,
  LayoutGrid,
  CheckCircle2,
  Lock,
  Play
} from 'lucide-react';

import CommitGuardSidebar from './CommitGuardSidebar';
import CommitGuardAnalysis from './CommitGuardAnalysis';
import CommitGuardAudit from './CommitGuardAudit';
import CommitGuardMatrix from './CommitGuardMatrix';
import CommitGuardProjectList from './CommitGuardProjectList';
import CommitGuardProjectDetail from './CommitGuardProjectDetail';
import CommitGuardProjects from './CommitGuardProjects';

interface CommitGuardViewProps {
  user: User;
  onExit: () => void;
  onLogout: () => void;
  language: Language;
  onToggleLanguage: () => void;
}

const CommitGuardView: React.FC<CommitGuardViewProps> = ({ user, onExit, onLogout, language, onToggleLanguage }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'analysis' | 'projects' | 'audit'>(
    (sessionStorage.getItem('cg_commitguard_tab') as any) || 'home'
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    sessionStorage.getItem('cg_commitguard_project_id')
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('cg_commitguard_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (selectedProjectId) {
      sessionStorage.setItem('cg_commitguard_project_id', selectedProjectId);
    } else {
      sessionStorage.removeItem('cg_commitguard_project_id');
    }
  }, [selectedProjectId]);
  
  const [nodes, setNodes] = useState<CommitNode[]>([]);
  const [locks, setLocks] = useState<CommitLock[]>([]);
  const [audit, setAudit] = useState<CommitAudit[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time Subscriptions
  useEffect(() => {
    const unsubNodes = CommitGuardService.subscribeToNodes(user, (updatedNodes) => {
      setNodes(updatedNodes);
    });

    const unsubLocks = CommitGuardService.subscribeToLocks((updatedLocks) => {
      setLocks(updatedLocks);
    });

    const unsubAudit = CommitGuardService.subscribeToAuditArchive((updatedAudit) => {
      setAudit(updatedAudit);
    });

    return () => {
      unsubNodes();
      unsubLocks();
      unsubAudit();
    };
  }, [user]);

  const [allUsers, setAllUsers] = useState<User[]>([]);
  useEffect(() => {
    const fetchUsers = async () => {
      setAllUsers(await AuthService.getUsers());
    };
    fetchUsers();
  }, []);
  const isAdmin = user.role === 'Admin' || user.role === 'Project Leader' || user.role === 'Team Lead';

  // Reverted: Everyone can see all nodes in the registry
  const visibleNodes = nodes;

  const filteredNodes = useMemo(() => {
    return visibleNodes.filter(n => 
      n.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [visibleNodes, searchQuery]);

  const analysisStats = useMemo(() => {
    const today = new Date().toDateString();
    
    // Analysis should look at the global system state
    const todayAudits = audit.filter(a => new Date(a.timestamp).toDateString() === today);
    const syncsToday = todayAudits.filter(a => a.type === 'SYNC_COMPLETE').length;
    const activeDevs = new Set(locks.map(l => l.userId)).size;
    const lockedNodes = locks.length;
    
    const projectLockCount: Record<string, number> = {};
    locks.forEach(l => { projectLockCount[l.nodeId] = (projectLockCount[l.nodeId] || 0) + 1; });
    
    const riskLevel = Object.values(projectLockCount).some(count => count > 1) ? 'HIGH' : 'LOW';
    const heatmap = Array.from({ length: 24 }).map((_, hour) => audit.filter(a => new Date(a.timestamp).getHours() === hour).length);
    
    const devSyncCounts: Record<string, { count: number; avatar: string }> = {};
    audit.forEach(a => {
      if (a.type === 'SYNC_COMPLETE') {
        if (!devSyncCounts[a.userName]) {
          const u = allUsers.find(usr => usr.name === a.userName);
          devSyncCounts[a.userName] = { count: 0, avatar: u?.avatar || '' };
        }
        devSyncCounts[a.userName].count++;
      }
    });
    
    const topSyncers = Object.entries(devSyncCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 10); 
    return { syncsToday, activeDevs, lockedNodes, riskLevel, heatmap, topSyncers, projectLockCount };
  }, [audit, locks, allUsers]);

  const handleAction = async (subNodeId: string, type: 'engage' | 'abort' | 'finalize') => {
    if (!selectedProjectId) return;
    setError(null);
    try {
      if (type === 'engage') await CommitGuardService.engageNode(selectedProjectId, subNodeId, user);
      else if (type === 'abort') await CommitGuardService.abortSync(subNodeId, user);
      else if (type === 'finalize') await CommitGuardService.finalizeSync(subNodeId, user);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleResetRelease = async (nodeId: string) => {
    await CommitGuardService.resetProjectLocks(nodeId, user);
  };

  const handleToggleDone = async (nodeId: string) => {
    const project = nodes.find(n => n.id === nodeId);
    const isCurrentlyDone = project?.doneUserIds?.includes(user.id);
    
    // If transition from Not Done -> Done
    if (!isCurrentlyDone) {
      // Find active lock for this user in this project
      const userLock = locks.find(l => l.nodeId === nodeId && l.userId === user.id);
      if (userLock) {
        await CommitGuardService.finalizeSync(userLock.subNodeId, user);
      }
    }
    
    await CommitGuardService.toggleUserDone(nodeId, user.id);
  };

  const currentProject = nodes.find(n => n.id === selectedProjectId) || null;
  const isCurrentUserDone = currentProject?.doneUserIds?.includes(user.id);
  const isProjectMember = currentProject?.assignedUserIds.includes(user.id);

  return (
    <div className="fixed inset-0 z-[600] flex bg-[#fffcf9] text-[#1e293b] font-sans animate-in fade-in duration-700 overflow-hidden p-6 md:p-8 gap-6 md:gap-10">
      <style>{`
        @keyframes borderRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes blink-session { 0%, 100% { background-color: rgba(255, 255, 255, 0.8); } 50% { background-color: #fff8f5; } }
        @keyframes status-pulse-red { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(2.5); } }
        @keyframes heartbeat-zoom-pill { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        @keyframes shadow-pulse-orange-intense { 0%, 100% { box-shadow: 0 4px 15px rgba(255, 93, 42, 0.2); } 50% { box-shadow: 0 0 35px rgba(255, 93, 42, 0.5); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        /* --- LIQUID BACKGROUND ANIMATIONS --- */
        @keyframes liquid-drift-1 {
          0% { transform: translate(-20%, -20%) scale(1) rotate(0deg); }
          33% { transform: translate(30%, 10%) scale(1.2) rotate(120deg); }
          66% { transform: translate(-10%, 40%) scale(0.8) rotate(240deg); }
          100% { transform: translate(-20%, -20%) scale(1) rotate(360deg); }
        }
        @keyframes liquid-drift-2 {
          0% { transform: translate(40%, 40%) scale(1.1) rotate(0deg); }
          33% { transform: translate(-30%, 10%) scale(0.9) rotate(-120deg); }
          66% { transform: translate(20%, -40%) scale(1.3) rotate(-240deg); }
          100% { transform: translate(40%, 40%) scale(1.1) rotate(-360deg); }
        }
        @keyframes liquid-drift-3 {
          0% { transform: translate(-10%, 60%) scale(0.8); }
          50% { transform: translate(60%, -20%) scale(1.2); }
          100% { transform: translate(-10%, 60%) scale(0.8); }
        }

        .liquid-blob { 
          position: absolute; 
          width: 85vw; 
          height: 85vw; 
          border-radius: 50%; 
          filter: blur(140px); 
          z-index: 0; 
          pointer-events: none; 
          opacity: 0.25;
        }

        .conic-border-wrap { position: relative; z-index: 0; padding: 3px; overflow: hidden; border-radius: 4rem; }
        .conic-border-wrap::before { content: ""; position: absolute; z-index: -1; left: -50%; top: -50%; width: 200%; height: 200%; background: conic-gradient(from 0deg, #ff5d2a, #ffb095, #ff5d2a, transparent, #ff5d2a); animation: borderRotate 4s linear infinite; }
        .animate-blink-session { animation: blink-session 2s infinite ease-in-out; }
        .animate-shadow-pulse-orange-intense { animation: shadow-pulse-orange-intense 1.5s infinite ease-in-out; }
        .animate-status-pulse-red { animation: status-pulse-red 1.2s infinite; }
        .animate-heartbeat-zoom-pill { animation: heartbeat-zoom-pill 2.5s infinite cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        .user-icon-stack { display: flex; align-items: center; }
        .user-icon-stack img { width: 44px; height: 44px; border-radius: 20px; border: 4px solid white; margin-left: -14px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); background: #f1f5f9; object-fit: cover; }
        .user-icon-stack img:first-child { margin-left: 0; }
        .engaged-avatar { width: 72px; height: 72px; border-radius: 24px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; border: 4px solid white; transition: all 0.3s ease; flex-shrink: 0; overflow: hidden; }
        .engaged-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .sidebar-logo-container { width: 58px; height: 58px; border-radius: 16px; background: linear-gradient(to bottom right, #ff5d2a, #d9481b); display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 8px 16px rgba(255, 93, 42, 0.25); transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); flex-shrink: 0; }
        .user-logo-box { width: 58px; height: 58px; border-radius: 20px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; position: relative; box-shadow: 0 8px 20px rgba(0,0,0,0.08); border: 3px solid white; }
        .user-logo-box img { width: 100%; height: 100%; border-radius: inherit; object-fit: cover; }
        .presence-marker { position: absolute; bottom: -2px; right: -2px; width: 18px; height: 18px; background: #10b981; border: 4px solid white; border-radius: 50%; z-index: 2; }
        .nav-pill-active { background: #0f172a !important; color: white !important; border-radius: 2rem !important; box-shadow: 0 15px 30px rgba(2, 6, 23, 0.25); }
        
        /* --- LIQUID BACKGROUND ANIMATIONS --- */
        @keyframes liquid-drift-1 {
          0% { transform: translate(-20%, -20%) scale(1) rotate(0deg); }
          33% { transform: translate(30%, 10%) scale(1.2) rotate(120deg); }
          66% { transform: translate(-10%, 40%) scale(0.8) rotate(240deg); }
          100% { transform: translate(-20%, -20%) scale(1) rotate(360deg); }
        }
        @keyframes liquid-drift-2 {
          0% { transform: translate(40%, 40%) scale(1.1) rotate(0deg); }
          33% { transform: translate(-30%, 10%) scale(0.9) rotate(-120deg); }
          66% { transform: translate(20%, -40%) scale(1.3) rotate(-240deg); }
          100% { transform: translate(40%, 40%) scale(1.1) rotate(-360deg); }
        }
        @keyframes liquid-drift-3 {
          0% { transform: translate(-10%, 60%) scale(0.8); }
          50% { transform: translate(60%, -20%) scale(1.2); }
          100% { transform: translate(-10%, 60%) scale(0.8); }
        }

        .liquid-blob { 
          position: absolute; 
          width: 85vw; 
          height: 85vw; 
          border-radius: 50%; 
          filter: blur(140px); 
          z-index: 0; 
          pointer-events: none; 
          opacity: 0.25;
        }

        .conic-border-wrap { position: relative; z-index: 0; padding: 3px; overflow: hidden; border-radius: 4rem; }
        .conic-border-wrap::before { content: ""; position: absolute; z-index: -1; left: -50%; top: -50%; width: 200%; height: 200%; background: conic-gradient(from 0deg, #ff5d2a, #ffb095, #ff5d2a, transparent, #ff5d2a); animation: borderRotate 4s linear infinite; }
        .animate-blink-session { animation: blink-session 2s infinite ease-in-out; }
        .animate-shadow-pulse-orange-intense { animation: shadow-pulse-orange-intense 1.5s infinite ease-in-out; }
        .animate-status-pulse-red { animation: status-pulse-red 1.2s infinite; }
        .animate-heartbeat-zoom-pill { animation: heartbeat-zoom-pill 2.5s infinite cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        .user-icon-stack { display: flex; align-items: center; }
        .user-icon-stack img { width: 44px; height: 44px; border-radius: 20px; border: 4px solid white; margin-left: -14px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); background: #f1f5f9; object-fit: cover; }
        .user-icon-stack img:first-child { margin-left: 0; }
        .engaged-avatar { width: 72px; height: 72px; border-radius: 24px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; border: 4px solid white; transition: all 0.3s ease; flex-shrink: 0; overflow: hidden; }
        .engaged-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .sidebar-logo-container { width: 58px; height: 58px; border-radius: 16px; background: linear-gradient(to bottom right, #ff5d2a, #d9481b); display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 8px 16px rgba(255, 93, 42, 0.25); transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); flex-shrink: 0; }
        .user-logo-box { width: 58px; height: 58px; border-radius: 20px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; position: relative; box-shadow: 0 8px 20px rgba(0,0,0,0.08); border: 3px solid white; }
        .user-logo-box img { width: 100%; height: 100%; border-radius: inherit; object-fit: cover; }
        .presence-marker { position: absolute; bottom: -2px; right: -2px; width: 18px; height: 18px; background: #10b981; border: 4px solid white; border-radius: 50%; z-index: 2; }
        .nav-pill-active { background: #0f172a !important; color: white !important; border-radius: 2rem !important; box-shadow: 0 15px 30px rgba(2, 6, 23, 0.25); }
        
        /* LIGHTER ORANGE SCROLLBAR FOR COMMITGUARD */
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #ffecd9 transparent; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #ffecd9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ffcaad; }
      `}</style>

      {/* --- LIQUID BACKGROUND LAYERS --- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="liquid-blob bg-[#ff5d2a]" 
          style={{ 
            top: '-20%', 
            left: '-10%', 
            animation: 'liquid-drift-1 35s infinite linear',
            opacity: 0.15
          }} 
        />
        <div 
          className="liquid-blob bg-[#6366f1]" 
          style={{ 
            bottom: '-15%', 
            right: '-10%', 
            animation: 'liquid-drift-2 42s infinite linear',
            opacity: 0.12
          }} 
        />
        <div 
          className="liquid-blob bg-[#f43f5e]" 
          style={{ 
            top: '20%', 
            left: '40%', 
            animation: 'liquid-drift-3 28s infinite linear',
            opacity: 0.08
          }} 
        />
        <div 
          className="liquid-blob bg-[#fbbf24]" 
          style={{ 
            bottom: '20%', 
            left: '10%', 
            animation: 'liquid-drift-1 48s infinite reverse',
            opacity: 0.05
          }} 
        />
      </div>

      <CommitGuardSidebar 
        user={user} 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        activeTab={activeTab} 
        onTabChange={(tab) => { setActiveTab(tab); setSelectedProjectId(null); }}
        onExit={onExit}
        language={language}
        onToggleLanguage={onToggleLanguage}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden z-10 h-full">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between py-4 px-4 mb-2 gap-4 shrink-0">
           <div className="flex items-center gap-4 md:gap-6 animate-in slide-in-from-left-8 duration-1000">
              {(selectedProjectId || activeTab !== 'home') && activeTab !== 'projects' && activeTab !== 'analysis' && (
                <button onClick={() => { setSelectedProjectId(null); setActiveTab('home'); }} className="p-3 md:p-4 bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg hover:bg-white transition-all">
                  <ChevronLeft size={24} strokeWidth={3} />
                </button>
              )}
              {activeTab !== 'projects' && (
                <h2 className="text-[2.2rem] md:text-[3.5rem] lg:text-[4rem] font-black font-heading tracking-tighter text-slate-950 uppercase leading-none truncate drop-shadow-sm">
                  {activeTab === 'analysis' ? 'ANALYSIS' : selectedProjectId ? currentProject?.name : 'DASHBOARD'}
                </h2>
              )}
           </div>

           <div className="flex items-center gap-3 md:gap-5 animate-in slide-in-from-right-8 duration-1000">
              {!selectedProjectId && activeTab === 'home' && (
                 <div className="relative group w-full sm:w-[250px] md:w-[400px]">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff5d2a] transition-colors z-20" size={16} strokeWidth={3} />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Probe registry..." className="pl-14 pr-6 py-4 bg-white/70 border-2 border-white/50 backdrop-blur-xl rounded-full w-full text-sm md:text-base font-bold text-slate-900 shadow-xl outline-none focus:border-[#ff5d2a]/30 transition-all relative z-10" />
                 </div>
              )}
              {selectedProjectId && (
                <div className="flex items-center gap-3">
                  <button 
                    disabled={!isProjectMember}
                    onClick={() => isProjectMember && handleToggleDone(selectedProjectId)} 
                    className={`px-6 md:px-10 py-4 md:py-5 backdrop-blur-2xl border-2 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 md:gap-4 font-heading group whitespace-nowrap ${
                      !isProjectMember 
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60' 
                        : isCurrentUserDone 
                          ? 'bg-[#ff5d2a] text-white border-[#ff5d2a] hover:bg-[#e64a19]' 
                          : 'bg-white/80 border-white/50 text-slate-400 hover:text-emerald-600'
                    }`}
                  >
                    {!isProjectMember ? <Lock size={18} strokeWidth={3} /> : isCurrentUserDone ? <Play size={18} strokeWidth={3} fill="currentColor" /> : <CheckCircle2 size={18} strokeWidth={3} />}
                    {!isProjectMember ? 'ACCESS LOCKED' : isCurrentUserDone ? 'START SYNC' : 'MARK AS DONE'}
                  </button>
                  <button onClick={() => setIsMatrixOpen(true)} className="px-6 md:px-10 py-4 md:py-5 bg-white/80 backdrop-blur-2xl border-2 border-white/5 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] shadow-xl hover:shadow-2xl hover:translate-y-[-4px] active:scale-95 transition-all text-[#ff5d2a] flex items-center gap-3 md:gap-4 font-heading group whitespace-nowrap">
                    <Radio size={18} strokeWidth={3} className="group-hover:rotate-180 transition-transform duration-700" /> RELEASE MATRIX
                  </button>
                </div>
              )}
           </div>
        </header>

        <div className={`flex-1 h-full overflow-y-auto custom-scrollbar px-2 md:px-4 relative z-10 scroll-smooth`}>
          {error && (
            <div className="mb-6 p-6 md:p-10 bg-rose-50/80 backdrop-blur-xl border-2 border-rose-200 rounded-[2.5rem] md:rounded-[4rem] flex items-center gap-6 md:gap-10 text-rose-600 animate-in slide-in-from-top-8 duration-700 shadow-2xl">
               <ShieldAlert size={48} strokeWidth={2.5} className="animate-bounce shrink-0" />
               <div className="space-y-1">
                  <p className="text-[10px] md:text-[12px] font-black uppercase tracking-0.6em opacity-60">System Security Violation</p>
                  <p className="text-xl md:text-2xl font-black tracking-tighter">{error}</p>
               </div>
            </div>
          )}

          {activeTab === 'analysis' && <CommitGuardAnalysis stats={analysisStats} nodes={visibleNodes} />}
          {activeTab === 'home' && !selectedProjectId && <CommitGuardProjectList nodes={filteredNodes} locks={locks} audit={audit} allUsers={allUsers} onSelectProject={setSelectedProjectId} />}
          {activeTab === 'projects' && <CommitGuardProjects nodes={nodes} currentUser={user} locks={locks} onRefresh={() => {}} />}
          {selectedProjectId && currentProject && <CommitGuardProjectDetail user={user} project={currentProject} locks={locks} isAiLoading={false} aiBrief={null} onAction={handleAction} />}
          {activeTab === 'audit' && <CommitGuardAudit audit={audit} />}
          
          <div className="h-10 md:h-16 shrink-0" />
        </div>
      </main>

      <CommitGuardMatrix 
        isOpen={isMatrixOpen} 
        onClose={() => setIsMatrixOpen(false)} 
        currentUser={user}
        selectedProject={currentProject} 
        locks={locks} 
        audit={audit}
        allUsers={allUsers}
        onResetRelease={handleResetRelease}
      />
    </div>
  );
};

export default CommitGuardView;