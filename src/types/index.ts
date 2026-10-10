export type Platform = 'android' | 'web' | 'both';

export type StepStatus = 'pending' | 'in_progress' | 'done';

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ProjectStep {
  id: string;
  title: string;
  category?: string;
  description: string;
  status: StepStatus;
  checklist: ChecklistItem[];
  order: number;
  targetPlatform?: Platform;
}

export interface Project {
  id: string;
  name: string;
  platform: Platform;
  description: string;
  repositoryUrl?: string;
  steps: ProjectStep[];
  activeStepId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DistractionNote {
  id: string;
  text: string;
  projectId?: string;
  resolved: boolean;
  createdAt: string;
}

export interface FocusSession {
  activeProjectId: string | null;
  activeStepId: string | null;
  timerRunning: boolean;
  timerSecondsLeft: number;
  targetMinutes: number;
  totalFocusMinutes: number;
  soundEnabled: boolean;
  lastCheckInPrompt: string | null;
}
