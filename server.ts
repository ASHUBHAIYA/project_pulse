import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '10mb' }));

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'app_data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// -------------------------------------------------------------
// Website File Storage Endpoints (No database required)
// -------------------------------------------------------------

// GET /api/data - Load data stored in the website itself
app.get('/api/data', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return res.json({
        exists: true,
        projects: parsed.projects || null,
        distractions: parsed.distractions || null,
        focusSession: parsed.focusSession || null,
        updatedAt: parsed.updatedAt || null,
      });
    }
    return res.json({ exists: false, projects: null, distractions: null, focusSession: null });
  } catch (err) {
    console.error('Error reading website data file:', err);
    return res.status(500).json({ error: 'Failed to read data file' });
  }
});

// POST /api/data - Save data directly into the website's server file (data/app_data.json)
app.post('/api/data', (req, res) => {
  try {
    const { projects, distractions, focusSession } = req.body;
    const payload = {
      projects: projects || [],
      distractions: distractions || [],
      focusSession: focusSession || null,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    return res.json({ success: true, updatedAt: payload.updatedAt });
  } catch (err) {
    console.error('Error writing website data file:', err);
    return res.status(500).json({ error: 'Failed to write data file' });
  }
});

// GET /api/data/download - Download app_data.json directly from server
app.get('/api/data/download', (req, res) => {
  if (fs.existsSync(DATA_FILE)) {
    return res.download(DATA_FILE, 'app_data.json');
  }
  return res.status(404).json({ error: 'data/app_data.json not found' });
});

// GET /api/data/info - Metadata info about data/app_data.json
app.get('/api/data/info', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const stats = fs.statSync(DATA_FILE);
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      const projects = Array.isArray(parsed.projects) ? parsed.projects : [];
      let totalSteps = 0;
      projects.forEach((p: { steps?: unknown[] }) => {
        if (Array.isArray(p.steps)) totalSteps += p.steps.length;
      });

      return res.json({
        exists: true,
        path: 'data/app_data.json',
        sizeBytes: stats.size,
        projectCount: projects.length,
        stepCount: totalSteps,
        updatedAt: parsed.updatedAt || stats.mtime.toISOString(),
      });
    }
    return res.json({ exists: false, path: 'data/app_data.json' });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});


// -------------------------------------------------------------
// GitHub Integration Endpoints (Pull from GitHub / Push to GitHub)
// -------------------------------------------------------------

