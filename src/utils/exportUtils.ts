/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType, Packer, ImageRun, ExternalHyperlink } from 'docx';
import pptxgen from 'pptxgenjs';
import { saveAs } from 'file-saver';
import { SyllabusOutput, RundownOutput, MaterialOutput, SlideOutlineOutput, EvaluationOutput, TestQuestion } from '../types';
import { KOP_SURAT_PNG_BASE64 } from './kopSuratAsset';

// Helper to trigger browser download of a blob
export function downloadBlob(blob: Blob, filename: string) {
  saveAs(blob, filename);
}

// Helper to create official Kop Surat paragraph for DOCX
export function createKopSuratParagraph(): Paragraph {
  try {
    const binaryString = atob(KOP_SURAT_PNG_BASE64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Paragraph({
      children: [
        new ImageRun({
          data: bytes,
          transformation: {
            width: 595, // full content width in Word (margins 1 inch A4)
            height: 102, // 595 * (205 / 1200) ratio
          },
          type: 'png',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    });
  } catch (err) {
    console.error('Error generating Kop Surat image run in docx:', err);
    return new Paragraph({
      text: 'BALAI PELATIHAN SUMBER DAYA MANUSIA KOMUNIKASI DAN DIGITAL SURABAYA',
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    });
  }
}

// Helper to copy text to clipboard with fallback
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    }
  } catch (err) {
    console.error('Gagal menyalin teks ke clipboard:', err);
    return false;
  }
}

// ==========================================
// 1. EKSPOR SILABUS KE DOCX
// ==========================================
export async function exportSyllabusToDocx(syllabus: SyllabusOutput, trainingName: string) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          createKopSuratParagraph(),
          new Paragraph({
            children: [
              new TextRun({
                text: `SILABUS PELATIHAN: ${trainingName.toUpperCase()}`,
                bold: true,
                size: 28,
                color: '6C5CE7',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 180, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Total Durasi: ${syllabus.totalJP} JP (1 JP = 45 menit) | Metode Pelaksanaan: ${syllabus.deliveryMethod}`,
                italics: true,
                size: 20,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
          }),

          // Table Informasi Pelatihan
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Nama Pelatihan', bold: true })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: syllabus.trainingName })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Sertifikat', bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: syllabus.certificateType || 'Sertifikat Penyelesaian Pelatihan (Certificate of Completion)' })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Deskripsi Pelatihan', bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: syllabus.description })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Tujuan Pelatihan', bold: true })] })],
                  }),
                  new TableCell({
                    children: syllabus.objectives.map((obj, i) => new Paragraph({ text: `${i + 1}. ${obj}` })),
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Persyaratan Peserta', bold: true })] })],
                  }),
                  new TableCell({
                    children: syllabus.participantRequirements.map((req, i) => new Paragraph({ text: `${i + 1}. ${req}` })),
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Persyaratan Sarana', bold: true })] })],
                  }),
                  new TableCell({
                    children: syllabus.facilityRequirements.map((fac, i) => new Paragraph({ text: `${i + 1}. ${fac}` })),
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            text: 'RENCANA PEMBELAJARAN & MATA PELATIHAN',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          // Table Rencana Pelatihan
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'No', bold: true })] })] }),
                  new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Mata Pelatihan', bold: true })] })] }),
                  new TableCell({ width: { size: 38, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Materi Pokok & Submateri', bold: true })] })] }),
                  new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'JP', bold: true })] })] }),
                  new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Aktivitas Kelas', bold: true })] })] }),
                ],
              }),
              ...syllabus.curriculum.map(
                (unit, idx) =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ text: String(idx + 1) })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: unit.moduleName, bold: true })] })] }),
                      new TableCell({
                        children: unit.topics.map((t) => new Paragraph({ text: `• ${t}` })),
                      }),
                      new TableCell({ children: [new Paragraph({ text: `${unit.jp} JP` })] }),
                      new TableCell({
                        children: (unit.classActivities || ['Ceramah', 'Praktik']).map((a) => new Paragraph({ text: `• ${a}` })),
                      }),
                    ],
                  })
              ),
            ],
          }),

          new Paragraph({
            text: 'SISTEM EVALUASI & PENILAIAN',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 360, after: 180 },
          }),
          new Paragraph({
            text: `Peserta dinyatakan lulus dan berhak memperoleh sertifikat apabila memenuhi nilai minimal kelulusan ${syllabus.evaluationCriteria.passingScore} dengan komposisi bobot penilaian:`,
          }),
          new Paragraph({
            text: `1. Pre-Test : ${syllabus.evaluationCriteria.preTestWeight}%\n2. Tugas & Praktik : ${syllabus.evaluationCriteria.assignmentWeight}%\n3. Post-Test : ${syllabus.evaluationCriteria.postTestWeight}%`,
          }),
          new Paragraph({
            text: `Batas ketidakhadiran maksimal adalah ${syllabus.evaluationCriteria.attendanceMaxAbsencePercent}% dari total jam pelatihan.`,
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `Silabus_${trainingName.replace(/\s+/g, '_')}_BLSDM_Komdigi.docx`);
}

// ==========================================
// 2. EKSPOR RUNDOWN KE DOCX
// ==========================================
export async function exportRundownToDocx(rundown: RundownOutput, trainingName: string) {
  const doc = new Document({
    sections: [
      {
        children: [
          createKopSuratParagraph(),
          new Paragraph({
            text: 'RINCIAN RENCANA JADWAL PELATIHAN (RUNDOWN)',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 180, after: 120 },
          }),
          new Paragraph({
            text: `Pelatihan: ${trainingName} | BLSDM Komdigi Surabaya`,
            heading: HeadingLevel.HEADING_3,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Total Durasi: ${rundown.totalJP} JP (Sinkronus: ${rundown.synchronousJP} JP, Asinkronus: ${rundown.asynchronousJP} JP) | 1 JP = 45 Menit`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          ...rundown.days.flatMap((day) => [
            new Paragraph({
              text: `HARI ${day.dayNumber} ${day.dayTitle ? `— ${day.dayTitle}` : ''}`,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 240, after: 120 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Waktu', bold: true })] })] }),
                    new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Topik / Materi', bold: true })] })] }),
                    new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Aktivitas / Kegiatan', bold: true })] })] }),
                    new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Durasi', bold: true })] })] }),
                  ],
                }),
                ...day.sessions.map(
                  (sess) =>
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ text: sess.timeRange })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: sess.topic, bold: sess.isLearningJP })] })] }),
                        new TableCell({ children: [new Paragraph({ text: `${sess.activity} (${sess.deliveryMode})` })] }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              text: sess.deliveryMode === 'Break' ? `${sess.durationMinutes} menit (Break)` : `${sess.durationJP} JP (${sess.durationMinutes} mnt)`,
                            }),
                          ],
                        }),
                      ],
                    })
                ),
              ],
            }),
          ]),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `Rundown_${trainingName.replace(/\s+/g, '_')}_BLSDM_Komdigi.docx`);
}

