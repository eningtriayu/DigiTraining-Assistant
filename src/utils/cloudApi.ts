/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrainingProject, InstructorProfile } from '../types';
import { DEFAULT_INSTRUCTORS } from '../data/defaultInstructors';

const INSTRUCTOR_STORAGE_KEY = 'digitraining_active_instructor';
const LOCAL_PROJECTS_BACKUP_KEY = 'digitraining_assistant_projects';

// 1. Fetch all instructors from server (or fallback to defaults)
export async function fetchInstructors(): Promise<InstructorProfile[]> {
  try {
    const res = await fetch('/api/auth/instructors');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.instructors) && data.instructors.length > 0) {
        return data.instructors;
      }
    }
  } catch (err) {
    console.warn('Gagal memuat instruktur dari server, menggunakan data cadangan lokal:', err);
  }
  return DEFAULT_INSTRUCTORS;
}

// 2. Register new instructor
export async function registerInstructor(profile: Omit<InstructorProfile, 'id'>): Promise<InstructorProfile> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (res.ok) {
      const data = await res.json();
      return data.instructor;
    }
  } catch (err) {
    console.error('Gagal mendaftar instruktur di server:', err);
  }
  // Local fallback
  const newInst: InstructorProfile = {
    ...profile,
    id: `inst-${Date.now()}`,
  };
  return newInst;
}

// 3. Get or Set active instructor in session
export function getSavedActiveInstructor(): InstructorProfile {
  try {
    const saved = localStorage.getItem(INSTRUCTOR_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn('Gagal membaca sesi instruktur:', err);
  }
  return DEFAULT_INSTRUCTORS[0];
}

export function saveActiveInstructor(instructor: InstructorProfile) {
  try {
    localStorage.setItem(INSTRUCTOR_STORAGE_KEY, JSON.stringify(instructor));
  } catch (err) {
    console.warn('Gagal menyimpan sesi instruktur:', err);
  }
}

// 4. Cloud Projects API (Multi-device persistence)
export async function fetchCloudProjects(): Promise<{ projects: TrainingProject[]; isCloudConnected: boolean }> {
  try {
    const res = await fetch('/api/projects');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.projects)) {
        // Cache backup locally
        try {
          localStorage.setItem(LOCAL_PROJECTS_BACKUP_KEY, JSON.stringify(data.projects));
        } catch (_) {}
        return { projects: data.projects, isCloudConnected: true };
      }
    }
  } catch (err) {
    console.warn('Server offline atau tidak terjangkau, menggunakan penyimpanan offline lokal:', err);
  }

  // Fallback to local storage
  try {
    const local = localStorage.getItem(LOCAL_PROJECTS_BACKUP_KEY);
    if (local) {
      return { projects: JSON.parse(local), isCloudConnected: false };
    }
  } catch (_) {}

  return { projects: [], isCloudConnected: false };
}

export async function saveCloudProject(project: TrainingProject): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    return res.ok;
  } catch (err) {
    console.warn('Gagal sinkronisasi proyek ke server:', err);
    return false;
  }
}

export async function createCloudProject(project: TrainingProject): Promise<boolean> {
  try {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    return res.ok;
  } catch (err) {
    console.warn('Gagal menyimpan proyek baru ke server:', err);
    return false;
  }
}

export async function deleteCloudProject(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('Gagal menghapus proyek dari server:', err);
    return false;
  }
}

export async function duplicateCloudProject(id: string, newCreator?: InstructorProfile): Promise<TrainingProject | null> {
  try {
    const res = await fetch(`/api/projects/${id}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorId: newCreator?.id,
        creatorName: newCreator?.name,
        creatorNip: newCreator?.nip,
        creatorRole: newCreator?.role,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.project;
    }
  } catch (err) {
    console.warn('Gagal menduplikasi proyek di server:', err);
  }
  return null;
}
