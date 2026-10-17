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
import { SEED_PROJECTS } from './src/data/seedProjects';

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
    id: 'inst-01',
    name: 'Dr. Aris Sudarmono, M.Kom',
    nip: '198205142006041002',
    email: 'aris.sudarmono@komdigi.go.id',
    role: 'Instruktur BLSDM',
    division: 'Subtim Transformasi Digital & Kecerdasan Artifisial',
    avatarColor: '#6C5CE7',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    specialties: ['AI Ethics & Governance', 'Prompt Engineering', 'SKKNI AI & Data Science'],
  },
  {
    id: 'inst-02',
    name: 'Ir. Maya Prasasti, M.T.',
    nip: '198711092010122001',
    email: 'maya.prasasti@komdigi.go.id',
    role: 'Instruktur Ahli / Senior',
    division: 'Subtim Keamanan Informasi & Infrastruktur Cloud',
    avatarColor: '#35A875',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    specialties: ['Cyber Security Awareness', 'ISO/IEC 27001', 'Cloud Architecture'],
  },
  {
    id: 'inst-03',
    name: 'Rahmat Hidayat, S.Kom, M.Eng',
    nip: '199003252015031004',
    email: 'rahmat.hidayat@komdigi.go.id',
    role: 'Koordinator Kurikulum & Mutu',
    division: 'Bidang Penjaminan Mutu & Sertifikasi Diklat',
    avatarColor: '#0984E3',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    specialties: ['Penyusunan Kurikulum Diklat', 'Standar JP & Silabus', 'Evaluasi 20 Butir Soal'],
  },
  {
    id: 'inst-04',
    name: 'Dewi Sartika, S.T., M.Kom',
    nip: '199308192018022003',
    email: 'dewi.sartika@komdigi.go.id',
    role: 'Fasilitator Praktisi',
    division: 'Subtim Data Science & Big Data Analytics',
    avatarColor: '#E7A23B',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    specialties: ['Data Analysis & Visualization', 'Python Hands-on Lab', 'Machine Learning Praktis'],
  },
];

