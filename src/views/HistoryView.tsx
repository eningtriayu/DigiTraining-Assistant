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
} from 'lucide-react';
import { TrainingProject } from '../types';

interface HistoryViewProps {
  projects: TrainingProject[];
  onOpenProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onCreateNew: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  projects,
  onOpenProject,
  onDeleteProject,
  onCreateNew,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = projects.filter((p) =>
    p.input.trainingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.input.targetAudience.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#202533]">Riwayat Pelatihan</h2>
          <p className="text-xs text-[#7B8190]">
            Daftar seluruh draf perangkat pelatihan digital yang telah disimpan pada perangkat Anda.
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#6C5CE7] hover:bg-[#5847D6] text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Buat Pelatihan Baru</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-[#7B8190] absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari berdasarkan nama pelatihan atau sasaran..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E7E9F0] bg-white text-xs text-[#202533] focus:outline-hidden focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition-all"
        />
      </div>

      {/* Projects List or Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E7E9F0] p-12 text-center shadow-xs">
          <FolderClock className="w-12 h-12 text-[#7B8190] mx-auto mb-3" />
          <h4 className="text-sm font-bold text-[#202533] mb-1">
            {searchQuery ? 'Tidak Ada Pelatihan yang Cocok' : 'Belum Ada Riwayat Pelatihan'}
          </h4>
          <p className="text-xs text-[#7B8190] max-w-sm mx-auto mb-4">
            {searchQuery
              ? 'Coba gunakan kata kunci pencarian yang berbeda.'
              : 'Mulai buat draf silabus, rundown, materi, dan evaluasi 20 butir soal sekarang.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((proj) => {
            const dateStr = new Date(proj.updatedAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={proj.id}
                className="bg-white rounded-2xl border border-[#E7E9F0] p-6 shadow-xs hover:border-[#6C5CE7]/40 hover:shadow-sm transition-all duration-150 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold bg-purple-50 text-[#6C5CE7] px-2.5 py-0.5 rounded-lg border border-[#6C5CE7]/20">
                      {proj.input.totalJP} JP ({proj.input.trainingDays} Hari)
                    </span>
                    <span className="text-[11px] text-[#7B8190] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {dateStr}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#202533] leading-snug">
                    {proj.input.trainingName}
                  </h3>

                  <p className="text-xs text-[#7B8190] line-clamp-2 leading-relaxed">
                    {proj.input.description || 'Tidak ada deskripsi rinci.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#4A5568]">
                    <span className="px-2 py-0.5 rounded-md bg-[#F5F6FA] border border-[#E7E9F0]">
                      Metode: {proj.input.deliveryMethod}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#F5F6FA] border border-[#E7E9F0]">
                      Sasaran: {proj.input.targetAudience}
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#E7E9F0] flex items-center justify-between">
                  <span className="text-xs text-[#35A875] font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tersimpan Lokal
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDeleteProject(proj.id)}
                      className="p-2 text-[#7B8190] hover:text-[#DF5B66] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus proyek"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenProject(proj.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6C5CE7] hover:bg-[#5847D6] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Workspace</span>
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
