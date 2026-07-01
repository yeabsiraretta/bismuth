/**
 * Chord Diagrams — built-in fingering database for guitar, ukulele, and mandolin.
 * SVG diagram rendering. Custom chord shape parsing.
 */
import type { ChordFingering, ChordInstrument, ChordToken } from '../../types/chords';
import { INSTRUMENT_STRING_COUNTS } from '../../types/chords';

// ─── Built-in chord database ─────────────────────────────────────────────────

/** Compact chord DB: root → suffix → frets[] (guitar, 6 strings) */
const GUITAR_CHORDS: Record<string, Record<string, number[][]>> = {
  'C':  { '': [[0,3,2,0,1,0]], 'm': [[0,3,5,5,4,3]], '7': [[0,3,2,3,1,0]], 'maj7': [[0,3,2,0,0,0]] },
  'D':  { '': [[-1,-1,0,2,3,2]], 'm': [[-1,-1,0,2,3,1]], '7': [[-1,-1,0,2,1,2]], 'sus4': [[-1,-1,0,2,3,3]] },
  'E':  { '': [[0,2,2,1,0,0]], 'm': [[0,2,2,0,0,0]], '7': [[0,2,0,1,0,0]], 'maj7': [[0,2,1,1,0,0]] },
  'F':  { '': [[1,3,3,2,1,1]], 'm': [[1,3,3,1,1,1]], '7': [[1,3,1,2,1,1]], 'maj7': [[1,0,3,2,1,0]] },
  'G':  { '': [[3,2,0,0,0,3]], 'm': [[3,5,5,3,3,3]], '7': [[3,2,0,0,0,1]], 'maj7': [[3,2,0,0,0,2]] },
  'A':  { '': [[0,0,2,2,2,0]], 'm': [[0,0,2,2,1,0]], '7': [[0,0,2,0,2,0]], 'maj7': [[0,0,2,1,2,0]], 'sus4': [[0,0,2,2,3,0]] },
  'B':  { '': [[-1,2,4,4,4,2]], 'm': [[-1,2,4,4,3,2]], '7': [[-1,2,1,2,0,2]] },
  'C#': { '': [[-1,4,6,6,6,4]], 'm': [[-1,4,6,6,5,4]] },
  'Db': { '': [[-1,4,6,6,6,4]], 'm': [[-1,4,6,6,5,4]] },
  'D#': { '': [[-1,6,8,8,8,6]], 'm': [[-1,6,8,8,7,6]] },
  'Eb': { '': [[-1,6,8,8,8,6]], 'm': [[-1,6,8,8,7,6]], '7': [[-1,-1,1,3,2,3]] },
  'F#': { '': [[2,4,4,3,2,2]], 'm': [[2,4,4,2,2,2]] },
  'Gb': { '': [[2,4,4,3,2,2]], 'm': [[2,4,4,2,2,2]] },
  'G#': { '': [[4,6,6,5,4,4]], 'm': [[4,6,6,4,4,4]] },
  'Ab': { '': [[4,6,6,5,4,4]], 'm': [[4,6,6,4,4,4]], '7': [[-1,-1,1,1,1,2]] },
  'A#': { '': [[-1,1,3,3,3,1]], 'm': [[-1,1,3,3,2,1]] },
  'Bb': { '': [[-1,1,3,3,3,1]], 'm': [[-1,1,3,3,2,1]], '7': [[-1,1,3,1,3,1]] },
};

const UKULELE_CHORDS: Record<string, Record<string, number[][]>> = {
  'C':  { '': [[0,0,0,3]], 'm': [[0,3,3,3]], '7': [[0,0,0,1]] },
  'D':  { '': [[2,2,2,0]], 'm': [[2,2,1,0]], '7': [[2,2,2,3]] },
  'E':  { '': [[1,4,0,2]], 'm': [[0,4,3,2]], '7': [[1,2,0,2]] },
  'F':  { '': [[2,0,1,0]], 'm': [[1,0,1,3]], '7': [[2,3,1,0]] },
  'G':  { '': [[0,2,3,2]], 'm': [[0,2,3,1]], '7': [[0,2,1,2]] },
  'A':  { '': [[2,1,0,0]], 'm': [[2,0,0,0]], '7': [[0,1,0,0]] },
  'B':  { '': [[4,3,2,2]], 'm': [[4,2,2,2]], '7': [[2,3,2,2]] },
  'Bb': { '': [[3,2,1,1]], 'm': [[3,1,1,1]] },
  'Eb': { '': [[0,3,3,1]], 'm': [[3,3,2,1]] },
  'Ab': { '': [[5,3,4,3]], 'm': [[4,3,4,2]] },
};

// ─── Lookup ──────────────────────────────────────────────────────────────────

function getChordDb(instrument: ChordInstrument): Record<string, Record<string, number[][]>> {
  switch (instrument) {
    case 'ukulele': return UKULELE_CHORDS;
    case 'mandolin': return UKULELE_CHORDS; // mandolin shares open tuning shapes
    default: return GUITAR_CHORDS;
  }
}

/** Look up fingerings for a chord */
export function lookupChord(
  chord: ChordToken,
  instrument: ChordInstrument = 'guitar',
): ChordFingering[] {
  // Custom shape takes priority
  if (chord.customShape) {
    const parsed = parseCustomShape(chord.customShape, instrument);
    if (parsed) return [parsed];
  }

  const db = getChordDb(instrument);
  const rootEntry = db[chord.root];
  if (!rootEntry) return [];

  const suffix = normalizeQuality(chord.quality);
  const fretSets = rootEntry[suffix];
  if (!fretSets) {
    // Try empty (major) as fallback
    const majorSets = rootEntry[''];
    return majorSets ? majorSets.map(frets => toFingering(frets)) : [];
  }

  return fretSets.map(frets => toFingering(frets));
}

