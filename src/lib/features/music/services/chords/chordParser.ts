/**
 * Chord Parser — detects and classifies chord symbols, lyric lines,
 * section headers, and parses ```chords fenced code blocks.
 * Supports %c / %t line markers and custom chord shapes in brackets.
 */
import type { ChordToken, ChordLine, ChordSheet, ChordInstrument } from '../../types/chords';
import { NOTE_TO_INDEX } from '../../types/chords';

// ─── Regex patterns ──────────────────────────────────────────────────────────

/** Section header: [Verse], [Chorus], etc. */
const SECTION_RE = /^\s*\[([A-Za-z0-9\s]+)\]\s*$/;

/** Line force markers */
const CHORD_MARKER_RE = /%c\s*$/;
const LYRIC_MARKER_RE = /%t\s*$/;

// ─── Chord symbol parsing ────────────────────────────────────────────────────

/** Parse a single chord symbol string into a ChordToken */
export function parseChordSymbol(text: string, column: number = 0): ChordToken | null {
  // Match pattern: Root + quality + optional slash bass + optional custom shape
  const m = text.match(
    /^([A-G][#b]?)((?:m(?:aj|in)?|M|aug|dim|sus[24]?|add|[Δø°+])?\d*(?:[#b]\d+)?(?:\/([A-G][#b]?))?)(\[([^\]]+)\])?$/
  );
  if (!m) return null;

  const root = m[1];
  if (NOTE_TO_INDEX[root] === undefined) return null;

  const fullQuality = m[2] || '';
  const bass = m[3];
  const customShape = m[5];

  return {
    symbol: text.replace(/\[.*\]$/, ''),
    root,
    quality: fullQuality.replace(/\/[A-G][#b]?$/, ''),
    bass,
    column,
    customShape,
  };
}

/** Extract all chord tokens from a line */
export function extractChords(line: string): ChordToken[] {
  const tokens: ChordToken[] = [];
  // Split by whitespace, try to parse each token
  const parts = line.split(/(\s+)/);
  let col = 0;
  for (const part of parts) {
    if (part.trim()) {
      // Strip line markers
      const clean = part.replace(/%[ct]\s*$/, '').trim();
      if (clean) {
        const token = parseChordSymbol(clean, col);
        if (token) tokens.push(token);
      }
    }
    col += part.length;
  }
  return tokens;
}

// ─── Line classification ─────────────────────────────────────────────────────

/** Heuristic: is this line a chord line? */
export function isChordLine(line: string): boolean {
  if (CHORD_MARKER_RE.test(line)) return true;
  if (LYRIC_MARKER_RE.test(line)) return false;

  const trimmed = line.trim();
  if (!trimmed) return false;
  if (SECTION_RE.test(trimmed)) return false;

  // Split into tokens
  const tokens = trimmed.replace(/%[ct]\s*$/, '').split(/\s+/);
  if (tokens.length === 0) return false;

  // Count how many tokens look like chords
  let chordCount = 0;
  for (const t of tokens) {
    if (parseChordSymbol(t) !== null) chordCount++;
  }

  // If majority of non-empty tokens are chords, it's a chord line
  const ratio = chordCount / tokens.length;
  return ratio >= 0.5 && chordCount >= 1;
}

/** Classify a single line */
export function classifyLine(line: string): ChordLine {
  const trimmed = line.trim();

  if (!trimmed) return { type: 'empty', text: line };

  if (SECTION_RE.test(trimmed)) {
    return { type: 'section', text: line };
  }

  // Forced markers
  if (CHORD_MARKER_RE.test(line)) {
    const clean = line.replace(CHORD_MARKER_RE, '');
    const chords = extractChords(clean);
    return { type: 'chord', text: clean, chords };
  }
  if (LYRIC_MARKER_RE.test(line)) {
    return { type: 'lyric', text: line.replace(LYRIC_MARKER_RE, '') };
  }

  // Heuristic detection
  if (isChordLine(line)) {
    const chords = extractChords(line);
    return { type: 'chord', text: line, chords };
  }

  // Check for tab lines (e.g. |--0-2-3-|)
  if (/^[eEBGDAa|]\|?[-0-9h\sp|~x]+$/.test(trimmed)) {
    return { type: 'tab', text: line };
  }

  return { type: 'lyric', text: line };
}

// ─── Block parsing ───────────────────────────────────────────────────────────

/** Parse a chord block body into classified lines */
export function parseChordBlock(body: string): {
  lines: ChordLine[];
  instrument?: ChordInstrument;
} {
  const rawLines = body.split('\n');
  const lines: ChordLine[] = [];
  let instrument: ChordInstrument | undefined;

  // Check first line for instrument directive: %instrument guitar
  const firstLine = rawLines[0]?.trim() ?? '';
  const instrMatch = firstLine.match(/^%instrument\s+(guitar|ukulele|mandolin)\s*$/i);
  const startIdx = instrMatch ? 1 : 0;
  if (instrMatch) {
    instrument = instrMatch[1].toLowerCase() as ChordInstrument;
  }

  for (let i = startIdx; i < rawLines.length; i++) {
    lines.push(classifyLine(rawLines[i]));
  }

  return { lines, instrument };
}

/** Find all ```chords blocks in a document string */
export function findChordBlocks(text: string, language: string = 'chords'): ChordSheet[] {
  const blocks: ChordSheet[] = [];
  const escaped = language.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^\`\`\`${escaped}\\s*\\n([\\s\\S]*?)^\`\`\``, 'gm');
  let match;

  while ((match = regex.exec(text)) !== null) {
    const body = match[1];
    const parsed = parseChordBlock(body);

    blocks.push({
      from: match.index,
      to: match.index + match[0].length,
      lines: parsed.lines,
      instrument: parsed.instrument,
      transpose: 0,
    });
  }

  return blocks;
}

/** Generate a sample chord sheet for insertion */
export function sampleChordSheet(): string {
  return `\`\`\`chords
[Verse]
Am        C          G           D
 All along the watchtower princes kept the view
Am        C           G       D
 While all the women came and went barefoot servants too

[Chorus]
Am     C       G       D
 No reason to get excited   the thief he kindly spoke
Am     C       G       D
 There are many here among us who feel that life is but a joke
\`\`\``;
}