// POST /api/github/pull - Fetch projects from a GitHub raw URL, Gist, or Repo
app.post('/api/github/pull', async (req, res) => {
  try {
    const { token, gistId, rawUrl, repo, path: filePath, branch } = req.body;

    // 1. Direct Raw URL pull
    if (rawUrl) {
      const response = await fetch(rawUrl, {
        headers: token ? { Authorization: `token ${token}` } : {},
      });
      if (!response.ok) {
        return res.status(response.status).json({ error: `GitHub fetch failed: ${response.statusText}` });
      }
      const data = await response.json();
      return res.json({ success: true, data });
    }

    // 2. Gist pull
    if (gistId) {
      const headers: Record<string, string> = {
        'User-Agent': 'ProjectPulse-App',
        Accept: 'application/vnd.github.v3+json',
      };
      if (token) headers['Authorization'] = `token ${token}`;

      const response = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
      if (!response.ok) {
        return res.status(response.status).json({ error: `Gist fetch failed: ${response.statusText}` });
      }
      const gist = await response.json();
      const files = gist.files || {};
      const targetFile = Object.values(files)[0] as { content?: string } | undefined;
      if (!targetFile || !targetFile.content) {
        return res.status(404).json({ error: 'No content found in Gist' });
      }
      const parsedData = JSON.parse(targetFile.content);
      return res.json({ success: true, data: parsedData });
    }

    // 3. GitHub Repo file pull
    if (repo && filePath) {
      const headers: Record<string, string> = {
        'User-Agent': 'ProjectPulse-App',
        Accept: 'application/vnd.github.v3+json',
      };
      if (token) headers['Authorization'] = `token ${token}`;

      const refQuery = branch ? `?ref=${branch}` : '';
      const response = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}${refQuery}`, { headers });
      if (!response.ok) {
        return res.status(response.status).json({ error: `Repo file fetch failed: ${response.statusText}` });
      }
      const fileMeta = await response.json();
      const content = Buffer.from(fileMeta.content, 'base64').toString('utf-8');
      const parsedData = JSON.parse(content);
      return res.json({ success: true, data: parsedData, sha: fileMeta.sha });
    }

    return res.status(400).json({ error: 'Missing GitHub Gist ID, Repo details, or Raw URL' });
  } catch (err) {
    console.error('GitHub pull error:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/github/push - Write projects directly to GitHub Gist or Repo file
app.post('/api/github/push', async (req, res) => {
  try {
    const { token, gistId, repo, path: filePath, branch, data, message } = req.body;

    if (!token) {
      return res.status(401).json({ error: 'GitHub Personal Access Token is required to write to GitHub' });
    }

    const payloadString = JSON.stringify(data, null, 2);

    // 1. Push to GitHub Gist
    if (gistId) {
      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `token ${token}`,
          'User-Agent': 'ProjectPulse-App',
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          description: 'ProjectPulse development tasks and roadmap backup',
          files: {
            'projectpulse-data.json': {
              content: payloadString,
            },
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: `Gist update failed: ${errText}` });
      }
      const updatedGist = await response.json();
      return res.json({ success: true, gistUrl: updatedGist.html_url, updatedAt: new Date().toISOString() });
    }

    // 2. Create new Gist if requested
    if (req.body.createNewGist) {
      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'User-Agent': 'ProjectPulse-App',
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          description: 'ProjectPulse development tasks and roadmap backup',
          public: false,
          files: {
            'projectpulse-data.json': {
              content: payloadString,
            },
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: `Gist creation failed: ${errText}` });
      }
      const newGist = await response.json();
      return res.json({ success: true, gistId: newGist.id, gistUrl: newGist.html_url, updatedAt: new Date().toISOString() });
    }

    // 3. Push to GitHub Repo
    if (repo && filePath) {
      // First get current file sha if it exists
      let sha: string | undefined = req.body.sha;
      if (!sha) {
        const refQuery = branch ? `?ref=${branch}` : '';
        const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}${refQuery}`, {
          headers: {
            Authorization: `token ${token}`,
            'User-Agent': 'ProjectPulse-App',
            Accept: 'application/vnd.github.v3+json',
          },
        });
        if (getRes.ok) {
          const existing = await getRes.json();
          sha = existing.sha;
        }
      }

      const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
          'User-Agent': 'ProjectPulse-App',
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          message: message || `Update ProjectPulse roadmap: ${new Date().toISOString()}`,
          content: Buffer.from(payloadString).toString('base64'),
          branch: branch || 'main',
          sha,
        }),
      });

      if (!putRes.ok) {
        const errText = await putRes.text();
        return res.status(putRes.status).json({ error: `Repo commit failed: ${errText}` });
      }
      const commitRes = await putRes.json();
      return res.json({
        success: true,
        commitUrl: commitRes.commit?.html_url,
        sha: commitRes.content?.sha,
        updatedAt: new Date().toISOString(),
      });
    }

    return res.status(400).json({ error: 'Specify Gist ID or Repo + file path' });
  } catch (err) {
    console.error('GitHub push error:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// -------------------------------------------------------------
// Cloudflare D1 Database REST API & Sync Endpoints
// -------------------------------------------------------------

// Helper to query Cloudflare D1 via Cloudflare Client API v4
async function queryCloudflareD1(
  accountId: string,
  databaseId: string,
  apiToken: string,
  sql: string,
  params: unknown[] = []
) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });

  const json = (await response.json()) as {
    success: boolean;
    errors?: Array<{ message: string }>;
    result?: Array<{ results?: unknown[]; success?: boolean; meta?: unknown }>;
  };

  if (!response.ok || !json.success) {
    const errMsg = json.errors?.[0]?.message || response.statusText;
    throw new Error(`Cloudflare D1 error: ${errMsg}`);
  }

  return json.result?.[0] || { results: [] };
}

