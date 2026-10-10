import React from 'react';
import { Platform } from '../types';
import { Search, Smartphone, Globe, Layers, CheckCircle2, Clock, LayoutGrid, List } from 'lucide-react';

interface PlatformFilterBarProps {
  currentFilter: 'all' | Platform;
  onFilterChange: (filter: 'all' | Platform) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  stats: {
    totalProjects: number;
    androidCount: number;
    webCount: number;
    hybridCount: number;
    totalStepsDone: number;
    totalStepsPending: number;
  };
}

export const PlatformFilterBar: React.FC<PlatformFilterBarProps> = ({
  currentFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  stats,
}) => {
  return (
    <div className="space-y-4 mb-6">
      {/* Top row: Platform segmented tabs + Search + View mode switch */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Segmented platform controls */}
        <div className="flex items-center gap-1 p-1 bg-[#101726] border border-slate-800 rounded-xl overflow-x-auto shrink-0">
          <button
            onClick={() => onFilterChange('all')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentFilter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Projects</span>
            <span className="font-mono text-[10px] text-slate-400 tabular-nums">({stats.totalProjects})</span>
          </button>

          <button
            onClick={() => onFilterChange('android')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentFilter === 'android'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Android</span>
            <span className="font-mono text-[10px] text-emerald-400/70 tabular-nums">({stats.androidCount})</span>
          </button>

          <button
            onClick={() => onFilterChange('web')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentFilter === 'web'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Web App</span>
            <span className="font-mono text-[10px] text-cyan-400/70 tabular-nums">({stats.webCount})</span>
          </button>

          <button
            onClick={() => onFilterChange('both')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentFilter === 'both'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex -space-x-1">
              <Smartphone className="w-3 h-3 text-purple-400" />
              <Globe className="w-3 h-3 text-purple-300" />
            </div>
            <span>Android + Web</span>
            <span className="font-mono text-[10px] text-purple-400/70 tabular-nums">({stats.hybridCount})</span>
          </button>
        </div>

        {/* Right tools: Search + Grid/List View Switch */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-[#101726] border border-slate-800 rounded-xl pl-9 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode Toggle: Grid vs List */}
          <div className="flex items-center p-1 bg-[#101726] border border-slate-800 rounded-xl shrink-0">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid card view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats summary strip */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono py-1 px-1">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="font-semibold tabular-nums">{stats.totalStepsDone}</span> steps completed
        </span>
        <span className="text-slate-700">·</span>
        <span className="flex items-center gap-1.5 text-amber-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-semibold tabular-nums">{stats.totalStepsPending}</span> steps queued or in progress
        </span>
        <span className="text-slate-700">·</span>
        <span className="text-slate-400">
          Viewing as {viewMode === 'grid' ? 'Cards Grid' : 'Detailed List'}
        </span>
      </div>
    </div>
  );
};
