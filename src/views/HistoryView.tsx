/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FolderClock,
  Search,
  PlusCircle,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Layers,
  Copy,
  Users,
  User,
  Cloud,
  Clock,
  Sparkles,
  Share2,
} from 'lucide-react';
import { TrainingProject, InstructorProfile } from '../types';

interface HistoryViewProps {
  projects: TrainingProject[];
  currentInstructor: InstructorProfile;
  onOpenProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onCreateNew: () => void;
  isCloudConnected: boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  projects,
  currentInstructor,
  onOpenProject,
  onDeleteProject,
  onDuplicateProject,
  onCreateNew,
  isCloudConnected,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'my' | 'shared'>('all');

  // Robust check matching role, NIP, ID, or name
  const isMyProject = (p: TrainingProject): boolean => {
    if (!p) return false;
    if (p.creatorId && p.creatorId === currentInstructor.id) return true;
    if (p.creatorNip && p.creatorNip === currentInstructor.nip) return true;
    if (p.creatorRole && p.creatorRole === currentInstructor.role) return true;
    if (p.creatorName && currentInstructor.name) {
      const pSimple = p.creatorName.toLowerCase().split(',')[0].trim();
      const currSimple = currentInstructor.name.toLowerCase().split(',')[0].trim();
      if (pSimple && currSimple && (pSimple.includes(currSimple) || currSimple.includes(pSimple))) {
        return true;
      }
    }
    if (!p.creatorId && !p.creatorName) return true;
    return false;
  };

