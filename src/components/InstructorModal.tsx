/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  UserCheck,
  ShieldCheck,
  PlusCircle,
  Cloud,
  CheckCircle2,
  Building,
  Award,
  KeyRound,
  Users,
} from 'lucide-react';
import { InstructorProfile, InstructorRole } from '../types';

interface InstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructors: InstructorProfile[];
  currentInstructor: InstructorProfile;
  onSelectInstructor: (inst: InstructorProfile) => void;
  onRegisterInstructor: (data: Omit<InstructorProfile, 'id'>) => Promise<void>;
  isCloudConnected: boolean;
}

export const InstructorModal: React.FC<InstructorModalProps> = ({
  isOpen,
  onClose,
  instructors,
  currentInstructor,
  onSelectInstructor,
  onRegisterInstructor,
  isCloudConnected,
}) => {
  const [tab, setTab] = useState<'select' | 'register'>('select');

  // Register Form State
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InstructorRole>('Instruktur BLSDM');
  const [division, setDivision] = useState('Subtim Transformasi Digital & AI');
  const [specialties, setSpecialties] = useState('Kecerdasan Artifisial, Prompt Engineering');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nip.trim()) return;

    setIsSubmitting(true);
    try {
      await onRegisterInstructor({
        name: name.trim(),
        nip: nip.trim(),
        email: email.trim() || `${nip.trim()}@komdigi.go.id`,
        role,
        division,
        specialties: specialties.split(',').map((s) => s.trim()).filter(Boolean),
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=6C5CE7&textColor=ffffff`,
      });
      onClose();
    } catch (err) {
      console.error('Pendaftaran gagal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#E7E9F0] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-white via-purple-50/40 to-white border-b border-[#E7E9F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 flex items-center justify-center text-[#6C5CE7] shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#202533]">Akun Instruktur & Pengajar</h3>
                <span className="text-[11px] font-semibold bg-[#6C5CE7]/10 text-[#6C5CE7] px-2 py-0.5 rounded-full">
                  Multi-Device Cloud Sync
                </span>
              </div>
              <p className="text-xs text-[#7B8190]">
                Masuk untuk menyimpan riwayat di cloud server dan berkolaborasi antar pengajar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#7B8190] hover:text-[#202533] hover:bg-[#F5F6FA] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Status Notice */}
        <div className="px-6 py-3 bg-[#F5F6FA] border-b border-[#E7E9F0] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#202533]">
            <Cloud className={`w-4 h-4 ${isCloudConnected ? 'text-[#6C5CE7]' : 'text-amber-500'}`} />
            <span className="font-medium">
              {isCloudConnected ? 'Status Sinkronisasi Cloud: Aktif' : 'Status Sinkronisasi: Lokal (Offline)'}
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-[#35A875] animate-pulse"></span>
          </div>
          <span className="text-[11px] text-[#7B8190]">
            Database Server: <code className="font-mono text-[#6C5CE7]">server_data/</code>
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E7E9F0] px-6 bg-white">
          <button
            onClick={() => setTab('select')}
            className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              tab === 'select'
                ? 'border-[#6C5CE7] text-[#6C5CE7]'
                : 'border-transparent text-[#7B8190] hover:text-[#202533]'
            }`}
          >
            Pilih Profil Pengajar ({instructors.length})
          </button>
          <button
            onClick={() => setTab('register')}
            className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              tab === 'register'
                ? 'border-[#6C5CE7] text-[#6C5CE7]'
                : 'border-transparent text-[#7B8190] hover:text-[#202533]'
            }`}
          >
            + Tambah Instruktur Baru
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-[#F5F6FA]/50">
          {tab === 'select' && (
            <div className="space-y-3">
              <p className="text-xs text-[#7B8190]">
                Pilih profil instruktur yang sedang menggunakan perangkat ini untuk mencatat riwayat pelatihan:
              </p>
              <div className="grid grid-cols-1 gap-3">
                {instructors.map((inst) => {
                  const isCurrent = currentInstructor.id === inst.id;
                  return (
                    <div
                      key={inst.id}
                      onClick={() => {
                        onSelectInstructor(inst);
                        onClose();
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'bg-purple-50/70 border-[#6C5CE7] ring-2 ring-[#6C5CE7]/20 shadow-xs'
                          : 'bg-white border-[#E7E9F0] hover:border-[#6C5CE7]/40 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={inst.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(inst.name)}`}
                          alt={inst.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-[#E7E9F0] shadow-xs"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#202533]">{inst.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold bg-[#6C5CE7] text-white px-2 py-0.5 rounded-full">
                                Akun Aktif
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#7B8190] flex items-center gap-2 mt-0.5">
                            <span className="font-mono">NIP: {inst.nip}</span>
                            <span>•</span>
                            <span className="font-medium text-[#6C5CE7]">{inst.role}</span>
                          </div>
                          <div className="text-[11px] text-[#7B8190] mt-1 flex items-center gap-1.5">
                            <Building className="w-3 h-3 text-[#7B8190]" />
                            <span>{inst.division}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <div className="w-8 h-8 rounded-full bg-[#6C5CE7] text-white flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-xl bg-white text-[#6C5CE7] border border-[#6C5CE7]/30 text-xs font-semibold hover:bg-[#6C5CE7] hover:text-white transition-all shadow-2xs"
                          >
                            Masuk
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 bg-white p-6 rounded-2xl border border-[#E7E9F0] shadow-2xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#202533] mb-1.5">
                    Nama Lengkap & Gelar *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Dr. Budi Setiawan, M.T."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E9F0] text-xs text-[#202533] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202533] mb-1.5">
                    NIP (Nomor Induk Pegawai) *
                  </label>
                  <input
                    type="text"
                    required
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="Contoh: 198501152010121003"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E9F0] text-xs font-mono text-[#202533] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#202533] mb-1.5">
                    Email Kedinasan
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@komdigi.go.id"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E9F0] text-xs text-[#202533] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202533] mb-1.5">
                    Role Instruktur / Jabatan *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as InstructorRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E9F0] text-xs text-[#202533] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition-all"
                  >
                    <option value="Instruktur BLSDM">Instruktur BLSDM</option>
                    <option value="Instruktur Ahli / Senior">Instruktur Ahli / Senior</option>
                    <option value="Fasilitator Praktisi">Fasilitator Praktisi</option>
                    <option value="Koordinator Kurikulum & Mutu">Koordinator Kurikulum & Mutu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202533] mb-1.5">
                  Divisi / Subtim BLSDM
                </label>
                <input
                  type="text"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  placeholder="Subtim Transformasi Digital & AI"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E9F0] text-xs text-[#202533] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202533] mb-1.5">
                  Bidang Keahlian / Spesialisasi (pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  placeholder="AI Ethics, Python, Cloud Computing"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E9F0] text-xs text-[#202533] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition-all"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTab('select')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7B8190] hover:bg-[#F5F6FA]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#6C5CE7] hover:bg-[#5847D6] text-white text-xs font-semibold rounded-xl shadow-sm shadow-[#6C5CE7]/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan & Aktifkan Profil'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#E7E9F0] flex items-center justify-between text-xs text-[#7B8190]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#35A875]" />
            <span>Sistem Autentikasi Pengajar BLSDM Komdigi Surabaya</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#F5F6FA] hover:bg-[#E7E9F0] text-[#202533] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
