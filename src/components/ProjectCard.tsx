import React from 'react';
import { Project } from '../types';
import { ProgressRing } from './ProgressRing';
import { getProjectProgress, getPlatformBadge, getProjectStepCounts, getStepProgress } from '../utils/calculations';
import { Smartphone, Globe, ChevronRight, Target, CheckCircle2, Clock, Trash2 } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  isFocused: boolean;
  onOpenProject: (project: Project) => void;
  onSetFocus: (project: Project, stepId?: string) => void;
  onDeleteProject: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isFocused,
  onOpenProject,
  onSetFocus,
  onDeleteProject,
}) => {
  const overallProgress = getProjectProgress(project);
  const badge = getPlatformBadge(project.platform);
  const counts = getProjectStepCounts(project);

  // Find active step or next in-progress / pending step
  const activeStep =
    project.steps.find((s) => s.id === project.activeStepId) ||
    project.steps.find((s) => s.status === 'in_progress') ||
    project.steps.find((s) => s.status === 'pending');

  const activeStepProgress = activeStep ? getStepProgress(activeStep) : 0;

  return (
    <div
      onClick={() => onOpenProject(project)}
      className={`group bg-[#101726] border rounded-2xl p-5 cursor-pointer transition-all hover:bg-[#121c2e] hover:shadow-xl hover:shadow-cyan-950/20 relative flex flex-col justify-between ${
        isFocused
          ? 'border-cyan-500/50 shadow-md shadow-cyan-950/30'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div>
        {/* Top Header: Platform Tag, Delete Button & Overall Progress Ring */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${badge.bg} ${badge.border} ${badge.text}`}
            >
              {project.platform === 'android' && <Smartphone className="w-3 h-3" />}
              {project.platform === 'web' && <Globe className="w-3 h-3" />}
              {project.platform === 'both' && (
                <div className="flex -space-x-1">
                  <Smartphone className="w-2.5 h-2.5" />
                  <Globe className="w-2.5 h-2.5" />
                </div>
              )}
              <span>{badge.label}</span>
            </span>

            {isFocused && (
              <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded flex items-center gap-1">
                <Target className="w-3 h-3 text-cyan-400" /> Active Focus
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Delete Project Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteProject(project);
              }}
              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-70 group-hover:opacity-100"
              title="Delete project"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <ProgressRing
              progress={overallProgress}
              size={46}
              strokeWidth={4.5}
              color={overallProgress === 100 ? '#10b981' : badge.color}
              textSize="text-[11px]"
              subtitle="total"
            />
          </div>
        </div>

        {/* Project Title & Description */}
        <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
          {project.name}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2 mt-1 mb-4 leading-relaxed">
          {project.description || 'No description provided.'}
        </p>

        {/* Step Breakdown Status Metric */}
        <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-3 mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Roadmap Steps</span>
            <span className="text-slate-200 font-medium tabular-nums">
              <span className="text-emerald-400 font-semibold">{counts.done}</span>
              <span className="text-slate-600"> / </span>
              {counts.total} done
            </span>
          </div>

          {/* Granular task meter */}
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden flex">
            {counts.total > 0 && (
              <>
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${(counts.done / counts.total) * 100}%` }}
                />
                <div
                  className="bg-cyan-500 h-full transition-all duration-300"
                  style={{ width: `${(counts.inProgress / counts.total) * 100}%` }}
                />
              </>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
            <span className="flex items-center gap-1 text-slate-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="tabular-nums">{counts.completedTasks}</span> tasks done
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3 text-amber-400" />
              <span className="tabular-nums">{counts.totalTasks - counts.completedTasks}</span> to do
            </span>
          </div>
        </div>

        {/* Current Active Step Highlight */}
        {activeStep ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                {activeStep.status === 'in_progress' ? 'Current Step' : 'Up Next'}
              </span>
              <span className="font-mono text-[11px] text-cyan-400 tabular-nums">
                {activeStepProgress}%
              </span>
            </div>
            <p className="font-semibold text-slate-200 truncate">{activeStep.title}</p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              {activeStep.checklist.filter((c) => c.completed).length} of {activeStep.checklist.length} checklist items finished
            </p>
          </div>
        ) : (
          <div className="p-3 text-xs text-emerald-400 bg-emerald-500/10 rounded-xl mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>All steps completed!</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80 mt-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSetFocus(project, activeStep?.id);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            isFocused
              ? 'bg-cyan-500/20 text-cyan-300'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Pin this project and step as your primary focus"
        >
          <Target className="w-3.5 h-3.5" />
          <span>{isFocused ? 'Focused' : 'Set as Focus'}</span>
        </button>

        <span className="flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
          <span>Manage Steps</span>
          <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
};
