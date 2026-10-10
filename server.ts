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
        updatedAt: parsed.updatedAt || null,
      });
    }
    return res.json({ exists: false, projects: null, distractions: null });
  } catch (err) {
    console.error('Error reading website data file:', err);
    return res.status(500).json({ error: 'Failed to read data file' });
  }
});

// POST /api/data - Save data directly into the website's server file
app.post('/api/data', (req, res) => {
  try {
    const { projects, distractions } = req.body;
    const payload = {
      projects: projects || [],
      distractions: distractions || [],
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    return res.json({ success: true, updatedAt: payload.updatedAt });
  } catch (err) {
    console.error('Error writing website data file:', err);
    return res.status(500).json({ error: 'Failed to write data file' });
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
