interface Env {
  DB: D1Database;
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: CORS_HEADERS });
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(
      JSON.stringify({ error: 'Cloudflare D1 binding DB is not bound.' }),
      { status: 503, headers: CORS_HEADERS }
    );
  }

  try {
    const body: any = await request.json();
    const rawSql = body.sql || body.query;

    if (!rawSql) {
      return new Response(JSON.stringify({ error: 'Missing SQL query' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // Strip SQL comments and empty lines
    const cleanSql = rawSql
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');

    // Split statements safely
    const statements = cleanSql
      .split(';')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    if (statements.length === 0) {
      return new Response(JSON.stringify({ success: true, results: [] }), {
        headers: CORS_HEADERS,
      });
    }

    if (statements.length === 1) {
      const res = await env.DB.prepare(statements[0]).all();
      return new Response(JSON.stringify({ success: true, ...res }), {
        headers: CORS_HEADERS,
      });
    }

    // Execute multiple statements in batch
    const batchRes = await env.DB.batch(
      statements.map((stmt: string) => env.DB.prepare(stmt))
    );

    return new Response(JSON.stringify({ success: true, batchResults: batchRes }), {
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Query execution failed' }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