// Helper functions for cloud persistence
function getStoredInstructors(): any[] {
  try {
    if (fs.existsSync(INSTRUCTORS_FILE)) {
      const data = fs.readFileSync(INSTRUCTORS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
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
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading projects file:', err);
  }
  // Initialize with persistent seed projects so projects are NEVER 0 on any browser/device
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(SEED_PROJECTS, null, 2), 'utf-8');
  return SEED_PROJECTS;
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

app.put('/api/projects/:id', (req: Request, res: Response) => {
  const project = req.body;
  const { id } = req.params;
  if (!project) {
    return res.status(400).json({ error: 'Data proyek tidak lengkap.' });
  }

  const projects = getStoredProjects();
  const existingIdx = projects.findIndex((p) => p.id === id || p.id === project.id);

  const updatedProject = {
    ...project,
    id: project.id || id,
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    projects[existingIdx] = updatedProject;
  } else {
    projects.unshift(updatedProject);
  }

  saveStoredProjects(projects);
  return res.json({ success: true, project: updatedProject, message: 'Tersimpan ke Cloud Server BLSDM.' });
});

app.post('/api/projects/sync-all', (req: Request, res: Response) => {
  const { projects: incomingProjects } = req.body;
  const currentProjects = getStoredProjects();
  if (Array.isArray(incomingProjects) && incomingProjects.length > 0) {
    const map = new Map<string, any>();
    for (const p of currentProjects) {
      if (p && p.id) map.set(p.id, p);
    }
    for (const p of incomingProjects) {
      if (p && p.id) {
        const existing = map.get(p.id);
        if (!existing || new Date(p.updatedAt || 0) >= new Date(existing.updatedAt || 0)) {
          map.set(p.id, p);
        }
      }
    }
    const merged = Array.from(map.values());
    saveStoredProjects(merged);
    return res.json({ success: true, projects: merged, count: merged.length });
  }
  return res.json({ success: true, projects: currentProjects, count: currentProjects.length });
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
2. DO NOT use the acronym "DTS" or academy subdivisions ("GTA", "TA", "DEA"). The hosting institution is strictly "BLSDM Komdigi Surabaya" or "Kementerian Komunikasi dan Digital Republik Indonesia". You SHOULD, however, utilize the rich curriculum standards, syllabi, practical lab modules, and technical competencies developed by Digitalent Komdigi (digitalent.kominfo.go.id / bpsdm.komdigi.go.id) as prime authoritative references!
3. DURATION RULES: 1 JP = 45 minutes. Never treat 1 JP as 60 minutes.
4. Breaks and lunch (Ishoma) DO NOT count towards learning JP.
5. PROPORTION RULE: 30% Theory vs 70% Practical Tools, Tutorials & Case Studies:
   - Theory (30%): Dense, conceptual, grounded in official Indonesian regulations (SE Menkominfo No 9/2023, UU PDP No 27/2022, Perpres SPBE).
   - Practical (70%): Highly actionable, naming real-world software, tools, platforms, step-by-step procedures, terminal commands / prompts, and public sector case studies.
6. AUTHORITATIVE DATA SOURCES & REFERENCES:
   - Digitalent Komdigi (digitalent.kominfo.go.id / bpsdm.komdigi.go.id): Digital vocational training syllabi, curriculum competencies, hands-on lab modules.
   - Standar Kompetensi Kerja Nasional Indonesia (SKKNI - skkni.kemnaker.go.id): National work competency standards in AI, Data Science, Cyber Security, Software Engineering, and Multimedia.
   - JDIH Komdigi (jdih.kominfo.go.id): SE Menkominfo No. 9 Tahun 2023 tentang Etika AI, UU No. 27 Tahun 2022 tentang PDP, Perpres SPBE.
   - BSSN (govcsirt.bssn.go.id / bssn.go.id): Incident handling, cybersecurity frameworks, metadata sanitation.
   - Google AI Studio & Google Colab (ai.google.dev / colab.research.google.com): Interactive notebooks, Gemini API integrations, Prompt Engineering.
   - Hugging Face (huggingface.co): Open-source AI models, spaces, interactive demos, pipelines.
   - ISO/IEC Standards (iso.org): ISO/IEC 27001 (Information Security) and ISO/IEC 42001 (AI Management System).
   - W3C & OWASP (owasp.org): Web standards, accessibility, and security best practices.
7. PRE-TEST & POST-TEST MUST BE 100% SUBSTANTIVE TO THE TRAINING TOPIC/CONTENT ONLY:
   - Each test must contain EXACTLY 20 MULTIPLE-CHOICE QUESTIONS (numbers 1 to 20).
   - NEVER make questions about course logistics, training technicalities, attendance percentage rules, JP definitions (e.g. 1 JP = 45 menit), grading percentage weights (e.g. 30% post-test), certificate requirements, or course logistics.
   - All questions must evaluate domain knowledge, practical concepts, tools, ethics, legal compliance (e.g., SE Menkominfo No 9/2023, UU PDP), fact-checking, and analytical problem-solving taught in the material.
   - Each question must have options A, B, C, D, exactly one correct answer, pedagogical explanation, topic, and mapped learning objective.
8. Realism and Source Traceability: Do not fabricate fake citations, nonexistent URLs, or fake research statistics. Ground materials on official standards, circular letters, and established digital competencies.
9. Always return output strictly as valid JSON adhering to the requested schema.
`;

// Helper to sanitize JSON response from Gemini
function cleanJsonResponse(raw: string): any {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
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

SUMBER DATA RUJUKAN UTAMA (TERPERCAYA & KAYA TOOLS PRAKTIK):
1. Digitalent Komdigi (digitalent.kominfo.go.id / bpsdm.komdigi.go.id): Silabus vokasi digital, kurikulum pelatihan teknis, modul lab terapan.
2. Standar Kompetensi Kerja Nasional Indonesia (SKKNI - skkni.kemnaker.go.id): Unit kompetensi kerja nyata, demonstrasi unjuk kerja.
3. JDIH Kominfo/Komdigi (jdih.kominfo.go.id): SE Menkominfo No. 9/2023 (Etika AI), UU No. 27/2022 (UU PDP).
4. Badan Siber dan Sandi Negara (BSSN - govcsirt.bssn.go.id / bssn.go.id): Penanganan insiden siber & keamanan data.
5. Google AI Studio & Google Colab (ai.google.dev / colab.research.google.com): Hands-on labs & coding environments.
6. Hugging Face (huggingface.co): AI tools, open-source models, interactive spaces.
7. ISO/IEC 27001 & ISO/IEC 42001 (iso.org): Standar keamanan informasi dan tata kelola AI.

ATURAN PROPORSI WAJIB MATERI (30% TEORI & 70% PRAKTIK, TOOLS & STUDI KASUS):
- MATERI LENGKAP & SLIDE PRESENTASI WAJIB MEMENUHI PROPORSI:
  1. 30% TEORI KONSEPTUAL: Dasar hukum, regulasi (SE Menkominfo No 9/2023, UU PDP), konsep dasar secara padat, jelas, tidak bertele-tele.
  2. 70% TUTORIAL PRAKTIK, TOOLS NYATA & STUDI KASUS:
     - Wajib menyebutkan tools spesifik yang relevan (seperti: Google Colab, HuggingFace Spaces, Ollama, VS Code, Canva for Government, ExifTool, Wireshark, Postman, FastAPI, GitHub, Gemini API, dsb).
     - Wajib menyertakan minimal 4-5 "practiceSteps" yang konkret, sistematis, dan langsung bisa dijalankan oleh peserta pelatihan di laptop masing-masing.
     - Sertakan contoh sintaks kode, prompt template siap pakai, atau konfigurasi nyata.
     - Sertakan studi kasus terapan instansi pemerintah, BUMN, atau layanan publik di Indonesia.
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
        "title": "Kurikulum & Silabus Pelatihan Digital Terapan",
        "publisherOrAuthor": "Digitalent Komdigi (BPSDM Komdigi)",
        "yearOrDate": "2024",
        "url": "https://digitalent.kominfo.go.id",
        "domainName": "digitalent.kominfo.go.id",
        "category": "Panduan & SOP Resmi Pemerintah",
        "credibilityLevel": "Tingkat 1 (Regulasi/Standar Resmi Negara)",
        "verificationStatus": "Terverifikasi",
        "mappedChapters": ["Bab I: Konsep Dasar dan Relevansi"],
        "citationCode": "[REF-DIGITALENT-2024]",
        "documentType": "Silabus & Modul Vokasi Digital",
        "verifiedBy": "Tim Kurikulum BLSDM Komdigi Surabaya",
        "directExcerptOrSummary": "Standar kurikulum pelatihan vokasi digital aparatur dan masyarakat umum berbasis kompetensi teknis terapan.",
        "notes": "Rujukan utama pelatihan digital Komdigi"
      },
      {
        "id": "ref-2",
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
        "question": "Pertanyaan post-test nomor 1 tentang materi pokok?",
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
      model: 'gemini-3.8-flash',
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
