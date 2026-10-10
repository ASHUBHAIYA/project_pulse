/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Project, ProjectStep, Platform, DistractionNote, FocusSession } from './types';
import {
  loadProjects,
  saveProjects,
  loadDistractions,
  saveDistractions,
  loadFocusSession,
  saveFocusSession,
  exportBackup,
  importBackup,
} from './utils/storage';
import {
  fetchWebsiteData,
  saveWebsiteData,
  loadGitHubConfig,
  saveGitHubConfig,
  pullDataFromGitHub,
  pushDataToGitHub,
  GitHubSyncConfig,
} from './utils/apiStorage';
import {
  loadCloudflareD1Config,
  saveCloudflareD1Config,
  CloudflareD1Config,
  fetchD1LiveStatus,
} from './utils/cloudflareD1';
import { isSessionAuthenticated, setSessionAuthenticated } from './utils/auth';
import { sound } from './utils/audio';
import { LoginView } from './components/LoginView';
import { Header } from './components/Header';
import { ActiveFocusBanner } from './components/ActiveFocusBanner';
import { PlatformFilterBar } from './components/PlatformFilterBar';
import { ProjectCard } from './components/ProjectCard';
import { ProjectListView } from './components/ProjectListView';
import { ProjectDetailView } from './components/ProjectDetailView';
import { DistractionDrawer } from './components/DistractionDrawer';
import { CheckInModal } from './components/CheckInModal';
import { NewProjectModal } from './components/NewProjectModal';
import { ConfirmModal } from './components/ConfirmModal';
import { GitHubSyncModal } from './components/GitHubSyncModal';
import { CloudflareD1Modal } from './components/CloudflareD1Modal';
import { Plus, Layers, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isSessionAuthenticated());

  // Main Data States
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<'all' | Platform>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [distractions, setDistractions] = useState<DistractionNote[]>(() => loadDistractions());
  const [focusSession, setFocusSession] = useState<FocusSession>(() => loadFocusSession());

  // View Mode: Grid or List
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('projectpulse_view_mode');
      if (saved === 'list' || saved === 'grid') return saved;
    }
    return 'grid';
  });

  // Cross-device & Cloudflare D1 Config
  const [githubConfig, setGithubConfig] = useState<GitHubSyncConfig>(() => loadGitHubConfig());
  const [d1Config, setD1Config] = useState<CloudflareD1Config>(() => loadCloudflareD1Config());
  const [isD1Live, setIsD1Live] = useState(false);
  const [serverLastSaved, setServerLastSaved] = useState<string | null>(null);
  const [isServerLoaded, setIsServerLoaded] = useState(false);

  // Modal / Drawer visibility
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isDistractionDrawerOpen, setIsDistractionDrawerOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isD1ModalOpen, setIsD1ModalOpen] = useState(false);
  const [projectPendingDelete, setProjectPendingDelete] = useState<Project | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hidden file input for JSON import
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // On mount and on authentication: load data directly from data/app_data.json or Cloudflare D1 (env.DB)
  useEffect(() => {
    let mounted = true;
    fetchWebsiteData()
      .then((res) => {
        if (!mounted) return;
        if (res && res.exists && Array.isArray(res.projects) && res.projects.length > 0) {
          setProjects(res.projects);
          if (Array.isArray(res.distractions)) {
            setDistractions(res.distractions);
          }
          if (res.focusSession) {
            setFocusSession(res.focusSession);
            saveFocusSession(res.focusSession);
          }
          saveProjects(res.projects);
          if (res.distractions) saveDistractions(res.distractions);
          setServerLastSaved(res.updatedAt || new Date().toISOString());
        } else {
          // Initialize server/D1 if not present yet
          saveWebsiteData(projects, distractions, focusSession).then(() => {
            if (mounted) setServerLastSaved(new Date().toISOString());
          });
        }
        if (res?.provider === 'cloudflare_d1_binding' || res?.isLiveBinding) {
          setIsD1Live(true);
        }
        setIsServerLoaded(true);
      })
      .catch((err) => {
        console.warn('Could not read website server data file:', err);
        if (mounted) setIsServerLoaded(true);
      });

    // Check D1 live binding status
    fetchD1LiveStatus().then((st) => {
      if (mounted && st.isLiveBinding && st.connected) {
        setIsD1Live(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  // Save viewMode to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('projectpulse_view_mode', viewMode);
    }
  }, [viewMode]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Save changes to localStorage and website backend / Cloudflare D1 (debounced, only after server file has been loaded)
  useEffect(() => {
    if (isAuthenticated && isServerLoaded) {
      saveProjects(projects);
      const timer = setTimeout(() => {
        saveWebsiteData(projects, distractions, focusSession).then((ok) => {
          if (ok) setServerLastSaved(new Date().toISOString());
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [projects, isAuthenticated, distractions, focusSession, isServerLoaded]);

  useEffect(() => {
    if (isAuthenticated) {
      saveDistractions(distractions);
    }
  }, [distractions, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      saveFocusSession(focusSession);
    }
  }, [focusSession, isAuthenticated]);

  // Focus Timer Tick Interval
  useEffect(() => {
    if (!isAuthenticated || !focusSession.timerRunning) return;

    const interval = setInterval(() => {
      setFocusSession((prev) => {
        if (prev.timerSecondsLeft <= 1) {
          if (prev.soundEnabled) sound.playCheckInReminder();
          setIsCheckInModalOpen(true);
          return {
            ...prev,
            timerRunning: false,
            timerSecondsLeft: prev.targetMinutes * 60,
            totalFocusMinutes: prev.totalFocusMinutes + prev.targetMinutes,
          };
        }
        return {
          ...prev,
          timerSecondsLeft: prev.timerSecondsLeft - 1,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [focusSession.timerRunning, focusSession.targetMinutes, focusSession.soundEnabled, isAuthenticated]);

  // Global Keyboard Shortcut: Cmd/Ctrl + K opens Idea Parking Lot
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsDistractionDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated]);

  // Current Active Focus Project & Step resolution
  const activeProject =
    projects.find((p) => p.id === focusSession.activeProjectId) ||
    projects[0] ||
    null;

  const activeStep =
    activeProject?.steps.find((s) => s.id === focusSession.activeStepId) ||
    activeProject?.steps.find((s) => s.status === 'in_progress') ||
    activeProject?.steps[0] ||
    null;

  // Selected project for detailed view
  const currentSelectedProject = projects.find((p) => p.id === selectedProjectId) || null;

  // Logout Handler
  const handleLogout = () => {
    setSessionAuthenticated(false);
    setIsAuthenticated(false);
    setSelectedProjectId(null);
  };

  // Project Management Actions
  const handleCreateProject = (newProj: Project) => {
    const nextList = [newProj, ...projects];
    setProjects(nextList);
    // Pin newly created project if none focused
    if (!focusSession.activeProjectId) {
      setFocusSession((prev) => ({
        ...prev,
        activeProjectId: newProj.id,
        activeStepId: newProj.steps[0]?.id || null,
      }));
    }
    setToastMessage(`Project "${newProj.name}" created successfully`);
  };

  const handleUpdateProject = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleteProject = (projectId: string) => {
    const projToDelete = projects.find((p) => p.id === projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
    if (focusSession.activeProjectId === projectId) {
      const remaining = projects.filter((p) => p.id !== projectId);
      setFocusSession((prev) => ({
        ...prev,
        activeProjectId: remaining[0]?.id || null,
        activeStepId: remaining[0]?.steps[0]?.id || null,
      }));
    }
    setToastMessage(`Project "${projToDelete?.name || ''}" deleted`);
  };

  const handleSetFocus = (project: Project, stepId?: string) => {
    const targetStep =
      (stepId ? project.steps.find((s) => s.id === stepId) : null) ||
      project.steps.find((s) => s.status === 'in_progress') ||
      project.steps.find((s) => s.status === 'pending') ||
      project.steps[0];

    setFocusSession((prev) => ({
      ...prev,
      activeProjectId: project.id,
      activeStepId: targetStep?.id || null,
    }));
    setToastMessage(`Anchored focus to ${project.name}`);
  };

  // Timer Controls
  const handleToggleTimer = () => {
    setFocusSession((prev) => ({
      ...prev,
      timerRunning: !prev.timerRunning,
    }));
  };

  const handleResetTimer = () => {
    setFocusSession((prev) => ({
      ...prev,
      timerRunning: false,
      timerSecondsLeft: prev.targetMinutes * 60,
    }));
  };

  const handleSetTargetMinutes = (mins: number) => {
    setFocusSession((prev) => ({
      ...prev,
      targetMinutes: mins,
      timerSecondsLeft: mins * 60,
      timerRunning: false,
    }));
  };

  const handleExtendTimer = (mins: number) => {
    setFocusSession((prev) => ({
      ...prev,
      timerSecondsLeft: mins * 60,
      timerRunning: true,
    }));
  };

  // Distraction Parking Lot Actions
  const handleAddDistraction = (text: string, projectId?: string) => {
    const newNote: DistractionNote = {
      id: `dist-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      text,
      projectId,
      resolved: false,
      createdAt: new Date().toISOString(),
    };
    setDistractions((prev) => [newNote, ...prev]);
    setToastMessage('Idea safely parked! Current task protected.');
  };

  const handleToggleResolveDistraction = (id: string) => {
    setDistractions((prev) =>
      prev.map((n) => (n.id === id ? { ...n, resolved: !n.resolved } : n))
    );
  };

  const handleDeleteDistraction = (id: string) => {
    setDistractions((prev) => prev.filter((n) => n.id !== id));
  };

  const handleConvertDistractionToStep = (note: DistractionNote, targetProjectId: string) => {
    const targetProject = projects.find((p) => p.id === targetProjectId);
    if (!targetProject) return;

    const newStep: ProjectStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      title: note.text,
      category: 'Unplanned / Ideas',
      description: 'Captured from Idea Parking Lot during focus session.',
      status: 'pending',
      order: targetProject.steps.length + 1,
      targetPlatform: targetProject.platform,
      checklist: [
        {
          id: `c-${Date.now()}-1`,
          title: 'Investigate and define execution plan',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    handleUpdateProject({
      ...targetProject,
      steps: [...targetProject.steps, newStep],
    });

    handleToggleResolveDistraction(note.id);
    setToastMessage(`Converted idea to new step in "${targetProject.name}"`);
  };

  // Backup Export & Import Handlers
  const handleExportBackup = () => {
    exportBackup(projects, distractions);
    setToastMessage('Backup downloaded successfully');
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importBackup(file);
      setProjects(data.projects);
      if (data.distractions) setDistractions(data.distractions);
      saveWebsiteData(data.projects, data.distractions || []);
      setToastMessage('Backup data restored successfully!');
    } catch (err) {
      setToastMessage(`Import failed: ${(err as Error).message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // GitHub Handlers
  const handleSaveGitHubConfig = (updated: GitHubSyncConfig) => {
    setGithubConfig(updated);
    saveGitHubConfig(updated);
  };

  const handlePullFromGitHub = async () => {
    const result = await pullDataFromGitHub(githubConfig);
    setProjects(result.projects);
    setDistractions(result.distractions);
    saveProjects(result.projects);
    saveDistractions(result.distractions);
    saveWebsiteData(result.projects, result.distractions);
    setToastMessage('Synced data from GitHub!');
  };

  const handlePushToGitHub = async () => {
    const res = await pushDataToGitHub(githubConfig, projects, distractions);
    if (res.gistId && !githubConfig.gistId) {
      const updated = { ...githubConfig, gistId: res.gistId };
      setGithubConfig(updated);
      saveGitHubConfig(updated);
    }
    setToastMessage('Successfully pushed data to GitHub!');
  };

  const handleForceSaveToWebsite = async () => {
    const success = await saveWebsiteData(projects, distractions);
    if (success) {
      setServerLastSaved(new Date().toISOString());
      setToastMessage('Saved directly to website server (data/app_data.json)!');
    } else {
      throw new Error('Failed to save to website server');
    }
  };

  // Cloudflare D1 Handlers
  const handleSaveD1Config = (updated: CloudflareD1Config) => {
    setD1Config(updated);
    saveCloudflareD1Config(updated);
  };

  const handleDataLoadedFromD1 = (newProjects: Project[], newDistractions: DistractionNote[]) => {
    setProjects(newProjects);
    setDistractions(newDistractions);
    saveProjects(newProjects);
    saveDistractions(newDistractions);
    saveWebsiteData(newProjects, newDistractions);
    setToastMessage(`Loaded ${newProjects.length} projects from Cloudflare D1!`);
  };

  // Compute platform counts and stats
  const stats = {
    totalProjects: projects.length,
    androidCount: projects.filter((p) => p.platform === 'android').length,
    webCount: projects.filter((p) => p.platform === 'web').length,
    hybridCount: projects.filter((p) => p.platform === 'both').length,
    totalStepsDone: projects.reduce(
      (acc, p) => acc + p.steps.filter((s) => s.status === 'done').length,
      0
    ),
    totalStepsPending: projects.reduce(
      (acc, p) => acc + p.steps.filter((s) => s.status !== 'done').length,
      0
    ),
  };

  // Filtered project list
  const filteredProjects = projects.filter((p) => {
    if (platformFilter !== 'all' && p.platform !== platformFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = p.name.toLowerCase().includes(query);
      const matchesDesc = p.description.toLowerCase().includes(query);
      const matchesStep = p.steps.some(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.checklist.some((c) => c.title.toLowerCase().includes(query))
      );
      return matchesName || matchesDesc || matchesStep;
    }
    return true;
  });

  // If user is not authenticated, show secure Login View
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col">
      {/* Hidden input for backup file restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Strict Top Bar Contract Header with persistent Back Navigation, D1 & Sync */}
      <Header
        currentProjectName={currentSelectedProject?.name}
        distractionCount={distractions.filter((n) => !n.resolved).length}
        onOpenNewProject={() => setIsNewProjectModalOpen(true)}
        onOpenDistractions={() => setIsDistractionDrawerOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenD1Modal={() => setIsD1ModalOpen(true)}
        onExport={handleExportBackup}
        onImportClick={() => fileInputRef.current?.click()}
        soundEnabled={focusSession.soundEnabled}
        onToggleSound={() =>
          setFocusSession((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
        }
        onGoHome={() => setSelectedProjectId(null)}
        onLogout={handleLogout}
        isD1Configured={d1Config.connected || Boolean(d1Config.databaseId)}
        isD1Live={isD1Live}
      />

      {/* In-app Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#101726] border border-cyan-500/40 text-slate-100 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
        {/* Sticky Anti-Distraction Active Focus Banner */}
        <ActiveFocusBanner
          activeProject={activeProject}
          activeStep={activeStep}
          focusSession={focusSession}
          onToggleTimer={handleToggleTimer}
          onResetTimer={handleResetTimer}
          onSetTargetMinutes={handleSetTargetMinutes}
          onTriggerCheckIn={() => setIsCheckInModalOpen(true)}
          onOpenParkingLot={() => setIsDistractionDrawerOpen(true)}
          onViewProjectStep={(projId) => {
            setSelectedProjectId(projId);
          }}
        />

        {/* View Switch: Project Details Roadmap OR Projects Grid/List */}
        {currentSelectedProject ? (
          <ProjectDetailView
            project={currentSelectedProject}
            activeFocusStepId={
              focusSession.activeProjectId === currentSelectedProject.id
                ? focusSession.activeStepId
                : null
            }
            onBack={() => setSelectedProjectId(null)}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onSetFocus={handleSetFocus}
            soundEnabled={focusSession.soundEnabled}
          />
        ) : (
          <div>
            {/* Platform Filter Controls & Metrics Strip with Grid/List Toggle */}
            <PlatformFilterBar
              currentFilter={platformFilter}
              onFilterChange={setPlatformFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              stats={stats}
            />

            {/* Projects Presentation: Grid or List */}
            {filteredProjects.length === 0 ? (
              <div className="text-center py-16 bg-[#101726] border border-dashed border-slate-800 rounded-2xl p-8 max-w-md mx-auto my-8">
                <Layers className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">No Projects Found</h3>
                <p className="text-xs text-slate-400 mb-5">
                  {searchQuery
                    ? `No projects matching "${searchQuery}". Try clearing search.`
                    : 'No projects created for this platform filter.'}
                </p>
                <button
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs shadow-md"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Create New App Project</span>
                </button>
              </div>
            ) : viewMode === 'list' ? (
              <ProjectListView
                projects={filteredProjects}
                activeFocusProjectId={focusSession.activeProjectId}
                onOpenProject={(p) => setSelectedProjectId(p.id)}
                onSetFocus={handleSetFocus}
                onDeleteProject={(p) => setProjectPendingDelete(p)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isFocused={focusSession.activeProjectId === project.id}
                    onOpenProject={(p) => setSelectedProjectId(p.id)}
                    onSetFocus={handleSetFocus}
                    onDeleteProject={(p) => setProjectPendingDelete(p)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Cloudflare D1 Database Modal */}
      <CloudflareD1Modal
        isOpen={isD1ModalOpen}
        onClose={() => setIsD1ModalOpen(false)}
        config={d1Config}
        onSaveConfig={handleSaveD1Config}
        projects={projects}
        distractions={distractions}
        onDataLoadedFromD1={handleDataLoadedFromD1}
      />

      {/* Cross-Device / GitHub Sync Modal */}
      <GitHubSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        config={githubConfig}
        onSaveConfig={handleSaveGitHubConfig}
        onPullFromGitHub={handlePullFromGitHub}
        onPushToGitHub={handlePushToGitHub}
        onForceSaveToWebsite={handleForceSaveToWebsite}
        serverLastSaved={serverLastSaved}
      />

      {/* In-app Confirmation Modal for Deleting Project from Dashboard */}
      <ConfirmModal
        isOpen={!!projectPendingDelete}
        title="Delete Project?"
        message={`Are you sure you want to permanently delete "${projectPendingDelete?.name}"? All roadmap steps, subtasks, and progress data will be removed.`}
        confirmLabel="Yes, Delete Project"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          if (projectPendingDelete) {
            handleDeleteProject(projectPendingDelete.id);
            setProjectPendingDelete(null);
          }
        }}
        onCancel={() => setProjectPendingDelete(null)}
      />

      {/* Idea Parking Lot Drawer */}
      <DistractionDrawer
        isOpen={isDistractionDrawerOpen}
        onClose={() => setIsDistractionDrawerOpen(false)}
        notes={distractions}
        projects={projects}
        onAddNote={handleAddDistraction}
        onToggleResolve={handleToggleResolveDistraction}
        onDeleteNote={handleDeleteDistraction}
        onConvertToStep={handleConvertDistractionToStep}
      />

      {/* Focus Check-in Modal */}
      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        activeProject={activeProject}
        activeStep={activeStep}
        onExtendTimer={handleExtendTimer}
        onOpenStepChecklist={() => {
          if (activeProject) setSelectedProjectId(activeProject.id);
        }}
        onOpenParkingLot={() => setIsDistractionDrawerOpen(true)}
      />

      {/* New Project Starter Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />

      {/* Quiet Developer Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-8 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ProjectPulse · Multi-Platform App Execution Tracker</span>
          <span className="text-slate-400">
            {d1Config.connected
              ? 'Cloudflare D1 (env.DB) Connected'
              : 'Website Server & Cloudflare D1 Ready'}
          </span>
        </div>
      </footer>
    </div>
  );
}
