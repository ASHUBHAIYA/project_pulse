/**
 * Cloudflare Pages Function: /api/d1-query
 * Executes SQL statements directly on Cloudflare D1 binding 'env.DB'.
 */

interface Env {
  DB?: {
    prepare: (query: string) => {
      bind: (...args: unknown[]) => {
        all: () => Promise<{ results: Record<string, unknown>[] }>;
        run: () => Promise<{ success: boolean; meta?: unknown }>;
      };
      all: () => Promise<{ results: Record<string, unknown>[] }>;
      run: () => Promise<{ success: boolean; meta?: unknown }>;
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
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: CORS_HEADERS });
}

export async function onRequestPost(context: EventContext<Env, Record<string, string>, unknown>): Promise<Response> {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(
      JSON.stringify({
        error: 'Cloudflare D1 binding DB is not bound in this environment.',
      }),
      { status: 503, headers: CORS_HEADERS }
    );
  }

  try {
    const { sql, params } = (await request.json()) as { sql?: string; params?: unknown[] };

    if (!sql || typeof sql !== 'string') {
      return new Response(JSON.stringify({ error: 'SQL query string is required' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const trimmed = sql.trim();
    const isSelect = trimmed.toUpperCase().startsWith('SELECT') || trimmed.toUpperCase().startsWith('PRAGMA');

    const stmt = env.DB.prepare(trimmed);
    const bound = params && params.length > 0 ? stmt.bind(...params) : stmt;

    if (isSelect) {
      const result = await bound.all();
      return new Response(
        JSON.stringify({
          success: true,
          result: {
            results: result.results || [],
          },
        }),
        { headers: CORS_HEADERS }
      );
    } else {
      const result = await bound.run();
      return new Response(
        JSON.stringify({
          success: true,
          result: {
            results: [],
            meta: result.meta,
          },
        }),
        { headers: CORS_HEADERS }
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: CORS_HEADERS }
    );
  }
}
