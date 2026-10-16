/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

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
    "summary": "Ringkasan komprehensif materi pelatihan",
    "learningObjectives": ["tujuan 1", "tujuan 2", "tujuan 3"],
    "sections": [
      {
        "id": "sec-1",
        "title": "Bab I: Konsep Dasar dan Relevansi",
        "conceptSummary": "Ringkasan konsep pokok bab ini",
        "explanation": "Penjelasan mendalam dan sistematis mengenai teori serta prinsip dasar...",
        "examples": ["Contoh aplikasi 1", "Contoh implementasi 2"],
        "practiceSteps": ["Langkah 1", "Langkah 2", "Langkah 3"],
        "caseStudyOrExercise": "Latihan mandiri atau studi kasus..."
      }
    ],
    "summaryNotes": "Kesimpulan materi...",
    "references": [
      {
        "id": "ref-1",
        "title": "Surat Edaran Menkominfo RI No 9 Tahun 2023 tentang Etika Kecerdasan Artifisial",
        "publisherOrAuthor": "Kementerian Komunikasi dan Informatika RI",
        "yearOrDate": "2023",
        "url": "https://jdih.kominfo.go.id",
        "verificationStatus": "Terverifikasi",
        "notes": "Pedoman etika AI nasional"
      }
    ]
  },
  "slides": {
    "slides": [
      {
        "slideNumber": 1,
        "title": "${input.trainingName}",
        "mainMessage": "Pengantar materi pelatihan digital BLSDM Komdigi Surabaya",
        "bulletPoints": ["Nama Instansi: BLSDM Komdigi Surabaya", "Nama Pengajar", "Tempat & Waktu Pelaksanaan"],
        "speakerNotes": "Sambut para peserta dengan hangat. Jelaskan tujuan singkat pelatihan dan dorong antusiasme peserta.",
        "visualSuggestion": "Background resmi bergradasi biru-violet dengan layout title slide minimalis.",
        "discussionPrompt": "Pertanyaan pemantik: Apa ekspektasi terbesar Bapak/Ibu dalam pelatihan ini?"
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
