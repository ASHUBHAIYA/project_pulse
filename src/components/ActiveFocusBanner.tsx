import React from 'react';
import { Project, ProjectStep, FocusSession } from '../types';
import { ProgressRing } from './ProgressRing';
import { getStepProgress, getPlatformBadge } from '../utils/calculations';
import { Play, Pause, RotateCcw, Target, ExternalLink, Lightbulb, BellRing } from 'lucide-react';

interface ActiveFocusBannerProps {
  activeProject: Project | null;
  activeStep: ProjectStep | null;
  focusSession: FocusSession;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSetTargetMinutes: (mins: number) => void;
  onTriggerCheckIn: () => void;
  onOpenParkingLot: () => void;
  onViewProjectStep: (projectId: string, stepId: string) => void;
}

export const ActiveFocusBanner: React.FC<ActiveFocusBannerProps> = ({
  activeProject,
  activeStep,
  focusSession,
  onToggleTimer,
  onResetTimer,
  onSetTargetMinutes,
  onTriggerCheckIn,
  onOpenParkingLot,
  onViewProjectStep,
}) => {
  if (!activeProject || !activeStep) {
    return (
      <div className="bg-[#101726] border border-slate-800 rounded-xl p-4 my-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200">No Active Focus Step Selected</h4>
            <p className="text-xs text-slate-400">
              Pin any project step as your active focus to prevent context switching and enable check-in alerts.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const progress = getStepProgress(activeStep);
  const platformBadge = getPlatformBadge(activeProject.platform);

  const completedCount = activeStep.checklist.filter((c) => c.completed).length;
  const totalCount = activeStep.checklist.length;

  const minutes = Math.floor(focusSession.timerSecondsLeft / 60);
  const seconds = focusSession.timerSecondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <section className="bg-gradient-to-r from-[#0d1527] via-[#0f1b2f] to-[#0c1626] border border-cyan-500/20 rounded-2xl p-4 sm:p-5 my-6 shadow-lg shadow-cyan-950/20 relative overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        {/* Step identity */}
        <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
          <ProgressRing
            progress={progress}
            size={56}
            strokeWidth={5}
            color={progress === 100 ? '#10b981' : platformBadge.color}
            textSize="text-xs"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <Target className="w-3 h-3 text-cyan-400" /> Current Focus
              </span>
              <span className="text-slate-600 text-xs font-mono">·</span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${platformBadge.bg} ${platformBadge.border} ${platformBadge.text}`}>
                {activeProject.name}
              </span>
              <span className="text-slate-600 text-xs font-mono">·</span>
              <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                {completedCount}/{totalCount} tasks done
              </span>
            </div>

            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">
                {activeStep.title}
              </h3>
              <button
                onClick={() => onViewProjectStep(activeProject.id, activeStep.id)}
                className="text-slate-400 hover:text-cyan-300 p-1 rounded hover:bg-slate-800 transition-colors shrink-0"
                title="View step details & checklists"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeStep.description && (
              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 max-w-xl">
                {activeStep.description}
              </p>
            )}
          </div>
        </div>

        {/* Focus Timer & Distraction Control Strip */}
        <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto justify-between lg:justify-end border-t lg:border-t-0 border-slate-800/80 pt-3 lg:pt-0">
          {/* Timer Display */}
          <div className="flex items-center gap-2 bg-[#090d16] border border-slate-800 rounded-xl px-3 py-1.5">
            <span
              className={`font-mono text-lg font-bold tabular-nums ${
                focusSession.timerRunning ? 'text-cyan-400 animate-pulse' : 'text-slate-300'
              }`}
            >
              {formattedTime}
            </span>

            <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
              <button
                onClick={onToggleTimer}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  focusSession.timerRunning
                    ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                }`}
                title={focusSession.timerRunning ? 'Pause focus timer' : 'Start focus timer'}
              >
                {focusSession.timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={onResetTimer}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick timer presets */}
          <div className="hidden sm:flex items-center gap-1 bg-[#090d16] border border-slate-800 rounded-lg p-1 text-[11px] font-mono">
            {[15, 25, 45].map((mins) => (
              <button
                key={mins}
                onClick={() => onSetTargetMinutes(mins)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  focusSession.targetMinutes === mins
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          {/* Quick Anti-Distraction Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onTriggerCheckIn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              title="Trigger a quick check-in prompt to see if you got distracted"
            >
              <BellRing className="w-3.5 h-3.5 text-cyan-400" />
              <span>Check-in</span>
            </button>

            <button
              onClick={onOpenParkingLot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium transition-colors"
              title="Got a random idea or urge to switch? Park it here so you stay on track!"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Park Idea</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
