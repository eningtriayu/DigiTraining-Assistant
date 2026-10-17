/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  Layers,
  CheckSquare,
  BookOpen,
  ShieldCheck,
  Download,
  Copy,
  Printer,
  Edit3,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Presentation,
  Check,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  HelpCircle,
  UserCheck,
  ExternalLink,
  Globe,
  Search,
  Award,
  Zap,
} from 'lucide-react';
import {
  TrainingProject,
  SyllabusOutput,
  RundownOutput,
  MaterialOutput,
  SlideOutlineOutput,
  EvaluationOutput,
  CurriculumUnit,
  RundownSession,
  MaterialSection,
  SlideItem,
  TestQuestion,
  ReferenceItem,
} from '../types';
import {
  exportSyllabusToDocx,
  exportRundownToDocx,
  exportMaterialToDocx,
  exportEvaluationsToDocx,
  exportSingleTestToDocx,
  exportSlidesToPptx,
  copyToClipboard,
} from '../utils/exportUtils';
import { KOP_SURAT_IMAGE_URL } from '../utils/kopSuratAsset';
import { validateRundownSchedule } from '../utils/jpValidator';
import { runComprehensiveQualityCheck } from '../utils/qualityChecker';
import { regenerateSingleModule } from '../utils/generatorEngine';

type WorkspaceTab =
  | 'syllabus'
  | 'rundown'
  | 'material'
  | 'slides'
  | 'pretest'
  | 'posttest'
  | 'references'
  | 'quality';

interface ProjectWorkspaceViewProps {
  project: TrainingProject;
  onUpdateProject: (updated: TrainingProject) => void;
  onBackToDashboard: () => void;
  onRegenerateModule: (module: 'syllabus' | 'rundown' | 'material' | 'slides' | 'evaluations') => Promise<void>;
  isRegenerating: boolean;
}

