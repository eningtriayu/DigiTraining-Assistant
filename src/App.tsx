/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardView } from './views/DashboardView';
import { CreateTrainingWizard } from './views/CreateTrainingWizard';
import { ProjectWorkspaceView } from './views/ProjectWorkspaceView';
import { HistoryView } from './views/HistoryView';
import { TemplatesView } from './views/TemplatesView';
import { SettingsView } from './views/SettingsView';
import { TrainingProject, TrainingInput } from './types';
import { generateTrainingProject } from './utils/generatorEngine';

const STORAGE_KEY = 'digitraining_assistant_projects';

export default function App() {
  const [projects, setProjects] = useState<TrainingProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Gagal memuat proyek dari localStorage:', e);
    }
    return [];
  });

  const [currentTab, setCurrentTab] = useState<ActiveTab>('dashboard');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Gagal menyimpan proyek ke localStorage:', e);
    }
  }, [projects]);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const handleCreateNew = () => {
    setCurrentTab('create');
  };

  const handleOpenProject = (id: string) => {
    setActiveProjectId(id);
    setCurrentTab('workspace');
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeProjectId === id) {
      setActiveProjectId(null);
      setCurrentTab('history');
    }
  };

  const handleUpdateProject = (updated: TrainingProject) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleImportProjects = (imported: TrainingProject[]) => {
    setProjects(imported);
    if (imported.length > 0) {
      setActiveProjectId(imported[0].id);
    }
  };

  const handleClearAll = () => {
    setProjects([]);
    setActiveProjectId(null);
    setCurrentTab('dashboard');
  };

  const handleGenerateTraining = async (input: TrainingInput) => {
    setIsGenerating(true);
    const newId = `proj-${Date.now()}`;
    try {
      const newProj = await generateTrainingProject(input, newId);
      setProjects((prev) => [newProj, ...prev]);
      setActiveProjectId(newId);
      setCurrentTab('workspace');
    } catch (err) {
      console.error('Kesalahan saat menghasilkan proyek:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateModule = async (
    module: 'syllabus' | 'rundown' | 'material' | 'slides' | 'evaluations'
  ) => {
    if (!activeProject) return;
    setIsGenerating(true);
    try {
      const refreshed = await generateTrainingProject(activeProject.input, activeProject.id);
      handleUpdateProject(refreshed);
    } catch (err) {
      console.error('Gagal meregenerasi modul:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5F6FA] text-[#202533]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onNavigate={(tab) => {
          if (tab === 'workspace' && !activeProject && projects.length > 0) {
            setActiveProjectId(projects[0].id);
          }
          setCurrentTab(tab);
        }}
        activeProjectName={activeProject?.input.trainingName}
        projectCount={projects.length}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          currentTab={currentTab}
          onNavigate={setCurrentTab}
          activeProjectName={activeProject?.input.trainingName}
          onNewTraining={handleCreateNew}
        />

        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              projects={projects}
              onOpenProject={handleOpenProject}
              onCreateNew={handleCreateNew}
              onNavigateToTemplates={() => setCurrentTab('templates')}
            />
          )}

          {currentTab === 'create' && (
            <CreateTrainingWizard
              onGenerate={handleGenerateTraining}
              onCancel={() => setCurrentTab('dashboard')}
              isGenerating={isGenerating}
            />
          )}

          {currentTab === 'workspace' && activeProject && (
            <ProjectWorkspaceView
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              onBackToDashboard={() => setCurrentTab('dashboard')}
              onRegenerateModule={handleRegenerateModule}
              isRegenerating={isGenerating}
            />
          )}

          {currentTab === 'workspace' && !activeProject && (
            <div className="text-center py-20 bg-white rounded-2xl border border-[#E7E9F0] p-8">
              <h3 className="text-base font-bold text-[#202533] mb-2">
                Tidak Ada Proyek Aktif
              </h3>
              <p className="text-xs text-[#7B8190] mb-4">
                Pilih proyek dari riwayat pelatihan atau buat pelatihan baru.
              </p>
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-[#6C5CE7] text-white text-xs font-semibold rounded-xl"
              >
                Buat Pelatihan Baru
              </button>
            </div>
          )}

          {currentTab === 'history' && (
            <HistoryView
              projects={projects}
              onOpenProject={handleOpenProject}
              onDeleteProject={handleDeleteProject}
              onCreateNew={handleCreateNew}
            />
          )}

          {currentTab === 'templates' && <TemplatesView />}

          {currentTab === 'settings' && (
            <SettingsView
              projects={projects}
              onImportProjects={handleImportProjects}
              onClearAll={handleClearAll}
            />
          )}
        </main>
      </div>
    </div>
  );
}
