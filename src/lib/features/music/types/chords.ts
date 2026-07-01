/**
 * Chord Sheets types — chord symbols, diagrams, instruments,
 * transposition, autoscroll, and configuration.
 */

// ─── Instrument ──────────────────────────────────────────────────────────────

export type ChordInstrument = 'guitar' | 'ukulele' | 'mandolin';

export const INSTRUMENT_STRING_COUNTS: Record<ChordInstrument, number> = {
  guitar: 6,
  ukulele: 4,
  mandolin: 8,
};

export const INSTRUMENT_TUNINGS: Record<ChordInstrument, string[]> = {
  guitar: ['E', 'A', 'D', 'G', 'B', 'E'],
  ukulele: ['G', 'C', 'E', 'A'],
  mandolin: ['G', 'D', 'A', 'E'],
};

// ─── Chord token ─────────────────────────────────────────────────────────────

export interface ChordToken {
  /** The chord symbol text, e.g. "Am7", "Bbadd13" */
  symbol: string;
  /** Root note, e.g. "A", "Bb" */
  root: string;
  /** Quality suffix, e.g. "m7", "add13", "maj7" */
  quality: string;
  /** Bass note for slash chords, e.g. "G" in "C/G" */
  bass?: string;
  /** Column position in the original line */
  column: number;
  /** Custom shape if specified: Bbadd13[x13333] */
  customShape?: string;
}

// ─── Line classification ─────────────────────────────────────────────────────

export type ChordLineType = 'chord' | 'lyric' | 'section' | 'empty' | 'tab';

export interface ChordLine {
  type: ChordLineType;
  text: string;
  /** Parsed chord tokens (only for type=chord) */
  chords?: ChordToken[];
}

// ─── Chord sheet (parsed block) ──────────────────────────────────────────────

export interface ChordSheet {
  /** Document offset of the code block start */
  from: number;
  /** Document offset of the code block end */
  to: number;
  lines: ChordLine[];
  /** Instrument override for this block */
  instrument?: ChordInstrument;
  /** Current transpose semitones offset */
  transpose: number;
}

// ─── Chord diagram ───────────────────────────────────────────────────────────

export interface ChordFingering {
  /** Fret positions per string, -1 = muted, 0 = open */
  frets: number[];
  /** Optional finger numbers per string */
  fingers?: number[];
  /** Starting fret (capo/barre position), 1 = nut */
  baseFret: number;
  /** Barre specs: [fromString, toString, fret] */
  barres?: number[];
}

export interface ChordDefinition {
  key: string;
  suffix: string;
  positions: ChordFingering[];
}

// ─── Configuration ───────────────────────────────────────────────────────────

export interface ChordSheetConfig {
  defaultInstrument: ChordInstrument;
  /** Block language specifier (default: "chords") */
  blockLanguage: string;
  /** Chord line marker (default: "%c") */
  chordLineMarker: string;
  /** Lyric line marker (default: "%t") */
  lyricLineMarker: string;
  /** Show chord diagrams on hover */
  showDiagramsOnHover: boolean;
  /** Show chord overview above block */
  showChordOverview: boolean;
  /** Highlight chord symbols */
  highlightChords: boolean;
  /** Highlight section headers (e.g. [Verse], [Chorus]) */
  highlightSections: boolean;
  /** Diagram display size in px */
  diagramSize: number;
  /** Autoscroll speed (px/s), 0 = off */
  autoscrollSpeed: number;
}

export const DEFAULT_CHORD_CONFIG: ChordSheetConfig = {
  defaultInstrument: 'guitar',
  blockLanguage: 'chords',
  chordLineMarker: '%c',
  lyricLineMarker: '%t',
  showDiagramsOnHover: true,
  showChordOverview: true,
  highlightChords: true,
  highlightSections: true,
  diagramSize: 100,
  autoscrollSpeed: 0,
};

// ─── Chromatic notes ─────────────────────────────────────────────────────────

export const NOTE_NAMES_SHARP = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;
export const NOTE_NAMES_FLAT = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
] as const;

/** Map any note name (sharp or flat) to its chromatic index (0-11) */
export const NOTE_TO_INDEX: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  'E#': 5,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  Cb: 11,
  'B#': 0,
};
