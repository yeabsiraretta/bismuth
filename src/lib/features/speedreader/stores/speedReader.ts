/**
 * Speed Reader store — RSVP playback with ORP highlighting,
 * markdown cleanup, focus mode, and natural pacing.
 */
import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type { WordToken, ReaderState, SpeedReaderConfig } from '../types';
import { DEFAULT_SPEED_READER_CONFIG } from '../types';
import { tokenize, estimateReadingTime } from '../services/tokenizer';

export interface SpeedReaderState {
  active: boolean;
  words: string[];
  currentIndex: number;
  playing: boolean;
  wpm: number;
}

/** Whether the overlay is open. */
export const readerOpen = writable(false);

/** Current playback state. */
export const readerState = writable<ReaderState>('idle');

/** Tokenized words. */
export const readerTokens = writable<WordToken[]>([]);

/** Current word index. */
export const readerPosition = writable(0);

/** Config (persisted). */
export const readerConfig = writable<SpeedReaderConfig>(loadReaderConfig());

/** Derived: current word token. */
export const currentWordToken = derived(
  [readerTokens, readerPosition],
  ([$tokens, $pos]) => $tokens[$pos] ?? null
);

/** Derived: progress percentage. */
export const readerProgress = derived(
  [readerTokens, readerPosition],
  ([$tokens, $pos]) => $tokens.length > 0 ? Math.round(($pos / $tokens.length) * 100) : 0
);

/** Derived: estimated time remaining in seconds. */
export const timeRemaining = derived(
  [readerTokens, readerPosition, readerConfig],
  ([$tokens, $pos, $config]) => estimateReadingTime($tokens.slice($pos), $config.wpm)
);

// Legacy compat store for SpeedReaderPanel
export const speedReaderStore = derived(
  [readerOpen, readerTokens, readerPosition, readerState, readerConfig],
  ([$open, $tokens, $pos, $state, $cfg]) => ({
    active: $open,
    words: $tokens.map(t => t.text),
    currentIndex: $pos,
    playing: $state === 'playing',
    wpm: $cfg.wpm,
  })
);

export const currentWord = derived(currentWordToken, ($t) => $t?.text ?? '');
export const progress = derived(readerProgress, ($p) => $p);

let playTimer: ReturnType<typeof setTimeout> | null = null;

function loadReaderConfig(): SpeedReaderConfig {
  try {
    const stored = localStorage.getItem('bismuth-speed-reader-config');
    return stored ? { ...DEFAULT_SPEED_READER_CONFIG, ...JSON.parse(stored) } : DEFAULT_SPEED_READER_CONFIG;
  } catch { return DEFAULT_SPEED_READER_CONFIG; }
}

/** Start speed reader with given content and optional WPM. */
export function startSpeedReader(content: string, wpm?: number): void {
  const tokens = tokenize(content);
  if (tokens.length === 0) {
    log.warn('Speed Reader: no readable words found');
    return;
  }
  if (wpm) readerConfig.update(c => ({ ...c, wpm }));
  readerTokens.set(tokens);
  readerPosition.set(0);
  readerState.set('paused');
  readerOpen.set(true);
  log.info('Speed Reader started', { words: tokens.length, wpm: wpm ?? get(readerConfig).wpm });
}

/** Stop and close. */
export function stopSpeedReader(): void {
  stopTimer();
  readerOpen.set(false);
  readerState.set('idle');
  readerTokens.set([]);
  readerPosition.set(0);
}

/** Toggle play/pause. */
export function togglePlayPause(): void {
  const state = get(readerState);
  if (state === 'playing') {
    readerState.set('paused');
    stopTimer();
  } else if (state === 'paused' || state === 'idle') {
    readerState.set('playing');
    scheduleNext();
  } else if (state === 'finished') {
    readerPosition.set(0);
    readerState.set('playing');
    scheduleNext();
  }
}

/** Set WPM. */
export function setWpm(wpm: number): void {
  readerConfig.update(c => ({ ...c, wpm: Math.max(50, Math.min(1000, wpm)) }));
}

/** Advance one word (called by timer). */
export function advanceWord(): void {
  const tokens = get(readerTokens);
  const pos = get(readerPosition);
  if (pos >= tokens.length - 1) {
    readerState.set('finished');
    return;
  }
  readerPosition.set(pos + 1);
}

/** Skip backward. */
export function goBack(): void {
  const cfg = get(readerConfig);
  readerPosition.update(p => Math.max(0, p - cfg.skipWords));
  if (get(readerState) === 'playing') { stopTimer(); scheduleNext(); }
}

/** Skip forward. */
export function skipForward(): void {
  const cfg = get(readerConfig);
  const tokens = get(readerTokens);
  readerPosition.update(p => Math.min(tokens.length - 1, p + cfg.skipWords));
  if (get(readerState) === 'playing') { stopTimer(); scheduleNext(); }
}

/** Adjust WPM by delta. */
export function adjustWpm(delta: number): void {
  readerConfig.update(c => ({ ...c, wpm: Math.max(50, Math.min(1000, c.wpm + delta)) }));
}

/** Toggle focus mode. */
export function toggleFocusMode(): void {
  readerConfig.update(c => ({ ...c, focusMode: !c.focusMode }));
}

/** Reset to start. */
export function resetReader(): void {
  stopTimer();
  readerPosition.set(0);
  readerState.set('paused');
}

/** Returns delay in ms for a word. */
export function getWordDelay(word: string, wpm: number): number {
  const baseDelay = 60000 / wpm;
  if (/[.!?]$/.test(word)) return baseDelay * 1.8;
  if (/[,;:]$/.test(word)) return baseDelay * 1.3;
  if (word.length > 8) return baseDelay * 1.2;
  return baseDelay;
}

function stopTimer(): void {
  if (playTimer !== null) { clearTimeout(playTimer); playTimer = null; }
}

function scheduleNext(): void {
  const tokens = get(readerTokens);
  const pos = get(readerPosition);
  const cfg = get(readerConfig);
  if (pos >= tokens.length) { readerState.set('finished'); return; }
  const token = tokens[pos];
  const delay = (60000 / cfg.wpm) * token.delayMultiplier;
  playTimer = setTimeout(() => {
    if (get(readerState) !== 'playing') return;
    const next = get(readerPosition) + 1;
    if (next >= tokens.length) { readerState.set('finished'); return; }
    readerPosition.set(next);
    scheduleNext();
  }, delay);
}

/** Persist config. */
readerConfig.subscribe(cfg => {
  try { localStorage.setItem('bismuth-speed-reader-config', JSON.stringify(cfg)); }
  catch (e) { log.warn('Failed to persist speed reader config to localStorage', { error: String(e) }); }
});
