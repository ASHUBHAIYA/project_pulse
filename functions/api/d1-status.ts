/**
 * Cloudflare Pages Function: /api/d1-status
 * Checks status of Cloudflare D1 Database binding 'env.DB'.
 */

interface Env {
  DB?: {
    prepare: (query: string) => {
      all: () => Promise<{ results: Record<string, unknown>[] }>;
      first: <T = Record<string, unknown>>() => Promise<T | null>;
    };
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
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: CORS_HEADERS });
}

export async function onRequestGet(context: EventContext<Env, Record<string, string>, unknown>): Promise<Response> {
  const { env } = context;

  if (!env.DB) {
    return new Response(
      JSON.stringify({
        connected: false,
        isLiveBinding: false,
        provider: 'none',
        binding: 'DB',
        message: 'Cloudflare D1 binding DB is not detected. Please bind DB in Cloudflare Pages settings.',
        hint: 'Pages Dashboard -> Settings -> Functions -> D1 Database Bindings -> Variable: DB',
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  }

  try {
    // Test basic query
    const check = await env.DB.prepare('SELECT 1 as live;').first<{ live: number }>();

    // Count records if tables exist
    let projectCount = 0;
    let distractionCount = 0;
    try {
      const pCount = await env.DB.prepare('SELECT count(*) as count FROM projects;').first<{ count: number }>();
      projectCount = pCount?.count || 0;
      const dCount = await env.DB.prepare('SELECT count(*) as count FROM distractions;').first<{ count: number }>();
      distractionCount = dCount?.count || 0;
    } catch {
      // Tables may not exist yet, which is fine
    }

    return new Response(
      JSON.stringify({
        connected: Boolean(check && check.live === 1),
        isLiveBinding: true,
        provider: 'cloudflare_d1_binding',
        binding: 'DB',
        projectCount,
        distractionCount,
        message: 'Cloudflare D1 live binding env.DB is active and connected!',
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        connected: false,
        isLiveBinding: true,
        provider: 'cloudflare_d1_binding',
        binding: 'DB',
        error: (err as Error).message,
        message: 'Connected to binding, but test query failed.',
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  }
}
