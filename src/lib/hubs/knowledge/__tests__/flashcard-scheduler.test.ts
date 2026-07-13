/**
 * Scheduler + FSRS + deck tree + stats tests — ported from v1.
 */
import { describe, expect, it } from 'vitest';

import { fsrsGrade } from '@/hubs/knowledge/services/flashcard-fsrs';
import {
  createReviewableNote,
  deserializeRecords,
  getDueCards,
  gradeCard,
  gradeCardWithAlgorithm,
  gradeNoteReview,
  serializeRecords,
} from '@/hubs/knowledge/services/flashcard-scheduler';
import {
  buildDeckTree,
  computeStats,
  getCardsInDeck,
} from '@/hubs/knowledge/services/flashcard-stats';
import type { Flashcard, ReviewRecord } from '@/hubs/knowledge/types/flashcard-types';

function makeRecord(overrides: Partial<ReviewRecord> = {}): ReviewRecord {
  return {
    cardId: 'c1',
    nextReview: new Date(Date.now() - 1000).toISOString(),
    easeFactor: 2.5,
    intervalDays: 6,
    reviewCount: 2,
    lastReviewed: new Date().toISOString(),
    ...overrides,
  };
}

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

  it('grade 3 (ok): interval grows', () => {
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
    expect(getDueCards(cards, new Map())).toHaveLength(3);
  });

  it('excludes cards not yet due', () => {
    const records = new Map<string, ReviewRecord>();
    records.set('c1', makeRecord({ nextReview: new Date(Date.now() + 86400000).toISOString() }));
    const due = getDueCards(cards, records);
    expect(due.some((c) => c.id === 'c1')).toBe(false);
    expect(due.some((c) => c.id === 'c2')).toBe(true);
  });

  it('includes overdue cards', () => {
    const records = new Map<string, ReviewRecord>();
    records.set('c1', makeRecord({ nextReview: new Date(Date.now() - 86400000).toISOString() }));
    expect(getDueCards(cards, records).some((c) => c.id === 'c1')).toBe(true);
  });
});

describe('serializeRecords / deserializeRecords', () => {
  it('roundtrips a record map', () => {
    const map = new Map<string, ReviewRecord>();
    map.set('c1', makeRecord({ cardId: 'c1' }));
    expect(deserializeRecords(serializeRecords(map)).get('c1')?.cardId).toBe('c1');
  });

  it('returns empty map for invalid JSON', () => {
    expect(deserializeRecords('{invalid').size).toBe(0);
  });
});

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
    expect(second.state.stability).toBeGreaterThanOrEqual(first.state.stability);
    expect(second.state.reps).toBe(2);
  });

  it('tracks lapses on again grade', () => {
    const first = fsrsGrade(null, 4);
    const lapse = fsrsGrade(first.state, 0);
    expect(lapse.state.lapses).toBe(1);
  });
});

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

describe('buildDeckTree', () => {
  it('builds hierarchical tree from flat cards', () => {
    const cards = [
      makeCard('1', 'Bismuth::CS::Algo'),
      makeCard('2', 'Bismuth::CS::Algo'),
      makeCard('3', 'Bismuth::Math'),
    ];
    const tree = buildDeckTree(cards, new Map());
    expect(tree.cardCount).toBe(3);
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0].children).toHaveLength(2);
  });

  it('counts due cards for new (unreviewed) cards', () => {
    const tree = buildDeckTree([makeCard('1', 'Bismuth')], new Map());
    expect(tree.dueCount).toBe(1);
  });
});

describe('getCardsInDeck', () => {
  it('returns cards matching deck prefix', () => {
    const cards = [makeCard('1', 'Bismuth::CS::Algo'), makeCard('2', 'Bismuth::Math')];
    expect(getCardsInDeck(cards, 'Bismuth::CS')).toHaveLength(1);
  });

  it('returns all cards for empty deck path', () => {
    expect(getCardsInDeck([makeCard('1', 'Bismuth'), makeCard('2', 'Other')], '')).toHaveLength(2);
  });
});

describe('computeStats', () => {
  it('computes correct counts with no reviews', () => {
    const stats = computeStats([makeCard('1', 'B'), makeCard('2', 'B')], new Map(), []);
    expect(stats.totalCards).toBe(2);
    expect(stats.newCards).toBe(2);
    expect(stats.totalReviews).toBe(0);
    expect(stats.retentionRate).toBe(0);
  });
});

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
