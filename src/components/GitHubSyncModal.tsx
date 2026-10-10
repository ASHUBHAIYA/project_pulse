import React, { useState } from 'react';
import { GitHubSyncConfig } from '../utils/apiStorage';
import {
  Github,
  Server,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  ShieldCheck,
  FileCode,
} from 'lucide-react';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GitHubSyncConfig;
  onSaveConfig: (updated: GitHubSyncConfig) => void;
  onPullFromGitHub: () => Promise<void>;
  onPushToGitHub: () => Promise<void>;
  onForceSaveToWebsite: () => Promise<void>;
  serverLastSaved?: string | null;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onPullFromGitHub,
  onPushToGitHub,
  onForceSaveToWebsite,
  serverLastSaved,
}) => {
  const [activeTab, setActiveTab] = useState<'website' | 'github'>('website');
  const [form, setForm] = useState<GitHubSyncConfig>(config);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(form);
    setFeedback({ type: 'success', text: 'Settings saved successfully' });
  };

  const handlePull = async () => {
    try {
      setLoadingAction('pull');
      setFeedback(null);
      await onPullFromGitHub();
      setFeedback({ type: 'success', text: 'Successfully pulled latest data from GitHub!' });
    } catch (e) {
      setFeedback({ type: 'error', text: (e as Error).message });
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePush = async () => {
    try {
      setLoadingAction('push');
      setFeedback(null);
      await onPushToGitHub();
      setFeedback({ type: 'success', text: 'Successfully pushed and committed data to GitHub!' });
    } catch (e) {
      setFeedback({ type: 'error', text: (e as Error).message });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSaveWebsite = async () => {
    try {
      setLoadingAction('website');
      setFeedback(null);
      await onForceSaveToWebsite();
      setFeedback({ type: 'success', text: 'Data saved to the website server! Available from any device.' });
    } catch (e) {
      setFeedback({ type: 'error', text: (e as Error).message });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#101726] border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cross-Device Storage & Sync</h3>
              <p className="text-xs text-slate-400">
                Access the exact same data from your phone, laptop, or GitHub repo without a database.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Website Server File vs GitHub */}
        <div className="flex items-center gap-1 p-1 bg-[#090d16] border border-slate-800 rounded-xl my-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('website')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
              activeTab === 'website'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Website Server File</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
              Live
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
              activeTab === 'github'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Sync / Write</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-xl mb-4 flex items-start gap-2.5 text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* TAB 1: Website Server File */}
        {activeTab === 'website' && (
          <div className="space-y-4">
            <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Website Storage Active
                </span>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {serverLastSaved
                    ? `Last saved: ${new Date(serverLastSaved).toLocaleTimeString()}`
                    : 'Auto-sync active'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your projects and roadmap steps are automatically stored in the website’s own data file (<code className="text-cyan-300 font-mono text-[11px]">data/app_data.json</code>).
              </p>
              <div className="bg-[#0d1424] border border-cyan-950 rounded-xl p-3 text-xs text-slate-300">
                <p className="font-semibold text-cyan-300 mb-1">Moving between devices?</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Open this same website URL on your mobile phone, laptop, or tablet. Your data will automatically load from this website server! No database setup needed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Changes automatically write to the website file on edit.
              </span>
              <button
                type="button"
                onClick={handleSaveWebsite}
                disabled={loadingAction === 'website'}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{loadingAction === 'website' ? 'Saving...' : 'Force Save to Website'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: GitHub Sync (Pull / Push) */}
        {activeTab === 'github' && (
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 leading-relaxed">
              <p>
                Optionally sync or backup your roadmap directly to your personal <strong>GitHub Gist</strong> or <strong>GitHub Repository</strong> file.
              </p>
            </div>

            {/* Sync Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                GitHub Storage Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, mode: 'gist' })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-colors ${
                    form.mode === 'gist'
                      ? 'bg-cyan-500/15 border-cyan-500 text-white'
                      : 'bg-[#090d16] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="block font-bold">GitHub Gist</span>
                  <span className="text-[10px] text-slate-400">Secret or Public Gist file</span>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, mode: 'repo' })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-colors ${
                    form.mode === 'repo'
                      ? 'bg-cyan-500/15 border-cyan-500 text-white'
                      : 'bg-[#090d16] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="block font-bold">GitHub Repo File</span>
                  <span className="text-[10px] text-slate-400">e.g. user/repo/projects.json</span>
                </button>
              </div>
            </div>

            {/* GitHub Token */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300 font-mono">
                  GitHub Personal Access Token (PAT)
                </label>
                <a
                  href="https://github.com/settings/tokens/new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-cyan-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Generate Token</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                value={form.token}
                onChange={(e) => setForm({ ...form, token: e.target.value })}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Needs <code className="text-cyan-400">gist</code> permission for Gist, or <code className="text-cyan-400">repo</code> permission for Repository file.
              </span>
            </div>

            {/* Mode-specific fields */}
            {form.mode === 'gist' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                  Gist ID (leave empty to create a new secret Gist on push)
                </label>
                <input
                  type="text"
                  value={form.gistId || ''}
                  onChange={(e) => setForm({ ...form, gistId: e.target.value })}
                  placeholder="e.g. 8f6b1a9c4e2d3..."
                  className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            {form.mode === 'repo' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                    Repository (owner/repo)
                  </label>
                  <input
                    type="text"
                    value={form.repo || ''}
                    onChange={(e) => setForm({ ...form, repo: e.target.value })}
                    placeholder="username/my-roadmap"
                    className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                    File Path in Repo
                  </label>
                  <input
                    type="text"
                    value={form.filePath || ''}
                    onChange={(e) => setForm({ ...form, filePath: e.target.value })}
                    placeholder="projectpulse-data.json"
                    className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons: Pull from GitHub / Write to GitHub */}
            <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePull}
                  disabled={loadingAction === 'pull' || (!form.token && !form.rawUrl && !form.gistId)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold transition-colors"
                  title="Pull latest data from GitHub to this browser"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{loadingAction === 'pull' ? 'Pulling...' : 'Pull from GitHub'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePush}
                  disabled={loadingAction === 'push' || !form.token}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-40 text-slate-950 text-xs font-bold transition-all shadow-md"
                  title="Write and commit current data directly to GitHub"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{loadingAction === 'push' ? 'Pushing...' : 'Write to GitHub'}</span>
                </button>
              </div>

              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg transition-colors"
              >
                Save Settings
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