// ==========================================
// 3. EKSPOR MATERI UTUH KE DOCX
// ==========================================
export async function exportMaterialToDocx(material: MaterialOutput, trainingName: string) {
  const doc = new Document({
    sections: [
      {
        children: [
          createKopSuratParagraph(),
          new Paragraph({
            text: material.title.toUpperCase(),
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 180, after: 120 },
          }),
          new Paragraph({
            text: `Bahan Pembelajaran Pelatihan Digital — BLSDM Komdigi Surabaya`,
            heading: HeadingLevel.HEADING_3,
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
          }),
          new Paragraph({
            text: 'Deskripsi & Ringkasan Materi',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: material.summary, spacing: { after: 200 } }),
          new Paragraph({
            text: 'Tujuan Pembelajaran',
            heading: HeadingLevel.HEADING_2,
          }),
          ...material.learningObjectives.map((obj, i) => new Paragraph({ text: `${i + 1}. ${obj}` })),
          new Paragraph({ text: '', spacing: { after: 240 } }),

          ...material.sections.flatMap((sec, idx) => [
            new Paragraph({
              text: `${idx + 1}. ${sec.title}`,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 240, after: 120 },
            }),
            new Paragraph({
              children: [new TextRun({ text: sec.conceptSummary, italics: true, bold: true })],
              spacing: { after: 120 },
            }),
            new Paragraph({ text: sec.explanation, spacing: { after: 160 } }),
            ...(sec.examples && sec.examples.length > 0
              ? [
                  new Paragraph({ children: [new TextRun({ text: 'Contoh Penerapan:', bold: true })] }),
                  ...sec.examples.map((ex) => new Paragraph({ text: `• ${ex}` })),
                ]
              : []),
            ...(sec.practiceSteps && sec.practiceSteps.length > 0
              ? [
                  new Paragraph({ children: [new TextRun({ text: 'Langkah Praktik:', bold: true })], spacing: { before: 120 } }),
                  ...sec.practiceSteps.map((st, i) => new Paragraph({ text: `${i + 1}. ${st}` })),
                ]
              : []),
            ...(sec.caseStudyOrExercise
              ? [
                  new Paragraph({ children: [new TextRun({ text: 'Studi Kasus / Penugasan:', bold: true })], spacing: { before: 120 } }),
                  new Paragraph({ text: sec.caseStudyOrExercise }),
                ]
              : []),
            new Paragraph({ text: '', spacing: { after: 200 } }),
          ]),

          new Paragraph({
            text: 'DAFTAR REFERENSI & PUSTAKA ACUAN TERVERIFIKASI',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Catatan Keabsahan: Seluruh rujukan di bawah ini bersumber dari regulasi resmi negara, standar kompetensi nasional (SKKNI), atau standar global terakreditasi dengan tautan portal resmi yang dapat diklik langsung.',
                italics: true,
                color: '6C5CE7',
              }),
            ],
            spacing: { after: 150 },
          }),
          ...material.references.flatMap((ref, i) => [
            new Paragraph({
              children: [
                new TextRun({ text: `[${i + 1}] `, bold: true }),
                new TextRun({ text: `${ref.title}. `, bold: true }),
                new TextRun({ text: `${ref.publisherOrAuthor} ` }),
                ...(ref.yearOrDate ? [new TextRun({ text: `(${ref.yearOrDate}). ` })] : []),
                new TextRun({ text: `[Status: ${ref.verificationStatus}] `, color: '35A875', bold: true }),
                ...(ref.credibilityLevel ? [new TextRun({ text: `| ${ref.credibilityLevel} `, italics: true })] : []),
              ],
              spacing: { before: 80, after: 40 },
            }),
            ...(ref.url
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({ text: '     Tautan Sumber Resmi: ' }),
                      new ExternalHyperlink({
                        children: [
                          new TextRun({
                            text: ref.url,
                            style: 'Hyperlink',
                            color: '6C5CE7',
                            underline: {},
                          }),
                        ],
                        link: ref.url,
                      }),
                    ],
                    spacing: { after: 80 },
                  }),
                ]
              : []),
            ...(ref.directExcerptOrSummary
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({ text: `     Substansi Acuan: "${ref.directExcerptOrSummary}"`, italics: true, color: '555555' }),
                    ],
                    spacing: { after: 120 },
                  }),
                ]
              : []),
          ]),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `Materi_Lengkap_${trainingName.replace(/\s+/g, '_')}_BLSDM_Komdigi.docx`);
}

