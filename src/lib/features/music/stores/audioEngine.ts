/**
 * Audio engine store — transport state and actions.
 *
 * This store wraps audioContext.ts service functions and exposes reactive state.
 * MUST NOT import 'tone' directly — all Tone.js access goes through audioContext.ts.
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import {
  initTone,
  isToneReady,
  resumeAudioContext,
  startTransport,
  stopTransport,
  pauseTransport,
  setTempo,
  clearSchedule,
} from '../services/audioContext';

export type EngineTransportMode = 'stopped' | 'playing' | 'paused';

export interface EngineState {
  transportState: EngineTransportMode;
  bpm: number;
  positionBeats: number;
  initialized: boolean;
  isInitializing: boolean;
  error: string | null;
}

const _initial: EngineState = {
  transportState: 'stopped',
  bpm: 120,
  positionBeats: 0,
  initialized: false,
  isInitializing: false,
  error: null,
};

const _store = writable<EngineState>({ ..._initial });

export const audioEngineState = { subscribe: _store.subscribe };

export const isPlaying = derived(_store, ($s) => $s.transportState === 'playing');
export const isPaused = derived(_store, ($s) => $s.transportState === 'paused');
export const isStopped = derived(_store, ($s) => $s.transportState === 'stopped');

// ─── Actions ──────────────────────────────────────────────────────────────────

/** Initialize audio context and Tone.js. Must be called after a user gesture. */
export async function initEngine(): Promise<void> {
  if (get(_store).initialized || get(_store).isInitializing) return;
  _store.update((s) => ({ ...s, isInitializing: true, error: null }));
  try {
    await resumeAudioContext();
    await initTone();
    _store.update((s) => ({ ...s, initialized: true, isInitializing: false }));
    log.info('[audioEngine] Engine initialized');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    _store.update((s) => ({ ...s, isInitializing: false, error: msg }));
    log.error('[audioEngine] Init failed', { err });
  }
}

/** Start playback. Initializes engine if needed. */
export async function play(): Promise<void> {
  if (!isToneReady()) await initEngine();
  await resumeAudioContext();
  startTransport();
  _store.update((s) => ({ ...s, transportState: 'playing' }));
  log.debug('[audioEngine] play');
}

/** Pause playback. */
export function pause(): void {
  pauseTransport();
  _store.update((s) => ({ ...s, transportState: 'paused' }));
  log.debug('[audioEngine] pause');
}

/** Stop playback and reset position to 0. */
export function stop(): void {
  stopTransport();
  clearSchedule();
  _store.update((s) => ({ ...s, transportState: 'stopped', positionBeats: 0 }));
  log.debug('[audioEngine] stop');
}

/** Update transport tempo. */
export function setBpm(bpm: number): void {
  setTempo(bpm);
  _store.update((s) => ({ ...s, bpm }));
  log.debug('[audioEngine] setBpm', { bpm });
}

/** Reset entire engine state (e.g. on vault close). */
export function resetEngine(): void {
  stopTransport();
  clearSchedule();
  _store.set({ ..._initial });
  log.info('[audioEngine] Engine reset');
}
