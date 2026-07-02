/**
 * Flashcard Generator — turns margin notes ending in ;; into Q/A flashcards.
 * The paragraph adjacent to the blur note becomes the answer,
 * the margin note text becomes the question/cue.
 */
import type { FlashcardEntry } from '../types';
import { parseMarginNotes, lineMainText } from './marginParser';

// ─── Extraction ──────────────────────────────────────────────────────────────

/** Extract flashcard entries from content based on blur-tagged margin notes */
export function extractFlashcards(content: string, filePath: string): FlashcardEntry[] {
  const notes = parseMarginNotes(content, filePath);
  const blurNotes = notes.filter((n) => n.isBlur);
  const lines = content.split('\n');
  const cards: FlashcardEntry[] = [];

  for (const note of blurNotes) {
    const lineIdx = note.line - 1;
    if (lineIdx < 0 || lineIdx >= lines.length) continue;

    const mainText = lineMainText(lines[lineIdx]);
    if (!mainText) continue;

    cards.push({
      question: note.text,
      answer: mainText,
      sourceLine: note.line,
      filePath,
    });
  }

  return cards;
}

// ─── Markdown generation ─────────────────────────────────────────────────────

/** Format flashcards as a Markdown section */
export function formatFlashcardsSection(cards: FlashcardEntry[]): string {
  if (cards.length === 0) return '';

  const lines = ['### Flashcards', ''];
  for (const card of cards) {
    lines.push(`**Q:** ${card.question}`);
    lines.push(`**A:** ${card.answer}`);
    lines.push('');
  }
  return lines.join('\n');
}

/** Format flashcards in Anki-compatible format (tab-separated) */
export function formatAnkiExport(cards: FlashcardEntry[]): string {
  return cards.map((c) => `${c.question}\t${c.answer}`).join('\n');
}

// ─── Content injection ───────────────────────────────────────────────────────

const FLASHCARD_HEADING_RE = /^### Flashcards\s*$/m;

/** Append or replace the flashcard section in content */
export function injectFlashcards(content: string, filePath: string): string {
  const cards = extractFlashcards(content, filePath);
  if (cards.length === 0) return content;

  const section = formatFlashcardsSection(cards);
  const headingMatch = content.match(FLASHCARD_HEADING_RE);

  if (headingMatch && headingMatch.index !== undefined) {
    const before = content.slice(0, headingMatch.index).trimEnd();
    return `${before}\n\n${section}`;
  }

  return `${content.trimEnd()}\n\n${section}`;
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export function flashcardStats(
  content: string,
  filePath: string
): {
  total: number;
  blurCount: number;
  cardCount: number;
} {
  const notes = parseMarginNotes(content, filePath);
  const cards = extractFlashcards(content, filePath);
  return {
    total: notes.length,
    blurCount: notes.filter((n) => n.isBlur).length,
    cardCount: cards.length,
  };
}
