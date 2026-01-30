import React, { useState, useMemo, useEffect } from 'react';
import { CommitNode, User, CommitLock, CommitSubNode, ArchitectureTier } from '../types';
import { CommitGuardService, AuthService } from '../services/taskService';
import { 
  Plus, 
  Trash2, 
  Settings, 
  Users, 
  Check, 
  X, 
  Activity,
  Layers,
  Search,
  Layout,
  Terminal,
  ShieldCheck,
  Database,
  Radio,
  Fingerprint,
  ArrowLeft,
  Sparkles,
  Cpu,
  Info,
  ChevronDown,
  AlignLeft,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  AlertCircle,
  AlertOctagon,
  Command,
  Key
} from 'lucide-react';

interface NodeConfiguratorProps {
  node: CommitNode;
  allUsers: User[];
  allNodes: CommitNode[];
  onSave: (n: CommitNode) => void;
  onCancel: () => void;
}

const ARCHITECTURE_TIERS: ArchitectureTier[] = ['Infrastructure', 'Backend', 'Frontend', 'Database', 'Mobile'];

const NodeConfigurator: React.FC<NodeConfiguratorProps> = ({ node, allUsers, allNodes, onSave, onCancel }) => {
  const [localNode, setLocalNode] = useState<CommitNode>({ ...node });
  const [newSubNodeName, setNewSubNodeName] = useState('');
  const [newSubNodeTier, setNewSubNodeTier] = useState<ArchitectureTier>('Backend');
  const [userSearch, setUserSearch] = useState('');

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.id.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [allUsers, userSearch]);

  const isProjectNameDuplicate = useMemo(() => {
    const trimmed = localNode.name.trim().toUpperCase();
    if (!trimmed) return false;
    return allNodes.some(n => n.id !== localNode.id && n.name.toUpperCase() === trimmed);
  }, [localNode.name, allNodes, localNode.id]);

  const isSubNodeNameDuplicate = useMemo(() => {
    const trimmed = newSubNodeName.trim().toUpperCase();
    if (!trimmed) return false;
    return localNode.subNodes.some(sn => sn.name.toUpperCase() === trimmed);
  }, [newSubNodeName, localNode.subNodes]);

  const toggleUser = (userId: string) => {
    const assigned = localNode.assignedUserIds.includes(userId);
    setLocalNode({
      ...localNode,
      assignedUserIds: assigned 
        ? localNode.assignedUserIds.filter(id => id !== userId)
        : [...localNode.assignedUserIds, userId]
    });
  };

  const addSubNode = () => {
    if (!newSubNodeName.trim() || isSubNodeNameDuplicate) return;
    const sub: CommitSubNode = { 
      id: Math.random().toString(36).substr(2, 9), 
      name: newSubNodeName.toUpperCase(), 
      type: newSubNodeTier,
      description: `System protocol uplink for ${newSubNodeTier}` 
    };
    setLocalNode({ ...localNode, subNodes: [...localNode.subNodes, sub] });
    setNewSubNodeName('');
  };

  const removeSubNode = (id: string) => {
    setLocalNode({ ...localNode, subNodes: localNode.subNodes.filter(sn => sn.id !== id) });
  };

  const isValid = useMemo(() => {
    return (
      localNode.name.trim().length > 0 && 
      localNode.subNodes.length > 0 && 
      !isProjectNameDuplicate
    );
  }, [localNode, isProjectNameDuplicate]);

  return (
    <div className="absolute inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden rounded-[3.5rem] border border-slate-200 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)]">
      {/* HEADER SECTION - ADDED ROUNDED TOP TO PREVENT ARTIFACTS */}
      <header className="px-10 py-12 bg-gradient-to-br from-[#ff5d2a] to-[#d9481b] text-white relative shrink-0 rounded-t-[3.5rem]">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full -mr-40 -mt-40 blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button 
              onClick={onCancel}
              className="p-4 bg-white/15 hover:bg-white/25 rounded-[1.5rem] transition-all border border-white/10 shadow-lg active:scale-95 group"
            >
              <ArrowLeft size={24} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="space-y-1">
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter leading-none uppercase">Provision Registry</h2>
              <p className="text-[10px] font-bold text-orange-100 uppercase tracking-[0.4em] opacity-80 font-mono">NODE_UID: {node.id.toUpperCase()}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={onCancel}
              className="text-[11px] font-black uppercase tracking-[0.4em] text-white/70 hover:text-white transition-colors"
            >
              Discard
            </button>
            <button 
              onClick={() => isValid && onSave(localNode)}
              disabled={!isValid}
              className={`px-10 py-5 rounded-full text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center gap-4 border border-white/10 ${
                isValid 
                  ? 'bg-white text-[#ff5d2a] hover:bg-slate-50 hover:translate-y-[-2px] active:scale-95' 
                  : 'bg-white/20 text-white/40 cursor-not-allowed border-transparent shadow-none'
              }`}
            >
              <ShieldCheck size={20} strokeWidth={2.5} /> Deploy Node
            </button>
          </div>
        </div>
      </header>

      {/* FORM CONTENT BODY */}
      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-10 lg:p-14 bg-[#fffcf9]/30">
         <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 lg:gap-16">
            
            {/* LEFT SECTION: METADATA & SUB-NODES */}
            <div className="xl:col-span-7 space-y-14">
               <section className="space-y-8">
                  <div className="flex items-center gap-5">
                     <div className="p-3.5 bg-orange-50 text-[#ff5d2a] rounded-xl border border-orange-100 shadow-sm"><Info size={20} /></div>
                     <h4 className="text-xl font-black text-[#020617] uppercase tracking-tight">System Identity Metadata</h4>
                  </div>
                  
                  <div className="space-y-8 pl-8 border-l-2 border-slate-100">
                    <div className="space-y-3 group/field">
                       <div className="flex items-center gap-3 px-1 text-slate-400">
                          <Command size={14} strokeWidth={3} />
                          <label className="text-[10px] font-black uppercase tracking-[0.4em]">Registry Key String</label>
                       </div>
                       <input 
                         autoFocus
                         value={localNode.name} 
                         onChange={e => setLocalNode({...localNode, name: e.target.value.toUpperCase()})} 
                         placeholder="E.G. PLANIX_CORE_V4" 
                         className={`w-full px-8 py-5 bg-white border-2 rounded-[2rem] text-xl font-black text-[#020617] focus:border-[#ff5d2a] outline-none transition-all shadow-sm ${isProjectNameDuplicate ? 'border-rose-300 ring-4 ring-rose-500/5' : 'border-slate-100'}`} 
                       />
                       {isProjectNameDuplicate && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest px-4">Conflict: Identifier already exists in registry.</p>}
                    </div>

                    <div className="space-y-3 group/field">
                       <div className="flex items-center gap-3 px-1 text-slate-400">
                          <AlignLeft size={14} strokeWidth={3} />
                          <label className="text-[10px] font-black uppercase tracking-[0.4em]">Operational Description</label>
                       </div>
                       <textarea 
                         value={localNode.description} 
                         onChange={e => setLocalNode({...localNode, description: e.target.value})} 
                         placeholder="Describe the domain orchestration protocol..." 
                         className="w-full h-32 px-8 py-6 bg-white border-2 border-slate-100 rounded-[2rem] text-base font-bold text-slate-600 focus:border-[#ff5d2a] outline-none transition-all shadow-sm resize-none leading-relaxed" 
                       />
                    </div>
                  </div>
               </section>

               <section className="space-y-8">
                  <div className="flex items-center gap-5">
                     <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm"><Layers size={20} /></div>
                     <h4 className="text-xl font-black text-[#020617] uppercase tracking-tight">Logical Sub-Nodes</h4>
                  </div>

                  <div className="space-y-6 pl-8 border-l-2 border-slate-100">
                     <div className={`p-8 border-2 rounded-[3rem] space-y-6 ${isSubNodeNameDuplicate ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex flex-wrap gap-2.5">
                           {ARCHITECTURE_TIERS.map(t => (
                              <button 
                                 key={t}
                                 type="button"
                                 onClick={() => setNewSubNodeTier(t)}
                                 className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${newSubNodeTier === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-300'}`}
                              >
                                 {t}
                              </button>
                           ))}
                        </div>
                        <div className="flex gap-4">
                           <div className="flex-1 relative group">
                             <input 
                               value={newSubNodeName} 
                               onChange={e => setNewSubNodeName(e.target.value.toUpperCase())} 
                               placeholder="IDENTIFIER_TAG..." 
                               className={`w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] text-[13px] font-black uppercase tracking-widest outline-none focus:border-indigo-600 transition-all ${isSubNodeNameDuplicate ? 'border-rose-300' : ''}`} 
                             />
                           </div>
                           <button 
                             onClick={addSubNode} 
                             disabled={!newSubNodeName.trim() || isSubNodeNameDuplicate}
                             className={`p-4 rounded-[1.5rem] shadow-xl transition-all active:scale-90 ${isSubNodeNameDuplicate || !newSubNodeName.trim() ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-[#020617] text-white hover:bg-slate-800'}`}
                           >
                              <Plus size={24} strokeWidth={3} />
                           </button>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {localNode.subNodes.map(sn => (
                          <div key={sn.id} className="px-6 py-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group/sn hover:border-[#ff5d2a] hover:shadow-lg transition-all animate-in slide-in-from-left-4">
                             <div className="flex items-center gap-4 min-w-0">
                                <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl group-hover/sn:text-[#ff5d2a] transition-all">
                                   {sn.type === 'Infrastructure' ? <Cpu size={18} /> : sn.type === 'Backend' ? <Terminal size={18} /> : sn.type === 'Frontend' ? <Layout size={18} /> : sn.type === 'Database' ? <Database size={18} /> : <Radio size={18} />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                   <span className="text-[14px] font-black uppercase tracking-tight truncate text-[#020617]">{sn.name}</span>
                                   <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 opacity-60">{sn.type} UNIT</span>
                                </div>
                             </div>
                             <button onClick={() => removeSubNode(sn.id)} className="p-2 text-slate-300 hover:text-rose-500 rounded-lg transition-all">
                               <Trash2 size={18} />
                             </button>
                          </div>
                        ))}
                     </div>
                  </div>
               </section>
            </div>

            {/* RIGHT SECTION: OPERATOR ACCESS */}
            <div className="xl:col-span-5 h-full">
               <div className="bg-slate-50 rounded-[3rem] p-8 lg:p-10 border border-slate-100 shadow-inner space-y-10 flex flex-col h-full max-h-[750px]">
                  <div className="flex items-center gap-5">
                     <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-sm"><Users size={24} /></div>
                     <div>
                       <h4 className="text-xl font-black text-[#020617] uppercase tracking-tight">Operator Access</h4>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Assign Authorized Nodes</p>
                     </div>
                  </div>

                  <div className="relative shrink-0">
                     <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                     <input 
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="PROBE OPERATORS..."
                        className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-[12px] font-black uppercase tracking-widest outline-none focus:border-emerald-400 transition-all shadow-sm"
                     />
                  </div>

                  <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1">
                     {filteredUsers.map(u => {
                       const isAssigned = localNode.assignedUserIds.includes(u.id);
                       return (
                         <button 
                           key={u.id} 
                           onClick={() => toggleUser(u.id)} 
                           className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${
                             isAssigned 
                               ? 'bg-[#020617] border-[#020617] text-white shadow-xl' 
                               : 'bg-white border-white hover:border-emerald-200 text-slate-500 hover:bg-slate-50'
                           }`}
                         >
                            <div className="flex items-center gap-4 min-w-0">
                               <img src={u.avatar} className={`w-11 h-11 rounded-xl border-2 object-cover shadow-sm ${isAssigned ? 'border-emerald-500' : 'border-white'}`} alt="" />
                               <div className="flex flex-col items-start text-left min-w-0">
                                  <span className="text-[15px] font-black uppercase tracking-tight truncate max-w-[150px]">{u.name}</span>
                                  <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${isAssigned ? 'text-emerald-400' : 'text-slate-400'}`}>ID: {u.id.toUpperCase()}</span>
                               </div>
                            </div>
                            {isAssigned ? (
                              <div className="w-8 h-8 bg-emerald-500 text-[#020617] rounded-full flex items-center justify-center shadow-lg border-2 border-[#020617]">
                                <Check size={16} strokeWidth={4} />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-slate-100 bg-slate-50 shadow-inner" />
                            )}
                         </button>
                       );
                     })}
                  </div>
                  
                  <div className="pt-6 border-t border-slate-200/50 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Selections</span>
                     </div>
                     <span className="text-xl font-black text-[#020617]">{localNode.assignedUserIds.length}</span>
                  </div>
               </div>
            </div>

         </div>
      </div>
    </div>
  );
};

