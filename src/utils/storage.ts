import { DistractionNote, FocusSession, Project } from '../types';
import { INITIAL_SAMPLE_PROJECTS } from '../data/templates';

const STORAGE_KEYS = {
  PROJECTS: 'projectpulse_projects_v1',
  FOCUS_SESSION: 'projectpulse_focus_session_v1',
  DISTRACTIONS: 'projectpulse_distractions_v1',
};

export function loadProjects(): Project[] {
  if (typeof window === 'undefined') return INITIAL_SAMPLE_PROJECTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_SAMPLE_PROJECTS));
      return INITIAL_SAMPLE_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SAMPLE_PROJECTS;
  } catch (e) {
    console.error('Failed to load projects from storage', e);
    return INITIAL_SAMPLE_PROJECTS;
  }
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects to storage', e);
  }
}

export function loadDistractions(): DistractionNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DISTRACTIONS);
    if (!raw) return [
      {
        id: 'dist-1',
        text: 'Look into Kotlin Multiplatform Compose for desktop later',
        resolved: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'dist-2',
        text: 'Fix CSS button hover glow on Safari when free',
        resolved: true,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      }
    ];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveDistractions(notes: DistractionNote[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.DISTRACTIONS, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save distraction notes', e);
  }
}

export function loadFocusSession(): FocusSession {
  const defaultSession: FocusSession = {
    activeProjectId: 'proj-android-fitness',
    activeStepId: 'step-android-2',
    timerRunning: false,
    timerSecondsLeft: 25 * 60,
    targetMinutes: 25,
    totalFocusMinutes: 45,
    soundEnabled: true,
    lastCheckInPrompt: null,
  };

  if (typeof window === 'undefined') return defaultSession;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FOCUS_SESSION);
    if (!raw) return defaultSession;
    return { ...defaultSession, ...JSON.parse(raw) };
  } catch {
    return defaultSession;
  }
}

export function saveFocusSession(session: FocusSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.FOCUS_SESSION, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save focus session', e);
  }
}

export function exportBackup(projects: Project[], distractions: DistractionNote[]): void {
  const payload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    projects,
    distractions,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `projectpulse-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(file: File): Promise<{ projects: Project[]; distractions: DistractionNote[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.projects && Array.isArray(parsed.projects)) {
          resolve({
            projects: parsed.projects,
            distractions: Array.isArray(parsed.distractions) ? parsed.distractions : [],
          });
        } else {
          reject(new Error('Invalid backup file structure: missing projects array'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
