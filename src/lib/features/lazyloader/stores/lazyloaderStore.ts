/**
 * Lazy Loader store — config persistence, load profiles,
 * batch enable/disable, and integration with feature registry.
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import { FEATURE_REGISTRY, isCoreFeature } from '@/stores/settings/featureRegistry';
import { featureFlags } from '@/stores/settings/features';
import type {
  LazyLoaderConfig,
  LoadPriority,
  FeatureLoadTiming,
  FeatureLoadProfile,
  BatchAction,
  LoadQueueEntry,
} from '../types/lazyloader';
import { DEFAULT_LAZY_LOADER_CONFIG } from '../types/lazyloader';
import {
  loadProfiles,
  saveProfiles,
  recordTiming,
  resolveFeaturePriority,
  createSchedulerState,
  processQueue,
  totalLoadTime,
  slowestFeatures,
  countByPriority,
} from '../services/loadScheduler';

const STORAGE_KEY = 'bismuth-lazy-loader';

// ─── Config persistence ─────────────────────────────────────────────────────

function loadConfig(): LazyLoaderConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_LAZY_LOADER_CONFIG };
    return { ...DEFAULT_LAZY_LOADER_CONFIG, ...JSON.parse(stored) };
  } catch {
    return { ...DEFAULT_LAZY_LOADER_CONFIG };
  }
}

function persistConfig(config: LazyLoaderConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    log.warn('Failed to persist Lazy Loader config');
  }
}

// ─── Stores ─────────────────────────────────────────────────────────────────

export const lazyConfig = writable<LazyLoaderConfig>(loadConfig());
export const loadTimings = writable<FeatureLoadTiming[]>([]);
export const loadProfileStore = writable<FeatureLoadProfile[]>(loadProfiles());
export const isLoading = writable(false);

// ─── Derived stores ─────────────────────────────────────────────────────────

export const isEnabled = derived(lazyConfig, ($c) => $c.enabled);

export const totalLoadTimeMs = derived(loadTimings, ($t) => totalLoadTime($t));

export const top5Slowest = derived(loadTimings, ($t) => slowestFeatures($t, 5));

export const loadedCount = derived(loadTimings, ($t) => $t.filter((t) => t.success).length);

export const failedCount = derived(loadTimings, ($t) => $t.filter((t) => !t.success).length);

export const priorityCounts = derived(lazyConfig, ($c) => {
  const entries = buildQueueEntries($c);
  return countByPriority(entries);
});

// ─── Config actions ─────────────────────────────────────────────────────────

function update(fn: (c: LazyLoaderConfig) => LazyLoaderConfig): void {
  lazyConfig.update((c) => {
    const next = fn(c);
    persistConfig(next);
    return next;
  });
}

export function toggleEnabled(): void {
  update((c) => ({ ...c, enabled: !c.enabled }));
}

export function setStaggerMs(ms: number): void {
  update((c) => ({ ...c, staggerMs: Math.max(0, Math.min(ms, 2000)) }));
}

export function setMaxConcurrent(n: number): void {
  update((c) => ({ ...c, maxConcurrent: Math.max(1, Math.min(n, 8)) }));
}

export function toggleAutoPromote(): void {
  update((c) => ({ ...c, autoPromote: !c.autoPromote }));
}

export function toggleShowTiming(): void {
  update((c) => ({ ...c, showTimingInStatus: !c.showTimingInStatus }));
}

export function setFeaturePriority(featureId: string, priority: LoadPriority): void {
  if (isCoreFeature(featureId)) return;
  update((c) => ({
    ...c,
    priorityOverrides: { ...c.priorityOverrides, [featureId]: priority },
  }));
}

export function clearFeaturePriority(featureId: string): void {
  update((c) => {
    const overrides = { ...c.priorityOverrides };
    delete overrides[featureId];
    return { ...c, priorityOverrides: overrides };
  });
}

// ─── Batch operations ───────────────────────────────────────────────────────

export function executeBatch(action: BatchAction): void {
  if (action === 'enable-all') {
    const flags = get(featureFlags);
    for (const f of FEATURE_REGISTRY) {
      if (f.tier === 'optional' && !flags[f.id]) {
        featureFlags.setFlag(f.id, true);
      }
    }
    // Clear all disabled overrides
    update((c) => {
      const overrides = { ...c.priorityOverrides };
      for (const key of Object.keys(overrides)) {
        if (overrides[key] === 'disabled') delete overrides[key];
      }
      return { ...c, priorityOverrides: overrides };
    });
    log.info('Lazy loader: all features enabled');
  } else if (action === 'disable-all') {
    for (const f of FEATURE_REGISTRY) {
      if (f.tier === 'optional') {
        featureFlags.setFlag(f.id, false);
        setFeaturePriority(f.id, 'disabled');
      }
    }
    log.info('Lazy loader: all optional features disabled');
  } else if (action === 'reset-priorities') {
    update((c) => ({ ...c, priorityOverrides: {} }));
    log.info('Lazy loader: priorities reset to defaults');
  }
}

// ─── Queue building ─────────────────────────────────────────────────────────

/** Map of feature IDs to their dynamic import loaders. */
const LOADERS: Record<string, () => Promise<unknown>> = {
  graph: () => import('@/features/graph'),
  tag: () => import('@/features/tag'),
  entity: () => import('@/features/entity'),
  backlinks: () => import('@/features/backlinks'),
  flashcards: () => import('@/features/flashcards'),
  capture: () => import('@/features/capture'),
  tasks: () => import('@/features/tasks'),
  gamify: () => import('@/features/gamify'),
  template: () => import('@/features/template'),
  changelog: () => import('@/features/changelog'),
  linting: () => import('@/features/linting'),
  calendar: () => import('@/features/calendar'),
  speedreader: () => import('@/features/speedreader'),
  canvas: () => import('@/features/canvas'),
  git: () => import('@/features/git'),
  publishing: () => import('@/features/publishing'),
  rss: () => import('@/features/rss'),
  voice: () => import('@/features/voice'),
  llm: () => import('@/features/llm'),
  navigator: () => import('@/features/navigator'),
  longform: () => import('@/features/longform'),
  arbor: () => import('@/features/arbor'),
  importer: () => import('@/features/importer'),
  annotator: () => import('@/features/annotator'),
  periodic: () => import('@/features/periodic'),
  search: () => import('@/features/search'),
};

