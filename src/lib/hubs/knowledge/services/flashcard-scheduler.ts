/**
 * Spaced repetition scheduler — SM-2 algorithm, due card filtering, serialization.
 * Ported from v1 scheduler.ts. FSRS dispatch via flashcard-fsrs.ts.
 */

import { fsrsGrade } from '@/hubs/knowledge/services/flashcard-fsrs';
import type {
  NoteRecallRating,
  ReviewableNote,
  ReviewEvent,
  ReviewGrade,
  ReviewRecord,
  SchedulerAlgorithm,
} from '@/hubs/knowledge/types/flashcard-types';

const INITIAL_EASE = 2.5;
const MIN_EASE = 1.3;

export function gradeCard(
  record: ReviewRecord | null,
  cardId: string,
  grade: ReviewGrade
): ReviewRecord {
  const now = new Date().toISOString();
  const ef = record?.easeFactor ?? INITIAL_EASE;
  const interval = record?.intervalDays ?? 1;
  const count = (record?.reviewCount ?? 0) + 1;

  let newEf = ef + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (newEf < MIN_EASE) newEf = MIN_EASE;

  let newInterval: number;
  if (grade < 3) {
    newInterval = 1;
  } else if (count === 1) {
    newInterval = 1;
  } else if (count === 2) {
    newInterval = 6;
  } else {
    newInterval = Math.round(interval * newEf);
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  return {
    cardId,
    nextReview: nextDate.toISOString(),
    easeFactor: Math.round(newEf * 100) / 100,
    intervalDays: newInterval,
    reviewCount: count,
    lastReviewed: now,
  };
}

export function gradeCardWithAlgorithm(
  record: ReviewRecord | null,
  cardId: string,
  grade: ReviewGrade,
  algorithm: SchedulerAlgorithm = 'sm2'
): ReviewRecord {
  if (algorithm === 'fsrs') {
    const fsrsState = record?.fsrs ?? null;
    const { state, intervalDays } = fsrsGrade(fsrsState, grade);
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);
    return {
      cardId,
      nextReview: nextDate.toISOString(),
      easeFactor: state.difficulty,
      intervalDays,
      reviewCount: state.reps,
      lastReviewed: new Date().toISOString(),
      fsrs: state,
    };
  }
  return gradeCard(record, cardId, grade);
}

export function getDueCards<T extends { id: string }>(
  cards: T[],
  records: Map<string, ReviewRecord>
): T[] {
  const now = new Date();
  return cards.filter((card) => {
    const rec = records.get(card.id);
    if (!rec) return true;
    return new Date(rec.nextReview) <= now;
  });
}

const NOTE_RECALL_GRADES: Record<NoteRecallRating, ReviewGrade> = {
  forgot: 1,
  hard: 2,
  good: 4,
  easy: 5,
};

export function createReviewableNote(path: string, title: string): ReviewableNote {
  return {
    path,
    title,
    nextReview: new Date().toISOString(),
    intervalDays: 0,
    easeFactor: 2.5,
    reviewCount: 0,
    lastReviewed: new Date().toISOString(),
  };
}

export function gradeNoteReview(
  note: ReviewableNote,
  rating: NoteRecallRating,
  algorithm: SchedulerAlgorithm = 'sm2'
): ReviewableNote {
  const grade = NOTE_RECALL_GRADES[rating];
  const rec: ReviewRecord = {
    cardId: note.path,
    nextReview: note.nextReview,
    easeFactor: note.easeFactor,
    intervalDays: note.intervalDays,
    reviewCount: note.reviewCount,
    lastReviewed: note.lastReviewed,
  };
  const updated = gradeCardWithAlgorithm(rec, note.path, grade, algorithm);
  return {
    ...note,
    nextReview: updated.nextReview,
    intervalDays: updated.intervalDays,
    easeFactor: updated.easeFactor,
    reviewCount: updated.reviewCount,
    lastReviewed: updated.lastReviewed,
  };
}

export function serializeRecords(records: Map<string, ReviewRecord>): string {
  return JSON.stringify(Object.fromEntries(records));
}

export function deserializeRecords(json: string): Map<string, ReviewRecord> {
  try {
    return new Map(Object.entries(JSON.parse(json) as Record<string, ReviewRecord>));
  } catch {
    return new Map();
  }
}

export function serializeEvents(events: ReviewEvent[]): string {
  return JSON.stringify(events);
}

export function deserializeEvents(json: string): ReviewEvent[] {
  try {
    return JSON.parse(json) as ReviewEvent[];
  } catch {
    return [];
  }
}

function serializeNoteReviews(notes: Map<string, ReviewableNote>): string {
  return JSON.stringify(Object.fromEntries(notes));
}

function deserializeNoteReviews(json: string): Map<string, ReviewableNote> {
  try {
    return new Map(Object.entries(JSON.parse(json) as Record<string, ReviewableNote>));
  } catch {
    return new Map();
  }
}
