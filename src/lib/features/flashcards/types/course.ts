/** Course and certification tracking types for the Study Vault. */

export type CourseStatus = 'active' | 'completed' | 'archived' | 'upcoming';

/** A course or certification being studied. */
export interface Course {
  id: string;
  name: string;
  /** Subject area e.g. "CompTIA Security+", "AWS Solutions Architect" */
  subject: string;
  /** ISO date string for exam day */
  examDate: string | null;
  /** Total number of topics/chapters */
  totalTopics: number;
  /** Vault-relative folder path where topic notes live */
  folderPath: string;
  status: CourseStatus;
  createdAt: string;
  modifiedAt: string;
}

/** Mastery state of a single topic note. */
export interface TopicMastery {
  notePath: string;
  /** Whether the user has marked this topic as mastered */
  mastered: boolean;
  /** Last review date ISO string */
  lastReviewed: string | null;
  /** Flashcard count parsed from this topic */
  cardCount: number;
}

/** Computed progress snapshot for a course. */
export interface CourseProgress {
  courseId: string;
  totalTopics: number;
  masteredTopics: number;
  masteredPercent: number;
  daysUntilExam: number | null;
  cardsDue: number;
  totalCards: number;
}

/** A parsed practice question from a topic note. */
export interface PracticeQuestion {
  question: string;
  answer: string;
  notePath: string;
  line: number;
}

/** A record of a study session. */
export interface ExamSession {
  id: string;
  courseId: string;
  startedAt: string;
  durationMinutes: number;
  cardsReviewed: number;
  correctCount: number;
}
