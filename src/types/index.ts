/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DeliveryMethod = 'Offline' | 'Online' | 'Hybrid';
export type ParticipantLevel = 'Pemula' | 'Menengah' | 'Lanjutan';
export type VerificationStatus = 'Terverifikasi' | 'Perlu verifikasi';
export type QualityStatus = 'passed' | 'warning' | 'failed';

export interface DailyJPAllocation {
  dayNumber: number;
  allocatedJP: number;
  startTime: string; // e.g. "08:00"
  endTime: string;   // e.g. "16:15"
  breakTimes: Array<{ startTime: string; endTime: string; label: string }>;
}

export interface TrainingInput {
  trainingName: string;
  description: string;
  targetAudience: string;
  participantLevel: ParticipantLevel;
  learningObjectives: string;
  participantCount?: number;
  deliveryMethod: DeliveryMethod;
  totalJP: number;
  trainingDays: number;
  dailyJPAllocation: DailyJPAllocation[];
  referenceText?: string;
  customTemplateId?: string;
  additionalNotes?: string;
  selectedOutputs: {
    syllabus: boolean;
    rundown: boolean;
    fullMaterial: boolean;
    slideMaterial: boolean;
    evaluations: boolean;
  };
}

export interface CurriculumUnit {
  no: number;
  moduleName: string;
  topics: string[];
  jp: number;
  classActivities: string[];
}

export interface SyllabusOutput {
  id: string;
  projectId: string;
  trainingName: string;
  certificateType: string;
  deliveryMethod: string;
  totalJP: number;
  description: string;
  objectives: string[];
  participantRequirements: string[];
  facilityRequirements: string[];
  activitiesDescription: {
    offline?: string;
    onlineSync?: string;
    onlineAsync?: string;
  };
  curriculum: CurriculumUnit[];
  evaluationCriteria: {
    attendanceMaxAbsencePercent: number;
    preTestWeight: number;
    assignmentWeight: number;
    postTestWeight: number;
    passingScore: number;
    notes: string;
  };
  reviewStatus: 'Draft' | 'Ditinjau' | 'Disetujui Instruktur';
  updatedAt: string;
}

export interface RundownSession {
  id: string;
  dayNumber: number;
  timeRange: string; // e.g. "08.00-08.15"
  topic: string;
  activity: string;
  deliveryMode: 'Sinkronus' | 'Asinkronus' | 'Break' | 'Seremonial';
  durationMinutes: number;
  durationJP: number;
  isLearningJP: boolean;
}

export interface RundownDay {
  dayNumber: number;
  dayTitle?: string;
  sessions: RundownSession[];
}

export interface RundownOutput {
  id: string;
  projectId: string;
  deliveryMethod: DeliveryMethod;
  totalJP: number;
  synchronousJP: number;
  asynchronousJP: number;
  days: RundownDay[];
  validation: {
    isValid: boolean;
    expectedJP: number;
    actualJP: number;
    diffJP: number;
    messages: string[];
  };
  reviewStatus: 'Draft' | 'Ditinjau' | 'Disetujui Instruktur';
  updatedAt: string;
}

export type InstructorRole =
  | 'Instruktur BLSDM'
  | 'Instruktur Ahli / Senior'
  | 'Fasilitator Praktisi'
  | 'Koordinator Kurikulum & Mutu';

export interface InstructorProfile {
  id: string;
  name: string;
  nip: string;
  email: string;
  role: InstructorRole;
  division: string;
  avatarColor?: string;
  avatarUrl?: string;
  specialties?: string[];
}

export type ReferenceCategory =
  | 'Regulasi & Kebijakan Nasional'
  | 'Standar Kompetensi (SKKNI)'
  | 'Standar Global & Industri (ISO/IEEE/W3C)'
  | 'Panduan & SOP Resmi Pemerintah'
  | 'Riset & Jurnal Akademik Terakreditasi';

export type CredibilityLevel =
  | 'Tingkat 1 (Regulasi/Standar Resmi Negara)'
  | 'Tingkat 2 (Konsensus Industri & Internasional)'
  | 'Tingkat 3 (Riset Ilmiah Terakreditasi)';

export interface ReferenceItem {
  id: string;
  title: string;
  publisherOrAuthor: string;
  yearOrDate?: string;
  url?: string;
  domainName?: string;
  category?: ReferenceCategory;
  credibilityLevel?: CredibilityLevel;
  verificationStatus: VerificationStatus;
  mappedChapters?: string[];
  citationCode?: string;
  documentType?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  directExcerptOrSummary?: string;
  notes?: string;
}

export interface MaterialSection {
  id: string;
  title: string;
  conceptSummary: string;
  explanation: string;
  examples: string[];
  practiceSteps?: string[];
  caseStudyOrExercise?: string;
  citationCodes?: string[];
}

export interface MaterialOutput {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  learningObjectives: string[];
  sections: MaterialSection[];
  summaryNotes: string;
  references: ReferenceItem[];
  reviewStatus: 'Draft' | 'Ditinjau' | 'Disetujui Instruktur';
  updatedAt: string;
}

export interface SlideItem {
  slideNumber: number;
  title: string;
  mainMessage: string;
  bulletPoints: string[];
  speakerNotes: string;
  visualSuggestion: string;
  discussionPrompt?: string;
  referenceTag?: string;
}

export interface SlideOutlineOutput {
  id: string;
  projectId: string;
  slides: SlideItem[];
  reviewStatus: 'Draft' | 'Ditinjau' | 'Disetujui Instruktur';
  updatedAt: string;
}

export interface TestQuestion {
  number: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  topic: string;
  mappedObjective: string;
}

export interface EvaluationOutput {
  id: string;
  projectId: string;
  preTest: TestQuestion[];
  postTest: TestQuestion[];
  totalQuestions: number; // Exactly 20
  scoringFormula: string; // Nilai = (Jawaban Benar / 20) * 100
  reviewStatus: 'Draft' | 'Ditinjau' | 'Disetujui Instruktur';
  updatedAt: string;
}

export interface QualityCheckItem {
  id: string;
  module: 'Silabus' | 'Rundown' | 'Materi' | 'Slide' | 'Evaluasi' | 'Referensi';
  title: string;
  status: QualityStatus;
  message: string;
  details?: string;
}

export interface QualityCheckResult {
  overallStatus: QualityStatus;
  passedCount: number;
  warningCount: number;
  failedCount: number;
  checks: QualityCheckItem[];
  checkedAt: string;
}

export interface TrainingProject {
  id: string;
  creatorId?: string;
  creatorName?: string;
  creatorNip?: string;
  creatorRole?: InstructorRole;
  isShared?: boolean;
  lastEditedBy?: string;
  input: TrainingInput;
  syllabus?: SyllabusOutput;
  rundown?: RundownOutput;
  material?: MaterialOutput;
  slides?: SlideOutlineOutput;
  evaluation?: EvaluationOutput;
  qualityCheck?: QualityCheckResult;
  status: 'Draft' | 'Selesai Sebagian' | 'Lengkap';
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceTemplate {
  id: string;
  title: string;
  category: 'Silabus' | 'Rundown' | 'Materi' | 'Evaluasi';
  description: string;
  source: string;
  updatedAt: string;
  sampleContent: string;
}
