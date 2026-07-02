import { writable, derived } from 'svelte/store';
import { log } from '@/utils/logger';

export interface StartupEntry {
  durationMs: number;
  timestamp: string;
}

const _current = writable<StartupEntry | null>(null);

export const startupHistory = derived(_current, ($c) => ($c ? [$c] : []));

export const lastDuration = derived(_current, ($c) => ($c ? $c.durationMs : null));

/**
 * Records the startup duration for this session.
 * Replaces any previous value — timing resets on every refresh/relaunch.
 * Called from appInit after vault-ready.
 * No PII collected — only millisecond duration and ISO timestamp.
 */
export function recordStartupDuration(durationMs: number): void {
  _current.set({ durationMs, timestamp: new Date().toISOString() });
  log.info('Startup duration recorded', { durationMs });
}
