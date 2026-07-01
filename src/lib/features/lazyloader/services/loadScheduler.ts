/**
 * Load Scheduler — priority-aware, concurrency-limited feature loader.
 *
 * Manages a priority queue of feature modules to load, respecting
 * concurrency limits and stagger delays. Records load timings for
 * profiling and auto-promotion.
 */

import { log } from '@/utils/logger';
import type {
  LoadPriority,
  LoadQueueEntry,
  FeatureLoadTiming,
  FeatureLoadProfile,
  LazyLoaderConfig,
} from '../types/lazyloader';
import { PRIORITY_ORDER } from '../types/lazyloader';

// ─── Timing history ─────────────────────────────────────────────────────────

const PROFILE_KEY = 'bismuth-lazy-profiles';
const MAX_PROFILES = 50;

/** Load saved profiles from localStorage. */
export function loadProfiles(): FeatureLoadProfile[] {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Persist profiles. */
export function saveProfiles(profiles: FeatureLoadProfile[]): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles.slice(-MAX_PROFILES)));
  } catch {
    log.warn('Failed to persist lazy loader profiles');
  }
}

/** Record a load timing into the profile history. */
export function recordTiming(
  timing: FeatureLoadTiming,
  profiles: FeatureLoadProfile[]
): FeatureLoadProfile[] {
  if (!timing.success || timing.durationMs === null) return profiles;
  const existing = profiles.find((p) => p.featureId === timing.featureId);
  if (existing) {
    const total = existing.avgDurationMs * existing.loadCount + timing.durationMs;
    existing.loadCount++;
    existing.avgDurationMs = Math.round(total / existing.loadCount);
    existing.lastLoaded = timing.loadedAt ?? new Date().toISOString();
    return [...profiles];
  }
  return [
    ...profiles,
    {
      featureId: timing.featureId,
      avgDurationMs: timing.durationMs,
      loadCount: 1,
      lastLoaded: timing.loadedAt ?? new Date().toISOString(),
      priority: 'normal',
    },
  ];
}

// ─── Priority resolution ────────────────────────────────────────────────────

/** Resolve the effective priority for a feature. */
export function resolveFeaturePriority(
  featureId: string,
  config: LazyLoaderConfig,
  profiles: FeatureLoadProfile[],
  isCoreFeature: boolean
): LoadPriority {
  if (isCoreFeature) return 'eager';
  // Explicit override
  const override = config.priorityOverrides[featureId];
  if (override) return override;
  // Auto-promote
  if (config.autoPromote) {
    const profile = profiles.find((p) => p.featureId === featureId);
    if (profile && profile.loadCount >= config.autoPromoteThreshold) return 'high';
  }
  return 'normal';
}

// ─── Load queue ─────────────────────────────────────────────────────────────

/** Sort queue entries by priority (lower number = higher priority). */
export function sortQueue(queue: LoadQueueEntry[]): LoadQueueEntry[] {
  return [...queue].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

/** Filter queue to only loadable entries (not disabled). */
export function filterLoadable(queue: LoadQueueEntry[]): LoadQueueEntry[] {
  return queue.filter((e) => e.priority !== 'disabled');
}

// ─── Scheduler ──────────────────────────────────────────────────────────────

export interface SchedulerState {
  queue: LoadQueueEntry[];
  active: Set<string>;
  completed: Set<string>;
  timings: FeatureLoadTiming[];
  running: boolean;
}

/** Create a fresh scheduler state. */
export function createSchedulerState(): SchedulerState {
  return {
    queue: [],
    active: new Set(),
    completed: new Set(),
    timings: [],
    running: false,
  };
}

/**
 * Process the load queue, respecting concurrency limits and stagger delays.
 * Returns all timings once the queue is drained.
 */
export async function processQueue(
  state: SchedulerState,
  config: LazyLoaderConfig,
  onTiming: (timing: FeatureLoadTiming) => void
): Promise<FeatureLoadTiming[]> {
  if (state.running) return state.timings;
  state.running = true;

  const sorted = sortQueue(filterLoadable(state.queue));

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    if (state.completed.has(entry.featureId)) continue;

    // Wait for a concurrency slot
    while (state.active.size >= config.maxConcurrent) {
      await new Promise((r) => setTimeout(r, 50));
    }

    // Stagger delay (skip for eager/high priority)
    if (entry.priority === 'normal' && i > 0) {
      await new Promise((r) => setTimeout(r, config.staggerMs));
    }

    state.active.add(entry.featureId);
    loadSingle(entry, state, onTiming);
  }

  // Wait for all active loads to finish
  while (state.active.size > 0) {
    await new Promise((r) => setTimeout(r, 50));
  }

  state.running = false;
  return state.timings;
}

async function loadSingle(
  entry: LoadQueueEntry,
  state: SchedulerState,
  onTiming: (timing: FeatureLoadTiming) => void
): Promise<void> {
  const start = performance.now();
  const trigger = entry.priority === 'eager' ? 'eager' : 'preload';

  try {
    const result = await entry.loader();
    const durationMs = Math.round(performance.now() - start);
    const timing: FeatureLoadTiming = {
      featureId: entry.featureId,
      durationMs,
      loadedAt: new Date().toISOString(),
      trigger,
      success: true,
    };
    state.timings.push(timing);
    state.completed.add(entry.featureId);
    entry.resolve?.(result);
    onTiming(timing);
    log.debug('Lazy loader: feature loaded', { featureId: entry.featureId, durationMs, trigger });
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    const timing: FeatureLoadTiming = {
      featureId: entry.featureId,
      durationMs,
      loadedAt: new Date().toISOString(),
      trigger,
      success: false,
      error: String(err),
    };
    state.timings.push(timing);
    entry.reject?.(err);
    onTiming(timing);
    log.warn('Lazy loader: feature failed to load', {
      featureId: entry.featureId,
      error: String(err),
    });
  } finally {
    state.active.delete(entry.featureId);
  }
}

// ─── Summary helpers ────────────────────────────────────────────────────────

/** Compute total load time from timings. */
export function totalLoadTime(timings: FeatureLoadTiming[]): number {
  return timings.reduce((sum, t) => sum + (t.durationMs ?? 0), 0);
}

/** Get the N slowest features. */
export function slowestFeatures(timings: FeatureLoadTiming[], n: number): FeatureLoadTiming[] {
  return [...timings]
    .filter((t) => t.success && t.durationMs !== null)
    .sort((a, b) => (b.durationMs ?? 0) - (a.durationMs ?? 0))
    .slice(0, n);
}

/** Count features by priority. */
export function countByPriority(entries: LoadQueueEntry[]): Record<LoadPriority, number> {
  const counts: Record<LoadPriority, number> = {
    eager: 0,
    high: 0,
    normal: 0,
    low: 0,
    disabled: 0,
  };
  for (const e of entries) counts[e.priority]++;
  return counts;
}
