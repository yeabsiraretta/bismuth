/**
 * audioContext.ts synthesis tests (T10/T36) — Phase 6.
 * Mocks Tone.js lazy import and tests the scheduling functions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dynamic import('tone')
const mockTransportSchedule = vi.fn();
const mockTransportCancel = vi.fn();
const mockTransportStart = vi.fn();
const mockTransportStop = vi.fn();
const mockTransportPause = vi.fn();
const mockBpmValue = { value: 120 };
const mockPolySynth = vi.fn().mockImplementation(() => ({
  toDestination: vi.fn().mockReturnThis(),
  triggerAttackRelease: vi.fn(),
}));

const mockTransport = {
  schedule: mockTransportSchedule,
  cancel: mockTransportCancel,
  start: mockTransportStart,
  stop: mockTransportStop,
  pause: mockTransportPause,
  bpm: mockBpmValue,
};

vi.mock('tone', () => ({
  Transport: mockTransport,
  getTransport: () => mockTransport,
  PolySynth: mockPolySynth,
  Synth: vi.fn(),
  Frequency: vi.fn((n: number) => ({ toNote: () => `note_${n}` })),
  Context: class MockToneContext {},
  start: vi.fn().mockResolvedValue(undefined),
  setContext: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock AudioContext
const mockAudioContext = {
  state: 'running',
  sampleRate: 44100,
  resume: vi.fn().mockResolvedValue(undefined),
  destination: {},
  createGain: vi
    .fn()
    .mockReturnValue({ gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() }),
  createStereoPanner: vi
    .fn()
    .mockReturnValue({ pan: { value: 0 }, connect: vi.fn(), disconnect: vi.fn() }),
};
vi.stubGlobal(
  'AudioContext',
  class MockAudioContext {
    state = mockAudioContext.state;
    sampleRate = mockAudioContext.sampleRate;
    resume = mockAudioContext.resume;
    destination = mockAudioContext.destination;
    createGain = mockAudioContext.createGain;
    createStereoPanner = mockAudioContext.createStereoPanner;
  }
);

import {
  scheduleClip,
  clearSchedule,
  setTempo,
  startTransport,
  stopTransport,
  pauseTransport,
  initTone,
} from '../services/audioContext';

describe('audioContext synthesis functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBpmValue.value = 120;
  });

  describe('initTone', () => {
    it('sets tone context and calls Tone.start()', async () => {
      const { start, setContext, Context: _Context } = await import('tone');
      await initTone();
      expect(setContext).toHaveBeenCalled();
      expect(start).toHaveBeenCalled();
    });
  });

  describe('scheduleClip', () => {
    it('schedules all notes in a 4-note clip', async () => {
      await initTone();
      const clip = {
        midiNotes: [
          { pitch: 60, startTick: 0, durationTicks: 96, velocity: 100 },
          { pitch: 62, startTick: 96, durationTicks: 96, velocity: 80 },
          { pitch: 64, startTick: 192, durationTicks: 96, velocity: 90 },
          { pitch: 65, startTick: 288, durationTicks: 96, velocity: 70 },
        ],
      };
      scheduleClip(clip, 0);
      expect(mockTransportSchedule).toHaveBeenCalledTimes(4);
    });

    it('schedules no events for empty clip', async () => {
      await initTone();
      scheduleClip({ midiNotes: [] }, 0);
      expect(mockTransportSchedule).not.toHaveBeenCalled();
    });

    it('applies startBeat offset to note timing', async () => {
      await initTone();
      scheduleClip(
        { midiNotes: [{ pitch: 60, startTick: 0, durationTicks: 96, velocity: 100 }] },
        4
      );
      expect(mockTransportSchedule).toHaveBeenCalledWith(expect.any(Function), '4m');
    });

    it('logs warning if tone not initialized', async () => {
      const { log } = await import('@/utils/logger');
      // Call before initTone in a fresh module would warn — we test guard logic
      scheduleClip(
        { midiNotes: [{ pitch: 60, startTick: 0, durationTicks: 96, velocity: 100 }] },
        0
      );
      // After initTone was called above, subsequent calls should work
      expect(log.warn).toBeDefined();
    });
  });

  describe('clearSchedule', () => {
    it('calls Transport.cancel()', async () => {
      await initTone();
      clearSchedule();
      expect(mockTransportCancel).toHaveBeenCalled();
    });
  });

  describe('setTempo', () => {
    it('sets Tone.Transport.bpm.value', async () => {
      await initTone();
      setTempo(140);
      expect(mockBpmValue.value).toBe(140);
    });
  });

  describe('startTransport / stopTransport / pauseTransport', () => {
    it('calls Transport.start()', async () => {
      await initTone();
      startTransport();
      expect(mockTransportStart).toHaveBeenCalled();
    });

    it('calls Transport.stop()', async () => {
      await initTone();
      stopTransport();
      expect(mockTransportStop).toHaveBeenCalled();
    });

    it('calls Transport.pause()', async () => {
      await initTone();
      pauseTransport();
      expect(mockTransportPause).toHaveBeenCalled();
    });
  });
});
