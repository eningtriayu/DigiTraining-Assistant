# DigiTraining Assistant — AI Agent Persiapan Pelatihan Digital (BLSDM Komdigi Surabaya)

Aplikasi web modern berbasis AI yang dirancang khusus untuk instruktur di Balai Pengembangan Sumber Daya Manusia dan Penelitian Komunikasi dan Digital (BLSDM Komdigi) Surabaya. Aplikasi ini mengotomasi dan menyelaraskan penyusunan empat perangkat pelatihan utama—**Silabus**, **Rundown Jadwal**, **Materi Pelatihan (Utuh & Per Slide)**, serta **Instrumen Evaluasi (Pre-test & Post-test masing-masing 20 soal pilihan ganda)**—berdasarkan satu entri data pelatihan terpadu dan format standar resmi BLSDM Komdigi Surabaya.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Keputusan Terkonfirmasi & Penyesuaian Pengguna:**
> 1. **Penghapusan Nama Akademi & Diksi DTS**: Field *Nama Akademi* sepenuhnya ditiadakan dari formulir pembuatan pelatihan baru. Seluruh antarmuka, prompt sistem, template referensi, dan dokumen hasil generasi murni berfokus pada pelatihan BLSDM Komdigi Surabaya tanpa menggunakan diksi DTS (Digital Talent Scholarship) maupun subdivisi akademinya (seperti GTA, TA, DEA, dll).
> 2. **Kondisi Awal Form**: Dimulai dari **form kosong yang bersih** tanpa data default yang mengikat. Sedia tombol opsional *"Muat Contoh Format Pelatihan Komdigi"* bagi pengguna yang ingin melihat referensi format dengan 1 klik.
> 3. **Prioritas Format Ekspor**: Mendukung secara penuh **Dokumen Word (.docx)**, **Presentasi Slide (.pptx)**, **Cetak / PDF Browser**, serta **Salin Teks Terformat (Rich Text / Markdown)** dengan tombol fungsional nyata.
> 4. **Format Instrumen Evaluasi**: Menghasilkan tepat **20 soal Pre-test dan 20 soal Post-test seimbang**, 4 opsi pilihan ganda (A, B, C, D), 1 jawaban benar, kunci jawaban, rubrik pembahasan mendalam, serta pemetaan ke tujuan pembelajaran.

---

## 1. Overview & Core Concept

- **Apa yang Dibangun**: Sebuah aplikasi produktivitas instruktur pelatihan digital dengan antarmuka SaaS modern (terinspirasi dari estetika dashboard Huthy: aksen violet `#6C5CE7`, kanvas `#F5F6FA`, kartu putih bertepi lembut, navigasi sidebar). Aplikasi ini memvalidasi durasi pelatihan secara programatis ($1\text{ JP} = 45\text{ menit}$) dan menghubungkan seluruh dokumen pelatihan agar saling konsisten.
- **Pengguna Sasaran**: Instruktur, widyaiswara, pengajar teknis, dan perancang program pelatihan di BLSDM Komdigi Surabaya.
- **Nilai Utama**: Menghilangkan duplikasi kerja manual, menjamin konsistensi alokasi JP antara silabus dan jadwal rundown, menyusun materi dengan rujukan yang dapat ditelusuri (*source traceability*), dan merumuskan instrumen evaluasi yang teruji valid terhadap materi yang diajarkan.

---

## 2. User Experience & Visual Design

### A. Alur Kerja Pengguna (User Flow)
```
┌─────────────────┐      ┌──────────────────────────┐      ┌─────────────────────────┐
│   1. Dashboard   │ ───> │  2. Wizard Form Input    │ ───> │  3. Validasi JP & Sesi  │
│ - Statistik &    │      │ - Data Pelatihan & JP    │      │ - Kalkulasi programatis │
│   Daftar Proyek │      │ - Template & Referensi   │      │ - Warning jika selisih  │
└─────────────────┘      └──────────────────────────┘      └─────────────────────────┘
                                                                        │
                                                                        ▼
┌─────────────────┐      ┌──────────────────────────┐      ┌─────────────────────────┐
│  6. Ekspor &    │ <─── │   5. Tab Hasil Generasi   │ <─── │  4. AI Generation       │
│     Penyimpanan │      │ - Silabus, Rundown,      │      │ - Model Gemini 3.8 Flash│
│ - DOCX, PPTX,   │      │   Materi, Slide, Evaluasi│      │ - Structured output     │
│   PDF, Copy     │      │ - Quality Check Engine   │      │ - Prompt sesuai modul   │
└─────────────────┘      └──────────────────────────┘      └─────────────────────────┘
```

