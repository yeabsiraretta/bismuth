import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  LoadQueueEntry,
  FeatureLoadTiming,
  FeatureLoadProfile,
  LazyLoaderConfig,
} from '../../types/lazyloader';
import { DEFAULT_LAZY_LOADER_CONFIG } from '../../types/lazyloader';
import {
  recordTiming,
  resolveFeaturePriority,
  sortQueue,
  filterLoadable,
  createSchedulerState,
  processQueue,
  totalLoadTime,
  slowestFeatures,
  countByPriority,
} from '../loadScheduler';

const cfg: LazyLoaderConfig = { ...DEFAULT_LAZY_LOADER_CONFIG };

// ─── recordTiming ───────────────────────────────────────────────────────────

describe('recordTiming', () => {
  it('adds a new profile entry', () => {
    const timing: FeatureLoadTiming = {
      featureId: 'graph',
      durationMs: 120,
      loadedAt: '2025-01-01T00:00:00Z',
      trigger: 'preload',
      success: true,
    };
    const profiles = recordTiming(timing, []);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].featureId).toBe('graph');
    expect(profiles[0].avgDurationMs).toBe(120);
    expect(profiles[0].loadCount).toBe(1);
  });

  it('updates existing profile with running average', () => {
    const existing: FeatureLoadProfile[] = [
      {
        featureId: 'graph',
        avgDurationMs: 100,
        loadCount: 4,
        lastLoaded: '2025-01-01T00:00:00Z',
        priority: 'normal',
      },
    ];
    const timing: FeatureLoadTiming = {
      featureId: 'graph',
      durationMs: 200,
      loadedAt: '2025-01-02T00:00:00Z',
      trigger: 'demand',
      success: true,
    };
    const profiles = recordTiming(timing, existing);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].loadCount).toBe(5);
    // (100*4 + 200) / 5 = 120
    expect(profiles[0].avgDurationMs).toBe(120);
  });

  it('skips failed timings', () => {
    const timing: FeatureLoadTiming = {
      featureId: 'graph',
      durationMs: 50,
      loadedAt: null,
      trigger: 'preload',
      success: false,
      error: 'Network error',
    };
    const profiles = recordTiming(timing, []);
    expect(profiles).toHaveLength(0);
  });

  it('skips null duration', () => {
    const timing: FeatureLoadTiming = {
      featureId: 'graph',
      durationMs: null,
      loadedAt: null,
      trigger: 'preload',
      success: true,
    };
    const profiles = recordTiming(timing, []);
    expect(profiles).toHaveLength(0);
  });
});

// ─── resolveFeaturePriority ─────────────────────────────────────────────────

describe('resolveFeaturePriority', () => {
  it('returns eager for core features', () => {
    expect(resolveFeaturePriority('files', cfg, [], true)).toBe('eager');
  });

  it('returns normal by default', () => {
    expect(resolveFeaturePriority('graph', cfg, [], false)).toBe('normal');
  });

  it('respects explicit override', () => {
    const overridden = { ...cfg, priorityOverrides: { graph: 'high' as const } };
    expect(resolveFeaturePriority('graph', overridden, [], false)).toBe('high');
  });

  it('auto-promotes frequently used features', () => {
    const profiles: FeatureLoadProfile[] = [
      {
        featureId: 'graph',
        avgDurationMs: 80,
        loadCount: 10,
        lastLoaded: '2025-01-01T00:00:00Z',
        priority: 'normal',
      },
    ];
    expect(resolveFeaturePriority('graph', cfg, profiles, false)).toBe('high');
  });

  it('does not auto-promote below threshold', () => {
    const profiles: FeatureLoadProfile[] = [
      {
        featureId: 'graph',
        avgDurationMs: 80,
        loadCount: 3,
        lastLoaded: '2025-01-01T00:00:00Z',
        priority: 'normal',
      },
    ];
    expect(resolveFeaturePriority('graph', cfg, profiles, false)).toBe('normal');
  });

  it('does not auto-promote when disabled', () => {
    const noPromo = { ...cfg, autoPromote: false };
    const profiles: FeatureLoadProfile[] = [
      {
        featureId: 'graph',
        avgDurationMs: 80,
        loadCount: 100,
        lastLoaded: '2025-01-01T00:00:00Z',
        priority: 'normal',
      },
    ];
    expect(resolveFeaturePriority('graph', noPromo, profiles, false)).toBe('normal');
  });
});

// ─── sortQueue ──────────────────────────────────────────────────────────────

describe('sortQueue', () => {
  it('sorts by priority order', () => {
    const queue: LoadQueueEntry[] = [
      { featureId: 'a', priority: 'low', loader: vi.fn() },
      { featureId: 'b', priority: 'eager', loader: vi.fn() },
      { featureId: 'c', priority: 'normal', loader: vi.fn() },
      { featureId: 'd', priority: 'high', loader: vi.fn() },
    ];
    const sorted = sortQueue(queue);
    expect(sorted.map((e) => e.featureId)).toEqual(['b', 'd', 'c', 'a']);
  });
});

