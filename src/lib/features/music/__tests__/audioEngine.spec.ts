/**
 * Tests for audioEngine store.
 * Mocks audioContext.ts service functions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

vi.mock('../services/audioContext', () => ({
  initTone: vi.fn().mockResolvedValue(undefined),
  isToneReady: vi.fn().mockReturnValue(false),
  resumeAudioContext: vi.fn().mockResolvedValue(undefined),
  startTransport: vi.fn(),
  stopTransport: vi.fn(),
  pauseTransport: vi.fn(),
  setTempo: vi.fn(),
  clearSchedule: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  audioEngineState,
  isPlaying,
  isPaused,
  isStopped,
  initEngine,
  play,
  pause,
  stop,
  setBpm,
  resetEngine,
} from '../stores/audioEngine';

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

describe('audioEngine store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetEngine();
    (isToneReady as ReturnType<typeof vi.fn>).mockReturnValue(false);
  });

  describe('initial state', () => {
    it('starts stopped', () => {
      expect(get(isStopped)).toBe(true);
      expect(get(isPlaying)).toBe(false);
      expect(get(isPaused)).toBe(false);
    });

    it('starts uninitialized', () => {
      const state = get(audioEngineState);
      expect(state.initialized).toBe(false);
      expect(state.isInitializing).toBe(false);
    });

    it('has default bpm 120', () => {
      expect(get(audioEngineState).bpm).toBe(120);
    });
  });

  describe('initEngine', () => {
    it('initializes audio context and Tone', async () => {
      await initEngine();
      expect(resumeAudioContext).toHaveBeenCalled();
      expect(initTone).toHaveBeenCalled();
      expect(get(audioEngineState).initialized).toBe(true);
    });

    it('does not reinitialize if already initialized', async () => {
      await initEngine();
      vi.clearAllMocks();
      await initEngine();
      expect(initTone).not.toHaveBeenCalled();
    });

    it('sets error on failure', async () => {
      (initTone as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('no audio'));
      await initEngine();
      expect(get(audioEngineState).error).toBe('no audio');
      expect(get(audioEngineState).initialized).toBe(false);
    });
  });

  describe('play/pause/stop', () => {
    it('play transitions to playing state', async () => {
      (isToneReady as ReturnType<typeof vi.fn>).mockReturnValue(true);
      await play();
      expect(get(isPlaying)).toBe(true);
      expect(startTransport).toHaveBeenCalled();
    });

    it('pause transitions to paused state', () => {
      pause();
      expect(get(isPaused)).toBe(true);
      expect(pauseTransport).toHaveBeenCalled();
    });

    it('stop transitions to stopped state and resets position', () => {
      stop();
      expect(get(isStopped)).toBe(true);
      expect(get(audioEngineState).positionBeats).toBe(0);
      expect(stopTransport).toHaveBeenCalled();
      expect(clearSchedule).toHaveBeenCalled();
    });

    it('play → pause → stop sequence', async () => {
      (isToneReady as ReturnType<typeof vi.fn>).mockReturnValue(true);
      await play();
      expect(get(isPlaying)).toBe(true);
      pause();
      expect(get(isPaused)).toBe(true);
      stop();
      expect(get(isStopped)).toBe(true);
    });
  });

  describe('setBpm', () => {
    it('updates bpm in store and calls setTempo', () => {
      setBpm(140);
      expect(get(audioEngineState).bpm).toBe(140);
      expect(setTempo).toHaveBeenCalledWith(140);
    });
  });

  describe('resetEngine', () => {
    it('resets all state to initial values', async () => {
      (isToneReady as ReturnType<typeof vi.fn>).mockReturnValue(true);
      await play();
      setBpm(160);
      resetEngine();
      const state = get(audioEngineState);
      expect(state.transportState).toBe('stopped');
      expect(state.bpm).toBe(120);
      expect(state.initialized).toBe(false);
      expect(stopTransport).toHaveBeenCalled();
    });
  });
});