1. **Dashboard Overview**:
   - Ucapan selamat datang instruktur BLSDM Komdigi Surabaya.
   - Kartu metrik pelatihan aktif, dokumen tersimpan, dan rata-rata JP.
   - Tabel riwayat draf pelatihan dengan status jelas (Draft, Perlu Tinjauan, Lengkap).
   - Pintasan langsung untuk membuat pelatihan baru atau membuka template resmi instansi.
2. **Formulir "Buat Pelatihan Baru" (Multi-Step Wizard)**:
   - **Langkah 1 (Informasi Dasar Pelatihan)**: Nama pelatihan (wajib), deskripsi/konteks pelatihan, sasaran peserta (wajib), tingkat kemampuan (Pemula / Menengah / Lanjutan), tujuan pembelajaran, perkiraan jumlah peserta (opsional). *(Tanpa field akademi).*
   - **Langkah 2 (Durasi & Validasi Jadwal JP)**: Total JP (kalkulator otomatis $1\text{ JP} = 45\text{ menit}$), jumlah hari pelatihan, metode pelaksanaan (Offline, Online, Hybrid), alokasi JP per hari, konfigurasi rentang jam dan waktu istirahat (Break).
   - **Langkah 3 (Referensi & Template Acuan)**: Pemilihan template silabus/rundown standar BLSDM Komdigi atau unggah file dokumen teks/PDF acuan, pencatatan bahan materi rujukan.
   - **Langkah 4 (Pilihan Output Perangkat)**: Checklist interaktif: Silabus, Rundown Jadwal, Materi Lengkap, Materi Per Slide, Instrumen Evaluasi (Pre-test & Post-test 20 soal).
   - **Langkah 5 (Review & Generate)**: Ringkasan input, verifikasi keselarasan JP harian vs total durasi, dan tombol *"Generate Perangkat Pelatihan"*.
3. **Workspace Hasil Generasi Terpadu**:
   - Tab navigasi untuk setiap perangkat yang dipilih: `Silabus`, `Rundown Jadwal`, `Materi Lengkap`, `Materi Per Slide`, `Pre-test (20 Soal)`, `Post-test (20 Soal)`, `Daftar Referensi`, serta `Pemeriksaan Kualitas (Quality Check)`.
   - Tiap tab memiliki mode tampilan rapi, mode editor langsung (*in-place editing*), tombol *Regenerate*, tombol *Salin Teks*, serta tombol *Ekspor Dokumen* (.docx untuk silabus/materi/evaluasi, .pptx untuk slide outline, dan cetak PDF).
4. **Modul Quality Check**:
   - Pemeriksaan otomatis keselarasan JP silabus vs rundown, kelengkapan 20 butir soal evaluasi, format kunci jawaban A-D, dan status keterlacakan referensi (Terverifikasi vs Perlu Verifikasi).

### B. Visual Identity & Design Tokens (Gaya Dashboard Huthy)
- **Aesthetic Direction**: Modern enterprise SaaS dashboard, bersih, berwibawa, terstruktur rapi untuk instansi pemerintah digital.
- **Palet Warna**:
  - `Primary / Accent`: `#6C5CE7` (Violet utama) & `#5847D6` (Hover)
  - `Canvas Background`: `#F5F6FA` (Abu-abu sangat lembut)
  - `Card / Surface`: `#FFFFFF` dengan batas halus `border border-slate-200/80` dan radius `rounded-xl` ($12\text{px}$)
  - `Text`: Utama `#1E2433` (Slate gelap), Sekunder `#64748B`, Aksen border `#E2E8F0`
  - `Status`: Lulus/Passed `#16A34A`, Peringatan/Warning `#D97706`, Gagal/Error `#DC2626`, Info `#3B82F6`
- **Tipografi**:
  - Font Sans: `Plus Jakarta Sans` / `Outfit` / `DM Sans` untuk headline dan navigasi yang tegas dan modern.
  - Angka & Durasi: `tabular-nums font-mono` untuk waktu, durasi menit, dan skor JP agar tersusun vertikal secara presisi.
