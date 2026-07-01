/**
 * Music feature types — MusicDocument, Track, Clip, MIDI, and transport state.
 *
 * No runtime code — interfaces and union literals only.
 * MIDI-specific types are co-located here; split into midi.types.ts if this file
 * approaches 280 lines.
 */

// ─── Track ────────────────────────────────────────────────────────────────────

export type TrackType = 'audio' | 'instrument' | 'bus';

export type ClipType = 'audio' | 'midi' | 'pattern';

// ─── MIDI ─────────────────────────────────────────────────────────────────────

export interface MidiNote {
  /** MIDI note number 0–127 */
  pitch: number;
  /** Ticks from bar start */
  startTick: number;
  durationTicks: number;
  /** Velocity 0–127 */
  velocity: number;
}

// ─── Clip ─────────────────────────────────────────────────────────────────────

export interface AudioClip {
  id: string;
  type: ClipType;
  startBar: number;
  durationBars: number;
  trackId: string;
  /** Vault-relative path to audio file */
  audioPath?: string;
  midiNotes?: MidiNote[];
  name: string;
}

// ─── Track ────────────────────────────────────────────────────────────────────

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  /** 0–1 */
  volume: number;
  /** -1 to 1 */
  pan: number;
  muted: boolean;
  soloed: boolean;
  clips: AudioClip[];
  color: string;
}

// ─── MusicDocument ────────────────────────────────────────────────────────────

export interface MusicDocument {
  id: string;
  name: string;
  vault_id: string | null;
  documentType: 'music';
  bpm: number;
  timeSignatureNumerator: number;
  timeSignatureDenominator: number;
  tracks: Track[];
  totalBars: number;
  created_at: number;
  modified_at: number;
}

// ─── Engine / Transport ───────────────────────────────────────────────────────

export interface AudioEngineState {
  ready: boolean;
  latencyMs: number;
  error: string | null;
}

export interface TransportState {
  playing: boolean;
  paused: boolean;
  positionBeats: number;
  bpm: number;
  loopEnabled: boolean;
}

// ─── Demucs / Stem ────────────────────────────────────────────────────────────

export interface StemResult {
  vocals?: string;
  drums?: string;
  bass?: string;
  other?: string;
}

export interface StemJob {
  jobId: string;
  audioPath: string;
  model: string;
  status: 'queued' | 'running' | 'complete' | 'error';
  progress: number;
  stems?: StemResult;
  error?: string;
}

// ─── Type Guards ──────────────────────────────────────────────────────────────

export function isMusicDocument(doc: unknown): doc is MusicDocument {
  if (!doc || typeof doc !== 'object') return false;
  return (doc as Record<string, unknown>)['documentType'] === 'music';
}

export function isAudioTrack(track: unknown): track is Track & { type: 'audio' } {
  if (!track || typeof track !== 'object') return false;
  return (track as Record<string, unknown>)['type'] === 'audio';
}

export function isMidiTrack(track: unknown): track is Track & { type: 'instrument' } {
  if (!track || typeof track !== 'object') return false;
  return (track as Record<string, unknown>)['type'] === 'instrument';
}
