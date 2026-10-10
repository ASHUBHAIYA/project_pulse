import { DistractionNote, Project } from '../types';

export interface GitHubSyncConfig {
  mode: 'none' | 'gist' | 'repo' | 'raw';
  token: string;
  gistId?: string;
  repo?: string; // e.g. "username/my-roadmap"
  filePath?: string; // e.g. "projects.json"
  branch?: string; // e.g. "main"
  rawUrl?: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}

const GITHUB_CONFIG_KEY = 'projectpulse_github_sync_config_v1';

export function loadGitHubConfig(): GitHubSyncConfig {
  const defaultConfig: GitHubSyncConfig = {
    mode: 'none',
    token: '',
    gistId: '',
    repo: '',
    filePath: 'projectpulse-data.json',
    branch: 'main',
    rawUrl: '',
    autoSync: false,
  };

  if (typeof window === 'undefined') return defaultConfig;
  try {
    const raw = localStorage.getItem(GITHUB_CONFIG_KEY);
    return raw ? { ...defaultConfig, ...JSON.parse(raw) } : defaultConfig;
  } catch {
    return defaultConfig;
  }
}

export function saveGitHubConfig(config: GitHubSyncConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save github sync config', e);
  }
}

// ----------------------------------------------------------------------
// Website Server File Storage (stored directly in the website itself)
// ----------------------------------------------------------------------

export async function fetchWebsiteData(): Promise<{
  exists: boolean;
  projects: Project[] | null;
  distractions: DistractionNote[] | null;
  updatedAt?: string;
} | null> {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Could not connect to website server storage:', err);
    return null;
  }
}

export async function saveWebsiteData(
  projects: Project[],
  distractions: DistractionNote[]
): Promise<boolean> {
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projects, distractions }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Could not save to website server storage:', err);
    return false;
  }
}

// ----------------------------------------------------------------------
// GitHub Integration (Pull from GitHub / Write to GitHub)
// ----------------------------------------------------------------------

export async function pullDataFromGitHub(config: GitHubSyncConfig): Promise<{
  projects: Project[];
  distractions: DistractionNote[];
  updatedAt?: string;
}> {
  const res = await fetch('/api/github/pull', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: config.token || undefined,
      gistId: config.gistId || undefined,
      rawUrl: config.rawUrl || undefined,
      repo: config.repo || undefined,
      path: config.filePath || undefined,
      branch: config.branch || undefined,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'GitHub pull request failed' }));
    throw new Error(err.error || 'Failed to pull from GitHub');
  }

  const result = await res.json();
  const data = result.data || {};
  return {
    projects: Array.isArray(data.projects) ? data.projects : Array.isArray(data) ? data : [],
    distractions: Array.isArray(data.distractions) ? data.distractions : [],
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

export async function pushDataToGitHub(
  config: GitHubSyncConfig,
  projects: Project[],
  distractions: DistractionNote[]
): Promise<{ gistUrl?: string; commitUrl?: string; gistId?: string; updatedAt: string }> {
  const payload = {
    projects,
    distractions,
    updatedAt: new Date().toISOString(),
  };

  const res = await fetch('/api/github/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: config.token,
      gistId: config.gistId || undefined,
      createNewGist: !config.gistId && config.mode === 'gist',
      repo: config.repo || undefined,
      path: config.filePath || undefined,
      branch: config.branch || undefined,
      data: payload,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'GitHub push request failed' }));
    throw new Error(err.error || 'Failed to push to GitHub');
  }

  return await res.json();
}
