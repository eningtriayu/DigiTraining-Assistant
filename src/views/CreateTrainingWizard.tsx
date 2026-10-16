/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Layers,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RotateCcw,
  BookOpen,
  UploadCloud,
  CheckSquare,
} from 'lucide-react';
import { TrainingInput, DeliveryMethod, ParticipantLevel } from '../types';
import { MINUTES_PER_JP, jpToMinutes } from '../utils/jpValidator';
import { STANDARD_TEMPLATES, getKomdigiPreset, getEmptyTrainingInput } from '../data/mockTemplates';

interface CreateTrainingWizardProps {
  onGenerate: (input: TrainingInput) => Promise<void>;
  onCancel: () => void;
  isGenerating: boolean;
}

export const CreateTrainingWizard: React.FC<CreateTrainingWizardProps> = ({
  onGenerate,
  onCancel,
  isGenerating,
}) => {
  const [step, setStep] = useState<number>(1);
  const [input, setInput] = useState<TrainingInput>(getEmptyTrainingInput());
  const [validationError, setValidationError] = useState<string | null>(null);

  // Calculate sum of daily JP allocations
  const currentDailySum = input.dailyJPAllocation.reduce((acc, curr) => acc + (Number(curr.allocatedJP) || 0), 0);
  const jpDifference = currentDailySum - input.totalJP;
  const isJpAllocationValid = jpDifference === 0;

  // Handler to adjust training days count
  const handleDaysChange = (newDays: number) => {
    const days = Math.max(1, Math.min(14, newDays));
    const currentAlloc = [...input.dailyJPAllocation];

    if (days > currentAlloc.length) {
      for (let i = currentAlloc.length + 1; i <= days; i++) {
        currentAlloc.push({
          dayNumber: i,
          allocatedJP: 6,
          startTime: '08:00',
          endTime: '16:00',
          breakTimes: [
            { startTime: '10:15', endTime: '10:30', label: 'Break Pagi' },
            { startTime: '12:00', endTime: '13:00', label: 'Ishoma Siang' },
          ],
        });
      }
    } else {
      currentAlloc.splice(days);
    }

    setInput({
      ...input,
      trainingDays: days,
      dailyJPAllocation: currentAlloc,
    });
  };

  // Helper to auto-distribute total JP across days evenly
  const distributeJpEvenly = () => {
    const days = input.trainingDays;
    const base = Math.floor(input.totalJP / days);
    const rem = input.totalJP % days;

    const newAlloc = input.dailyJPAllocation.map((alloc, idx) => ({
      ...alloc,
      allocatedJP: base + (idx < rem ? 1 : 0),
    }));

    setInput({
      ...input,
      dailyJPAllocation: newAlloc,
    });
  };

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    if (!input.trainingName.trim()) {
      setValidationError('Nama Pelatihan wajib diisi.');
      return false;
    }
    if (!input.targetAudience.trim()) {
      setValidationError('Sasaran Peserta wajib diisi.');
      return false;
    }
    setValidationError(null);
    return true;
  };

  // Step 2 Validation
  const validateStep2 = (): boolean => {
    if (input.totalJP <= 0) {
      setValidationError('Total durasi pelatihan minimal 1 JP.');
      return false;
    }
    if (!isJpAllocationValid) {
      setValidationError(
        `Alokasi JP per hari (${currentDailySum} JP) belum cocok dengan total durasi program (${input.totalJP} JP). Selisih: ${Math.abs(jpDifference)} JP.`
      );
      return false;
    }
    setValidationError(null);
    return true;
  };

  // Step 4 Validation
  const validateStep4 = (): boolean => {
    const { syllabus, rundown, fullMaterial, slideMaterial, evaluations } = input.selectedOutputs;
    if (!syllabus && !rundown && !fullMaterial && !slideMaterial && !evaluations) {
      setValidationError('Pilih minimal satu jenis perangkat pelatihan untuk dihasilkan.');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 4 && !validateStep4()) return;
    setValidationError(null);
    setStep((prev) => Math.min(5, prev + 1));
  };

  const prevStep = () => {
    setValidationError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleLoadKomdigiPreset = () => {
    setInput(getKomdigiPreset());
    setValidationError(null);
  };

  const handleResetForm = () => {
    setInput(getEmptyTrainingInput());
    setValidationError(null);
  };

  const handleFinalSubmit = async () => {
    if (!validateStep1() || !validateStep2() || !validateStep4()) return;
    await onGenerate(input);
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Wizard Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#202533]">Buat Pelatihan Baru</h2>
          <p className="text-xs text-[#7B8190]">
            Isi parameter pelatihan untuk menghasilkan Silabus, Rundown, Materi, Slide, dan Evaluasi 20 Soal.
          </p>
        </div>

        {/* Action to load preset or reset */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadKomdigiPreset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#6C5CE7] text-xs font-semibold rounded-lg border border-[#6C5CE7]/30 transition-colors cursor-pointer"
            title="Muat contoh format pelatihan resmi 22 JP Komdigi"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Muat Contoh Format Komdigi</span>
          </button>
          <button
            type="button"
            onClick={handleResetForm}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-[#7B8190] text-xs font-medium rounded-lg border border-[#E7E9F0] transition-colors cursor-pointer"
            title="Kosongkan form"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Progress Steps Indicator */}
      <div className="bg-white rounded-2xl p-4 border border-[#E7E9F0] mb-6 shadow-xs">
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { num: 1, label: 'Info Dasar' },
            { num: 2, label: 'Durasi & JP' },
            { num: 3, label: 'Referensi' },
            { num: 4, label: 'Pilihan Output' },
            { num: 5, label: 'Review & Buat' },
          ].map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-all ${
                    isCompleted
                      ? 'bg-[#35A875] text-white'
                      : isCurrent
                      ? 'bg-[#6C5CE7] text-white shadow-sm shadow-[#6C5CE7]/40 ring-4 ring-[#6C5CE7]/15'
                      : 'bg-[#F5F6FA] text-[#7B8190] border border-[#E7E9F0]'
                  }`}
                >
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-[11px] truncate w-full ${
                    isCurrent ? 'font-bold text-[#6C5CE7]' : 'text-[#7B8190]'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Validation Message Banner */}
      {validationError && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-medium">{validationError}</div>
        </div>
      )}

      {/* Wizard Form Cards */}
      <div className="bg-white rounded-2xl border border-[#E7E9F0] p-8 shadow-xs">
        {/* ================= STEP 1: INFORMASI DASAR (NO ACADEMY NAME!) ================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="border-b border-[#E7E9F0] pb-4">
              <h3 className="text-base font-bold text-[#202533]">
                Langkah 1: Informasi Dasar Pelatihan
              </h3>
              <p className="text-xs text-[#7B8190]">
                Masukkan judul program, sasaran peserta, dan tujuan kompetensi pembelajaran.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#202533] mb-1.5">
                  Nama Pelatihan <span className="text-[#DF5B66]">*</span>
                </label>
                <input
                  type="text"
                  value={input.trainingName}
                  onChange={(e) => setInput({ ...input, trainingName: e.target.value })}
                  placeholder="Contoh: Artificial Intelligence for Content Creation"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E7E9F0] text-sm text-[#202533] focus:outline-hidden focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202533] mb-1.5">
                  Deskripsi / Konteks Pelatihan
                </label>
                <textarea
                  rows={3}
                  value={input.description}
                  onChange={(e) => setInput({ ...input, description: e.target.value })}
                  placeholder="Jelaskan urgensi, latar belakang, dan hasil yang diharapkan dari pelatihan ini..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E7E9F0] text-sm text-[#202533] focus:outline-hidden focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#202533] mb-1.5">
                    Sasaran Peserta <span className="text-[#DF5B66]">*</span>
                  </label>
                  <input
                    type="text"
                    value={input.targetAudience}
                    onChange={(e) => setInput({ ...input, targetAudience: e.target.value })}
                    placeholder="Contoh: ASN / Pengelola media sosial instansi"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E7E9F0] text-sm text-[#202533] focus:outline-hidden focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202533] mb-1.5">
                    Tingkat Kemampuan Peserta
                  </label>
                  <select
                    value={input.participantLevel}
                    onChange={(e) => setInput({ ...input, participantLevel: e.target.value as ParticipantLevel })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E7E9F0] text-sm text-[#202533] bg-white focus:outline-hidden focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition-all cursor-pointer"
                  >
                    <option value="Pemula">Pemula (Dasar / Fondasional)</option>
                    <option value="Menengah">Menengah (Praktik Terapan)</option>
                    <option value="Lanjutan">Lanjutan (Spesialis / Mahir)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202533] mb-1.5">
                  Tujuan Pembelajaran (Per Sasaran Kompetensi)
                </label>
                <textarea
                  rows={4}
                  value={input.learningObjectives}
                  onChange={(e) => setInput({ ...input, learningObjectives: e.target.value })}
                  placeholder="1. Memahami konsep dasar Artificial Intelligence di dunia kreatif&#10;2. Menggunakan tools berbasis AI untuk pembuatan konten&#10;3. Menghasilkan konten kreatif dengan mematuhi etika komunikasi publik"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E7E9F0] text-sm text-[#202533] focus:outline-hidden focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition-all"
                />
                <span className="text-[11px] text-[#7B8190] mt-1 block">
                  Tuliskan tujuan bernomor (1, 2, 3) yang akan menjadi rujukan utama modul dan soal evaluasi.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202533] mb-1.5">
                  Estimasi Jumlah Peserta (Opsional)
                </label>
                <input
                  type="number"
                  min={1}
                  value={input.participantCount || ''}
                  onChange={(e) => setInput({ ...input, participantCount: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                  placeholder="Contoh: 30"
                  className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-[#E7E9F0] text-sm text-[#202533] focus:outline-hidden focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: DURASI & VALIDASI JADWAL JP ================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="border-b border-[#E7E9F0] pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#202533]">
                  Langkah 2: Durasi & Validasi Jadwal Jam Pelatihan (JP)
                </h3>
                <p className="text-xs text-[#7B8190]">
                  Ketentuan wajib: <strong className="text-[#6C5CE7]">1 JP = 45 menit</strong>. Waktu istirahat (Ishoma/Break) tidak dihitung sebagai JP pembelajaran.
                </p>
              </div>

              <div className="bg-purple-50 text-[#6C5CE7] px-3 py-1.5 rounded-xl text-xs font-mono font-semibold">
                1 JP = 45 Menit
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#202533] mb-1.5">
                  Metode Pelaksanaan <span className="text-[#DF5B66]">*</span>
                </label>
                <select
                  value={input.deliveryMethod}
                  onChange={(e) => setInput({ ...input, deliveryMethod: e.target.value as DeliveryMethod })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E7E9F0] text-sm text-[#202533] bg-white focus:outline-hidden focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition-all cursor-pointer"
                >
                  <option value="Offline">Offline (Tatap Muka di Kelas)</option>
                  <option value="Online">Online (Daring / Live Session + LMS)</option>
                  <option value="Hybrid">Hybrid (Kombinasi Tatap Muka & Daring)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202533] mb-1.5">
                  Total Durasi Pelatihan (JP) <span className="text-[#DF5B66]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    value={input.totalJP}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setInput({ ...input, totalJP: val });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E7E9F0] text-sm text-[#202533] focus:outline-hidden focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition-all font-mono"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-[#7B8190] font-semibold">
                    JP ({jpToMinutes(input.totalJP)} mnt)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202533] mb-1.5">
                  Jumlah Hari Pelatihan <span className="text-[#DF5B66]">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={input.trainingDays}
                  onChange={(e) => handleDaysChange(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E7E9F0] text-sm text-[#202533] focus:outline-hidden focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition-all font-mono"
                />
              </div>
            </div>

            {/* Programmatic Schedule Allocation Table */}
            <div className="p-5 bg-[#F5F6FA] rounded-2xl border border-[#E7E9F0]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-xs font-bold text-[#202533] uppercase tracking-wider">
                    Konfigurasi Alokasi JP Per Hari
                  </h4>
                  <p className="text-[11px] text-[#7B8190]">
                    Atur JP harian agar jumlah totalnya tepat sama dengan durasi program.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={distributeJpEvenly}
                  className="text-xs font-semibold text-[#6C5CE7] hover:text-[#5847D6] bg-white px-3 py-1.5 rounded-lg border border-[#E7E9F0] transition-colors cursor-pointer"
                >
                  Distribusi JP Merata
                </button>
              </div>

              <div className="space-y-3">
                {input.dailyJPAllocation.map((alloc, idx) => (
                  <div
                    key={alloc.dayNumber}
                    className="p-3 bg-white rounded-xl border border-[#E7E9F0] flex flex-wrap items-center justify-between gap-4 text-xs"
                  >
                    <div className="font-bold text-[#202533] w-20">
                      Hari {alloc.dayNumber}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[#7B8190]">Alokasi:</span>
                      <input
                        type="number"
                        min={1}
                        value={alloc.allocatedJP}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          const nextAlloc = [...input.dailyJPAllocation];
                          nextAlloc[idx].allocatedJP = val;
                          setInput({ ...input, dailyJPAllocation: nextAlloc });
                        }}
                        className="w-16 px-2.5 py-1 rounded-lg border border-[#E7E9F0] text-center font-mono font-bold text-[#6C5CE7]"
                      />
                      <span className="font-semibold text-[#202533]">JP</span>
                      <span className="text-[#7B8190] font-mono text-[11px]">
                        ({jpToMinutes(alloc.allocatedJP)} menit)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[#7B8190]">Jam:</span>
                      <input
                        type="text"
                        value={alloc.startTime}
                        onChange={(e) => {
                          const nextAlloc = [...input.dailyJPAllocation];
                          nextAlloc[idx].startTime = e.target.value;
                          setInput({ ...input, dailyJPAllocation: nextAlloc });
                        }}
                        className="w-16 px-2 py-1 rounded-lg border border-[#E7E9F0] text-center font-mono text-xs"
                      />
                      <span>s/d</span>
                      <input
                        type="text"
                        value={alloc.endTime}
                        onChange={(e) => {
                          const nextAlloc = [...input.dailyJPAllocation];
                          nextAlloc[idx].endTime = e.target.value;
                          setInput({ ...input, dailyJPAllocation: nextAlloc });
                        }}
                        className="w-16 px-2 py-1 rounded-lg border border-[#E7E9F0] text-center font-mono text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Programmatic Validation Card */}
              <div
                className={`mt-4 p-4 rounded-xl border flex items-center justify-between ${
                  isJpAllocationValid
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isJpAllocationValid ? (
                    <CheckCircle className="w-5 h-5 text-[#35A875]" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-[#E7A23B]" />
                  )}
                  <div>
                    <div className="text-xs font-bold">
                      {isJpAllocationValid
                        ? 'Validasi Durasi JP Valid'
                        : `Terdapat Selisih Alokasi JP (${Math.abs(jpDifference)} JP)`}
                    </div>
                    <div className="text-[11px] opacity-90 mt-0.5">
                      {isJpAllocationValid
                        ? `Total alokasi harian (${currentDailySum} JP) cocok sempurna dengan target durasi program (${input.totalJP} JP).`
                        : `Total rundown adalah ${currentDailySum} JP, sedangkan durasi program ditetapkan ${input.totalJP} JP. Silakan sesuaikan alokasi harian.`}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono tabular-nums">
                  <div className="text-sm font-bold">
                    {currentDailySum} / {input.totalJP} JP
                  </div>
                  <div className="text-[10px] text-[#7B8190]">
                    {jpToMinutes(currentDailySum)} / {jpToMinutes(input.totalJP)} Menit
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: REFERENSI & TEMPLATE ================= */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="border-b border-[#E7E9F0] pb-4">
              <h3 className="text-base font-bold text-[#202533]">
                Langkah 3: Referensi & Format Template Acuan
              </h3>
              <p className="text-xs text-[#7B8190]">
                Pilih format baku resmi BLSDM Komdigi Surabaya atau unggah dokumen rujukan kurikulum.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202533] mb-2">
                Template Acuan Standar
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {STANDARD_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-3.5 rounded-xl border border-[#E7E9F0] bg-white hover:border-[#6C5CE7]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#202533]">{tpl.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#F5F6FA] text-[#7B8190] font-medium">
                        {tpl.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7B8190] line-clamp-2 mb-2">
                      {tpl.description}
                    </p>
                    <div className="text-[10px] text-[#6C5CE7] font-medium">
                      ✓ Aktif sebagai acuan struktur
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202533] mb-1.5">
                Catatan Regulasi / Bahan Rujukan Tambahan
              </label>
              <textarea
                rows={3}
                value={input.referenceText}
                onChange={(e) => setInput({ ...input, referenceText: e.target.value })}
                placeholder="Contoh: Surat Edaran Menkominfo RI No 9 Tahun 2023 tentang Etika AI, UU No 27 Tahun 2022 tentang PDP, dll."
                className="w-full px-4 py-2.5 rounded-xl border border-[#E7E9F0] text-sm text-[#202533] focus:outline-hidden focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition-all"
              />
              <span className="text-[11px] text-[#7B8190] mt-1 block">
                Sumber yang dicantumkan akan diprioritaskan oleh AI sebagai dasar materi dan butir evaluasi.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202533] mb-1.5">
                Unggah Berkas Acuan (Opsional: PDF, DOCX, TXT)
              </label>
              <div className="border-2 border-dashed border-[#E7E9F0] rounded-xl p-6 text-center hover:border-[#6C5CE7]/40 transition-colors bg-[#F5F6FA]/50">
                <UploadCloud className="w-8 h-8 text-[#7B8190] mx-auto mb-2" />
                <p className="text-xs text-[#202533] font-medium mb-1">
                  Pilih file dokumen acuan atau seret ke sini
                </p>
                <p className="text-[11px] text-[#7B8190] mb-3">
                  Mendukung PDF, DOCX, TXT hingga 10MB
                </p>
                <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E7E9F0] text-xs font-semibold text-[#202533] rounded-lg hover:bg-slate-50 cursor-pointer">
                  <span>Pilih Dokumen</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.txt,.doc"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setInput({
                          ...input,
                          referenceText: (input.referenceText ? input.referenceText + '\n' : '') + `[Dokumen Acuan Terlampir: ${file.name}]`,
                        });
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: PILIHAN OUTPUT ================= */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="border-b border-[#E7E9F0] pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#202533]">
                  Langkah 4: Pilihan Output Perangkat Pelatihan
                </h3>
                <p className="text-xs text-[#7B8190]">
                  Pilih modul perangkat yang ingin dihasilkan. Anda dapat memilih satu, beberapa, atau seluruhnya.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const allSelected = Object.values(input.selectedOutputs).every(Boolean);
                  setInput({
                    ...input,
                    selectedOutputs: {
                      syllabus: !allSelected,
                      rundown: !allSelected,
                      fullMaterial: !allSelected,
                      slideMaterial: !allSelected,
                      evaluations: !allSelected,
                    },
                  });
                }}
                className="text-xs font-semibold text-[#6C5CE7] hover:text-[#5847D6] bg-purple-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {Object.values(input.selectedOutputs).every(Boolean) ? 'Batalkan Semua' : 'Pilih Semua'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label
                className={`p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                  input.selectedOutputs.syllabus
                    ? 'border-[#6C5CE7] bg-purple-50/30'
                    : 'border-[#E7E9F0] bg-white hover:bg-[#F5F6FA]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={input.selectedOutputs.syllabus}
                  onChange={(e) =>
                    setInput({
                      ...input,
                      selectedOutputs: { ...input.selectedOutputs, syllabus: e.target.checked },
                    })
                  }
                  className="mt-1 w-4 h-4 text-[#6C5CE7] rounded-sm focus:ring-[#6C5CE7]"
                />
                <div>
                  <div className="text-sm font-bold text-[#202533] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#6C5CE7]" />
                    <span>Silabus Pelatihan</span>
                  </div>
                  <p className="text-xs text-[#7B8190] mt-1 leading-relaxed">
                    Identitas program, tujuan pembelajaran, kualifikasi peserta, sarana, kurikulum mata pelatihan, dan sistem evaluasi kelulusan.
                  </p>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                  input.selectedOutputs.rundown
                    ? 'border-[#6C5CE7] bg-purple-50/30'
                    : 'border-[#E7E9F0] bg-white hover:bg-[#F5F6FA]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={input.selectedOutputs.rundown}
                  onChange={(e) =>
                    setInput({
                      ...input,
                      selectedOutputs: { ...input.selectedOutputs, rundown: e.target.checked },
                    })
                  }
                  className="mt-1 w-4 h-4 text-[#6C5CE7] rounded-sm focus:ring-[#6C5CE7]"
                />
                <div>
                  <div className="text-sm font-bold text-[#202533] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#5847D6]" />
                    <span>Rundown Rencana Jadwal</span>
                  </div>
                  <p className="text-xs text-[#7B8190] mt-1 leading-relaxed">
                    Tabel rincian jadwal harian: jam, topik, aktivitas sinkronus/asinkronus, durasi sesi, dan jeda istirahat (Ishoma/Break).
                  </p>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                  input.selectedOutputs.fullMaterial
                    ? 'border-[#6C5CE7] bg-purple-50/30'
                    : 'border-[#E7E9F0] bg-white hover:bg-[#F5F6FA]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={input.selectedOutputs.fullMaterial}
                  onChange={(e) =>
                    setInput({
                      ...input,
                      selectedOutputs: { ...input.selectedOutputs, fullMaterial: e.target.checked },
                    })
                  }
                  className="mt-1 w-4 h-4 text-[#6C5CE7] rounded-sm focus:ring-[#6C5CE7]"
                />
                <div>
                  <div className="text-sm font-bold text-[#202533] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#35A875]" />
                    <span>Materi Pelatihan Lengkap</span>
                  </div>
                  <p className="text-xs text-[#7B8190] mt-1 leading-relaxed">
                    Dokumen materi utuh: konsep sistematis, contoh terapan instansi, langkah praktik teknis, studi kasus, dan daftar pustaka.
                  </p>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                  input.selectedOutputs.slideMaterial
                    ? 'border-[#6C5CE7] bg-purple-50/30'
                    : 'border-[#E7E9F0] bg-white hover:bg-[#F5F6FA]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={input.selectedOutputs.slideMaterial}
                  onChange={(e) =>
                    setInput({
                      ...input,
                      selectedOutputs: { ...input.selectedOutputs, slideMaterial: e.target.checked },
                    })
                  }
                  className="mt-1 w-4 h-4 text-[#6C5CE7] rounded-sm focus:ring-[#6C5CE7]"
                />
                <div>
                  <div className="text-sm font-bold text-[#202533] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#E7A23B]" />
                    <span>Materi Per Slide (Bahan Tayang)</span>
                  </div>
                  <p className="text-xs text-[#7B8190] mt-1 leading-relaxed">
                    Rancangan slide per slide: judul, pesan utama, poin tayang, catatan pengajar (speaker notes), saran visual, & pertanyaan diskusi.
                  </p>
                </div>
              </label>

              <label
                className={`md:col-span-2 p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                  input.selectedOutputs.evaluations
                    ? 'border-[#6C5CE7] bg-purple-50/30'
                    : 'border-[#E7E9F0] bg-white hover:bg-[#F5F6FA]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={input.selectedOutputs.evaluations}
                  onChange={(e) =>
                    setInput({
                      ...input,
                      selectedOutputs: { ...input.selectedOutputs, evaluations: e.target.checked },
                    })
                  }
                  className="mt-1 w-4 h-4 text-[#6C5CE7] rounded-sm focus:ring-[#6C5CE7]"
                />
                <div>
                  <div className="text-sm font-bold text-[#202533] flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-[#DF5B66]" />
                    <span>Instrumen Evaluasi (20 Soal Pre-Test & 20 Soal Post-Test)</span>
                  </div>
                  <p className="text-xs text-[#7B8190] mt-1 leading-relaxed">
                    Masing-masing tepat 20 butir soal pilihan ganda (A, B, C, D), kunci jawaban tunggal, rubrik pembahasan pedagogis, dan pemetaan ke tujuan pembelajaran.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ================= STEP 5: REVIEW & GENERATE ================= */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="border-b border-[#E7E9F0] pb-4">
              <h3 className="text-base font-bold text-[#202533]">
                Langkah 5: Tinjau Parameter & Generate Dokumen
              </h3>
              <p className="text-xs text-[#7B8190]">
                Pastikan data pelatihan dan validasi jadwal telah sesuai sebelum AI menyusun perangkat pelatihan.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[#F5F6FA] rounded-xl border border-[#E7E9F0]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[#7B8190] block">Nama Pelatihan:</span>
                    <span className="font-bold text-[#202533] text-sm">{input.trainingName}</span>
                  </div>
                  <div>
                    <span className="text-[#7B8190] block">Instansi Penyelenggara:</span>
                    <span className="font-semibold text-[#202533]">BLSDM Komdigi Surabaya</span>
                  </div>
                  <div>
                    <span className="text-[#7B8190] block">Sasaran & Tingkat:</span>
                    <span className="font-medium text-[#202533]">{input.targetAudience} ({input.participantLevel})</span>
                  </div>
                  <div>
                    <span className="text-[#7B8190] block">Metode & Durasi:</span>
                    <span className="font-medium text-[#202533]">{input.deliveryMethod} — {input.totalJP} JP ({input.trainingDays} Hari)</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#F5F6FA] rounded-xl border border-[#E7E9F0]">
                <span className="text-[#7B8190] block mb-2 font-semibold uppercase tracking-wider text-[10px]">
                  Output yang Akan Dihasilkan:
                </span>
                <div className="flex flex-wrap gap-2">
                  {input.selectedOutputs.syllabus && (
                    <span className="px-2.5 py-1 bg-white border border-[#E7E9F0] rounded-lg font-medium text-[#202533]">
                      ✓ Silabus Pelatihan
                    </span>
                  )}
                  {input.selectedOutputs.rundown && (
                    <span className="px-2.5 py-1 bg-white border border-[#E7E9F0] rounded-lg font-medium text-[#202533]">
                      ✓ Rundown Rencana Jadwal
                    </span>
                  )}
                  {input.selectedOutputs.fullMaterial && (
                    <span className="px-2.5 py-1 bg-white border border-[#E7E9F0] rounded-lg font-medium text-[#202533]">
                      ✓ Materi Pelatihan Lengkap
                    </span>
                  )}
                  {input.selectedOutputs.slideMaterial && (
                    <span className="px-2.5 py-1 bg-white border border-[#E7E9F0] rounded-lg font-medium text-[#202533]">
                      ✓ Materi Per Slide
                    </span>
                  )}
                  {input.selectedOutputs.evaluations && (
                    <span className="px-2.5 py-1 bg-white border border-[#E7E9F0] rounded-lg font-medium text-[#202533]">
                      ✓ Evaluasi 20 Pre-Test & 20 Post-Test
                    </span>
                  )}
                </div>
              </div>

              {/* Status Validasi Durasi */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  isJpAllocationValid
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isJpAllocationValid ? (
                    <CheckCircle className="w-4 h-4 text-[#35A875]" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-[#E7A23B]" />
                  )}
                  <span className="font-semibold">
                    {isJpAllocationValid
                      ? `Jadwal Konsisten: Tepat ${input.totalJP} JP (${jpToMinutes(input.totalJP)} menit)`
                      : `Perhatian: Selisih jadwal ${Math.abs(jpDifference)} JP`}
                  </span>
                </div>
                <span className="font-mono tabular-nums text-xs font-bold">
                  {currentDailySum} / {input.totalJP} JP
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="mt-8 pt-6 border-t border-[#E7E9F0] flex items-center justify-between">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E7E9F0] text-xs font-semibold text-[#4A5568] rounded-xl hover:bg-[#F5F6FA] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancel}
                disabled={isGenerating}
                className="px-4 py-2 text-xs font-medium text-[#7B8190] hover:text-[#202533] transition-colors cursor-pointer"
              >
                Batal
              </button>
            )}
          </div>

          <div>
            {step < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#6C5CE7] hover:bg-[#5847D6] text-white text-xs font-semibold rounded-xl shadow-sm shadow-[#6C5CE7]/30 transition-all cursor-pointer"
              >
                <span>Lanjut</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#6C5CE7] hover:bg-[#5847D6] text-white text-xs font-semibold rounded-xl shadow-md shadow-[#6C5CE7]/30 transition-all disabled:opacity-60 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menghasilkan Perangkat Pelatihan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Perangkat Pelatihan</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