  // Filter projects by search query and ownership
  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.input.trainingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.input.targetAudience.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.creatorName && p.creatorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.creatorRole && p.creatorRole.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'my') {
      return isMyProject(p);
    } else if (filterTab === 'shared') {
      return !isMyProject(p);
    }
    return true;
  });

  const myProjectsCount = projects.filter(isMyProject).length;
  const sharedProjectsCount = projects.filter((p) => !isMyProject(p)).length;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#202533]">Riwayat & Arsip Pelatihan</h2>
            <span className="flex items-center gap-1 text-[11px] font-semibold bg-[#6C5CE7]/10 text-[#6C5CE7] px-2.5 py-0.5 rounded-full border border-[#6C5CE7]/20">
              <Cloud className="w-3 h-3 text-[#35A875]" />
              {isCloudConnected ? 'Cloud Sync Aktif' : 'Multi-device Storage'}
            </span>
          </div>
          <p className="text-xs text-[#7B8190] mt-1">
            Data tersimpan terpusat di server sehingga riwayat dapat diakses dari device lain dan dibagi antar rekan pengajar.
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#6C5CE7] hover:bg-[#5847D6] text-white text-xs font-semibold rounded-xl shadow-xs shadow-[#6C5CE7]/30 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Buat Pelatihan Baru</span>
        </button>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Ownership Filter Pills (Huthy modern style) */}
        <div className="flex items-center p-1 bg-white rounded-2xl border border-[#E7E9F0] shadow-2xs">
          <button
            onClick={() => setFilterTab('all')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-[#6C5CE7] text-white shadow-xs'
                : 'text-[#7B8190] hover:text-[#202533]'
            }`}
          >
            <FolderClock className="w-3.5 h-3.5" />
            <span>Semua Pelatihan ({projects.length})</span>
          </button>
          <button
            onClick={() => setFilterTab('my')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterTab === 'my'
                ? 'bg-[#6C5CE7] text-white shadow-xs'
                : 'text-[#7B8190] hover:text-[#202533]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Pelatihan Saya ({myProjectsCount})</span>
          </button>
          <button
            onClick={() => setFilterTab('shared')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterTab === 'shared'
                ? 'bg-[#6C5CE7] text-white shadow-xs'
                : 'text-[#7B8190] hover:text-[#202533]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Dari Pengajar Lain ({sharedProjectsCount})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-[#7B8190] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pelatihan, topik, pengajar..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E7E9F0] bg-white text-xs text-[#202533] focus:outline-hidden focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition-all"
          />
        </div>
      </div>

      {/* Projects Grid or Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E7E9F0] p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#6C5CE7]/10 flex items-center justify-center text-[#6C5CE7] mx-auto mb-3">
            <FolderClock className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-[#202533] mb-1">
            {searchQuery
              ? 'Tidak Ditemukan Pelatihan yang Sesuai'
              : filterTab === 'shared'
              ? 'Belum Ada Pelatihan dari Pengajar Lain'
              : 'Belum Ada Riwayat Pelatihan'}
          </h4>
          <p className="text-xs text-[#7B8190] max-w-sm mx-auto mb-4">
            {searchQuery
              ? 'Coba gunakan kata kunci pencarian yang lain atau reset filter tab.'
              : 'Mulai rancang pelatihan baru Anda atau bagikan modul dengan rekan instruktur.'}
          </p>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-[#6C5CE7] text-white text-xs font-semibold rounded-xl hover:bg-[#5847D6] transition-colors"
          >
            Buat Pelatihan Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((proj) => {
            const dateStr = new Date(proj.updatedAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            const isMine = !proj.creatorId || proj.creatorId === currentInstructor.id || proj.creatorName === currentInstructor.name;

            return (
              <div
                key={proj.id}
                className="bg-white rounded-3xl border border-[#E7E9F0] p-5 shadow-xs hover:border-[#6C5CE7]/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold bg-[#6C5CE7]/10 text-[#6C5CE7] px-2.5 py-0.5 rounded-lg border border-[#6C5CE7]/20">
                      {proj.input.totalJP} JP ({proj.input.trainingDays} Hari)
                    </span>
                    <span className="text-[11px] text-[#7B8190] flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      {dateStr}
                    </span>
                  </div>

                  {/* Training Title */}
                  <h3 className="text-sm font-bold text-[#202533] leading-snug line-clamp-2 group-hover:text-[#6C5CE7] transition-colors">
                    {proj.input.trainingName}
                  </h3>

                  <p className="text-xs text-[#7B8190] line-clamp-2 leading-relaxed">
                    {proj.input.description || 'Pelatihan kompetensi digital aparatur & publik.'}
                  </p>

                  {/* Creator / Instructor Badge */}
                  <div className="p-2.5 rounded-xl bg-[#F5F6FA] border border-[#E7E9F0]/80 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-[#6C5CE7]/15 text-[#6C5CE7] flex items-center justify-center font-bold text-[10px] shrink-0">
                        {(proj.creatorName || currentInstructor.name).charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-[#202533] truncate">
                          {proj.creatorName || currentInstructor.name}
                        </div>
                        <div className="text-[10px] text-[#7B8190] truncate">
                          {proj.creatorRole || currentInstructor.role}
                        </div>
                      </div>
                    </div>
                    {isMine ? (
                      <span className="text-[10px] font-semibold text-[#6C5CE7] bg-purple-50 px-2 py-0.5 rounded-md border border-[#6C5CE7]/20">
                        Milik Saya
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-[#35A875] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Shared
                      </span>
                    )}
                  </div>

                  {/* Meta tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-[#4A5568]">
                    <span className="px-2 py-0.5 rounded-md bg-[#F5F6FA] border border-[#E7E9F0]">
                      {proj.input.deliveryMethod}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#F5F6FA] border border-[#E7E9F0]">
                      {proj.input.targetAudience}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-[#6C5CE7] border border-[#6C5CE7]/20 font-semibold">
                      30% Teori : 70% Praktik
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 mt-4 border-t border-[#E7E9F0] flex items-center justify-between">
                  <span className="text-[11px] text-[#35A875] font-medium flex items-center gap-1">
                    <Cloud className="w-3.5 h-3.5" />
                    Cloud Terverifikasi
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Duplicate button */}
                    <button
                      onClick={() => onDuplicateProject(proj.id)}
                      className="p-1.5 text-[#7B8190] hover:text-[#6C5CE7] hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                      title="Duplikasi pelatihan ini ke akun Anda"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Delete button (only if mine or confirm) */}
                    <button
                      onClick={() => onDeleteProject(proj.id)}
                      className="p-1.5 text-[#7B8190] hover:text-[#DF5B66] hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Hapus proyek"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Open button */}
                    <button
                      onClick={() => onOpenProject(proj.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#6C5CE7] hover:bg-[#5847D6] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>Buka</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
