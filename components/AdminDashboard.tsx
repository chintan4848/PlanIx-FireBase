import React, { useMemo, useState, useEffect, useRef } from 'react';
import { User, Language, Task, ActivityLog } from '../types';
import { AuthService, TaskService } from '../services/taskService';
import { translations } from '../translations';
import AdminCenterIcon from './AdminCenterIcon';
import { 
  Users, 
  ShieldCheck, 
  Database, 
  Search, 
  Filter, 
  X, 
  Key, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Settings,
  Terminal,
  Activity,
  Cpu,
  Zap,
  Lock,
  Layers,
  ShieldAlert,
  UserPlus,
  Command,
  Trash2,
  AlertTriangle,
  Fingerprint,
  Network,
  CircleDot,
  Radio,
  Cpu as CpuIcon,
  Circle,
  Ban,
  ArrowRight,
  ChevronDown,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';

interface AdminDashboardProps {
  language: Language;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ language }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Provisioning State
  const [provName, setProvName] = useState('');
  const [provUsername, setProvUsername] = useState('');
  const [provPassword, setProvPassword] = useState('');
  const [provRole, setProvRole] = useState<User['role']>('Member');
  const [isProvRoleOpen, setIsProvRoleOpen] = useState(false);
  const [showProvPassword, setShowProvPassword] = useState(false);

  // Edit State
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<User['role']>('Member');
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [systemUptime, setSystemUptime] = useState(99.98);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allActivities, setAllActivities] = useState<ActivityLog[]>([]);
  
  const t = translations[language].admin;

  const provDropdownRef = useRef<HTMLDivElement>(null);
  const editDropdownRef = useRef<HTMLDivElement>(null);

  const roleOptions: User['role'][] = ['Member', 'Team Lead', 'Project Leader', 'Admin'];
  const roleLabels: Record<User['role'], string> = {
    'Member': 'Member Identity',
    'Team Lead': 'Team Lead Authority',
    'Project Leader': 'Project Leader Authority',
    'Admin': 'Admin Root Access'
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // Check for modifications in the override modal
  const canDeploy = useMemo(() => {
    if (!selectedUser) return false;
    const hasRoleChanged = newRole !== selectedUser.role;
    const hasPasswordChanged = newPassword.trim().length > 0;
    return hasRoleChanged || hasPasswordChanged;
  }, [selectedUser, newRole, newPassword]);

  // Simulate real-time logs
  useEffect(() => {
    const fetchActivities = async () => {
      const flattened = await AuthService.getRecentActivities(15);
      setAllActivities(flattened);
    };
    fetchActivities();
  }, [users]);

  useEffect(() => {
    const init = async () => {
      const user = await AuthService.getCurrentUser();
      setCurrentUser(user);
      const [u, t] = await Promise.all([
        AuthService.getUsers(),
        TaskService.getAllTasksForAdmin()
      ]);
      setUsers(u);
      setAllTasks(t);
    };
    init();

    const interval = setInterval(async () => {
      setSystemUptime(prev => Math.min(100, Math.max(99.9, prev + (Math.random() * 0.02 - 0.01))));
      setCurrentTime(Date.now());
      // Refresh user list periodically to update online flags
      const freshUsers = await AuthService.getUsers();
      setUsers(freshUsers);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (provDropdownRef.current && !provDropdownRef.current.contains(event.target as Node)) {
        setIsProvRoleOpen(false);
      }
      if (editDropdownRef.current && !editDropdownRef.current.contains(event.target as Node)) {
        setIsEditRoleOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setNewPassword('');
    setFeedback(null);
    setIsEditRoleOpen(false);
    setShowEditPassword(false);
  };

  const isUserOnline = (user: User) => {
    if (!user.lastActiveAt) return false;
    const lastActive = new Date(user.lastActiveAt).getTime();
    return (currentTime - lastActive) < 300000; // 5 minutes threshold
  };

  const handleConfirmPurge = async () => {
    if (!currentUser || !userToDelete) return;
    
    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      await AuthService.adminDeleteUser(currentUser.id, userToDelete.id);
      const freshUsers = await AuthService.getUsers();
      setUsers(freshUsers);
      setFeedback({ type: 'success', message: `IDENTITY_PURGED: ${userToDelete.name.toUpperCase()}` });
      setUserToDelete(null);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleProvisionNode = async () => {
    if (!currentUser) return;
    if (!provName || !provUsername || !provPassword) {
      setFeedback({ type: 'error', message: 'All credentials required for provisioning.' });
      return;
    }

    setIsUpdating(true);
    try {
      const newUser = await AuthService.register(provName, provUsername, provPassword);
      if (provRole !== 'Member') {
        await AuthService.adminUpdateUser(currentUser.id, newUser.id, { role: provRole });
      }
      
      const freshUsers = await AuthService.getUsers();
      setUsers(freshUsers);
      setFeedback({ type: 'success', message: 'Identity Provisioned Successfully' });
      
      setTimeout(() => {
        setShowProvisionModal(false);
        setProvName('');
        setProvUsername('');
        setProvPassword('');
        setProvRole('Member');
        setFeedback(null);
        setShowProvPassword(false);
      }, 600); // Drastically reduced from 1500ms
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!currentUser || !selectedUser || !canDeploy) return;
    setIsUpdating(true);
    try {
      const updates: Partial<User> = { role: newRole };
      if (newPassword.trim()) updates.password = newPassword.trim();
      
      await AuthService.adminUpdateUser(currentUser.id, selectedUser.id, updates);
      const freshUsers = await AuthService.getUsers();
      setUsers(freshUsers);
      setFeedback({ type: 'success', message: t.update_success });
      setTimeout(() => {
        setSelectedUser(null);
        setFeedback(null);
        setShowEditPassword(false);
      }, 800);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const isEditingSelf = selectedUser?.id === currentUser?.id;

  return (
    <div className="w-full font-sans relative">
      <style>{`
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        .grid-bg { background-image: radial-gradient(rgba(79, 70, 229, 0.05) 1px, transparent 1px); background-size: 30px 30px; }
        .stat-card-glow:hover { box-shadow: 0 0 50px rgba(79, 70, 229, 0.15); }
        .glitch-hover:hover { animation: glitch-anim 0.2s linear infinite; }
        @keyframes glitch-anim { 
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 1px); }
          40% { transform: translate(-2px, -1px); }
          60% { transform: translate(2px, 1px); }
          80% { transform: translate(2px, -1px); }
          100% { transform: translate(0); }
        }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .presence-pulse { animation: presence-pulse-anim 2s infinite; }
        @keyframes presence-pulse-anim { 
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.2; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes button-shimmer { 0% { left: -100%; } 100% { left: 100%; } }
        .animate-shimmer-fast { animation: button-shimmer 2s infinite; }
      `}</style>

      <div className="w-full pt-2 pb-8 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* --- COMMAND DECK HEADER --- */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 border-b border-slate-200/60 dark:border-slate-800/60 pb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
               <div className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2 shadow-xl shadow-indigo-600/20">
                  <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                  Root Authority
               </div>
               <div className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                  <Terminal size={12} /> SYS_V4.2.0_DEPLOYED
               </div>
            </div>
            <div className="flex items-center gap-4">
              <AdminCenterIcon size={64} className="text-indigo-600 dark:text-indigo-50" />
              <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-none uppercase">
                ADMIN <span className="text-indigo-600 italic">CENTER</span>
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 xl:pt-4">
             <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="PROBE REGISTRY..." 
                  className="pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest outline-none focus:ring-4 ring-indigo-500/5 transition-all w-full md:w-72 shadow-lg" 
                />
             </div>
             <button 
              onClick={() => {
                setProvName('');
                setProvUsername('');
                setProvPassword('');
                setProvRole('Member');
                setFeedback(null);
                setShowProvisionModal(true);
                setShowProvPassword(false);
              }}
              className="px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2.5 group"
             >
                <Zap size={14} className="group-hover:rotate-12 transition-transform" /> Provision Node
             </button>
          </div>
        </div>

        {feedback && feedback.type === 'error' && !selectedUser && !showProvisionModal && !userToDelete && (
          <div className="p-8 bg-rose-500/5 border-2 border-rose-500/10 rounded-[2.5rem] flex items-center gap-8 text-rose-500 animate-in slide-in-from-top-4 duration-500">
            <ShieldAlert size={24} strokeWidth={3} />
            <p className="text-[13px] font-black uppercase tracking-[0.2em] leading-relaxed">{feedback.message}</p>
          </div>
        )}
        {feedback && feedback.type === 'success' && !selectedUser && !showProvisionModal && !userToDelete && (
          <div className="p-8 bg-emerald-500/5 border-2 border-emerald-500/10 rounded-[2.5rem] flex items-center gap-8 text-emerald-500 animate-in slide-in-from-top-4 duration-500">
            <CheckCircle2 size={24} strokeWidth={3} />
            <p className="text-[13px] font-black uppercase tracking-[0.2em] BI-leading-relaxed">{feedback.message}</p>
          </div>
        )}

        {/* --- LIVE TELEMETRY MODULES --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {[
            { label: 'Registered Nodes', val: users.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-600/10', iStyle: 'w-8 h-8' },
            { label: 'Workload Units', val: allTasks.length, icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-50/10', iStyle: 'w-8 h-8' },
            { label: 'Operational Uptime', val: `${systemUptime.toFixed(2)}%`, icon: Activity, color: 'text-sky-500', bg: 'bg-sky-500/10', iStyle: 'w-8 h-8' },
            { label: 'Security Breaches', val: '00', icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50/10', iStyle: 'w-8 h-8' },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3.5rem] p-10 shadow-xl hover:shadow-2xl transition-all duration-500 stat-card-glow group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-1000">
                 <stat.icon size={120} />
              </div>
              <div className="relative z-10 space-y-10">
                 <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-[1.5rem] ${stat.bg} ${stat.color} shadow-sm border border-white/10`}><stat.icon size={24} strokeWidth={2.5} /></div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">{stat.label}</span>
                       <span className="text-[11px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest">Global Registry</span>
                    </div>
                 </div>
                 <h4 className={`text-6xl font-black tracking-tighter ${stat.color}`}>{stat.val}</h4>
              </div>
            </div>
          ))}
        </div>

        {/* --- THE REGISTRY (DATA GRID) --- */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[4rem] shadow-2xl overflow-hidden relative group">
             <div className="grid-bg absolute inset-0 opacity-40" />
             <div className="p-12 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 backdrop-blur-xl relative z-10">
                <div className="flex items-center gap-5">
                   <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20"><Layers size={24} /></div>
                   <div>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Identity Registry</h3>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Authenticated Access Points</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 px-6 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                   <Radio size={12} className="text-indigo-500 animate-pulse" />
                   <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Active Probe</span>
                </div>
             </div>
             <div className="overflow-x-auto scrollbar-none relative z-10">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/30 dark:bg-slate-950/30">
                         <th className="px-12 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Node Identity</th>
                         <th className="px-12 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Access Tier</th>
                         <th className="px-12 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Link Integrity</th>
                         <th className="px-12 py-8 text-right">Overrides</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {filteredUsers.map((user) => {
                        const online = isUserOnline(user);
                        const isSelf = user.id === currentUser?.id;
                        const isAdminT = user.role === 'Admin' || user.role === 'Project Leader' || user.role === 'Team Lead';
                        return (
                          <tr key={user.id} className="node-row group hover:bg-indigo-500/[0.03] transition-colors">
                             <td className="px-12 py-8">
                                <div className="flex items-center gap-6">
                                   <div className="relative shrink-0">
                                      <img src={user.avatar} className="w-14 h-14 rounded-[1.5rem] shadow-xl ring-4 ring-white dark:ring-slate-900 group-hover:scale-110 transition-transform duration-700 object-cover" alt={user.name} />
                                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-4 border-white dark:border-slate-900 rounded-full ${online ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                                      {online && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500/40 rounded-full presence-pulse -z-10" />}
                                   </div>
                                   <div className="flex flex-col">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[17px] font-black text-slate-900 dark:text-white leading-tight">{user.name}</span>
                                        {isSelf && <div className="px-2 py-0.5 bg-indigo-600 text-[8px] font-black uppercase tracking-widest text-white rounded-md">Self</div>}
                                      </div>
                                      <div className="flex items-center gap-4">
                                         <div className="flex items-center gap-2">
                                            <Command size={14} className="text-slate-300" />
                                            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-tighter">UID_{user.id.toUpperCase()}</span>
                                         </div>
                                         <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${online ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-800'}`}>
                                            {online ? <Zap size={8} fill="currentColor" /> : <Circle size={8} />}
                                            {online ? 'Live_Uplink' : 'Dormant'}
                                         </div>
                                      </div>
                                   </div>
                                </div>
                             </td>
                             <td className="px-12 py-8">
                                <div className={`inline-flex items-center gap-2.5 px-5 py-2 rounded-full border text-[11px] font-black uppercase tracking-[0.1em] ${isAdminT ? 'bg-indigo-600 text-white border-transparent shadow-xl shadow-indigo-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-white/5'}`}>
                                   {isAdminT ? <Shield size={14} strokeWidth={3} /> : <Users size={14} strokeWidth={3} />}
                                   {user.role}
                                </div>
                             </td>
                             <td className="px-12 py-8">
                                <div className="flex flex-col gap-2">
                                   <div className="flex items-center gap-2.5">
                                      <div className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                                      <span className={`text-[11px] font-black uppercase tracking-widest ${online ? 'text-slate-900 dark:text-slate-300' : 'text-slate-400'}`}>
                                        {online ? 'Uplink Synced' : 'Sync Lost'}
                                      </span>
                                   </div>
                                   <div className="w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                      <div className={`h-full transition-all duration-1000 ${online ? 'bg-emerald-500 w-full opacity-40' : 'bg-slate-500 w-0'}`} />
                                   </div>
                                </div>
                             </td>
                             <td className="px-12 py-8 text-right">
                                <div className="flex items-center justify-end gap-3 transition-all duration-500">
                                   <button onClick={() => handleEditUser(user)} className="p-4 text-slate-400 rounded-[1.25rem] transition-all shadow-sm">
                                      <Settings size={22} />
                                   </button>
                                   {!isSelf && (
                                     <button onClick={() => setUserToDelete(user)} className="p-4 text-slate-400 rounded-[1.25rem] transition-all shadow-sm group/trash">
                                        <Trash2 size={22} className="transition-transform" />
                                     </button>
                                   )}
                                </div>
                             </td>
                          </tr>
                        );
                      })}
                   </tbody>
                </table>
             </div>
          </div>

          {/* SECURITY AUDIT STREAM */}
          <div className="xl:col-span-4 flex flex-col gap-8">
             <div className="bg-slate-950 p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden flex-1 group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:rotate-6 transition-transform duration-1000"><ShieldAlert size={180} /></div>
                <div className="relative z-10 h-full flex flex-col">
                   <div className="flex items-center justify-between mb-12">
                      <div className="flex items-center gap-5">
                         <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20"><Network size={24} /></div>
                         <div>
                            <h3 className="text-2xl font-black text-white tracking-tight">Security Audit</h3>
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Live Telemetry Feed</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                         <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Live</span>
                      </div>
                   </div>
                   <div className="flex-1 space-y-8 overflow-y-auto scrollbar-none pr-2">
                      {allActivities.map((log, i) => (
                        <div key={log.id} className="flex gap-6 group/log animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${i * 50}ms` }}>
                           <div className="flex flex-col items-center">
                              <div className={`p-2.5 rounded-xl bg-slate-900 border border-white/10 group-hover/log:border-indigo-500 transition-colors ${i === 0 ? 'text-indigo-400 scale-110 shadow-[0_0_20px_rgba(79,70,229,0.3)]' : 'text-slate-500'}`}>
                                 {log.type === 'security' ? <Lock size={14} /> : <Activity size={14} />}
                              </div>
                              {i !== allActivities.length - 1 && <div className="w-[1px] flex-1 bg-white/5 my-2" />}
                           </div>
                           <div className="flex flex-col pb-4">
                              <span className="text-[13px] font-bold text-slate-300 group-hover/log:text-white transition-colors">{log.action}</span>
                              <div className="flex items-center gap-3 mt-2">
                                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.1em]">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                 <div className="w-1 h-1 rounded-full bg-slate-800" />
                                 <span className="text-[10px] font-bold text-indigo-500/50 uppercase tracking-widest">NODE_{log.userId.slice(0, 4).toUpperCase()}</span>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
             <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group cursor-default">
                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-125 transition-transform duration-1000"><CpuIcon size={80} /></div>
                <div className="relative z-10 space-y-4">
                   <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/50">Core Processor Status</p>
                   <h4 className="text-3xl font-black text-white tracking-tight leading-tight">All Operations <br/>Nominal</h4>
                   <div className="flex gap-1.5 pt-2">
                      {Array.from({ length: 15 }).map((_, i) => (
                         <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${i < 13 ? 'bg-white' : 'bg-white/20'}`} style={{ transitionDelay: `${i * 30}ms` }} />
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* --- IDENTITY TERMINATION MODAL --- */}
      {userToDelete && (
        <div className="fixed inset-0 z-[999] bg-transparent backdrop-blur-md animate-in fade-in duration-300 flex items-center justify-center p-4 md:p-8 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] border border-rose-500/10 overflow-hidden animate-in zoom-in-95 duration-500 my-auto">
            <div className="px-8 py-10 bg-gradient-to-br from-rose-600 to-rose-800 text-white relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-[80px]" />
              <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                <div className="p-6 bg-white/15 backdrop-blur-3xl rounded-[2.2rem] border-2 border-white/20 shadow-xl animate-pulse">
                   <AlertTriangle size={50} strokeWidth={2.5} />
                </div>
                <div className="space-y-2">
                   <h2 className="text-3xl font-black tracking-tighter leading-none uppercase">Terminate Node</h2>
                   <p className="text-rose-100 font-bold text-[10px] uppercase tracking-[0.4em] opacity-80">PROTOCOL_CRITICAL_LEVEL_3</p>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-10">
              {feedback && feedback.type === 'error' && (
                <div className="p-6 bg-rose-500/5 border-2 border-rose-500/10 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 text-rose-500">
                   <ShieldAlert size={20} strokeWidth={3} />
                   <p className="text-[11px] font-black uppercase tracking-[0.2em]">{feedback.message}</p>
                </div>
              )}
              <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-[2.2rem] border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 animate-scanline opacity-20" />
                 <p className="text-slate-500 dark:text-slate-400 font-black text-[9px] uppercase tracking-[0.2em] mb-4">Target for Identity Purge:</p>
                 <div className="flex items-center justify-center gap-5">
                    <img src={userToDelete.avatar} className="w-14 h-14 rounded-2xl border-2 border-white dark:border-slate-900 shadow-lg object-cover" alt="" />
                    <div className="text-left min-w-0">
                       <h4 className="text-xl font-black text-slate-900 dark:text-white leading-none truncate">{userToDelete.name}</h4>
                       <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase mt-2 tracking-tighter">NODE_UID: {userToDelete.id.toUpperCase()}</p>
                    </div>
                 </div>
              </div>
              <div className="flex flex-col gap-4">
                 <button onClick={handleConfirmPurge} disabled={isDeleting} className="w-full py-5 bg-rose-600 text-white font-black text-[13px] uppercase tracking-[0.4em] rounded-[1.75rem] shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all flex items-center justify-center gap-4 active:scale-95 border border-white/10 glitch-hover isolate">
                   {isDeleting ? <Loader2 size={24} className="animate-spin" /> : <><Trash2 size={24} strokeWidth={2.5} /> Purge Identity</>}
                 </button>
                 <button onClick={() => setUserToDelete(null)} disabled={isDeleting} className="w-full py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black text-[13px] uppercase tracking-[0.4em] rounded-[1.75rem] border border-slate-200 dark:border-slate-700 transition-all hover:bg-slate-200">Abort Override</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PROVISION NODE MODAL --- */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-[999] bg-transparent backdrop-blur-md animate-in fade-in duration-300 flex items-center justify-center p-4 md:p-8 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden animate-in zoom-in-95 duration-500 my-auto">
            <div className="px-10 py-12 bg-gradient-to-br from-emerald-600 to-teal-700 text-white relative">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/10 rounded-full -mr-40 -mt-40 blur-[80px]" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="p-6 bg-white/20 backdrop-blur-2xl rounded-[2rem] border border-white/20 shadow-2xl">
                    <UserPlus size={32} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-4xl font-black tracking-tighter leading-tight">Provision Node</h2>
                    <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-[0.3em] opacity-80">Security Instance Assignment</p>
                  </div>
                </div>
                <button onClick={() => setShowProvisionModal(false)} className="p-4 bg-white/10 hover:bg-rose-500 text-white rounded-[1.5rem] transition-all border border-white/10 shadow-lg active:scale-95">
                  <X size={24} strokeWidth={3} />
                </button>
              </div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleProvisionNode(); }} className="p-10 space-y-10">
              {feedback && (
                <div className={`p-6 border-2 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 ${feedback.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500' : 'bg-rose-500/5 border-rose-500/10 text-rose-500'}`}>
                   {feedback.type === 'success' ? <CheckCircle2 size={20} strokeWidth={3} /> : <ShieldAlert size={20} strokeWidth={3} />}
                   <p className="text-[11px] font-black uppercase tracking-[0.2em]">{feedback.message}</p>
                </div>
              )}
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3 group/field">
                    <div className="flex items-center gap-3 px-3 text-slate-400"><Terminal size={14} strokeWidth={3} /><label className="text-[10px] font-black uppercase tracking-[0.4em]">Protocol Name</label></div>
                    <input type="text" value={provName} onChange={(e) => setProvName(e.target.value)} placeholder="IDENTITY_ALIAS" className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-[1.8rem] text-slate-900 dark:text-white font-black text-[13px] uppercase tracking-widest focus:border-emerald-600 outline-none transition-all shadow-inner" />
                  </div>
                  <div className="space-y-3 group/field">
                    <div className="flex items-center gap-3 px-3 text-slate-400"><Command size={14} strokeWidth={3} /><label className="text-[10px] font-black uppercase tracking-[0.4em]">Auth UID</label></div>
                    <input type="text" value={provUsername} onChange={(e) => setProvUsername(e.target.value)} placeholder="ACCESS_NODE_ID" className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-[1.8rem] text-slate-900 dark:text-white font-black text-[13px] uppercase tracking-widest focus:border-emerald-600 outline-none transition-all shadow-inner" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3 group/field">
                    <div className="flex items-center gap-3 px-3 text-slate-400"><Key size={14} strokeWidth={3} /><label className="text-[10px] font-black uppercase tracking-[0.4em]">Init Key</label></div>
                    <div className="relative">
                      <input 
                        type={showProvPassword ? "text" : "password"} 
                        value={provPassword} 
                        onChange={(e) => setProvPassword(e.target.value)} 
                        placeholder="••••••••••••" 
                        className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-[1.8rem] text-slate-900 dark:text-white font-black text-[13px] uppercase tracking-[0.4em] focus:border-emerald-600 outline-none transition-all shadow-inner" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowProvPassword(!showProvPassword)} 
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
                      >
                        {showProvPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3 group/field relative" ref={provDropdownRef}>
                    <div className="flex items-center gap-3 px-3 text-slate-400"><ShieldCheck size={14} strokeWidth={3} /><label className="text-[10px] font-black uppercase tracking-[0.4em]">Access Tier</label></div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsProvRoleOpen(!isProvRoleOpen)}
                        className="w-full flex items-center justify-between px-6 py-4 bg-slate-100 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-[1.8rem] text-slate-900 dark:text-white font-black text-[13px] uppercase tracking-widest focus:border-emerald-600 outline-none transition-all shadow-inner h-[64px]"
                      >
                        {roleLabels[provRole]}
                        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isProvRoleOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isProvRoleOpen && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.8rem] shadow-2xl z-[110] overflow-hidden animate-in zoom-in-95 duration-200 origin-bottom">
                          <div className="p-2 space-y-1">
                            {roleOptions.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => { setProvRole(opt); setIsProvRoleOpen(false); }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                                  provRole === opt ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                              >
                                {roleLabels[opt]}
                                {provRole === opt && <Check size={14} strokeWidth={3} />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                 <button type="submit" disabled={isUpdating || !provName || !provUsername || !provPassword} className="w-full py-6 bg-emerald-600 text-white font-black text-[13px] uppercase tracking-[0.5em] rounded-[2rem] shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all flex items-center justify-center gap-6 active:scale-95 disabled:opacity-40 border border-white/10 isolate">
                   {isUpdating ? <Loader2 size={24} className="animate-spin" /> : <><Zap size={24} strokeWidth={2.5} /> Authorize Node</>}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- IDENTITY OVERRIDE MODAL --- */}
      {selectedUser && (
        <div className="fixed inset-0 z-[999] bg-transparent backdrop-blur-md animate-in fade-in duration-300 flex items-center justify-center p-4 md:p-8 overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden animate-in zoom-in-95 duration-500 relative my-auto">
            <div className="px-10 py-12 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white relative">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/10 rounded-full -mr-40 -mt-40 blur-[80px]" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="relative group/avatar">
                    <img src={selectedUser.avatar} className="w-20 h-20 rounded-[2rem] border-4 border-white/20 shadow-2xl transition-transform hover:scale-105 duration-500 object-cover" alt={selectedUser.name} />
                    <div className="absolute -bottom-2 -right-2 p-2.5 bg-indigo-600 rounded-[1rem] border-4 border-slate-900 shadow-xl"><Shield size={16} strokeWidth={3} /></div>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tighter leading-tight">Node Override</h2>
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-2 px-2 py-0.5 bg-white/10 rounded-lg border border-white/10 backdrop-blur-md">
                          <Command size={9} className="text-indigo-300" />
                          <span className="text-white font-bold text-[9px] uppercase tracking-[0.2em] font-mono">UID_{selectedUser.id.toUpperCase()}</span>
                       </div>
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-4 bg-white/10 hover:bg-rose-500 text-white rounded-[1.5rem] transition-all border border-white/10 shadow-lg active:scale-95 group">
                  <X size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
                </button>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(); }} className="p-10 space-y-10 bg-white dark:bg-slate-900">
              {feedback && (
                <div className={`p-6 border-2 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 ${feedback.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500' : 'bg-rose-500/5 border-rose-500/10 text-rose-500'}`}>
                   {feedback.type === 'success' ? <CheckCircle2 size={20} strokeWidth={3} /> : <ShieldAlert size={20} strokeWidth={3} />}
                   <p className="text-[11px] font-black uppercase tracking-[0.2em]">{feedback.message}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-2 text-slate-400">
                    <ShieldCheck size={16} strokeWidth={3} />
                    <label className="text-[10px] font-black uppercase tracking-[0.4em]">Access layer</label>
                  </div>
                  <div className="relative h-[64px]" ref={editDropdownRef}>
                    <button
                      type="button"
                      disabled={isEditingSelf}
                      onClick={() => setIsEditRoleOpen(!isEditRoleOpen)}
                      className={`w-full flex items-center justify-between px-6 py-4 bg-slate-100 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-[1.8rem] text-slate-900 dark:text-white font-black text-[13px] uppercase tracking-widest focus:border-indigo-600 outline-none transition-all shadow-inner h-full ${isEditingSelf ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {roleLabels[newRole]}
                      <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isEditRoleOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isEditRoleOpen && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.8rem] shadow-2xl z-[110] overflow-hidden animate-in zoom-in-95 duration-200 origin-bottom">
                        <div className="p-2 space-y-1">
                          {roleOptions.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => { setNewRole(opt); setIsEditRoleOpen(false); }}
                              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                                newRole === opt ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              {roleLabels[opt]}
                              {newRole === opt && <Check size={14} strokeWidth={3} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-2 text-slate-400">
                    <Key size={16} strokeWidth={3} />
                    <label className="text-[10px] font-black uppercase tracking-[0.4em]">Override Key</label>
                  </div>
                  <div className="relative group/input h-[64px]">
                    <input 
                      type={showEditPassword ? "text" : "password"} 
                      placeholder="MASTER KEY..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-full px-6 bg-slate-100 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-[1.8rem] text-slate-900 dark:text-white font-black text-lg uppercase tracking-[0.3em] focus:border-indigo-600 outline-none transition-all shadow-inner placeholder:text-slate-300 placeholder:text-sm"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-800 hover:text-indigo-500 transition-colors"
                    >
                      {showEditPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                 <button 
                   type="submit"
                   disabled={isUpdating || !canDeploy}
                   className={`w-full py-6 font-black text-[13px] uppercase tracking-[0.5em] rounded-full shadow-2xl transition-all duration-500 flex flex-col items-center justify-center gap-1 border relative overflow-hidden group/deploy isolate disabled:cursor-not-allowed ${
                     canDeploy || isUpdating 
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-800 text-white border-white/20 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(79,70,229,0.6)] active:scale-95' 
                      : 'bg-[#f1f5f9] dark:bg-[#070b14] text-slate-400 dark:text-slate-600 border-slate-200 dark:border-white/5 shadow-none'
                   }`}
                 >
                   {isUpdating ? <Loader2 size={24} className="animate-spin" /> : (
                     <>
                       <div className="flex items-center gap-4">
                         <ShieldCheck size={18} strokeWidth={3} />
                         <span className="relative z-10">Deploy Override Protocol</span>
                       </div>
                       <span className="text-[7px] font-black uppercase tracking-[0.6em] mt-1 opacity-40">System Core Authorization: Level 4</span>
                     </>
                   )}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;