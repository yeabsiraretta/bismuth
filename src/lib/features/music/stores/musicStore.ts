/**
 * Music document store — reactive state for the active music session.
 *
 * Data state only. Does NOT import audioContext.ts.
 * All invoke() calls are delegated to services/musicDoc.ts.
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type { MusicDocument, Track, AudioClip, TrackType, MidiNote } from '../types/music';
import * as musicDoc from '../services/musicDoc';

// ─── State ────────────────────────────────────────────────────────────────────

export const activeMusicDoc = writable<MusicDocument | null>(null);
export const playbackState = writable<'stopped' | 'playing' | 'paused'>('stopped');
export const playbackPosition = writable<number>(0);
export const selectedTrackId = writable<string | null>(null);
export const selectedClipId = writable<string | null>(null);

// ─── Derived ──────────────────────────────────────────────────────────────────

export const bpm = derived(activeMusicDoc, ($doc) => $doc?.bpm ?? 120);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID();
}

function now(): number {
  return Date.now();
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export function createMusicDocument(name: string): MusicDocument {
  const doc: MusicDocument = {
    id: generateId(),
    name,
    vault_id: null,
    documentType: 'music',
    bpm: 120,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    tracks: [],
    totalBars: 16,
    created_at: now(),
    modified_at: now(),
  };
  activeMusicDoc.set(doc);
  log.info('[musicStore] createMusicDocument', { id: doc.id, name });
  return doc;
}

export async function loadDocument(vaultPath: string, id: string): Promise<void> {
  try {
    const doc = await musicDoc.loadMusicDocument(vaultPath, id);
    activeMusicDoc.set(doc);
    log.info('[musicStore] loadDocument', { id });
  } catch (err) {
    log.error('[musicStore] loadDocument failed', err, { id });
    throw err;
  }
}

export async function saveDocument(vaultPath: string): Promise<void> {
  const doc = get(activeMusicDoc);
  if (!doc) return;
  try {
    const updated = { ...doc, modified_at: now() };
    activeMusicDoc.set(updated);
    await musicDoc.saveMusicDocument(vaultPath, updated);
    log.info('[musicStore] saveDocument', { id: doc.id });
  } catch (err) {
    log.error('[musicStore] saveDocument failed', err);
    throw err;
  }
}

export function addTrack(type: TrackType): Track {
  const track: Track = {
    id: generateId(),
    name: `${type.charAt(0).toUpperCase()}${type.slice(1)} ${now() % 1000}`,
    type,
    volume: 1.0,
    pan: 0.0,
    muted: false,
    soloed: false,
    clips: [],
    color: '#6366f1',
  };
  activeMusicDoc.update((doc) => {
    if (!doc) return doc;
    return { ...doc, tracks: [...doc.tracks, track], modified_at: now() };
  });
  log.info('[musicStore] addTrack', { id: track.id, type });
  return track;
}

export function addClip(trackId: string, clip: AudioClip): void {
  activeMusicDoc.update((doc) => {
    if (!doc) return doc;
    const tracks = doc.tracks.map((t) =>
      t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
    );
    return { ...doc, tracks, modified_at: now() };
  });
  log.info('[musicStore] addClip', { trackId, clipId: clip.id });
}

export function updateTrack(id: string, patch: Partial<Track>): void {
  activeMusicDoc.update((doc) => {
    if (!doc) return doc;
    const tracks = doc.tracks.map((t) =>
      t.id === id ? { ...t, ...patch } : t
    );
    return { ...doc, tracks, modified_at: now() };
  });
  log.debug('[musicStore] updateTrack', { id });
}

export function deleteTrack(id: string): void {
  activeMusicDoc.update((doc) => {
    if (!doc) return doc;
    return { ...doc, tracks: doc.tracks.filter((t) => t.id !== id), modified_at: now() };
  });
  selectedTrackId.update((curr) => (curr === id ? null : curr));
  log.info('[musicStore] deleteTrack', { id });
}

export function setPlaybackState(state: 'stopped' | 'playing' | 'paused'): void {
  playbackState.set(state);
  if (state === 'stopped') playbackPosition.set(0);
  log.info('[musicStore] setPlaybackState', { state });
}

// ─── MIDI note actions ────────────────────────────────────────────────────────

/** Add a MIDI note to the specified clip, identified by clipId. */
export function addMidiNote(clipId: string, note: MidiNote): void {
  activeMusicDoc.update((doc) => {
    if (!doc) return doc;
    const tracks = doc.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) =>
        c.id === clipId
          ? { ...c, midiNotes: [...(c.midiNotes ?? []), note] }
          : c,
      ),
    }));
    return { ...doc, tracks, modified_at: now() };
  });
  log.debug('[musicStore] addMidiNote', { clipId, pitch: note.pitch });
}

/** Remove a MIDI note from a clip by matching startTick and pitch (acts as note ID). */
export function removeMidiNote(clipId: string, startTick: number, pitch: number): void {
  activeMusicDoc.update((doc) => {
    if (!doc) return doc;
    const tracks = doc.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) =>
        c.id === clipId
          ? {
              ...c,
              midiNotes: (c.midiNotes ?? []).filter(
                (n) => !(n.startTick === startTick && n.pitch === pitch),
              ),
            }
          : c,
      ),
    }));
    return { ...doc, tracks, modified_at: now() };
  });
  log.debug('[musicStore] removeMidiNote', { clipId, startTick, pitch });
}

/** Replace all MIDI notes in a clip (used by PianoRoll on notesChanged). */
export function updateMidiNotes(clipId: string, notes: MidiNote[]): void {
  activeMusicDoc.update((doc) => {
    if (!doc) return doc;
    const tracks = doc.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) =>
        c.id === clipId ? { ...c, midiNotes: notes } : c,
      ),
    }));
    return { ...doc, tracks, modified_at: now() };
  });
  log.debug('[musicStore] updateMidiNotes', { clipId, count: notes.length });
}

/** Select a clip and its parent track. */
export function selectClip(clipId: string, trackId: string): void {
  selectedClipId.set(clipId);
  selectedTrackId.set(trackId);
}

/** Select a track and deselect the active clip. */
export function selectTrack(trackId: string): void {
  selectedTrackId.set(trackId);
  selectedClipId.set(null);
}

/** Update BPM on the active music document. */
export function updateBpm(newBpm: number): void {
  activeMusicDoc.update((d) => d ? { ...d, bpm: newBpm, modified_at: now() } : d);
}
