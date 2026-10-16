/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Clock,
  Database,
  Download,
  Upload,
  Trash2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { TrainingProject } from '../types';

interface SettingsViewProps {
  projects: TrainingProject[];
  onImportProjects: (imported: TrainingProject[]) => void;
  onClearAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  projects,
  onImportProjects,
  onClearAll,
}) => {
  const [toast, setToast] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleExportBackup = () => {
    const dataStr = JSON.stringify(projects, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_digitraining_komdigi_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToastMsg('Cadangan data berhasil diunduh.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportProjects(parsed);
          showToastMsg(`Berhasil memulihkan ${parsed.length} proyek pelatihan.`);
        } else {
          alert('Format berkas JSON cadangan tidak sesuai.');
        }
      } catch (err) {
        alert('Gagal membaca berkas cadangan JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-3xl pb-20">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#202533] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-[#35A875]" />
          <span>{toast}</span>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-[#202533]">Pengaturan & Standar Sistem</h2>
        <p className="text-xs text-[#7B8190]">
          Konfigurasi basis aturan bisnis pelatihan, identitas kedinasan, dan tata kelola data.
        </p>
      </div>

      {/* Institutional Context Card */}
      <div className="bg-white rounded-2xl border border-[#E7E9F0] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6C5CE7] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#202533]">Identitas Instansi Pengembang</h3>
            <p className="text-xs text-[#7B8190]">Pusat Pelatihan & Balai Riset SDM</p>
          </div>
        </div>

        <div className="text-xs text-[#4A5568] leading-relaxed p-4 bg-[#F5F6FA] rounded-xl border border-[#E7E9F0] space-y-2">
          <div className="flex justify-between border-b border-[#E7E9F0] pb-2">
            <span className="font-semibold text-[#202533]">Lembaga:</span>
            <span>Balai Pengembangan Sumber Daya Manusia dan Penelitian Komunikasi dan Digital (BLSDM) Surabaya</span>
          </div>
          <div className="flex justify-between border-b border-[#E7E9F0] pb-2">
            <span className="font-semibold text-[#202533]">Kementerian:</span>
            <span>Kementerian Komunikasi dan Digital Republik Indonesia</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-[#202533]">Tujuan Aplikasi:</span>
            <span>AI Assistant untuk Persiapan Perangkat Pelatihan Digital Instruktur</span>
          </div>
        </div>
      </div>

      {/* Business Rules: JP Conversion */}
      <div className="bg-white rounded-2xl border border-[#E7E9F0] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#5847D6] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#202533]">Aturan Bisnis Jam Pelatihan (JP)</h3>
            <p className="text-xs text-[#7B8190]">Formula kalkulasi programatis terverifikasi</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-[#E7E9F0] bg-[#F5F6FA]">
            <span className="text-[#7B8190] block text-[11px] uppercase tracking-wider font-semibold">Konversi Durasi</span>
            <div className="text-base font-bold font-mono text-[#6C5CE7] mt-1">
              1 JP = 45 Menit
            </div>
            <p className="text-[11px] text-[#7B8190] mt-1">
              Durasi Menit = Jumlah JP × 45. Tidak boleh menggunakan 60 menit.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E7E9F0] bg-[#F5F6FA]">
            <span className="text-[#7B8190] block text-[11px] uppercase tracking-wider font-semibold">Waktu Istirahat (Break)</span>
            <div className="text-base font-bold text-[#202533] mt-1">
              Non-JP Pembelajaran
            </div>
            <p className="text-[11px] text-[#7B8190] mt-1">
              Waktu Ishoma/Break secara eksplisit dikecualikan dari jam pelajaran.
            </p>
          </div>
        </div>
      </div>

      {/* Local Storage & Backup Management */}
      <div className="bg-white rounded-2xl border border-[#E7E9F0] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#35A875] flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#202533]">Penyimpanan Data Lokal (LocalStorage)</h3>
            <p className="text-xs text-[#7B8190]">
              Data Anda saat ini tersimpan aman di peramban web perangkat ini ({projects.length} pelatihan)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportBackup}
            disabled={projects.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E7E9F0] text-xs font-semibold text-[#202533] rounded-xl hover:bg-[#F5F6FA] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#6C5CE7]" />
            <span>Ekspor Cadangan (JSON)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E7E9F0] text-xs font-semibold text-[#202533] rounded-xl hover:bg-[#F5F6FA] transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-[#35A875]" />
            <span>Pulihkan Cadangan (JSON)</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>

          <button
            onClick={() => setShowConfirmReset(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-[#DF5B66] text-xs font-semibold rounded-xl hover:bg-red-100 transition-colors ml-auto cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Semua Data</span>
          </button>
        </div>

        {/* Confirmation Modal */}
        {showConfirmReset && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-3">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-[#DF5B66]" />
              <span>Konfirmasi Penghapusan Seluruh Data</span>
            </div>
            <p className="leading-relaxed">
              Tindakan ini akan menghapus seluruh data draf pelatihan dari penyimpanan lokal peramban Anda. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClearAll();
                  setShowConfirmReset(false);
                  showToastMsg('Seluruh data lokal telah dibersihkan.');
                }}
                className="px-3 py-1.5 bg-[#DF5B66] text-white font-semibold rounded-lg hover:bg-red-700 cursor-pointer"
              >
                Ya, Hapus Sekarang
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-3 py-1.5 bg-white border border-red-200 text-red-800 rounded-lg font-medium cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