function buildQueueEntries(config: LazyLoaderConfig): LoadQueueEntry[] {
  const profiles = get(loadProfileStore);
  const flags = get(featureFlags);
  const entries: LoadQueueEntry[] = [];

  for (const f of FEATURE_REGISTRY) {
    if (!f.preloadKey) continue;
    const loader = LOADERS[f.preloadKey];
    if (!loader) continue;

    // Disabled in feature flags → skip
    if (!isCoreFeature(f.id) && !flags[f.id]) continue;

    const priority = resolveFeaturePriority(f.id, config, profiles, isCoreFeature(f.id));
    entries.push({ featureId: f.id, priority, loader });
  }
  return entries;
}

// ─── Main entry point ───────────────────────────────────────────────────────

/**
 * Run the lazy loader: build the queue from the feature registry,
 * resolve priorities, and process with staggered concurrency.
 */
export async function runLazyLoader(): Promise<FeatureLoadTiming[]> {
  const config = get(lazyConfig);
  if (!config.enabled) {
    log.debug('Lazy loader disabled — skipping');
    return [];
  }

  isLoading.set(true);
  const state = createSchedulerState();
  state.queue = buildQueueEntries(config);

  log.info('Lazy loader: starting', {
    queueSize: state.queue.length,
    staggerMs: config.staggerMs,
    maxConcurrent: config.maxConcurrent,
  });

  const timings = await processQueue(state, config, (timing) => {
    loadTimings.update((t) => [...t, timing]);
    loadProfileStore.update((p) => {
      const updated = recordTiming(timing, p);
      saveProfiles(updated);
      return updated;
    });
  });

  isLoading.set(false);
  log.info('Lazy loader: complete', {
    loaded: timings.filter((t) => t.success).length,
    failed: timings.filter((t) => !t.success).length,
    totalMs: totalLoadTime(timings),
  });

  return timings;
}

/** Get the resolved priority for a specific feature. */
export function getFeaturePriority(featureId: string): LoadPriority {
  const config = get(lazyConfig);
  const profiles = get(loadProfileStore);
  return resolveFeaturePriority(featureId, config, profiles, isCoreFeature(featureId));
}

/** Load a single feature module on demand (triggered by toggle). */
export async function loadFeatureOnDemand(featureId: string): Promise<boolean> {
  const loader = LOADERS[FEATURE_REGISTRY.find((f) => f.id === featureId)?.preloadKey ?? ''];
  if (!loader) return true;
  const { markLoading, markLoaded, markError } = await import('@/stores/status/featureLoadStatus');
  markLoading(featureId);
  try {
    await loader();
    markLoaded(featureId);
    return true;
  } catch (e) {
    markError(featureId, String(e));
    return false;
  }
}

/** Unload a feature by marking it unloaded. */
export function unloadFeature(featureId: string): void {
  import('@/stores/status/featureLoadStatus').then((m) => m.markUnloaded(featureId));
}

/** Clear all load timing data for the current session. */
export function clearTimings(): void {
  loadTimings.set([]);
}

/** Clear all stored profiles. */
export function clearProfiles(): void {
  loadProfileStore.set([]);
  localStorage.removeItem('bismuth-lazy-profiles');
}
