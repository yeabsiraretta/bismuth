/**
 * SM-2 scheduler unit tests — grade 0–5 pairwise coverage.
 */
import { describe, it, expect } from 'vitest';
import {
  gradeCard,
  getDueCards,
  serializeRecords,
  deserializeRecords,
} from '../services/scheduler';
import type { ReviewRecord } from '../services/scheduler';

function makeRecord(overrides: Partial<ReviewRecord> = {}): ReviewRecord {
  return {
    cardId: 'c1',
    nextReview: new Date(Date.now() - 1000).toISOString(), // overdue
    easeFactor: 2.5,
    intervalDays: 6,
    reviewCount: 2,
    lastReviewed: new Date().toISOString(),
    ...overrides,
  };
}

describe('gradeCard: SM-2 interval calculation', () => {
  it('grade 5 (easy): increases interval and ease', () => {
    const rec = gradeCard(
      makeRecord({ intervalDays: 6, easeFactor: 2.5, reviewCount: 3 }),
      'c1',
      5
    );
    expect(rec.intervalDays).toBeGreaterThan(6);
    expect(rec.easeFactor).toBeGreaterThanOrEqual(2.5);
  });

  it('grade 4 (good): increases interval', () => {
    const rec = gradeCard(
      makeRecord({ intervalDays: 6, easeFactor: 2.5, reviewCount: 3 }),
      'c1',
      4
    );
    expect(rec.intervalDays).toBeGreaterThan(6);
  });

  it('grade 3 (ok): interval grows but ease may decrease slightly', () => {
    const rec = gradeCard(
      makeRecord({ intervalDays: 6, easeFactor: 2.5, reviewCount: 3 }),
      'c1',
      3
    );
    expect(rec.intervalDays).toBeGreaterThan(0);
  });

  it('grade 2 (hard): resets interval to 1', () => {
    const rec = gradeCard(makeRecord({ reviewCount: 5 }), 'c1', 2);
    expect(rec.intervalDays).toBe(1);
  });

  it('grade 1 (wrong): resets interval to 1', () => {
    const rec = gradeCard(null, 'c1', 1);
    expect(rec.intervalDays).toBe(1);
  });

  it('grade 0 (blackout): resets interval to 1', () => {
    const rec = gradeCard(makeRecord({ reviewCount: 10 }), 'c1', 0);
    expect(rec.intervalDays).toBe(1);
  });

  it('ease factor never goes below 1.3', () => {
    let rec: ReviewRecord | null = null;
    for (let i = 0; i < 20; i++) rec = gradeCard(rec, 'c1', 0);
    expect(rec!.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('new card (null record): starts at interval 1', () => {
    const rec = gradeCard(null, 'new', 4);
    expect(rec.intervalDays).toBe(1);
    expect(rec.reviewCount).toBe(1);
  });

  it('second review: interval becomes 6', () => {
    const first = gradeCard(null, 'c1', 4);
    const second = gradeCard(first, 'c1', 4);
    expect(second.intervalDays).toBe(6);
  });
});

describe('getDueCards', () => {
  const cards = [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }];

  it('returns new cards (no record) as due', () => {
    const due = getDueCards(cards, new Map());
    expect(due).toHaveLength(3);
  });

  it('excludes cards not yet due', () => {
    const records = new Map<string, ReviewRecord>();
    const future = new Date(Date.now() + 86400000).toISOString();
    records.set('c1', makeRecord({ nextReview: future }));
    const due = getDueCards(cards, records);
    expect(due.some((c) => c.id === 'c1')).toBe(false);
    expect(due.some((c) => c.id === 'c2')).toBe(true);
  });

  it('includes overdue cards', () => {
    const records = new Map<string, ReviewRecord>();
    const past = new Date(Date.now() - 86400000).toISOString();
    records.set('c1', makeRecord({ nextReview: past }));
    const due = getDueCards(cards, records);
    expect(due.some((c) => c.id === 'c1')).toBe(true);
  });
});

describe('serializeRecords / deserializeRecords', () => {
  it('roundtrips a record map', () => {
    const map = new Map<string, ReviewRecord>();
    map.set('c1', makeRecord({ cardId: 'c1' }));
    const json = serializeRecords(map);
    const restored = deserializeRecords(json);
    expect(restored.get('c1')?.cardId).toBe('c1');
  });

  it('returns empty map for invalid JSON', () => {
    const result = deserializeRecords('{invalid');
    expect(result.size).toBe(0);
  });
});

// ─── FSRS algorithm ─────────────────────────────────────────────────────────

import { fsrsGrade } from '../services/fsrs';

describe('fsrsGrade', () => {
  it('initializes state on first review', () => {
    const { state, intervalDays } = fsrsGrade(null, 4);
    expect(state.reps).toBe(1);
    expect(state.stability).toBeGreaterThan(0);
    expect(state.difficulty).toBeGreaterThan(0);
    expect(intervalDays).toBeGreaterThanOrEqual(1);
  });

  it('maintains or increases stability on good grade', () => {
    const first = fsrsGrade(null, 4);
    const second = fsrsGrade(first.state, 4);
    // When elapsed = 0, retrievability = 1.0; stability stays same or grows
    expect(second.state.stability).toBeGreaterThanOrEqual(first.state.stability);
    expect(second.state.reps).toBe(2);
  });

  it('tracks lapses on again grade', () => {
    const first = fsrsGrade(null, 4);
    const lapse = fsrsGrade(first.state, 0);
    expect(lapse.state.lapses).toBe(1);
  });
});

// ─── Unified grading ────────────────────────────────────────────────────────

import { gradeCardWithAlgorithm } from '../services/scheduler';

describe('gradeCardWithAlgorithm', () => {
  it('dispatches to SM-2 by default', () => {
    const rec = gradeCardWithAlgorithm(null, 'c1', 4);
    expect(rec.intervalDays).toBe(1);
    expect(rec.fsrs).toBeUndefined();
  });

  it('dispatches to FSRS when algorithm is fsrs', () => {
    const rec = gradeCardWithAlgorithm(null, 'c1', 4, 'fsrs');
    expect(rec.fsrs).toBeDefined();
    expect(rec.fsrs!.reps).toBe(1);
  });
});

// ─── Deck tree ──────────────────────────────────────────────────────────────

import { buildDeckTree, getCardsInDeck } from '../services/scheduler';
import type { Flashcard } from '../types/flashcard';

function makeCard(id: string, deck: string): Flashcard {
  return {
    id,
    type: 'basic',
    front: 'Q',
    back: 'A',
    tags: [],
    deck,
    sourcePath: 'test.md',
    sourceLine: 0,
    ankiNoteId: null,
  };
}

describe('buildDeckTree', () => {
  it('builds hierarchical tree from flat cards', () => {
    const cards = [
      makeCard('1', 'Bismuth::CS::Algo'),
      makeCard('2', 'Bismuth::CS::Algo'),
      makeCard('3', 'Bismuth::Math'),
    ];
    const tree = buildDeckTree(cards, new Map());
    expect(tree.cardCount).toBe(3);
    expect(tree.children).toHaveLength(1); // Bismuth
    const bismuth = tree.children[0];
    expect(bismuth.children).toHaveLength(2); // CS, Math
  });

  it('counts due cards for new (unreviewed) cards', () => {
    const cards = [makeCard('1', 'Bismuth')];
    const tree = buildDeckTree(cards, new Map());
    expect(tree.dueCount).toBe(1);
  });
});

describe('getCardsInDeck', () => {
  it('returns cards matching deck prefix', () => {
    const cards = [makeCard('1', 'Bismuth::CS::Algo'), makeCard('2', 'Bismuth::Math')];
    const result = getCardsInDeck(cards, 'Bismuth::CS');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('returns all cards for empty deck path', () => {
    const cards = [makeCard('1', 'Bismuth'), makeCard('2', 'Other')];
    expect(getCardsInDeck(cards, '')).toHaveLength(2);
  });
});

// ─── Statistics ─────────────────────────────────────────────────────────────

import { computeStats } from '../services/scheduler';

describe('computeStats', () => {
  it('computes correct counts with no reviews', () => {
    const cards = [makeCard('1', 'B'), makeCard('2', 'B')];
    const stats = computeStats(cards, new Map(), []);
    expect(stats.totalCards).toBe(2);
    expect(stats.newCards).toBe(2);
    expect(stats.totalReviews).toBe(0);
    expect(stats.retentionRate).toBe(0);
  });
});

// ─── Note review ────────────────────────────────────────────────────────────

import { gradeNoteReview, createReviewableNote } from '../services/scheduler';

describe('gradeNoteReview', () => {
  it('schedules note for future review on good rating', () => {
    const note = createReviewableNote('test.md', 'Test');
    const updated = gradeNoteReview(note, 'good');
    expect(updated.reviewCount).toBe(1);
    expect(new Date(updated.nextReview).getTime()).toBeGreaterThan(Date.now() - 1000);
  });

  it('createReviewableNote initializes with sane defaults', () => {
    const note = createReviewableNote('a.md', 'A');
    expect(note.intervalDays).toBe(0);
    expect(note.easeFactor).toBe(2.5);
    expect(note.reviewCount).toBe(0);
  });
});
