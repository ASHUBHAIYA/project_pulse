import React, { useState, useEffect } from 'react';
import { Project, ProjectStep, StepStatus } from '../types';
import { StepCard } from './StepCard';
import { ProgressRing } from './ProgressRing';
import { ConfirmModal } from './ConfirmModal';
import { getProjectProgress, getPlatformBadge, getProjectStepCounts } from '../utils/calculations';
import {
  ArrowLeft,
  Plus,
  Target,
  Smartphone,
  Globe,
  Trash2,
  Edit3,
  Check,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface ProjectDetailViewProps {
  project: Project;
  activeFocusStepId: string | null;
  onBack: () => void;
  onUpdateProject: (updated: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onSetFocus: (project: Project, stepId?: string) => void;
  soundEnabled: boolean;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  activeFocusStepId,
  onBack,
  onUpdateProject,
  onDeleteProject,
  onSetFocus,
  soundEnabled,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | StepStatus>('all');
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [nameVal, setNameVal] = useState(project.name);
  const [descVal, setDescVal] = useState(project.description);
  const [repoVal, setRepoVal] = useState(project.repositoryUrl || '');
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepCategory, setNewStepCategory] = useState('');
  const [newStepDesc, setNewStepDesc] = useState('');

  // In-app confirmation dialog states (replacing window.confirm)
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<ProjectStep | null>(null);

  const progress = getProjectProgress(project);
  const badge = getPlatformBadge(project.platform);
  const counts = getProjectStepCounts(project);

  // Keyboard shortcut: pressing physical Delete or Backspace key when not typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (!isInput && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        setShowDeleteProjectModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUpdateStep = (updatedStep: ProjectStep) => {
    const updatedSteps = project.steps.map((s) => (s.id === updatedStep.id ? updatedStep : s));
    onUpdateProject({
      ...project,
      steps: updatedSteps,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleRequestDeleteStep = (stepId: string) => {
    const target = project.steps.find((s) => s.id === stepId);
    if (target) {
      setStepToDelete(target);
    }
  };

  const handleConfirmDeleteStep = () => {
    if (!stepToDelete) return;
    const updatedSteps = project.steps.filter((s) => s.id !== stepToDelete.id);
    onUpdateProject({
      ...project,
      steps: updatedSteps,
      activeStepId: project.activeStepId === stepToDelete.id ? undefined : project.activeStepId,
      updatedAt: new Date().toISOString(),
    });
    setStepToDelete(null);
  };

  const handleCreateStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepTitle.trim()) return;

    const newStep: ProjectStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newStepTitle.trim(),
      category: newStepCategory.trim() || 'General',
      description: newStepDesc.trim(),
      status: 'pending',
      order: project.steps.length + 1,
      targetPlatform: project.platform,
      checklist: [],
    };

    onUpdateProject({
      ...project,
      steps: [...project.steps, newStep],
      updatedAt: new Date().toISOString(),
    });

    setNewStepTitle('');
    setNewStepCategory('');
    setNewStepDesc('');
    setShowAddStepModal(false);
  };

  const handleSaveHeader = () => {
    onUpdateProject({
      ...project,
      name: nameVal.trim() || project.name,
      description: descVal.trim(),
      repositoryUrl: repoVal.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    setIsEditingHeader(false);
  };

  const filteredSteps = project.steps.filter((s) => {
    if (filterTab === 'all') return true;
    return s.status === filterTab;
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors py-1 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to All Projects</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSetFocus(project)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-colors"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Pin Project Focus</span>
          </button>

          {/* Delete Project Button */}
          <button
            onClick={() => setShowDeleteProjectModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-xs font-medium border border-transparent hover:border-rose-500/20"
            title="Delete project (or press Delete key)"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete Project</span>
          </button>
        </div>
      </div>

      {/* Project Overview Card */}
      <div className="bg-[#101726] border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            {/* Platform & Status Badge Strip */}
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${badge.bg} ${badge.border} ${badge.text}`}
              >
                {project.platform === 'android' && <Smartphone className="w-3 h-3" />}
                {project.platform === 'web' && <Globe className="w-3 h-3" />}
                {project.platform === 'both' && (
                  <div className="flex -space-x-1">
                    <Smartphone className="w-3 h-3" />
                    <Globe className="w-3 h-3" />
                  </div>
                )}
                <span>{badge.label}</span>
              </span>

              <span className="text-slate-600 text-xs font-mono">·</span>

              <span className="text-xs text-slate-400 font-mono">
                {counts.done} of {counts.total} steps done
              </span>

              <span className="text-slate-600 text-xs font-mono">·</span>

              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {counts.completedTasks} of {counts.totalTasks} to-dos finished
              </span>
            </div>

            {/* Editable Title & Description */}
            {isEditingHeader ? (
              <div className="space-y-3 max-w-2xl mt-3">
                <input
                  type="text"
                  value={nameVal}
                  onChange={(e) => setNameVal(e.target.value)}
                  className="w-full bg-[#090d16] border border-cyan-500 rounded-xl px-3 py-2 text-base font-bold text-white focus:outline-none"
                  placeholder="Project Name"
                />
                <textarea
                  value={descVal}
                  onChange={(e) => setDescVal(e.target.value)}
                  className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  placeholder="Project Description"
                  rows={2}
                />
                <input
                  type="text"
                  value={repoVal}
                  onChange={(e) => setRepoVal(e.target.value)}
                  className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none"
                  placeholder="Git repository URL (optional)"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveHeader}
                    className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
                  >
                    <Check className="w-3.5 h-3.5" /> Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditingHeader(false)}
                    className="px-3 py-1.5 text-slate-400 text-xs hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">
                    {project.name}
                  </h1>
                  <button
                    onClick={() => {
                      setNameVal(project.name);
                      setDescVal(project.description);
                      setRepoVal(project.repositoryUrl || '');
                      setIsEditingHeader(true);
                    }}
                    className="text-slate-500 hover:text-cyan-400 p-1 rounded hover:bg-slate-800 transition-colors"
                    title="Edit project details"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  {project.description || 'No description provided.'}
                </p>

                {project.repositoryUrl && (
                  <a
                    href={project.repositoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-mono mt-2"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate max-w-sm">{project.repositoryUrl}</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Large Project Overall Progress Ring */}
          <div className="flex items-center gap-4 bg-[#090d16] border border-slate-800 rounded-2xl p-4 shrink-0">
            <ProgressRing
              progress={progress}
              size={68}
              strokeWidth={6}
              color={progress === 100 ? '#10b981' : badge.color}
              textSize="text-sm"
              subtitle="Done"
            />
            <div>
              <span className="text-xs font-semibold text-slate-400 block font-mono">
                Project Roadmap
              </span>
              <span className="text-xl font-bold text-white font-mono tabular-nums">
                {counts.done} / {counts.total}
              </span>
              <span className="text-[11px] text-slate-500 block">steps completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Steps Pipeline Toolbar: Filter Tabs & Add Step Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Step Status Filters */}
        <div className="flex items-center gap-1 p-1 bg-[#101726] border border-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterTab === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Steps ({counts.total})
          </button>
          <button
            onClick={() => setFilterTab('in_progress')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterTab === 'in_progress'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            In Progress ({counts.inProgress})
          </button>
          <button
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterTab === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pending / Queued ({counts.pending})
          </button>
          <button
            onClick={() => setFilterTab('done')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterTab === 'done'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Done ({counts.done})
          </button>
        </div>

        {/* Add Step Button */}
        <button
          onClick={() => setShowAddStepModal(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs transition-colors shrink-0 border border-slate-700"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>Add Development Step</span>
        </button>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {filteredSteps.length === 0 ? (
          <div className="text-center py-12 bg-[#101726] border border-dashed border-slate-800 rounded-2xl p-6">
            <Layers className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-300">No steps in this view</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {filterTab === 'all'
                ? 'Add your first development step to begin breaking down this project.'
                : `No steps currently marked as ${filterTab}.`}
            </p>
          </div>
        ) : (
          filteredSteps.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              stepNumber={index + 1}
              isFocused={activeFocusStepId === step.id}
              onUpdateStep={handleUpdateStep}
              onDeleteStep={handleRequestDeleteStep}
              onSetFocusStep={(stepId) => onSetFocus(project, stepId)}
              soundEnabled={soundEnabled}
            />
          ))
        )}
      </div>

      {/* In-app Confirmation Modal for Deleting Project */}
      <ConfirmModal
        isOpen={showDeleteProjectModal}
        title="Delete Project?"
        message={`Are you sure you want to permanently delete "${project.name}"? All roadmap steps, subtasks, and progress data will be removed.`}
        confirmLabel="Yes, Delete Project"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          setShowDeleteProjectModal(false);
          onDeleteProject(project.id);
        }}
        onCancel={() => setShowDeleteProjectModal(false)}
      />

      {/* In-app Confirmation Modal for Deleting Step */}
      <ConfirmModal
        isOpen={!!stepToDelete}
        title="Delete Step?"
        message={`Are you sure you want to delete step "${stepToDelete?.title}" and its ${stepToDelete?.checklist.length || 0} checklist items?`}
        confirmLabel="Delete Step"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDeleteStep}
        onCancel={() => setStepToDelete(null)}
      />

      {/* Add Step Modal */}
      {showAddStepModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101726] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Add Development Step</h3>
            <p className="text-xs text-slate-400 mb-4">
              Break down the next major milestone for {project.name}.
            </p>

            <form onSubmit={handleCreateStep} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Step Title *
                </label>
                <input
                  type="text"
                  required
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  placeholder="e.g. Firebase Auth & User Profile screen"
                  className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category / Milestone Group
                </label>
                <input
                  type="text"
                  value={newStepCategory}
                  onChange={(e) => setNewStepCategory(e.target.value)}
                  placeholder="e.g. Authentication, Database, UI Polish"
                  className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / Goal
                </label>
                <textarea
                  value={newStepDesc}
                  onChange={(e) => setNewStepDesc(e.target.value)}
                  placeholder="What is the definition of done for this milestone?"
                  rows={3}
                  className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStepModal(false)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-xl"
                >
                  Create Step
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
