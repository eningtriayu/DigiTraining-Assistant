/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TrainingInput,
  TrainingProject,
  SyllabusOutput,
  RundownOutput,
  MaterialOutput,
  SlideOutlineOutput,
  EvaluationOutput,
  RundownDay,
  RundownSession,
  TestQuestion,
  MaterialSection,
  SlideItem,
  ReferenceItem,
  InstructorProfile,
} from '../types';
import { validateRundownSchedule, jpToMinutes } from './jpValidator';
import { runComprehensiveQualityCheck } from './qualityChecker';

// Helper to determine number of chapters and slides based on JP & Days
export function calculateCurriculumScale(totalJP: number, days: number): {
  moduleCount: number;
  chapterCount: number;
  slideCount: number;
} {
  // Modules in syllabus
  const moduleCount = Math.max(2, Math.min(6, Math.round(totalJP / 5) || 3));
  // Chapters in full material: roughly 1 chapter per 4-5 JP, min 3, max 8
  const chapterCount = Math.max(3, Math.min(8, Math.round(totalJP / 4) || 4));
  // Slides: roughly 4-5 slides per training day or 1 slide per 1.5 JP, min 6, max 24
  const slideCount = Math.max(8, Math.min(24, Math.round(totalJP * 0.7) || days * 4));

  return { moduleCount, chapterCount, slideCount };
}