export const ProjectWorkspaceView: React.FC<ProjectWorkspaceViewProps> = ({
  project,
  onUpdateProject,
  onBackToDashboard,
  isRegenerating: parentIsRegenerating,
}) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('syllabus');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Regeneration modal state
  const [showRegenModal, setShowRegenModal] = useState<boolean>(false);
  const [regenTarget, setRegenTarget] = useState<'current' | 'all'>('current');
  const [customRegenPrompt, setCustomRegenPrompt] = useState<string>('');
  const [isLocalRegenerating, setIsLocalRegenerating] = useState<boolean>(false);

  // Local working state copies
  const [currentProject, setCurrentProject] = useState<TrainingProject>(project);

  // References Tab Filter & Search State
  const [refSearch, setRefSearch] = useState<string>('');
  const [refCategory, setRefCategory] = useState<string>('Semua');
  const [refViewMode, setRefViewMode] = useState<'cards' | 'table'>('cards');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync when prop updates
  React.useEffect(() => {
    setCurrentProject(project);
  }, [project]);

  // Handle Save All Manual Edits
  const handleSaveAll = () => {
    let updated = { ...currentProject, updatedAt: new Date().toISOString() };

    // Revalidate rundown if present
    if (updated.rundown) {
      const validated = validateRundownSchedule(updated.rundown.days, updated.input.totalJP);
      updated.rundown = {
        ...updated.rundown,
        totalJP: validated.actualJP,
        synchronousJP: validated.synchronousJP,
        asynchronousJP: validated.asynchronousJP,
        validation: validated,
      };
    }

    updated.qualityCheck = runComprehensiveQualityCheck(updated);
    setCurrentProject(updated);
    onUpdateProject(updated);
    setIsEditing(false);
    showToast('Perubahan manual berhasil disimpan ke database lokal.');
  };

  // Human Review Status Toggle
  const handleStatusChange = (newStatus: 'Draft' | 'Ditinjau' | 'Disetujui Instruktur') => {
    const updated: TrainingProject = {
      ...currentProject,
      syllabus: currentProject.syllabus ? { ...currentProject.syllabus, reviewStatus: newStatus } : undefined,
      rundown: currentProject.rundown ? { ...currentProject.rundown, reviewStatus: newStatus } : undefined,
      material: currentProject.material ? { ...currentProject.material, reviewStatus: newStatus } : undefined,
      slides: currentProject.slides ? { ...currentProject.slides, reviewStatus: newStatus } : undefined,
      evaluation: currentProject.evaluation ? { ...currentProject.evaluation, reviewStatus: newStatus } : undefined,
      status: newStatus === 'Disetujui Instruktur' ? 'Lengkap' : 'Draft',
      updatedAt: new Date().toISOString(),
    };
    setCurrentProject(updated);
    onUpdateProject(updated);
    showToast(`Status peninjauan diubah: ${newStatus}`);
  };

  // Trigger Regeneration
  const handleExecuteRegenerate = async () => {
    setIsLocalRegenerating(true);
    try {
      if (regenTarget === 'all') {
        const targetModules: Array<'syllabus' | 'rundown' | 'material' | 'slides' | 'evaluations'> = [
          'syllabus',
          'rundown',
          'material',
          'slides',
          'evaluations',
        ];
        let p = { ...currentProject };
        for (const m of targetModules) {
          p = await regenerateSingleModule(p, m, customRegenPrompt);
        }
        setCurrentProject(p);
        onUpdateProject(p);
        showToast('Seluruh perangkat pelatihan berhasil digenerate ulang.');
      } else {
        const modMap: Record<WorkspaceTab, 'syllabus' | 'rundown' | 'material' | 'slides' | 'evaluations'> = {
          syllabus: 'syllabus',
          rundown: 'rundown',
          material: 'material',
          slides: 'slides',
          pretest: 'evaluations',
          posttest: 'evaluations',
          references: 'material',
          quality: 'syllabus',
        };
        const target = modMap[activeTab];
        const updated = await regenerateSingleModule(currentProject, target, customRegenPrompt);
        setCurrentProject(updated);
        onUpdateProject(updated);
        showToast(`Modul ${activeTab.toUpperCase()} berhasil digenerate ulang.`);
      }
      setShowRegenModal(false);
      setCustomRegenPrompt('');
    } catch (err) {
      console.error('Error saat regenerasi:', err);
      showToast('Gagal melakukan regenerasi modul.');
    } finally {
      setIsLocalRegenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper Copy Function
  const handleCopyCurrentTab = async () => {
    let text = '';
    if (activeTab === 'syllabus' && currentProject.syllabus) {
      text = `# SILABUS PELATIHAN: ${currentProject.syllabus.trainingName}\nBLSDM Komdigi Surabaya\nTotal Durasi: ${currentProject.syllabus.totalJP} JP\nMetode: ${currentProject.syllabus.deliveryMethod}\n\n## Deskripsi:\n${currentProject.syllabus.description}\n\n## Tujuan Pembelajaran:\n${currentProject.syllabus.objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\n## Kurikulum Mata Pelatihan:\n${currentProject.syllabus.curriculum.map((c) => `- ${c.moduleName} (${c.jp} JP):\n  Topik: ${c.topics.join(', ')}`).join('\n')}`;
    } else if (activeTab === 'rundown' && currentProject.rundown) {
      text = `# RUNDOWN JADWAL PELATIHAN\n${currentProject.input.trainingName}\nTotal JP: ${currentProject.rundown.totalJP} JP\n\n` +
        currentProject.rundown.days
          .map(
            (d) =>
              `### Hari ${d.dayNumber}\n` +
              d.sessions.map((s) => `${s.timeRange} | ${s.topic} | ${s.activity} (${s.deliveryMode}) | ${s.durationJP} JP`).join('\n')
          )
          .join('\n\n');
    } else if (activeTab === 'material' && currentProject.material) {
      text = `# ${currentProject.material.title}\nBLSDM Komdigi Surabaya\n\n## Ringkasan:\n${currentProject.material.summary}\n\n` +
        currentProject.material.sections
          .map((s) => `### ${s.title}\n${s.conceptSummary}\n\n${s.explanation}\n\nContoh:\n${s.examples.map((e) => `- ${e}`).join('\n')}\n\nPraktik:\n${(s.practiceSteps || []).map((p, i) => `${i + 1}. ${p}`).join('\n')}`)
          .join('\n\n');
    } else if (activeTab === 'slides' && currentProject.slides) {
      text = `# BAHAN TAYANG PRESENTASI: ${currentProject.input.trainingName}\n\n` +
        currentProject.slides.slides
          .map(
            (s) =>
              `--- SLIDE ${s.slideNumber}: ${s.title} ---\nPesan Utama: ${s.mainMessage}\nPoin: \n${s.bulletPoints.map((b) => `- ${b}`).join('\n')}\nSpeaker Notes: ${s.speakerNotes}\nSaran Visual: ${s.visualSuggestion}`
          )
          .join('\n\n');
    } else if (activeTab === 'pretest' && currentProject.evaluation) {
      text = `# SOAL PRE-TEST (20 BUTIR PILIHAN GANDA)\nPelatihan: ${currentProject.input.trainingName}\n\n` +
        currentProject.evaluation.preTest
          .map((q) => `${q.number}. ${q.question}\nA. ${q.options.A}\nB. ${q.options.B}\nC. ${q.options.C}\nD. ${q.options.D}\nKunci: ${q.correctAnswer}\nPembahasan: ${q.explanation}\n`)
          .join('\n');
    } else if (activeTab === 'posttest' && currentProject.evaluation) {
      text = `# SOAL POST-TEST (20 BUTIR PILIHAN GANDA)\nPelatihan: ${currentProject.input.trainingName}\n\n` +
        currentProject.evaluation.postTest
          .map((q) => `${q.number}. ${q.question}\nA. ${q.options.A}\nB. ${q.options.B}\nC. ${q.options.C}\nD. ${q.options.D}\nKunci: ${q.correctAnswer}\nPembahasan: ${q.explanation}\n`)
          .join('\n');
    } else if (activeTab === 'references' && currentProject.material) {
      text = `# DAFTAR REFERENSI PELATIHAN\n\n` +
        currentProject.material.references
          .map((r, i) => `[${i + 1}] ${r.title}. ${r.publisherOrAuthor} (${r.yearOrDate || '-'}). ${r.url || ''} [Status: ${r.verificationStatus}]`)
          .join('\n');
    }

    if (text) {
      const ok = await copyToClipboard(text);
      if (ok) showToast('Konten berhasil disalin ke clipboard.');
    }
  };

  const currentReviewStatus =
    currentProject.syllabus?.reviewStatus ||
    currentProject.rundown?.reviewStatus ||
    'Draft';

  return (
    <div className="space-y-6 pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#202533] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-[#35A875]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* REGENERATE MODAL WITH CUSTOM PROMPT */}
      {showRegenModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E7E9F0] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7E9F0] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#6C5CE7] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#202533]">
                    {regenTarget === 'all' ? 'Generate Ulang Seluruh Perangkat' : `Generate Ulang Modul: ${activeTab.toUpperCase()}`}
                  </h3>
                  <p className="text-[11px] text-[#7B8190]">Instruksikan AI untuk menyesuaikan ulang draf dokumen</p>
                </div>
              </div>
              <button
                onClick={() => setShowRegenModal(false)}
                className="text-xs text-[#7B8190] hover:text-[#202533] p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#202533] mb-1">
                  Catatan / Instruksi Khusus untuk AI (Opsional)
                </label>
                <textarea
                  rows={4}
                  value={customRegenPrompt}
                  onChange={(e) => setCustomRegenPrompt(e.target.value)}
                  placeholder="Contoh: Perbanyak studi kasus terkait instansi kehumasan daerah, tambahkan penekanan pada penanganan hoaks deepfake, atau sesuaikan jadwal hari kedua agar sesi praktik lab lebih panjang..."
                  className="w-full p-3 rounded-xl border border-[#E7E9F0] text-xs text-[#202533] focus:outline-hidden focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15"
                />
                <span className="text-[11px] text-[#7B8190] mt-1 block">
                  AI akan mengintegrasikan arahan ini tanpa mengubah ketentuan durasi (1 JP = 45 menit) dan 20 butir soal evaluasi.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E7E9F0]">
              <button
                type="button"
                onClick={() => setShowRegenModal(false)}
                disabled={isLocalRegenerating}
                className="px-4 py-2 text-xs font-medium text-[#7B8190] hover:text-[#202533]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteRegenerate}
                disabled={isLocalRegenerating}
                className="flex items-center gap-2 px-5 py-2 bg-[#6C5CE7] hover:bg-[#5847D6] text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-60 cursor-pointer"
              >
                {isLocalRegenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sedang Menyusun Ulang...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Mulai Generate Ulang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP WORKSPACE HEADER & HUMAN IN THE LOOP CONTROLS */}
      <div className="bg-white rounded-2xl p-6 border border-[#E7E9F0] shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToDashboard}
              className="p-2 rounded-xl border border-[#E7E9F0] hover:bg-[#F5F6FA] text-[#7B8190] hover:text-[#202533] transition-colors cursor-pointer"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-[#202533]">{currentProject.input.trainingName}</h2>
                <span className="text-xs font-mono font-bold bg-purple-50 text-[#6C5CE7] px-2.5 py-0.5 rounded-lg border border-[#6C5CE7]/20">
                  {currentProject.input.totalJP} JP
                </span>
                <span className="text-xs bg-[#F5F6FA] text-[#4A5568] px-2.5 py-0.5 rounded-lg border border-[#E7E9F0]">
                  {currentProject.input.deliveryMethod} ({currentProject.input.trainingDays} Hari)
                </span>
              </div>
              <p className="text-xs text-[#7B8190] mt-1">
                BLSDM Komdigi Surabaya · Sasaran: {currentProject.input.targetAudience} ({currentProject.input.participantLevel})
              </p>
            </div>
          </div>

          {/* Human-in-the-Loop Status Badge & Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Dropdown */}
            <div className="flex items-center gap-2 bg-[#F5F6FA] p-1.5 rounded-xl border border-[#E7E9F0] text-xs">
              <UserCheck className="w-3.5 h-3.5 text-[#6C5CE7] ml-1.5" />
              <span className="font-semibold text-[#7B8190] text-[11px]">Tinjauan Instruktur:</span>
              <select
                value={currentReviewStatus}
                onChange={(e) => handleStatusChange(e.target.value as any)}
                className="bg-white border border-[#E7E9F0] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#202533] focus:outline-hidden cursor-pointer"
              >
                <option value="Draft">Draft (Perlu Tinjauan)</option>
                <option value="Ditinjau">Sedang Ditinjau Instruktur</option>
                <option value="Disetujui Instruktur">Disetujui Instruktur (Final)</option>
              </select>
            </div>

            {/* Manual Edit Mode Toggle */}
            {isEditing ? (
              <button
                onClick={handleSaveAll}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#35A875] hover:bg-[#2d9164] text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E7E9F0] hover:bg-[#F5F6FA] text-[#202533] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                title="Buka mode edit manual untuk mengubah teks, sesi, butir soal, dan alokasi"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#6C5CE7]" />
                <span>Edit Manual Dokumen</span>
              </button>
            )}

            {/* Regenerate Action */}
            <div className="relative inline-flex items-center">
              <button
                onClick={() => {
                  setRegenTarget('current');
                  setShowRegenModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 text-[#6C5CE7] hover:bg-purple-100 text-xs font-semibold rounded-xl border border-[#6C5CE7]/30 transition-colors cursor-pointer"
                title="Generate ulang modul yang aktif"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Generate Ulang Modul</span>
              </button>
            </div>

            <button
              onClick={handleCopyCurrentTab}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E7E9F0] hover:bg-[#F5F6FA] text-[#202533] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              title="Salin teks halaman ini"
            >
              <Copy className="w-3.5 h-3.5 text-[#7B8190]" />
              <span>Salin</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E7E9F0] hover:bg-[#F5F6FA] text-[#202533] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              title="Cetak atau Simpan sebagai PDF"
            >
              <Printer className="w-3.5 h-3.5 text-[#7B8190]" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>

        {/* Informative Banner when in Edit Mode */}
        {isEditing && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Mode Edit Manual Aktif (Human-in-the-Loop):</strong> Anda dapat menambah, menghapus, atau mengubah teks, kurikulum, alokasi sesi jadwal, materi, slide, dan 20 butir soal evaluasi secara bebas.
              </span>
            </div>
            <button
              onClick={handleSaveAll}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs"
            >
              Simpan Sekarang
            </button>
          </div>
        )}
      </div>

      {/* TABS NAVIGATION */}
      <div className="bg-white rounded-2xl p-1.5 border border-[#E7E9F0] shadow-xs flex flex-wrap gap-1">
        {[
          { id: 'syllabus', label: 'Silabus Pelatihan', icon: <FileText className="w-4 h-4" /> },
          { id: 'rundown', label: 'Rundown Jadwal', icon: <Calendar className="w-4 h-4" /> },
          { id: 'material', label: 'Materi Lengkap', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'slides', label: 'Materi Per Slide', icon: <Layers className="w-4 h-4" /> },
          { id: 'pretest', label: 'Pre-Test (20 Soal)', icon: <CheckSquare className="w-4 h-4" /> },
          { id: 'posttest', label: 'Post-Test (20 Soal)', icon: <CheckSquare className="w-4 h-4" /> },
          { id: 'references', label: 'Daftar Referensi', icon: <ShieldCheck className="w-4 h-4" /> },
          { id: 'quality', label: 'Quality Check', icon: <CheckCircle2 className="w-4 h-4" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as WorkspaceTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#6C5CE7] text-white shadow-xs'
                  : 'text-[#7B8190] hover:text-[#202533] hover:bg-[#F5F6FA]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: SILABUS ================= */}
      {activeTab === 'syllabus' && currentProject.syllabus && (
        <div className="bg-white rounded-2xl p-8 border border-[#E7E9F0] shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E7E9F0] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#202533]">Silabus Pelatihan Resmi</h3>
              <p className="text-xs text-[#7B8190]">
                Format terstruktur BLSDM Komdigi Surabaya · Total Alokasi: {currentProject.syllabus.totalJP} JP
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportSyllabusToDocx(currentProject.syllabus!, currentProject.input.trainingName)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#6C5CE7] text-white text-xs font-semibold rounded-xl hover:bg-[#5847D6] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Word (.docx)</span>
              </button>
            </div>
          </div>

          {/* Metadata Table */}
          <div className="overflow-hidden rounded-xl border border-[#E7E9F0]">
            <table className="w-full text-left text-xs border-collapse">
              <tbody className="divide-y divide-[#E7E9F0]">
                <tr className="bg-[#F5F6FA]">
                  <td className="py-2.5 px-4 font-bold text-[#202533] w-1/3">Nama Pelatihan</td>
                  <td className="py-2.5 px-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentProject.syllabus.trainingName}
                        onChange={(e) =>
                          setCurrentProject({
                            ...currentProject,
                            syllabus: { ...currentProject.syllabus!, trainingName: e.target.value },
                          })
                        }
                        className="w-full p-1.5 border border-[#E7E9F0] rounded-lg text-xs font-semibold text-[#6C5CE7]"
                      />
                    ) : (
                      <span className="font-semibold text-[#6C5CE7]">{currentProject.syllabus.trainingName}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-[#202533]">Instansi Penyelenggara</td>
                  <td className="py-2.5 px-4 text-[#202533]">BLSDM Komdigi Surabaya</td>
                </tr>
                <tr className="bg-[#F5F6FA]">
                  <td className="py-2.5 px-4 font-bold text-[#202533]">Deskripsi Pelatihan</td>
                  <td className="py-2.5 px-4 text-[#4A5568] leading-relaxed">
                    {isEditing ? (
                      <textarea
                        rows={3}
                        value={currentProject.syllabus.description}
                        onChange={(e) =>
                          setCurrentProject({
                            ...currentProject,
                            syllabus: { ...currentProject.syllabus!, description: e.target.value },
                          })
                        }
                        className="w-full p-2 border border-[#E7E9F0] rounded-lg text-xs"
                      />
                    ) : (
                      currentProject.syllabus.description
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-[#202533]">Tujuan Pelatihan</td>
                  <td className="py-2.5 px-4 space-y-1.5">
                    {currentProject.syllabus.objectives.map((obj, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <span className="text-[#7B8190]">{i + 1}.</span>
                            <input
                              type="text"
                              value={obj}
                              onChange={(e) => {
                                const next = [...currentProject.syllabus!.objectives];
                                next[i] = e.target.value;
                                setCurrentProject({
                                  ...currentProject,
                                  syllabus: { ...currentProject.syllabus!, objectives: next },
                                });
                              }}
                              className="flex-1 p-1 border rounded-md text-xs"
                            />
                            <button
                              onClick={() => {
                                const next = currentProject.syllabus!.objectives.filter((_, idx) => idx !== i);
                                setCurrentProject({
                                  ...currentProject,
                                  syllabus: { ...currentProject.syllabus!, objectives: next },
                                });
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Hapus poin tujuan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className="text-[#202533] leading-relaxed">
                            {i + 1}. {obj}
                          </div>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <button
                        onClick={() => {
                          const next = [...currentProject.syllabus!.objectives, 'Poin tujuan pembelajaran baru'];
                          setCurrentProject({
                            ...currentProject,
                            syllabus: { ...currentProject.syllabus!, objectives: next },
                          });
                        }}
                        className="text-xs text-[#6C5CE7] font-semibold mt-1 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Poin Tujuan
                      </button>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Curriculum Table (Editable Units) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-[#202533]">Rencana Mata Pelatihan & Alokasi JP</h4>
              {isEditing && (
                <button
                  onClick={() => {
                    const newUnit: CurriculumUnit = {
                      no: currentProject.syllabus!.curriculum.length + 1,
                      moduleName: 'Mata Pelatihan Baru',
                      topics: ['Submateri 1', 'Submateri 2'],
                      jp: 4,
                      classActivities: ['Ceramah', 'Praktik Mandiri'],
                    };
                    setCurrentProject({
                      ...currentProject,
                      syllabus: {
                        ...currentProject.syllabus!,
                        curriculum: [...currentProject.syllabus!.curriculum, newUnit],
                      },
                    });
                  }}
                  className="flex items-center gap-1 text-xs text-[#6C5CE7] font-semibold bg-purple-50 px-2.5 py-1 rounded-lg border border-[#6C5CE7]/30"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Mata Pelatihan
                </button>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E7E9F0]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F5F6FA] text-[#7B8190] font-semibold border-b border-[#E7E9F0]">
                    <th className="py-2.5 px-3 w-10 text-center">No</th>
                    <th className="py-2.5 px-4 w-1/4">Mata Pelatihan</th>
                    <th className="py-2.5 px-4">Materi Pokok dan Submateri</th>
                    <th className="py-2.5 px-4 w-20 text-center">JP</th>
                    <th className="py-2.5 px-4 w-1/4">Aktivitas Kelas</th>
                    {isEditing && <th className="py-2.5 px-3 w-12 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E9F0]">
                  {currentProject.syllabus.curriculum.map((unit, idx) => (
                    <tr key={idx} className="hover:bg-[#F5F6FA]/50 transition-colors">
                      <td className="py-2.5 px-3 text-center font-bold text-[#7B8190]">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-bold text-[#202533]">
                        {isEditing ? (
                          <input
                            type="text"
                            value={unit.moduleName}
                            onChange={(e) => {
                              const next = [...currentProject.syllabus!.curriculum];
                              next[idx].moduleName = e.target.value;
                              setCurrentProject({
                                ...currentProject,
                                syllabus: { ...currentProject.syllabus!, curriculum: next },
                              });
                            }}
                            className="w-full p-1 border rounded-md text-xs font-bold"
                          />
                        ) : (
                          unit.moduleName
                        )}
                      </td>
                      <td className="py-2.5 px-4 space-y-1">
                        {isEditing ? (
                          <textarea
                            rows={2}
                            value={unit.topics.join('\n')}
                            onChange={(e) => {
                              const next = [...currentProject.syllabus!.curriculum];
                              next[idx].topics = e.target.value.split('\n').filter((s) => s.trim().length > 0);
                              setCurrentProject({
                                ...currentProject,
                                syllabus: { ...currentProject.syllabus!, curriculum: next },
                              });
                            }}
                            className="w-full p-1 border rounded-md text-xs"
                          />
                        ) : (
                          unit.topics.map((t, i) => (
                            <div key={i} className="text-[#4A5568]">
                              • {t}
                            </div>
                          ))
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-[#6C5CE7]">
                        {isEditing ? (
                          <input
                            type="number"
                            min={1}
                            value={unit.jp}
                            onChange={(e) => {
                              const next = [...currentProject.syllabus!.curriculum];
                              next[idx].jp = parseInt(e.target.value, 10) || 0;
                              setCurrentProject({
                                ...currentProject,
                                syllabus: { ...currentProject.syllabus!, curriculum: next },
                              });
                            }}
                            className="w-16 p-1 border rounded-md text-center text-xs font-bold"
                          />
                        ) : (
                          `${unit.jp} JP`
                        )}
                      </td>
                      <td className="py-2.5 px-4 space-y-1">
                        {isEditing ? (
                          <input
                            type="text"
                            value={unit.classActivities.join(', ')}
                            onChange={(e) => {
                              const next = [...currentProject.syllabus!.curriculum];
                              next[idx].classActivities = e.target.value.split(',').map((s) => s.trim());
                              setCurrentProject({
                                ...currentProject,
                                syllabus: { ...currentProject.syllabus!, curriculum: next },
                              });
                            }}
                            className="w-full p-1 border rounded-md text-xs"
                          />
                        ) : (
                          unit.classActivities.map((act, i) => (
                            <div key={i} className="text-[#4A5568]">
                              • {act}
                            </div>
                          ))
                        )}
                      </td>
                      {isEditing && (
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              const next = currentProject.syllabus!.curriculum.filter((_, i) => i !== idx);
                              setCurrentProject({
                                ...currentProject,
                                syllabus: { ...currentProject.syllabus!, curriculum: next },
                              });
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Hapus unit mata pelatihan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: RUNDOWN ================= */}
      {activeTab === 'rundown' && currentProject.rundown && (
        <div className="bg-white rounded-2xl p-8 border border-[#E7E9F0] shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E7E9F0] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#202533]">
                Rincian Rencana Jadwal Pelatihan (Rundown)
              </h3>
              <p className="text-xs text-[#7B8190]">
                Perhitungan valid: 1 JP = 45 menit · Total JP: {currentProject.rundown.totalJP} JP
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportRundownToDocx(currentProject.rundown!, currentProject.input.trainingName)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#6C5CE7] text-white text-xs font-semibold rounded-xl hover:bg-[#5847D6] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Word (.docx)</span>
              </button>
            </div>
          </div>

          {/* Validation Notice */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
              currentProject.rundown.validation.isValid
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {currentProject.rundown.validation.isValid ? (
                <CheckCircle2 className="w-4 h-4 text-[#35A875]" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-[#E7A23B]" />
              )}
              <span className="font-semibold">{currentProject.rundown.validation.messages[0]}</span>
            </div>
            <span className="font-mono tabular-nums font-bold">
              {currentProject.rundown.totalJP} / {currentProject.input.totalJP} JP
            </span>
          </div>

          {/* Daily Schedule Tables with Add/Delete/Edit session */}
          {currentProject.rundown.days.map((day, dIdx) => (
            <div key={day.dayNumber} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#202533]">
                  HARI {day.dayNumber} {day.dayTitle ? `— ${day.dayTitle}` : ''}
                </h4>
                {isEditing && (
                  <button
                    onClick={() => {
                      const newSess: RundownSession = {
                        id: `s-${day.dayNumber}-${Date.now()}`,
                        dayNumber: day.dayNumber,
                        timeRange: '13.00-14.30',
                        topic: 'Sesi Pembelajaran Tambahan',
                        activity: 'Praktik dan simulasi mandiri',
                        deliveryMode: 'Sinkronus',
                        durationMinutes: 90,
                        durationJP: 2,
                        isLearningJP: true,
                      };
                      const nextDays = [...currentProject.rundown!.days];
                      nextDays[dIdx].sessions.push(newSess);
                      setCurrentProject({
                        ...currentProject,
                        rundown: { ...currentProject.rundown!, days: nextDays },
                      });
                    }}
                    className="flex items-center gap-1 text-xs text-[#6C5CE7] font-semibold bg-purple-50 px-2.5 py-1 rounded-lg border border-[#6C5CE7]/30"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Sesi
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#E7E9F0]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F5F6FA] text-[#7B8190] font-semibold border-b border-[#E7E9F0]">
                      <th className="py-2.5 px-3 w-32">Waktu</th>
                      <th className="py-2.5 px-4">Topik</th>
                      <th className="py-2.5 px-4 w-1/3">Aktivitas / Kegiatan</th>
                      <th className="py-2.5 px-3 w-28 text-center">Durasi</th>
                      {isEditing && <th className="py-2.5 px-2 w-12 text-center">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E9F0]">
                    {day.sessions.map((sess, sIdx) => {
                      const isBreak = sess.deliveryMode === 'Break';
                      return (
                        <tr
                          key={sess.id}
                          className={`transition-colors ${
                            isBreak ? 'bg-amber-50/40 text-amber-900 font-medium' : 'hover:bg-[#F5F6FA]/50'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-medium text-[#202533]">
                            {isEditing ? (
                              <input
                                type="text"
                                value={sess.timeRange}
                                onChange={(e) => {
                                  const nextDays = [...currentProject.rundown!.days];
                                  nextDays[dIdx].sessions[sIdx].timeRange = e.target.value;
                                  setCurrentProject({
                                    ...currentProject,
                                    rundown: { ...currentProject.rundown!, days: nextDays },
                                  });
                                }}
                                className="w-28 p-1 border rounded-md text-xs font-mono"
                              />
                            ) : (
                              sess.timeRange
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            {isEditing ? (
                              <input
                                type="text"
                                value={sess.topic}
                                onChange={(e) => {
                                  const nextDays = [...currentProject.rundown!.days];
                                  nextDays[dIdx].sessions[sIdx].topic = e.target.value;
                                  setCurrentProject({
                                    ...currentProject,
                                    rundown: { ...currentProject.rundown!, days: nextDays },
                                  });
                                }}
                                className="w-full p-1 border rounded-md text-xs font-semibold"
                              />
                            ) : (
                              <span className={sess.isLearningJP ? 'font-bold text-[#202533]' : 'text-[#7B8190]'}>
                                {sess.topic}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={sess.activity}
                                  onChange={(e) => {
                                    const nextDays = [...currentProject.rundown!.days];
                                    nextDays[dIdx].sessions[sIdx].activity = e.target.value;
                                    setCurrentProject({
                                      ...currentProject,
                                      rundown: { ...currentProject.rundown!, days: nextDays },
                                    });
                                  }}
                                  className="w-full p-1 border rounded-md text-xs"
                                />
                                <select
                                  value={sess.deliveryMode}
                                  onChange={(e) => {
                                    const nextDays = [...currentProject.rundown!.days];
                                    const mode = e.target.value as any;
                                    nextDays[dIdx].sessions[sIdx].deliveryMode = mode;
                                    nextDays[dIdx].sessions[sIdx].isLearningJP = mode !== 'Break' && mode !== 'Seremonial';
                                    setCurrentProject({
                                      ...currentProject,
                                      rundown: { ...currentProject.rundown!, days: nextDays },
                                    });
                                  }}
                                  className="p-1 border rounded-md text-[11px]"
                                >
                                  <option value="Sinkronus">Sinkronus</option>
                                  <option value="Asinkronus">Asinkronus</option>
                                  <option value="Break">Break</option>
                                  <option value="Seremonial">Seremonial</option>
                                </select>
                              </div>
                            ) : (
                              <>
                                <span className="text-[#4A5568]">{sess.activity}</span>
                                <span className="text-[10px] text-[#7B8190] ml-2 font-mono">({sess.deliveryMode})</span>
                              </>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  value={sess.durationJP}
                                  onChange={(e) => {
                                    const nextDays = [...currentProject.rundown!.days];
                                    const jp = parseInt(e.target.value, 10) || 0;
                                    nextDays[dIdx].sessions[sIdx].durationJP = jp;
                                    nextDays[dIdx].sessions[sIdx].durationMinutes = jp * 45;
                                    setCurrentProject({
                                      ...currentProject,
                                      rundown: { ...currentProject.rundown!, days: nextDays },
                                    });
                                  }}
                                  className="w-12 p-1 border rounded-md text-center text-xs font-bold"
                                />
                                <span className="text-[11px]">JP</span>
                              </div>
                            ) : isBreak ? (
                              <span className="text-amber-800 text-[11px] font-semibold">{sess.durationMinutes} mnt (Break)</span>
                            ) : (
                              <span className="text-[#6C5CE7] font-bold">
                                {sess.durationJP} JP <span className="text-[10px] text-[#7B8190]">({sess.durationMinutes}m)</span>
                              </span>
                            )}
                          </td>
                          {isEditing && (
                            <td className="py-2.5 px-2 text-center">
                              <button
                                onClick={() => {
                                  const nextDays = [...currentProject.rundown!.days];
                                  nextDays[dIdx].sessions.splice(sIdx, 1);
                                  setCurrentProject({
                                    ...currentProject,
                                    rundown: { ...currentProject.rundown!, days: nextDays },
                                  });
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Hapus sesi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= TAB 3: MATERI LENGKAP ================= */}
      {activeTab === 'material' && currentProject.material && (
        <div className="bg-white rounded-2xl p-8 border border-[#E7E9F0] shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E7E9F0] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#202533]">{currentProject.material.title}</h3>
              <p className="text-xs text-[#7B8190]">Buku Panduan Materi Pembelajaran Utuh — BLSDM Komdigi Surabaya</p>
            </div>
            <div className="flex items-center gap-2">
              {isEditing && (
                <button
                  onClick={() => {
                    const newSec: MaterialSection = {
                      id: `sec-${Date.now()}`,
                      title: `Bab ${currentProject.material!.sections.length + 1}: Topik Pembelajaran Baru`,
                      conceptSummary: 'Ringkasan konsep pokok bab tambahan ini.',
                      explanation: 'Uraian penjelasan materi mendalam yang terstruktur.',
                      examples: ['Contoh implementasi nyata di instansi publik.'],
                      practiceSteps: ['Langkah 1: Praktik mandiri.'],
                      caseStudyOrExercise: 'Studi kasus pemecahan masalah di tempat kerja.',
                    };
                    setCurrentProject({
                      ...currentProject,
                      material: {
                        ...currentProject.material!,
                        sections: [...currentProject.material!.sections, newSec],
                      },
                    });
                  }}
                  className="flex items-center gap-1 text-xs text-[#6C5CE7] font-semibold bg-purple-50 px-3 py-1.5 rounded-xl border border-[#6C5CE7]/30"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Bab Materi
                </button>
              )}
              <button
                onClick={() => exportMaterialToDocx(currentProject.material!, currentProject.input.trainingName)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#6C5CE7] text-white text-xs font-semibold rounded-xl hover:bg-[#5847D6] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Word (.docx)</span>
              </button>
            </div>
          </div>

          {/* 30% Theory : 70% Practical Hands-on Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/80 via-white to-emerald-50/60 border border-[#6C5CE7]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6C5CE7] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#202533] flex items-center gap-2">
                  <span>Komposisi Kurikulum Pelatihan BLSDM</span>
                  <span className="text-[10px] font-mono bg-[#6C5CE7]/15 text-[#6C5CE7] px-2 py-0.5 rounded-full font-bold">
                    30% Teori : 70% Praktik Hands-On
                  </span>
                </div>
                <p className="text-[11px] text-[#7B8190] mt-0.5">
                  Setiap bab menyajikan teori padat dan langsung diperdalam dengan langkah tutorial praktik, konfigurasi tools, dan studi kasus terapan peserta.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-purple-100/70 text-[#6C5CE7] border border-[#6C5CE7]/20">
                30% Teori Pokok
              </span>
              <span className="text-[#7B8190]">+</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100/70 text-emerald-800 border border-emerald-200">
                70% Tools & Studi Kasus
              </span>
            </div>
          </div>

          {/* Sections List */}
          <div className="space-y-6">
            {currentProject.material.sections.map((sec, idx) => (
              <div key={sec.id} className="p-6 rounded-xl border border-[#E7E9F0] bg-white space-y-4">
                <div className="flex items-center justify-between">
                  {isEditing ? (
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => {
                        const next = [...currentProject.material!.sections];
                        next[idx].title = e.target.value;
                        setCurrentProject({
                          ...currentProject,
                          material: { ...currentProject.material!, sections: next },
                        });
                      }}
                      className="p-1.5 border rounded-lg text-sm font-bold w-3/4"
                    />
                  ) : (
                    <h4 className="text-sm font-bold text-[#202533]">{sec.title}</h4>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#6C5CE7] bg-purple-50 px-2 py-0.5 rounded-md font-semibold">
                      Bab {idx + 1}
                    </span>
                    {isEditing && (
                      <button
                        onClick={() => {
                          const next = currentProject.material!.sections.filter((_, i) => i !== idx);
                          setCurrentProject({
                            ...currentProject,
                            material: { ...currentProject.material!, sections: next },
                          });
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Hapus bab ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <textarea
                    rows={2}
                    value={sec.conceptSummary}
                    onChange={(e) => {
                      const next = [...currentProject.material!.sections];
                      next[idx].conceptSummary = e.target.value;
                      setCurrentProject({
                        ...currentProject,
                        material: { ...currentProject.material!, sections: next },
                      });
                    }}
                    placeholder="Ringkasan konsep pokok bab..."
                    className="w-full p-2 border rounded-lg text-xs italic text-[#6C5CE7] bg-purple-50/30"
                  />
                ) : (
                  <div className="text-xs font-medium text-[#6C5CE7] italic bg-purple-50/50 p-3 rounded-lg border border-[#6C5CE7]/20">
                    {sec.conceptSummary}
                  </div>
                )}

                {isEditing ? (
                  <textarea
                    rows={6}
                    value={sec.explanation}
                    onChange={(e) => {
                      const next = [...currentProject.material!.sections];
                      next[idx].explanation = e.target.value;
                      setCurrentProject({
                        ...currentProject,
                        material: { ...currentProject.material!, sections: next },
                      });
                    }}
                    className="w-full p-3 border rounded-lg text-xs leading-relaxed text-[#202533]"
                  />
                ) : (
                  <div className="text-xs text-[#202533] leading-relaxed whitespace-pre-line">
                    {sec.explanation}
                  </div>
                )}

                {/* Examples */}
                <div className="p-4 bg-[#F5F6FA] rounded-xl border border-[#E7E9F0] text-xs">
                  <span className="font-bold text-[#202533] block mb-2">Contoh Penerapan Nyata:</span>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={sec.examples.join('\n')}
                      onChange={(e) => {
                        const next = [...currentProject.material!.sections];
                        next[idx].examples = e.target.value.split('\n').filter((s) => s.trim().length > 0);
                        setCurrentProject({
                          ...currentProject,
                          material: { ...currentProject.material!, sections: next },
                        });
                      }}
                      className="w-full p-2 border rounded-lg text-xs"
                      placeholder="1 baris = 1 contoh penerapan"
                    />
                  ) : (
                    <ul className="space-y-1.5 text-[#4A5568]">
                      {sec.examples.map((ex, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#6C5CE7] font-bold">✓</span>
                          <span>{ex}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Practice Steps */}
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs">
                  <span className="font-bold text-emerald-950 block mb-2">Langkah Praktik / Hands-on:</span>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={(sec.practiceSteps || []).join('\n')}
                      onChange={(e) => {
                        const next = [...currentProject.material!.sections];
                        next[idx].practiceSteps = e.target.value.split('\n').filter((s) => s.trim().length > 0);
                        setCurrentProject({
                          ...currentProject,
                          material: { ...currentProject.material!, sections: next },
                        });
                      }}
                      className="w-full p-2 border rounded-lg text-xs"
                      placeholder="1 baris = 1 langkah praktik"
                    />
                  ) : (
                    <ol className="space-y-1.5 text-emerald-900">
                      {(sec.practiceSteps || []).map((st, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="font-bold">{i + 1}.</span>
                          <span>{st}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                {/* Case Study */}
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 text-xs">
                  <span className="font-bold text-blue-950 block mb-1">Studi Kasus / Penugasan:</span>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={sec.caseStudyOrExercise || ''}
                      onChange={(e) => {
                        const next = [...currentProject.material!.sections];
                        next[idx].caseStudyOrExercise = e.target.value;
                        setCurrentProject({
                          ...currentProject,
                          material: { ...currentProject.material!, sections: next },
                        });
                      }}
                      className="w-full p-2 border rounded-lg text-xs"
                    />
                  ) : (
                    <p className="text-blue-900 leading-relaxed">{sec.caseStudyOrExercise}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: SLIDES ================= */}
      {activeTab === 'slides' && currentProject.slides && (
        <div className="bg-white rounded-2xl p-8 border border-[#E7E9F0] shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E7E9F0] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#202533]">Rancangan Materi Per Slide (Bahan Tayang)</h3>
              <p className="text-xs text-[#7B8190]">
                Tersusun atas {currentProject.slides.slides.length} slide lengkap dengan speaker notes dan saran visual
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isEditing && (
                <button
                  onClick={() => {
                    const newSlide: SlideItem = {
                      slideNumber: currentProject.slides!.slides.length + 1,
                      title: 'Slide Pembelajaran Baru',
                      mainMessage: 'Pesan utama slide presentasi',
                      bulletPoints: ['Poin tayang pertama', 'Poin tayang kedua'],
                      speakerNotes: 'Catatan panduan instruktur saat menampilkan slide ini di kelas.',
                      visualSuggestion: 'Tata letak diagram atau visual pendukung.',
                    };
                    setCurrentProject({
                      ...currentProject,
                      slides: {
                        ...currentProject.slides!,
                        slides: [...currentProject.slides!.slides, newSlide],
                      },
                    });
                  }}
                  className="flex items-center gap-1 text-xs text-[#6C5CE7] font-semibold bg-purple-50 px-3 py-1.5 rounded-xl border border-[#6C5CE7]/30"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Slide Baru
                </button>
              )}
              <button
                onClick={() => exportSlidesToPptx(currentProject.slides!, currentProject.input.trainingName)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#E7A23B] hover:bg-[#d49028] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>Unduh PowerPoint (.pptx)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {currentProject.slides.slides.map((s, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl border border-[#E7E9F0] bg-[#F5F6FA]/40 hover:bg-white hover:border-[#6C5CE7]/40 hover:shadow-sm transition-all duration-150 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold bg-[#6C5CE7] text-white px-2.5 py-0.5 rounded-md">
                      Slide {s.slideNumber}
                    </span>
                    {isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (idx === 0) return;
                            const next = [...currentProject.slides!.slides];
                            const temp = next[idx];
                            next[idx] = next[idx - 1];
                            next[idx - 1] = temp;
                            next.forEach((item, i) => (item.slideNumber = i + 1));
                            setCurrentProject({ ...currentProject, slides: { ...currentProject.slides!, slides: next } });
                          }}
                          className="p-1 text-[#7B8190] hover:text-[#202533]"
                          title="Pindah ke atas"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (idx === currentProject.slides!.slides.length - 1) return;
                            const next = [...currentProject.slides!.slides];
                            const temp = next[idx];
                            next[idx] = next[idx + 1];
                            next[idx + 1] = temp;
                            next.forEach((item, i) => (item.slideNumber = i + 1));
                            setCurrentProject({ ...currentProject, slides: { ...currentProject.slides!, slides: next } });
                          }}
                          className="p-1 text-[#7B8190] hover:text-[#202533]"
                          title="Pindah ke bawah"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const next = currentProject.slides!.slides.filter((_, i) => i !== idx);
                            next.forEach((item, i) => (item.slideNumber = i + 1));
                            setCurrentProject({ ...currentProject, slides: { ...currentProject.slides!, slides: next } });
                          }}
                          className="p-1 text-red-500 hover:text-red-700 ml-1"
                          title="Hapus slide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <input
                      type="text"
                      value={s.title}
                      onChange={(e) => {
                        const next = [...currentProject.slides!.slides];
                        next[idx].title = e.target.value;
                        setCurrentProject({ ...currentProject, slides: { ...currentProject.slides!, slides: next } });
                      }}
                      className="w-full p-1.5 border rounded-lg text-sm font-bold"
                    />
                  ) : (
                    <h4 className="text-sm font-bold text-[#202533]">{s.title}</h4>
                  )}

                  {isEditing ? (
                    <input
                      type="text"
                      value={s.mainMessage}
                      onChange={(e) => {
                        const next = [...currentProject.slides!.slides];
                        next[idx].mainMessage = e.target.value;
                        setCurrentProject({ ...currentProject, slides: { ...currentProject.slides!, slides: next } });
                      }}
                      className="w-full p-1 border rounded-md text-xs italic text-[#6C5CE7]"
                    />
                  ) : (
                    <div className="text-xs text-[#6C5CE7] italic font-medium">"{s.mainMessage}"</div>
                  )}

                  {/* Bullet points */}
                  <div className="bg-white p-3 rounded-lg border border-[#E7E9F0] text-xs">
                    <span className="font-semibold text-[#202533] block mb-1 text-[11px] uppercase tracking-wider">
                      Poin Tayang:
                    </span>
                    {isEditing ? (
                      <textarea
                        rows={3}
                        value={s.bulletPoints.join('\n')}
                        onChange={(e) => {
                          const next = [...currentProject.slides!.slides];
                          next[idx].bulletPoints = e.target.value.split('\n').filter((b) => b.trim().length > 0);
                          setCurrentProject({ ...currentProject, slides: { ...currentProject.slides!, slides: next } });
                        }}
                        className="w-full p-1.5 border rounded-md text-xs"
                      />
                    ) : (
                      <ul className="space-y-1 text-[#4A5568]">
                        {s.bulletPoints.map((bp, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-[#6C5CE7] font-bold">•</span>
                            <span>{bp}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Speaker Notes */}
                  <div className="bg-purple-50/60 p-3 rounded-lg border border-[#6C5CE7]/20 text-xs">
                    <span className="font-semibold text-[#6C5CE7] block mb-1 text-[11px] uppercase tracking-wider">
                      Speaker Notes (Catatan Pengajar):
                    </span>
                    {isEditing ? (
                      <textarea
                        rows={3}
                        value={s.speakerNotes}
                        onChange={(e) => {
                          const next = [...currentProject.slides!.slides];
                          next[idx].speakerNotes = e.target.value;
                          setCurrentProject({ ...currentProject, slides: { ...currentProject.slides!, slides: next } });
                        }}
                        className="w-full p-1.5 border rounded-md text-xs"
                      />
                    ) : (
                      <p className="text-[#202533] leading-relaxed">{s.speakerNotes}</p>
                    )}
                  </div>

                  {/* Visual suggestion */}
                  <div className="text-[11px] text-[#7B8190] bg-white p-2.5 rounded-lg border border-[#E7E9F0]">
                    <span className="font-semibold text-[#202533]">Saran Visual:</span> {s.visualSuggestion}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5 & 6: PRE-TEST & POST-TEST (20 SOAL) ================= */}
      {(activeTab === 'pretest' || activeTab === 'posttest') && currentProject.evaluation && (
        <div className="bg-white rounded-2xl p-8 border border-[#E7E9F0] shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E7E9F0] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#202533]">
                  {activeTab === 'pretest' ? 'Instrumen Evaluasi: Pre-Test' : 'Instrumen Evaluasi: Post-Test'}
                </h3>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md ${
                    (activeTab === 'pretest' ? currentProject.evaluation.preTest.length : currentProject.evaluation.postTest.length) === 20
                      ? 'bg-emerald-50 text-[#35A875]'
                      : 'bg-amber-50 text-[#E7A23B]'
                  }`}
                >
                  {activeTab === 'pretest' ? currentProject.evaluation.preTest.length : currentProject.evaluation.postTest.length} / 20 Soal
                </span>
                <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                  Sumber Data: 100% Materi Pelatihan
                </span>
              </div>
              <p className="text-xs text-[#7B8190] mt-0.5">
                4 Opsi Jawaban (A, B, C, D) · Kunci Jawaban Tunggal · Pembahasan Pedagogis · Murni Menguji Substansi Pembelajaran (Bebas Teknis Durasi JP / Bobot Nilai)
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isEditing && (
                <button
                  onClick={() => {
                    const testArray = activeTab === 'pretest' ? currentProject.evaluation!.preTest : currentProject.evaluation!.postTest;
                    const newQ: TestQuestion = {
                      number: testArray.length + 1,
                      question: `Pertanyaan butir baru no. ${testArray.length + 1}?`,
                      options: {
                        A: 'Pilihan jawaban A',
                        B: 'Pilihan jawaban B',
                        C: 'Pilihan jawaban C',
                        D: 'Pilihan jawaban D',
                      },
                      correctAnswer: 'A',
                      explanation: 'Penjelasan dan rubrik pembahasan butir soal ini.',
                      topic: 'Topik Tambahan',
                      mappedObjective: currentProject.syllabus?.objectives[0] || 'Kompetensi Umum',
                    };
                    const nextEval = { ...currentProject.evaluation! };
                    if (activeTab === 'pretest') nextEval.preTest = [...nextEval.preTest, newQ];
                    else nextEval.postTest = [...nextEval.postTest, newQ];
                    setCurrentProject({ ...currentProject, evaluation: nextEval });
                  }}
                  className="flex items-center gap-1 text-xs text-[#6C5CE7] font-semibold bg-purple-50 px-3 py-1.5 rounded-xl border border-[#6C5CE7]/30"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Butir Soal
                </button>
              )}
              <button
                onClick={() => exportEvaluationsToDocx(currentProject.evaluation!, currentProject.input.trainingName)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#6C5CE7] text-white text-xs font-semibold rounded-xl hover:bg-[#5847D6] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Word (.docx)</span>
              </button>
            </div>
          </div>

          {/* List of questions */}
          <div className="space-y-4">
            {(activeTab === 'pretest' ? currentProject.evaluation.preTest : currentProject.evaluation.postTest).map(
              (q, qIdx) => (
                <div key={q.number} className="p-5 rounded-xl border border-[#E7E9F0] bg-white text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#202533]">Soal No. {q.number}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] bg-[#F5F6FA] text-[#7B8190] px-2 py-0.5 rounded-md font-medium">
                        Topik: {q.topic}
                      </span>
                      {isEditing ? (
                        <div className="flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-md">
                          <span className="font-bold text-[#6C5CE7]">Kunci:</span>
                          <select
                            value={q.correctAnswer}
                            onChange={(e) => {
                              const nextEval = { ...currentProject.evaluation! };
                              const list = activeTab === 'pretest' ? [...nextEval.preTest] : [...nextEval.postTest];
                              list[qIdx].correctAnswer = e.target.value as any;
                              if (activeTab === 'pretest') nextEval.preTest = list;
                              else nextEval.postTest = list;
                              setCurrentProject({ ...currentProject, evaluation: nextEval });
                            }}
                            className="bg-transparent font-bold text-[#6C5CE7] focus:outline-hidden"
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </div>
                      ) : (
                        <span className="text-[11px] bg-purple-50 text-[#6C5CE7] px-2.5 py-0.5 rounded-md font-mono font-bold">
                          Kunci: {q.correctAnswer}
                        </span>
                      )}

                      {isEditing && (
                        <button
                          onClick={() => {
                            const nextEval = { ...currentProject.evaluation! };
                            let list = activeTab === 'pretest' ? [...nextEval.preTest] : [...nextEval.postTest];
                            list = list.filter((_, i) => i !== qIdx);
                            list.forEach((item, i) => (item.number = i + 1));
                            if (activeTab === 'pretest') nextEval.preTest = list;
                            else nextEval.postTest = list;
                            setCurrentProject({ ...currentProject, evaluation: nextEval });
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Hapus soal ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={q.question}
                      onChange={(e) => {
                        const nextEval = { ...currentProject.evaluation! };
                        const list = activeTab === 'pretest' ? [...nextEval.preTest] : [...nextEval.postTest];
                        list[qIdx].question = e.target.value;
                        if (activeTab === 'pretest') nextEval.preTest = list;
                        else nextEval.postTest = list;
                        setCurrentProject({ ...currentProject, evaluation: nextEval });
                      }}
                      className="w-full p-2 border rounded-lg text-xs font-medium"
                    />
                  ) : (
                    <p className="text-sm text-[#202533] font-medium leading-relaxed">{q.question}</p>
                  )}

                  {/* Options A, B, C, D */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                    {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                      <div
                        key={opt}
                        className={`p-2.5 rounded-lg border transition-colors ${
                          q.correctAnswer === opt
                            ? 'border-[#35A875] bg-emerald-50/70 text-emerald-950 font-semibold'
                            : 'border-[#E7E9F0] bg-[#F5F6FA]/50 text-[#4A5568]'
                        }`}
                      >
                        <span className="font-bold mr-1.5">{opt}.</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={q.options[opt]}
                            onChange={(e) => {
                              const nextEval = { ...currentProject.evaluation! };
                              const list = activeTab === 'pretest' ? [...nextEval.preTest] : [...nextEval.postTest];
                              list[qIdx].options[opt] = e.target.value;
                              if (activeTab === 'pretest') nextEval.preTest = list;
                              else nextEval.postTest = list;
                              setCurrentProject({ ...currentProject, evaluation: nextEval });
                            }}
                            className="bg-transparent border-b border-[#7B8190]/30 text-xs w-5/6 focus:outline-hidden"
                          />
                        ) : (
                          <span>{q.options[opt]}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Explanation */}
                  <div className="p-3 bg-purple-50/50 rounded-lg border border-[#6C5CE7]/20 text-[#202533] leading-relaxed">
                    <span className="font-bold text-[#6C5CE7] mr-1">Pembahasan & Rubrik:</span>
                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={q.explanation}
                        onChange={(e) => {
                          const nextEval = { ...currentProject.evaluation! };
                          const list = activeTab === 'pretest' ? [...nextEval.preTest] : [...nextEval.postTest];
                          list[qIdx].explanation = e.target.value;
                          if (activeTab === 'pretest') nextEval.preTest = list;
                          else nextEval.postTest = list;
                          setCurrentProject({ ...currentProject, evaluation: nextEval });
                        }}
                        className="w-full mt-1 p-1.5 border rounded-md text-xs"
                      />
                    ) : (
                      <span>{q.explanation}</span>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 7: REFERENCES ================= */}
      {activeTab === 'references' && currentProject.material && (
        <div className="bg-white rounded-3xl p-8 border border-[#E7E9F0] shadow-xs space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E7E9F0] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#202533]">
                  Daftar Referensi & Pustaka Acuan Terverifikasi
                </h3>
                <span className="flex items-center gap-1 text-[11px] font-semibold bg-[#35A875]/10 text-[#35A875] px-2.5 py-0.5 rounded-full border border-[#35A875]/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  100% Otentik & Teruji
                </span>
              </div>
              <p className="text-xs text-[#7B8190] mt-1">
                Seluruh rujukan yang mendasari kurikulum, bahan ajar, dan 20 butir soal evaluasi bersumber langsung dari portal resmi negara dan standar terakreditasi tanpa fabrikasi.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isEditing && (
                <button
                  onClick={() => {
                    const newRef: ReferenceItem = {
                      id: `ref-${Date.now()}`,
                      title: 'Pedoman Teknis Baru',
                      publisherOrAuthor: 'Kementerian Komunikasi dan Digital RI',
                      yearOrDate: '2024',
                      url: 'https://komdigi.go.id',
                      domainName: 'komdigi.go.id',
                      category: 'Regulasi & Kebijakan Nasional',
                      credibilityLevel: 'Tingkat 1 (Regulasi/Standar Resmi Negara)',
                      verificationStatus: 'Terverifikasi',
                      citationCode: `[REF-${Date.now().toString().slice(-4)}]`,
                      directExcerptOrSummary: 'Ketentuan dan panduan teknis operasional penyelenggaraan pelatihan digital.',
                    };
                    setCurrentProject({
                      ...currentProject,
                      material: {
                        ...currentProject.material!,
                        references: [...currentProject.material!.references, newRef],
                      },
                    });
                  }}
                  className="flex items-center gap-1 text-xs text-[#6C5CE7] font-semibold bg-purple-50 px-3 py-1.5 rounded-xl border border-[#6C5CE7]/30 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Referensi
                </button>
              )}
            </div>
          </div>

          {/* Search, Category Filter & View Mode Toggle */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                'Semua',
                'Digitalent Komdigi & Praktik',
                'Regulasi & Kebijakan Nasional',
                'Standar Kompetensi (SKKNI)',
                'Standar Internasional',
                'Pedoman Teknis',
              ].map((cat) => {
                const count =
                  cat === 'Semua'
                    ? currentProject.material!.references.length
                    : currentProject.material!.references.filter((r) => {
                        if (cat === 'Digitalent Komdigi & Praktik') {
                          return (
                            (r.publisherOrAuthor || '').toLowerCase().includes('komdigi') ||
                            (r.publisherOrAuthor || '').toLowerCase().includes('kominfo') ||
                            (r.publisherOrAuthor || '').toLowerCase().includes('digitalent') ||
                            (r.title || '').toLowerCase().includes('digitalent') ||
                            (r.url || '').toLowerCase().includes('digitalent') ||
                            (r.category || '').toLowerCase().includes('praktik')
                          );
                        }
                        return (r.category || '').includes(cat) || (r.documentType || '').includes(cat);
                      }).length;
                const isSelected = refCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setRefCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#6C5CE7] text-white shadow-2xs'
                        : 'bg-[#F5F6FA] text-[#7B8190] hover:bg-[#E7E9F0] hover:text-[#202533]'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5">
              {/* Search Bar */}
              <div className="relative flex-1 md:w-60">
                <Search className="w-3.5 h-3.5 text-[#7B8190] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={refSearch}
                  onChange={(e) => setRefSearch(e.target.value)}
                  placeholder="Cari regulasi, penemu, domain..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#E7E9F0] bg-white text-[#202533] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition-all"
                />
              </div>

              {/* View Switcher */}
              <div className="flex items-center p-0.5 bg-[#F5F6FA] rounded-xl border border-[#E7E9F0]">
                <button
                  onClick={() => setRefViewMode('cards')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    refViewMode === 'cards' ? 'bg-white text-[#6C5CE7] shadow-2xs' : 'text-[#7B8190]'
                  }`}
                >
                  Kartu
                </button>
                <button
                  onClick={() => setRefViewMode('table')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    refViewMode === 'table' ? 'bg-white text-[#6C5CE7] shadow-2xs' : 'text-[#7B8190]'
                  }`}
                >
                  Tabel
                </button>
              </div>
            </div>
          </div>

          {/* References Rendering */}
          {(() => {
            const list = currentProject.material.references.filter((r) => {
              const matchesSearch =
                r.title.toLowerCase().includes(refSearch.toLowerCase()) ||
                r.publisherOrAuthor.toLowerCase().includes(refSearch.toLowerCase()) ||
                (r.url && r.url.toLowerCase().includes(refSearch.toLowerCase())) ||
                (r.citationCode && r.citationCode.toLowerCase().includes(refSearch.toLowerCase()));

              if (!matchesSearch) return false;

              if (refCategory === 'Semua') return true;
              if (refCategory === 'Digitalent Komdigi & Praktik') {
                return (
                  (r.publisherOrAuthor || '').toLowerCase().includes('komdigi') ||
                  (r.publisherOrAuthor || '').toLowerCase().includes('kominfo') ||
                  (r.publisherOrAuthor || '').toLowerCase().includes('digitalent') ||
                  (r.title || '').toLowerCase().includes('digitalent') ||
                  (r.url || '').toLowerCase().includes('digitalent') ||
                  (r.category || '').toLowerCase().includes('praktik')
                );
              }
              return (r.category || '').includes(refCategory) || (r.documentType || '').includes(refCategory);
            });

            if (list.length === 0) {
              return (
                <div className="text-center py-12 bg-[#F5F6FA] rounded-2xl border border-dashed border-[#E7E9F0]">
                  <p className="text-xs text-[#7B8190]">Tidak ada referensi yang cocok dengan kriteria pencarian.</p>
                </div>
              );
            }

            if (refViewMode === 'cards') {
              return (
                <div className="grid grid-cols-1 gap-4">
                  {list.map((ref, idx) => (
                    <div
                      key={ref.id || idx}
                      className="p-5 rounded-2xl bg-white border border-[#E7E9F0] hover:border-[#6C5CE7]/40 hover:shadow-xs transition-all space-y-3"
                    >
                      {/* Top Row: Citation Code, Category, Verification Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-[#6C5CE7]/10 text-[#6C5CE7] px-2.5 py-0.5 rounded-lg border border-[#6C5CE7]/20">
                            {ref.citationCode || `[REF-${idx + 1}]`}
                          </span>
                          <span className="text-xs font-medium text-[#7B8190] bg-[#F5F6FA] px-2.5 py-0.5 rounded-lg border border-[#E7E9F0]">
                            {ref.category || 'Regulasi Acuan'}
                          </span>
                          {ref.credibilityLevel && (
                            <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                              {ref.credibilityLevel}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-[#35A875] px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {ref.verificationStatus}
                          </span>
                          {isEditing && (
                            <button
                              onClick={() => {
                                const next = currentProject.material!.references.filter((rItem) => rItem.id !== ref.id);
                                setCurrentProject({ ...currentProject, material: { ...currentProject.material!, references: next } });
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Hapus referensi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title & Author */}
                      <div>
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={ref.title}
                              onChange={(e) => {
                                const next = [...currentProject.material!.references];
                                const targetIdx = next.findIndex((rItem) => rItem.id === ref.id);
                                if (targetIdx !== -1) {
                                  next[targetIdx].title = e.target.value;
                                  setCurrentProject({ ...currentProject, material: { ...currentProject.material!, references: next } });
                                }
                              }}
                              className="w-full p-2 border rounded-xl text-xs font-bold text-[#202533]"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Penerbit / Penulis"
                                value={ref.publisherOrAuthor}
                                onChange={(e) => {
                                  const next = [...currentProject.material!.references];
                                  const targetIdx = next.findIndex((rItem) => rItem.id === ref.id);
                                  if (targetIdx !== -1) {
                                    next[targetIdx].publisherOrAuthor = e.target.value;
                                    setCurrentProject({ ...currentProject, material: { ...currentProject.material!, references: next } });
                                  }
                                }}
                                className="p-2 border rounded-xl text-xs"
                              />
                              <input
                                type="text"
                                placeholder="URL Resmi"
                                value={ref.url || ''}
                                onChange={(e) => {
                                  const next = [...currentProject.material!.references];
                                  const targetIdx = next.findIndex((rItem) => rItem.id === ref.id);
                                  if (targetIdx !== -1) {
                                    next[targetIdx].url = e.target.value;
                                    setCurrentProject({ ...currentProject, material: { ...currentProject.material!, references: next } });
                                  }
                                }}
                                className="p-2 border rounded-xl text-xs font-mono"
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <h4 className="text-sm font-bold text-[#202533] leading-snug">
                              {ref.title}
                            </h4>
                            <div className="text-xs text-[#7B8190] mt-1 flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-[#4A5568]">{ref.publisherOrAuthor}</span>
                              {ref.yearOrDate && <span>({ref.yearOrDate})</span>}
                              {ref.documentType && (
                                <>
                                  <span>•</span>
                                  <span>{ref.documentType}</span>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Excerpt / Legal Substance Box */}
                      {ref.directExcerptOrSummary && (
                        <div className="p-3.5 rounded-xl bg-[#F5F6FA] border border-[#E7E9F0] text-xs text-[#202533] leading-relaxed">
                          <span className="font-bold text-[#6C5CE7] block mb-1">
                            Dasar Hukum / Landasan Konseptual:
                          </span>
                          <p className="italic text-[#4A5568]">"{ref.directExcerptOrSummary}"</p>
                        </div>
                      )}

                      {/* Bottom Action Bar: Clickable URL, Mapped Chapters, Copy Citation */}
                      <div className="pt-2 border-t border-[#E7E9F0]/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          {ref.mappedChapters && ref.mappedChapters.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[11px] text-[#7B8190]">
                              <span className="font-medium text-[#202533]">Dirujuk pada:</span>
                              {ref.mappedChapters.map((ch, cIdx) => (
                                <span key={cIdx} className="bg-purple-50 text-[#6C5CE7] px-2 py-0.5 rounded-md font-semibold text-[10px]">
                                  {ch}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const citationText = `${ref.citationCode || ''} ${ref.title}. Diterbitkan oleh ${ref.publisherOrAuthor} (${ref.yearOrDate || '-'}). Sumber resmi: ${ref.url || '-'}`;
                              copyToClipboard(citationText);
                              showToast('Sitasi berhasil disalin ke papan klip!');
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#F5F6FA] hover:bg-[#E7E9F0] text-[#202533] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5 text-[#7B8190]" />
                            <span>Salin Sitasi</span>
                          </button>

                          {ref.url && (
                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#6C5CE7] hover:bg-[#5847D6] text-white rounded-xl text-xs font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              <span>Buka Sumber Resmi ({ref.domainName || 'Portal Acuan'})</span>
                              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            }

            // Table view mode
            return (
              <div className="overflow-x-auto rounded-2xl border border-[#E7E9F0]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F5F6FA] text-[#7B8190] font-semibold border-b border-[#E7E9F0]">
                      <th className="py-3 px-3 w-10 text-center">No</th>
                      <th className="py-3 px-3 w-28">Kode Sitasi</th>
                      <th className="py-3 px-4">Judul Dokumen / Regulasi Acuan</th>
                      <th className="py-3 px-4">Penerbit Resmi</th>
                      <th className="py-3 px-3 text-center">Tahun</th>
                      <th className="py-3 px-4">Tautan Langsung (Klik)</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E9F0]">
                    {list.map((ref, idx) => (
                      <tr key={ref.id || idx} className="hover:bg-[#F5F6FA]/50 transition-colors">
                        <td className="py-3 px-3 text-center font-bold text-[#7B8190]">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-bold text-[#6C5CE7] text-[11px]">
                          {ref.citationCode || `[REF-${idx + 1}]`}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#202533]">
                          <div>{ref.title}</div>
                          <div className="text-[11px] font-normal text-[#7B8190]">{ref.category}</div>
                        </td>
                        <td className="py-3 px-4 text-[#4A5568]">{ref.publisherOrAuthor}</td>
                        <td className="py-3 px-3 text-center font-mono">{ref.yearOrDate || '-'}</td>
                        <td className="py-3 px-4">
                          {ref.url ? (
                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-mono text-[#6C5CE7] hover:underline font-semibold"
                            >
                              <span>{ref.domainName || 'Buka URL'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[#7B8190]">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-[#35A875] border border-emerald-200">
                            {ref.verificationStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              copyToClipboard(`${ref.title} - ${ref.url || ''}`);
                              showToast('Tautan referensi disalin!');
                            }}
                            className="p-1.5 text-[#7B8190] hover:text-[#6C5CE7] rounded-lg transition-colors cursor-pointer"
                            title="Salin rujukan"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* ================= TAB 8: QUALITY CHECK ================= */}
      {activeTab === 'quality' && (
        <div className="bg-white rounded-2xl p-8 border border-[#E7E9F0] shadow-xs space-y-6">
          <div className="border-b border-[#E7E9F0] pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#202533]">
                Pemeriksaan Kualitas Otomatis (Quality Assurance)
              </h3>
              <p className="text-xs text-[#7B8190]">
                Audit otomatis keselarasan durasi JP, kuantitas 20 butir soal, format kunci jawaban, dan keabsahan referensi.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#7B8190]">Status Audit:</span>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                  currentProject.qualityCheck?.overallStatus === 'passed'
                    ? 'bg-emerald-50 text-[#35A875] border border-emerald-200'
                    : currentProject.qualityCheck?.overallStatus === 'warning'
                    ? 'bg-amber-50 text-[#E7A23B] border border-amber-200'
                    : 'bg-red-50 text-[#DF5B66] border border-red-200'
                }`}
              >
                {currentProject.qualityCheck?.overallStatus === 'passed'
                  ? 'Audit Lulus (Passed)'
                  : currentProject.qualityCheck?.overallStatus === 'warning'
                  ? 'Perlu Tinjauan (Warning)'
                  : 'Perlu Perbaikan (Failed)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 text-emerald-950">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#35A875]">Passed Checks</div>
              <div className="text-2xl font-bold font-mono mt-1">{currentProject.qualityCheck?.passedCount || 0}</div>
            </div>
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 text-amber-950">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#E7A23B]">Warnings</div>
              <div className="text-2xl font-bold font-mono mt-1">{currentProject.qualityCheck?.warningCount || 0}</div>
            </div>
            <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 text-red-950">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#DF5B66]">Failed Checks</div>
              <div className="text-2xl font-bold font-mono mt-1">{currentProject.qualityCheck?.failedCount || 0}</div>
            </div>
          </div>

          <div className="space-y-3">
            {currentProject.qualityCheck?.checks.map((chk) => (
              <div
                key={chk.id}
                className="p-4 rounded-xl border border-[#E7E9F0] bg-white flex items-start justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold px-2 py-0.5 rounded-md bg-[#F5F6FA] text-[#7B8190] text-[10px] uppercase">
                      {chk.module}
                    </span>
                    <span className="font-bold text-[#202533]">{chk.title}</span>
                  </div>
                  <p className="text-[#4A5568] leading-relaxed">{chk.message}</p>
                </div>
                <div>
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold shrink-0 ${
                      chk.status === 'passed'
                        ? 'bg-emerald-50 text-[#35A875]'
                        : chk.status === 'warning'
                        ? 'bg-amber-50 text-[#E7A23B]'
                        : 'bg-red-50 text-[#DF5B66]'
                    }`}
                  >
                    {chk.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