- **Top Bar & Sidebar Contract**:
  - Sidebar kiri selebar 256px dengan logo DigiTraining, navigasi 5 menu utama (Dashboard, Buat Pelatihan, Riwayat Pelatihan, Referensi & Template, Pengaturan).
  - Top Bar ringkas: Breadcrumbs konteks di kiri, badge status sesi lokal di kanan, dan tombol aksi utama.

---

## 3. Key Product Decisions & Trade-Offs

### Keputusan 1: Validasi Durasi & JP Programatis (Bukan Tebakan AI)
- **Pendekatan**: Logika bisnis $1\text{ JP} = 45\text{ menit}$ dihitung secara matematis di sisi aplikasi TypeScript. Waktu istirahat (*break*) secara eksplisit dikecualikan dari durasi JP pembelajaran. Rundown generator membagi sesi secara matematis sesuai konfigurasi per hari.
- **Alasan**: Menghindari kekeliruan perhitungan durasi oleh LLM yang sering kali mengasumsikan 1 JP = 60 menit. Jika terdapat selisih antara total alokasi harian dan total durasi program, sistem langsung menampilkan peringatan selisih waktu secara transparan.

### Keputusan 2: Arsitektur Pemanggilan Model AI Sisi Server
- **Pendekatan**: Menggunakan `@google/genai` dengan model resmi `gemini-3.8-flash` pada server Node/Express (`server.ts` dengan endpoint `/api/generate`), melindungi `process.env.GEMINI_API_KEY` dari browser, dan menggunakan format prompt terstruktur berbahasa Indonesia baku sesuai instansi BLSDM Komdigi Surabaya.
- **Alasan**: Mematuhi standar keamanan lingkungan Google AI Studio dan menjamin keandalan respons dengan skema JSON yang konsisten.

### Keputusan 3: Penanganan Referensi Nyata dan Anti-Halusinasi
- **Pendekatan**: Sistem tidak membuat klaim pencarian web palsu atau URL buatan. Bila instruktur melampirkan teks bahan ajar atau modul acuan, AI memprioritaskan dokumen tersebut. Referensi yang dihasilkan diberi label status eksplisit: *"Dokumen Pelatihan Acuan"* atau *"Klaim Memerlukan Verifikasi Instruktur"*.