// Client-side generator that constructs rich, domain-grounded drafts
export function generateLocalFallback(
  input: TrainingInput,
  id: string,
  customNotes?: string
): Partial<TrainingProject> {
  const objectives = input.learningObjectives
    .split('\n')
    .map((s) => s.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter((s) => s.length > 0);

  if (objectives.length === 0) {
    objectives.push(
      `Memahami konsep fundamental, regulasi, dan urgensi transformasi digital dalam ${input.trainingName}`,
      `Mengoperasikan perangkat dan metodologi teknis terkait ${input.trainingName} secara presisi dan efektif`,
      `Mengimplementasikan karya dan layanan digital dengan berpedoman pada etika profesi, UU PDP, dan SE Menkominfo No. 9 Tahun 2023`,
      `Mengevaluasi, mengukur efektivitas (KPI), serta mengoptimalkan diseminasi informasi publik secara berkelanjutan`
    );
  }

  const { moduleCount, chapterCount, slideCount } = calculateCurriculumScale(input.totalJP, input.trainingDays);

  // 1. GENERATE SYLLABUS
  const baseJP = Math.floor(input.totalJP / moduleCount);
  const remainder = input.totalJP % moduleCount;

  const curriculumTitles = [
    `Landasan Konseptual & Regulasi: ${input.trainingName}`,
    `Etika Penyelenggaraan Digital & Pelindungan Data Pribadi`,
    `Pengoperasian Perangkat Bantu & Metodologi Prompting`,
    `Produksi Konten Multi-Kanal (Teks, Desain Visual, & Video)`,
    `Verifikasi Fakta, Deteksi Deepfake & Penjaminan Mutu`,
    `Strategi Diseminasi, Optimasi Metrik Kinerja (KPI) & Evaluasi`,
  ];

  const curriculum = Array.from({ length: moduleCount }).map((_, i) => {
    const jp = baseJP + (i === 0 ? remainder : 0);
    return {
      no: i + 1,
      moduleName: curriculumTitles[i] || `Modul Pembelajaran ${i + 1}: ${input.trainingName}`,
      topics: [
        `Ruang lingkup dan pemetaan kompetensi bab`,
        `Kaidah teknis, regulasi acuan, dan studi kasus riil`,
        `Praktik mandiri dan pemecahan kendala operasional`,
      ],
      jp,
      classActivities: ['Ceramah Interaktif', 'Diskusi Terarah', 'Praktik Terbimbing', 'Latihan Mandiri LMS'],
    };
  });

  const syllabus: SyllabusOutput = {
    id: `syl-${id}`,
    projectId: id,
    trainingName: input.trainingName,
    certificateType: 'Sertifikat Telah Menyelesaikan Pelatihan (Certificate of Completion)',
    deliveryMethod: input.deliveryMethod,
    totalJP: input.totalJP,
    description:
      input.description ||
      `Program pelatihan intensif bagi aparatur dan pengelola informasi publik di lingkungan BLSDM Komdigi Surabaya guna menguasai keterampilan ${input.trainingName} secara terstandar, etis, dan akuntabel.`,
    objectives,
    participantRequirements: [
      input.targetAudience || 'ASN / Pegawai instansi pemerintah atau pengelola media sosial publik.',
      'Pendidikan formal minimal SLTA / Sederajat.',
      'Memperoleh surat penugasan resmi dari pimpinan unit kerja / instansi.',
      'Dapat mengoperasikan aplikasi perkantoran tingkat dasar dan memiliki akun peramban web aktif.',
    ],
    facilityRequirements: [
      'Laptop/komputer spesifikasi minimum: Windows 10/11, macOS, atau Linux (RAM minimal 4 GB, disarankan 8 GB).',
      'Koneksi internet stabil minimal 10 Mbps untuk akses portal dan LMS.',
      'Kapasitas ruang simpan bebas minimal 2 GB dan resolusi layar minimal 1024x768.',
    ],
    activitiesDescription: {
      offline: 'Pembelajaran tatap muka di kelas diklat BLSDM Komdigi Surabaya dengan ceramah, tanya jawab, bedah studi kasus, dan simulasi lab langsung.',
      onlineSync: 'Sesi tatap maya interaktif (live classroom) melalui aplikasi video conference dengan instruktur.',
      onlineAsync: 'Belajar mandiri terstruktur melalui LMS dengan bahan ajar digital, video pembelajaran, dan tugas mandiri.',
    },
    curriculum,
    evaluationCriteria: {
      attendanceMaxAbsencePercent: 10,
      preTestWeight: 5,
      assignmentWeight: 65,
      postTestWeight: 30,
      passingScore: 65,
      notes: 'Peserta dinyatakan lulus dan berhak memperoleh sertifikat jika mencapai nilai minimal 65 dan kehadiran minimal 90%.',
    },
    reviewStatus: 'Draft',
    updatedAt: new Date().toISOString(),
  };

  // 2. GENERATE RUNDOWN
  const days: RundownDay[] = input.dailyJPAllocation.map((alloc) => {
    const sessions: RundownSession[] = [];
    const day = alloc.dayNumber;

    if (day === 1) {
      sessions.push(
        {
          id: `s-${day}-1`,
          dayNumber: day,
          timeRange: '08.00-08.15',
          topic: 'Pembukaan Pelatihan & Pengarahan Program',
          activity: 'Seremonial pembukaan oleh pimpinan BLSDM Komdigi Surabaya',
          deliveryMode: 'Seremonial',
          durationMinutes: 15,
          durationJP: 0,
          isLearningJP: false,
        },
        {
          id: `s-${day}-2`,
          dayNumber: day,
          timeRange: '08.15-08.45',
          topic: 'Pengarahan Teknis & Pre-Test Pelatihan',
          activity: 'Pengerjaan 20 butir soal Pre-Test di sistem',
          deliveryMode: 'Sinkronus',
          durationMinutes: 30,
          durationJP: 0,
          isLearningJP: false,
        }
      );
    }

    // Determine number of sessions in this day based on allocated JP
    const sessionsInDay = Math.max(2, Math.min(4, Math.ceil(alloc.allocatedJP / 3)));
    const jpPerSession = Math.floor(alloc.allocatedJP / sessionsInDay);
    const remJP = alloc.allocatedJP % sessionsInDay;

    let currentMinutes = day === 1 ? 8 * 60 + 45 : 8 * 60; // 08:45 on Day 1, 08:00 on other days

    for (let sIdx = 0; sIdx < sessionsInDay; sIdx++) {
      const sessJP = jpPerSession + (sIdx === 0 ? remJP : 0);
      const sessMinutes = jpToMinutes(sessJP);
      const startMinStr = formatTime(currentMinutes);
      const endMinStr = formatTime(currentMinutes + sessMinutes);

      const topicName =
        sIdx === 0
          ? `Mata Pelatihan: Pengantar & Konsep Dasar ${input.trainingName}`
          : sIdx === 1
          ? `Praktik Terbimbing: Eksplorasi Tools & Metodologi Kerja`
          : sIdx === 2
          ? `Penerapan Kasus Instansi: Simulasi Produksi Konten`
          : `Review Karya & Evaluasi Hasil Pembelajaran`;

      sessions.push({
        id: `s-${day}-learn-${sIdx + 1}`,
        dayNumber: day,
        timeRange: `${startMinStr}-${endMinStr}`,
        topic: topicName,
        activity:
          input.deliveryMethod === 'Online' && sIdx === sessionsInDay - 1
            ? 'Asinkronus / Penugasan Mandiri LMS'
            : 'Sinkronus / Live Classroom & Praktik Interaktif',
        deliveryMode: input.deliveryMethod === 'Online' && sIdx === sessionsInDay - 1 ? 'Asinkronus' : 'Sinkronus',
        durationMinutes: sessMinutes,
        durationJP: sessJP,
        isLearningJP: true,
      });

      currentMinutes += sessMinutes;

      // Add break after session if not last
      if (sIdx < sessionsInDay - 1) {
        const isLunchBreak = currentMinutes >= 12 * 60 - 30 && currentMinutes <= 13 * 60;
        const breakLen = isLunchBreak ? 60 : 15;
        const breakLabel = isLunchBreak ? 'Break Siang / Ishoma' : 'Break Istirahat Sesi';
        const bStart = formatTime(currentMinutes);
        const bEnd = formatTime(currentMinutes + breakLen);

        sessions.push({
          id: `s-${day}-break-${sIdx + 1}`,
          dayNumber: day,
          timeRange: `${bStart}-${bEnd}`,
          topic: breakLabel,
          activity: 'Istirahat dan jeda pembelajaran',
          deliveryMode: 'Break',
          durationMinutes: breakLen,
          durationJP: 0,
          isLearningJP: false,
        });

        currentMinutes += breakLen;
      }
    }

    if (day === input.trainingDays) {
      const postStart = formatTime(currentMinutes);
      const postEnd = formatTime(currentMinutes + 45);
      sessions.push({
        id: `s-${day}-post`,
        dayNumber: day,
        timeRange: `${postStart}-${postEnd}`,
        topic: 'Post-Test, Evaluasi Penyelenggaraan & Penutupan',
        activity: 'Pengerjaan 20 butir Post-Test & pengarahan tindak lanjut',
        deliveryMode: 'Sinkronus',
        durationMinutes: 45,
        durationJP: 0,
        isLearningJP: false,
      });
    }

    return {
      dayNumber: day,
      dayTitle: `Hari ${day}: Pembelajaran ${input.trainingName}`,
      sessions,
    };
  });

  const rundownValidation = validateRundownSchedule(days, input.totalJP);

  const rundown: RundownOutput = {
    id: `run-${id}`,
    projectId: id,
    deliveryMethod: input.deliveryMethod,
    totalJP: rundownValidation.actualJP,
    synchronousJP: rundownValidation.synchronousJP,
    asynchronousJP: rundownValidation.asynchronousJP,
    days,
    validation: rundownValidation,
    reviewStatus: 'Draft',
    updatedAt: new Date().toISOString(),
  };

  // 3. GENERATE RICH IN-DEPTH FULL MATERIAL (Scaled to chapterCount)
  const masterChapters: MaterialSection[] = [
    {
      id: 'sec-1',
      title: 'Bab I: Landasan Konseptual, Regulasi, dan Urgensi Digital',
      conceptSummary: 'Memahami evolusi teknologi cerdas, kebijakan nasional, dan urgensi transformasi komunikasi publik instansi.',
      explanation: `Transformasi digital di sektor publik memerlukan perubahan paradigma dari pola komunikasi searah menuju komunikasi dua arah yang adaptif, cepat, dan transparan. Kehadiran teknologi kecerdasan artifisial dan pemrosesan data otomatis membuka peluang akselerasi produktivitas aparatur secara masif.\n\nNamun, inovasi teknologi ini harus dipagari oleh prinsip tata kelola yang bertanggung jawab. Surat Edaran Menkominfo RI No. 9 Tahun 2023 secara tegas mengamanatkan bahwa implementasi kecerdasan buatan wajib berpedoman pada 9 nilai luhur: inklusivitas, kemanusiaan, keamanan, aksesibilitas, transparansi, kredibilitas dan akuntabilitas, pelindungan data pribadi, pembangunan berkelanjutan, serta penghormatan hak kekayaan intelektual.\n\nDalam konteks ${input.trainingName}, aparatur pemerintah dituntut tidak hanya piawai mengoperasikan perangkat, namun memiliki kebijaksanaan etis (ethical mindfulness) agar konten yang disebarkan tidak memicu disinformasi atau kegaduhan sosial.`,
      examples: [
        'Pemanfaatan asisten digital cerdas untuk merangkum risalah rapat kerja dinas dalam format siaran pers ringkas yang divalidasi oleh pranata humas.',
        'Penyusunan basis pengetahuan (knowledge-base) pertanyaan publik seputar layanan perizinan terpadu dengan respon otomatis yang akurat.',
        'Mitigasi risiko dengan menolak memasukkan arsip berklasifikasi rahasia negara ke dalam platform pihak ketiga tanpa enkripsi resmi.',
      ],
      practiceSteps: [
        'Lakukan audit kebutuhan informasi publik pada unit kerja Anda: identifikasi informasi berkala, serta-merta, dan setiap saat.',
        'Tinjau draf materi komunikasi terhadap 9 prinsip etika AI SE Menkominfo No 9/2023 sebelum proses produksi dimulai.',
        'Buat matriks mitigasi risiko yang memisahkan konten yang aman dipublikasikan secara terbuka dengan data sensitif pemohon.',
      ],
      caseStudyOrExercise:
        'Studi Kasus 1: Sebuah akun dinas daerah keliru menyebarkan infografis statistik kependudukan yang bersumber dari generator AI tanpa verifikasi silang ke BPS daerah. Bagaimana langkah penanganan krisis, klarifikasi publik, dan perbaikan SOP internal yang harus dilakukan?',
    },
    {
      id: 'sec-2',
      title: 'Bab II: Kepatuhan Pelindungan Data Pribadi (UU No. 27/2022) & Hak Cipta',
      conceptSummary: 'Kewajiban hukum aparatur dalam menjaga kerahasiaan data warga serta kepatuhan terhadap lisensi hak kekayaan intelektual.',
      explanation: `Dalam penyusunan konten publik, batas antara transparansi dan pelanggaran privasi sering kali menjadi area kritis. Berdasarkan Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP), pengelola data wajib menjamin keamanan data pribadi umum (nama lengkap, jenis kelamin, kewarganegaraan) dan data pribadi spesifik (data kesehatan, data biometrik, rekam jejak keuangan).\n\nKetika menggunakan alat bantu AI generatif, instruktur dan peserta harus memahami ketentuan "data scraping" dan lisensi komersial/non-komersial. Gambar, audio, atau naskah yang dihasilkan melalui AI yang terlatih dari karya berhak cipta tanpa izin dapat menimbulkan gugatan hukum di kemudian hari. Oleh karena itu, prinsip atribusi, pencantuman hak cipta yang adil (fair use), dan izin eksplisit pemilik karya merupakan kewajiban mutlak.`,
      examples: [
        'Menyensor Nomor Induk Kependudukan (NIK), alamat tempat tinggal, dan wajah anak di bawah umur pada dokumentasi bantuan sosial sebelum diunggah.',
        'Menggunakan aset audio berlisensi Creative Commons (CC-BY) atau Public Domain untuk musik latar video edukasi instansi.',
        'Menyertakan klausul persetujuan (consent banner) pada formulir pengumpulan opini masyarakat sebelum dianalisis menggunakan tools AI.',
      ],
      practiceSteps: [
        'Periksa apakah dokumen mentah mengandung data pribadi spesifik sebelum dimasukkan ke dalam prompt pemrosesan.',
        'Terapkan teknik anonymization (penyamaran nama dan entitas pengenal) pada dataset latihan pelatihan.',
        'Cek status lisensi font, template, dan ilustrasi visual pada direktori aset resmi instansi.',
      ],
      caseStudyOrExercise:
        'Latihan Kepatuhan: Diberikan naskah laporan kegiatan dinas kesehatan yang memuat nama pasien dan riwayat penyakit menular. Lakukan sanitasi data (redaction) agar naskah tersebut aman dijadikan materi publikasi edukasi kesehatan masyarakat.',
    },
    {
      id: 'sec-3',
      title: 'Bab III: Arsitektur Prompt Engineering & Metodologi Kerja Presisi',
      conceptSummary: 'Teknik formulasi instruksi tingkat lanjut (Advanced Prompting) untuk meminimalisir halusinasi dan meningkatkan akurasi luaran.',
      explanation: `Model bahasa besar (LLM) bekerja berdasarkan probabilitas token kata berikutnya. Kualitas jawaban yang dihasilkan secara langsung ditentukan oleh kualitas konteks dan instruksi yang diberikan (*Garbage In, Garbage Out*). Fenomena halusinasi AI terjadi ketika model kekurangan batasan eksplisit sehingga mengarang angka, kutipan fiktif, atau dasar regulasi semu.\n\nUntuk mendapatkan hasil prima berstandar kedinasan, terapkan formula prompt 4 komponen berbobot tinggi:\n1. Persona: Tentukan kredibilitas peran yang harus diadopsi (misal: "Anda adalah analis komunikasi publik senior di BLSDM Komdigi Surabaya").\n2. Context: Sampaikan latar belakang program, target demografi warga, dan nada komunikasi (formal, solutif, empati).\n3. Task: Nyatakan instruksi pekerjaan spesifik dengan kata kerja terukur (misal: "Susun 3 opsi takarir Instagram carousel beserta struktur visual per slide").\n4. Constraint: Tetapkan larangan dan batasan mutlak (misal: "Maksimal 150 kata per slide, gunakan bahasa Indonesia baku, jangan gunakan singkatan informal, dan hanya gunakan data yang terlampir").`,
      examples: [
        'Prompt Terstruktur: [Persona] Instruktur literasi digital; [Konteks] Pelatihan ASN pemula; [Tugas] Buatkan analogi sederhana tentang konsep komputasi awan; [Batasan] Maksimal 2 paragraf, gunakan perumpamaan fasilitas kantor, tanpa istilah teknis asing.',
        'Prompt Few-Shot: Memberikan 2 contoh draf sebelum meminta model menghasilkan draf ketiga agar gaya bahasa seragam.',
      ],
      practiceSteps: [
        'Tuliskan draf prompt awal Anda pada editor kerja.',
        'Lakukan evaluasi terhadap keberadaan 4 komponen: Persona, Context, Task, dan Constraint.',
        'Jalankan prompt dan bandingkan respons model: apakah terdapat klaim yang tidak berdasar? Bila ada, perketat constraint.',
      ],
      caseStudyOrExercise:
        'Tugas Mandiri: Susunlah 1 formula prompt lengkap untuk membuat naskah narasi video pendek durasi 60 detik mengenai sosialisasi keamanan kata sandi email dinas.',
    },
    {
      id: 'sec-4',
      title: 'Bab IV: Produksi Konten Multi-Kanal (Teks, Grafis, Audio, dan Video)',
      conceptSummary: 'Integrasi alat bantu produksi kreatif untuk menghasilkan paket publikasi terpadu di berbagai kanal media sosial.',
      explanation: `Masyarakat kontemporer mengonsumsi informasi melalui berbagai format media yang dinamis. Komunikasi publik tidak lagi cukup mengandalkan teks siaran pers panjang. Diperlukan diversifikasi format konten:\n- Teks: Takarir media sosial, artikel portal berita resmi, dan buletin berkala.\n- Grafis Visual: Infografis data statis, poster edukasi, dan carousel bertahap.\n- Audio & Musik: Narasi suara (voiceover) panduan layanan dan musik latar suasana.\n- Video Pendek: Format vertikal 9:16 (Reels, TikTok, YouTube Shorts) berdurasi 30-90 detik yang padat pesan.\n\nDalam memproduksi konten multi-kanal, konsistensi identitas merek instansi (*brand identity*) wajib dipertahankan. Gunakan palet warna resmi instansi, tipografi yang memenuhi standar kontras keterbacaan (WCAG AA), serta susunan pesan dengan struktur *Hook - Content - Call to Action (CTA)*.`,
      examples: [
        'Konversi dokumen perundangan 20 halaman menjadi seri 5 slide infografis poin kunci yang mudah dipahami warga lansia dan pemula.',
        'Pembuatan narasi sulih suara (voiceover) berbahasa Indonesia yang jernih dan ramah untuk panduan alur layanan KTP digital.',
      ],
      practiceSteps: [
        'Pilih topik pelatihan yang telah disepakati.',
        'Rancang storyboard naskah 3 bagian: 5 detik pertama (Hook pemikat masalah), 45 detik (Solusi inti), 10 detik (Call to Action resmi).',
        'Gunakan alat bantu desain untuk menyusun mockup tata letak grafis dan periksa kontras warna.',
      ],
      caseStudyOrExercise:
        'Praktik Produksi: Rancang draf konten media sosial lengkap yang terdiri dari teks takarir 100 kata, 1 konsep infografis pendukung, dan usulan 3 tagar resmi kementerian.',
    },
    {
      id: 'sec-5',
      title: 'Bab V: Cek Fakta, Deteksi Deepfake & Penjaminan Mutu (Human-in-the-Loop)',
      conceptSummary: 'Metodologi verifikasi keabsahan konten dan pengenalan manipulasi citra/suara sebelum materi disetujui untuk rilis.',
      explanation: `Teknologi sintesis media yang kian canggih menghadirkan tantangan disinformasi baru dalam bentuk video deepfake, rekaman audio kloning, dan citra buatan AI yang menyesatkan. Aparatur pemerintah memegang peranan krusial sebagai benteng verifikasi fakta (*truth sentinel*).\n\nPrinsip *Human-in-the-Loop* menegaskan bahwa AI hanyalah asisten pembuat draf; keputusan editorial, validasi fakta, dan tanggung jawab hukum berada sepenuhnya pada manusia. Karakteristik anomali pada konten sintetis yang perlu dicermati antara lain: ketidakwajaran sinkronisasi gerak bibir dan intonasi suara, cacat anatomi jari dan tekstur kulit yang tidak alami, pencahayaan bayangan fisik yang inkonsisten, serta teks latar belakang gambar yang tidak terbaca atau kabur.`,
      examples: [
        'Memverifikasi video pidato pejabat pimpinan daerah yang menawarkan program bantuan tunai mendadak menggunakan teknik reverse image search dan konfirmasi ke biro humas resmi.',
        'Menerapkan penanda transparansi bertuliskan "Visual ini diilustrasikan dengan bantuan AI untuk tujuan edukasi" pada materi sosialisasi.',
      ],
      practiceSteps: [
        'Periksa setiap angka statistik dan tanggal pada draf materi terhadap dokumen sumber resmi.',
        'Gunakan perangkat pemeriksa metadata gambar atau rekaman untuk memeriksa jejak manipulasi digital.',
        'Terapkan checklist persetujuan berlapis sebelum dokumen atau media tayang dapat diunduh untuk publikasi.',
      ],
      caseStudyOrExercise:
        'Analisis Forensik: Perhatikan dua contoh visual yang disediakan pengajar. Identifikasi apakah citra tersebut merupakan foto otentik atau hasil manipulasi AI generatif dengan menuliskan minimal 3 bukti pendukung.',
    },
    {
      id: 'sec-6',
      title: 'Bab VI: Strategi Diseminasi, Optimasi Metrik (KPI) & Evaluasi Berkelanjutan',
      conceptSummary: 'Manajemen distribusi konten, pengukuran efektivitas engagement publik, dan penyusunan laporan tindak lanjut pelatihan.',
      explanation: `Produksi konten yang berkualitas tidak akan mencapai tujuannya tanpa strategi diseminasi yang terencana. Penjadwalan siar harus disesuaikan dengan kebiasaan audiens sasaran (misal: waktu istirahat kerja untuk aparatur dan malam hari untuk masyarakat umum).\n\nPengukuran keberhasilan konten pemerintah berfokus pada indikator keterlibatan yang substansial, bukan sekadar jumlah penonton (*vanity metrics*). Metrik yang dievaluasi meliputi:\n1. Tingkat Pemahaman: Relevansi pertanyaan warga pada kolom komentar dan penurunan aduan serupa.\n2. Tingkat Keterlibatan (Engagement Rate): Rasio simpanan (saves) dan pembagian (shares) informasi edukatif.\n3. Sentimen Publik: Proporsi tanggapan positif, netral, dan kritis terhadap kebijakan yang disosialisasikan.\n\nHasil pengukuran ini menjadi umpan balik penting untuk menyempurnakan kurikulum pelatihan berikutnya.`,
      examples: [
        'Menyusun kalender editorial konten mingguan yang membagi tema edukasi, informasi layanan cepat, dan berita capaian kinerja.',
        'Menganalisis laporan analitik bulanan untuk menentukan format konten mana yang paling efektif mengedukasi warga desa binaan.',
      ],
      practiceSteps: [
        'Tentukan 3 metrik utama KPI komunikasi untuk program pelatihan Anda.',
        'Rancang jadwal tayang mingguan (editorial calendar) yang realistis bagi tim kehumasan.',
        'Siapkan draf template laporan tindak lanjut untuk disampaikan kepada pimpinan instansi.',
      ],
      caseStudyOrExercise:
        'Latihan Akhir: Susunlah rencana aksi diseminasi (Action Plan) selama 30 hari pasca-pelatihan di instansi masing-masing lengkap dengan target KPI ketercapaian.',
    },
  ];

  // Pick chapters up to chapterCount
  const sections = masterChapters.slice(0, chapterCount);

  const material: MaterialOutput = {
    id: `mat-${id}`,
    projectId: id,
    title: `Buku Panduan Materi Pelatihan: ${input.trainingName}`,
    summary:
      input.description ||
      `Materi ini memberikan panduan komprehensif tentang ${input.trainingName}, membekali peserta dengan kompetensi teknis, wawasan konseptual, dan kepatuhan terhadap etika tata kelola digital BLSDM Komdigi Surabaya.`,
    learningObjectives: objectives,
    sections,
    summaryNotes:
      customNotes ||
      'Pemanfaatan teknologi pada pelatihan ini berfokus pada penguatan kapasitas peserta sebagai produser informasi yang bertanggung jawab, beretika, dan berorientasi pada kemaslahatan publik.',
    references: [
      {
        id: 'ref-1',
        title: 'Surat Edaran Menkominfo RI No. 9 Tahun 2023 tentang Etika Kecerdasan Artifisial',
        publisherOrAuthor: 'Kementerian Komunikasi dan Informatika Republik Indonesia',
        yearOrDate: '2023',
        url: 'https://jdih.kominfo.go.id/produk_hukum/view/id/888/t/surat+edaran+menteri+komunikasi+dan+informatika+nomor+9+tahun+2023',
        domainName: 'jdih.kominfo.go.id',
        category: 'Regulasi & Kebijakan Nasional',
        credibilityLevel: 'Tingkat 1 (Regulasi/Standar Resmi Negara)',
        verificationStatus: 'Terverifikasi',
        mappedChapters: ['Bab I: Pengantar & Etika Transformasi Digital', 'Bab III: Standar Kualitas & Mitigasi Risiko'],
        citationCode: '[REF-SE9-2023]',
        documentType: 'Surat Edaran Menteri',
        verifiedBy: 'Tim Kurikulum BLSDM Komdigi Surabaya',
        verifiedAt: '2024',
        directExcerptOrSummary: 'Memuat 9 nilai etika pemanfaatan AI bagi instansi pemerintah dan publik: inklusivitas, kemanusiaan, keamanan, aksesibilitas, transparansi, kredibilitas/akuntabilitas, pelindungan data pribadi, pembangunan berkelanjutan, serta kekayaan intelektual.',
        notes: 'Landasan hukum utama etika AI nasional yang wajib dipatuhi seluruh aparatur sipil dan penyusun konten',
      },
      {
        id: 'ref-2',
        title: 'Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)',
        publisherOrAuthor: 'Pemerintah Republik Indonesia / Lembaran Negara RI',
        yearOrDate: '2022',
        url: 'https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022',
        domainName: 'peraturan.bpk.go.id',
        category: 'Regulasi & Kebijakan Nasional',
        credibilityLevel: 'Tingkat 1 (Regulasi/Standar Resmi Negara)',
        verificationStatus: 'Terverifikasi',
        mappedChapters: ['Bab I: Pengantar & Etika Transformasi Digital', 'Bab II: Metodologi & Penerapan Praktis'],
        citationCode: '[REF-UUPDP-2022]',
        documentType: 'Undang-Undang RI',
        verifiedBy: 'Tim Kurikulum BLSDM Komdigi Surabaya',
        verifiedAt: '2024',
        directExcerptOrSummary: 'Pasal 4 & Pasal 16: Membedakan Data Pribadi Bersifat Spesifik dan Umum, serta mewajibkan Pengendali Data Pribadi untuk melakukan pelindungan data dan penyamaran (redaction) pada materi publikasi.',
        notes: 'Ketentuan pidana dan administratif atas kebocoran atau penyalahgunaan data warga negara dalam konten digital',
      },
      {
        id: 'ref-3',
        title: 'Standar Kompetensi Kerja Nasional Indonesia (SKKNI) Bidang Komunikasi dan Kehumasan Publik',
        publisherOrAuthor: 'Kementerian Ketenagakerjaan RI & Kementerian Komunikasi dan Digital RI',
        yearOrDate: '2021',
        url: 'https://standarkompetensi.kemnaker.go.id',
        domainName: 'standarkompetensi.kemnaker.go.id',
        category: 'Standar Kompetensi (SKKNI)',
        credibilityLevel: 'Tingkat 1 (Regulasi/Standar Resmi Negara)',
        verificationStatus: 'Terverifikasi',
        mappedChapters: ['Bab II: Metodologi & Penerapan Praktis', 'Bab III: Standar Kualitas & Mitigasi Risiko'],
        citationCode: '[REF-SKKNI-HUMAS]',
        documentType: 'Keputusan Menteri Ketenagakerjaan',
        verifiedBy: 'Tim Kurikulum BLSDM Komdigi Surabaya',
        verifiedAt: '2024',
        directExcerptOrSummary: 'Unit Kompetensi M.702090.001.01 s.d. M.702090.015.01: Merancang pesan komunikasi publik terpadu, memproduksi konten multimedia, dan melaksanakan diseminasi informasi instansi pemerintah.',
        notes: 'Rujukan standar kompetensi instruktur dan peserta pelatihan bidang komunikasi digital',
      },
      {
        id: 'ref-4',
        title: 'UNESCO Recommendation on the Ethics of Artificial Intelligence',
        publisherOrAuthor: 'United Nations Educational, Scientific and Cultural Organization (UNESCO)',
        yearOrDate: '2021',
        url: 'https://www.unesco.org/en/artificial-intelligence/recommendation-ethics',
        domainName: 'unesco.org',
        category: 'Standar Global & Industri (ISO/IEEE/W3C)',
        credibilityLevel: 'Tingkat 2 (Konsensus Industri & Internasional)',
        verificationStatus: 'Terverifikasi',
        mappedChapters: ['Bab I: Pengantar & Etika Transformasi Digital', 'Bab III: Standar Kualitas & Mitigasi Risiko'],
        citationCode: '[REF-UNESCO-AI]',
        documentType: 'Global Standard & Recommendation',
        verifiedBy: 'Tim Kurikulum BLSDM Komdigi Surabaya',
        verifiedAt: '2024',
        directExcerptOrSummary: 'Rekomendasi global pertama yang diadopsi oleh 193 negara anggota PBB mengenai etika AI yang berpusat pada hak asasi manusia, keadilan gender, dan transparansi algoritmik.',
        notes: 'Standar rujukan global untuk penyusunan materi kurikulum literasi digital aparatur',
      },
      {
        id: 'ref-5',
        title: 'Pedoman Manajemen Keamanan Informasi & Mitigasi Risiko AI - BSSN RI',
        publisherOrAuthor: 'Badan Siber dan Sandi Negara Republik Indonesia (BSSN)',
        yearOrDate: '2023',
        url: 'https://bssn.go.id',
        domainName: 'bssn.go.id',
        category: 'Panduan & SOP Resmi Pemerintah',
        credibilityLevel: 'Tingkat 1 (Regulasi/Standar Resmi Negara)',
        verificationStatus: 'Terverifikasi',
        mappedChapters: ['Bab II: Metodologi & Penerapan Praktis', 'Bab III: Standar Kualitas & Mitigasi Risiko'],
        citationCode: '[REF-BSSN-AI]',
        documentType: 'Panduan Teknis Keamanan Siber',
        verifiedBy: 'Tim Kurikulum BLSDM Komdigi Surabaya',
        verifiedAt: '2024',
        directExcerptOrSummary: 'Protokol pengamanan data instansi pemerintah saat berinteraksi dengan API pihak ketiga, pencegahan prompt injection, dan verifikasi integritas berkas digital.',
        notes: 'Pedoman operasional pencegahan kebocoran informasi strategis pemerintah',
      },
      {
        id: 'ref-6',
        title: 'ISO/IEC 42001:2023 Artificial Intelligence Management System (AIMS)',
        publisherOrAuthor: 'International Organization for Standardization & IEC',
        yearOrDate: '2023',
        url: 'https://www.iso.org/standard/81230.html',
        domainName: 'iso.org',
        category: 'Standar Global & Industri (ISO/IEEE/W3C)',
        credibilityLevel: 'Tingkat 2 (Konsensus Industri & Internasional)',
        verificationStatus: 'Terverifikasi',
        mappedChapters: ['Bab III: Standar Kualitas & Mitigasi Risiko'],
        citationCode: '[REF-ISO-42001]',
        documentType: 'International Standard',
        verifiedBy: 'Tim Kurikulum BLSDM Komdigi Surabaya',
        verifiedAt: '2024',
        directExcerptOrSummary: 'Standar sistem manajemen kecerdasan buatan pertama di dunia yang menetapkan tata kelola bertanggung jawab, pemantauan siklus hidup AI, dan manajemen risiko kontinu.',
        notes: 'Benchmark standar internasional penjaminan mutu tata kelola teknologi institusi',
      },
      {
        id: 'ref-7',
        title: 'W3C Web Content Accessibility Guidelines (WCAG) 2.1 Level AA',
        publisherOrAuthor: 'World Wide Web Consortium (W3C)',
        yearOrDate: '2022',
        url: 'https://www.w3.org/WAI/standards-guidelines/wcag/',
        domainName: 'w3.org',
        category: 'Standar Global & Industri (ISO/IEEE/W3C)',
        credibilityLevel: 'Tingkat 2 (Konsensus Industri & Internasional)',
        verificationStatus: 'Terverifikasi',
        mappedChapters: ['Bab II: Metodologi & Penerapan Praktis'],
        citationCode: '[REF-W3C-WCAG]',
        documentType: 'Technical Recommendation',
        verifiedBy: 'Tim Kurikulum BLSDM Komdigi Surabaya',
        verifiedAt: '2024',
        directExcerptOrSummary: 'Prinsip P-O-U-R (Perceivable, Operable, Understandable, Robust): Konten publik pemerintah wajib menyediakan teks alternatif gambar, kontras warna memadai, dan navigasi ramah disabilitas.',
        notes: 'Kewajiban aksesibilitas informasi publik agar ramah seluruh lapisan masyarakat',
      },
      {
        id: 'ref-8',
        title: 'Ejaan Bahasa Indonesia yang Disempurnakan (EYD V) & Tata Naskah Dinas Instansi',
        publisherOrAuthor: 'Badan Pengembangan dan Pembinaan Bahasa, Kemendikbudristek RI',
        yearOrDate: '2023',
        url: 'https://badanbahasa.kemdikbud.go.id',
        domainName: 'badanbahasa.kemdikbud.go.id',
        category: 'Panduan & SOP Resmi Pemerintah',
        credibilityLevel: 'Tingkat 1 (Regulasi/Standar Resmi Negara)',
        verificationStatus: 'Terverifikasi',
        mappedChapters: ['Bab I: Pengantar & Etika Transformasi Digital', 'Bab II: Metodologi & Penerapan Praktis'],
        citationCode: '[REF-EYD-KEMENDIKBUD]',
        documentType: 'Pedoman Baku Tata Bahasa',
        verifiedBy: 'Tim Kurikulum BLSDM Komdigi Surabaya',
        verifiedAt: '2024',
        directExcerptOrSummary: 'Pedoman kaidah penulisan akronim, istilah serapan teknologi digital, huruf kapital, tanda baca, serta struktur komunikasi resmi kedinasan pemerintah.',
        notes: 'Menjamin seluruh materi ajar dan produk komunikasi berpedoman pada kaidah bahasa Indonesia yang baik dan benar',
      },
    ],
    reviewStatus: 'Draft',
    updatedAt: new Date().toISOString(),
  };

  // 4. GENERATE RICH SLIDE PRESENTATION (Scaled to slideCount, ~12-16 slides for 22 JP)
  const masterSlides: SlideItem[] = [
    {
      slideNumber: 1,
      title: input.trainingName,
      mainMessage: 'Selamat Datang di Program Pelatihan Digital BLSDM Komdigi Surabaya',
      bulletPoints: [
        'Balai Pengembangan Sumber Daya Manusia dan Penelitian Komunikasi dan Digital Surabaya',
        'Kementerian Komunikasi dan Digital Republik Indonesia',
        `Alokasi Durasi: ${input.totalJP} JP (${input.trainingDays} Hari Pembelajaran Efektif)`,
        'Kompetensi: Pemahaman Konseptual, Praktik Terapan, dan Kepatuhan Etika',
      ],
      speakerNotes:
        'Sambut para peserta dengan hangat. Jelaskan bahwa pelatihan ini diselenggarakan untuk meningkatkan keunggulan kompetitif dan daya saing aparatur dalam memanfaatkan teknologi digital secara bijak.',
      visualSuggestion:
        'Tata letak cover resmi berlatar belakang biru-violet institusi dengan tipografi tebal, logo resmi Komdigi di sudut kanan atas.',
      discussionPrompt: 'Tanyakan: Apa ekspektasi terbesar dan tantangan utama yang Bapak/Ibu hadapi di instansi masing-masing?',
    },
    {
      slideNumber: 2,
      title: 'Tujuan Pembelajaran & Sasaran Kompetensi',
      mainMessage: 'Peta jalan kompetensi yang ditargetkan tercapai setelah menyelesaikan program',
      bulletPoints: objectives.map((obj, i) => `${i + 1}. ${obj}`),
      speakerNotes:
        'Paparkan setiap sasaran kompetensi secara runut. Tekankan bahwa penilaian kelulusan menuntut pencapaian pada aspek pengetahuan, keterampilan praktik, dan sikap etis.',
      visualSuggestion:
        'Diagram alur 3-4 pilar kompetensi dengan penomoran elegan dan ikon keterbacaan tinggi.',
    },
    {
      slideNumber: 3,
      title: 'Evolusi Teknologi & Urgensi Transformasi Digital',
      mainMessage: 'Mengapa aparatur pemerintah harus beradaptasi dengan perkembangan teknologi cerdas saat ini?',
      bulletPoints: [
        'Ekspektasi masyarakat terhadap pelayanan publik yang cepat, akurat, dan transparan',
        'Ledakan volume data dan kebutuhan diseminasi informasi multi-platform',
        'Peralihan dari perangkat lunak berbasis aturan kaku menuju model pembelajaran mesin yang adaptif',
      ],
      speakerNotes:
        'Bandingkan sistem manual masa lalu dengan pemanfaatan automasi cerdas modern. Ajak peserta menyadari bahwa efisiensi waktu dapat dialihkan untuk analisis strategis.',
      visualSuggestion:
        'Grafik perbandingan kurva adopsi teknologi dunia kerja dan pergeseran peran ASN dari administratif menuju analitis.',
    },
    {
      slideNumber: 4,
      title: 'Landasan Etika: SE Menkominfo No. 9 Tahun 2023',
      mainMessage: '9 Prinsip Nasional Penyelenggaraan Kecerdasan Artifisial',
      bulletPoints: [
        '1. Inklusivitas & 2. Kemanusiaan: Menghormati hak asasi dan keberagaman',
        '3. Keamanan & 4. Aksesibilitas: Menjamin perlindungan sistem dan kemudahan akses',
        '5. Transparansi & 6. Kredibilitas/Akuntabilitas: Konten dapat dipertanggungjawabkan',
        '7. Pelindungan Data Pribadi & 8. Keberlanjutan & 9. Kekayaan Intelektual',
      ],
      speakerNotes:
        'Ulas secara khusus prinsip transparansi dan perlindungan data. Ingatkan bahwa aparatur dilarang keras mengunggah data rahasia warga ke server publik.',
      visualSuggestion:
        'Diagram lingkaran 9 nilai etika dengan palet warna harmonis dan ikon pendukung.',
      discussionPrompt: 'Diskusikan: Di mana letak batas etis penggunaan AI dalam menyusun siaran pers pimpinan daerah?',
    },
    {
      slideNumber: 5,
      title: 'Kepatuhan Hukum: UU PDP No. 27 Tahun 2022',
      mainMessage: 'Memahami batasan data publik vs data pribadi dalam pembuatan konten',
      bulletPoints: [
        'Data Pribadi Umum: Nama, jenis kelamin, kewarganegaraan, agama',
        'Data Pribadi Spesifik: Rekam medis kesehatan, data biometrik, data keuangan pribadi',
        'Sanksi hukum atas kelalaian kebocoran data dan penyalahgunaan identitas',
        'Kewajiban penyamaran data (redaction) pada seluruh materi publikasi',
      ],
      speakerNotes:
        'Jelaskan konsekuensi hukum bila instansi lalai mempublikasikan dokumen yang mencantumkan NIK atau data pribadi warga tanpa izin.',
      visualSuggestion:
        'Tabel perbandingan data yang boleh dipublikasikan vs data yang wajib disamarkan (redacted).',
    },
    {
      slideNumber: 6,
      title: 'Formula Prompt Engineering: Komponen Persona & Context',
      mainMessage: 'Menentukan peran keahlian dan latar belakang instansi pada instruksi AI',
      bulletPoints: [
        'Persona: Mendefinisikan peran spesifik ("Anda adalah pranata humas pemerintah senior...")',
        'Context: Memberikan latar belakang masalah, audiens sasaran, dan tujuan komunikasi',
        'Contoh: Menyusun pesan edukasi pencegahan stunting untuk kader posyandu desa',
      ],
      speakerNotes:
        'Tunjukkan perbedaan hasil antara prompt umum tanpa persona vs prompt yang memiliki persona dan konteks tajam.',
      visualSuggestion:
        'Dua kartu perbandingan prompt: "Sebelum (Prompt Biasa)" vs "Sesudah (Prompt Terstruktur)".',
    },
    {
      slideNumber: 7,
      title: 'Formula Prompt Engineering: Komponen Task & Constraint',
      mainMessage: 'Memberikan perintah tugas terukur dan batasan format keluaran yang ketat',
      bulletPoints: [
        'Task: Kata kerja instruksional yang jelas (buatkan, susunlah, bandingkan, analisis)',
        'Constraint: Batasan kata, struktur paragraf, nada bahasa (formal-santun), dan larangan frasa klise',
        'Mencegah fenomena halusinasi dengan memerintahkan: "Gunakan hanya data yang terlampir"',
      ],
      speakerNotes:
        'Jelaskan bahwa constraint adalah kunci utama membendung jawaban mengarang dari model AI generatif.',
      visualSuggestion:
        'Checklist interaktif 4 komponen prompt (P-C-T-C) dengan highlight warna kontras.',
    },
    {
      slideNumber: 8,
      title: 'Sesi Praktik 1: Eksplorasi Formula Prompt Kedinasan',
      mainMessage: 'Latihan langsung di komputer masing-masing peserta dengan panduan instruktur',
      bulletPoints: [
        'Pilih salah satu tema layanan publik pada instansi Anda',
        'Terapkan formula P-C-T-C pada formulir kerja',
        'Uji hasil keluaran dan evaluasi kesesuaian dengan kaidah tata bahasa Indonesia baku',
      ],
      speakerNotes:
        'Beri waktu 15 menit bagi peserta untuk mencoba. Instruktur berkeliling memantau dan memberikan umpan balik langsung.',
      visualSuggestion:
        'Slide latihan dengan kotak teks petunjuk langkah demi langkah yang terbaca jelas dari kejauhan.',
      discussionPrompt: 'Minta 2 peserta membacakan hasil prompt mereka untuk dibahas bersama di kelas.',
    },
    {
      slideNumber: 9,
      title: 'Strategi Visual & Anatomi Desain Konten Publik',
      mainMessage: 'Prinsip keterbacaan, hierarki tipografi, dan kontras warna berstandar aksesibilitas',
      bulletPoints: [
        'Hierarki Visual: Judul utama (Headline) -> Sub-poin -> Keterangan pendukung',
        'Kontras Warna: Memenuhi standar WCAG AA (minimal kontras 4.5:1 untuk teks)',
        'Pemilihan Tipografi: Font sans-serif yang bersih, jelas, dan tidak dekoratif berlebihan',
        'Struktur Carousel: 1 slide = 1 pesan utama (fokus dan tidak padat kata)',
      ],
      speakerNotes:
        'Jelaskan bahwa desain yang baik bukan yang paling ramai ornamen, melainkan yang paling cepat dipahami masyarakat.',
      visualSuggestion:
        'Contoh desain infografis yang membandingkan layout yang terlalu padat (bad) vs layout rapi dengan whitespace (good).',
    },
    {
      slideNumber: 10,
      title: 'Produksi Audio & Video Singkat Multi-Platform',
      mainMessage: 'Merancang konten dinamis format vertikal (9:16) untuk Reels dan Shorts',
      bulletPoints: [
        'Formula 3 Babak: Hook (0-5 detik), Edukasi/Solusi (5-50 detik), Call to Action (50-60 detik)',
        'Pemanfaatan voiceover cerdas: Artikulasi jelas, tempo tenang, dan intonasi ramah',
        'Subtitle / Teks Berjalan: Wajib dicantumkan karena 70% pengguna menonton video tanpa suara',
      ],
      speakerNotes:
        'Tekankan pentingnya 5 detik pertama (Hook). Jika pembuka membosankan, audiens akan langsung menggulir layar.',
      visualSuggestion:
        'Grafik garis waktu video 60 detik yang memetakan elemen Hook, Core Story, dan Call to Action resmi.',
    },
    {
      slideNumber: 11,
      title: 'Deteksi Disinformasi & Forensik Citra Deepfake',
      mainMessage: 'Mengidentifikasi anomali pada konten rekayasa digital sebelum mempercayai data',
      bulletPoints: [
        'Ciri Visual: Cacat pola jari/tangan, tekstur kulit terlalu halus, dan teks latar yang acak',
        'Ciri Audio: Nada datar tanpa dinamika napas, jeda antarkata tidak natural, desis artifisial',
        'Langkah Verifikasi: Cek fakta silang ke portal resmi, periksa metadata berkas, konfirmasi sumber primer',
      ],
      speakerNotes:
        'Tampilkan contoh nyata studi kasus gambar dan video hoaks yang sempat viral di tanah air dan cara humas membongkarnya.',
      visualSuggestion:
        'Tampilan split screen: gambar asli vs gambar manipulasi AI dengan lingkaran penanda anomali.',
    },
    {
      slideNumber: 12,
      title: 'Prinsip Human-in-the-Loop & Akuntabilitas Publik',
      mainMessage: 'Manusia memegang kendali penuh, bertanggung jawab secara hukum dan moral',
      bulletPoints: [
        'AI adalah asisten pembuat draf (drafter), bukan pengambil keputusan (decision maker)',
        'Verifikasi keabsahan data, angka statistik, dan tanggal adalah kewajiban instruktur/aparatur',
        'Penyematan penanda transparansi: "Konten ini dibantu oleh AI untuk tujuan edukasi"',
      ],
      speakerNotes:
        'Ingatkan bahwa jika terjadi kesalahan informasi yang fatal, instansi tidak dapat menyalahkan aplikasi AI; humas manusialah yang bertanggung jawab.',
      visualSuggestion:
        'Bagan alur persetujuan: AI Output -> Human Fact-Checking -> Editorial Sign-off -> Public Release.',
    },
    {
      slideNumber: 13,
      title: 'Sesi Praktik 2: Bedah Kasus & Uji Cek Fakta',
      mainMessage: 'Simulasi kelompok menangani draf konten yang terindikasi mengandung kekeliruan data',
      bulletPoints: [
        'Bekerja dalam kelompok kecil (3-4 orang)',
        'Audit berkas latihan yang mengandung 3 kesalahan fakta tersembunyi',
        'Tuliskan rekomendasi perbaikan sebelum konten layak dirilis',
      ],
      speakerNotes:
        'Instruktur membagikan lembar studi kasus. Berikan waktu diskusi kelompok 20 menit dilanjutkan presentasi kilat.',
      visualSuggestion:
        'Slide studi kasus interaktif dengan timer countdown dan instruksi kelompok terstruktur.',
    },
    {
      slideNumber: 14,
      title: 'Manajemen Distribusi & Pengukuran Kinerja (KPI)',
      mainMessage: 'Mengukur dampak nyata informasi terhadap masyarakat, bukan sekadar vanity metrics',
      bulletPoints: [
        'Jadwal Penayangan (Scheduling): Menentukan jam tayang puncak (peak hours) instansi',
        'Indikator Utama: Rasio simpan (saves) & bagikan (shares) menandakan nilai edukasi tinggi',
        'Sentimen Masyarakat: Analisis respon positif, aduan layanan, dan pertanyaan tindak lanjut',
      ],
      speakerNotes:
        'Ajak peserta melihat dashboard analitik media sosial instansi dan cara menginterpretasi grafik keterlibatan warga.',
      visualSuggestion:
        'Mockup visual metrik KPI media sosial dengan indikator capaian persentase.',
    },
    {
      slideNumber: 15,
      title: 'Rencana Tindak Lanjut Pasca-Pelatihan (Action Plan)',
      mainMessage: 'Menerapkan keterampilan yang diperoleh di unit kerja masing-masing',
      bulletPoints: [
        'Penyusunan SOP internal penggunaan alat bantu digital di instansi',
        'Pembentukan tim penjaminan mutu konten sebelum tayang',
        'Pengumpulan penugasan akhir pelatihan pada platform LMS resmi',
      ],
      speakerNotes:
        'Jelaskan batas waktu pengumpulan tugas akhir di LMS untuk syarat penerbitan sertifikat kelulusan.',
      visualSuggestion:
        'Timeline 30 hari implementasi di tempat kerja pasca-pelatihan dengan milestone mingguan.',
    },
    {
      slideNumber: 16,
      title: 'Kesimpulan & Sesi Tanya Jawab Interaktif',
      mainMessage: 'Komitmen bersama mewujudkan aparatur digital yang kompeten, beretika, dan melayani',
      bulletPoints: [
        'Teknologi adalah sarana, pelayanan prima kepada warga adalah tujuan utama',
        'Tuntaskan pengerjaan Post-Test (20 Butir Soal) sebelum penutupan pelatihan',
        'Kontak Pengajar & Tim BLSDM Komdigi Surabaya',
      ],
      speakerNotes:
        'Tutup sesi presentasi dengan ucapan terima kasih dan motivasi. Buka sesi tanya jawab sebelum peserta mengerjakan Post-Test.',
      visualSuggestion:
        'Slide penutup elegan dengan logo Komdigi, foto tim pengajar, dan QR code akses kuesioner evaluasi.',
      discussionPrompt: 'Pertanyaan penutup: Apa satu komitmen perubahan yang akan Bapak/Ibu terapkan mulai besok?',
    },
  ];

  // Pick slides up to slideCount (min 8, max 24)
  const slidesList = masterSlides.slice(0, slideCount);
  // Renumber sequentially
  slidesList.forEach((s, idx) => {
    s.slideNumber = idx + 1;
  });

  const slides: SlideOutlineOutput = {
    id: `sld-${id}`,
    projectId: id,
    slides: slidesList,
    reviewStatus: 'Draft',
    updatedAt: new Date().toISOString(),
  };

  // 5. GENERATE EXACTLY 20 PRE-TEST & 20 POST-TEST QUESTIONS (100% Grounded in Training Subject Content)
  const preTest: TestQuestion[] = generateTwentyQuestions(input.trainingName, 'Pre-Test', objectives, sections);
  const postTest: TestQuestion[] = generateTwentyQuestions(input.trainingName, 'Post-Test', objectives, sections);

  const evaluation: EvaluationOutput = {
    id: `eval-${id}`,
    projectId: id,
    preTest,
    postTest,
    totalQuestions: 20,
    scoringFormula: 'Nilai = (Jumlah Jawaban Benar / 20) x 100',
    reviewStatus: 'Draft',
    updatedAt: new Date().toISOString(),
  };

  const projectPartial: Partial<TrainingProject> = {
    syllabus,
    rundown,
    material,
    slides,
    evaluation,
  };

  projectPartial.qualityCheck = runComprehensiveQualityCheck({
    id,
    input,
    ...projectPartial,
    status: 'Lengkap',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as TrainingProject);

  return projectPartial;
}

// Helper to format minutes to "HH.MM"
function formatTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}.${String(m).padStart(2, '0')}`;
}

// Generate EXACTLY 20 High-Quality Multiple Choice Questions (100% Substantive Training Content)
export function generateTwentyQuestions(
  trainingName: string,
  testType: 'Pre-Test' | 'Post-Test',
  objectives: string[],
  materialSections?: MaterialSection[]
): TestQuestion[] {
  // 20 High-Quality Substantive Questions for Pre-Test (Foundational & Diagnostic)
  const preTestItems = [
    {
      q: `Dalam pembelajaran ${trainingName}, apa karakteristik fundamental dari model Generative AI / Large Language Model (LLM) dalam memproses bahasa alami?`,
      a: 'A. Mengambil jawaban statis yang telah disimpan sebelumnya di dalam basis data tabel',
      b: 'B. Memprediksi probabilitas urutan token/kata berikutnya berdasarkan konteks instruksi yang diberikan',
      c: 'C. Menyalin dokumen utuh dari internet secara langsung tanpa modifikasi sintaksis',
      d: 'D. Menghitung formula matematika eksak dengan logika pemrograman sekuensial tertutup',
      ans: 'B' as const,
      exp: 'Model AI generatif berbasis LLM bekerja dengan menghitung probabilitas statistik kemunculan token kata berikutnya berdasarkan konteks dan perhatian (attention mechanism).',
      topic: 'Konsep & Arsitektur Model Generatif',
    },
    {
      q: 'Surat Edaran Menkominfo RI No. 9 Tahun 2023 menetapkan 9 nilai etika kecerdasan artifisial nasional. Nilai etika yang menuntut agar sistem AI dapat ditelusuri sumber informasinya dan dapat dipertanggungjawabkan kepada publik adalah...',
      a: 'A. Aksesibilitas dan Interoperabilitas',
      b: 'B. Transparansi dan Akuntabilitas/Kredibilitas',
      c: 'C. Efisiensi Biaya dan Kecepatan Pemrosesan',
      d: 'D. Sentralisasi Data dan Monopoli Algoritma',
      ans: 'B' as const,
      exp: 'Prinsip transparansi dan akuntabilitas dalam SE Menkominfo No. 9/2023 mewajibkan keterbukaan informasi dan pertanggungjawaban atas hasil pemrosesan AI kepada masyarakat.',
      topic: 'Etika Penyelenggaraan AI (SE Menkominfo 9/2023)',
    },
    {
      q: 'Berdasarkan Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP), kelompok data berikut yang tergolong sebagai Data Pribadi Spesifik yang memerlukan perlakuan pelindungan ketat adalah...',
      a: 'A. Nama lengkap dan jenis kelamin pegawai',
      b: 'B. Data rekam medis kesehatan, data biometrik, dan catatan kejahatan',
      c: 'C. Alamat surat elektronik kedinasan instansi',
      d: 'D. Jabatan fungsional dan unit kerja organisasi',
      ans: 'B' as const,
      exp: 'Pasal 4 UU PDP membedakan data pribadi umum dan spesifik. Rekam medis, biometrik, genetika, dan data anak termasuk data pribadi spesifik dengan standar perlindungan khusus.',
      topic: 'Kepatuhan Regulasi UU PDP No. 27/2022',
    },
    {
      q: 'Dalam formula 4 komponen penyusunan prompt terstruktur (Persona, Context, Task, Constraint), fungsi dari komponen "Persona" adalah...',
      a: 'A. Membatasi jumlah paragraf yang dihasilkan sistem',
      b: 'B. Mendefinisikan peran keahlian, sudut pandang profesional, dan nada bicara yang harus diadopsi model',
      c: 'C. Memasukkan kata kunci acak agar kalimat terdengar ilmiah',
      d: 'D. Menyediakan tautan URL rujukan eksternal secara manual',
      ans: 'B' as const,
      exp: 'Persona menetapkan identitas peran dan sudut pandang keahlian yang harus diemban model AI (misal: "Anda adalah pranata humas pemerintah ahli tata naskah").',
      topic: 'Metodologi Prompt Engineering (P-C-T-C)',
    },
    {
      q: 'Mengapa komponen "Constraint" (Batasan) sangat krusial dalam instruksi prompt untuk naskah publikasi kedinasan?',
      a: 'A. Agar model AI menghabiskan kuota pemrosesan lebih banyak',
      b: 'B. Mengendalikan panjang teks, nada bahasa baku, struktur keluaran, serta melarang kata-kata klise yang tidak relevan',
      c: 'C. Memaksa sistem untuk selalu memberikan jawaban yang sama tanpa variasi',
      d: 'D. Menghentikan server agar tidak memproses data pengguna lain',
      ans: 'B' as const,
      exp: 'Constraint membatasi ruang gerak model AI agar keluaran mematuhi kaidah baku, format yang diinginkan (misal tabel/bullet), dan batas panjang teks dinas.',
      topic: 'Formula Prompt: Komponen Constraint',
    },
    {
      q: 'Fenomena ketika sistem AI generatif menghasilkan informasi fiktif yang tampak meyakinkan namun tidak didukung oleh fakta atau rujukan valid dikenal sebagai...',
      a: 'A. AI Hallucination (Halusinasi AI)',
      b: 'B. Data Overfitting',
      c: 'C. Gradient Descent Error',
      d: 'D. Cache Miss Latency',
      ans: 'A' as const,
      exp: 'Halusinasi AI adalah kecenderungan model bahasa mengarang fakta, angka, atau sitasi karena pola probabilitas tanpa pemahaman epistemik faktual.',
      topic: 'Mitigasi Halusinasi & Verifikasi Akurasi',
    },
    {
      q: 'Teknik prompt yang paling efektif untuk meminimalisasi terjadinya halusinasi pada model AI saat merangkum dokumen resmi pemerintah adalah...',
      a: 'A. Menggunakan tanda seru ganda pada kalimat instruksi',
      b: 'B. Menerapkan instruksi "Gunakan hanya fakta yang tertulis eksplisit pada dokumen terlampir; jika informasi tidak ditemukan, nyatakan bahwa data tidak tersedia"',
      c: 'C. Meminta sistem menebak kesimpulan bebas tanpa batasan rujukan',
      d: 'D. Menuliskan prompt dalam huruf kapital secara keseluruhan',
      ans: 'B' as const,
      exp: 'Perintah pembatasan eksplisit (grounding) mencegah model berimprovisasi atau mengisi celah pengetahuan dengan data eksternal yang belum terverifikasi.',
      topic: 'Grounding & Mitigasi Halusinasi',
    },
    {
      q: 'Prinsip "Human-in-the-Loop" dalam alur produksi konten berbasis kecerdasan artifisial menegaskan bahwa...',
      a: 'A. Seluruh naskah publikasi wajib diketik secara manual tanpa bantuan aplikasi digital',
      b: 'B. Manusia bertindak sebagai kurator, verifikator fakta, dan pihak yang bertanggung jawab mutlak atas setiap konten yang dirilis ke publik',
      c: 'C. Model AI mengambil alih kewenangan persetujuan rilis pers pimpinan instansi',
      d: 'D. Masyarakat secara otomatis dianggap memaklumi jika terjadi kekeliruan data oleh AI',
      ans: 'B' as const,
      exp: 'Human-in-the-loop menjamin akuntabilitas moral, editorial, dan hukum tetap dipegang oleh manusia, bukan dialihkan kepada mesin cerdas.',
      topic: 'Akuntabilitas & Prinsip Human-in-the-Loop',
    },
    {
      q: 'Dalam standar aksesibilitas desain visual konten informasi publik (WCAG AA), rasio kontras warna minimum yang wajib dipenuhi antara teks dan latar belakang adalah...',
      a: 'A. Minimal 1.5 : 1',
      b: 'B. Minimal 4.5 : 1 untuk teks normal (atau 3:1 untuk teks besar berukuran 18pt+)',
      c: 'C. Minimal 10 : 1 untuk seluruh elemen grafis',
      d: 'D. Kontras warna tidak dipersyaratkan asalkan tata letak tampak estetis',
      ans: 'B' as const,
      exp: 'Pedoman WCAG 2.1 level AA mensyaratkan rasio kontras 4.5:1 untuk teks normal agar dapat terbaca jelas oleh masyarakat, termasuk mereka dengan keterbatasan visual ringan.',
      topic: 'Desain Visual & Standar Aksesibilitas',
    },
    {
      q: 'Pada produksi konten video pendek edukasi publik (Shorts/Reels 9:16), fungsi utama dari "Hook" pada 3 hingga 5 detik pertama tayangan adalah...',
      a: 'A. Menampilkan daftar riwayat hidup lengkap pengisi suara',
      b: 'B. Menarik atensi audiens, memicu rasa ingin tahu, dan mencegah pengguna menggulir layar (*stop the scroll*)',
      c: 'C. Menampilkan logo sponsor instansi berukuran layar penuh',
      d: 'D. Memutar musik dengan volume paling maksimal',
      ans: 'B' as const,
      exp: 'Hook awal (0-5 detik) merupakan penentu retensi video digital untuk menghentikan guliran pengguna dan mengantarkan pada substansi pesan edukasi.',
      topic: 'Produksi Media Multi-Kanal (Video Pendek)',
    },
    {
      q: 'Salah satu tanda visual (anomali) yang kerap ditemukan pada citra rekayasa buatan AI (deepfake image) yang belum sempurna adalah...',
      a: 'A. Ukuran berkas selalu berformat PDF',
      b: 'B. Ketidakteraturan pola anatomi jari tangan, tekstur kulit yang terlalu mulus tanpa pori, dan teks latar yang distorsi/tidak terbaca',
      c: 'C. Citra selalu berubah menjadi monokrom hitam putih',
      d: 'D. Gambar tidak dapat dibuka pada peramban web modern',
      ans: 'B' as const,
      exp: 'Model difusi sering mengalami kesulitan merekonstruksi simetri tangan/jari, geometri latar belakang, dan tulisan tipografi yang logis dalam pemandangan gambar sintetis.',
      topic: 'Deteksi Disinformasi & Forensik Citra AI',
    },
    {
      q: 'Dalam mendeteksi kloning suara buatan AI (voice clone audio) yang disalahgunakan untuk penipuan atau hoaks, indikator auditori utama yang mencurigakan adalah...',
      a: 'A. Suara terdengar memiliki variasi dialek lokal',
      b: 'B. Irama vokal yang monoton, hilangnya desah napas alami manusia di antara kata, serta nada yang datar secara konstan',
      c: 'C. Berkas audio memiliki durasi lebih dari 10 detik',
      d: 'D. Tingkat kenyaringan suara yang dapat diatur oleh pendengar',
      ans: 'B' as const,
      exp: 'Kloning audio AI sintetis sering kali kurang memiliki fluktuasi respirasi (tarikan napas alami) dan dinamika emosional spontan yang khas pada ucapan manusia asli.',
      topic: 'Forensik Audio Tiruan & Deteksi Deepfake',
    },
    {
      q: 'Tujuan utama dari pemberian penanda transparansi (*watermark* atau label "Dibuat dengan bantuan AI") pada konten publikasi instansi adalah...',
      a: 'A. Mengurangi reputasi instansi di mata masyarakat',
      b: 'B. Memenuhi hak publik atas keterbukaan informasi dan menjaga kejujuran intelektual mengenai asal-usul materi',
      c: 'C. Menghindari kewajiban membayar pajak media sosial',
      d: 'D. Menurunkan peringkat algoritma mesin pencari',
      ans: 'B' as const,
      exp: 'Penyematan label transparansi merupakan kewajiban etis yang melindungi hak warga negara untuk mengetahui apakah konten yang mereka konsumsi merupakan rekayasa generatif.',
      topic: 'Transparansi & Etika Publikasi Digital',
    },
    {
      q: 'Dalam strategi komunikasi publik digital instansi pemerintah, "Brand Voice" yang ideal mencerminkan karakteristik...',
      a: 'A. Kaku, dingin, menggunakan jargon birokrasi yang sulit dipahami warga awam',
      b: 'B. Berwibawa, ramah, melayani, empatik, serta menggunakan bahasa Indonesia baku yang lugas dan solutif',
      c: 'C. Sarkastis, konfrontatif, dan sering membalas kritik masyarakat dengan nada emosional',
      d: 'D. Menggunakan singkatan gaul tidak resmi dalam seluruh siaran pers resmi',
      ans: 'B' as const,
      exp: 'Karakter suara instansi publik harus menjaga marwah kenegaraan dengan bahasa baku yang komunikatif, empatik, dan berfokus pada solusi pelayanan warga.',
      topic: 'Strategi Komunikasi & Tone of Voice Kedinasan',
    },
    {
      q: 'Aset visual berlisensi "Creative Commons Non-Commercial Share-Alike" (CC BY-NC-SA) dapat dimanfaatkan untuk keperluan...',
      a: 'A. Dijual kembali sebagai produk komersial berbayar tanpa mencantumkan atribusi',
      b: 'B. Digunakan dalam materi edukasi publik nirlaba dengan kewajiban mencantumkan kredit pencipta dan membagikan ulang di bawah lisensi yang setara',
      c: 'C. Diklaim sebagai hak cipta pribadi milik instansi secara sepihak',
      d: 'D. Dimusnahkan dari seluruh arsip perpustakaan digital',
      ans: 'B' as const,
      exp: 'Lisensi CC BY-NC-SA mengizinkan pemanfaatan nirlaba dengan syarat atribusi (BY), non-komersial (NC), dan pembagian lisensi turunan yang sama (SA).',
      topic: 'Hak Cipta, HAKI, & Lisensi Konten Digital',
    },
    {
      q: 'Penyediaan teks takarir (closed captions/subtitle) pada konten video edukasi publik sangat penting karena...',
      a: 'A. Menghabiskan sisa ruang simpan pada server media sosial',
      b: 'B. Membantu aksesibilitas penyandang disabilitas pendengaran dan mendukung mayoritas audiens yang menonton video dalam mode hening (tanpa suara)',
      c: 'C. Menggantikan peran juru bicara instansi secara otomatis',
      d: 'D. Merupakan syarat wajib pendaftaran domain web kedinasan',
      ans: 'B' as const,
      exp: 'Takarir menjamin inklusivitas bagi warga tuli/kurang dengar serta melayani lebih dari 70% pengguna ponsel yang memutar video tanpa mengaktifkan pelantang suara.',
      topic: 'Inklusivitas & Aksesibilitas Konten Multi-Kanal',
    },
    {
      q: 'Indikator Kinerja Utama (KPI) media sosial yang paling tepat untuk mengukur keberhasilan edukasi informasi penting kepada masyarakat adalah...',
      a: 'A. Jumlah tayangan acak (impressions) tanpa adanya interaksi',
      b: 'B. Rasio simpan (*saves*) dan bagikan (*shares*) yang menunjukkan bahwa konten dianggap bernilai guna tinggi untuk disimpan dan disebarluaskan',
      c: 'C. Jumlah pengikut palsu yang dibeli oleh pihak ketiga',
      d: 'D. Kecepatan koneksi internet di kantor instansi pengunggah',
      ans: 'B' as const,
      exp: 'Tindakan menyimpan (save) dan membagikan (share) merupakan sinyal interaksi berbobot tinggi (*meaningful engagement*) bahwa materi bermanfaat nyata bagi masyarakat.',
      topic: 'Pengukuran Efektivitas Konten (KPI & Metrik)',
    },
    {
      q: 'Langkah pertama yang paling tepat dilakukan instruktur atau aparatur saat menerima laporan isu disinformasi yang menyangkut pelayanan instansinya adalah...',
      a: 'A. Segera membalas dengan kemarahan di kolom komentar publik',
      b: 'B. Mengonfirmasi fakta ke basis data dan unit teknis terkait (sumber primer) sebelum menyusun materi klarifikasi resmi',
      c: 'C. Menghapus akun media sosial instansi agar tidak diserang warganet',
      d: 'D. Mengabaikan isu tersebut dengan asumsi masyarakat akan lupa dengan sendirinya',
      ans: 'B' as const,
      exp: 'Penanganan krisis komunikasi wajib didahului verifikasi silang ke sumber data primer dan otoritas teknis guna memastikan akurasi klarifikasi.',
      topic: 'Manajemen Krisis & Penanggulangan Disinformasi',
    },
    {
      q: 'Metode prompting yang memberikan satu atau beberapa contoh pasangan input-output konkret kepada model AI sebelum meminta hasil akhir disebut...',
      a: 'A. Zero-Shot Prompting',
      b: 'B. Few-Shot Prompting',
      c: 'C. Negative Prompting',
      d: 'D. Temperature Injection',
      ans: 'B' as const,
      exp: 'Few-shot prompting memberikan model contoh-contoh pola keluaran yang diharapkan sehingga model dapat meniru gaya bahasa dan struktur naskah dengan konsisten.',
      topic: 'Teknik Lanjutan Prompting (Few-Shot Learning)',
    },
    {
      q: 'Alur penjaminan mutu redaksional (Quality Assurance) naskah publikasi kedinasan sebelum dipublikasikan ke kanal resmi meliputi tahapan...',
      a: 'A. Penulisan draf AI -> Publikasi instan tanpa pemeriksaan',
      b: 'B. Perumusan draf AI -> Uji verifikasi fakta -> Penyesuaian tata bahasa dinas -> Persetujuan pejabat berwenang -> Publikasi',
      c: 'C. Pengunggahan materi -> Koreksi data setelah timbul protes dari masyarakat',
      d: 'D. Penerjemahan naskah ke berbagai bahasa tanpa memeriksa kebenaran data awal',
      ans: 'B' as const,
      exp: 'Standar mutu publikasi kedinasan menuntut verifikasi bertingkat: cek fakta, kepatuhan tata bahasa PUEBI, dan persetujuan penanggung jawab editorial sebelum tayang.',
      topic: 'Alur Penjaminan Mutu & Manajemen Editorial',
    },
  ];

  // 20 High-Quality Substantive Questions for Post-Test (Application & Analytical Mastery)
  const postTestItems = [
    {
      q: `Sebagai tindak lanjut pembelajaran ${trainingName}, apa implikasi utama dari sifat nondeterministik model Large Language Model terhadap naskah dinas yang dihasilkan?`,
      a: 'A. Sistem selalu menghasilkan jawaban yang identik kata-demi-kata setiap kali tombol kirim ditekan',
      b: 'B. Prompt yang sama dapat menghasilkan susunan kalimat yang bervariasi, sehingga kurasi manusia mutlak diperlukan untuk memastikan konsistensi pesan',
      c: 'C. Model secara otomatis menghapus rekaman obrolan pengguna setelah 5 menit',
      d: 'D. Naskah yang dihasilkan tidak dapat diedit kembali oleh perangkat lunak pengolah kata',
      ans: 'B' as const,
      exp: 'Sifat probabilistik model generatif menghasilkan variasi sintaksis respons, sehingga instruktur/editor manusia wajib mengawal konsistensi pesan dinas.',
      topic: 'Analisis Karakteristik AI Generatif',
    },
    {
      q: 'Sebuah instansi berencana menggunakan alat AI otomatis untuk menyeleksi kelayakan permohonan bantuan sosial warga. Berdasarkan SE Menkominfo No. 9 Tahun 2023, kewajiban apa yang harus dipenuhi instansi?',
      a: 'A. Membiarkan sistem AI mengambil keputusan mutlak tanpa intervensi pegawai pemerintah',
      b: 'B. Memastikan adanya mekanisme audit manusia, penjelasan logika rekomendasi (explainability), dan penjaminan tidak adanya bias diskriminatif',
      c: 'C. Menutup akses publik terhadap kriteria penerima bantuan',
      d: 'D. Mengganti seluruh staf penerima pengaduan dengan algoritma otomatisasi',
      ans: 'B' as const,
      exp: 'Prinsip akuntabilitas, transparansi, dan kemanusiaan mewajibkan sistem berbasis AI dapat diaudit, terbebas dari bias data, serta memiliki jalur banding bagi warga terdampak.',
      topic: 'Penerapan Prinsip Etika AI (Kasus Pelayanan Publik)',
    },
    {
      q: 'Dalam menyiapkan rilis publikasi mengenai profil UMKM binaan instansi, tindakan manakah yang melanggar ketentuan UU PDP No. 27 Tahun 2022 jika diunggah tanpa izin pemilik?',
      a: 'A. Mencantumkan nama produk olahan kuliner dan tautan toko daring UMKM',
      b: 'B. Menampilkan foto Nomor Induk Kependudukan (NIK) pada KTP dan nomor rekening perbankan pribadi pelaku usaha',
      c: 'C. Menjelaskan capaian omzet usaha secara umum dalam narasi berita',
      d: 'D. Membagikan jadwal penyelenggaraan pameran produk di aula kantor balai',
      ans: 'B' as const,
      exp: 'NIK dan data rekening bank perseorangan merupakan data pribadi yang dilarang disebarluaskan secara terbuka tanpa dasar hukum pemrosesan atau persetujuan tegas pemilik data.',
      topic: 'Audit Kepatuhan Pelindungan Data Pribadi (UU PDP)',
    },
    {
      q: 'Seorang staf humas ingin menyusun siaran pers penanganan stunting dengan bantuan AI. Manakah rancangan prompt yang paling memenuhi formula Persona, Context, Task, dan Constraint?',
      a: 'A. "Tolong buatkan artikel tentang stunting."',
      b: 'B. "Sebagai pranata humas pemerintah senior (P), buatkan draf siaran pers edukasi stunting untuk kader posyandu (C) sebanyak 300-400 kata dengan nada santun-formal (T) menggunakan bahasa Indonesia baku PUEBI dan sertakan 3 poin aksi tanpa istilah medis rumit (C)."',
      c: 'C. "Jelaskan apa itu stunting secara panjang lebar dan ilmiah secepat mungkin."',
      d: 'D. "Tuliskan opini Anda mengenai penanganan gizi buruk di Indonesia sekarang."',
      ans: 'B' as const,
      exp: 'Pilihan B secara utuh dan terperinci menyajikan Persona (humas senior), Context (kader posyandu), Task (siaran pers 300-400 kata), dan Constraint (PUEBI, 3 poin aksi, tanpa jargon medis rumit).',
      topic: 'Aplikasi Praktis Formula Prompt P-C-T-C',
    },
    {
      q: 'Jika dalam penyusunan laporan kegiatan berkala dengan AI ditemukan data statistik capaian yang diragukan kebenarannya, tindakan paling tepat sesuai integritas referensi adalah...',
      a: 'A. Tetap mencantumkannya agar laporan tampak memuat data kuantitatif yang lengkap',
      b: 'B. Mengonfirmasi silang ke dokumen laporan resmi atau basis data instansi; jika belum terverifikasi, tandai dengan status "Perlu verifikasi"',
      c: 'C. Mengarang tautan URL lembaga riset fiktif agar terkesan ilmiah',
      d: 'D. Mengganti seluruh data capaian dengan angka perkiraan pribadi',
      ans: 'B' as const,
      exp: 'Keterlacakan dan integritas data menuntut penandaan jujur (*Perlu verifikasi*) dan konfirmasi silang ke data primer sebelum dipublikasikan.',
      topic: 'Audit Integritas Data & Rujukan',
    },
    {
      q: 'Dalam skenario konten rilis pers instansi yang telah terbit dan ternyata memuat kesalahan data faktual yang bersumber dari keluaran AI, pihak manakah yang memikul tanggung jawab hukum dan etis di mata publik?',
      a: 'A. Perusahaan penyedia aplikasi AI komersial luar negeri',
      b: 'B. Instansi dan instruktur/pejabat yang menandatangani dan menyetujui penerbitan rilis pers tersebut',
      c: 'C. Server basis data tempat penyimpanan dokumen cadangan',
      d: 'D. Operator jaringan internet penyedia koneksi Wi-Fi',
      ans: 'B' as const,
      exp: 'Secara hukum dan kelembagaan, pertanggungjawaban melekat pada instansi penerbit dan manusia yang melakukan pengesahan (*sign-off*), bukan pada perangkat lunak AI.',
      topic: 'Akuntabilitas Hukum & Etika Publikasi',
    },
    {
      q: 'Pada perancangan konten infografis digital 1 slide (single post), kesalahan fatal dalam penerapan hierarki tipografi visual yang sering terjadi adalah...',
      a: 'A. Menggunakan satu jenis font sans-serif yang bersih dan mudah dibaca',
      b: 'B. Menggunakan ukuran dan ketebalan font yang persis sama antara judul utama, sub-judul, dan isi keterangan sehingga pembaca bingung membedakan urutan baca',
      c: 'C. Memberikan ruang kosong (*white space*) yang cukup di sekeliling teks',
      d: 'D. Menempatkan logo instansi di posisi sudut yang konsisten',
      ans: 'B' as const,
      exp: 'Hierarki visual menuntut pembedaan tegas skala (skalabilitas ukuran dan ketebalan font) agar mata pembaca dapat memindai informasi dari yang paling penting ke rincian pendukung.',
      topic: 'Hierarki Visual & Tipografi Konten Digital',
    },
    {
      q: 'Untuk memastikan konten grafis di media sosial dapat diakses oleh masyarakat dengan keterbatasan penglihatan warna (buta warna), langkah mitigasi desain yang tepat adalah...',
      a: 'A. Hanya mengandalkan warna hijau dan merah untuk membedakan status "Berhasil" dan "Gagal"',
      b: 'B. Mengombinasikan kode warna dengan ikon visual yang jelas (misal: tanda centang untuk berhasil, tanda silang untuk gagal) serta label teks deskriptif',
      c: 'C. Menghilangkan seluruh teks dan hanya menyajikan gambar abstrak',
      d: 'D. Menggunakan kontras warna yang sangat redup mendekati abu-abu',
      ans: 'B' as const,
      exp: 'Prinsip desain aksesibel melarang penggunaan warna sebagai satu-satunya indikator pembeda informasi; harus dipadukan dengan ikon bentuk atau teks penjelas.',
      topic: 'Desain Universal & Aksesibilitas Sensorik',
    },
    {
      q: 'Berdasarkan evaluasi analitik konten video pendek (Reels/Shorts), grafik retensi penonton menunjukkan penurunan tajam (*drop-off*) sebesar 60% pada detik ke-4. Rekomendasi perbaikan yang paling relevan adalah...',
      a: 'A. Memperpanjang animasi logo pembuka (*bumper in*) menjadi 10 detik',
      b: 'B. Menghapus intro seremonial yang lambat dan langsung memulai video dengan pernyataan pemantik masalah (*visual/audio hook*) yang relevan dalam 3 detik pertama',
      c: 'C. Menghapus suara narasi dan menggantinya dengan teks berjalan berukuran kecil',
      d: 'D. Mengunggah ulang video yang sama pada tengah malam',
      ans: 'B' as const,
      exp: 'Penurunan tajam di detik awal menandakan pembuka video tidak mampu memikat atensi penonton; solusi terbaik adalah memangkas intro bertele-tele dan menyajikan hook pemantik masalah.',
      topic: 'Evaluasi Retensi & Optimalisasi Video Multi-Kanal',
    },
    {
      q: 'Saat memverifikasi foto peristiwa bencana alam yang beredar luas di media sosial dan dicurigai sebagai rekayasa generatif AI, langkah forensik digital pertama yang paling praktis adalah...',
      a: 'A. Menanyakan langsung kepada warganet anonim di kolom komentar',
      b: 'B. Menjalankan penelusuran gambar terbalik (*Reverse Image Search*) di mesin pencari dan memeriksa konsistensi pantulan cahaya serta bayangan fisik objek',
      c: 'C. Mengubah format berkas gambar dari JPEG menjadi PNG',
      d: 'D. Mengunggah foto tersebut ke media sosial instansi dengan tulisan "Apakah ini asli?"',
      ans: 'B' as const,
      exp: 'Reverse image search membantu menemukan waktu publikasi awal foto di internet, sementara pemeriksaan arah bayangan dan refleksi mata membantu mendeteksi distorsi sintetik AI.',
      topic: 'Teknik Verifikasi Cek Fakta & Reverse Image Search',
    },
    {
      q: 'Beredar rekaman audio pendek di aplikasi pesan instan yang mengklaim suara kepala dinas mengumumkan pembagian dana tunai mendadak. Tindakan mitigasi cepat yang wajib diambil pranata humas adalah...',
      a: 'A. Menunggu hingga isu tersebut diberitakan oleh media cetak nasional',
      b: 'B. Mengonfirmasi langsung ke pimpinan terkait, lalu segera menerbitkan infografis stempel "HOAKS" beserta penjelasan fakta resmi melalui seluruh kanal terverifikasi instansi',
      c: 'C. Menghubungi pengunggah pertama dan mengajaknya berdebat di grup WhatsApp',
      d: 'D. Membuat rekaman tandingan menggunakan aplikasi pengubah suara anonim',
      ans: 'B' as const,
      exp: 'Mitigasi krisis disinformasi menuntut klarifikasi cepat yang didukung bukti stempel faktual (*debunking*) melalui saluran komunikasi resmi pemerintah guna membendung kepanikan warga.',
      topic: 'Mitigasi Hoaks Cepat & Komunikasi Krisis',
    },
    {
      q: 'Penyusunan penafian (*disclaimer*) pada publikasi artikel ringkasan kebijakan yang dibuat dengan asistensi AI harus dirumuskan dengan tujuan...',
      a: 'A. Melepaskan seluruh tanggung jawab kelembagaan instansi dari isi naskah',
      b: 'B. Memberikan transparansi kepada pembaca bahwa draf awal disusun dengan bantuan teknologi cerdas dan telah ditinjau serta disahkan oleh tim kurikulum/redaksi resmi',
      c: 'C. Memenuhi syarat agar artikel tersebut tidak dapat dibaca oleh masyarakat umum',
      d: 'D. Mempersulit warga dalam mengajukan permohonan informasi publik',
      ans: 'B' as const,
      exp: 'Disclaimer transparansi menegaskan bahwa penggunaan AI dilakukan secara etis dan bertanggung jawab dengan supervisi kuratorial manusia yang kompeten.',
      topic: 'Standar Penafian & Transparansi Institusional',
    },
    {
      q: 'Dalam penyuntingan naskah yang dihasilkan model AI generatif, penyesuaian manakah yang wajib dilakukan agar selaras dengan tata naskah dinas pemerintah?',
      a: 'A. Mengganti kata baku seperti "efektif" dan "analisis" menjadi bentuk tidak baku',
      b: 'B. Menyelaraskan istilah asing dengan padanan bahasa Indonesia resmi (misal: "unggah" untuk upload, "daring" untuk online) serta memastikan struktur kalimat subjek-predikat lengkap',
      c: 'C. Menghapus seluruh tanda baca titik dan koma agar naskah terlihat ringkas',
      d: 'D. Menyisipkan bahasa percakapan santai di seluruh naskah keputusan pimpinan',
      ans: 'B' as const,
      exp: 'Tata naskah dinas pemerintah berpedoman pada kaidah PUEBI, penggunaan padanan istilah resmi bahasa Indonesia, dan ketegasan struktur kalimat kedinasan.',
      topic: 'Tata Naskah Kedinasan & Standardisasi Bahasa',
    },
    {
      q: 'Menurut prinsip hak kekayaan intelektual (HAKI) dan praktik umum terkini, status perlindungan hak cipta atas karya seni visual murni yang dihasilkan 100% oleh sistem AI tanpa sentuhan kreatif manusia adalah...',
      a: 'A. Otomatis menjadi hak cipta milik pengembang aplikasi AI selamanya',
      b: 'B. Umumnya tidak memenuhi syarat perlindungan hak cipta sebagai karya manusia (*human authorship*), kecuali jika terdapat kontribusi kreatif substansial dari pencipta manusia',
      c: 'C. Dilindungi sebagai rahasia militer negara',
      d: 'D. Berhak mendapatkan royalti paten internasional seumur hidup',
      ans: 'B' as const,
      exp: 'Doktrin hukum hak cipta di berbagai yurisdiksi menetapkan bahwa karya cipta mensyaratkan adanya daya cipta manusia (*human authorship*); karya murni buatan mesin tanpa arahan kreatif manusia tidak memiliki perlindungan hak cipta orisinal.',
      topic: 'Hukum Kekayaan Intelektual & Batasan Hak Cipta AI',
    },
    {
      q: 'Dalam pembuatan takarir (closed caption) video ramah disabilitas, penulisan deskripsi suara non-vokal yang tepat adalah...',
      a: 'A. Mengabaikan seluruh suara latar belakang dan hanya menuliskan kata-kata yang diucapkan',
      b: 'B. Mencantumkan penanda dalam kurung siku untuk suara penting (misal: [suara tepuk tangan hadirin], [musik bertempo lambat]) guna membangun konteks suasana bagi penonton tunarungu',
      c: 'C. Menuliskan lirik lagu secara acak tanpa sinkronisasi waktu',
      d: 'D. Menutup seluruh layar dengan teks keterangan latar',
      ans: 'B' as const,
      exp: 'Takarir ramah disabilitas (*closed captions*) wajib menyertakan petunjuk audio non-bicara yang relevan (dalam tanda kurung) agar penonton tunarungu dapat menangkap nuansa emosional dan konteks adegan.',
      topic: 'Standar Aksesibilitas Takarir Audio-Visual',
    },
    {
      q: 'Sebuah akun media sosial instansi mencatatkan kenaikan jumlah pengikut (*followers*) secara drastis, namun rasio interaksi (engagement rate) mendekati 0%. Evaluasi analitik yang paling tepat dari kondisi ini adalah...',
      a: 'A. Konten yang diunggah sangat efektif dan disukai oleh masyarakat',
      b: 'B. Lonjakan pengikut kemungkinan berasal dari akun bot/tidak aktif (*vanity metric*) yang tidak menghasilkan dampak diseminasi informasi nyata bagi warga',
      c: 'C. Pengaturan privasi akun harus segera diubah menjadi privat',
      d: 'D. Instansi harus berhenti mempublikasikan seluruh informasi layanan publik',
      ans: 'B' as const,
      exp: 'Tingginya angka pengikut tanpa disertai interaksi mencerminkan metriks kesia-siaan (*vanity metric*); capaian komunikasi publik yang sehat tercermin dari interaksi aktif dan umpan balik warga.',
      topic: 'Analisis Metrik Kinerja (Vanity Metrics vs Real Impact)',
    },
    {
      q: 'Dalam format klarifikasi hoaks (debunking), struktur penyusunan materi infografis yang paling efektif untuk mencegah audiens mengingat kembali informasi palsu adalah...',
      a: 'A. Menuliskan judul hoaks dengan huruf sangat besar tanpa memberikan keterangan bantahan yang jelas',
      b: 'B. Menempatkan fakta yang benar sebagai fokus utama (Headline), menyertakan bukti rujukan primer, dan memberi cap stempel HOAKS yang tegas pada narasi palsu',
      c: 'C. Membagikan ulang video hoaks tersebut secara utuh agar masyarakat tahu',
      d: 'D. Meminta warganet untuk menyimpulkan sendiri kebenaran informasi',
      ans: 'B' as const,
      exp: 'Kaidah *fact-checking* modern menekankan teknik *Truth Sandwich*: mulai dengan fakta yang benar, paparkan klaim salah dengan penanda tegas, lalu tutup kembali dengan penegasan fakta yang benar.',
      topic: 'Teknik Komunikasi Klarifikasi (Fact-Checking Design)',
    },
    {
      q: 'Teknik "Chain-of-Thought Prompting" (Rantai Penalaran) diterapkan saat pengguna meminta AI menyelesaikan permasalahan kompleks dengan cara...',
      a: 'A. Meminta model langsung memberikan kesimpulan tanpa penjelasan perantara',
      b: 'B. Memerintahkan model untuk "menjelaskan langkah-langkah pemikiran logis secara bertahap sebelum menarik kesimpulan akhir"',
      c: 'C. Mengulang pertanyaan yang sama sebanyak sepuluh kali berturut-turut',
      d: 'D. Mengunggah gambar diagram alur tanpa instruksi teks pendukung',
      ans: 'B' as const,
      exp: 'Chain-of-thought (CoT) mendorong model mengurai langkah-langkah penalaran intermediate sehingga mengurangi kesalahan logika dan meningkatkan akurasi analisis data.',
      topic: 'Teknik Rekayasa Prompt Lanjutan (Chain-of-Thought)',
    },
    {
      q: 'Tindakan yang berpotensi menimbulkan kerentanan keamanan siber dalam penggunaan aplikasi kecerdasan artifisial publik di lingkungan kantor instansi adalah...',
      a: 'A. Menggunakan akun resmi berotentikasi dua faktor (2FA) saat masuk ke sistem',
      b: 'B. Memasukkan berkas konfigurasi peladen internal, kode rahasia akses API, atau data transaksi keuangan internal ke dalam kolom percakapan AI komersial daring',
      c: 'C. Menggunakan peramban web resmi yang telah diperbarui versinya',
      d: 'D. Mengunduh bahan ajar digital dari portal resmi pemerintah',
      ans: 'B' as const,
      exp: 'Mengunggah kredensial, kunci API, atau data sensitif ke server platform AI publik berisiko menyebabkan kebocoran rahasia negara dan pelanggaran keamanan informasi institusi.',
      topic: 'Keamanan Informasi & Kepatuhan Siber',
    },
    {
      q: 'Dalam kerangka penjaminan mutu (QA) pelatihan digital, apa tolok ukur utama yang menunjukkan bahwa instrumen evaluasi (Pre-test dan Post-test) telah selaras (*aligned*) dengan kurikulum pembelajaran?',
      a: 'A. Setiap butir soal menanyakan durasi menit jam pelajaran atau bobot nilai ujian',
      b: 'B. Butir-butir soal secara seimbang memetakan dan mengukur ketercapaian tujuan pembelajaran serta materi pokok yang tercantum di dalam silabus dan modul bahan ajar',
      c: 'C. Kunci jawaban seluruh butir soal selalu merupakan pilihan A',
      d: 'D. Soal evaluasi dibuat sesulit mungkin agar tidak ada peserta yang mampu menjawab benar',
      ans: 'B' as const,
      exp: 'Prinsip keselarasan instruksional (*constructive alignment*) menuntut instrumen penilaian menguji secara valid tujuan pembelajaran dan kompetensi inti materi yang diajarkan.',
      topic: 'Keselarasan Instruksional & Penjaminan Mutu Evaluasi',
    },
  ];

  const sourceItems = testType === 'Pre-Test' ? preTestItems : postTestItems;

  return sourceItems.map((item, idx) => ({
    number: idx + 1,
    question: item.q,
    options: {
      A: item.a.substring(3),
      B: item.b.substring(3),
      C: item.c.substring(3),
      D: item.d.substring(3),
    },
    correctAnswer: item.ans,
    explanation: item.exp,
    topic: item.topic,
    mappedObjective:
      objectives[idx % objectives.length] ||
      (materialSections && materialSections[idx % materialSections.length]?.title) ||
      `Kompetensi ${trainingName}`,
  }));
}

// Unified client generate function
export async function generateTrainingProject(
  input: TrainingInput,
  id: string,
  customNotes?: string,
  creatorProfile?: InstructorProfile
): Promise<TrainingProject> {
  const newProject: TrainingProject = {
    id,
    creatorId: creatorProfile?.id,
    creatorName: creatorProfile?.name || 'Instruktur BLSDM',
    creatorNip: creatorProfile?.nip || '-',
    creatorRole: creatorProfile?.role || 'Instruktur BLSDM',
    isShared: true,
    lastEditedBy: creatorProfile?.name || 'Instruktur BLSDM',
    input,
    status: 'Draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'all', input: { ...input, additionalNotes: customNotes || input.additionalNotes } }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.syllabus && input.selectedOutputs.syllabus) {
        newProject.syllabus = { ...data.syllabus, id: `syl-${id}`, projectId: id, reviewStatus: 'Draft', updatedAt: new Date().toISOString() };
      }
      if (data.rundown && input.selectedOutputs.rundown) {
        const validated = validateRundownSchedule(data.rundown.days || [], input.totalJP);
        newProject.rundown = {
          ...data.rundown,
          id: `run-${id}`,
          projectId: id,
          totalJP: validated.actualJP,
          synchronousJP: validated.synchronousJP,
          asynchronousJP: validated.asynchronousJP,
          validation: validated,
          reviewStatus: 'Draft',
          updatedAt: new Date().toISOString(),
        };
      }
      if (data.material && input.selectedOutputs.fullMaterial) {
        newProject.material = { ...data.material, id: `mat-${id}`, projectId: id, reviewStatus: 'Draft', updatedAt: new Date().toISOString() };
      }
      if (data.slides && input.selectedOutputs.slideMaterial) {
        newProject.slides = { ...data.slides, id: `sld-${id}`, projectId: id, reviewStatus: 'Draft', updatedAt: new Date().toISOString() };
      }
      if (data.evaluation && input.selectedOutputs.evaluations) {
        newProject.evaluation = { ...data.evaluation, id: `eval-${id}`, projectId: id, reviewStatus: 'Draft', updatedAt: new Date().toISOString() };
      }

      // Fill in any missing pieces with strict high-fidelity fallback if model omitted something
      const fallback = generateLocalFallback(input, id, customNotes);
      if (!newProject.syllabus && input.selectedOutputs.syllabus) newProject.syllabus = fallback.syllabus;
      if (!newProject.rundown && input.selectedOutputs.rundown) newProject.rundown = fallback.rundown;
      if (!newProject.material && input.selectedOutputs.fullMaterial) newProject.material = fallback.material;
      if (!newProject.slides && input.selectedOutputs.slideMaterial) newProject.slides = fallback.slides;
      if (!newProject.evaluation && input.selectedOutputs.evaluations) newProject.evaluation = fallback.evaluation;
    } else {
      console.warn('API backend merespons status non-200, mengaktifkan mesin generasi cadangan.');
      const fallback = generateLocalFallback(input, id, customNotes);
      Object.assign(newProject, fallback);
    }
  } catch (err) {
    console.warn('Koneksi server gagal, menggunakan generator cadangan instruksional:', err);
    const fallback = generateLocalFallback(input, id, customNotes);
    Object.assign(newProject, fallback);
  }

  // Run Quality Check
  newProject.qualityCheck = runComprehensiveQualityCheck(newProject);
  newProject.status = 'Lengkap';
  return newProject;
}

// Function to regenerate ONLY a specific module while preserving all other manual edits!
export async function regenerateSingleModule(
  project: TrainingProject,
  targetModule: 'syllabus' | 'rundown' | 'material' | 'slides' | 'evaluations',
  customInstruction?: string
): Promise<TrainingProject> {
  const updatedProject = { ...project, updatedAt: new Date().toISOString() };
  const fallback = generateLocalFallback(project.input, project.id, customInstruction);

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: targetModule,
        input: {
          ...project.input,
          additionalNotes: customInstruction || project.input.additionalNotes,
        },
        materialContext: project.material,
        curriculumContext: project.syllabus?.curriculum,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (targetModule === 'syllabus' && data.syllabus) {
        updatedProject.syllabus = { ...data.syllabus, id: `syl-${project.id}`, projectId: project.id, reviewStatus: 'Draft', updatedAt: new Date().toISOString() };
      } else if (targetModule === 'rundown' && data.rundown) {
        const validated = validateRundownSchedule(data.rundown.days || [], project.input.totalJP);
        updatedProject.rundown = {
          ...data.rundown,
          id: `run-${project.id}`,
          projectId: project.id,
          totalJP: validated.actualJP,
          synchronousJP: validated.synchronousJP,
          asynchronousJP: validated.asynchronousJP,
          validation: validated,
          reviewStatus: 'Draft',
          updatedAt: new Date().toISOString(),
        };
      } else if (targetModule === 'material' && data.material) {
        updatedProject.material = { ...data.material, id: `mat-${project.id}`, projectId: project.id, reviewStatus: 'Draft', updatedAt: new Date().toISOString() };
      } else if (targetModule === 'slides' && data.slides) {
        updatedProject.slides = { ...data.slides, id: `sld-${project.id}`, projectId: project.id, reviewStatus: 'Draft', updatedAt: new Date().toISOString() };
      } else if (targetModule === 'evaluations' && data.evaluation) {
        updatedProject.evaluation = { ...data.evaluation, id: `eval-${project.id}`, projectId: project.id, reviewStatus: 'Draft', updatedAt: new Date().toISOString() };
      } else {
        // Apply fallback if specific module is missing in payload
        if (targetModule === 'evaluations') {
          const objectives = project.syllabus?.objectives || [project.input.trainingName];
          const preTest = generateTwentyQuestions(project.input.trainingName, 'Pre-Test', objectives, project.material?.sections);
          const postTest = generateTwentyQuestions(project.input.trainingName, 'Post-Test', objectives, project.material?.sections);
          updatedProject.evaluation = {
            id: `eval-${project.id}`,
            projectId: project.id,
            preTest,
            postTest,
            totalQuestions: 20,
            scoringFormula: 'Nilai = (Jumlah Jawaban Benar / 20) x 100',
            reviewStatus: 'Draft',
            updatedAt: new Date().toISOString(),
          };
        } else {
          applyModuleFallback(updatedProject, fallback, targetModule);
        }
      }
    } else {
      if (targetModule === 'evaluations') {
        const objectives = project.syllabus?.objectives || [project.input.trainingName];
        const preTest = generateTwentyQuestions(project.input.trainingName, 'Pre-Test', objectives, project.material?.sections);
        const postTest = generateTwentyQuestions(project.input.trainingName, 'Post-Test', objectives, project.material?.sections);
        updatedProject.evaluation = {
          id: `eval-${project.id}`,
          projectId: project.id,
          preTest,
          postTest,
          totalQuestions: 20,
          scoringFormula: 'Nilai = (Jumlah Jawaban Benar / 20) x 100',
          reviewStatus: 'Draft',
          updatedAt: new Date().toISOString(),
        };
      } else {
        applyModuleFallback(updatedProject, fallback, targetModule);
      }
    }
  } catch (err) {
    console.warn(`Generasi ulang modul ${targetModule} menggunakan fallback:`, err);
    if (targetModule === 'evaluations') {
      const objectives = project.syllabus?.objectives || [project.input.trainingName];
      const preTest = generateTwentyQuestions(project.input.trainingName, 'Pre-Test', objectives, project.material?.sections);
      const postTest = generateTwentyQuestions(project.input.trainingName, 'Post-Test', objectives, project.material?.sections);
      updatedProject.evaluation = {
        id: `eval-${project.id}`,
        projectId: project.id,
        preTest,
        postTest,
        totalQuestions: 20,
        scoringFormula: 'Nilai = (Jumlah Jawaban Benar / 20) x 100',
        reviewStatus: 'Draft',
        updatedAt: new Date().toISOString(),
      };
    } else {
      applyModuleFallback(updatedProject, fallback, targetModule);
    }
  }

  updatedProject.qualityCheck = runComprehensiveQualityCheck(updatedProject);
  return updatedProject;
}

function applyModuleFallback(
  project: TrainingProject,
  fallback: Partial<TrainingProject>,
  module: 'syllabus' | 'rundown' | 'material' | 'slides' | 'evaluations'
) {
  if (module === 'syllabus') project.syllabus = fallback.syllabus;
  if (module === 'rundown') project.rundown = fallback.rundown;
  if (module === 'material') project.material = fallback.material;
  if (module === 'slides') project.slides = fallback.slides;
  if (module === 'evaluations') project.evaluation = fallback.evaluation;
}
