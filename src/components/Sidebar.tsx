/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  FolderClock,
  BookOpenCheck,
  Settings,
  Sparkles,
  GraduationCap,
  Cloud,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { InstructorProfile } from '../types';

export type ActiveTab = 'dashboard' | 'create' | 'history' | 'templates' | 'settings' | 'workspace';

interface SidebarProps {
  currentTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  activeProjectName?: string;
  projectCount: number;
  currentInstructor: InstructorProfile;
  onOpenInstructorModal: () => void;
  isCloudConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  activeProjectName,
  projectCount,
  currentInstructor,
  onOpenInstructorModal,
  isCloudConnected,
}) => {
  const menuItems: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; badge?: string | number }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'create',
      label: 'Buat Pelatihan',
      icon: <PlusCircle className="w-5 h-5" />,
    },
    {
      id: 'history',
      label: 'Riwayat Pelatihan',
      icon: <FolderClock className="w-5 h-5" />,
      badge: projectCount > 0 ? projectCount : undefined,
    },
    {
      id: 'templates',
      label: 'Referensi & Template',
      icon: <BookOpenCheck className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E7E9F0] flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand Lockup */}
        <div className="p-6 border-b border-[#E7E9F0]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5847D6] to-[#6C5CE7] flex items-center justify-center text-white shadow-sm shadow-[#6C5CE7]/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-base text-[#202533] leading-tight tracking-tight">
                DigiTraining
              </div>
              <div className="text-[11px] text-[#7B8190] font-medium">
                BLSDM Komdigi Surabaya
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#7B8190] uppercase">
            Menu Utama
          </div>
          {menuItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#6C5CE7]/10 text-[#6C5CE7] font-semibold'
                    : 'text-[#4A5568] hover:bg-[#F5F6FA] hover:text-[#202533]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-[#6C5CE7]' : 'text-[#7B8190]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono tabular-nums ${
                      isActive
                        ? 'bg-[#6C5CE7] text-white'
                        : 'bg-[#F5F6FA] text-[#7B8190] border border-[#E7E9F0]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Workspace Link if available */}
        {activeProjectName && (
          <div className="px-3 pt-2">
            <div className="p-3 bg-gradient-to-br from-[#F5F6FA] to-purple-50/50 rounded-2xl border border-[#6C5CE7]/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-[#6C5CE7] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Proyek Aktif
                </span>
                <span className="text-[10px] text-[#7B8190]">Workspace</span>
              </div>
              <div className="text-xs font-semibold text-[#202533] truncate mb-2">
                {activeProjectName}
              </div>
              <button
                onClick={() => onNavigate('workspace')}
                className={`w-full py-1.5 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                  currentTab === 'workspace'
                    ? 'bg-[#6C5CE7] text-white shadow-xs'
                    : 'bg-white text-[#6C5CE7] border border-[#6C5CE7]/30 hover:bg-[#6C5CE7] hover:text-white'
                }`}
              >
                Buka Editor
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructor Account Card at Bottom (SaaS Card) */}
      <div className="p-3 border-t border-[#E7E9F0] bg-white">
        <div
          onClick={onOpenInstructorModal}
          className="p-3 rounded-2xl bg-[#F5F6FA] hover:bg-purple-50/60 border border-[#E7E9F0] hover:border-[#6C5CE7]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#6C5CE7]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#35A875] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#35A875]"></span>
              </span>
              <span>{isCloudConnected ? 'Cloud Synced' : 'Multi-device'}</span>
            </div>
            <span className="text-[10px] text-[#7B8190] group-hover:text-[#6C5CE7] flex items-center">
              Ganti <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <img
              src={currentInstructor.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentInstructor.name)}`}
              alt={currentInstructor.name}
              className="w-8 h-8 rounded-xl object-cover border border-[#E7E9F0] shadow-2xs"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[#202533] truncate group-hover:text-[#6C5CE7] transition-colors">
                {currentInstructor.name}
              </div>
              <div className="text-[10px] text-[#7B8190] truncate font-mono">
                {currentInstructor.role}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
