/**
 * Flashcard types — cards, decks, spaced repetition state, and statistics.
 * Ported from v1 study-hub/flashcards with v2 conventions.
 */

export type FlashcardType =
  'basic' | 'basic-reversed' | 'multiline' | 'multiline-reversed' | 'cloze';

export type SchedulerAlgorithm = 'sm2' | 'fsrs';

export type ReviewGrade = 0 | 1 | 2 | 3 | 4 | 5;

export type NoteRecallRating = 'forgot' | 'hard' | 'good' | 'easy';

export interface Flashcard {
  id: string;
  type: FlashcardType;
  front: string;
  back?: string;
  tags: string[];
  deck: string;
  sourcePath: string;
  sourceLine: number;
  context?: string;
}

export interface NoteFlashcards {
  notePath: string;
  cards: Flashcard[];
  hasCards: boolean;
}

export interface ReviewRecord {
  cardId: string;
  nextReview: string;
  easeFactor: number;
  intervalDays: number;
  reviewCount: number;
  lastReviewed: string;
  fsrs?: FSRSState;
}

export interface FSRSState {
  stability: number;
  difficulty: number;
  lastReview: string;
  reps: number;
  lapses: number;
}

export interface ReviewableNote {
  path: string;
  title: string;
  nextReview: string;
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
  lastReviewed: string;
}

export interface ReviewEvent {
  cardId: string;
  grade: number;
  timestamp: string;
  intervalDays: number;
  algorithm: SchedulerAlgorithm;
}

export interface DeckNode {
  name: string;
  fullPath: string;
  cardCount: number;
  dueCount: number;
  children: DeckNode[];
}

export interface FlashcardStats {
  totalCards: number;
  totalReviews: number;
  reviewsToday: number;
  currentStreak: number;
  longestStreak: number;
  retentionRate: number;
  maturedCards: number;
  newCards: number;
  youngCards: number;
}
