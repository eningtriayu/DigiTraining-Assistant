/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RundownDay, RundownSession } from '../types';

export const MINUTES_PER_JP = 45;

export function jpToMinutes(jp: number): number {
  return Math.round(jp * MINUTES_PER_JP);
}

export function minutesToJP(minutes: number): number {
  return Number((minutes / MINUTES_PER_JP).toFixed(2));
}

export function parseTimeString(timeStr: string): number | null {
  if (!timeStr) return null;
  const normalized = timeStr.replace('.', ':').trim();
  const parts = normalized.split(':');
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

export function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}.${String(minutes).padStart(2, '0')}`;
}

export function calculateSessionDuration(timeRange: string): { durationMinutes: number; durationJP: number } {
  const parts = timeRange.split('-');
  if (parts.length !== 2) return { durationMinutes: 0, durationJP: 0 };
  const start = parseTimeString(parts[0]);
  const end = parseTimeString(parts[1]);
  if (start === null || end === null || end <= start) {
    return { durationMinutes: 0, durationJP: 0 };
  }
  const diff = end - start;
  return {
    durationMinutes: diff,
    durationJP: minutesToJP(diff),
  };
}

export interface RundownValidationResult {
  isValid: boolean;
  expectedJP: number;
  actualJP: number;
  diffJP: number;
  synchronousJP: number;
  asynchronousJP: number;
  breakMinutes: number;
  messages: string[];
}

export function validateRundownSchedule(days: RundownDay[], expectedTotalJP: number): RundownValidationResult {
  let learningJP = 0;
  let syncJP = 0;
  let asyncJP = 0;
  let breakMinutes = 0;
  const messages: string[] = [];

  days.forEach((day) => {
    let dayLearningJP = 0;
    day.sessions.forEach((session) => {
      if (session.deliveryMode === 'Break') {
        breakMinutes += session.durationMinutes;
      } else if (session.isLearningJP) {
        learningJP += session.durationJP;
        dayLearningJP += session.durationJP;
        if (session.deliveryMode === 'Asinkronus') {
          asyncJP += session.durationJP;
        } else {
          syncJP += session.durationJP;
        }
      }
    });
  });

  const roundedActual = Math.round(learningJP);
  const diff = roundedActual - expectedTotalJP;

  if (diff === 0) {
    messages.push(`Total durasi rundown valid: tepat ${expectedTotalJP} JP (${jpToMinutes(expectedTotalJP)} menit pembelajaran).`);
  } else if (diff < 0) {
    messages.push(
      `Total rundown adalah ${roundedActual} JP, sedangkan durasi program ditetapkan ${expectedTotalJP} JP. Terdapat selisih kurang ${Math.abs(diff)} JP (${Math.abs(diff) * MINUTES_PER_JP} menit). Silakan periksa alokasi sesi sebelum dokumen disetujui.`
    );
  } else {
    messages.push(
      `Total rundown adalah ${roundedActual} JP, melebihi target durasi program ${expectedTotalJP} JP sebanyak ${diff} JP (${diff * MINUTES_PER_JP} menit).`
    );
  }

  return {
    isValid: diff === 0,
    expectedJP: expectedTotalJP,
    actualJP: roundedActual,
    diffJP: diff,
    synchronousJP: Math.round(syncJP),
    asynchronousJP: Math.round(asyncJP),
    breakMinutes,
    messages,
  };
}
