/**
 * Cloudflare Pages Function: /api/d1-init
 * Executes full schema creation on Cloudflare D1 binding 'env.DB'.
 */

interface Env {
  DB?: {
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
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: CORS_HEADERS });
}

export async function onRequestPost(context: EventContext<Env, Record<string, string>, unknown>): Promise<Response> {
  const { env } = context;

  if (!env.DB) {
    return new Response(
      JSON.stringify({
        error: 'Cloudflare D1 binding DB is not bound in this environment.',
      }),
      { status: 503, headers: CORS_HEADERS }
    );
  }

  try {
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        platform TEXT NOT NULL,
        description TEXT,
        repository_url TEXT,
        active_step_id TEXT,
        steps_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS distractions (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        project_id TEXT,
        resolved INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS focus_sessions (
        id TEXT PRIMARY KEY,
        active_project_id TEXT,
        active_step_id TEXT,
        timer_seconds_left INTEGER NOT NULL DEFAULT 1500,
        target_minutes INTEGER NOT NULL DEFAULT 25,
        total_focus_minutes INTEGER NOT NULL DEFAULT 0,
        sound_enabled INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_projects_platform ON projects(platform);
      CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
      CREATE INDEX IF NOT EXISTS idx_distractions_resolved ON distractions(resolved);
    `);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cloudflare D1 tables initialized successfully on live env.DB!',
      }),
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Schema initialization failed: ${(err as Error).message}` }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
