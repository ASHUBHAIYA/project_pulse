import { DistractionNote, Project } from '../types';

export interface CloudflareD1Config {
  accountId: string;
  databaseId: string;
  apiToken: string;
  bindingName: string; // default "DB"
  autoSyncToD1: boolean;
  lastSyncedAt?: string;
  connected?: boolean;
}

export interface CloudflareD1Status {
  connected: boolean;
  isLiveBinding: boolean;
  provider: 'cloudflare_d1_binding' | 'cloudflare_d1_api' | 'server_file' | 'none';
  binding?: string;
  projectCount?: number;
  distractionCount?: number;
  message?: string;
  error?: string;
}

const D1_CONFIG_STORAGE_KEY = 'projectpulse_cloudflare_d1_config_v1';

export function loadCloudflareD1Config(): CloudflareD1Config {
  const defaultConfig: CloudflareD1Config = {
    accountId: '',
    databaseId: '',
    apiToken: '',
    bindingName: 'DB',
    autoSyncToD1: false,
    connected: false,
  };

  if (typeof window === 'undefined') return defaultConfig;
  try {
    const raw = localStorage.getItem(D1_CONFIG_STORAGE_KEY);
    return raw ? { ...defaultConfig, ...JSON.parse(raw) } : defaultConfig;
  } catch {
    return defaultConfig;
  }
}

export function saveCloudflareD1Config(config: CloudflareD1Config): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(D1_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save Cloudflare D1 config', e);
  }
}

/**
 * Checks the live binding status of Cloudflare D1 in the current environment
 */
export async function fetchD1LiveStatus(): Promise<CloudflareD1Status> {
  try {
    const res = await fetch('/api/d1-status');
    if (!res.ok) {
      return {
        connected: false,
        isLiveBinding: false,
        provider: 'none',
        message: 'Could not contact status endpoint',
      };
    }
    return await res.json();
  } catch (err) {
    return {
      connected: false,
      isLiveBinding: false,
      provider: 'none',
      error: (err as Error).message,
    };
  }
}

export async function testCloudflareD1Connection(config: CloudflareD1Config): Promise<{ connected: boolean }> {
  // First check if live binding is present in current runtime
  const liveStatus = await fetchD1LiveStatus();
  if (liveStatus.isLiveBinding && liveStatus.connected) {
    return { connected: true };
  }

  // Otherwise test REST API credentials
  const res = await fetch('/api/d1/test-connection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId: config.accountId,
      databaseId: config.databaseId,
      apiToken: config.apiToken,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to connect to Cloudflare D1');
  }
  return { connected: true };
}

export async function initCloudflareD1Schema(config: CloudflareD1Config): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/d1-init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId: config.accountId || undefined,
      databaseId: config.databaseId || undefined,
      apiToken: config.apiToken || undefined,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to initialize D1 schema');
  }
  return json;
}

export async function syncProjectsToCloudflareD1(
  config: CloudflareD1Config,
  projects: Project[],
  distractions: DistractionNote[]
): Promise<{ syncedProjects: number; updatedAt: string }> {
  // Check if live binding is active
  const liveStatus = await fetchD1LiveStatus();
  if (liveStatus.isLiveBinding) {
    // Direct /api/data POST writes straight into env.DB
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projects, distractions }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to save to D1');
    return {
      syncedProjects: projects.length,
      updatedAt: json.updatedAt || new Date().toISOString(),
    };
  }

  // Otherwise use REST API sync
  const res = await fetch('/api/d1/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId: config.accountId,
      databaseId: config.databaseId,
      apiToken: config.apiToken,
      projects,
      distractions,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to sync to Cloudflare D1');
  }
  return json;
}

export async function pullProjectsFromCloudflareD1(config: CloudflareD1Config): Promise<{
  projects: Project[];
  distractions: DistractionNote[];
}> {
  // Check if live binding is active
  const liveStatus = await fetchD1LiveStatus();
  if (liveStatus.isLiveBinding) {
    const res = await fetch('/api/data');
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to pull from D1');
    return {
      projects: json.projects || [],
      distractions: json.distractions || [],
    };
  }

  // Otherwise pull via REST
  const res = await fetch('/api/d1/pull', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId: config.accountId,
      databaseId: config.databaseId,
      apiToken: config.apiToken,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to pull from Cloudflare D1');
  }
  return {
    projects: json.projects || [],
    distractions: json.distractions || [],
  };
}

export async function executeD1Query(
  config: CloudflareD1Config,
  sql: string
): Promise<{ results: unknown[]; meta?: unknown }> {
  const res = await fetch('/api/d1-query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId: config.accountId || undefined,
      databaseId: config.databaseId || undefined,
      apiToken: config.apiToken || undefined,
      sql,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Query failed');
  }
  return json.result || { results: [] };
}
