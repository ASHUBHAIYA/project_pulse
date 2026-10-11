/**
 * Cloudflare Pages Function: /api/data
 * Direct Cloudflare D1 Database binding 'env.DB' for live .dev and production environments.
 */

interface Env {
  DB?: {
    prepare: (query: string) => {
      bind: (...args: unknown[]) => {
        all: () => Promise<{ results: Record<string, unknown>[] }>;
        run: () => Promise<{ success: boolean; meta?: unknown }>;
        first: <T = Record<string, unknown>>() => Promise<T | null>;
      };
      all: () => Promise<{ results: Record<string, unknown>[] }>;
      run: () => Promise<{ success: boolean; meta?: unknown }>;
      first: <T = Record<string, unknown>>() => Promise<T | null>;
    };
    batch: (statements: unknown[]) => Promise<unknown[]>;
    exec: (query: string) => Promise<{ count: number }>;
  };
}

interface EventContext<E, P, D> {
  request: Request;
  functionPath: string;
  waitUntil: (promise: Promise<unknown>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  env: E;
  params: P;
  data: D;
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function ensureSchema(db: NonNullable<Env['DB']>) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, platform TEXT NOT NULL, description TEXT, repository_url TEXT, active_step_id TEXT, steps_json TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS distractions (id TEXT PRIMARY KEY, text TEXT NOT NULL, project_id TEXT, resolved INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS focus_sessions (id TEXT PRIMARY KEY, active_project_id TEXT, active_step_id TEXT, timer_seconds_left INTEGER NOT NULL DEFAULT 1500, target_minutes INTEGER NOT NULL DEFAULT 25, total_focus_minutes INTEGER NOT NULL DEFAULT 0, sound_enabled INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);`,
  ];
  await db.batch(statements.map((sql) => db.prepare(sql)));
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: CORS_HEADERS });
}

export async function onRequestGet(context: EventContext<Env, Record<string, string>, unknown>): Promise<Response> {
  const { env } = context;

  if (!env.DB) {
    return new Response(
      JSON.stringify({
        exists: false,
        isLiveBinding: false,
        error: 'Cloudflare D1 binding DB is not bound in this environment.',
        hint: 'Please bind your D1 database to variable DB in Cloudflare Pages settings.',
      }),
      { status: 503, headers: CORS_HEADERS }
    );
  }

  try {
    await ensureSchema(env.DB);

    const projectsQuery = await env.DB.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
    const distractionsQuery = await env.DB.prepare('SELECT * FROM distractions ORDER BY created_at DESC').all();
    const focusQuery = await env.DB.prepare('SELECT * FROM focus_sessions LIMIT 1').all();

    const projects = (projectsQuery.results || []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      platform: row.platform as 'android' | 'web' | 'both',
      description: (row.description as string) || '',
      repositoryUrl: (row.repository_url as string) || undefined,
      activeStepId: (row.active_step_id as string) || undefined,
      steps: row.steps_json ? JSON.parse(row.steps_json as string) : [],
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }));

    const distractions = (distractionsQuery.results || []).map((row) => ({
      id: row.id as string,
      text: row.text as string,
      projectId: (row.project_id as string) || undefined,
      resolved: Boolean(row.resolved),
      createdAt: row.created_at as string,
    }));

    let focusSession = null;
    if (focusQuery.results && focusQuery.results.length > 0) {
      const f = focusQuery.results[0];
      focusSession = {
        activeProjectId: (f.active_project_id as string) || null,
        activeStepId: (f.active_step_id as string) || null,
        timerSecondsLeft: typeof f.timer_seconds_left === 'number' ? f.timer_seconds_left : 1500,
        targetMinutes: typeof f.target_minutes === 'number' ? f.target_minutes : 25,
        totalFocusMinutes: typeof f.total_focus_minutes === 'number' ? f.total_focus_minutes : 0,
        soundEnabled: Boolean(f.sound_enabled),
      };
    }

    return new Response(
      JSON.stringify({
        exists: true,
        isLiveBinding: true,
        provider: 'cloudflare_d1_binding',
        binding: 'DB',
        projects,
        distractions,
        focusSession,
        updatedAt: new Date().toISOString(),
      }),
      { headers: CORS_HEADERS }
    );
  } catch (err) {
