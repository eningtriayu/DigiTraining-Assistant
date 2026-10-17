/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Persistent Cloud Storage paths
const DATA_DIR = path.resolve(__dirname, 'server_data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const INSTRUCTORS_FILE = path.join(DATA_DIR, 'instructors.json');

// Ensure storage directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default BLSDM Komdigi Surabaya instructors
const DEFAULT_INSTRUCTORS = [
  {
    id: 'inst-budi',
    name: 'Budi Santoso, S.Kom., M.T.',
    nip: '198503122010121002',
    email: 'budi.santoso@komdigi.go.id',
    role: 'Instruktur BLSDM',
    division: 'Kecerdasan Artifisial & Konten Digital',
    avatarColor: '#6C5CE7',
  },
  {
    id: 'inst-siti',
    name: 'Dra. Siti Rahmawati, M.Sc.',
    nip: '197805152003122001',
    email: 'siti.rahmawati@komdigi.go.id',
    role: 'Instruktur Ahli / Senior',
    division: 'Transformasi Tata Kelola Digital & SPBE',
    avatarColor: '#35A875',
  },
  {
    id: 'inst-dimas',
    name: 'Dimas Wicaksono, M.Ds.',
    nip: '199108242018011003',
    email: 'dimas.wicaksono@komdigi.go.id',
    role: 'Fasilitator Praktisi',
    division: 'Komunikasi Visual & Multimedia Publik',
    avatarColor: '#E7A23B',
  },
  {
    id: 'inst-hendra',
    name: 'Dr. Hendra Prasetyo, M.Eng.',
    nip: '198204192008121001',
    email: 'hendra.prasetyo@komdigi.go.id',
    role: 'Koordinator Kurikulum & Mutu',
    division: 'Penyelenggaraan Pelatihan & Penjaminan Mutu',
    avatarColor: '#0984E3',
  },
];

// Helper functions for cloud persistence
function getStoredInstructors(): any[] {
  try {
    if (fs.existsSync(INSTRUCTORS_FILE)) {
      const data = fs.readFileSync(INSTRUCTORS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading instructors file:', err);
  }
  // Initialize with defaults if empty
  fs.writeFileSync(INSTRUCTORS_FILE, JSON.stringify(DEFAULT_INSTRUCTORS, null, 2), 'utf-8');
  return DEFAULT_INSTRUCTORS;
}

function saveStoredInstructors(instructors: any[]): void {
  try {
    fs.writeFileSync(INSTRUCTORS_FILE, JSON.stringify(instructors, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing instructors file:', err);
  }
}

function getStoredProjects(): any[] {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const data = fs.readFileSync(PROJECTS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading projects file:', err);
  }
  return [];
}

function saveStoredProjects(projects: any[]): void {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing projects file:', err);
  }
}

// Endpoints for Instructor Authentication & Directory
app.get('/api/auth/instructors', (_req: Request, res: Response) => {
  const instructors = getStoredInstructors();
  return res.json({ instructors });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, nip, email, role, division } = req.body;
  if (!name || !nip) {
    return res.status(400).json({ error: 'Nama pengajar dan NIP wajib diisi.' });
  }

  const instructors = getStoredInstructors();
  const newInstructor = {
    id: `inst-${Date.now()}`,
    name,
    nip,
    email: email || `${name.toLowerCase().replace(/[^a-z]/g, '')}@komdigi.go.id`,
    role: role || 'Instruktur BLSDM',
    division: division || 'Pelatihan Digital BLSDM Komdigi Surabaya',
    avatarColor: ['#6C5CE7', '#35A875', '#E7A23B', '#0984E3', '#E84393'][
      instructors.length % 5
    ],
  };

  instructors.push(newInstructor);
  saveStoredInstructors(instructors);
  return res.status(201).json({ instructor: newInstructor });
});

// Endpoints for Multi-Device Cloud Projects Storage
app.get('/api/projects', (_req: Request, res: Response) => {
  const projects = getStoredProjects();
  return res.json({ projects, count: projects.length, syncedAt: new Date().toISOString() });
});

app.get('/api/projects/:id', (req: Request, res: Response) => {
  const projects = getStoredProjects();
  const proj = projects.find((p) => p.id === req.params.id);
  if (!proj) {
    return res.status(404).json({ error: 'Proyek pelatihan tidak ditemukan di server.' });
  }
  return res.json({ project: proj });
});

app.post('/api/projects', (req: Request, res: Response) => {
  const project = req.body;
  if (!project || !project.id || !project.input) {
    return res.status(400).json({ error: 'Data proyek tidak lengkap.' });
  }

  const projects = getStoredProjects();
  const existingIdx = projects.findIndex((p) => p.id === project.id);

  const updatedProject = {
    ...project,
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    projects[existingIdx] = updatedProject;
  } else {
    projects.unshift(updatedProject);
  }

  saveStoredProjects(projects);
  return res.json({ success: true, project: updatedProject, message: 'Tersinkronisasi ke Cloud Server BLSDM.' });
});

app.delete('/api/projects/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const projects = getStoredProjects();
  const filtered = projects.filter((p) => p.id !== id);
  saveStoredProjects(filtered);
  return res.json({ success: true, message: 'Proyek berhasil dihapus dari server.' });
});

app.post('/api/projects/:id/duplicate', (req: Request, res: Response) => {
  const { id } = req.params;
  const { creatorId, creatorName, creatorRole, creatorNip } = req.body;
  const projects = getStoredProjects();
  const source = projects.find((p) => p.id === id);

  if (!source) {
    return res.status(404).json({ error: 'Proyek sumber tidak ditemukan.' });
  }

  const newId = `proj-${Date.now()}`;
  const duplicated = {
    ...source,
    id: newId,
    creatorId: creatorId || source.creatorId,
    creatorName: creatorName || source.creatorName,
    creatorRole: creatorRole || source.creatorRole,
    creatorNip: creatorNip || source.creatorNip,
    isShared: true,
    lastEditedBy: creatorName || 'Instruktur',
    input: {
      ...source.input,
      trainingName: `Salinan - ${source.input.trainingName}`,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  projects.unshift(duplicated);
  saveStoredProjects(projects);
  return res.status(201).json({ success: true, project: duplicated });
});

// Initialize GoogleGenAI client on server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_INSTRUCTION = `
You are DigiTraining Assistant, the official AI-powered training preparation assistant for digital training instructors at BLSDM Komdigi Surabaya (Balai Pengembangan Sumber Daya Manusia dan Penelitian Komunikasi dan Digital Surabaya, Kementerian Komunikasi dan Digital Republik Indonesia).

PRIMARY RULES & INSTRUCTIONS:
1. Always generate all documents in formal, clear, and structured Indonesian (Bahasa Indonesia baku kedinasan).
2. DO NOT use any mention or diction of "DTS", "Digital Talent Scholarship", or its academies ("GTA", "Government Transformation Academy", "TA", "DEA", etc.). The institution is strictly "BLSDM Komdigi Surabaya" or "Kementerian Komunikasi dan Digital Republik Indonesia".
3. DURATION RULES: 1 JP = 45 minutes. Never treat 1 JP as 60 minutes.
4. Breaks and lunch (Ishoma) DO NOT count towards learning JP.
5. PRE-TEST & POST-TEST MUST BE 100% SUBSTANTIVE TO THE TRAINING TOPIC/CONTENT ONLY:
   - Each test must contain EXACTLY 20 MULTIPLE-CHOICE QUESTIONS (numbers 1 to 20).
   - NEVER make questions about course logistics, training technicalities, attendance percentage rules, JP definitions (e.g. 1 JP = 45 menit), grading percentage weights (e.g. 30% post-test), certificate requirements, or course logistics.
   - All questions must evaluate domain knowledge, practical concepts, tools, ethics, legal compliance (e.g., SE Menkominfo No 9/2023, UU PDP), fact-checking, and analytical problem-solving taught in the material.
   - Each question must have options A, B, C, D, exactly one correct answer, pedagogical explanation, topic, and mapped learning objective.
6. Realism and Source Traceability: Do not fabricate fake citations, nonexistent URLs, or fake research statistics. Ground materials on official standards, circular letters (e.g. SE Menkominfo RI No 9 Tahun 2023 tentang Etika AI), and established digital competencies.
7. Always return output strictly as valid JSON adhering to the requested schema.
`;

// Helper to sanitize JSON response from Gemini
function cleanJsonResponse(raw: string): any {
  let cleaned = raw.trim();
  if (cleaned.startsWith('\`\`\`json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('\`\`\`')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('\`\`\`')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();
  return JSON.parse(cleaned);
}

// Endpoint: Generate Perangkat Pelatihan
app.post('/api/generate', async (req: Request, res: Response) => {
  const { module, input, materialContext, curriculumContext } = req.body;

  if (!input || !input.trainingName) {
    return res.status(400).json({ error: 'Data pelatihan tidak valid atau nama pelatihan kosong.' });
  }

  try {
    let prompt = '';

    if (module === 'evaluations') {
      // Dedicated Evaluation Prompt: 100% grounded on material content
      const materialText = materialContext?.sections
        ? materialContext.sections
            .map(
              (s: any, idx: number) =>
                `Bab ${idx + 1}: ${s.title}\nRingkasan: ${s.conceptSummary}\nUraian: ${s.explanation}\nContoh/Kasus: ${s.caseStudyOrExercise || '-'}`
            )
            .join('\n\n')
        : input.learningObjectives;

      prompt = `
Tugas: Buat instrumen evaluasi (20 soal Pre-Test dan 20 soal Post-Test) UNTUK PELATIHAN: "${input.trainingName}".

SUMBER DATA UTAMA (BAHAN AJAR / MATERI PELATIHAN):
${materialText}

Sasaran Peserta: ${input.targetAudience}
Tingkat Peserta: ${input.participantLevel}
Tujuan Pembelajaran:
${input.learningObjectives}

ATURAN KRUSIAL SUMBER DATA SOAL EVALUASI:
1. SUMBER DATA: Seluruh soal Pre-Test (20 nomor) dan Post-Test (20 nomor) HANYA BERSUMBER DARI SUBSTANSI MATERI PELATIHAN DI ATAS (konsep, teori, perangkat kerja, etika AI/UU PDP, studi kasus, prompt engineering, mitigasi risiko).
2. DILARANG KERAS membuat soal tentang teknis pelaksanaan diklat atau administrasi pelatihan, seperti:
   - Jumlah JP atau definisi 1 JP = 45 menit
   - Bobot persentase penilaian post-test (30%), pre-test (5%), atau tugas (65%)
   - Batas absensi atau persentase kehadiran (10% / 90%)
   - Durasi hari atau jadwal istirahat/rundown
   - Rumus perhitungan nilai
3. Soal Pre-Test menguji pemahaman awal dan diagnostik terhadap materi pembelajaran.
4. Soal Post-Test menguji penguasaan akhir kompetensi materi pembelajaran secara seimbang.
5. Tiap butir soal harus memiliki 4 pilihan jawaban (A, B, C, D) dengan tepat satu kunci jawaban yang benar, serta penjelasan/rubrik pembahasan pedagogis yang jelas.

Hasilkan JSON dengan format persis:
{
  "evaluation": {
    "totalQuestions": 20,
    "scoringFormula": "Nilai = (Jumlah Jawaban Benar / 20) x 100",
    "preTest": [
      {
        "number": 1,
        "question": "Pertanyaan pre-test nomor 1 tentang materi...",
        "options": {
          "A": "Pilihan A",
          "B": "Pilihan B",
          "C": "Pilihan C",
          "D": "Pilihan D"
        },
        "correctAnswer": "A",
        "explanation": "Penjelasan kunci jawaban berdasarkan materi...",
        "topic": "Topik Materi",
        "mappedObjective": "Tujuan Pembelajaran Terkait"
      }
      // ... sampai nomor 20
    ],
    "postTest": [
      {
        "number": 1,
        "question": "Pertanyaan post-test nomor 1 tentang materi...",
        "options": {
          "A": "Pilihan A",
          "B": "Pilihan B",
          "C": "Pilihan C",
          "D": "Pilihan D"
        },
        "correctAnswer": "B",
        "explanation": "Penjelasan kunci jawaban berdasarkan materi...",
        "topic": "Topik Materi",
        "mappedObjective": "Tujuan Pembelajaran Terkait"
      }
      // ... sampai nomor 20
    ]
  }
}
Hasilkan HANYA JSON.
`;
    } else {
      prompt = `
Generate comprehensive training documents for:
- Nama Pelatihan: ${input.trainingName}
- Deskripsi: ${input.description || 'Pelatihan peningkatan kompetensi digital aparatur dan publik'}
- Sasaran Peserta: ${input.targetAudience}
- Tingkat Peserta: ${input.participantLevel}
- Tujuan Pembelajaran: ${input.learningObjectives}
- Metode Pelaksanaan: ${input.deliveryMethod}
- Total Durasi: ${input.totalJP} JP (1 JP = 45 menit)
- Jumlah Hari: ${input.trainingDays} hari
- Alokasi JP Harian: ${JSON.stringify(input.dailyJPAllocation)}
- Referensi / Catatan Tambahan: ${input.referenceText || '-'}
- Modul yang diminta: ${module} (Pilihan: ${JSON.stringify(input.selectedOutputs)})

ATURAN PROPORSI WAJIB MATERI (30% TEORI & 70% PRAKTIK & TOOLS):
- MATERI LENGKAP & SLIDE PRESENTASI WAJIB MEMENUHI PROPORSI:
  1. 30% TEORI KONSEPTUAL: Dasar hukum (SE Menkominfo No 9/2023, SKKNI), konsep dasar, prinsip pokok secara padat dan tidak bertele-tele.
  2. 70% TUTORIAL PRAKTIK, TOOLS NYATA & STUDI KASUS:
     - Panduan langkah demi langkah (Step-by-step) eksplisit yang langsung dipraktikkan peserta pada perangkat masing-masing.
     - Rekomendasi tools konkret (contoh: Google Colab, VS Code, HuggingFace, Cursor, Ollama, Postman, Wireshark, Canva Pro, Google AI Studio, dsb yang relevan dengan topik).
     - Prompt template teruji / sintaks kerja / konfigurasi nyata.
     - Studi kasus riil instansi pemerintah, BUMN, atau industri di Indonesia.
     - Tugas latihan mandiri terstruktur.
- Pada rancangan slide: 30% slide konsep/pengantar, 70% slide demonstrasi tools, alur kerja praktik, dan lab hands-on instruktur.

ATURAN SUMBER DATA KHUSUS EVALUASI (PRE-TEST & POST-TEST):
- Soal Pre-Test dan Post-Test (masing-masing tepat 20 butir) HANYA BERSUMBER DARI SUBSTANSI MATERI PELATIHAN.
- DILARANG KERAS membuat soal tentang hal teknis diklat (seperti jumlah JP, definisi 1 JP = 45 menit, bobot persentase nilai post-test 30%, batas absensi 10%, jadwal istirahat, dsb).
- Seluruh 20 soal Pre-Test dan 20 soal Post-Test wajib menguji konsep materi, studi kasus, alat, etika AI/UU PDP, dan analisis materi ${input.trainingName}.

Hasilkan JSON dengan struktur berikut:
{
  "syllabus": {
    "trainingName": "${input.trainingName}",
    "certificateType": "Sertifikat Penyelesaian Pelatihan (Certificate of Completion)",
    "deliveryMethod": "${input.deliveryMethod}",
    "totalJP": ${input.totalJP},
    "description": "deskripsi lengkap pelatihan",
    "objectives": ["tujuan 1", "tujuan 2", "tujuan 3"],
    "participantRequirements": ["persyaratan 1", "persyaratan 2", "persyaratan 3", "persyaratan 4"],
    "facilityRequirements": ["laptop OS Windows/Linux/Mac RAM min 4GB", "koneksi internet stabil", "browser modern"],
    "activitiesDescription": {
      "offline": "Pembelajaran tatap muka di kelas dengan ceramah, diskusi, dan praktik langsung.",
      "onlineSync": "Live sessions melalui video conference.",
      "onlineAsync": "Belajar mandiri modul LMS."
    },
    "curriculum": [
      {
        "no": 1,
        "moduleName": "Mata Pelatihan 1",
        "topics": ["subtopik 1", "subtopik 2"],
        "jp": 4,
        "classActivities": ["Ceramah interaktif", "Tanya jawab", "Praktik"]
      }
    ],
    "evaluationCriteria": {
      "attendanceMaxAbsencePercent": 10,
      "preTestWeight": 5,
      "assignmentWeight": 65,
      "postTestWeight": 30,
      "passingScore": 65,
      "notes": "Peserta berhak mendapatkan sertifikat jika mencapai nilai minimal 65 dan kehadiran minimal 90%."
    }
  },
  "rundown": {
    "deliveryMethod": "${input.deliveryMethod}",
    "totalJP": ${input.totalJP},
    "synchronousJP": ${input.totalJP},
    "asynchronousJP": 0,
    "days": [
      {
        "dayNumber": 1,
        "dayTitle": "Pembukaan dan Pengenalan Konsep",
        "sessions": [
          {
            "id": "s-1-1",
            "timeRange": "08.00-08.15",
            "topic": "Pembukaan Pelatihan",
            "activity": "Seremonial dan Pengantar",
            "deliveryMode": "Seremonial",
            "durationMinutes": 15,
            "durationJP": 0,
            "isLearningJP": false
          },
          {
            "id": "s-1-2",
            "timeRange": "08.15-08.45",
            "topic": "Pengarahan Program dan Pre-Test",
            "activity": "Pengerjaan Pre-Test",
            "deliveryMode": "Sinkronus",
            "durationMinutes": 30,
            "durationJP": 0,
            "isLearningJP": false
          },
          {
            "id": "s-1-3",
            "timeRange": "08.45-10.15",
            "topic": "Konsep Dasar",
            "activity": "Live classroom",
            "deliveryMode": "Sinkronus",
            "durationMinutes": 90,
            "durationJP": 2,
            "isLearningJP": true
          },
          {
            "id": "s-1-4",
            "timeRange": "10.15-10.30",
            "topic": "Break Pagi",
            "activity": "Istirahat",
            "deliveryMode": "Break",
            "durationMinutes": 15,
            "durationJP": 0,
            "isLearningJP": false
          }
        ]
      }
    ]
  },
  "material": {
    "title": "${input.trainingName}",
    "summary": "Ringkasan komprehensif materi pelatihan (30% teori dan 70% praktik, tools, dan studi kasus terapan)",
    "learningObjectives": ["tujuan 1", "tujuan 2", "tujuan 3"],
    "sections": [
      {
        "id": "sec-1",
        "title": "Bab I: Konsep Dasar dan Relevansi (30% Teori)",
        "conceptSummary": "Ringkasan padat konsep pokok dan landasan regulasi acuan",
        "explanation": "Penjelasan inti teori, regulasi, dan prinsip pokok tanpa bertele-tele...",
        "examples": ["Contoh aplikasi nyata 1", "Contoh implementasi 2"],
        "practiceSteps": [
          "Langkah Praktik 1: Konfigurasi tool/environment pada laptop peserta",
          "Langkah Praktik 2: Eksekusi tutorial atau prompt kerja terstruktur",
          "Langkah Praktik 3: Validasi hasil output dan pengecekan kualitas"
        ],
        "caseStudyOrExercise": "Studi kasus riil instansi/industri di Indonesia dan lembar penugasan praktik mandiri peserta."
      }
    ],
    "summaryNotes": "Kesimpulan materi...",
    "references": [
      {
        "id": "ref-1",
        "title": "Surat Edaran Menkominfo RI No 9 Tahun 2023 tentang Etika Kecerdasan Artifisial",
        "publisherOrAuthor": "Kementerian Komunikasi dan Informatika RI",
        "yearOrDate": "2023",
        "url": "https://jdih.kominfo.go.id/produk_hukum/view/id/888/t/surat+edaran+menteri+komunikasi+dan+informatika+nomor+9+tahun+2023",
        "domainName": "jdih.kominfo.go.id",
        "category": "Regulasi & Kebijakan Nasional",
        "credibilityLevel": "Tingkat 1 (Regulasi/Standar Resmi Negara)",
        "verificationStatus": "Terverifikasi",
        "mappedChapters": ["Bab I: Konsep Dasar dan Relevansi"],
        "citationCode": "[REF-SE9-2023]",
        "documentType": "Surat Edaran Menteri",
        "verifiedBy": "Tim Kurikulum BLSDM Komdigi Surabaya",
        "directExcerptOrSummary": "Memuat 9 nilai etika penyelenggaraan AI: inklusivitas, kemanusiaan, keamanan, aksesibilitas, transparansi, kredibilitas, pelindungan data pribadi, keberlanjutan, dan kekayaan intelektual.",
        "notes": "Pedoman etika AI nasional untuk aparatur dan publik"
      }
    ]
  },
  "slides": {
    "slides": [
      {
        "slideNumber": 1,
        "title": "${input.trainingName}",
        "mainMessage": "Pengantar materi pelatihan digital BLSDM Komdigi Surabaya",
        "bulletPoints": ["Nama Instansi: BLSDM Komdigi Surabaya", "Nama Pengajar", "Struktur Pembelajaran: 30% Teori, 70% Hands-on Praktik"],
        "speakerNotes": "Sambut para peserta dengan hangat. Jelaskan bahwa 70% durasi kelas adalah praktik langsung dan studi kasus.",
        "visualSuggestion": "Background resmi bergradasi violet modern dengan layout title slide minimalis.",
        "discussionPrompt": "Pertanyaan pemantik: Apa tantangan terbesar yang dihadapi dalam praktik kerja saat ini?"
      }
    ]
  },
  "evaluation": {
    "totalQuestions": 20,
    "scoringFormula": "Nilai = (Jumlah Jawaban Benar / 20) x 100",
    "preTest": [
      {
        "number": 1,
        "question": "Pertanyaan pre-test butir 1 tentang materi pokok?",
        "options": {
          "A": "Pilihan A",
          "B": "Pilihan B",
          "C": "Pilihan C",
          "D": "Pilihan D"
        },
        "correctAnswer": "A",
        "explanation": "Penjelasan kunci jawaban secara ilmiah dan pedagogis...",
        "topic": "Topik Materi",
        "mappedObjective": "Tujuan Pembelajaran Materi Terkait"
      }
    ],
    "postTest": [
      {
        "number": 1,
        "question": "Pertanyaan post-test butir 1 tentang materi pokok?",
        "options": {
          "A": "Pilihan A",
          "B": "Pilihan B",
          "C": "Pilihan C",
          "D": "Pilihan D"
        },
        "correctAnswer": "B",
        "explanation": "Penjelasan kunci jawaban secara komprehensif...",
        "topic": "Topik Materi",
        "mappedObjective": "Tujuan Pembelajaran Materi Terkait"
      }
    ]
  }
}

CATATAN WAJIB:
- Pre-Test HARUS TEPAT BERISI 20 BUTIR SOAL (nomor 1 sampai 20) yang 100% MENGUJI SUBSTANSI MATERI PELATIHAN (teori, konsep, etika, regulasi SE 9/2023, prompt engineering, cek fakta, mitigasi hoaks, studi kasus).
- DILARANG KERAS membuat soal tentang teknis pelaksanaan diklat (seperti definisi 1 JP = 45 menit, bobot nilai post-test 30%, batas absensi 10%, alokasi hari/jam diklat, jadwal istirahat, dsb).
- Post-Test HARUS TEPAT BERISI 20 BUTIR SOAL yang setara dan seimbang menguji kompetensi materi yang diajarkan.
- Pastikan total JP pada kurikulum silabus dan rundown persis sama dengan ${input.totalJP} JP.
- Seluruh durasi sesi dihitung dengan rumus 1 JP = 45 menit.
- Hasilkan HANYA JSON tanpa format markdown lain di luar blok json.
`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Model mengembalikan respons kosong.');
    }

    const data = cleanJsonResponse(text);
    return res.json(data);
  } catch (error: any) {
    console.error('Error saat generasi Gemini:', error);
    return res.status(500).json({
      error: error.message || 'Gagal menghasilkan perangkat pelatihan dengan AI.',
      fallbackAvailable: true,
    });
  }
});

// Setup Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DigiTraining Assistant server running on http://localhost:${PORT}`);
  });
}

startServer();