function normalizeQuality(q: string): string {
  if (!q || q === 'maj' || q === 'M') return '';
  if (q === 'min') return 'm';
  return q;
}

function toFingering(frets: number[]): ChordFingering {
  const playable = frets.filter(f => f > 0);
  const minFret = playable.length ? Math.min(...playable) : 1;
  const baseFret = minFret > 3 ? minFret : 1;

  return {
    frets: baseFret > 1 ? frets.map(f => f <= 0 ? f : f - baseFret + 1) : frets,
    baseFret,
  };
}

// ─── Custom chord shapes ─────────────────────────────────────────────────────

/** Parse custom shape: "x13333", "4|x2x132", "x34_242_" */
export function parseCustomShape(
  shape: string,
  instrument: ChordInstrument = 'guitar',
): ChordFingering | null {
  const stringCount = INSTRUMENT_STRING_COUNTS[instrument];

  // Handle capo notation: "4|x2x132"
  let baseFret = 1;
  const capoMatch = shape.match(/^(\d+)\|(.+)$/);
  let fretStr = shape;
  if (capoMatch) {
    baseFret = parseInt(capoMatch[1], 10);
    fretStr = capoMatch[2];
  }

  // Parse frets: space/comma separated for high frets, or single chars
  let frets: number[];
  if (fretStr.includes(' ') || fretStr.includes(',')) {
    frets = fretStr.split(/[\s,]+/).map(parseFretChar);
  } else {
    frets = fretStr.split('').map(parseFretChar);
  }

  if (frets.length !== stringCount) return null;

  return { frets, baseFret };
}

function parseFretChar(c: string): number {
  if (c === 'x' || c === 'X') return -1;
  if (c === '_') return -1; // barre marker
  const n = parseInt(c, 10);
  return isNaN(n) ? -1 : n;
}

// ─── SVG rendering ───────────────────────────────────────────────────────────

/** Render a chord diagram as an SVG string */
export function renderChordDiagramSvg(
  chordName: string,
  fingering: ChordFingering,
  instrument: ChordInstrument = 'guitar',
  size: number = 100,
): string {
  const stringCount = INSTRUMENT_STRING_COUNTS[instrument];
  const fretCount = 5;
  const padding = 20;
  const titleHeight = 18;
  const width = size;
  const gridWidth = width - padding * 2;
  const gridHeight = (width * 0.8);
  const height = gridHeight + padding + titleHeight + 15;
  const stringSpacing = gridWidth / (stringCount - 1);
  const fretSpacing = gridHeight / fretCount;
  const dotRadius = Math.max(4, stringSpacing * 0.3);

  const lines: string[] = [];
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);

  // Title
  lines.push(`<text x="${width / 2}" y="${titleHeight}" text-anchor="middle" font-size="13" font-weight="600" fill="currentColor">${escapeXml(chordName)}</text>`);

  const gridTop = titleHeight + 10;
  const gridLeft = padding;

  // Base fret indicator
  if (fingering.baseFret > 1) {
    lines.push(`<text x="${gridLeft - 8}" y="${gridTop + fretSpacing * 0.6}" text-anchor="end" font-size="10" fill="currentColor">${fingering.baseFret}fr</text>`);
  } else {
    // Nut (thick top line)
    lines.push(`<line x1="${gridLeft}" y1="${gridTop}" x2="${gridLeft + gridWidth}" y2="${gridTop}" stroke="currentColor" stroke-width="3"/>`);
  }

  // Fret lines
  for (let f = 0; f <= fretCount; f++) {
    const y = gridTop + f * fretSpacing;
    lines.push(`<line x1="${gridLeft}" y1="${y}" x2="${gridLeft + gridWidth}" y2="${y}" stroke="currentColor" stroke-opacity="0.3" stroke-width="1"/>`);
  }

  // Strings
  for (let s = 0; s < stringCount; s++) {
    const x = gridLeft + s * stringSpacing;
    lines.push(`<line x1="${x}" y1="${gridTop}" x2="${x}" y2="${gridTop + gridHeight}" stroke="currentColor" stroke-opacity="0.4" stroke-width="1"/>`);
  }

  // Finger dots and open/muted indicators
  for (let s = 0; s < stringCount && s < fingering.frets.length; s++) {
    const x = gridLeft + s * stringSpacing;
    const fret = fingering.frets[s];

    if (fret === -1) {
      // Muted
      lines.push(`<text x="${x}" y="${gridTop - 4}" text-anchor="middle" font-size="10" fill="currentColor">×</text>`);
    } else if (fret === 0) {
      // Open
      lines.push(`<circle cx="${x}" cy="${gridTop - 6}" r="${dotRadius * 0.7}" fill="none" stroke="currentColor" stroke-width="1.5"/>`);
    } else {
      // Fretted
      const y = gridTop + (fret - 0.5) * fretSpacing;
      lines.push(`<circle cx="${x}" cy="${y}" r="${dotRadius}" fill="currentColor"/>`);
    }
  }

  lines.push('</svg>');
  return lines.join('\n');
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Get all unique chord names from lines */
export function getUniqueChords(lines: Array<{ chords?: ChordToken[] }>): string[] {
  const seen = new Set<string>();
  for (const line of lines) {
    for (const c of line.chords ?? []) {
      seen.add(c.symbol);
    }
  }
  return [...seen];
}
