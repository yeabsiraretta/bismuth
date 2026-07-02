/**
 * pianoRollCanvas.ts — pure geometry and drawing helpers for the PianoRoll canvas.
 *
 * No Svelte imports. No side effects. All functions are pure or operate on ctx only.
 */

import type { MidiNote } from '../types/music';

// ─── Constants ────────────────────────────────────────────────────────────────

export const PIANO_KEY_WIDTH = 36; // px for the keyboard column
export const NOTE_HEIGHT = 10; // px per semitone row
export const TOTAL_PITCHES = 88; // A0 (pitch 21) to C8 (pitch 108)
export const MIDI_LOW = 21; // lowest MIDI note on piano (A0)
export const PIXELS_PER_BEAT = 80; // px per beat at default zoom

// ─── Grid divisions ───────────────────────────────────────────────────────────

export type GridDivision = '1/4' | '1/8' | '1/16' | '1/32';

export const TICKS_PER_BEAT = 480;

export function divisionToTicks(div: GridDivision): number {
  switch (div) {
    case '1/4':
      return TICKS_PER_BEAT;
    case '1/8':
      return TICKS_PER_BEAT / 2;
    case '1/16':
      return TICKS_PER_BEAT / 4;
    case '1/32':
      return TICKS_PER_BEAT / 8;
  }
}

export function quantizeTick(rawTick: number, div: GridDivision): number {
  const step = divisionToTicks(div);
  return Math.round(rawTick / step) * step;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export interface NoteRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function noteLayout(note: MidiNote, scrollX: number, scrollY: number): NoteRect {
  const ticksPerPx = TICKS_PER_BEAT / PIXELS_PER_BEAT;
  const x = PIANO_KEY_WIDTH + note.startTick / ticksPerPx - scrollX;
  const pitchRow = note.pitch - MIDI_LOW;
  const y = (TOTAL_PITCHES - 1 - pitchRow) * NOTE_HEIGHT - scrollY;
  const width = Math.max(4, note.durationTicks / ticksPerPx);
  return { x, y, width, height: NOTE_HEIGHT - 1 };
}

// ─── Hit detection ────────────────────────────────────────────────────────────

export function noteAtPoint(
  cx: number,
  cy: number,
  notes: MidiNote[],
  scrollX: number,
  scrollY: number
): MidiNote | null {
  for (let i = notes.length - 1; i >= 0; i--) {
    const r = noteLayout(notes[i], scrollX, scrollY);
    if (cx >= r.x && cx <= r.x + r.width && cy >= r.y && cy <= r.y + r.height) return notes[i];
  }
  return null;
}

export function isResizeHandle(
  cx: number,
  note: MidiNote,
  scrollX: number,
  scrollY: number
): boolean {
  const r = noteLayout(note, scrollX, scrollY);
  return cx >= r.x + r.width - 6 && cx <= r.x + r.width;
}

// ─── Coordinate conversion ────────────────────────────────────────────────────

export function yToPitch(cy: number, scrollY: number): number {
  const rowFromTop = Math.floor((cy + scrollY) / NOTE_HEIGHT);
  const pitch = MIDI_LOW + (TOTAL_PITCHES - 1 - rowFromTop);
  return Math.max(MIDI_LOW, Math.min(MIDI_LOW + TOTAL_PITCHES - 1, pitch));
}

export function xToTick(cx: number, scrollX: number): number {
  return Math.max(0, (cx - PIANO_KEY_WIDTH + scrollX) * (TICKS_PER_BEAT / PIXELS_PER_BEAT));
}

// ─── Drawing helpers ──────────────────────────────────────────────────────────

const BLACK_KEYS = new Set([1, 3, 6, 8, 10]);

export function drawGrid(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  scrollX: number,
  scrollY: number,
  div: GridDivision
) {
  c.save();
  for (let i = 0; i < TOTAL_PITCHES; i++) {
    const y = (TOTAL_PITCHES - 1 - i) * NOTE_HEIGHT - scrollY;
    if (y < -NOTE_HEIGHT || y > h) continue;
    c.fillStyle = BLACK_KEYS.has((MIDI_LOW + i) % 12)
      ? 'rgba(0,0,0,0.25)'
      : 'rgba(255,255,255,0.03)';
    c.fillRect(PIANO_KEY_WIDTH, y, w - PIANO_KEY_WIDTH, NOTE_HEIGHT);
    c.fillStyle = 'rgba(255,255,255,0.06)';
    c.fillRect(PIANO_KEY_WIDTH, y + NOTE_HEIGHT - 1, w - PIANO_KEY_WIDTH, 1);
  }
  const ticksPerPx = TICKS_PER_BEAT / PIXELS_PER_BEAT;
  const step = divisionToTicks(div);
  const startTick = Math.floor((scrollX * ticksPerPx) / step) * step;
  for (let t = startTick; t < (scrollX + w) * ticksPerPx; t += step) {
    const x = PIANO_KEY_WIDTH + t / ticksPerPx - scrollX;
    const isBeat = t % TICKS_PER_BEAT === 0;
    c.strokeStyle = isBeat ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)';
    c.lineWidth = isBeat ? 1 : 0.5;
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, h);
    c.stroke();
  }
  c.restore();
}

export function drawPianoKeys(c: CanvasRenderingContext2D, h: number, scrollY: number) {
  c.save();
  c.fillStyle = '#1e1e2e';
  c.fillRect(0, 0, PIANO_KEY_WIDTH, h);
  for (let i = 0; i < TOTAL_PITCHES; i++) {
    const y = (TOTAL_PITCHES - 1 - i) * NOTE_HEIGHT - scrollY;
    if (y < -NOTE_HEIGHT || y > h) continue;
    c.fillStyle = BLACK_KEYS.has((MIDI_LOW + i) % 12) ? '#313244' : '#585b70';
    c.fillRect(1, y + 1, PIANO_KEY_WIDTH - 2, NOTE_HEIGHT - 2);
  }
  c.restore();
}

export function drawNotes(
  c: CanvasRenderingContext2D,
  notes: MidiNote[],
  canvasWidth: number,
  scrollX: number,
  scrollY: number,
  accentColor: string
) {
  c.save();
  for (const note of notes) {
    const r = noteLayout(note, scrollX, scrollY);
    if (r.x + r.width < PIANO_KEY_WIDTH || r.x > canvasWidth) continue;
    c.globalAlpha = 0.4 + (note.velocity / 127) * 0.6;
    c.fillStyle = accentColor;
    c.beginPath();
    c.roundRect(r.x, r.y, r.width, r.height, 2);
    c.fill();
    c.globalAlpha = 1;
    c.strokeStyle = 'rgba(255,255,255,0.4)';
    c.lineWidth = 0.5;
    c.stroke();
  }
  c.restore();
}
