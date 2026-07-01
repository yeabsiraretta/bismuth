/**
 * Lazy Loader types — deferred feature loading with priority scheduling.
 *
 * Controls when features are loaded at startup:
 *   - eager:    loaded during vault init (core features)
 *   - high:     loaded immediately after vault ready (recently used)
 *   - normal:   loaded during idle time with stagger
 *   - low:      loaded only on demand (never preloaded)
 *   - disabled: feature is turned off, never loaded
 */

// ─── Priority ───────────────────────────────────────────────────────────────

export type LoadPriority = 'eager' | 'high' | 'normal' | 'low' | 'disabled';

export const PRIORITY_ORDER: Record<LoadPriority, number> = {
  eager: 0,
  high: 1,
  normal: 2,
  low: 3,
  disabled: 4,
};

// ─── Load timing entry ─────────────────────────────────────────────────────

export interface FeatureLoadTiming {
  featureId: string;
  /** Milliseconds to load (or null if not yet loaded). */
  durationMs: number | null;
  /** When the load completed (ISO string). */
  loadedAt: string | null;
  /** Whether the load was triggered by preload vs. on-demand. */
  trigger: 'preload' | 'demand' | 'eager';
  /** Whether loading succeeded. */
  success: boolean;
  /** Error message if failed. */
  error?: string;
}

// ─── Load profile (aggregated across sessions) ─────────────────────────────

export interface FeatureLoadProfile {
  featureId: string;
  /** Average load time across recent sessions (ms). */
  avgDurationMs: number;
  /** Number of times loaded. */
  loadCount: number;
  /** Last loaded timestamp. */
  lastLoaded: string;
  /** Current assigned priority. */
  priority: LoadPriority;
}

// ─── Configuration ──────────────────────────────────────────────────────────

export interface LazyLoaderConfig {
  /** Master switch — disable to load everything eagerly. */
  enabled: boolean;
  /** Base delay between staggered loads (ms). */
  staggerMs: number;
  /** Maximum concurrent loads. */
  maxConcurrent: number;
  /** Per-feature priority overrides (featureId -> priority). */
  priorityOverrides: Record<string, LoadPriority>;
  /** Whether to auto-promote frequently used features to 'high' priority. */
  autoPromote: boolean;
  /** Threshold: features loaded > N times in 30 days get auto-promoted. */
  autoPromoteThreshold: number;
  /** Show load timing in status bar. */
  showTimingInStatus: boolean;
}

export const DEFAULT_LAZY_LOADER_CONFIG: LazyLoaderConfig = {
  enabled: true,
  staggerMs: 150,
  maxConcurrent: 2,
  priorityOverrides: {},
  autoPromote: true,
  autoPromoteThreshold: 5,
  showTimingInStatus: false,
};

// ─── Batch operation types ──────────────────────────────────────────────────

export type BatchAction = 'enable-all' | 'disable-all' | 'reset-priorities';

// ─── Load queue entry ───────────────────────────────────────────────────────

export interface LoadQueueEntry {
  featureId: string;
  priority: LoadPriority;
  loader: () => Promise<unknown>;
  /** Resolved when loading completes. */
  resolve?: (value: unknown) => void;
  reject?: (reason: unknown) => void;
}
