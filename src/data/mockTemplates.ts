/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrainingInput, ReferenceTemplate } from '../types';

export const STANDARD_TEMPLATES: ReferenceTemplate[] = [
  {
    id: 'tpl-komdigi-silabus-offline-online',
    title: 'Format Standar Silabus Pelatihan — BLSDM Komdigi Surabaya',
    category: 'Silabus',
    description: 'Format baku silabus mencakup Informasi Pelatihan, Sertifikat, Deskripsi, Tujuan, Persyaratan Peserta, Sarana, Rencana Jam Pelatihan (JP), dan Skema Evaluasi.',
    source: 'Pedoman Kurikulum Pelatihan Digital BLSDM Komdigi Surabaya',
    updatedAt: '2026-01-10',
    sampleContent: `INFORMASI PELATIHAN:
- Nama Pelatihan: [Nama Pelatihan]
- Sertifikat: Sertifikat telah menyelesaikan pelatihan (Certificate of Completion)
- Metode: Full Offline / Full Online / Hybrid
- Durasi: [X] JP (1 JP = 45 menit)

STRUKTUR MATERI:
- Materi Pokok dan Submateri
- Alokasi JP per topik
- Aktivitas Kelas: Ceramah, Tanya Jawab, Curah Pendapat, Praktik, Latihan, Penugasan, Presentasi, Learning Feedback.

EVALUASI DAN KELULUSAN:
- Kehadiran minimal 90% (maksimal tidak hadir 10% dari total JP)
- Nilai minimal kelulusan: 65
- Bobot: Pre-Test 5%, Tugas/Praktik 65%, Post-Test 30%`,
  },
  {
    id: 'tpl-komdigi-rundown-offline-3d',
    title: 'Template Rundown Pelatihan Tatap Muka (Offline 3 Hari 22 JP)',
    category: 'Rundown',
    description: 'Rincian jadwal tatap muka di kelas: Hari 1 (8 JP), Hari 2 (9 JP), Hari 3 (5 JP), dengan pemisahan waktu Ishoma & Break.',
    source: 'Standar Operasional Prosedur Penjadwalan Pelatihan Tatap Muka BLSDM Komdigi',
    updatedAt: '2026-01-12',
    sampleContent: `HARI 1 (08.00 - 16.15) — Total 8 JP:
08.00-08.15 : Pembukaan (Non-JP)
08.15-08.45 : Pengarahan Program dan Pre-Test (Non-JP)
08.45-10.15 : Pembelajaran Sesi 1 (Sinkronus, 2 JP = 90 menit)
10.15-10.30 : Break Pagi (15 menit)
10.30-12.00 : Pembelajaran Sesi 2 (Sinkronus, 2 JP = 90 menit)
12.00-13.00 : Break Siang / Ishoma (60 menit)
13.00-14.30 : Pembelajaran Sesi 3 (Sinkronus, 2 JP = 90 menit)
14.30-14.45 : Break Sore (15 menit)
14.45-16.15 : Pembelajaran Sesi 4 (Sinkronus, 2 JP = 90 menit)

HARI 2 (08.00 - 16.15) — Total 9 JP
HARI 3 (08.00 - 13.30) — Total 5 JP + Penutupan & Post-Test`,
  },
  {
    id: 'tpl-komdigi-rundown-online-4d',
    title: 'Template Rundown Pelatihan Daring (Online 4 Hari 22 JP)',
    category: 'Rundown',
    description: 'Kombinasi sesi sinkronus (Live Classroom / Video Conference 19 JP) dan asinkronus (Self-paced Learning di LMS 3 JP).',
    source: 'Standar Penyelenggaraan Pelatihan Daring BLSDM Komdigi',
    updatedAt: '2026-01-15',
    sampleContent: `Total Durasi: 22 JP (Sinkronus 19 JP, Asinkronus 3 JP)
Hari 1: 4 JP Sinkronus
Hari 2: 5 JP Sinkronus + 2 JP Asinkronus (Belajar Mandiri di LMS)
Hari 3: 5 JP Sinkronus + 1 JP Asinkronus (Penyelesaian Tugas Mandiri)
Hari 4: 5 JP Sinkronus + Post-Test & Penutupan`,
  },
  {
    id: 'tpl-komdigi-evaluasi-20',
    title: 'Standar Instrumen Evaluasi (20 Soal Pilihan Ganda)',
    category: 'Evaluasi',
    description: 'Pedoman penyusunan 20 butir soal Pre-test dan Post-test dengan 4 pilihan (A, B, C, D), kunci jawaban tunggal, dan rubrik pembahasan.',
    source: 'Pedoman Asesmen Pembelajaran BLSDM Komdigi Surabaya',
    updatedAt: '2026-02-01',
    sampleContent: `Ketentuan:
1. Jumlah soal Pre-test: tepat 20 butir pilihan ganda
2. Jumlah soal Post-test: tepat 20 butir pilihan ganda
3. Tiap soal memiliki 4 opsi jawaban (A, B, C, D) dengan kunci tunggal dan pembahasan pedagogis
4. Rumus Penilaian: Nilai = (Jumlah Jawaban Benar / 20) x 100
5. Sumber Data: Wajib 100% bersumber dari substansi materi pelatihan (teori, konsep, etika AI/UU PDP, prompt engineering, cek fakta, studi kasus)
6. Dilarang menguji teknis pelaksanaan diklat (durasi JP, bobot persentase nilai ujian, batas absensi, jadwal istirahat).`,
  },
];

