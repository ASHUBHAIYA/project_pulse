import React, { useState } from 'react';
import { Platform, Project, ProjectStep } from '../types';
import {
  ANDROID_TEMPLATE_STEPS,
  WEB_TEMPLATE_STEPS,
  HYBRID_TEMPLATE_STEPS,
} from '../data/templates';
import { Smartphone, Globe, Layers, Sparkles, X, Check } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (newProject: Project) => void;
}

type TemplateType = 'android' | 'web' | 'both' | 'blank';

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('android');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');

  if (!isOpen) return null;

  const getTemplateSteps = (template: TemplateType): ProjectStep[] => {
    let sourceSteps: Omit<ProjectStep, 'id'>[] = [];
    if (template === 'android') sourceSteps = ANDROID_TEMPLATE_STEPS;
    else if (template === 'web') sourceSteps = WEB_TEMPLATE_STEPS;
    else if (template === 'both') sourceSteps = HYBRID_TEMPLATE_STEPS;
    else return [];

    return sourceSteps.map((step, idx) => ({
      ...step,
      id: `step-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      checklist: step.checklist.map((c, cIdx) => ({
        ...c,
        id: `c-${Date.now()}-${idx}-${cIdx}`,
        completed: false, // Start fresh for new project
        completedAt: undefined,
      })),
      status: idx === 0 ? 'in_progress' : 'pending', // First step ready to go
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const platform: Platform = selectedTemplate === 'blank' ? 'web' : selectedTemplate;
    const steps = getTemplateSteps(selectedTemplate);

    const newProject: Project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      platform,
      description: description.trim(),
      repositoryUrl: repositoryUrl.trim() || undefined,
      steps,
      activeStepId: steps[0]?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onCreateProject(newProject);
    onClose();
  };

  const previewSteps =
    selectedTemplate === 'android'
      ? ANDROID_TEMPLATE_STEPS
      : selectedTemplate === 'web'
      ? WEB_TEMPLATE_STEPS
      : selectedTemplate === 'both'
      ? HYBRID_TEMPLATE_STEPS
      : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#101726] border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Create New Project</h3>
            <p className="text-xs text-slate-400">
              Select a workflow template tailored to your platform architecture.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {/* Template Selection Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
              Choose Workflow Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Android Template */}
              <div
                onClick={() => setSelectedTemplate('android')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedTemplate === 'android'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white'
                    : 'bg-[#090d16] border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">Android App</span>
                  </div>
                  {selectedTemplate === 'android' && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Compose UI, Room DB, WorkManager & Play Store release steps.
                </p>
              </div>

              {/* Web App Template */}
              <div
                onClick={() => setSelectedTemplate('web')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedTemplate === 'web'
                    ? 'bg-cyan-500/15 border-cyan-500 text-white'
                    : 'bg-[#090d16] border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold">Web App</span>
                  </div>
                  {selectedTemplate === 'web' && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Vite/React, Tailwind, API sync, PWA & production deployment.
                </p>
              </div>

              {/* Hybrid Template */}
              <div
                onClick={() => setSelectedTemplate('both')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedTemplate === 'both'
                    ? 'bg-purple-500/15 border-purple-500 text-white'
                    : 'bg-[#090d16] border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                      <Globe className="w-3.5 h-3.5 text-purple-300" />
                    </div>
                    <span className="text-xs font-bold">Android + Web</span>
                  </div>
                  {selectedTemplate === 'both' && <Check className="w-4 h-4 text-purple-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Shared core logic, Android native container & dual QA pipeline.
                </p>
              </div>

              {/* Custom Blank Canvas */}
              <div
                onClick={() => setSelectedTemplate('blank')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedTemplate === 'blank'
                    ? 'bg-slate-700/30 border-slate-400 text-white'
                    : 'bg-[#090d16] border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold">Blank Slate</span>
                  </div>
                  {selectedTemplate === 'blank' && <Check className="w-4 h-4 text-slate-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Start with zero steps and define your own roadmap from scratch.
                </p>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  selectedTemplate === 'android'
                    ? 'e.g. FitPulse Android'
                    : selectedTemplate === 'web'
                    ? 'e.g. CloudStudio Web'
                    : 'e.g. CrossApp Pro'
                }
                className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Short Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this app do?"
                className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Repository / GitHub Link (optional)
              </label>
              <input
                type="url"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Template Steps Preview */}
          {previewSteps.length > 0 && (
            <div className="bg-[#090d16] border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-2">
                Included Starter Steps ({previewSteps.length})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {previewSteps.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-4 h-4 rounded bg-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{s.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono ml-auto shrink-0">
                      ({s.checklist.length} to-dos)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Launch Project Roadmap
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