interface ProjectsProps {
  nodes: CommitNode[];
  currentUser: User;
  locks: CommitLock[];
  onRefresh: () => void;
}

const CommitGuardProjects: React.FC<ProjectsProps> = ({ nodes, currentUser, locks, onRefresh }) => {
  const [editingNode, setEditingNode] = useState<CommitNode | null>(null);
  const [deletingNode, setDeletingNode] = useState<CommitNode | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  useEffect(() => {
    const fetchUsers = async () => {
      const u = await AuthService.getUsers();
      setAllUsers(u);
    };
    fetchUsers();
  }, []);

  const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'Project Leader' || currentUser.role === 'Team Lead';

  const isModalOpen = !!editingNode || !!deletingNode;

  const filteredNodes = useMemo(() => {
    let result = nodes;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => n.name.toLowerCase().includes(q));
    }
    return result;
  }, [nodes, searchQuery]);

  const handleSaveNode = async (node: CommitNode) => {
    if (!isAdmin) return;
    if (nodes.find(n => n.id === node.id)) {
      await CommitGuardService.updateNode(node.id, node);
    } else {
      await CommitGuardService.addNode(node);
    }
    setEditingNode(null);
    onRefresh();
  };

  const handleConfirmPurge = async () => {
    if (!isAdmin || !deletingNode) return;
    setIsPurging(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    await CommitGuardService.deleteNode(deletingNode.id);
    setDeletingNode(null);
    setIsPurging(false);
    onRefresh();
  };

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      
      <div className={`flex flex-col gap-8 md:gap-12 h-full transition-all duration-700 ${
        isModalOpen 
          ? 'blur-xl saturate-150 scale-[0.98] opacity-40 pointer-events-none' 
          : 'blur-none scale-100 opacity-100'
      }`}>
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 px-4 shrink-0">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-6xl font-black tracking-tighter text-slate-950 leading-none uppercase italic">
              {isAdmin ? 'MANAGE PROJECTS' : 'PROJECTS'}
            </h1>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-[#ff5d2a] animate-pulse shadow-[0_0_10px_#ff5d2a]" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono">ACTIVE_SYNC_PROTOCOL: ENGAGED</p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
             <div className="relative group flex-1 sm:flex-initial">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff5d2a] transition-colors" size={18} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="PROBE REGISTRY..."
                  className="pl-14 pr-8 py-4 bg-white border border-slate-100 rounded-full w-full sm:w-64 text-[11px] font-black uppercase tracking-widest shadow-xl outline-none focus:ring-4 ring-orange-500/10 transition-all"
                />
             </div>
             {isAdmin && (
               <button 
                 onClick={() => {
                   const id = 'n-' + Math.random().toString(36).substr(2, 5);
                   setEditingNode({ id, name: '', description: '', subNodes: [], assignedUserIds: [] });
                 }}
                 className="px-10 py-4 bg-[#ff5d2a] text-white rounded-full text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-[#e64a19] hover:translate-y-[-2px] active:scale-95 transition-all flex items-center gap-3 whitespace-nowrap"
               >
                  <Plus size={18} strokeWidth={3} /> NEW PROJECT
               </button>
             )}
          </div>
        </div>

        {/* HIDE EXTERNAL SCROLLBAR WHEN MODAL IS ACTIVE TO REMOVE ARTIFACTS */}
        <div className={`flex-1 ${isModalOpen ? 'overflow-hidden' : 'overflow-y-auto'} custom-scrollbar px-4 space-y-5 pb-12`}>
          {filteredNodes.map(node => {
            const isAnyLocked = locks.some(l => l.nodeId === node.id);
            return (
              <div key={node.id} className={`group relative bg-white/70 backdrop-blur-xl rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl border border-white transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) hover:shadow-2xl overflow-hidden flex flex-col h-auto max-h-[85px] md:max-h-[110px] hover:max-h-[1200px] ${isAnyLocked ? 'border-[#ff5d2a]/30' : ''}`}>
                 <div className="flex items-center justify-between px-8 py-6 md:px-12 md:py-10 shrink-0 min-h-[85px] md:min-h-[110px]">
                    <div className="flex items-center gap-8 md:gap-12 flex-1 min-w-0">
                       <div className="hidden lg:flex flex-col opacity-20 shrink-0 group-hover:opacity-40 transition-opacity">
                          <span className="text-[18px] font-black text-slate-500 font-mono tracking-tighter">0{nodes.indexOf(node) + 1}</span>
                       </div>
                       <div className="flex-1 min-w-0 flex items-center gap-6">
                          <h2 className="text-xl md:text-3xl font-black tracking-tighter text-slate-950 leading-none uppercase group-hover:text-[#ff5d2a] transition-all duration-700 truncate drop-shadow-sm">
                            {node.name}
                          </h2>
                          {isAnyLocked && <div className="px-3 py-1 bg-orange-500/10 text-orange-600 text-[8px] font-black rounded-full border border-orange-500/20 animate-pulse tracking-widest">LIVE_SYNC</div>}
                       </div>
                    </div>
                    <div className="flex items-center gap-6 md:gap-10 shrink-0">
                       <div className="user-icon-stack hidden sm:flex">
                          {node.assignedUserIds.slice(0, 4).map((uid) => {
                            const u = allUsers.find(au => au.id === uid);
                            return u ? <img key={uid} src={u.avatar} className="w-8 h-8 md:w-10 md:h-10 rounded-xl border-4 border-white shadow-xl -ml-3 first:ml-0 group-hover:scale-110 transition-transform" alt="" /> : null;
                          })}
                       </div>
                       <div className="p-3 rounded-full bg-slate-50 text-slate-300 group-hover:rotate-180 group-hover:bg-[#ff5d2a] group-hover:text-white transition-all duration-700 shadow-sm border border-slate-100">
                          <ChevronDown size={22} strokeWidth={3} />
                       </div>
                    </div>
                 </div>

                 <div className="opacity-0 group-hover:opacity-100 transition-all duration-700 delay-150 px-12 pb-12 pt-4 border-t border-slate-100/50">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-12 mt-4">
                       <p className="text-base md:text-lg font-bold text-slate-400 leading-relaxed max-w-2xl italic">
                          {node.description || "Active system registry metadata for specialized domain orchestration and real-time synchronization protocol."}
                       </p>
                       <div className="flex items-center gap-4 shrink-0">
                          {isAdmin && (
                            <>
                              <button onClick={() => setEditingNode(node)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center gap-3 group/cfg border border-white/10">
                                <Settings size={18} className="group-hover/cfg:rotate-180 transition-transform duration-1000" /> CONFIGURE
                              </button>
                              <button onClick={() => setDeletingNode(node)} className="p-4 text-slate-400 hover:text-rose-500 transition-all hover:bg-rose-50 rounded-xl">
                                 <Trash2 size={24} />
                              </button>
                            </>
                          )}
                       </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                       {node.subNodes.map(sn => {
                         const lock = locks.find(l => l.subNodeId === sn.id);
                         return (
                           <div key={sn.id} className={`p-8 border-2 rounded-[2rem] flex items-center justify-between transition-all duration-500 ${lock ? 'bg-[#ff5d2a] border-[#ff5d2a] text-white shadow-[0_20px_40px_rgba(255,93,42,0.3)] scale-[1.02]' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:border-orange-200 hover:shadow-xl'}`}>
                              <div className="flex items-center gap-6 min-w-0">
                                 <div className={`p-3.5 rounded-2xl transition-all duration-500 ${lock ? 'bg-white/20' : 'bg-white text-slate-300 shadow-xl border border-slate-50'}`}>
                                    {sn.type === 'Infrastructure' ? <Cpu size={24} /> : <Terminal size={24} />}
                                 </div>
                                 <div className="flex flex-col min-w-0">
                                   <span className="text-[18px] font-black uppercase tracking-tight truncate leading-none">{sn.name}</span>
                                   <span className={`text-[10px] font-black uppercase mt-2 tracking-widest ${lock ? 'text-orange-100' : 'text-slate-400'}`}>{lock ? `ACTIVE: ${lock.userName.split(' ')[0].toUpperCase()}` : sn.type}</span>
                                 </div>
                              </div>
                              {lock && <Radio size={18} className="text-white animate-pulse" />}
                           </div>
                         );
                       })}
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 h-full w-1.5 bg-[#ff5d2a] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL OVERLAYS */}
      {deletingNode && isAdmin && (
        <div className="fixed inset-0 z-[2200] flex items-center justify-center p-4 md:p-8 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-500">
           <div className="w-full max-w-xl bg-white rounded-[4rem] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.8)] p-12 md:p-16 flex flex-col items-center text-center animate-in zoom-in-95 border border-slate-100 my-auto">
              <div className="relative mb-10">
                 <div className="absolute inset-0 bg-rose-500/20 rounded-[2.5rem] blur-2xl animate-pulse" />
                 <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center border-4 border-rose-100 shadow-xl relative">
                   <AlertOctagon size={48} className="text-rose-500" strokeWidth={1.5} />
                 </div>
              </div>
              <h2 className="text-4xl font-black text-slate-950 mb-4 tracking-tighter uppercase italic">Purge Node Registry?</h2>
              <p className="text-slate-500 font-bold text-lg leading-relaxed mb-12 max-w-sm">This action will permanently decommission <span className="text-rose-600 font-black">"{deletingNode.name}"</span> and all its linked sub-node telemetry.</p>
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                 <button onClick={() => setDeletingNode(null)} className="flex-1 py-6 bg-slate-50 text-slate-500 font-black uppercase tracking-[0.4em] text-[12px] rounded-full border-2 border-slate-100 hover:bg-slate-100 transition-all active:scale-95">Abort</button>
                 <button onClick={handleConfirmPurge} disabled={isPurging} className="flex-1 py-6 bg-rose-600 text-white font-black uppercase tracking-[0.4em] text-[12px] rounded-full shadow-2xl shadow-rose-600/30 hover:bg-rose-700 transition-all active:scale-95 flex items-center justify-center gap-4">
                   {isPurging ? <Loader2 size={24} className="animate-spin" /> : <><Trash2 size={20} /> Execute Purge</>}
                 </button>
              </div>
           </div>
        </div>
      )}

      {editingNode && isAdmin && (
        <NodeConfigurator 
          node={editingNode} 
          allUsers={allUsers}
          allNodes={nodes}
          onSave={handleSaveNode} 
          onCancel={() => setEditingNode(null)} 
        />
      )}
    </div>
  );
};

export default CommitGuardProjects;