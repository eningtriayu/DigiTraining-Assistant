/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardView } from './views/DashboardView';
import { CreateTrainingWizard } from './views/CreateTrainingWizard';
import { ProjectWorkspaceView } from './views/ProjectWorkspaceView';
import { HistoryView } from './views/HistoryView';
import { TemplatesView } from './views/TemplatesView';
import { SettingsView } from './views/SettingsView';
import { InstructorModal } from './components/InstructorModal';
import { TrainingProject, TrainingInput, InstructorProfile } from './types';
import { generateTrainingProject } from './utils/generatorEngine';
import {
  fetchInstructors,
  registerInstructor,
  getSavedActiveInstructor,
  saveActiveInstructor,
  fetchCloudProjects,
  saveCloudProject,
  createCloudProject,
  deleteCloudProject,
  duplicateCloudProject,
} from './utils/cloudApi';
import { DEFAULT_INSTRUCTORS } from './data/defaultInstructors';

const STORAGE_KEY = 'digitraining_assistant_projects';

export default function App() {
  // Instructor state
  const [instructors, setInstructors] = useState<InstructorProfile[]>(DEFAULT_INSTRUCTORS);
  const [currentInstructor, setCurrentInstructor] = useState<InstructorProfile>(getSavedActiveInstructor);
  const [showInstructorModal, setShowInstructorModal] = useState<boolean>(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // Projects state
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

  // 1. Load instructors and cloud projects from server on mount
  useEffect(() => {
    const initializeData = async () => {
      // Fetch instructors
      const instList = await fetchInstructors();
      setInstructors(instList);

      // Verify active instructor against list
      const savedInst = getSavedActiveInstructor();
      const matched = instList.find((i) => i.id === savedInst.id || i.nip === savedInst.nip);
      if (matched) {
        setCurrentInstructor(matched);
      }

      // Fetch cloud projects
      const { projects: cloudProjects, isCloudConnected: connected } = await fetchCloudProjects();
      setIsCloudConnected(connected);

      if (cloudProjects.length > 0) {
        setProjects(cloudProjects);
      }
    };

    initializeData();
  }, []);

  // Sync projects to localStorage as backup
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

  const handleDeleteProject = async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeProjectId === id) {
      setActiveProjectId(null);
      setCurrentTab('history');
    }
    // Delete in cloud
    await deleteCloudProject(id);
  };

  const handleUpdateProject = async (updated: TrainingProject) => {
    const enriched: TrainingProject = {
      ...updated,
      lastEditedBy: currentInstructor.name,
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => prev.map((p) => (p.id === enriched.id ? enriched : p)));
    // Save to persistent cloud backend
    await saveCloudProject(enriched);
  };

  const handleDuplicateProject = async (id: string) => {
    const duplicated = await duplicateCloudProject(id, currentInstructor);
    if (duplicated) {
      setProjects((prev) => [duplicated, ...prev]);
      setActiveProjectId(duplicated.id);
      setCurrentTab('workspace');
    } else {
      // Local fallback duplication
      const target = projects.find((p) => p.id === id);
      if (!target) return;
      const localDuplicated: TrainingProject = {
        ...target,
        id: `proj-copy-${Date.now()}`,
        creatorId: currentInstructor.id,
        creatorName: currentInstructor.name,
        creatorNip: currentInstructor.nip,
        creatorRole: currentInstructor.role,
        input: {
          ...target.input,
          trainingName: `${target.input.trainingName} (Salinan ${currentInstructor.name.split(',')[0]})`,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProjects((prev) => [localDuplicated, ...prev]);
      setActiveProjectId(localDuplicated.id);
      setCurrentTab('workspace');
      await createCloudProject(localDuplicated);
    }
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

  // Switch or register instructor
  const handleSelectInstructor = (inst: InstructorProfile) => {
    setCurrentInstructor(inst);
    saveActiveInstructor(inst);
  };

  const handleRegisterInstructor = async (data: Omit<InstructorProfile, 'id'>) => {
    const newInst = await registerInstructor(data);
    setInstructors((prev) => [newInst, ...prev]);
    setCurrentInstructor(newInst);
    saveActiveInstructor(newInst);
  };

  // Generate Training Project with attached instructor credentials
  const handleGenerateTraining = async (input: TrainingInput) => {
    setIsGenerating(true);
    const newId = `proj-${Date.now()}`;
    try {
      const newProj = await generateTrainingProject(input, newId, undefined, currentInstructor);
      // Ensure instructor metadata is recorded
      newProj.creatorId = currentInstructor.id;
      newProj.creatorName = currentInstructor.name;
      newProj.creatorNip = currentInstructor.nip;
      newProj.creatorRole = currentInstructor.role;
      newProj.isShared = true;

      setProjects((prev) => [newProj, ...prev]);
      setActiveProjectId(newId);
      setCurrentTab('workspace');

      // Persist to cloud backend
      await createCloudProject(newProj);
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
      const refreshed = await generateTrainingProject(activeProject.input, activeProject.id, undefined, currentInstructor);
      await handleUpdateProject(refreshed);
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
        currentInstructor={currentInstructor}
        onOpenInstructorModal={() => setShowInstructorModal(true)}
        isCloudConnected={isCloudConnected}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          currentTab={currentTab}
          onNavigate={setCurrentTab}
          activeProjectName={activeProject?.input.trainingName}
          onNewTraining={handleCreateNew}
          currentInstructor={currentInstructor}
          isCloudConnected={isCloudConnected}
          onOpenInstructorModal={() => setShowInstructorModal(true)}
        />

        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              projects={projects}
              currentInstructor={currentInstructor}
              isCloudConnected={isCloudConnected}
              onOpenProject={handleOpenProject}
              onCreateNew={handleCreateNew}
              onNavigateToTemplates={() => setCurrentTab('templates')}
              onOpenInstructorModal={() => setShowInstructorModal(true)}
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
            <div className="text-center py-20 bg-white rounded-3xl border border-[#E7E9F0] p-8 shadow-xs">
              <h3 className="text-base font-bold text-[#202533] mb-2">
                Tidak Ada Proyek Aktif
              </h3>
              <p className="text-xs text-[#7B8190] mb-4">
                Pilih proyek dari riwayat pelatihan atau buat pelatihan baru.
              </p>
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-[#6C5CE7] text-white text-xs font-semibold rounded-xl hover:bg-[#5847D6] transition-colors"
              >
                Buat Pelatihan Baru
              </button>
            </div>
          )}

          {currentTab === 'history' && (
            <HistoryView
              projects={projects}
              currentInstructor={currentInstructor}
              onOpenProject={handleOpenProject}
              onDeleteProject={handleDeleteProject}
              onDuplicateProject={handleDuplicateProject}
              onCreateNew={handleCreateNew}
              isCloudConnected={isCloudConnected}
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

      {/* Instructor Login & Multi-Device Sync Modal */}
      <InstructorModal
        isOpen={showInstructorModal}
        onClose={() => setShowInstructorModal(false)}
        instructors={instructors}
        currentInstructor={currentInstructor}
        onSelectInstructor={handleSelectInstructor}
        onRegisterInstructor={handleRegisterInstructor}
        isCloudConnected={isCloudConnected}
      />
    </div>
  );
}
