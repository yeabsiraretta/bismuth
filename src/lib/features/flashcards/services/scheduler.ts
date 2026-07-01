/**
 * Spaced repetition scheduler — supports SM-2 and FSRS algorithms.
 * Stores review history in vault at `.bismuth/flashcards/reviews.json`.
 * This makes Bismuth a standalone flashcard study system — Anki is optional.
 */

import type {
  Flashcard,
  DeckNode,
  FlashcardStats,
  SchedulerAlgorithm,
  ReviewableNote,
  NoteRecallRating,
  ReviewEvent,
} from '../types/flashcard';
import { fsrsGrade, type FSRSState } from './fsrs';

export interface ReviewRecord {
  cardId: string;
  /** Next review due date (ISO string). */
  nextReview: string;
  /** SM-2 ease factor (starts at 2.5). */
  easeFactor: number;
  /** Current interval in days. */
  intervalDays: number;
  /** Total review count. */
  reviewCount: number;
  lastReviewed: string;
  /** FSRS state — present when using FSRS algorithm. */
  fsrs?: FSRSState;
}

export type ReviewGrade = 0 | 1 | 2 | 3 | 4 | 5;

const INITIAL_EASE = 2.5;
const MIN_EASE = 1.3;
const INITIAL_INTERVAL = 1;

/** SM-2 algorithm — returns updated review record. */
export function gradeCard(
  record: ReviewRecord | null,
  cardId: string,
  grade: ReviewGrade
): ReviewRecord {
  const now = new Date().toISOString();
  const ef = record?.easeFactor ?? INITIAL_EASE;
  const interval = record?.intervalDays ?? INITIAL_INTERVAL;
  const count = (record?.reviewCount ?? 0) + 1;

  let newEf = ef + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (newEf < MIN_EASE) newEf = MIN_EASE;

  let newInterval: number;
  if (grade < 3) {
    newInterval = 1; // reset on fail
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

/** Returns cards due for review today (nextReview <= now). */
export function getDueCards<T extends { id: string }>(
  cards: T[],
  records: Map<string, ReviewRecord>
): T[] {
  const now = new Date();
  return cards.filter((card) => {
    const rec = records.get(card.id);
    if (!rec) return true; // new card, always due
    return new Date(rec.nextReview) <= now;
  });
}

/** Unified grade function — dispatches to SM-2 or FSRS. */
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

// ─── Deck Tree ──────────────────────────────────────────────────────────────

/** Build a hierarchical deck tree from a flat list of cards. */
export function buildDeckTree(cards: Flashcard[], records: Map<string, ReviewRecord>): DeckNode {
  const root: DeckNode = {
    name: 'All Decks',
    fullPath: '',
    cardCount: 0,
    dueCount: 0,
    children: [],
  };
  const now = new Date();

  for (const card of cards) {
    const parts = card.deck.split('::');
    let node = root;
    let path = '';
    for (const part of parts) {
      path = path ? `${path}::${part}` : part;
      let child = node.children.find((c) => c.name === part);
      if (!child) {
        child = { name: part, fullPath: path, cardCount: 0, dueCount: 0, children: [] };
        node.children.push(child);
      }
      node = child;
    }
    node.cardCount++;
    root.cardCount++;
    const rec = records.get(card.id);
    if (!rec || new Date(rec.nextReview) <= now) {
      node.dueCount++;
      root.dueCount++;
    }
  }

  // Propagate due counts up
  function propagate(n: DeckNode): void {
    for (const child of n.children) propagate(child);
    if (n.children.length > 0) {
      n.cardCount = n.children.reduce((s, c) => s + c.cardCount, 0);
      n.dueCount = n.children.reduce((s, c) => s + c.dueCount, 0);
    }
  }
  for (const child of root.children) propagate(child);
  root.cardCount = root.children.reduce((s, c) => s + c.cardCount, 0);
  root.dueCount = root.children.reduce((s, c) => s + c.dueCount, 0);

  return root;
}

/** Get cards belonging to a specific deck (including sub-decks). */
export function getCardsInDeck(cards: Flashcard[], deckPath: string): Flashcard[] {
  if (!deckPath) return cards;
  return cards.filter((c) => c.deck === deckPath || c.deck.startsWith(deckPath + '::'));
}

// ─── Statistics ─────────────────────────────────────────────────────────────

/** Compute aggregate statistics from review records and event history. */
export function computeStats(
  cards: Flashcard[],
  records: Map<string, ReviewRecord>,
  events: ReviewEvent[]
): FlashcardStats {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const reviewsToday = events.filter((e) => e.timestamp.startsWith(todayStr)).length;

  // Streak: consecutive days with at least one review
  const daySet = new Set(events.map((e) => e.timestamp.slice(0, 10)));
  const sortedDays = [...daySet].sort().reverse();
  let currentStreak = 0;
  const checkDate = new Date(now);
  for (const day of sortedDays) {
    const expected = checkDate.toISOString().slice(0, 10);
    if (day === expected) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else break;
  }
  let longestStreak = 0,
    streak = 0;
  const allDays = [...daySet].sort();
  for (let i = 0; i < allDays.length; i++) {
    if (i === 0) {
      streak = 1;
    } else {
      const prev = new Date(allDays[i - 1]);
      const curr = new Date(allDays[i]);
      streak = curr.getTime() - prev.getTime() <= 86400000 ? streak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, streak);
  }

  // Card maturity
  let maturedCards = 0,
    youngCards = 0,
    newCards = 0;
  for (const card of cards) {
    const rec = records.get(card.id);
    if (!rec) {
      newCards++;
      continue;
    }
    if (rec.intervalDays >= 21) maturedCards++;
    else youngCards++;
  }

  // Retention rate (from events in last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
  const recentEvents = events.filter((e) => e.timestamp >= thirtyDaysAgo);
  const passCount = recentEvents.filter((e) => e.grade >= 3).length;
  const retentionRate =
    recentEvents.length > 0 ? Math.round((passCount / recentEvents.length) * 100) : 0;

  return {
    totalCards: cards.length,
    totalReviews: events.length,
    reviewsToday,
    currentStreak,
    longestStreak,
    retentionRate,
    maturedCards,
    newCards,
    youngCards,
  };
}

// ─── Note Review ────────────────────────────────────────────────────────────

const NOTE_RECALL_GRADES: Record<NoteRecallRating, ReviewGrade> = {
  forgot: 1,
  hard: 2,
  good: 4,
  easy: 5,
};

/** Grade a note review and return updated reviewable note. */
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

/** Create a new ReviewableNote from a note path + title. */
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

// ─── Persistence ────────────────────────────────────────────────────────────

export function serializeRecords(records: Map<string, ReviewRecord>): string {
  return JSON.stringify(Object.fromEntries(records));
}

export function deserializeRecords(json: string): Map<string, ReviewRecord> {
  try {
    const obj = JSON.parse(json) as Record<string, ReviewRecord>;
    return new Map(Object.entries(obj));
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

export function serializeNoteReviews(notes: Map<string, ReviewableNote>): string {
  return JSON.stringify(Object.fromEntries(notes));
}

export function deserializeNoteReviews(json: string): Map<string, ReviewableNote> {
  try {
    const obj = JSON.parse(json) as Record<string, ReviewableNote>;
    return new Map(Object.entries(obj));
  } catch {
    return new Map();
  }
}
