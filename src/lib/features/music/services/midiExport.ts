/**
 * MIDI export service — encodes a MusicDocument as a Standard MIDI File (SMF).
 *
 * Produces a Type 0 (single-track merged) SMF. No external MIDI library.
 * Only this file may write raw SMF binary in the music feature.
 */

import { log } from '@/utils/logger';
import type { MusicDocument, MidiNote } from '../types/music';

// ─── SMF constants ────────────────────────────────────────────────────────────

const TICKS_PER_QUARTER = 480;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function writeVarLen(value: number): number[] {
  const bytes: number[] = [];
  bytes.push(value & 0x7f);
  value >>= 7;
  while (value > 0) {
    bytes.unshift(0x80 | (value & 0x7f));
    value >>= 7;
  }
  return bytes;
}

function uint32be(n: number): number[] {
  return [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function uint16be(n: number): number[] {
  return [(n >> 8) & 0xff, n & 0xff];
}

// ─── Event builder ────────────────────────────────────────────────────────────

interface RawEvent {
  tick: number;
  bytes: number[];
}

function buildTrackEvents(notes: MidiNote[], channel = 0): RawEvent[] {
  const events: RawEvent[] = [];
  for (const note of notes) {
    const vel = Math.max(0, Math.min(127, note.velocity));
    const pitch = Math.max(0, Math.min(127, note.pitch));
    events.push({ tick: note.startTick, bytes: [0x90 | channel, pitch, vel] });
    events.push({
      tick: note.startTick + note.durationTicks,
      bytes: [0x80 | channel, pitch, 0],
    });
  }
  events.sort((a, b) => a.tick - b.tick);
  return events;
}

function encodeTrackChunk(events: RawEvent[]): number[] {
  const trackBytes: number[] = [];
  let lastTick = 0;
  for (const ev of events) {
    const delta = Math.max(0, ev.tick - lastTick);
    lastTick = ev.tick;
    trackBytes.push(...writeVarLen(delta), ...ev.bytes);
  }
  // End-of-track meta event: delta=0, 0xFF 0x2F 0x00
  trackBytes.push(0x00, 0xff, 0x2f, 0x00);
  return trackBytes;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Export a MusicDocument as a Type 0 SMF Blob.
 * All MIDI-type tracks are merged into one track chunk.
 */
export function exportMidi(doc: MusicDocument): Blob {
  // Collect all MIDI notes from instrument tracks
  const allNotes: MidiNote[] = [];
  for (const track of doc.tracks) {
    if (track.type !== 'instrument') continue;
    for (const clip of track.clips) {
      if (clip.midiNotes) allNotes.push(...clip.midiNotes);
    }
  }

  const rawEvents = buildTrackEvents(allNotes);
  const trackBytes = encodeTrackChunk(rawEvents);

  // SMF header chunk: MThd
  const header: number[] = [
    0x4d, 0x54, 0x68, 0x64,           // 'MThd'
    ...uint32be(6),                     // chunk length = 6
    ...uint16be(0),                     // format 0
    ...uint16be(1),                     // 1 track
    ...uint16be(TICKS_PER_QUARTER),     // ticks/quarter
  ];

  // Track chunk: MTrk
  const trackHeader: number[] = [
    0x4d, 0x54, 0x72, 0x6b,           // 'MTrk'
    ...uint32be(trackBytes.length),
  ];

  const all = new Uint8Array([...header, ...trackHeader, ...trackBytes]);
  log.info('[midiExport] exportMidi', { notes: allNotes.length, bytes: all.length });
  return new Blob([all], { type: 'audio/midi' });
}
