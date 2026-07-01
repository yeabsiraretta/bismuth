/**
 * Review Store — manages "On This Day" state, config persistence,
 * auto-refresh at midnight, and notification triggers.
 */
import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type { ReviewConfig, ReviewGroup, ReviewEntry } from '../types/review';
import { DEFAULT_REVIEW_CONFIG } from '../types/review';
import { matchNotesToTimeSpans, pickRandomNote, type VaultNote } from '../services/reviewMatcher';

// ─── Configuration ───────────────────────────────────────────────────────────

const CONFIG_KEY = 'bismuth:journal-review-config';

function loadConfig(): ReviewConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_REVIEW_CONFIG, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_REVIEW_CONFIG };
}

const _config = writable<ReviewConfig>(loadConfig());
export const reviewConfig = { subscribe: _config.subscribe };

export function updateReviewConfig(patch: Partial<ReviewConfig>): void {
  _config.update((c) => {
    const updated = { ...c, ...patch };
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
    log.debug('[reviewStore] Config updated', patch);
    return updated;
  });
}

// ─── State ───────────────────────────────────────────────────────────────────

export interface ReviewState {
  groups: ReviewGroup[];
  randomNote: ReviewEntry | null;
  referenceDate: string;
  loading: boolean;
  lastRefresh: number;
  error: string | null;
}

const INITIAL_STATE: ReviewState = {
  groups: [],
  randomNote: null,
  referenceDate: new Date().toISOString().slice(0, 10),
  loading: false,
  lastRefresh: 0,
  error: null,
};

const _state = writable<ReviewState>({ ...INITIAL_STATE });
export const reviewState = { subscribe: _state.subscribe };

// Derived
export const reviewGroups = derived(_state, (s) => s.groups);
export const reviewRandomNote = derived(_state, (s) => s.randomNote);
export const reviewLoading = derived(_state, (s) => s.loading);
export const reviewTotalEntries = derived(_state, (s) =>
  s.groups.reduce((sum, g) => sum + g.entries.length, 0)
);

// ─── Actions ─────────────────────────────────────────────────────────────────

/** Run the review matching against vault notes */
export function runReview(notes: VaultNote[], referenceDate?: Date): void {
  const config = get(_config);
  const refDate = referenceDate ?? new Date();

  _state.update((s) => ({ ...s, loading: true, error: null }));

  try {
    const groups = matchNotesToTimeSpans(notes, config, refDate);
    const randomNote = config.showRandomNote ? pickRandomNote(notes, config) : null;

    _state.set({
      groups,
      randomNote,
      referenceDate: refDate.toISOString().slice(0, 10),
      loading: false,
      lastRefresh: Date.now(),
      error: null,
    });

    const totalEntries = groups.reduce((s, g) => s + g.entries.length, 0);
    log.info('[reviewStore] Review complete', {
      groupCount: groups.length,
      totalEntries,
      hasRandom: !!randomNote,
    });

    // Notification
    if (config.useNotifications && totalEntries > 0) {
      _notifyNewEntries(totalEntries);
    }
  } catch (err) {
    _state.update((s) => ({
      ...s,
      loading: false,
      error: `Review failed: ${err}`,
    }));
    log.error('[reviewStore] Review failed', err as Error);
  }
}

/** Shuffle the random note */
export function refreshRandomNote(notes: VaultNote[]): void {
  const config = get(_config);
  const randomNote = pickRandomNote(notes, config);
  _state.update((s) => ({ ...s, randomNote }));
}

/** Clear all review results */
export function clearReview(): void {
  _state.set({ ...INITIAL_STATE });
}

// ─── Midnight auto-refresh ──────────────────────────────────────────────────

let midnightTimer: ReturnType<typeof setTimeout> | null = null;
let midnightCallback: (() => void) | null = null;

/** Schedule auto-refresh at midnight */
export function scheduleMidnightRefresh(callback: () => void): void {
  clearMidnightRefresh();
  midnightCallback = callback;

  const config = get(_config);
  if (!config.autoRefresh) return;

  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight.getTime() - now.getTime();

  midnightTimer = setTimeout(() => {
    log.info('[reviewStore] Midnight refresh triggered');
    midnightCallback?.();
    // Re-schedule for next midnight
    scheduleMidnightRefresh(callback);
  }, msUntilMidnight);

  log.debug('[reviewStore] Midnight refresh scheduled', {
    msUntilMidnight,
    targetTime: midnight.toISOString(),
  });
}

/** Cancel midnight refresh timer */
export function clearMidnightRefresh(): void {
  if (midnightTimer !== null) {
    clearTimeout(midnightTimer);
    midnightTimer = null;
  }
  midnightCallback = null;
}

// ─── Notifications ───────────────────────────────────────────────────────────

function _notifyNewEntries(count: number): void {
  try {
    window.dispatchEvent(
      new CustomEvent('journal-review-notify', {
        detail: {
          count,
          message: `${count} note${count !== 1 ? 's' : ''} from this day in history`,
        },
      })
    );
  } catch {
    /* ignore in test env */
  }
}