// POST /api/d1/test-connection - Verify Cloudflare D1 credentials
app.post('/api/d1/test-connection', async (req, res) => {
  try {
    const { accountId, databaseId, apiToken } = req.body;
    if (!accountId || !databaseId || !apiToken) {
      return res.status(400).json({ error: 'Account ID, Database ID, and API Token are required.' });
    }

    const result = await queryCloudflareD1(accountId, databaseId, apiToken, 'SELECT 1 as connected;');
    return res.json({ success: true, connected: true, result });
  } catch (err) {
    return res.status(400).json({ success: false, error: (err as Error).message });
  }
});

// POST /api/d1/init-schema - Run schema.sql on Cloudflare D1
app.post('/api/d1/init-schema', async (req, res) => {
  try {
    const { accountId, databaseId, apiToken } = req.body;
    if (!accountId || !databaseId || !apiToken) {
      return res.status(400).json({ error: 'Account ID, Database ID, and API Token are required.' });
    }

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      return res.status(404).json({ error: 'schema.sql not found on server.' });
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    // Execute schema statements
    const statements = schemaSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const sql of statements) {
      await queryCloudflareD1(accountId, databaseId, apiToken, sql);
    }

    return res.json({ success: true, message: 'Cloudflare D1 schema initialized successfully!' });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/d1/sync - Push current projects & distractions into Cloudflare D1
app.post('/api/d1/sync', async (req, res) => {
  try {
    const { accountId, databaseId, apiToken, projects, distractions } = req.body;
    if (!accountId || !databaseId || !apiToken) {
      return res.status(400).json({ error: 'Cloudflare D1 credentials required.' });
    }

    // 1. Clear existing in D1
    await queryCloudflareD1(accountId, databaseId, apiToken, 'DELETE FROM projects;');
    await queryCloudflareD1(accountId, databaseId, apiToken, 'DELETE FROM distractions;');

    // 2. Insert projects
    for (const p of projects || []) {
      await queryCloudflareD1(
        accountId,
        databaseId,
        apiToken,
        'INSERT INTO projects (id, name, platform, description, repository_url, active_step_id, steps_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
        [
          p.id,
          p.name,
          p.platform,
          p.description || '',
          p.repositoryUrl || null,
          p.activeStepId || null,
          JSON.stringify(p.steps || []),
          p.createdAt || new Date().toISOString(),
          p.updatedAt || new Date().toISOString(),
        ]
      );
    }

    // 3. Insert distractions
    for (const d of distractions || []) {
      await queryCloudflareD1(
        accountId,
        databaseId,
        apiToken,
        'INSERT INTO distractions (id, text, project_id, resolved, created_at) VALUES (?, ?, ?, ?, ?);',
        [d.id, d.text, d.projectId || null, d.resolved ? 1 : 0, d.createdAt || new Date().toISOString()]
      );
    }

    return res.json({
      success: true,
      syncedProjects: (projects || []).length,
      syncedDistractions: (distractions || []).length,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/d1/pull - Pull from Cloudflare D1 into local data
app.post('/api/d1/pull', async (req, res) => {
  try {
    const { accountId, databaseId, apiToken } = req.body;
    if (!accountId || !databaseId || !apiToken) {
      return res.status(400).json({ error: 'Cloudflare D1 credentials required.' });
    }

    const projResult = await queryCloudflareD1(accountId, databaseId, apiToken, 'SELECT * FROM projects ORDER BY updated_at DESC;');
    const distResult = await queryCloudflareD1(accountId, databaseId, apiToken, 'SELECT * FROM distractions ORDER BY created_at DESC;');

    const rawProjects = (projResult.results || []) as Array<Record<string, unknown>>;
    const rawDistractions = (distResult.results || []) as Array<Record<string, unknown>>;

    const projects = rawProjects.map((row) => ({
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

    const distractions = rawDistractions.map((row) => ({
      id: row.id as string,
      text: row.text as string,
      projectId: (row.project_id as string) || undefined,
      resolved: Boolean(row.resolved),
      createdAt: row.created_at as string,
    }));

    // Update local data/app_data.json as well
    const payload = { projects, distractions, updatedAt: new Date().toISOString() };
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');

    return res.json({ success: true, projects, distractions, updatedAt: payload.updatedAt });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/d1/query & /api/d1-query - Execute custom query on Cloudflare D1
const handleD1Query = async (req: express.Request, res: express.Response) => {
  try {
    const accountId = req.body.accountId || process.env.CLOUDFLARE_D1_ACCOUNT_ID;
    const databaseId = req.body.databaseId || process.env.CLOUDFLARE_D1_DATABASE_ID;
    const apiToken = req.body.apiToken || process.env.CLOUDFLARE_D1_API_TOKEN;
    const { sql, params } = req.body;

    if (!sql) {
      return res.status(400).json({ error: 'SQL query string is required.' });
    }

    if (!accountId || !databaseId || !apiToken) {
      return res.status(400).json({
        error: 'Cloudflare credentials required in Node server environment. When running in Cloudflare Pages live .dev, binding env.DB is used directly.',
      });
    }

    const result = await queryCloudflareD1(accountId, databaseId, apiToken, sql, params || []);
    return res.json({ success: true, result });
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
};

app.post('/api/d1/query', handleD1Query);
app.post('/api/d1-query', handleD1Query);

// GET /api/d1-status - Status of Cloudflare D1 integration
app.get('/api/d1-status', async (req, res) => {
  try {
    const accountId = process.env.CLOUDFLARE_D1_ACCOUNT_ID;
    const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
    const apiToken = process.env.CLOUDFLARE_D1_API_TOKEN;

    if (accountId && databaseId && apiToken) {
      try {
        await queryCloudflareD1(accountId, databaseId, apiToken, 'SELECT 1 as connected;');
        return res.json({
          connected: true,
          isLiveBinding: false,
          provider: 'cloudflare_d1_api',
          environment: 'node_server_env',
          message: 'Cloudflare D1 connected via environment credentials.',
        });
      } catch (err) {
        return res.json({
          connected: false,
          isLiveBinding: false,
          provider: 'cloudflare_d1_api',
          error: (err as Error).message,
        });
      }
    }

    return res.json({
      connected: false,
      isLiveBinding: false,
      provider: 'server_file',
      binding: 'DB',
      environment: 'node_server',
      message: 'Running in local dev server with data/app_data.json fallback. When deployed to Cloudflare Pages live .dev, binding env.DB is active automatically.',
    });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/d1-init - Execute schema.sql
app.post('/api/d1-init', async (req, res) => {
  try {
    const accountId = req.body.accountId || process.env.CLOUDFLARE_D1_ACCOUNT_ID;
    const databaseId = req.body.databaseId || process.env.CLOUDFLARE_D1_DATABASE_ID;
    const apiToken = req.body.apiToken || process.env.CLOUDFLARE_D1_API_TOKEN;

    if (!accountId || !databaseId || !apiToken) {
      return res.status(400).json({
        error: 'Cloudflare credentials required to initialize schema remotely from Node server. In Cloudflare Pages live .dev, env.DB executes schema directly.',
      });
    }

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      return res.status(404).json({ error: 'schema.sql not found on server.' });
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    const statements = schemaSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const sql of statements) {
      await queryCloudflareD1(accountId, databaseId, apiToken, sql);
    }

    return res.json({ success: true, message: 'Cloudflare D1 schema initialized successfully!' });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// -------------------------------------------------------------
// Mount Vite SPA or Static Dist
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(__dirname, 'dist'))) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ProjectPulse server running on port ${PORT}`);
  });
}

startServer();
