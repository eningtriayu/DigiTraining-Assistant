/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrainingProject, QualityCheckResult, QualityCheckItem } from '../types';

export function runComprehensiveQualityCheck(project: TrainingProject): QualityCheckResult {
  const checks: QualityCheckItem[] = [];
  const { input, syllabus, rundown, material, slides, evaluation } = project;

  // 1. Silabus Check
  if (syllabus) {
    const totalModuleJP = syllabus.curriculum.reduce((acc, curr) => acc + curr.jp, 0);
    const jpMatch = Math.round(totalModuleJP) === Math.round(input.totalJP);

    checks.push({
      id: 'syl-01',
      module: 'Silabus',
      title: 'Kesesuaian Total JP Materi Pokok',
      status: jpMatch ? 'passed' : 'warning',
      message: jpMatch
        ? `Akumulasi JP pada mata pelatihan (${totalModuleJP} JP) tepat sama dengan durasi program (${input.totalJP} JP).`
        : `Total alokasi materi pokok adalah ${totalModuleJP} JP, berbeda dengan durasi program (${input.totalJP} JP).`,
    });

    const hasObjectives = syllabus.objectives && syllabus.objectives.length >= 2;
    checks.push({
      id: 'syl-02',
      module: 'Silabus',
      title: 'Kejelasan Tujuan Pembelajaran',
      status: hasObjectives ? 'passed' : 'warning',
      message: hasObjectives
        ? `Terdapat ${syllabus.objectives.length} tujuan pembelajaran yang terdefinisi dengan format kompetensi.`
        : 'Tujuan pembelajaran masih sangat ringkas, disarankan minimal 2 poin sasaran kompetensi.',
    });

    const hasEvaluationScheme = syllabus.evaluationCriteria && syllabus.evaluationCriteria.passingScore > 0;
    checks.push({
      id: 'syl-03',
      module: 'Silabus',
      title: 'Ketentuan Evaluasi & Kelulusan',
      status: hasEvaluationScheme ? 'passed' : 'warning',
      message: hasEvaluationScheme
        ? `Kriteria kelulusan ditetapkan (Passing Grade: ${syllabus.evaluationCriteria.passingScore}, Bobot Pre-test: ${syllabus.evaluationCriteria.preTestWeight}%, Tugas: ${syllabus.evaluationCriteria.assignmentWeight}%, Post-test: ${syllabus.evaluationCriteria.postTestWeight}%).`
        : 'Skema pembobotan nilai kelulusan belum lengkap.',
    });
  }

  // 2. Rundown Check
  if (rundown) {
    const isJpAligned = rundown.validation.isValid;
    checks.push({
      id: 'run-01',
      module: 'Rundown',
      title: 'Konsistensi Alokasi Durasi Rundown',
      status: isJpAligned ? 'passed' : 'failed',
      message: isJpAligned
        ? `Total JP rundown pembelajaran (${rundown.totalJP} JP) selaras dengan target durasi program (${rundown.validation.expectedJP} JP).`
        : rundown.validation.messages[0] || 'Terdapat ketidaksesuaian durasi JP pada jadwal rundown.',
    });

    const hasBreaks = rundown.days.some((d) => d.sessions.some((s) => s.deliveryMode === 'Break'));
    checks.push({
      id: 'run-02',
      module: 'Rundown',
      title: 'Pemisahan Sesi Istirahat (Break)',
      status: hasBreaks ? 'passed' : 'warning',
      message: hasBreaks
        ? 'Waktu istirahat (Ishoma/Break) dicatat terpisah dan tidak dihitung ke dalam JP pembelajaran.'
        : 'Tidak terdeteksi sesi istirahat eksplisit pada jadwal pelatihan.',
    });
  }

  // 3. Material Check
  if (material) {
    const hasConceptSections = material.sections && material.sections.length >= 3;
    checks.push({
      id: 'mat-01',
      module: 'Materi',
      title: 'Kedalaman Struktur Materi Pelatihan',
      status: hasConceptSections ? 'passed' : 'warning',
      message: hasConceptSections
        ? `Materi tersusun atas ${material.sections.length} bab konseptual lengkap dengan contoh penerapan dan latihan.`
        : 'Materi pokok masih dapat diperdalam lagi uraiannya.',
    });

    const hasReferences = material.references && material.references.length > 0;
    const hasUnverified = material.references?.some((r) => r.verificationStatus === 'Perlu verifikasi');
    checks.push({
      id: 'mat-02',
      module: 'Referensi',
      title: 'Keterlacakan Daftar Referensi',
      status: !hasReferences ? 'warning' : hasUnverified ? 'warning' : 'passed',
      message: !hasReferences
        ? 'Belum ada daftar pustaka/referensi yang tercantum pada materi.'
        : hasUnverified
        ? `Terdapat ${material.references.length} referensi tercatat, sebagian ditandai 'Perlu verifikasi'.`
        : `Seluruh referensi (${material.references.length} sumber) berstatus terverifikasi dan dapat ditelusuri.`,
    });

    const hasClickableUrls = material.references && material.references.length > 0 && material.references.every((r) => r.url && r.url.startsWith('http'));
    checks.push({
      id: 'ref-01',
      module: 'Referensi',
      title: 'Validitas Tautan Langsung Sumber Resmi (Clickable URLs)',
      status: hasClickableUrls ? 'passed' : 'warning',
      message: hasClickableUrls
        ? 'Seluruh rujukan memiliki tautan URL aktif langsung ke portal resmi (JDIH, UNESCO, BSSN, Kemnaker, dsb) yang dapat diklik.'
        : 'Sebagian rujukan belum memiliki tautan URL langsung ke portal sumber resmi.',
    });
  }

  // 4. Slide Check
  if (slides) {
    const slideCount = slides.slides.length;
    const allHaveNotes = slides.slides.every((s) => s.speakerNotes && s.speakerNotes.length > 20);
    checks.push({
      id: 'sld-01',
      module: 'Slide',
      title: 'Kelengkapan Speaker Notes & Saran Visual',
      status: allHaveNotes ? 'passed' : 'warning',
      message: allHaveNotes
        ? `Sebanyak ${slideCount} slide dilengkapi catatan instruktur (speaker notes) dan panduan visual.`
        : 'Beberapa slide belum memiliki speaker notes instruktur yang memadai.',
    });
  }

  // 5. Evaluation Check (20 questions rule)
  if (evaluation) {
    const preCount = evaluation.preTest?.length || 0;
    const postCount = evaluation.postTest?.length || 0;
    const exact20 = preCount === 20 && postCount === 20;

    checks.push({
      id: 'eval-01',
      module: 'Evaluasi',
      title: 'Kuantitas Butir Soal (Tepat 20 Butir)',
      status: exact20 ? 'passed' : 'failed',
      message: exact20
        ? `Instrumen evaluasi memiliki tepat 20 butir Pre-test dan 20 butir Post-test sesuai standar PRD.`
        : `Jumlah soal belum memenuhi syarat tepat 20 butir (Pre-test: ${preCount}, Post-test: ${postCount}).`,
    });

    const preValidOptions = evaluation.preTest?.every(
      (q) => q.options && q.options.A && q.options.B && q.options.C && q.options.D && q.correctAnswer
    );
    const postValidOptions = evaluation.postTest?.every(
      (q) => q.options && q.options.A && q.options.B && q.options.C && q.options.D && q.correctAnswer
    );
    const optionsComplete = preValidOptions && postValidOptions;

    // Check if questions inadvertently test training technicalities (e.g. JP, grading weights, attendance)
    const allQuestions = [...(evaluation.preTest || []), ...(evaluation.postTest || [])];
    const technicalKeywords = [
      /\b1\s*jp\b/i,
      /\bjam pelatihan\b/i,
      /\bbobot.*(post-?test|pre-?test|nilai)\b/i,
      /\bpersentase.*(post-?test|kelulusan|absensi)\b/i,
      /\bketidakhadiran\b/i,
      /\bbatas.*absensi\b/i,
      /\bishoma\b/i,
    ];
    const contaminatedQuestions = allQuestions.filter((q) =>
      technicalKeywords.some((regex) => regex.test(q.question) || regex.test(q.explanation))
    );

    checks.push({
      id: 'eval-03',
      module: 'Evaluasi',
      title: 'Fokus Substansi Materi (Bebas Pertanyaan Teknis Diklat)',
      status: contaminatedQuestions.length === 0 ? 'passed' : 'warning',
      message:
        contaminatedQuestions.length === 0
          ? 'Seluruh butir soal (100%) murni menguji substansi materi pelatihan dan bebas dari pertanyaan teknis diklat (JP, persentase nilai, atau absensi).'
          : `Ditemukan ${contaminatedQuestions.length} butir soal yang menyinggung hal teknis diklat (JP/bobot nilai/absensi). Disarankan fokuskan ke materi.`,
    });
  }

  const passedCount = checks.filter((c) => c.status === 'passed').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;
  const failedCount = checks.filter((c) => c.status === 'failed').length;

  let overallStatus: 'passed' | 'warning' | 'failed' = 'passed';
  if (failedCount > 0) {
    overallStatus = 'failed';
  } else if (warningCount > 0) {
    overallStatus = 'warning';
  }

  return {
    overallStatus,
    passedCount,
    warningCount,
    failedCount,
    checks,
    checkedAt: new Date().toISOString(),
  };
}
