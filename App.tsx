import { doc, getDoc, setDoc, collection } from "firebase/firestore";
import { db } from "./src/firebase";
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import TaskCard from './components/TaskCard';
import EditTaskModal from './components/EditTaskModal';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import LoginModal from './components/LoginModal';
import ProfileView from './components/ProfileView';
import AdminDashboard from './components/AdminDashboard';
import ProductTour from './components/ProductTour';
import CommitGuardView from './components/CommitGuardView';
import { BoardSkeleton, AnalyticsSkeleton, ProfileSkeleton, AdminSkeleton } from './components/Skeletons';
import { Task, TaskStatus, TaskPriority, Project, User, Language } from './types';
import { TaskService, AuthService } from './services/taskService';
import { X, Plus, Pause, Play, Copy, CheckCircle, Database, Hash, Terminal, FileSpreadsheet, Code2, Github, Globe, Linkedin, Mail, Lock, LogOut, Power, AlertTriangle, ShieldAlert, ShieldCheck, ChevronLeft, Sparkles, Cpu, Radio, Target, Zap, ArrowRight, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { translations } from './translations';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'board' | 'analytics' | 'developers' | 'profile' | 'admin'>('board');
  const [appMode, setAppMode] = useState<'planix' | 'commitguard'>('planix');
  const [isOverriding, setIsOverriding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeProjectId, setActiveProjectId] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'All'>('All');
  const [showClosed, setShowClosed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [language, setLanguage] = useState<Language>('EN');
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);

  useEffect(() => {
    const fetchSettings = async () => {
      const themeDocRef = doc(db, "settings", "theme");
      const themeDocSnap = await getDoc(themeDocRef);
      if (themeDocSnap.exists()) {
        setTheme(themeDocSnap.data().value);
      }

      const langDocRef = doc(db, "settings", "language");
      const langDocSnap = await getDoc(langDocRef);
      if (langDocSnap.exists()) {
        setLanguage(langDocSnap.data().value);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const initializeUser = async () => {
      const user = await AuthService.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        const fetchedUsers = await AuthService.getUsers();
        setUsers(fetchedUsers);
        TaskService.setContext(user.id);
        loadAll();
      }
    };
    initializeUser();
  }, []);

  // Temporary: Register Admin User on initial load for testing
  useEffect(() => {
    const registerTempAdmin = async () => {
      const name = "Temporary Admin";
      const username = `admin_${Math.random().toString(36).substring(2, 8)}`;
      const password = `pass_${Math.random().toString(36).substring(2, 8)}`;

      try {
        // Check if an admin user already exists to prevent duplicate registrations on refresh
        const existingUsers = await AuthService.getUsers();
        if (!existingUsers.some(u => u.role === 'Admin')) {
          const adminUser = await AuthService.register(name, username, password);
          console.log("--- Admin User Credentials (Temporary) ---");
          console.log(`Name: ${adminUser.name}`);
          console.log(`Username: ${adminUser.username}`);
          console.log(`Password: ${password}`); // Log the clear-text password
          console.log(`ID: ${adminUser.id}`);
          console.log(`Role: ${adminUser.role}`);
          console.log("-----------------------------------------");
        }
      } catch (error) {
        console.error("Error registering temporary admin user:", error);
      }
    };
    registerTempAdmin();
  }, []); // Run only once on component mount
  
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [bulkIdsInput, setBulkIdsInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ status: TaskStatus; index: number } | null>(null);

  const t_modal = translations[language].modal;
  const t_auth = translations[language].auth;
  const statusLabels = translations[language].statuses;

  // Refined loading logic to only show skeleton on slow transitions or connections
  useEffect(() => {
    const conn = (navigator as any).connection;
    // Check if network is explicitly slow (2G/3G)
    const isSlowEffective = conn && (['slow-2g', '2g', '3g'].includes(conn.effectiveType));
    
    // Threshold before showing skeleton (200ms avoids flickering on fast transitions)
    const showThreshold = 200;
    let skeletonDelayTimer: number;
    let finishLoadingTimer: number;

    // Simulate "slow" API response randomly for demo or always if connection is slow
    const shouldSimulateSlow = isSlowEffective || Math.random() > 0.85;
    const simulatedResponseTime = shouldSimulateSlow ? (isSlowEffective ? 1800 : 1200) : 50;

    if (simulatedResponseTime > showThreshold) {
      // Start a timer that triggers the skeleton after the threshold
      skeletonDelayTimer = window.setTimeout(() => {
        setIsLoading(true);
      }, showThreshold);

      // Finish loading after the simulated response time
      finishLoadingTimer = window.setTimeout(() => {
        setIsLoading(false);
        clearTimeout(skeletonDelayTimer);
      }, simulatedResponseTime);

      return () => {
        clearTimeout(skeletonDelayTimer);
        clearTimeout(finishLoadingTimer);
      };
    } else {
      // If load is fast, ensure skeleton is hidden immediately
      setIsLoading(false);
    }
  }, [activeTab, appMode, activeProjectId]);

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    setUsers(await AuthService.getUsers());
    TaskService.setContext(user.id);
    loadAll();
    
    const tourKey = `atms_tour_seen_${user.id}`;
    const tourDocRef = doc(db, "users", user.id, "settings", "tour");
    const tourDocSnap = await getDoc(tourDocRef);
    if (!tourDocSnap.exists() || tourDocSnap.data().seen !== true) {
      setShowTour(true);
    }
    
    if (!user.email) {
      setActiveTab('profile');
    } else {
      setActiveTab('board');
    }
  };

  const handleCloseTour = async () => {
    if (currentUser) {
      await setDoc(doc(db, "users", currentUser.id, "settings", "tour"), { seen: true });
    }
    setShowTour(false);
  };

  const handleLogoutRequest = () => {
    setShowLogoutConfirm(true);
  };

  const executeLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setTasks([]);
    setShowLogoutConfirm(false);
    setAppMode('planix');
  };

  const handleOverrideRequest = () => {
    setAppMode('commitguard');
  };

  const loadAll = useCallback(async () => {
    if (!currentUser) return;
    TaskService.setContext(currentUser.id);
    const projs = await TaskService.getProjects();
    setProjects(projs);
    if (!activeProjectId && projs.length > 0) {
      setActiveProjectId(projs[0].id);
    }
  }, [activeProjectId, currentUser]);

  const loadTasks = useCallback(async () => {
    if (activeProjectId && currentUser) {
      TaskService.setContext(currentUser.id);
      const projectTasks = await TaskService.getTasks(activeProjectId);
      setTasks([...projectTasks]);
    }
  }, [activeProjectId, currentUser]);

  useEffect(() => { 
    (async () => { await loadAll(); })();
  }, [loadAll]);
  useEffect(() => { 
    (async () => { await loadTasks(); })();
  }, [loadTasks]);

  useEffect(() => {
    const saveTheme = async () => {
      if (theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      await setDoc(doc(db, "settings", "theme"), { value: theme });
    };
    saveTheme();
  }, [theme]);

  useEffect(() => {
    const saveLanguage = async () => {
      await setDoc(doc(db, "settings", "language"), { value: language });
    };
    saveLanguage();
  }, [language]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLanguage = () => setLanguage(prev => prev === 'EN' ? 'JA' : prev === 'JA' ? 'TH' : 'EN');

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  const handleUpdateProjectName = async (newName: string) => {
    const updated = await TaskService.updateProjectName(activeProjectId, newName);
    setProjects(updated);
  };

  const handleCreateTasks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const rawIds = bulkIdsInput.split(/[\s,]+/).filter(id => id.trim() !== '');
    const ids: number[] = Array.from(new Set(rawIds.map(id => parseInt(id.trim(), 10))));
    
    if (ids.length === 0 || ids.some(isNaN)) {
      setError('Please enter valid numeric Redmine IDs.');
      return;
    }

    try {
      const updatedTasks = await TaskService.createTasks(ids, activeProjectId, currentUser.id);
      setTasks([...updatedTasks]);
      setBulkIdsInput('');
      setShowNewTaskModal(false);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error importing tasks.');
    }
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        if (rows.length === 0) { 
          setError("The selected Excel file appears to be empty."); 
          return; 
        }

        const headers = rows[0];
        let targetIndex = headers.findIndex(h => 
          /task\s*id|issue\s*id|external\s*id|^id$|no\.|issue\s*no|ticket/i.test(String(h))
        );

        if (targetIndex === -1) {
          if (headers.length >= 2) targetIndex = 1;
          else if (headers.length === 1) targetIndex = 0;
        }

        const extractedIds = rows.slice(1)
          .map(row => row[targetIndex])
          .filter(val => val !== undefined && val !== null && val !== '' && !isNaN(Number(val)))
          .map(val => Math.floor(Number(val)).toString());

        if (extractedIds.length === 0) { 
          setError("No numeric IDs found in the detected column."); 
          return; 
        }

        setBulkIdsInput(prev => {
          const currentIds = prev.split(/[\s,]+/).filter(id => id.trim() !== '');
          const combined = new Set([...currentIds, ...extractedIds]);
          return Array.from(combined).join(', ');
        });
        
        setError(null);
        if (excelInputRef.current) excelInputRef.current.value = '';
      } catch (err) { 
        setError("Error parsing Excel file. Please try again."); 
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handlePreview = async (url: string, taskId?: string) => {
    if (taskId) {
      const updatedTasks = await TaskService.markAsViewed(taskId);
      setTasks([...updatedTasks]);
    }
    const apiKeyDocRef = doc(db, "settings", "redmine_api_key");
    const apiKeyDocSnap = await getDoc(apiKeyDocRef);
    const apiKey = apiKeyDocSnap.exists() ? apiKeyDocSnap.data().value : null;
    let finalUrl = url.split('#')[0];
    const separator = finalUrl.includes('?') ? '&' : '?';
    if (apiKey && apiKey.trim().length > 5) finalUrl += `${separator}key=${apiKey.trim()}`;
    const width = 1200; const height = 850;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    const popup = window.open(finalUrl, 'RedmineATMSPreview', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
    if (popup) popup.focus(); else alert("Popup was blocked!");
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const updatedTasks = await TaskService.updateTaskStatus(taskId, newStatus);
    setTasks([...updatedTasks]);
  };

  const handlePriorityChange = async (taskId: string, newPriority: TaskPriority) => {
    const updatedTasks = await TaskService.updateTask(taskId, { priority: newPriority });
    setTasks([...updatedTasks]);
  };

  const handleToggleInProgressTimers = async () => {
    const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS);
    if (inProgressTasks.length === 0) return;
    const anyRunning = inProgressTasks.some(t => !t.is_timer_paused && t.in_progress_started_at);
    const updatedTasks = await TaskService.toggleAllTimers(activeProjectId, !anyRunning);
    setTasks([...updatedTasks]);
  };

  const handleCloseAllDone = async () => {
    const updatedTasks = await TaskService.closeAllDoneTasks(activeProjectId);
    setTasks([...updatedTasks]);
  };

  const handleCopyTasks = (status: TaskStatus, columnTasks: Task[]) => {
    if (columnTasks.length === 0) return;
    const label = statusLabels[status];
    const entries = columnTasks.map(t => `${t.external_url}${t.description ? ' - ' + t.description.replace(/\n/g, ' ') : ''}`).join('\n');
    const textToCopy = `${label}\n${entries}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedStatus(status);
      setTimeout(() => setCopiedStatus(null), 2000);
    });
  };

  const filteredTasks = useMemo(() => tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.external_id.toString().includes(searchQuery);
    const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
    const matchesClosed = showClosed || !t.is_closed;
    return matchesSearch && matchesPriority && matchesClosed;
  }), [tasks, searchQuery, filterPriority, showClosed]);

  const handleCopyAllTasks = () => {
    if (filteredTasks.length === 0) return;
    const statuses = [TaskStatus.TO_DO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW, TaskStatus.DONE];
    const parts = statuses.map(status => {
      const colTasks = filteredTasks.filter(t => t.status === status);
      if (colTasks.length === 0) return null;
      const label = statusLabels[status];
      const entries = colTasks.map(t => `${t.external_url}${t.description ? ' - ' + t.description.replace(/\n/g, ' ') : ''}`).join('\n');
      return `${label}\n${entries}`;
    }).filter(Boolean);
    navigator.clipboard.writeText(parts.join('\n\n'));
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleExportPDF = () => {
    if (filteredTasks.length === 0) {
      alert("No tasks available to export based on current filters.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFillColor(79, 70, 229); 
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("PLANIX PROJECT REPORT", 15, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`PROJECT: ${activeProject.name.toUpperCase()}`, 15, 28);
    doc.text(`Updated user : ${currentUser?.name || 'Unknown'}`, 15, 34);
    
    const displayDate = formatDate(new Date());
    doc.text(displayDate, pageWidth - 15, 28, { align: 'right' });

    let y = 60;
    doc.setTextColor(30, 41, 59); 
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Summary Metrics (Filtered View)", 15, y);
    
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const counts = {
      total: filteredTasks.length,
      done: filteredTasks.filter(t => t.status === TaskStatus.DONE).length,
      inProgress: filteredTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      pending: filteredTasks.filter(t => t.status === TaskStatus.TO_DO).length,
      review: filteredTasks.filter(t => t.status === TaskStatus.REVIEW).length,
    };
    
    doc.text(`Total Tasks: ${counts.total}`, 15, y);
    doc.text(`Completed: ${counts.done}`, 70, y);
    doc.text(`In Progress: ${counts.inProgress}`, 120, y);
    doc.text(`Pending/Review: ${counts.pending + counts.review}`, pageWidth - 15, y, { align: 'right' });

    y += 20;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Operational Task Audit", 15, y);
    
    y += 10;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("TASK", 15, y);
    doc.text("STATUS", 160, y);

    doc.setDrawColor(226, 232, 240); 
    doc.line(15, y + 2, pageWidth - 15, y + 2);

    y += 12;
    doc.setFont("helvetica", "normal");
    
    filteredTasks.forEach((task) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(8);
      doc.setTextColor(79, 70, 229); 
      doc.text(task.external_url, 15, y);
      doc.link(15, y - 3, doc.getTextWidth(task.external_url), 4, { url: task.external_url });
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.text(statusLabels[task.status], 160, y);
      y += 10; 
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); 
      doc.text(`© 2026 Planix System Core - Automated Intelligence Report - Page ${i} of ${pageCount}`, pageWidth / 2, 287, { align: 'center' });
    }

    const sanitizedUser = (currentUser?.name || 'User').replace(/\s+/g, '');
    const fileDate = displayDate.replace(/\//g, '_');
    doc.save(`${sanitizedUser}_${fileDate}.pdf`);
  };

  const activeIdCount = useMemo(() => {
    const rawIds = bulkIdsInput.split(/[\s,]+/).filter(id => id.trim() !== '' && !isNaN(parseInt(id)));
    return new Set(rawIds).size;
  }, [bulkIdsInput]);

  const handleDragOverColumn = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const children = Array.from(e.currentTarget.querySelectorAll('[draggable]')) as HTMLElement[];
    let closestIndex = children.length;
    let minDistance = Infinity;
    children.forEach((child, index) => {
      const box = child.getBoundingClientRect();
      const offset = e.clientY - (box.top + box.height / 2);
      if (Math.abs(offset) < minDistance) {
        minDistance = Math.abs(offset);
        closestIndex = offset < 0 ? index : index + 1;
      }
    });
    setDropTarget({ status, index: closestIndex });
  };

  const handleDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (!draggedTaskId || !dropTarget) return;
    const updatedTasks = await TaskService.reorderTask(draggedTaskId, dropTarget.status, dropTarget.index);
    setTasks([...updatedTasks]);
    setDraggedTaskId(null);
    setDropTarget(null);
  };

  const renderColumn = (status: TaskStatus) => {
    const columnTasks = filteredTasks.filter(t => t.status === status);
    const isInProgress = status === TaskStatus.IN_PROGRESS;
    const isDone = status === TaskStatus.DONE;
    const hasRunning = isInProgress && columnTasks.some(t => !t.is_timer_paused && t.in_progress_started_at);
    const isCopied = copiedStatus === status;

    const statusGlows = {
      [TaskStatus.TO_DO]: 'bg-slate-400/20 shadow-slate-400/10',
      [TaskStatus.IN_PROGRESS]: 'bg-indigo-400/20 shadow-indigo-400/10',
      [TaskStatus.REVIEW]: 'bg-amber-400/20 shadow-amber-400/10',
      [TaskStatus.DONE]: 'bg-emerald-400/20 shadow-emerald-400/10',
    };
    
    return (
      <div 
        key={status}
        onDragOver={(e) => handleDragOverColumn(e, status)}
        onDrop={(e) => handleDrop(e, status)}
        className="flex-1 min-w-[280px] md:min-w-[320px] flex flex-col rounded-t-[2rem] bg-slate-100/30 dark:bg-slate-900/30 p-4 md:p-5 border-t border-x border-slate-200/40 dark:border-slate-800/40 h-full"
      >
        <div className="flex items-center justify-between gap-x-4 mb-6 px-1 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-[12px] md:text-[13px] uppercase tracking-[0.2em] relative">
              {statusLabels[status]}
              <div className="absolute -bottom-1.5 left-0 w-6 h-[2.5px] bg-indigo-500 rounded-full" />
            </h3>
            <span className={`${statusGlows[status]} backdrop-blur-md border border-white/10 text-slate-900 dark:text-slate-100 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md ml-1`}>
              {columnTasks.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            {isInProgress && columnTasks.length > 0 && (
              <button onClick={handleToggleInProgressTimers} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black transition-all shadow-sm border ${hasRunning ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-indigo-50/10 text-indigo-500 border-indigo-500/20'}`}>
                {hasRunning ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
                <span className="hidden sm:inline uppercase tracking-widest">{hasRunning ? "Pause" : "Start"}</span>
              </button>
            )}
            {isDone && columnTasks.some(t => !t.is_closed) && (
              <button onClick={handleCloseAllDone} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black bg-slate-900 dark:bg-slate-950 text-slate-300 border border-white/5 shadow-sm transition-all hover:bg-slate-800">
                <Lock size={10} fill="currentColor" />
                <span className="hidden sm:inline uppercase tracking-widest">Close All</span>
              </button>
            )}
            <button onClick={() => handleCopyTasks(status, columnTasks)} disabled={columnTasks.length === 0} className={`p-1.5 rounded-lg transition-all border ${isCopied ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' : 'text-slate-400 dark:text-slate-500 hover:text-indigo-500 hover:bg-white dark:hover:bg-slate-800 border-transparent'}`}>
              {isCopied ? <CheckCircle size={14} /> : <Copy size={14} />}
            </button>
            <button className="text-slate-400 hover:text-indigo-500 transition-all p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg" onClick={() => { setError(null); setShowNewTaskModal(true); }}>
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-10 px-0.5 relative">
          <div className="flex flex-col gap-4 md:gap-5">
            {columnTasks.map((task, index) => {
              const assignee = users.find(u => u.id === (task.assignee_id || task.owner_id));
              return (
                <React.Fragment key={task.id}>
                  {dropTarget?.status === status && dropTarget.index === index && <div className="h-1.5 w-full bg-indigo-500/40 rounded-full animate-pulse" />}
                  <TaskCard 
                    task={task} 
                    language={language} 
                    userName={assignee?.name || 'User'} 
                    userAvatar={assignee?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(task.owner_id)}`}
                    onPause={async () => setTasks([...await TaskService.pauseTimer(task.id)])} 
                    onResume={async () => setTasks([...await TaskService.resumeTimer(task.id)])}
                    onDelete={async () => setTasks([...await TaskService.deleteTask(task.id)])} 
                    onEdit={async () => setEditingTask(task)} 
                    onPreview={(url) => handlePreview(url, task.id)}
                    onStatusChange={async (newStatus) => handleStatusChange(task.id, newStatus)} 
                    onPriorityChange={async (newPriority) => handlePriorityChange(task.id, newPriority)}
                    onViewed={async () => setTasks([...await TaskService.markAsViewed(task.id)])}
                    onCloseToggle={async (closed) => setTasks([...await TaskService.closeTask(task.id, closed)])} 
                    onDragStart={() => setDraggedTaskId(task.id)} 
                    onDragEnd={() => { setDraggedTaskId(null); setDropTarget(null); }} 
                    isDragging={draggedTaskId === task.id}
                  />
                </React.Fragment>
              );
            })}
            {dropTarget?.status === status && dropTarget.index === columnTasks.length && columnTasks.length > 0 && <div className="h-1.5 w-full bg-indigo-500/40 rounded-full animate-pulse" />}
          </div>
        </div>
      </div>
    );
  };

  const DeveloperCard: React.FC<{ dev: any; theme: 'light' | 'dark' }> = ({ dev, theme }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const isDark = theme === 'dark';

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });
    };

    return (
      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className="relative group h-full transition-all duration-500 ease-out hover:scale-[1.03] hover:-translate-y-2"
      >
        <div 
          className="absolute -inset-[2.5px] rounded-[4.1rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(79, 70, 229, 0.8), transparent 80%)`,
          }}
        />
        
        <div className={`relative ${isDark ? 'bg-slate-950/70' : 'bg-white/80'} backdrop-blur-3xl rounded-[4rem] p-12 md:p-16 border ${isDark ? 'border-white/5' : 'border-slate-200'} transition-all duration-500 text-center shadow-2xl h-full flex flex-col justify-between overflow-hidden group-hover:shadow-indigo-500/10`}>
          <div className="absolute inset-0 rounded-[4rem] border-t-2 border-l-2 border-indigo-500/60 group-hover:border-transparent transition-all duration-700 pointer-events-none z-[1]" />
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <div className="relative w-48 h-48 mx-auto mb-14">
              <div className="relative w-full h-full rounded-[3rem] bg-indigo-600 flex items-center justify-center text-white text-6xl font-black shadow-2xl transition-all duration-700 ease-out border-4 border-white/20 z-10 overflow-hidden ring-8 ring-white/5 group-hover:rotate-[8deg]">
                <span className="relative z-20 drop-shadow-2xl">{dev.avatar}</span>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
              </div>
            </div>
            
            <h3 className={`text-4xl md:text-5xl font-black ${isDark ? 'text-white' : 'text-slate-900'} mb-4 tracking-tighter group-hover:text-indigo-500 transition-colors duration-500 ease-out`}>
              {dev.name}
            </h3>
            <p className="text-indigo-500 font-black text-[13px] uppercase tracking-[0.5em] mb-12 opacity-80">{dev.role}</p>

            <div className="flex items-center justify-center gap-5 mb-14">
              {[
                { icon: Github, href: dev.github },
                { icon: Linkedin, href: dev.linkedin },
                { icon: Mail, href: `mailto:${dev.mail}` },
                { icon: Globe, href: dev.web }
              ].map((social, si) => (
                <a 
                  key={si} 
                  href={social.href} 
                  className={`p-4.5 rounded-[1.5rem] ${isDark ? 'bg-slate-950/80 text-slate-500' : 'bg-slate-100 text-slate-400'} hover:text-white hover:bg-indigo-600 border ${isDark ? 'border-white/5' : 'border-slate-200'} hover:border-indigo-400 transition-all duration-500 hover:scale-125 active:scale-90 shadow-2xl group/icon`}
                >
                  <social.icon size={22} className="group-hover/icon:rotate-[360deg] transition-transform duration-1000" />
                </a>
              ))}
            </div>
          </div>

          <div className={`pt-12 border-t ${isDark ? 'border-white/10' : 'border-slate-100'} flex items-center justify-between opacity-30 group-hover:opacity-70 transition-all duration-700 relative z-10`}>
            <div className="flex flex-col items-start gap-1.5">
              <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>PROTOCOL</span>
              <span className={`text-[12px] font-black ${isDark ? 'text-slate-300' : 'text-slate-600'} tracking-tight`}>v4.0.PLNX</span>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`text-[12px] font-black ${isDark ? 'text-slate-400' : 'text-indigo-600/60'} uppercase tracking-[0.1em]`}>Core Engineering</span>
              <div className="h-1 w-12 bg-indigo-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDevelopersView = () => {
    const isDark = theme === 'dark';
    const devs = [
      { 
        name: 'Chintan Mandaliya', 
        role: 'PLANIX CORE ARCHITECT', 
        avatar: 'CM',
        github: '#', linkedin: '#', mail: 'chintan@example.com', web: '#'
      },
      { 
        name: 'Yagnik Radadiya', 
        role: 'PLANIX CORE ARCHITECT', 
        avatar: 'YR',
        github: '#', linkedin: '#', mail: 'yagnik@example.com', web: '#'
      }
    ];
    return (
      <div className="max-w-7xl mx-auto py-16 px-6 animate-in fade-in zoom-in-95 duration-1000 h-full overflow-y-auto scrollbar-hide">
        <div className="text-center mb-24 relative">
          <div className={`inline-flex items-center gap-2 px-6 py-2.5 ${isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'} border rounded-full mb-8 relative z-10`}>
            <Code2 size={14} className="text-indigo-500" />
            <span className={`text-[11px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Development Registry</span>
          </div>
          <h1 className={`text-7xl md:text-8xl font-black ${isDark ? 'text-white' : 'text-slate-900'} mb-6 tracking-tighter relative z-10`}>SYSTEM <span className="text-indigo-500">AUTHORS</span></h1>
          <p className={`max-w-2xl mx-auto ${isDark ? 'text-slate-50' : 'text-slate-700'} font-bold text-sm leading-relaxed uppercase tracking-[0.2em] relative z-10`}>
            THE ENGINEERING MINDS BEHIND THE HIGH-PERFORMANCE PLANIX TASK MANAGEMENT ECOSYSTEM.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative mb-20">
          {devs.map((dev, idx) => (
            <DeveloperCard key={idx} dev={dev} theme={theme} />
          ))}
        </div>

        <div className="mt-20 text-center">
           <p className={`text-[10px] font-black uppercase tracking-[1em] ${isDark ? 'text-slate-500' : 'text-slate-900'}`}>Authorized Development Only</p>
        </div>
      </div>
    );
  };

  if (!currentUser) return <LoginModal language={language} onLogin={handleLogin} />;
  if (appMode === 'commitguard') return <CommitGuardView user={currentUser} onExit={() => setAppMode('planix')} onLogout={executeLogout} language={language} onToggleLanguage={toggleLanguage} />;
  if (!activeProjectId) return <div className="h-screen flex items-center justify-center font-black text-slate-400 text-2xl uppercase tracking-widest animate-pulse bg-slate-950">Planix Loading...</div>;

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'dark' : ''} bg-[#f8fafc] dark:bg-[#020617] overflow-hidden`}>
      <Sidebar 
        activeProjectName={activeProject?.name || ''} user={currentUser} onUpdateUserName={async (name) => {
          const updated = await AuthService.updateProfile(currentUser.id, { name });
          setCurrentUser(updated);
          setUsers(await AuthService.getUsers());
        }}
        theme={theme} onToggleTheme={toggleTheme} language={language} onToggleLanguage={toggleLanguage}
        isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        activeTab={activeTab} onTabChange={setActiveTab}
        onOverrideApp={handleOverrideRequest}
      />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        <TopNav 
          projectName={activeProject?.name || ''} onUpdateProjectName={handleUpdateProjectName} onExportPDF={handleExportPDF} 
          onExportData={async () => {
            const fullStateJson = await TaskService.getFullStateExport();
            const blob = new Blob([fullStateJson], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `planix_full_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
          }} 
          onImportData={async (file) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
              try {
                const content = e.target?.result as string;
                const parsed = JSON.parse(content);
                await TaskService.importFullState(parsed);
                await loadAll();
                await loadTasks();
                alert("Workspace Restoration Complete! The page has been updated with the restored data.");
              } catch (err) { 
                alert("Restoration Failed: The file format is invalid."); 
              }
            };
            reader.readAsText(file);
          }}
          onResetBoard={async () => { const updatedTasks = await TaskService.clearAllTasks(activeProjectId); setTasks(updatedTasks); }}
          onNewTask={() => { setError(null); setShowNewTaskModal(true); }} onSearch={setSearchQuery} onCopyAll={handleCopyAllTasks}
          sidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} theme={theme} onToggleTheme={toggleTheme}
          language={language} onToggleLanguage={toggleLanguage}
          userName={currentUser?.name || 'User'} hasTasks={filteredTasks.length > 0} filterPriority={filterPriority} onFilterPriority={setFilterPriority}
          showClosed={showClosed} onToggleClosed={() => setShowClosed(!showClosed)}
          activeTab={activeTab}
          onLogout={handleLogoutRequest}
        />
        <main className={`flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950/20 relative ${activeTab === 'profile' ? 'p-0' : 'p-4 md:p-8 pt-6 pb-0'}`}>
          
          <div className={`transition-all duration-300 h-full ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'}`}>
            {activeTab === 'board' && <BoardSkeleton />}
            {activeTab === 'analytics' && <AnalyticsSkeleton />}
            {activeTab === 'profile' && <ProfileSkeleton />}
            {activeTab === 'admin' && <AdminSkeleton />}
            {activeTab === 'developers' && <AnalyticsSkeleton />}
          </div>

          <div className={`transition-all duration-500 h-full ${!isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {activeTab === 'board' ? (
              <div className="flex gap-6 md:gap-8 h-full overflow-x-auto scrollbar-hide">
                {renderColumn(TaskStatus.TO_DO)}
                {renderColumn(TaskStatus.IN_PROGRESS)}
                {renderColumn(TaskStatus.REVIEW)}
                {renderColumn(TaskStatus.DONE)}
              </div>
            ) : activeTab === 'analytics' ? (
              <div className="h-full overflow-y-auto scrollbar-hide pb-20">
                <AnalyticsDashboard tasks={tasks} language={language} />
              </div>
            ) : activeTab === 'profile' ? (
              <div className="h-full overflow-y-auto scrollbar-hide">
                <ProfileView 
                  user={currentUser} 
                  language={language} 
                  onUpdate={(updated) => {
                    setCurrentUser(updated);
                    setUsers(AuthService.getUsers());
                  }} 
                  theme={theme}
                  onToggleTheme={toggleTheme}
                  onLanguageChange={setLanguage}
                  onLogout={handleLogoutRequest}
                />
              </div>
            ) : activeTab === 'admin' ? (
              <div className="h-full overflow-y-auto scrollbar-hide">
                <AdminDashboard language={language} />
              </div>
            ) : (
              renderDevelopersView()
            )}
          </div>
        </main>
      </div>

      {editingTask && <EditTaskModal task={editingTask} language={language} onClose={() => setEditingTask(null)} onSave={async (taskId, updates) => { setTasks([...await TaskService.updateTask(taskId, updates)]); }} /> }
      
      {showNewTaskModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-transparent backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] w-full max-w-xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-500">
            <div className="px-10 py-12 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-[100px]" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl shadow-indigo-500/20"><Terminal size={22} strokeWidth={2.5} /></div>
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] opacity-80">{t_modal.sync}</span>
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter leading-none mb-2">{t_modal.import}</h2>
                </div>
                <button type="button" onClick={() => setShowNewTaskModal(false)} className="p-3 bg-white/10 hover:bg-rose-500/20 text-white rounded-2xl transition-all border border-white/10"><X size={24} strokeWidth={3} /></button>
              </div>
            </div>
            <form onSubmit={handleCreateTasks} className="p-10 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3 text-slate-400"><Hash size={16} strokeWidth={3} /><label className="text-[10px] font-black uppercase tracking-[0.3em]">{t_modal.ids}</label></div>
                  <div className="flex gap-2">
                    <input type="file" ref={excelInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleExcelImport} />
                    <button type="button" onClick={() => excelInputRef.current?.click()} className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all shadow-sm"><FileSpreadsheet size={14} />{t_modal.excel}</button>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all border shadow-lg ${activeIdCount > 0 ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800'}`}>{activeIdCount} {t_modal.unique_ids}</div>
                  </div>
                </div>
                <textarea autoFocus placeholder={t_modal.placeholder} value={bulkIdsInput} onChange={(e) => { setBulkIdsInput(e.target.value); setError(null); }} className="w-full h-52 px-6 py-6 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-3xl text-lg font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:border-indigo-600 outline-none transition-all shadow-inner resize-none" />
              </div>
              {error && <div className="p-6 bg-rose-500/10 border-2 border-rose-500/20 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 shadow-lg shadow-rose-500/5"><p className="text-[12px] text-rose-600 dark:text-rose-400 font-black uppercase tracking-tight leading-snug">{error}</p></div>}
              <div className="flex items-center gap-6 pt-4">
                <button type="submit" disabled={activeIdCount === 0} className={`flex-1 py-5 bg-indigo-600 text-white font-black text-[11px] uppercase tracking-[0.4em] rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 ring-1 ring-white/10 ${activeIdCount === 0 ? 'opacity-20 grayscale cursor-not-allowed' : 'hover:bg-indigo-700 shadow-indigo-600/30'}`}><Database size={20} />{t_modal.execute}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="w-full max-w-[480px] bg-white/95 dark:bg-[#0b1221] rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] border border-slate-200 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-500 group/modal">
            <div className="relative px-10 py-12 bg-gradient-to-br from-rose-500/10 to-rose-600/5 overflow-hidden border-b border-rose-500/10 dark:border-rose-500/5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full -mr-32 -mt-32 blur-[60px] pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="p-6 bg-rose-500/10 dark:bg-rose-500/20 rounded-[2.5rem] border border-rose-500/20 shadow-2xl transition-transform hover:scale-110 transform rotate-1 group">
                  <Power size={44} strokeWidth={2.5} className="text-rose-600 dark:text-rose-500 animate-pulse" />
                </div>
                <div className="text-center space-y-1.5">
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight italic">{t_auth.logout_confirm_title}</h2>
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em]">Protocol Termination</p>
                </div>
              </div>
            </div>

            <div className="p-10 lg:p-12 space-y-10">
              <p className="text-center text-slate-500 dark:text-slate-400 font-bold text-base leading-relaxed px-4 opacity-80">
                {t_auth.logout_confirm_desc}
              </p>

              <div className="flex flex-col gap-4">
                 <button 
                   onClick={executeLogout}
                   className="w-full py-6 bg-rose-600 text-white font-black text-[13px] uppercase tracking-[0.5em] rounded-[1.75rem] shadow-2xl hover:bg-rose-700 transition-all flex items-center justify-center gap-5 active:scale-[0.98] group/exit relative overflow-hidden isolate border border-white/10"
                 >
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/exit:animate-shimmer-fast pointer-events-none" />
                   <LogOut size={20} strokeWidth={3} className="group-hover/exit:translate-x-1 transition-transform duration-500" />
                   {t_auth.logout_confirm_btn}
                 </button>
                 <button 
                   onClick={() => setShowLogoutConfirm(false)}
                   className="w-full py-6 bg-slate-50 dark:bg-[#070b14] border-2 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 font-black text-[13px] uppercase tracking-[0.5em] rounded-[1.75rem] hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all duration-500"
                 >
                   {t_auth.logout_abort}
                 </button>
              </div>

              <div className="pt-2 flex items-center justify-between opacity-30 px-2">
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-500">AUTH_UPLINK</span>
                  <span className="text-[9px] font-mono text-slate-600 dark:text-slate-400 tracking-tight">NULL_V4_CORE</span>
                </div>
                <div className="h-[2px] w-12 bg-rose-500/40 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {showTour && <ProductTour language={language} onClose={handleCloseTour} />}
    </div>
  );
};

export default App;