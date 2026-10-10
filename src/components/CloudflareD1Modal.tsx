import React, { useState, useEffect } from 'react';
import {
  CloudflareD1Config,
  CloudflareD1Status,
  fetchD1LiveStatus,
  testCloudflareD1Connection,
  initCloudflareD1Schema,
  syncProjectsToCloudflareD1,
  pullProjectsFromCloudflareD1,
  executeD1Query,
} from '../utils/cloudflareD1';
import { Project, DistractionNote } from '../types';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Upload,
  Download,
  Terminal,
  Play,
  X,
  RefreshCw,
  Zap,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CloudflareD1ModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CloudflareD1Config;
  onSaveConfig: (updated: CloudflareD1Config) => void;
  projects: Project[];
  distractions: DistractionNote[];
  onDataLoadedFromD1: (projects: Project[], distractions: DistractionNote[]) => void;
}

export const CloudflareD1Modal: React.FC<CloudflareD1ModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  projects,
  distractions,
  onDataLoadedFromD1,
}) => {
  const [form, setForm] = useState<CloudflareD1Config>(config);
  const [activeTab, setActiveTab] = useState<'binding' | 'query' | 'credentials'>('binding');
  const [liveStatus, setLiveStatus] = useState<CloudflareD1Status | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // SQL Query Runner state
  const [sqlQuery, setSqlQuery] = useState('SELECT id, name, platform, updated_at FROM projects;');
  const [queryResults, setQueryResults] = useState<unknown[] | null>(null);

  // Load live D1 status on open
  useEffect(() => {
    if (isOpen) {
      loadLiveStatus();
    }
  }, [isOpen]);

  const loadLiveStatus = async () => {
    setLoadingAction('status');
    try {
      const status = await fetchD1LiveStatus();
      setLiveStatus(status);
    } catch {
      // ignore
    } finally {
      setLoadingAction(null);
    }
  };

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(form);
    setStatusMessage({ type: 'success', text: 'Cloudflare D1 configuration saved!' });
  };

  const handleTestLiveBinding = async () => {
    try {
      setLoadingAction('test_live');
      setStatusMessage(null);
      const res = await executeD1Query(form, 'SELECT 1 as live_connected;');
      setStatusMessage({
        type: 'success',
        text: `Live D1 query succeeded! Result: ${JSON.stringify(res.results)}`,
      });
      await loadLiveStatus();
    } catch (e) {
      setStatusMessage({ type: 'error', text: (e as Error).message });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleInitSchema = async () => {
    try {
      setLoadingAction('schema');
      setStatusMessage(null);
      const res = await initCloudflareD1Schema(form);
      setStatusMessage({
        type: 'success',
        text: res.message || 'D1 tables (projects, distractions, focus_sessions, app_meta) initialized successfully!',
      });
      await loadLiveStatus();
    } catch (e) {
      setStatusMessage({ type: 'error', text: (e as Error).message });
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePushToD1 = async () => {
    try {
      setLoadingAction('push');
      setStatusMessage(null);
      const res = await syncProjectsToCloudflareD1(form, projects, distractions);
      const updated = { ...form, lastSyncedAt: res.updatedAt };
      setForm(updated);
      onSaveConfig(updated);
      setStatusMessage({
        type: 'success',
        text: `Successfully synced ${res.syncedProjects} projects and ${distractions.length} parked ideas into Cloudflare D1!`,
      });
      await loadLiveStatus();
    } catch (e) {
      setStatusMessage({ type: 'error', text: (e as Error).message });
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePullFromD1 = async () => {
    try {
      setLoadingAction('pull');
      setStatusMessage(null);
      const res = await pullProjectsFromCloudflareD1(form);
      onDataLoadedFromD1(res.projects, res.distractions);
      setStatusMessage({
        type: 'success',
        text: `Loaded ${res.projects.length} projects and ${res.distractions.length} parked ideas from Cloudflare D1!`,
      });
      await loadLiveStatus();
    } catch (e) {
      setStatusMessage({ type: 'error', text: (e as Error).message });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRunQuery = async () => {
    try {
      setLoadingAction('query');
      setStatusMessage(null);
      const res = await executeD1Query(form, sqlQuery);
      setQueryResults(res.results || []);
      setStatusMessage({ type: 'success', text: `Query executed. Returned ${res.results?.length || 0} rows.` });
    } catch (e) {
      setStatusMessage({ type: 'error', text: (e as Error).message });
    } finally {
      setLoadingAction(null);
    }
  };

  const wranglerSnippet = `[[d1_databases]]
binding = "DB"
database_name = "projectpulse-db"
database_id = "${form.databaseId || '<your-d1-database-id>'}"`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e1422] border border-orange-500/30 rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Cloudflare D1 Database</h3>
                <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 font-mono px-2 py-0.5 rounded font-semibold">
                  Binding: env.DB
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Serverless SQLite relational database at the edge with live binding in .dev
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Binding Status Banner */}
        <div className="my-4 p-4 rounded-2xl bg-[#090d16] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {liveStatus?.isLiveBinding && liveStatus?.connected ? (
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse shrink-0 ring-4 ring-emerald-500/20" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shrink-0 ring-4 ring-amber-500/20" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {liveStatus?.isLiveBinding && liveStatus?.connected
                    ? 'Live env.DB Binding: Active & Connected'
                    : 'Cloudflare D1 Binding: Ready for Live .dev'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {liveStatus?.provider || 'server_file'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {liveStatus?.isLiveBinding && liveStatus?.connected
                  ? `Directly persisting to Cloudflare D1 (Projects in DB: ${liveStatus.projectCount ?? '—'}).`
                  : 'In live .dev, Cloudflare binds your D1 database to env.DB. Local dev uses data/app_data.json fallback.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleTestLiveBinding}
              disabled={loadingAction === 'test_live'}
              className="px-2.5 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Zap className="w-3 h-3" />
              <span>{loadingAction === 'test_live' ? 'Testing...' : 'Test DB'}</span>
            </button>

            <button
              type="button"
              onClick={loadLiveStatus}
              disabled={loadingAction === 'status'}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              title="Refresh status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAction === 'status' ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-[#090d16] border border-slate-800 rounded-xl mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('binding')}
            className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'binding'
                ? 'bg-slate-800 text-orange-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Live .dev Binding</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('query')}
            className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'query'
                ? 'bg-slate-800 text-orange-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>SQL Query Console</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'bg-slate-800 text-orange-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>REST API Config (Optional)</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl mb-4 flex items-start gap-2.5 text-xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : statusMessage.type === 'info'
                ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* TAB 1: Live .dev Environment Binding */}
        {activeTab === 'binding' && (
          <div className="space-y-4">
            {/* Quick Actions Card */}
            <div className="border border-slate-800 rounded-2xl p-4 bg-[#090d16] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">One-Click D1 Actions</span>
                  <span className="text-[11px] text-slate-400">
                    Operate directly on the bound D1 database
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleInitSchema}
                  disabled={loadingAction === 'schema'}
                  className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{loadingAction === 'schema' ? 'Initializing...' : 'Initialize Schema'}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handlePushToD1}
                  disabled={loadingAction === 'push'}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{loadingAction === 'push' ? 'Pushing...' : `Push Projects to D1 (${projects.length})`}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePullFromD1}
                  disabled={loadingAction === 'pull'}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{loadingAction === 'pull' ? 'Pulling...' : 'Pull from D1'}</span>
                </button>
              </div>
            </div>

            {/* Cloudflare Pages Dashboard Step */}
            <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-[11px] font-mono flex items-center justify-center font-bold">
                  1
                </span>
                Bind in Cloudflare Pages Dashboard (Live .dev)
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed pl-7">
                Go to <strong>Workers & Pages → Your Project → Settings → Functions → D1 Database Bindings</strong>.
                Click <strong>Add binding</strong>:
              </p>
              <div className="bg-[#050811] rounded-xl p-3 text-xs font-mono pl-7 grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">VARIABLE NAME</span>
                  <span className="text-orange-400 font-bold">DB</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">D1 DATABASE</span>
                  <span className="text-emerald-400 font-bold">projectpulse-db</span>
                </div>
              </div>
            </div>

            {/* Wrangler CLI Instructions */}
            <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-[11px] font-mono flex items-center justify-center font-bold">
                    2
                  </span>
                  Create Database & Run Migration (Cloudflare CLI)
                </span>
                <button
                  onClick={() => handleCopy('npx wrangler d1 create projectpulse-db', 'cmd1')}
                  className="text-[11px] text-orange-400 hover:underline flex items-center gap-1 font-mono"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedText === 'cmd1' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="bg-[#050811] p-3 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto">
                npx wrangler d1 create projectpulse-db
              </pre>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">Execute schema.sql on remote database:</span>
                <button
                  onClick={() => handleCopy('npx wrangler d1 execute projectpulse-db --file=./schema.sql', 'cmd2')}
                  className="text-[11px] text-orange-400 hover:underline flex items-center gap-1 font-mono"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedText === 'cmd2' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="bg-[#050811] p-3 rounded-xl text-xs font-mono text-cyan-400 overflow-x-auto">
                npx wrangler d1 execute projectpulse-db --file=./schema.sql
              </pre>
            </div>

            {/* wrangler.toml file */}
            <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-[11px] font-mono flex items-center justify-center font-bold">
                    3
                  </span>
                  Config in wrangler.toml (Ready in codebase)
                </span>
                <button
                  onClick={() => handleCopy(wranglerSnippet, 'wrangler')}
                  className="text-[11px] text-orange-400 hover:underline flex items-center gap-1 font-mono"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedText === 'wrangler' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="bg-[#050811] p-3 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto">
                {wranglerSnippet}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 2: Query Console */}
        {activeTab === 'query' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 font-mono">
                SQL Query Console
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                Runs on Cloudflare D1
              </span>
            </div>

            {/* Quick Query Shortcuts */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSqlQuery('SELECT id, name, platform, updated_at FROM projects;')}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px]"
              >
                SELECT projects
              </button>
              <button
                type="button"
                onClick={() => setSqlQuery('SELECT id, text, resolved, created_at FROM distractions;')}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px]"
              >
                SELECT distractions
              </button>
              <button
                type="button"
                onClick={() => setSqlQuery('SELECT count(*) as count FROM projects;')}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px]"
              >
                Count projects
              </button>
              <button
                type="button"
                onClick={() => setSqlQuery('SELECT * FROM focus_sessions;')}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px]"
              >
                Focus sessions
              </button>
            </div>

            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              rows={3}
              className="w-full bg-[#050811] border border-slate-700 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-orange-500"
            />

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleRunQuery}
                disabled={loadingAction === 'query'}
                className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{loadingAction === 'query' ? 'Executing...' : 'Run SQL Query'}</span>
              </button>
            </div>

            {/* Results display */}
            {queryResults && (
              <div className="bg-[#050811] border border-slate-800 rounded-2xl p-3 max-h-60 overflow-auto">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block mb-2">
                  Query Results ({queryResults.length} rows)
                </span>
                <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">
                  {JSON.stringify(queryResults, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REST API Config (Optional) */}
        {activeTab === 'credentials' && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-orange-400" />
                  Remote REST API Bridge (Optional)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {form.connected ? '● Configured' : '○ Not configured'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Only needed if you want to connect to remote Cloudflare D1 from a local Node server (localhost:3000) outside of Cloudflare Pages. In live .dev, the binding <code className="text-orange-400 font-mono">env.DB</code> connects directly without needing API keys.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                  Cloudflare Account ID
                </label>
                <input
                  type="text"
                  value={form.accountId}
                  onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                  placeholder="e.g. b8f3d4a1c5e..."
                  className="w-full bg-[#050811] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                  D1 Database ID
                </label>
                <input
                  type="text"
                  value={form.databaseId}
                  onChange={(e) => setForm({ ...form, databaseId: e.target.value })}
                  placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full bg-[#050811] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 font-mono">
                    Cloudflare API Token
                  </label>
                  <a
                    href="https://dash.cloudflare.com/profile/api-tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-orange-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Create Token</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={form.apiToken}
                  onChange={(e) => setForm({ ...form, apiToken: e.target.value })}
                  placeholder="API Token with D1:Edit permissions"
                  className="w-full bg-[#050811] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    setLoadingAction('test_rest');
                    setStatusMessage(null);
                    await testCloudflareD1Connection(form);
                    const updated = { ...form, connected: true };
                    setForm(updated);
                    onSaveConfig(updated);
                    setStatusMessage({ type: 'success', text: 'REST API connection verified!' });
                  } catch (e) {
                    setStatusMessage({ type: 'error', text: (e as Error).message });
                  } finally {
                    setLoadingAction(null);
                  }
                }}
                disabled={loadingAction === 'test_rest' || !form.accountId || !form.databaseId || !form.apiToken}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-40"
              >
                {loadingAction === 'test_rest' ? 'Testing...' : 'Test REST Connection'}
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-xs text-white font-bold rounded-xl transition-colors shadow-md"
              >
                Save REST Config
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
