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

// GET: Read data from D1
export async function onRequestGet(context: { env: Env }): Promise<Response> {
  const { env } = context;

  if (!env.DB) {
    return new Response(
      JSON.stringify({ error: 'Cloudflare D1 binding DB is not bound.' }),
      { status: 503, headers: CORS_HEADERS }
    );
  }

  try {
    const projectsQuery = await env.DB.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
    const distractionsQuery = await env.DB.prepare('SELECT * FROM distractions ORDER BY created_at DESC').all();
    const focusQuery = await env.DB.prepare('SELECT * FROM focus_sessions LIMIT 1').all();

    const projects = (projectsQuery.results || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      platform: row.platform,
      description: row.description || '',
      repositoryUrl: row.repository_url || undefined,
      activeStepId: row.active_step_id || undefined,
      steps: row.steps_json ? JSON.parse(row.steps_json) : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const distractions = (distractionsQuery.results || []).map((row: any) => ({
      id: row.id,
      text: row.text,
      projectId: row.project_id || undefined,
      resolved: Boolean(row.resolved),
      createdAt: row.created_at,
    }));

    let focusSession = null;
    if (focusQuery.results && focusQuery.results.length > 0) {
      const f: any = focusQuery.results[0];
      focusSession = {
        activeProjectId: f.active_project_id || null,
        activeStepId: f.active_step_id || null,
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
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `Cloudflare D1 query failed: ${err.message}` }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// POST: Save data to D1
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
    const projects = body.projects || [];
    const distractions = body.distractions || [];
    const focusSession = body.focusSession;

    const stmts: any[] = [];

    // Clear and rewrite projects
    stmts.push(env.DB.prepare('DELETE FROM projects'));
    for (const p of projects) {
      stmts.push(
        env.DB.prepare(
          'INSERT INTO projects (id, name, platform, description, repository_url, active_step_id, steps_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          p.id,
          p.name,
          p.platform,
          p.description || '',
          p.repositoryUrl || null,
          p.activeStepId || null,
          JSON.stringify(p.steps || []),
          p.createdAt || new Date().toISOString(),
          p.updatedAt || new Date().toISOString()
        )
      );
    }

    // Clear and rewrite distractions
    stmts.push(env.DB.prepare('DELETE FROM distractions'));
    for (const d of distractions) {
      stmts.push(
        env.DB.prepare(
          'INSERT INTO distractions (id, text, project_id, resolved, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(
          d.id,
          d.text,
          d.projectId || null,
          d.resolved ? 1 : 0,
          d.createdAt || new Date().toISOString()
        )
      );
    }

    // Upsert focus session if provided
    if (focusSession) {
      stmts.push(env.DB.prepare('DELETE FROM focus_sessions'));
      stmts.push(
        env.DB.prepare(
          'INSERT INTO focus_sessions (id, active_project_id, active_step_id, timer_seconds_left, target_minutes, total_focus_minutes, sound_enabled, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          'primary_session',
          focusSession.activeProjectId || null,
          focusSession.activeStepId || null,
          focusSession.timerSecondsLeft || 1500,
          focusSession.targetMinutes || 25,
          focusSession.totalFocusMinutes || 0,
          focusSession.soundEnabled !== false ? 1 : 0,
          new Date().toISOString()
        )
      );
    }

    if (stmts.length > 0) {
      await env.DB.batch(stmts);
    }

    return new Response(
      JSON.stringify({
        success: true,
        provider: 'cloudflare_d1_binding',
        binding: 'DB',
        projectCount: projects.length,
        distractionCount: distractions.length,
        updatedAt: new Date().toISOString(),
      }),
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `Cloudflare D1 save failed: ${err.message}` }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
