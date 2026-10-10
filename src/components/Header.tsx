import React from 'react';
import { Layers, Plus, Lightbulb, Download, Upload, Volume2, VolumeX, ArrowLeft, LogOut, Server, Database } from 'lucide-react';

interface HeaderProps {
  currentProjectName?: string | null;
  distractionCount: number;
  onOpenNewProject: () => void;
  onOpenDistractions: () => void;
  onOpenSyncModal: () => void;
  onOpenD1Modal: () => void;
  onExport: () => void;
  onImportClick: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onGoHome: () => void;
  onLogout: () => void;
  isD1Configured?: boolean;
  isD1Live?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentProjectName,
  distractionCount,
  onOpenNewProject,
  onOpenDistractions,
  onOpenSyncModal,
  onOpenD1Modal,
  onExport,
  onImportClick,
  soundEnabled,
  onToggleSound,
  onGoHome,
  onLogout,
  isD1Configured,
  isD1Live,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0b0f17]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Navigation / Brand */}
        <div className="flex items-center gap-3">
          {/* Explicit Back to Projects Navigation Button when viewing a project */}
          {currentProjectName ? (
            <button
              onClick={onGoHome}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-bold transition-all shadow-sm group active:scale-[0.98]"
              title="Return to Projects list"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Projects</span>
            </button>
          ) : (
            <button
              onClick={onGoHome}
              className="flex items-center gap-2.5 text-left group transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg p-1"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-400 p-[1px] shadow-sm">
                <div className="w-full h-full bg-[#0f172a] rounded-[7px] flex items-center justify-center group-hover:bg-[#131d35] transition-colors">
                  <Layers className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white block leading-none">
                  ProjectPulse
                </span>
                <span className="text-[11px] text-slate-400 font-mono leading-none mt-1 block">
                  Multi-App Pipeline
                </span>
              </div>
            </button>
          )}

          {/* Contextual Project Indicator if viewing details */}
          {currentProjectName && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 border-l border-slate-800 pl-3">
              <span className="text-slate-500">Project:</span>
              <span className="text-white font-bold truncate max-w-xs">{currentProjectName}</span>
            </div>
          )}
        </div>

        {/* Zone 2: Navigation & Quick Utilities */}
        <nav className="hidden md:flex items-center gap-2 text-sm">
          {/* Cloudflare D1 Database Trigger */}
          <button
            onClick={onOpenD1Modal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors ${
              isD1Live
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                : isD1Configured
                ? 'bg-orange-500/15 border-orange-500/40 text-orange-300 hover:bg-orange-500/25'
                : 'bg-slate-800/80 border-slate-700/80 text-orange-400 hover:text-orange-300 hover:bg-slate-800'
            }`}
            title="Cloudflare D1 Database binding (env.DB) and query tools"
          >
            <Database className="w-3.5 h-3.5 text-orange-400" />
            <span>{isD1Live ? 'D1: Live env.DB' : 'Cloudflare D1'}</span>
            {isD1Live ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ) : isD1Configured ? (
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            ) : null}
          </button>

          {/* Website Server File Badge & GitHub Sync */}
          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors text-xs font-mono font-medium"
            title="Stored directly in website server file: data/app_data.json (Click to manage)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>data/app_data.json</span>
          </button>

          <button
            onClick={onOpenDistractions}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors text-xs font-medium"
            title="Open distraction parking lot to store intrusive thoughts without getting sidetracked"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Idea Parking Lot</span>
            {distractionCount > 0 && (
              <span className="font-mono text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold tabular-nums">
                {distractionCount}
              </span>
            )}
          </button>

          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors text-xs font-medium"
            title="Download JSON backup"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Backup</span>
          </button>

          <button
            onClick={onImportClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors text-xs font-medium"
            title="Restore from JSON backup"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Import</span>
          </button>

          <button
            onClick={onToggleSound}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            title={soundEnabled ? 'Mute chimes' : 'Enable sound chimes'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </nav>

        {/* Zone 3: Primary CTA & Lock/Logout */}
        <div className="flex items-center gap-2">
          {/* Mobile Cloudflare D1 trigger */}
          <button
            onClick={onOpenD1Modal}
            className="md:hidden p-2 rounded-lg text-orange-400 hover:bg-slate-800"
            title="Cloudflare D1 Database"
          >
            <Database className="w-4 h-4" />
          </button>

          {/* Mobile Sync trigger */}
          <button
            onClick={onOpenSyncModal}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800"
            title="Cross-Device Storage Sync"
          >
            <Server className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Mobile Parking Lot trigger */}
          <button
            onClick={onOpenDistractions}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800"
            title="Idea Parking Lot"
          >
            <Lightbulb className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={onOpenNewProject}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-sm hover:shadow-cyan-500/20 transition-all whitespace-nowrap active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Project</span>
          </button>

          {/* Lock / Logout Button */}
          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Lock workspace / Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
