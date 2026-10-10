import React, { useState } from 'react';
import { ProjectStep, ChecklistItem, StepStatus } from '../types';
import { ProgressRing } from './ProgressRing';
import { getStepProgress } from '../utils/calculations';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Target,
  Edit2,
  Check,
  X,
  FileText,
  Sparkles,
} from 'lucide-react';

interface StepCardProps {
  step: ProjectStep;
  stepNumber: number;
  isFocused: boolean;
  onUpdateStep: (updatedStep: ProjectStep) => void;
  onDeleteStep: (stepId: string) => void;
  onSetFocusStep: (stepId: string) => void;
  soundEnabled: boolean;
}

export const StepCard: React.FC<StepCardProps> = ({
  step,
  stepNumber,
  isFocused,
  onUpdateStep,
  onDeleteStep,
  onSetFocusStep,
  soundEnabled,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(step.status === 'in_progress' || isFocused);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(step.title);
  const [descValue, setDescValue] = useState(step.description);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const progress = getStepProgress(step);

  const handleStatusChange = (newStatus: StepStatus) => {
    let updatedChecklist = step.checklist;
    if (newStatus === 'done') {
      // Mark all checklist items as completed
      updatedChecklist = step.checklist.map((item) => ({
        ...item,
        completed: true,
        completedAt: item.completedAt || new Date().toISOString(),
      }));
      if (soundEnabled) sound.playStepComplete();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }

    onUpdateStep({
      ...step,
      status: newStatus,
      checklist: updatedChecklist,
    });
  };

  const handleToggleChecklist = (itemId: string) => {
    const item = step.checklist.find((c) => c.id === itemId);
    const nextCompleted = !item?.completed;

    const updatedChecklist = step.checklist.map((c) => {
      if (c.id === itemId) {
        return {
          ...c,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        };
      }
      return c;
    });

    if (soundEnabled) sound.playTick();

    // Check if all are now completed
    const allDone = updatedChecklist.length > 0 && updatedChecklist.every((c) => c.completed);
    let nextStatus = step.status;
    if (allDone && step.status !== 'done') {
      nextStatus = 'done';
      if (soundEnabled) sound.playStepComplete();
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else if (!allDone && step.status === 'done') {
      nextStatus = 'in_progress';
    } else if (nextCompleted && step.status === 'pending') {
      nextStatus = 'in_progress';
    }

    onUpdateStep({
      ...step,
      status: nextStatus,
      checklist: updatedChecklist,
    });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newItem: ChecklistItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newTaskTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    onUpdateStep({
      ...step,
      checklist: [...step.checklist, newItem],
      status: step.status === 'done' ? 'in_progress' : step.status,
    });

    setNewTaskTitle('');
  };

  const handleDeleteTask = (itemId: string) => {
    onUpdateStep({
      ...step,
      checklist: step.checklist.filter((c) => c.id !== itemId),
    });
  };

  const handleSaveStepInfo = () => {
    onUpdateStep({
      ...step,
      title: titleValue.trim() || step.title,
      description: descValue.trim(),
    });
    setEditingTitle(false);
  };

  const handleSaveNote = (itemId: string) => {
    onUpdateStep({
      ...step,
      checklist: step.checklist.map((c) => (c.id === itemId ? { ...c, notes: noteDraft.trim() || undefined } : c)),
    });
    setEditingNoteId(null);
  };

  const completedCount = step.checklist.filter((c) => c.completed).length;

  return (
    <div
      className={`border rounded-2xl transition-all duration-200 ${
        isFocused
          ? 'bg-[#121c2e] border-cyan-500/60 shadow-lg shadow-cyan-950/20'
          : step.status === 'done'
          ? 'bg-[#0f1922] border-emerald-900/40'
          : 'bg-[#101726] border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Step Header */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            {/* Step Number & Progress */}
            <div className="relative shrink-0">
              <ProgressRing
                progress={progress}
                size={48}
                strokeWidth={4.5}
                color={step.status === 'done' ? '#10b981' : isFocused ? '#06b6d4' : '#38bdf8'}
                textSize="text-[11px]"
              />
              <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-slate-800 border border-slate-700 rounded-full text-[10px] font-mono font-bold text-slate-300 flex items-center justify-center">
                {stepNumber}
              </span>
            </div>

            {/* Title & Metadata */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {step.category && (
                  <span className="text-[11px] font-medium text-slate-400">
                    {step.category}
                  </span>
                )}
                <span className="text-slate-700 text-xs font-mono">·</span>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {completedCount}/{step.checklist.length} items done
                </span>

                {isFocused && (
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded flex items-center gap-1">
                    <Target className="w-2.5 h-2.5 text-cyan-400" /> Current Focus
                  </span>
                )}
              </div>

              {editingTitle ? (
                <div className="space-y-2 mt-2">
                  <input
                    type="text"
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-cyan-500 rounded-lg px-2.5 py-1 text-sm font-bold text-white focus:outline-none"
                    placeholder="Step Title"
                  />
                  <textarea
                    value={descValue}
                    onChange={(e) => setDescValue(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
                    placeholder="Step Description (optional)"
                    rows={2}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveStepInfo}
                      className="flex items-center gap-1 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold"
                    >
                      <Check className="w-3 h-3" /> Save
                    </button>
                    <button
                      onClick={() => setEditingTitle(false)}
                      className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group/title flex items-start gap-2">
                  <h4
                    className={`text-base font-bold leading-tight ${
                      step.status === 'done' ? 'text-slate-300 line-through decoration-emerald-500/40' : 'text-white'
                    }`}
                  >
                    {step.title}
                  </h4>
                  <button
                    onClick={() => {
                      setTitleValue(step.title);
                      setDescValue(step.description);
                      setEditingTitle(true);
                    }}
                    className="opacity-0 group-hover/title:opacity-100 text-slate-400 hover:text-cyan-400 p-0.5 transition-opacity"
                    title="Edit step title"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}

              {!editingTitle && step.description && (
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {step.description}
                </p>
              )}
            </div>
          </div>

          {/* Status Selector & Controls */}
          <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
            {/* Status Segmented Buttons */}
            <div className="flex items-center p-0.5 bg-[#0b0f17] border border-slate-800 rounded-lg text-xs font-medium">
              <button
                onClick={() => handleStatusChange('pending')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  step.status === 'pending'
                    ? 'bg-slate-800 text-slate-200 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => handleStatusChange('in_progress')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  step.status === 'in_progress'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => handleStatusChange('done')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  step.status === 'done'
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Done
              </button>
            </div>

            {/* Set as Focus Button */}
            <button
              onClick={() => onSetFocusStep(step.id)}
              className={`p-1.5 rounded-lg transition-colors ${
                isFocused
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Pin this step as current focus"
            >
              <Target className="w-4 h-4" />
            </button>

            {/* Expand / Collapse Checklist */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Delete Step */}
            <button
              onClick={() => onDeleteStep(step.id)}
              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Delete step"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Checklist Section */}
      {isExpanded && (
        <div className="border-t border-slate-800/80 bg-[#090e18]/60 p-4 sm:p-5 rounded-b-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <span>Granular Subtasks & To-Do Checklist</span>
              <span className="text-slate-500 font-normal">({step.checklist.length})</span>
            </h5>

            {step.checklist.length > 0 && (
              <div className="flex items-center gap-3 text-xs">
                <button
                  onClick={() => {
                    const allComplete = step.checklist.every((c) => c.completed);
                    const updated = step.checklist.map((c) => ({
                      ...c,
                      completed: !allComplete,
                      completedAt: !allComplete ? new Date().toISOString() : undefined,
                    }));
                    if (!allComplete && soundEnabled) sound.playStepComplete();
                    onUpdateStep({
                      ...step,
                      checklist: updated,
                      status: !allComplete ? 'done' : 'in_progress',
                    });
                  }}
                  className="text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold"
                >
                  {step.checklist.every((c) => c.completed) ? 'Uncheck all' : 'Check all done'}
                </button>
              </div>
            )}
          </div>

          {/* Checklist Items */}
          <div className="space-y-1.5">
            {step.checklist.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center border border-dashed border-slate-800 rounded-xl">
                No subtasks added yet. Add your to-do items below to track exact progress!
              </div>
            ) : (
              step.checklist.map((item) => (
                <div
                  key={item.id}
                  className={`group/item flex flex-col p-2.5 rounded-xl border transition-colors ${
                    item.completed
                      ? 'bg-slate-900/30 border-slate-800/60 text-slate-400'
                      : 'bg-[#0f1728] border-slate-800/80 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleChecklist(item.id)}
                      className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 group-hover/item:text-cyan-400 shrink-0" />
                      )}
                      <span
                        className={`text-xs font-medium leading-relaxed truncate ${
                          item.completed ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}
                      >
                        {item.title}
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      {/* Note trigger */}
                      <button
                        onClick={() => {
                          if (expandedNoteId === item.id) {
                            setExpandedNoteId(null);
                          } else {
                            setExpandedNoteId(item.id);
                            setNoteDraft(item.notes || '');
                          }
                        }}
                        className={`p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 ${
                          item.notes ? 'text-cyan-400 opacity-100' : ''
                        }`}
                        title="Add code snippet or task note"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete task */}
                      <button
                        onClick={() => handleDeleteTask(item.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Remove task"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Notes / snippet preview or editor */}
                  {(expandedNoteId === item.id || item.notes) && (
                    <div className="mt-2 pl-6 pr-2">
                      {editingNoteId === item.id ? (
                        <div className="space-y-1.5">
                          <textarea
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            placeholder="Add file path, command, or reminder..."
                            className="w-full bg-[#070b12] border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                            rows={2}
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveNote(item.id)}
                              className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-semibold"
                            >
                              Save Note
                            </button>
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="px-2 py-0.5 text-slate-400 text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingNoteId(item.id);
                            setNoteDraft(item.notes || '');
                          }}
                          className="bg-[#070b12] border border-slate-800/80 rounded-lg p-2 text-[11px] font-mono text-slate-400 hover:border-slate-700 cursor-pointer"
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                            <span>Note / Snippet (click to edit):</span>
                          </div>
                          <p className="whitespace-pre-wrap">{item.notes || 'No notes. Click to add.'}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Quick Add Subtask Input Form */}
          <form onSubmit={handleAddTask} className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add next to-do item... (press Enter)"
                className="w-full bg-[#0c1322] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 font-semibold text-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