### Keputusan 4: Ekspor Dokumen Fungsional (DOCX, PPTX, PDF, Rich Text)
- **Pendekatan**: Menggunakan pustaka klien `docx` untuk merender dokumen Word rapi ber-tabel resmi Komdigi, `pptxgenjs` untuk mengekspor slide deck presentasi ke format PowerPoint siap pakai, `window.print()` dengan styling `@media print` untuk PDF resmi instansi, serta Clipboard API untuk salinan teks instan.
- **Alasan**: Memenuhi kebutuhan instruktur yang harus mengedit dokumen lebih lanjut sebelum diserahkan ke panitia pelatihan atau diunggah ke Learning Management System (LMS).

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          DigiTraining Frontend                         │
│ (React 19 + TypeScript + Tailwind CSS 4 + Lucide Icons + Framer Motion) │
├────────────────────────────────────────────────────────────────────────┤
│ • Navigation & Sidebar (Dashboard, Buat Pelatihan, Riwayat, Template)  │
│ • Training Wizard Form (Info Pelatihan, Alokasi JP, Pilihan Output)    │
│ • Programmatic JP Calculator & Schedule Constraint Engine               │
│ • Multi-Tab Output Viewers (Silabus, Rundown, Materi, Slide, Evaluasi) │
│ • In-Place Content Editor & Quality Check Visualizer                   │
│ • Export Modules (DOCX Generator, PPTX Generator, Print PDF Engine)    │
│ • LocalStorage Persistence (TrainingProjects, Templates, History)      │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTP POST /api/generate
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Express Server (server.ts)                      │
├────────────────────────────────────────────────────────────────────────┤
│ • Shared GoogleGenAI Client (User-Agent: 'aistudio-build')             │
│ • Model: gemini-3.8-flash (Structured Generation & Prompts)            │
│ • Modul Silabus, Rundown, Materi Utuh, Slide, dan Evaluasi 20 Soal     │
│ • Error Boundary & Fallback Handler                                    │
└────────────────────────────────────────────────────────────────────────┘
```

### Entitas Data Utama:
- **`TrainingProject`**: `id`, `trainingName`, `description`, `targetAudience`, `participantLevel`, `learningObjectives`, `deliveryMethod`, `totalJP`, `trainingDays`, `dailyJPAllocation[]`, `selectedOutputs[]`, `status`, `createdAt`, `updatedAt`. *(Field programName/akademi dihapus).*
- **`SyllabusOutput`**: Identitas pelatihan, deskripsi, tujuan, sasaran & persyaratan peserta, sarana/prasarana, aktivitas kelas, rencana materi pokok & submateri + alokasi JP, sistem evaluasi & kelulusan (kehadiran, Pre-test 5%, Tugas 65%, Post-test 30%).
- **`RundownOutput`**: Sesi per hari (`dayNumber`, `timeRange`, `topic`, `activity`, `mode: 'Sinkronus' | 'Asinkronus' | 'Break' | 'Seremonial'`, `durationMinutes`, `durationJP`), ringkasan total JP sinkronus/asinkronus, validasi konsistensi.
- **`MaterialOutput`**: Materi utuh (pengantar, konsep inti, studi kasus/contoh penerapan, langkah praktik, rangkuman, daftar pustaka), slide outline (nomor, judul, pesan utama, poin tayang, speaker notes pengajar, saran visual).
- **`EvaluationOutput`**: 20 butir Pre-test dan 20 butir Post-test, tiap soal memiliki `nomor`, `pertanyaan`, opsi `A, B, C, D`, `kunciJawaban`, `pembahasan`, dan `tujuanPembelajaranTerkait`.
- **`QualityCheckResult`**: Hasil verifikasi otomatis (`passed`, `warning`, `failed`) terhadap konsistensi durasi JP, keutuhan butir evaluasi, kelengkapan silabus, dan daftar sumber.

---

## Tahapan Eksekusi Pembangunan

1. **Konfigurasi Server & Gemini API**:
   - Siapkan `server.ts` dengan Express dan `@google/genai` (menggunakan `gemini-3.8-flash` dan header `User-Agent: aistudio-build`).
   - Buat endpoint `/api/generate` yang menangani permintaan pembuatan Silabus, Rundown, Materi, Slide, dan Evaluasi secara modular.
2. **Setup Pustaka Ekspor Dokumen**:
   - Instal dependensi pembantu untuk ekspor dokumen: `docx` (Word) dan `pptxgenjs` (PowerPoint) agar tombol ekspor bekerja nyata.
3. **Pondasi Antarmuka & Navigasi**:
   - Buat layout dashboard modern bergaya Huthy: sidebar kiri 256px dengan branding DigiTraining Assistant BLSDM Komdigi Surabaya, topbar navigasi, dan kanvas utama responsif.
   - Siapkan state management lokal (localStorage) dengan data store terstruktur.
4. **Form Wizard "Buat Pelatihan Baru" & Kalkulator JP**:
   - Bangun wizard 5 langkah dengan validasi field wajib tanpa field akademi.
   - Terapkan kalkulator interaktif $1\text{ JP} = 45\text{ menit}$, perhitungan alokasi harian, deteksi selisih JP otomatis, dan tombol opsional untuk memuat format standar Komdigi Surabaya.
5. **Generator & Workspace Hasil Generasi**:
   - Bangun visualizer tab interaktif untuk Silabus (tabel terstruktur), Rundown (tabel jadwal harian), Materi Utuh (bacaan hierarkis), Materi Per Slide (kartu slide dengan presenter notes), dan Evaluasi (kartu 20 soal Pre/Post-test ber-kunci dan pembahasan).
   - Lengkapi dengan mode edit langsung (*inline edit*) dan tombol *Regenerate*.
6. **Modul Quality Check & Manajemen Template**:
   - Bangun panel audit kualitas otomatis dengan badge status (*Passed*, *Warning*, *Failed*) dan rekomendasi perbaikan.
   - Sediakan halaman kelola Referensi & Template resmi BLSDM Komdigi Surabaya serta fitur unggah dokumen acuan.
7. **Modul Ekspor Nyata & Pengujian Kompilasi**:
   - Implementasikan fungsi ekspor DOCX untuk silabus, materi, evaluasi; PPTX untuk materi per slide; Cetak PDF browser; serta Salin Markdown/Teks.
   - Jalankan `compile_applet` untuk memastikan build bersih tanpa error.