// Preset contoh pelatihan resmi yang dapat dimuat pengguna dengan 1-klik (tanpa diksi DTS / akademi)
export function getKomdigiPreset(): TrainingInput {
  return {
    trainingName: 'Artificial Intelligence (AI) for Content Creation',
    description:
      'Pelatihan ini diharapkan dapat meningkatkan kapasitas aparatur dan pegawai instansi dalam memanfaatkan teknologi Artificial Intelligence (AI) untuk menghasilkan konten kreatif yang berkualitas, etis, dan relevan bagi komunikasi publik.',
    targetAudience:
      'ASN/TNI/POLRI atau pegawai di instansi pemerintahan, diutamakan pengelola media sosial instansi dan praktisi kehumasan publik.',
    participantLevel: 'Pemula',
    learningObjectives:
      '1. Memahami konsep dasar Artificial Intelligence (AI) di dunia kreatif komunikasi publik.\n2. Menggunakan tools berbasis Artificial Intelligence (AI) untuk content creation (teks, visual grafis, audio, dan video).\n3. Membuat, mengoptimasi, dan mempublikasikan konten kreatif dengan mematuhi prinsip etika AI dan regulasi data.',
    participantCount: 30,
    deliveryMethod: 'Offline',
    totalJP: 22,
    trainingDays: 3,
    dailyJPAllocation: [
      {
        dayNumber: 1,
        allocatedJP: 8,
        startTime: '08:00',
        endTime: '16:15',
        breakTimes: [
          { startTime: '10:15', endTime: '10:30', label: 'Break Pagi' },
          { startTime: '12:00', endTime: '13:00', label: 'Ishoma Siang' },
          { startTime: '14:30', endTime: '14:45', label: 'Break Sore' },
        ],
      },
      {
        dayNumber: 2,
        allocatedJP: 9,
        startTime: '08:00',
        endTime: '16:15',
        breakTimes: [
          { startTime: '10:15', endTime: '10:30', label: 'Break Pagi' },
          { startTime: '12:00', endTime: '13:00', label: 'Ishoma Siang' },
          { startTime: '14:30', endTime: '14:45', label: 'Break Sore' },
        ],
      },
      {
        dayNumber: 3,
        allocatedJP: 5,
        startTime: '08:00',
        endTime: '13:30',
        breakTimes: [
          { startTime: '10:15', endTime: '10:30', label: 'Break Pagi' },
          { startTime: '12:00', endTime: '13:00', label: 'Ishoma Siang' },
        ],
      },
    ],
    referenceText:
      'Surat Edaran Menkominfo RI No 9 Tahun 2023 tentang Etika Kecerdasan Artifisial (9 Prinsip: Inklusivitas, Kemanusiaan, Keamanan, Aksesibilitas, Transparansi, Kredibilitas dan Akuntabilitas, Pelindungan Data Pribadi, Pembangunan dan Lingkungan Berkelanjutan, serta Kekayaan Intelektual). Standar 1 JP = 45 menit.',
    additionalNotes: 'Pembagian waktu istirahat tidak dihitung sebagai jam pelajaran. Evaluasi 20 butir soal.',
    selectedOutputs: {
      syllabus: true,
      rundown: true,
      fullMaterial: true,
      slideMaterial: true,
      evaluations: true,
    },
  };
}

export function getEmptyTrainingInput(): TrainingInput {
  return {
    trainingName: '',
    description: '',
    targetAudience: '',
    participantLevel: 'Pemula',
    learningObjectives: '',
    participantCount: undefined,
    deliveryMethod: 'Offline',
    totalJP: 20,
    trainingDays: 3,
    dailyJPAllocation: [
      {
        dayNumber: 1,
        allocatedJP: 7,
        startTime: '08:00',
        endTime: '16:00',
        breakTimes: [
          { startTime: '10:15', endTime: '10:30', label: 'Break Pagi' },
          { startTime: '12:00', endTime: '13:00', label: 'Ishoma' },
        ],
      },
      {
        dayNumber: 2,
        allocatedJP: 7,
        startTime: '08:00',
        endTime: '16:00',
        breakTimes: [
          { startTime: '10:15', endTime: '10:30', label: 'Break Pagi' },
          { startTime: '12:00', endTime: '13:00', label: 'Ishoma' },
        ],
      },
      {
        dayNumber: 3,
        allocatedJP: 6,
        startTime: '08:00',
        endTime: '14:30',
        breakTimes: [
          { startTime: '10:15', endTime: '10:30', label: 'Break Pagi' },
          { startTime: '12:00', endTime: '13:00', label: 'Ishoma' },
        ],
      },
    ],
    referenceText: '',
    additionalNotes: '',
    selectedOutputs: {
      syllabus: true,
      rundown: true,
      fullMaterial: true,
      slideMaterial: true,
      evaluations: true,
    },
  };
}