describe('filterLoadable', () => {
  it('removes disabled entries', () => {
    const queue: LoadQueueEntry[] = [
      { featureId: 'a', priority: 'normal', loader: vi.fn() },
      { featureId: 'b', priority: 'disabled', loader: vi.fn() },
      { featureId: 'c', priority: 'high', loader: vi.fn() },
    ];
    const filtered = filterLoadable(queue);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((e) => e.featureId)).toEqual(['a', 'c']);
  });
});

// ─── processQueue ───────────────────────────────────────────────────────────

describe('processQueue', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('processes entries and records timings', async () => {
    const state = createSchedulerState();
    state.queue = [
      { featureId: 'a', priority: 'high', loader: () => Promise.resolve({ default: 'A' }) },
      { featureId: 'b', priority: 'normal', loader: () => Promise.resolve({ default: 'B' }) },
    ];

    const timings: FeatureLoadTiming[] = [];
    const fastCfg = { ...cfg, staggerMs: 0 };
    await processQueue(state, fastCfg, (t) => timings.push(t));

    expect(timings).toHaveLength(2);
    expect(timings[0].featureId).toBe('a');
    expect(timings[0].success).toBe(true);
    expect(timings[1].featureId).toBe('b');
    expect(state.completed.has('a')).toBe(true);
    expect(state.completed.has('b')).toBe(true);
  });

  it('handles load failures gracefully', async () => {
    const state = createSchedulerState();
    state.queue = [
      { featureId: 'fail', priority: 'normal', loader: () => Promise.reject(new Error('boom')) },
    ];

    const timings: FeatureLoadTiming[] = [];
    const fastCfg = { ...cfg, staggerMs: 0 };
    await processQueue(state, fastCfg, (t) => timings.push(t));

    expect(timings).toHaveLength(1);
    expect(timings[0].success).toBe(false);
    expect(timings[0].error).toContain('boom');
  });

  it('skips already completed entries', async () => {
    const state = createSchedulerState();
    const loader = vi.fn().mockResolvedValue({ default: 'X' });
    state.queue = [{ featureId: 'x', priority: 'normal', loader }];
    state.completed.add('x');

    const timings: FeatureLoadTiming[] = [];
    const fastCfg = { ...cfg, staggerMs: 0 };
    await processQueue(state, fastCfg, (t) => timings.push(t));

    expect(loader).not.toHaveBeenCalled();
    expect(timings).toHaveLength(0);
  });

  it('filters out disabled entries', async () => {
    const state = createSchedulerState();
    const loader = vi.fn().mockResolvedValue({ default: 'X' });
    state.queue = [{ featureId: 'x', priority: 'disabled', loader }];

    const timings: FeatureLoadTiming[] = [];
    const fastCfg = { ...cfg, staggerMs: 0 };
    await processQueue(state, fastCfg, (t) => timings.push(t));

    expect(loader).not.toHaveBeenCalled();
  });
});

// ─── Summary helpers ────────────────────────────────────────────────────────

describe('totalLoadTime', () => {
  it('sums all durations', () => {
    const timings: FeatureLoadTiming[] = [
      { featureId: 'a', durationMs: 100, loadedAt: '', trigger: 'preload', success: true },
      { featureId: 'b', durationMs: 200, loadedAt: '', trigger: 'demand', success: true },
      { featureId: 'c', durationMs: null, loadedAt: '', trigger: 'preload', success: false },
    ];
    expect(totalLoadTime(timings)).toBe(300);
  });
});

describe('slowestFeatures', () => {
  it('returns top N slowest', () => {
    const timings: FeatureLoadTiming[] = [
      { featureId: 'a', durationMs: 100, loadedAt: '', trigger: 'preload', success: true },
      { featureId: 'b', durationMs: 500, loadedAt: '', trigger: 'preload', success: true },
      { featureId: 'c', durationMs: 300, loadedAt: '', trigger: 'preload', success: true },
      { featureId: 'd', durationMs: 50, loadedAt: '', trigger: 'preload', success: true },
    ];
    const top2 = slowestFeatures(timings, 2);
    expect(top2.map((t) => t.featureId)).toEqual(['b', 'c']);
  });

  it('excludes failed timings', () => {
    const timings: FeatureLoadTiming[] = [
      { featureId: 'a', durationMs: 999, loadedAt: '', trigger: 'preload', success: false },
      { featureId: 'b', durationMs: 100, loadedAt: '', trigger: 'preload', success: true },
    ];
    const top = slowestFeatures(timings, 5);
    expect(top).toHaveLength(1);
    expect(top[0].featureId).toBe('b');
  });
});

describe('countByPriority', () => {
  it('counts entries per priority level', () => {
    const entries: LoadQueueEntry[] = [
      { featureId: 'a', priority: 'eager', loader: vi.fn() },
      { featureId: 'b', priority: 'high', loader: vi.fn() },
      { featureId: 'c', priority: 'normal', loader: vi.fn() },
      { featureId: 'd', priority: 'normal', loader: vi.fn() },
      { featureId: 'e', priority: 'disabled', loader: vi.fn() },
    ];
    const counts = countByPriority(entries);
    expect(counts).toEqual({ eager: 1, high: 1, normal: 2, low: 0, disabled: 1 });
  });
});
