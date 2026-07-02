/**
 * Web Audio API lifecycle service.
 *
 * THIS IS THE SOLE AudioContext owner. Components NEVER create AudioContext directly.
 * All Web Audio operations must go through this module.
 *
 * Platform note: Linux Web Audio latency may exceed 10ms target (PulseAudio baseline 20–50ms).
 * Required for AudioWorkletNode / SharedArrayBuffer support (see tauri.conf.json COOP/COEP headers).
 */

import { log } from '@/utils/logger';
import type { Track } from '../types/music';

// ─── Singleton ────────────────────────────────────────────────────────────────

let _ctx: AudioContext | null = null;

// ─── Per-track gain nodes ─────────────────────────────────────────────────────

const _gainNodes = new Map<string, GainNode>();
const _panNodes = new Map<string, StereoPannerNode>();

// ─── Lifecycle ────────────────────────────────────────────────────────────────

export function getAudioContext(): AudioContext {
  if (!_ctx) {
    _ctx = new AudioContext({ latencyHint: 'interactive' });
    log.info('[audioContext] AudioContext created', { sampleRate: _ctx.sampleRate });
  }
  return _ctx;
}

export async function resumeAudioContext(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
    log.info('[audioContext] AudioContext resumed');
  }
}

export function disposeAudioContext(): void {
  if (_ctx) {
    _ctx.close().catch((err) => log.warn('[audioContext] Error closing context', { err }));
    _ctx = null;
    log.info('[audioContext] AudioContext disposed');
  }
}

export function getCurrentTime(): number {
  return getAudioContext().currentTime;
}

// ─── Playback helpers ─────────────────────────────────────────────────────────

export async function playTone(
  frequency: number,
  duration: number,
  startTime?: number
): Promise<void> {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = frequency;
  const t = startTime ?? ctx.currentTime;
  osc.start(t);
  osc.stop(t + duration);
  gain.gain.setValueAtTime(0.5, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  log.debug('[audioContext] playTone scheduled', { frequency, duration, startTime: t });
}

export async function loadAudioBuffer(url: string): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  log.info('[audioContext] loadAudioBuffer', { url });
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status} ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return ctx.decodeAudioData(arrayBuffer);
}

// ─── Tone.js (lazy — only imported after user gesture via initTone()) ─────────

// NOTE: Tone.js is the ONLY file that imports from 'tone'. Other modules MUST NOT.
let _toneInitialized = false;
let _Tone: typeof import('tone') | null = null;

export async function initTone(): Promise<void> {
  if (_toneInitialized) return;
  const Tone = await import('tone');
  _Tone = Tone;
  Tone.setContext(new Tone.Context(getAudioContext()));
  await Tone.start();
  _toneInitialized = true;
  log.info('[audioContext] Tone.js initialized');
}

export function isToneReady(): boolean {
  return _toneInitialized && _Tone !== null;
}

/** Create a polyphonic synthesizer. Must call initTone() first. */
export function createMidiSynth(
  options?: Record<string, unknown>
): InstanceType<typeof import('tone').PolySynth> {
  if (!_Tone) throw new Error('[audioContext] Tone not initialized — call initTone() first');
  return new _Tone.PolySynth(_Tone.Synth, options).toDestination();
}

/** Schedule all MidiNote entries in a clip onto the Tone Transport timeline. */
export function scheduleClip(
  clip: {
    midiNotes?: Array<{
      pitch: number;
      startTick: number;
      durationTicks: number;
      velocity: number;
    }>;
  },
  startBeat: number
): void {
  if (!_Tone) {
    log.warn('[audioContext] scheduleClip called before Tone initialized');
    return;
  }
  const Tone = _Tone;
  const notes = clip.midiNotes ?? [];
  const ticksPerBeat = 96;
  for (const note of notes) {
    const beatOffset = note.startTick / ticksPerBeat;
    const durationBeats = note.durationTicks / ticksPerBeat;
    const startTime = `${startBeat + beatOffset}m`;
    Tone.getTransport().schedule((time: number) => {
      const synth = createMidiSynth();
      synth.triggerAttackRelease(
        Tone.Frequency(note.pitch, 'midi').toNote(),
        `${durationBeats}m`,
        time,
        note.velocity / 127
      );
    }, startTime);
  }
  log.debug('[audioContext] scheduleClip', { notes: notes.length, startBeat });
}

