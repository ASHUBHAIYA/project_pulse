import React from 'react';
import { Project, ProjectStep } from '../types';
import { ProgressRing } from './ProgressRing';
import { getStepProgress } from '../utils/calculations';
import { Bell, CheckCircle2, Clock, Lightbulb, Compass, X } from 'lucide-react';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: Project | null;
  activeStep: ProjectStep | null;
  onExtendTimer: (minutes: number) => void;
  onOpenStepChecklist: () => void;
  onOpenParkingLot: () => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  activeStep,
  onExtendTimer,
  onOpenStepChecklist,
  onOpenParkingLot,
}) => {
  if (!isOpen || !activeProject || !activeStep) return null;

  const progress = getStepProgress(activeStep);
  const nextIncompleteTask = activeStep.checklist.find((c) => !c.completed);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#101726] border border-cyan-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
        {/* Soft top gradient */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 to-emerald-400" />

        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Focus Check-In</h3>
              <p className="text-xs text-slate-400">
                Checking in so you don't wander off onto side tasks!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Anchor Card */}
        <div className="bg-[#090d16] border border-slate-800 rounded-xl p-4 mb-5 flex items-center gap-4">
          <ProgressRing progress={progress} size={52} strokeWidth={5} color="#06b6d4" />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block mb-0.5">
              Current Project Anchor
            </span>
            <h4 className="text-sm font-bold text-white truncate">{activeStep.title}</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeProject.name} · {activeStep.checklist.filter((c) => c.completed).length} of{' '}
              {activeStep.checklist.length} tasks done
            </p>
          </div>
        </div>

        {/* Next Task Reminder */}
        {nextIncompleteTask && (
          <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-xl p-3 mb-5 flex items-start gap-2.5">
            <Compass className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-cyan-300 block">
                Up next on your checklist:
              </span>
              <p className="text-xs text-slate-200 mt-0.5 font-medium">
                "{nextIncompleteTask.title}"
              </p>
            </div>
          </div>
        )}

        {/* Action Choices */}
        <div className="space-y-2">
          <button
            onClick={() => {
              onExtendTimer(25);
              onClose();
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-slate-950 font-bold text-xs transition-all shadow-md"
          >
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 stroke-[2.5]" />
              <span>Still focused! Keep timer going (+25 min)</span>
            </span>
            <span className="text-slate-950/70 font-mono text-[11px]">→</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenStepChecklist();
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0d1424] hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-semibold transition-colors"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>I finished tasks! Open checklist to mark done</span>
            </span>
            <span className="text-slate-400 font-mono text-[11px]">→</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenParkingLot();
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-colors"
          >
            <span className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              <span>I got an impulse thought! Park it in Idea Lot</span>
            </span>
            <span className="text-amber-400 font-mono text-[11px]">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
