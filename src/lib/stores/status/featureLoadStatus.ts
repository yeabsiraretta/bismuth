/**
 * Feature Load Status — tracks per-feature load state, drives status bar
 * loading indicators and FeatureToggles UI badges.
 *
 * States: idle -> loading -> loaded | error
 *         loaded -> unloaded (via unloadFeature)
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import { registerStatusItem, removeStatusItem, updateStatusItem } from './status';

export type FeatureLoadState = 'idle' | 'loading' | 'loaded' | 'error' | 'unloaded';

export interface FeatureStatus {
  state: FeatureLoadState;
  /** Elapsed ms while loading or total load time once loaded */
  elapsedMs: number;
  /** Error message if state === 'error' */
  error?: string;
  /** Timestamp when loading started */
  startedAt?: number;
}

const featureStatuses = writable<Map<string, FeatureStatus>>(new Map());

// ---- Timer management for elapsed display ----
const activeTimers = new Map<string, ReturnType<typeof setInterval>>();

function startElapsedTimer(featureId: string): void {
  stopElapsedTimer(featureId);
  const interval = setInterval(() => {
    featureStatuses.update((map) => {
      const entry = map.get(featureId);
      if (!entry || entry.state !== 'loading' || !entry.startedAt) return map;
      const next = new Map(map);
      next.set(featureId, { ...entry, elapsedMs: Math.round(performance.now() - entry.startedAt) });
      return next;
    });
    // Update status bar label with elapsed time
    const current = get(featureStatuses).get(featureId);
    if (current?.state === 'loading') {
      const secs = (current.elapsedMs / 1000).toFixed(1);
      updateStatusItem(`feature-load-${featureId}`, { label: `Loading ${featureId}... ${secs}s` });
    }
  }, 250);
  activeTimers.set(featureId, interval);
}

function stopElapsedTimer(featureId: string): void {
  const timer = activeTimers.get(featureId);
  if (timer) {
    clearInterval(timer);
    activeTimers.delete(featureId);
  }
}

// ---- Public API ----

/** Mark a feature as loading and register a status bar item. */
export function markLoading(featureId: string): void {
  const now = performance.now();
  featureStatuses.update((map) => {
    const next = new Map(map);
    next.set(featureId, { state: 'loading', elapsedMs: 0, startedAt: now });
    return next;
  });
  registerStatusItem({
    id: `feature-load-${featureId}`,
    position: 'right',
    icon: 'loader',
    label: `Loading ${featureId}...`,
    tooltip: `Loading ${featureId} feature module`,
    priority: 5,
  });
  startElapsedTimer(featureId);
  log.info('Feature load: started', { featureId });
}

/** Mark a feature as loaded and remove status bar item. */
export function markLoaded(featureId: string): void {
  stopElapsedTimer(featureId);
  const entry = get(featureStatuses).get(featureId);
  const elapsed = entry?.startedAt ? Math.round(performance.now() - entry.startedAt) : 0;
  featureStatuses.update((map) => {
    const next = new Map(map);
    next.set(featureId, { state: 'loaded', elapsedMs: elapsed });
    return next;
  });
  removeStatusItem(`feature-load-${featureId}`);
  log.info('Feature load: complete', { featureId, elapsedMs: elapsed });
}

/** Mark a feature as failed. */
export function markError(featureId: string, error: string): void {
  stopElapsedTimer(featureId);
  const entry = get(featureStatuses).get(featureId);
  const elapsed = entry?.startedAt ? Math.round(performance.now() - entry.startedAt) : 0;
  featureStatuses.update((map) => {
    const next = new Map(map);
    next.set(featureId, { state: 'error', elapsedMs: elapsed, error });
    return next;
  });
  updateStatusItem(`feature-load-${featureId}`, {
    icon: 'alert-circle',
    label: `Failed: ${featureId}`,
    tooltip: error,
  });
  setTimeout(() => removeStatusItem(`feature-load-${featureId}`), 5000);
  log.warn('Feature load: failed', { featureId, error });
}

/** Mark a feature as unloaded (removed from cache). */
export function markUnloaded(featureId: string): void {
  stopElapsedTimer(featureId);
  featureStatuses.update((map) => {
    const next = new Map(map);
    next.set(featureId, { state: 'unloaded', elapsedMs: 0 });
    return next;
  });
  log.info('Feature load: unloaded', { featureId });
}

/** Reset a feature back to idle. */
export function markIdle(featureId: string): void {
  stopElapsedTimer(featureId);
  featureStatuses.update((map) => {
    const next = new Map(map);
    next.delete(featureId);
    return next;
  });
}

/** Get current state for a feature. */
export function getFeatureLoadState(featureId: string): FeatureLoadState {
  return get(featureStatuses).get(featureId)?.state ?? 'idle';
}

// ---- Derived stores ----

/** All currently loading features. */
export const loadingFeatures = derived(featureStatuses, ($map) =>
  [...$map.entries()].filter(([, s]) => s.state === 'loading').map(([id]) => id)
);

/** Number of currently loading features. */
export const loadingCount = derived(loadingFeatures, ($f) => $f.length);

/** All loaded features. */
export const loadedFeatures = derived(featureStatuses, ($map) =>
  [...$map.entries()].filter(([, s]) => s.state === 'loaded').map(([id]) => id)
);

/** Reactive map for UI consumption. */
export const featureLoadStates = derived(featureStatuses, ($map) => Object.fromEntries($map));
