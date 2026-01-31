export enum TaskStatus {
  TO_DO = 'To Do',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'Review',
  DONE = 'Done'
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent'
}

export type Language = 'EN' | 'JA' | 'TH';

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  avatar: string;
  initials: string;
  role: 'Admin' | 'Project Leader' | 'Team Lead' | 'Member';
  lastActiveAt?: string;
  // Personal Info
  email?: string;
  recoveryEmail?: string;
  company?: string;
  dateOfBirth?: string;
  country?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  type: 'profile' | 'security' | 'session' | 'system';
}

export interface Project {
  id: string;
  name: string;
  key: string;
  owner_id: string;
}

export interface Task {
  id: string;
  owner_id: string; 
  external_id: number;
  external_url: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assignee_id: string | null;
  project_id: string;
  created_at: string;
  updated_at: string;
  in_progress_started_at: string | null;
  total_work_seconds: number;
  is_timer_paused: boolean;
  is_new?: boolean;
  is_closed?: boolean;
  last_modified_by_id?: string;
  last_modified_by_name?: string;
}

// --- CommitGuard Types ---
export type ArchitectureTier = 'Infrastructure' | 'Backend' | 'Frontend' | 'Database' | 'Mobile';

export interface CommitSubNode {
  id: string;
  name: string;
  type: ArchitectureTier;
  description: string;
}

export interface CommitNode {
  id: string;
  name: string;
  description: string;
  subNodes: CommitSubNode[];
  assignedUserIds: string[];
  doneUserIds?: string[];
}

export interface CommitLock {
  id?: string; // Firestore document ID
  nodeId: string; // The main project ID
  subNodeId: string; // The specific committable unit
  userId: string;
  userName: string;
  timestamp: string;
}

export interface CommitAudit {
  id: string;
  type: 'LOCK' | 'UNLOCK' | 'OVERRIDE' | 'SYNC_COMPLETE';
  nodeName: string;
  subNodeName: string;
  userName: string;
  timestamp: string;
}

export interface BoardState {
  tasks: Task[];
  projects: Project[];
  activeProject: Project | null;
  users: User[];
  currentUser: User | null;
}