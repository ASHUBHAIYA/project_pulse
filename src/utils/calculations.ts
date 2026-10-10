import { Project, ProjectStep, Platform } from '../types';

export function getStepProgress(step: ProjectStep): number {
  if (step.status === 'done') return 100;
  if (!step.checklist || step.checklist.length === 0) {
    return step.status === 'in_progress' ? 50 : 0;
  }
  const completed = step.checklist.filter((c) => c.completed).length;
  return Math.round((completed / step.checklist.length) * 100);
}

export function getProjectProgress(project: Project): number {
  if (!project.steps || project.steps.length === 0) return 0;
  const total = project.steps.length;
  if (total === 0) return 0;

  const totalScore = project.steps.reduce((acc, step) => {
    return acc + getStepProgress(step);
  }, 0);

  return Math.round(totalScore / total);
}

export function getProjectStepCounts(project: Project) {
  const done = project.steps.filter((s) => s.status === 'done').length;
  const inProgress = project.steps.filter((s) => s.status === 'in_progress').length;
  const pending = project.steps.filter((s) => s.status === 'pending').length;
  const total = project.steps.length;

  let totalTasks = 0;
  let completedTasks = 0;
  project.steps.forEach((step) => {
    if (step.checklist) {
      totalTasks += step.checklist.length;
      completedTasks += step.checklist.filter((c) => c.completed).length;
    }
  });

  return {
    done,
    inProgress,
    pending,
    total,
    totalTasks,
    completedTasks,
  };
}

export function getPlatformBadge(platform: Platform) {
  switch (platform) {
    case 'android':
      return {
        label: 'Android',
        color: '#10b981',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'text-emerald-400',
      };
    case 'web':
      return {
        label: 'Web App',
        color: '#06b6d4',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/20',
        text: 'text-cyan-400',
      };
    case 'both':
      return {
        label: 'Android + Web',
        color: '#a855f7',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        text: 'text-purple-400',
      };
  }
}
