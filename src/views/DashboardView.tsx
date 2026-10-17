/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  FileText,
  Calendar,
  Layers,
  CheckCircle2,
  PlusCircle,
  Clock,
  ArrowRight,
  BookOpen,
  FolderOpen,
  Sparkles,
  Cloud,
  UserCheck,
  Check,
  Zap,
} from 'lucide-react';
import { TrainingProject, InstructorProfile } from '../types';

interface DashboardViewProps {
  projects: TrainingProject[];
  currentInstructor: InstructorProfile;
  isCloudConnected: boolean;
  onOpenProject: (projectId: string) => void;
  onCreateNew: () => void;
  onNavigateToTemplates: () => void;
  onOpenInstructorModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  currentInstructor,
  isCloudConnected,
  onOpenProject,
  onCreateNew,
  onNavigateToTemplates,
  onOpenInstructorModal,
}) => {
  const totalProjects = projects.length;
  const myProjects = projects.filter(
    (p) => !p.creatorId || p.creatorId === currentInstructor.id || p.creatorName === currentInstructor.name
  );

  const totalDocuments = projects.reduce((acc, p) => {
    let count = 0;
    if (p.syllabus) count++;
    if (p.rundown) count++;
    if (p.material) count++;
    if (p.slides) count++;
    if (p.evaluation) count += 2; // Pre & Post
    return acc + count;
  }, 0);

  const avgJP =
    totalProjects > 0
      ? Math.round(projects.reduce((acc, p) => acc + (p.input.totalJP || 0), 0) / totalProjects)
      : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner (Huthy-inspired modern violet card) */}
      <div className="bg-gradient-to-r from-[#6C5CE7] via-[#7B6CF6] to-[#8070F0] rounded-3xl p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DigiTraining SaaS — BLSDM Komdigi Surabaya</span>
            </div>
            <button
              onClick={onOpenInstructorModal}
              className="inline-flex items-center gap-1.5 bg-black/20 hover:bg-black/30 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Pengajar: {currentInstructor.name} ({currentInstructor.role})</span>
            </button>
            <div className="inline-flex items-center gap-1 bg-emerald-500/30 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{isCloudConnected ? 'Cloud Sync Online' : 'Penyimpanan Aktif'}</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-2">
            Halo, {currentInstructor.name}
          </h2>
          <p className="text-white/90 text-sm leading-relaxed mb-6">
            Siapkan perangkat pelatihan digital dengan proporsi terstandar <strong>30% Teori Konseptual & 70% Tutorial Praktik Hands-On</strong>. Seluruh riwayat pelatihan kini tersimpan di cloud server dan dapat diakses antar perangkat pengajar.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#6C5CE7] font-semibold text-xs rounded-xl shadow-xs hover:bg-slate-50 transition-all duration-150 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Pelatihan Baru</span>
            </button>
            <button
              onClick={onNavigateToTemplates}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl backdrop-blur-xs transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Lihat Format & Template Acuan</span>
            </button>
          </div>
        </div>

        {/* Decorative Graphic Element */}
        <div className="absolute right-[-40px] top-[-40px] w-80 h-80 rounded-full bg-white/10 pointer-events-none blur-2xl" />
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-[#E7E9F0] shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#7B8190] uppercase tracking-wider">
              Pelatihan Saya
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#6C5CE7] flex items-center justify-center">
              <FolderOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#202533] tabular-nums font-mono">
            {myProjects.length} <span className="text-xs font-normal text-[#7B8190]">dari {totalProjects} total</span>
          </div>
          <p className="text-xs text-[#7B8190] mt-1">
            Tersimpan di Cloud Server BLSDM
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E7E9F0] shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#7B8190] uppercase tracking-wider">
              Dokumen Terbit
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#35A875] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#202533] tabular-nums font-mono">
            {totalDocuments}
          </div>
          <p className="text-xs text-[#7B8190] mt-1">
            Silabus, rundown, materi, & 20 butir soal
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E7E9F0] shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#7B8190] uppercase tracking-wider">
              Rasio Kurikulum
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-[#6C5CE7] flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#6C5CE7] tabular-nums font-mono">
            30% : 70%
          </div>
          <p className="text-xs text-[#7B8190] mt-1">
            30% Teori vs 70% Hands-on Praktik & Tools
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E7E9F0] shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#7B8190] uppercase tracking-wider">
              Rata-rata Durasi
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#3B82F6] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#202533] tabular-nums font-mono">
            {avgJP} <span className="text-sm font-normal text-[#7B8190]">JP</span>
          </div>
          <p className="text-xs text-[#7B8190] mt-1">
            Standar valid: 1 JP = 45 menit
          </p>
        </div>
      </div>

      {/* 4 Core Module Shortcuts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#202533]">
              Empat Modul Inti DigiTraining
            </h3>
            <p className="text-xs text-[#7B8190]">
              Perangkat utama yang dihasilkan secara otomatis dan saling konsisten
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            onClick={onCreateNew}
            className="p-5 bg-white rounded-3xl border border-[#E7E9F0] hover:border-[#6C5CE7]/40 hover:shadow-sm transition-all duration-150 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#6C5CE7] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#202533] mb-1">Modul A — Silabus</h4>
            <p className="text-xs text-[#7B8190] leading-relaxed mb-3">
              Format silabus standar: tujuan, kompetensi, materi pokok, dan sistem evaluasi kelulusan.
            </p>
            <span className="text-xs font-semibold text-[#6C5CE7] flex items-center gap-1">
              Mulai Susun <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          <div
            onClick={onCreateNew}
            className="p-5 bg-white rounded-3xl border border-[#E7E9F0] hover:border-[#6C5CE7]/40 hover:shadow-sm transition-all duration-150 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#5847D6] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#202533] mb-1">Modul B — Rundown</h4>
            <p className="text-xs text-[#7B8190] leading-relaxed mb-3">
              Rincian jadwal sinkronus & asinkronus dengan validasi 1 JP = 45 menit & pemisahan istirahat.
            </p>
            <span className="text-xs font-semibold text-[#6C5CE7] flex items-center gap-1">
              Mulai Susun <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          <div
            onClick={onCreateNew}
            className="p-5 bg-white rounded-3xl border border-[#E7E9F0] hover:border-[#6C5CE7]/40 hover:shadow-sm transition-all duration-150 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#35A875] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#202533] mb-1">Modul C — Materi & Slide</h4>
            <p className="text-xs text-[#7B8190] leading-relaxed mb-3">
              30% Teori, 70% Hands-on Praktik & Tools nyata, serta bahan tayang slide interaktif.
            </p>
            <span className="text-xs font-semibold text-[#6C5CE7] flex items-center gap-1">
              Mulai Susun <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          <div
            onClick={onCreateNew}
            className="p-5 bg-white rounded-3xl border border-[#E7E9F0] hover:border-[#6C5CE7]/40 hover:shadow-sm transition-all duration-150 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#E7A23B] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#202533] mb-1">Modul D — Evaluasi 20 Soal</h4>
            <p className="text-xs text-[#7B8190] leading-relaxed mb-3">
              Tepat 20 butir Pre-test dan 20 butir Post-test, 4 opsi (A-D), kunci jawaban, dan pembahasan.
            </p>
            <span className="text-xs font-semibold text-[#6C5CE7] flex items-center gap-1">
              Mulai Susun <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>
      </div>

      {/* Recent Projects Table */}
      <div className="bg-white rounded-3xl border border-[#E7E9F0] overflow-hidden shadow-xs">
        <div className="p-6 border-b border-[#E7E9F0] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#202533]">Daftar Pelatihan Terkini</h3>
              <span className="text-[11px] font-semibold bg-[#6C5CE7]/10 text-[#6C5CE7] px-2.5 py-0.5 rounded-full">
                Multi-Device Cloud
              </span>
            </div>
            <p className="text-xs text-[#7B8190]">
              Pelatihan yang sedang disusun dan dapat diakses bersama antar pengajar
            </p>
          </div>
          {totalProjects > 0 && (
            <button
              onClick={onCreateNew}
              className="text-xs font-semibold text-[#6C5CE7] hover:text-[#5847D6] transition-colors cursor-pointer"
            >
              + Tambah Baru
            </button>
          )}
        </div>

        {totalProjects === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#6C5CE7] flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-[#202533] mb-1">
              Belum Ada Pelatihan Tersimpan
            </h4>
            <p className="text-xs text-[#7B8190] max-w-md mx-auto mb-6">
              Mulai dengan mengisi formulir pelatihan baru. Anda dapat memasukkan data pelatihan Anda atau menggunakan opsi muat format contoh resmi BLSDM Komdigi untuk melihat pratinjau.
            </p>
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6C5CE7] text-white text-xs font-semibold rounded-xl hover:bg-[#5847D6] shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Pelatihan Baru Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F6FA] text-[11px] font-semibold text-[#7B8190] uppercase tracking-wider border-b border-[#E7E9F0]">
                  <th className="py-3 px-6">Nama Pelatihan</th>
                  <th className="py-3 px-6">Pengajar & Kepemilikan</th>
                  <th className="py-3 px-6">Metode</th>
                  <th className="py-3 px-6 text-center">Durasi</th>
                  <th className="py-3 px-6 text-center">Kelengkapan</th>
                  <th className="py-3 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E9F0] text-sm text-[#202533]">
                {projects.map((proj) => {
                  let docCount = 0;
                  if (proj.syllabus) docCount++;
                  if (proj.rundown) docCount++;
                  if (proj.material) docCount++;
                  if (proj.slides) docCount++;
                  if (proj.evaluation) docCount++;

                  const creatorName = proj.creatorName || currentInstructor.name;
                  const creatorRole = proj.creatorRole || currentInstructor.role;
                  const isMine = !proj.creatorId || proj.creatorId === currentInstructor.id || proj.creatorName === currentInstructor.name;

                  return (
                    <tr
                      key={proj.id}
                      className="hover:bg-[#F5F6FA]/60 transition-colors cursor-pointer"
                      onClick={() => onOpenProject(proj.id)}
                    >
                      <td className="py-4 px-6 font-semibold text-[#202533]">
                        <div className="hover:text-[#6C5CE7] transition-colors">{proj.input.trainingName}</div>
                        <div className="text-xs font-normal text-[#7B8190] line-clamp-1 mt-0.5">
                          {proj.input.targetAudience}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-xs font-semibold text-[#202533]">{creatorName}</div>
                        <div className="text-[11px] text-[#7B8190] flex items-center gap-1.5">
                          <span>{creatorRole}</span>
                          {isMine ? (
                            <span className="text-[10px] bg-purple-50 text-[#6C5CE7] px-1.5 py-0.2 rounded font-medium">Milik Anda</span>
                          ) : (
                            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.2 rounded font-medium">Shared</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-[#F5F6FA] border border-[#E7E9F0] font-medium text-[#4A5568]">
                          {proj.input.deliveryMethod}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center font-mono tabular-nums text-xs">
                        <span className="font-semibold text-[#6C5CE7]">{proj.input.totalJP} JP</span>
                        <span className="text-[#7B8190] block text-[11px]">{proj.input.trainingDays} Hari</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-xs font-mono tabular-nums bg-purple-50 text-[#6C5CE7] px-2 py-0.5 rounded-md font-medium">
                          {docCount}/5 Modul
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenProject(proj.id);
                          }}
                          className="px-3.5 py-1.5 bg-[#6C5CE7]/10 hover:bg-[#6C5CE7] text-[#6C5CE7] hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Buka Editor
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
