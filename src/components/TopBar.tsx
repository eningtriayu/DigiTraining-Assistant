/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlusCircle, ShieldCheck, Clock } from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface TopBarProps {
  currentTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  activeProjectName?: string;
  onNewTraining: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onNavigate,
  activeProjectName,
  onNewTraining,
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
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-[#202533] tracking-tight">
          {getTabTitle()}
        </h1>
        {activeProjectName && currentTab === 'workspace' && (
          <span className="text-xs bg-[#6C5CE7]/10 text-[#6C5CE7] px-2.5 py-0.5 rounded-full font-medium">
            Tersimpan Lokal
          </span>
        )}
      </div>

      {/* Top Bar Actions & Institutional Marker */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-xs text-[#7B8190] bg-[#F5F6FA] px-3 py-1.5 rounded-lg border border-[#E7E9F0]">
          <ShieldCheck className="w-4 h-4 text-[#35A875]" />
          <span>BLSDM Komdigi Surabaya</span>
          <span className="text-[#E7E9F0]">|</span>
          <Clock className="w-3.5 h-3.5 text-[#6C5CE7]" />
          <span className="font-mono">1 JP = 45m</span>
        </div>

        {currentTab !== 'create' && (
          <button
            onClick={onNewTraining}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#6C5CE7] hover:bg-[#5847D6] text-white text-xs font-semibold rounded-lg shadow-sm shadow-[#6C5CE7]/30 transition-all duration-150 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat Pelatihan</span>
          </button>
        )}
      </div>
    </header>
  );
};
