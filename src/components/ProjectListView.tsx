import React from 'react';
import { Project } from '../types';
import { ProgressRing } from './ProgressRing';
import { getProjectProgress, getPlatformBadge, getProjectStepCounts, getStepProgress } from '../utils/calculations';
import { Smartphone, Globe, ChevronRight, Target, Trash2, CheckCircle2, Clock } from 'lucide-react';

interface ProjectListViewProps {
  projects: Project[];
  activeFocusProjectId: string | null;
  onOpenProject: (project: Project) => void;
  onSetFocus: (project: Project, stepId?: string) => void;
  onDeleteProject: (project: Project) => void;
}

export const ProjectListView: React.FC<ProjectListViewProps> = ({
  projects,
  activeFocusProjectId,
  onOpenProject,
  onSetFocus,
  onDeleteProject,
}) => {
  return (
    <div className="bg-[#101726] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Table-like Header */}
      <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-[#0d1422] border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold select-none">
        <div className="col-span-4">Project & Platform</div>
        <div className="col-span-3">Current / Next Milestone</div>
        <div className="col-span-2 text-center">Roadmap Steps</div>
        <div className="col-span-1 text-center">Tasks Done</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-800/80">
        {projects.map((project) => {
          const overallProgress = getProjectProgress(project);
          const badge = getPlatformBadge(project.platform);
          const counts = getProjectStepCounts(project);
          const isFocused = activeFocusProjectId === project.id;

          const activeStep =
            project.steps.find((s) => s.id === project.activeStepId) ||
            project.steps.find((s) => s.status === 'in_progress') ||
            project.steps.find((s) => s.status === 'pending');

          const activeStepProgress = activeStep ? getStepProgress(activeStep) : 0;

          return (
            <div
              key={project.id}
              onClick={() => onOpenProject(project)}
              className={`group px-5 sm:px-6 py-4 cursor-pointer transition-all hover:bg-[#131d31] flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 items-start lg:items-center ${
                isFocused ? 'bg-cyan-950/20' : 'bg-transparent'
              }`}
            >
              {/* Col 1: Project Name & Platform */}
              <div className="lg:col-span-4 min-w-0 w-full">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bg} ${badge.border} ${badge.text}`}
                  >
                    {project.platform === 'android' && <Smartphone className="w-2.5 h-2.5" />}
                    {project.platform === 'web' && <Globe className="w-2.5 h-2.5" />}
                    {project.platform === 'both' && (
                      <div className="flex -space-x-1">
                        <Smartphone className="w-2.5 h-2.5" />
                        <Globe className="w-2.5 h-2.5" />
                      </div>
                    )}
                    <span>{badge.label}</span>
                  </span>

                  {isFocused && (
                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Target className="w-2.5 h-2.5" /> Focus
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                  {project.name}
                </h4>
                {project.description && (
                  <p className="text-xs text-slate-400 truncate mt-0.5 max-w-sm">
                    {project.description}
                  </p>
                )}
              </div>

              {/* Col 2: Current / Next Milestone */}
              <div className="lg:col-span-3 min-w-0 w-full">
                {activeStep ? (
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">
                        {activeStep.status === 'in_progress' ? 'Active' : 'Queued'}
                      </span>
                      <span className="text-slate-600 font-mono text-xs">·</span>
                      <span className="text-[11px] font-mono text-cyan-400 tabular-nums">
                        {activeStepProgress}%
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {activeStep.title}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {activeStep.checklist.filter((c) => c.completed).length} of {activeStep.checklist.length} to-dos
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>All steps complete</span>
                  </div>
                )}
              </div>

              {/* Col 3: Roadmap Steps Progress */}
              <div className="lg:col-span-2 flex items-center justify-start lg:justify-center gap-3 w-full lg:w-auto">
                <ProgressRing
                  progress={overallProgress}
                  size={40}
                  strokeWidth={4}
                  color={overallProgress === 100 ? '#10b981' : badge.color}
                  textSize="text-[10px]"
                />
                <div className="text-left font-mono">
                  <span className="text-xs text-slate-200 font-semibold tabular-nums block leading-tight">
                    {counts.done} / {counts.total}
                  </span>
                  <span className="text-[10px] text-slate-500 block leading-tight">
                    steps done
                  </span>
                </div>
              </div>

              {/* Col 4: Tasks count */}
              <div className="lg:col-span-1 text-left lg:text-center w-full lg:w-auto font-mono">
                <span className="text-xs text-slate-300 font-semibold tabular-nums block">
                  {counts.completedTasks}/{counts.totalTasks}
                </span>
                <span className="text-[10px] text-slate-500 block">tasks</span>
              </div>

              {/* Col 5: Actions */}
              <div className="lg:col-span-2 flex items-center justify-between lg:justify-end gap-2 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/60">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetFocus(project, activeStep?.id);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    isFocused
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Anchor this project as current focus"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isFocused ? 'Focused' : 'Focus'}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(project);
                  }}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Delete project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1 text-xs font-semibold text-cyan-400 pl-1">
                  <span className="hidden xl:inline">Steps</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
