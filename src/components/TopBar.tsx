/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlusCircle, ShieldCheck, Clock, Cloud, ChevronDown, UserCheck } from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { InstructorProfile } from '../types';

interface TopBarProps {
  currentTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  activeProjectName?: string;
  onNewTraining: () => void;
  currentInstructor: InstructorProfile;
  isCloudConnected: boolean;
  onOpenInstructorModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onNavigate,
  activeProjectName,
  onNewTraining,
  currentInstructor,
  isCloudConnected,
  onOpenInstructorModal,
}) => {
  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Dashboard Persiapan Pelatihan';
      case 'create':
        return 'Formulir Pelatihan Baru';
      case 'history':
        return 'Riwayat & Manajemen Proyek';
      case 'templates':
        return 'Perpustakaan Format & Template';
      case 'settings':
        return 'Pengaturan & Konfigurasi Sistem';
      case 'workspace':
        return activeProjectName ? `Workspace: ${activeProjectName}` : 'Workspace Pelatihan';
      default:
        return 'DigiTraining Assistant';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#E7E9F0] px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Breadcrumb / Title & Cloud Status */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-[#202533] tracking-tight">
          {getTabTitle()}
        </h1>

        {/* Cloud Persistence Badge - replacing old 'Tersimpan Lokal' */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#6C5CE7]/10 text-[#6C5CE7] border border-[#6C5CE7]/20 shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#35A875] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#35A875]"></span>
          </span>
          <Cloud className="w-3.5 h-3.5 ml-0.5" />
          <span>{isCloudConnected ? 'Cloud Server Aktif' : 'Tersinkronisasi'}</span>
        </div>
      </div>

      {/* Top Bar Actions & Instructor Profile Lockup */}
      <div className="flex items-center gap-3.5">
        {/* BLSDM Marker */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-[#7B8190] bg-[#F5F6FA] px-3 py-1.5 rounded-xl border border-[#E7E9F0]">
          <ShieldCheck className="w-4 h-4 text-[#35A875]" />
          <span className="font-medium text-[#202533]">BLSDM Komdigi</span>
          <span className="text-[#E7E9F0]">|</span>
          <Clock className="w-3.5 h-3.5 text-[#6C5CE7]" />
          <span className="font-mono text-[11px] font-semibold text-[#6C5CE7]">1 JP = 45m</span>
        </div>

        {/* Create Button */}
        {currentTab !== 'create' && (
          <button
            onClick={onNewTraining}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#6C5CE7] hover:bg-[#5847D6] text-white text-xs font-semibold rounded-xl shadow-xs shadow-[#6C5CE7]/30 transition-all duration-150 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat Pelatihan</span>
          </button>
        )}

        {/* Instructor Account Pill (Huthy-inspired modern card) */}
        <button
          onClick={onOpenInstructorModal}
          className="flex items-center gap-2.5 pl-2 pr-3 py-1 bg-white hover:bg-[#F5F6FA] border border-[#E7E9F0] hover:border-[#6C5CE7]/40 rounded-2xl transition-all shadow-2xs cursor-pointer group"
          title="Klik untuk ganti akun pengajar atau lihat detail profil"
        >
          <img
            src={currentInstructor.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentInstructor.name)}`}
            alt={currentInstructor.name}
            className="w-7 h-7 rounded-xl object-cover border border-[#E7E9F0]"
          />
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-[#202533] leading-tight group-hover:text-[#6C5CE7] transition-colors">
              {currentInstructor.name}
            </div>
            <div className="text-[10px] text-[#7B8190] flex items-center gap-1">
              <span className="font-semibold text-[#6C5CE7]">{currentInstructor.role}</span>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[#7B8190] group-hover:text-[#6C5CE7] transition-colors" />
        </button>
      </div>
    </header>
  );
};
