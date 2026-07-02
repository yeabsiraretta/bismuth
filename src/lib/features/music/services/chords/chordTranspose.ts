/**
 * Chord Transposition — transpose chord symbols up/down by semitones
 * with enharmonic handling (prefer sharps or flats based on key context).
 */
import type { ChordToken, ChordLine } from '../../types/chords';
import { NOTE_TO_INDEX, NOTE_NAMES_SHARP, NOTE_NAMES_FLAT } from '../../types/chords';

// ─── Note transposition ─────────────────────────────────────────────────────

/** Keys that conventionally use flats */
const FLAT_KEYS = new Set([
  'F',
  'Bb',
  'Eb',
  'Ab',
  'Db',
  'Gb',
  'Dm',
  'Gm',
  'Cm',
  'Fm',
  'Bbm',
  'Ebm',
]);

/** Transpose a single note name by `semitones` half steps */
export function transposeNote(note: string, semitones: number, useFlats: boolean = false): string {
  const idx = NOTE_TO_INDEX[note];
  if (idx === undefined) return note;

  const newIdx = (((idx + semitones) % 12) + 12) % 12;
  return useFlats ? NOTE_NAMES_FLAT[newIdx] : NOTE_NAMES_SHARP[newIdx];
}

/** Determine if we should use flats based on the target key */
export function shouldUseFlats(rootNote: string, semitones: number): boolean {
  const idx = NOTE_TO_INDEX[rootNote];
  if (idx === undefined) return false;
  const newIdx = (((idx + semitones) % 12) + 12) % 12;
  const newNote = NOTE_NAMES_SHARP[newIdx];
  const newNoteFlat = NOTE_NAMES_FLAT[newIdx];
  return FLAT_KEYS.has(newNote) || FLAT_KEYS.has(newNoteFlat);
}

// ─── Chord transposition ─────────────────────────────────────────────────────

/** Transpose a chord token by `semitones` half steps */
export function transposeChord(
  chord: ChordToken,
  semitones: number,
  useFlats?: boolean
): ChordToken {
  if (semitones === 0) return chord;

  const flats = useFlats ?? shouldUseFlats(chord.root, semitones);
  const newRoot = transposeNote(chord.root, semitones, flats);
  const newBass = chord.bass ? transposeNote(chord.bass, semitones, flats) : undefined;
  const newSymbol = `${newRoot}${chord.quality}${newBass ? `/${newBass}` : ''}`;

  return { ...chord, root: newRoot, bass: newBass, symbol: newSymbol };
}

/** Transpose all chords in a chord line text by semitones */
export function transposeChordLine(line: string, semitones: number, useFlats?: boolean): string {
  if (semitones === 0) return line;

  // Replace chord symbols in-place preserving spacing
  return line.replace(
    /\b([A-G][#b]?)((?:m(?:aj|in)?|M|aug|dim|sus[24]?|add|[Δø°+])?\d*(?:[#b]\d+)?(?:\/([A-G][#b]?))?)(\[([^\]]+)\])?\b/g,
    (_match, root: string, quality: string, bass: string | undefined) => {
      const flats = useFlats ?? shouldUseFlats(root, semitones);
      const newRoot = transposeNote(root, semitones, flats);
      let result = `${newRoot}${quality || ''}`;
      if (bass) {
        const qualityWithoutBass = (quality || '').replace(/\/[A-G][#b]?$/, '');
        const newBass = transposeNote(bass, semitones, flats);
        result = `${newRoot}${qualityWithoutBass}/${newBass}`;
      }
      return result;
    }
  );
}

/** Transpose an entire chord sheet's lines */
export function transposeLines(lines: ChordLine[], semitones: number): ChordLine[] {
  if (semitones === 0) return lines;

  return lines.map((line) => {
    if (line.type !== 'chord' || !line.chords?.length) return line;

    const transposedText = transposeChordLine(line.text, semitones);
    const transposedChords = line.chords.map((c) => transposeChord(c, semitones));

    return { ...line, text: transposedText, chords: transposedChords };
  });
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/** Get the key label for a transpose offset, e.g. "+2 (D → E)" */
export function transposeLabel(rootNote: string, semitones: number): string {
  if (semitones === 0) return 'Original key';
  const direction = semitones > 0 ? '+' : '';
  const useFlats = shouldUseFlats(rootNote, semitones);
  const newNote = transposeNote(rootNote, semitones, useFlats);
  return `${direction}${semitones} (${rootNote} → ${newNote})`;
}

/** All 12 semitone transpose options for UI */
export function transposeOptions(rootNote: string): Array<{ semitones: number; label: string }> {
  const options: Array<{ semitones: number; label: string }> = [];
  for (let i = -6; i <= 6; i++) {
    options.push({ semitones: i, label: transposeLabel(rootNote, i) });
  }
  return options;
}
