import { describe, it, expect } from 'vitest';
import {
  timeProximityScore,
  editTimeScore,
  metadataScore,
  scoreAndRank,
} from '../services/insightsScorer';
import type { NoteContext } from '../services/insightsScorer';
import type { AaCandidate } from '../services/adamicAdar';
import { DEFAULT_INSIGHT_WEIGHTS } from '../types';

const DAY_MS = 1000 * 60 * 60 * 24;

describe('timeProximityScore', () => {
  const now = Date.now();

  it('returns 1 for same-day timestamps', () => {
    expect(timeProximityScore(now, now + 1000)).toBe(1);
  });

  it('returns high score for close timestamps', () => {
    expect(timeProximityScore(now, now + 2 * DAY_MS)).toBeGreaterThan(0.5);
  });

  it('returns 0 for timestamps a year apart', () => {
    expect(timeProximityScore(now, now + 365 * DAY_MS)).toBe(0);
  });

  it('returns low score for distant timestamps', () => {
    expect(timeProximityScore(now, now + 200 * DAY_MS)).toBeLessThan(0.3);
  });
});

describe('editTimeScore', () => {
  it('is an alias for timeProximityScore', () => {
    const now = Date.now();
    expect(editTimeScore(now, now + 10 * DAY_MS)).toBe(timeProximityScore(now, now + 10 * DAY_MS));
  });
});

describe('metadataScore', () => {
  it('returns 0 for empty tag arrays', () => {
    expect(metadataScore([], [])).toBe(0);
  });

  it('returns 1 for identical tags', () => {
    expect(metadataScore(['a', 'b'], ['a', 'b'])).toBe(1);
  });

  it('returns 0.5 for half overlap', () => {
    expect(metadataScore(['a', 'b'], ['a', 'c'])).toBeCloseTo(1 / 3);
  });

  it('returns 0 for no overlap', () => {
    expect(metadataScore(['a'], ['b'])).toBe(0);
  });
});

describe('scoreAndRank', () => {
  const candidates: AaCandidate[] = [
    { nodeId: 'note-a', aaScore: 2.0, commonNeighbors: ['x', 'y'] },
    { nodeId: 'note-b', aaScore: 1.0, commonNeighbors: ['x'] },
    { nodeId: 'note-c', aaScore: 3.0, commonNeighbors: ['x', 'y', 'z'] },
  ];
  const target: NoteContext = { path: 'target', label: 'Target' };
  const contexts = new Map<string, NoteContext>([
    ['note-a', { path: 'note-a', label: 'Note A' }],
    ['note-b', { path: 'note-b', label: 'Note B' }],
    ['note-c', { path: 'note-c', label: 'Note C' }],
  ]);
  const labels = new Map([
    ['note-a', 'Note A'],
    ['note-b', 'Note B'],
    ['note-c', 'Note C'],
  ]);

  it('ranks by AA score when only graph weight is used', () => {
    const weights = { ...DEFAULT_INSIGHT_WEIGHTS, time: 0, metadata: 0, editTime: 0 };
    const results = scoreAndRank(candidates, target, contexts, weights, labels);
    expect(results[0].path).toBe('note-c');
    expect(results[1].path).toBe('note-a');
    expect(results[2].path).toBe('note-b');
  });

  it('includes correct labels', () => {
    const weights = { ...DEFAULT_INSIGHT_WEIGHTS, time: 0, metadata: 0, editTime: 0 };
    const results = scoreAndRank(candidates, target, contexts, weights, labels);
    expect(results[0].label).toBe('Note C');
  });

  it('includes common neighbors', () => {
    const weights = { ...DEFAULT_INSIGHT_WEIGHTS, time: 0, metadata: 0, editTime: 0 };
    const results = scoreAndRank(candidates, target, contexts, weights, labels);
    expect(results[0].commonNeighbors).toContain('z');
  });

  it('always includes graph reason', () => {
    const weights = { ...DEFAULT_INSIGHT_WEIGHTS, time: 0, metadata: 0, editTime: 0 };
    const results = scoreAndRank(candidates, target, contexts, weights, labels);
    for (const r of results) {
      expect(r.reasons).toContain('graph');
    }
  });

  it('returns empty for empty candidates', () => {
    const results = scoreAndRank([], target, contexts, DEFAULT_INSIGHT_WEIGHTS, labels);
    expect(results).toHaveLength(0);
  });

  it('adds time reason when timestamps are close', () => {
    const now = Date.now();
    const tCtx: NoteContext = { path: 'target', label: 'T', createdAt: now };
    const cCtx = new Map<string, NoteContext>([
      ['note-a', { path: 'note-a', label: 'A', createdAt: now + DAY_MS }],
    ]);
    const weights = { ...DEFAULT_INSIGHT_WEIGHTS };
    const results = scoreAndRank(
      [{ nodeId: 'note-a', aaScore: 1, commonNeighbors: [] }],
      tCtx,
      cCtx,
      weights,
      labels
    );
    expect(results[0].reasons).toContain('time');
  });

  it('adds metadata reason when tags overlap', () => {
    const tCtx: NoteContext = { path: 'target', label: 'T', tags: ['science'] };
    const cCtx = new Map<string, NoteContext>([
      ['note-a', { path: 'note-a', label: 'A', tags: ['science', 'math'] }],
    ]);
    const weights = { ...DEFAULT_INSIGHT_WEIGHTS };
    const results = scoreAndRank(
      [{ nodeId: 'note-a', aaScore: 1, commonNeighbors: [] }],
      tCtx,
      cCtx,
      weights,
      labels
    );
    expect(results[0].reasons).toContain('metadata');
  });
});