// ==========================================
// 4. EKSPOR INSTRUMEN EVALUASI (20 SOAL) KE DOCX
// ==========================================
export async function exportEvaluationsToDocx(evaluation: EvaluationOutput, trainingName: string) {
  const doc = new Document({
    sections: [
      {
        children: [
          createKopSuratParagraph(),
          new Paragraph({
            text: 'INSTRUMEN EVALUASI PEMBELAJARAN (PRE-TEST & POST-TEST)',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 180, after: 120 },
          }),
          new Paragraph({
            text: `Pelatihan: ${trainingName} | BLSDM Komdigi Surabaya`,
            heading: HeadingLevel.HEADING_3,
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
          }),
          new Paragraph({
            text: `Rumus Penilaian: ${evaluation.scoringFormula || 'Nilai = (Jumlah Jawaban Benar / 20) x 100'}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          // Pre Test Section
          new Paragraph({
            text: 'BAGIAN I: SOAL PRE-TEST (20 BUTIR PILIHAN GANDA)',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 150 },
          }),
          ...evaluation.preTest.flatMap((q) => [
            new Paragraph({
              children: [new TextRun({ text: `${q.number}. ${q.question}`, bold: true })],
              spacing: { before: 120, after: 60 },
            }),
            new Paragraph({ text: `   A. ${q.options.A}` }),
            new Paragraph({ text: `   B. ${q.options.B}` }),
            new Paragraph({ text: `   C. ${q.options.C}` }),
            new Paragraph({ text: `   D. ${q.options.D}` }),
            new Paragraph({
              children: [
                new TextRun({ text: `   Kunci Jawaban: ${q.correctAnswer} | Topik: ${q.topic}`, italics: true, color: '6C5CE7' }),
              ],
              spacing: { after: 60 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `   Pembahasan: ${q.explanation}`, italics: true })],
              spacing: { after: 140 },
            }),
          ]),

          // Post Test Section
          new Paragraph({
            text: 'BAGIAN II: SOAL POST-TEST (20 BUTIR PILIHAN GANDA)',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          }),
          ...evaluation.postTest.flatMap((q) => [
            new Paragraph({
              children: [new TextRun({ text: `${q.number}. ${q.question}`, bold: true })],
              spacing: { before: 120, after: 60 },
            }),
            new Paragraph({ text: `   A. ${q.options.A}` }),
            new Paragraph({ text: `   B. ${q.options.B}` }),
            new Paragraph({ text: `   C. ${q.options.C}` }),
            new Paragraph({ text: `   D. ${q.options.D}` }),
            new Paragraph({
              children: [
                new TextRun({ text: `   Kunci Jawaban: ${q.correctAnswer} | Topik: ${q.topic}`, italics: true, color: '6C5CE7' }),
              ],
              spacing: { after: 60 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `   Pembahasan: ${q.explanation}`, italics: true })],
              spacing: { after: 140 },
            }),
          ]),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `Evaluasi_20_Soal_${trainingName.replace(/\s+/g, '_')}_BLSDM_Komdigi.docx`);
}

// ==========================================
// 5. EKSPOR SINGLE TEST (PRE-TEST ATAU POST-TEST 20 SOAL)
// ==========================================
export async function exportSingleTestToDocx(
  testType: 'Pre-Test' | 'Post-Test',
  questions: TestQuestion[],
  trainingName: string
) {
  const doc = new Document({
    sections: [
      {
        children: [
          createKopSuratParagraph(),
          new Paragraph({
            text: `SOAL ${testType.toUpperCase()} (20 BUTIR PILIHAN GANDA)`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 180, after: 120 },
          }),
          new Paragraph({
            text: `Pelatihan: ${trainingName} | BLSDM Komdigi Surabaya`,
            heading: HeadingLevel.HEADING_3,
            alignment: AlignmentType.CENTER,
            spacing: { after: 140 },
          }),
          new Paragraph({
            text: `Rumus Penilaian: Nilai = (Jumlah Jawaban Benar / 20) x 100`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          ...questions.flatMap((q) => [
            new Paragraph({
              children: [new TextRun({ text: `${q.number}. ${q.question}`, bold: true })],
              spacing: { before: 120, after: 60 },
            }),
            new Paragraph({ text: `   A. ${q.options.A}` }),
            new Paragraph({ text: `   B. ${q.options.B}` }),
            new Paragraph({ text: `   C. ${q.options.C}` }),
            new Paragraph({ text: `   D. ${q.options.D}` }),
            new Paragraph({
              children: [
                new TextRun({ text: `   Kunci Jawaban: ${q.correctAnswer} | Topik: ${q.topic}`, italics: true, color: '6C5CE7' }),
              ],
              spacing: { after: 60 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `   Pembahasan: ${q.explanation}`, italics: true })],
              spacing: { after: 140 },
            }),
          ]),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${testType.replace(/\s+/g, '_')}_20_Soal_${trainingName.replace(/\s+/g, '_')}_BLSDM_Komdigi.docx`);
}

// ==========================================
// 5. EKSPOR SLIDE OUTLINE KE PPTX (POWERPOINT)
// ==========================================
export async function exportSlidesToPptx(slideData: SlideOutlineOutput, trainingName: string) {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  // Master Slide / Cover
  const coverSlide = pptx.addSlide();
  coverSlide.background = { color: '1A1F2C' };

  coverSlide.addText(trainingName, {
    x: 0.8,
    y: 2.2,
    w: 8.5,
    h: 1.5,
    fontSize: 32,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Arial',
  });

  coverSlide.addText('Bahan Tayang Presentasi Pelatihan Digital\nBLSDM Komdigi Surabaya', {
    x: 0.8,
    y: 3.8,
    w: 8.5,
    h: 1.0,
    fontSize: 16,
    color: 'A0AEC0',
    fontFace: 'Arial',
  });

  // Content Slides
  slideData.slides.forEach((slide) => {
    const s = pptx.addSlide();
    s.background = { color: 'F7FAFC' };

    // Slide Header
    s.addText(`Slide ${slide.slideNumber}: ${slide.title}`, {
      x: 0.8,
      y: 0.6,
      w: 8.5,
      h: 0.8,
      fontSize: 22,
      bold: true,
      color: '202533',
      fontFace: 'Arial',
    });

    // Main message
    s.addText(slide.mainMessage, {
      x: 0.8,
      y: 1.5,
      w: 8.5,
      h: 0.6,
      fontSize: 14,
      italic: true,
      color: '6C5CE7',
      fontFace: 'Arial',
    });

    // Bullet Points
    const bulletText = slide.bulletPoints.map((bp) => `• ${bp}`).join('\n');
    s.addText(bulletText, {
      x: 0.8,
      y: 2.3,
      w: 5.5,
      h: 2.5,
      fontSize: 13,
      color: '2D3748',
      fontFace: 'Arial',
      lineSpacing: 22,
    });

    // Visual suggestion box on the right
    s.addShape(pptx.ShapeType.rect, {
      x: 6.6,
      y: 2.3,
      w: 2.7,
      h: 2.5,
      fill: { color: 'EDE9FE' },
      line: { color: '6C5CE7', width: 1 },
    });

    s.addText(`Saran Visual:\n${slide.visualSuggestion}`, {
      x: 6.7,
      y: 2.4,
      w: 2.5,
      h: 2.3,
      fontSize: 11,
      color: '4A5568',
      fontFace: 'Arial',
    });

    // Speaker Notes (Embedded into PowerPoint notes panel!)
    if (slide.speakerNotes) {
      s.addNotes(`[Catatan Pengajar / Speaker Notes]:\n${slide.speakerNotes}\n\n[Diskusi / Aktivitas]: ${slide.discussionPrompt || '-'}`);
    }
  });

  await pptx.writeFile({ fileName: `Slide_${trainingName.replace(/\s+/g, '_')}_BLSDM_Komdigi.pptx` });
}