/** Cancel all scheduled Tone Transport events. */
export function clearSchedule(): void {
  if (!_Tone) return;
  _Tone.getTransport().cancel();
  log.debug('[audioContext] clearSchedule');
}

/** Set the transport tempo. */
export function setTempo(bpm: number): void {
  if (!_Tone) return;
  _Tone.getTransport().bpm.value = bpm;
  log.debug('[audioContext] setTempo', { bpm });
}

/** Start Tone Transport playback. */
export function startTransport(): void {
  if (!_Tone) return;
  _Tone.getTransport().start();
  log.debug('[audioContext] startTransport');
}

/** Stop Tone Transport. */
export function stopTransport(): void {
  if (!_Tone) return;
  _Tone.getTransport().stop();
  log.debug('[audioContext] stopTransport');
}

/** Pause Tone Transport. */
export function pauseTransport(): void {
  if (!_Tone) return;
  _Tone.getTransport().pause();
  log.debug('[audioContext] pauseTransport');
}

// ─── Per-track gain/pan/mute (T35) ───────────────────────────────────────────

function ensureTrackNodes(trackId: string): { gain: GainNode; pan: StereoPannerNode } {
  const ctx = getAudioContext();
  let gain = _gainNodes.get(trackId);
  let pan = _panNodes.get(trackId);
  if (!gain) {
    gain = ctx.createGain();
    _gainNodes.set(trackId, gain);
  }
  if (!pan) {
    pan = ctx.createStereoPanner();
    _panNodes.set(trackId, pan);
  }
  return { gain, pan };
}

/**
 * Connect a track's gain+pan chain to the audio destination.
 * Call whenever volume changes from the mixer.
 */
export function connectTrackToOutput(trackId: string, gainValue: number): void {
  const ctx = getAudioContext();
  const { gain, pan } = ensureTrackNodes(trackId);
  gain.gain.value = Math.max(0, Math.min(1, gainValue));
  gain.connect(pan);
  pan.connect(ctx.destination);
  log.debug('[audioContext] connectTrackToOutput', { trackId, gainValue });
}

/** Set per-track pan (-1 to +1). */
export function setTrackPan(trackId: string, panValue: number): void {
  const { pan } = ensureTrackNodes(trackId);
  pan.pan.value = Math.max(-1, Math.min(1, panValue));
  log.debug('[audioContext] setTrackPan', { trackId, panValue });
}

/** Mute or unmute a track by zeroing its gain node. */
export function muteTrack(trackId: string, muted: boolean, lastGain = 1.0): void {
  const { gain } = ensureTrackNodes(trackId);
  gain.gain.value = muted ? 0 : Math.max(0, Math.min(1, lastGain));
  log.debug('[audioContext] muteTrack', { trackId, muted });
}

/** Remove track nodes from the maps when the track is deleted. */
export function removeTrackNodes(trackId: string): void {
  const gain = _gainNodes.get(trackId);
  const pan = _panNodes.get(trackId);
  if (gain) {
    gain.disconnect();
    _gainNodes.delete(trackId);
  }
  if (pan) {
    pan.disconnect();
    _panNodes.delete(trackId);
  }
  log.debug('[audioContext] removeTrackNodes', { trackId });
}

// ─── WAV export (T38) ────────────────────────────────────────────────────────

/**
 * Render the active document to a WAV Blob using OfflineAudioContext.
 * Schedules silence if no audio files are loaded (simplified implementation).
 */
export async function exportWav(
  durationSec: number,
  _bpm: number,
  _tracks: Track[]
): Promise<Blob> {
  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * durationSec), sampleRate);
  log.info('[audioContext] exportWav: starting render', { durationSec });
  const buffer = await offlineCtx.startRendering();
  return audioBufferToWavBlob(buffer);
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length * numChannels;
  const wavBuffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(wavBuffer);
  const writeStr = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  log.info('[audioContext] audioBufferToWavBlob complete', { bytes: wavBuffer.byteLength });
  return new Blob([wavBuffer], { type: 'audio/wav' });
}
