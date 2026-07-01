/**
 * Study parser — extracts Q&A pairs from topic notes using the Study Vault format.
 *
 * Supported syntax:
 *   ## Q: What is the OSI model?
 *   **A:** A 7-layer conceptual framework...
 *
 * Also extracts Practice Questions sections.
 */

import type { PracticeQuestion } from '../types/course';
import type { Flashcard } from '../types/flashcard';
import { parseFlashcards } from './parser';

const HEADING_Q_RE = /^#{1,4}\s+Q:\s*(.+)$/;
const BOLD_A_RE = /^\*\*A:\*\*\s*(.+)$/;

/** Parse `## Q:` / `**A:**` heading-style flashcards from a topic note. */
export function parseStudyVaultCards(notePath: string, content: string): Flashcard[] {
  const lines = content.split('\n');
  const deck = deriveStudyDeck(notePath);
  const cards: Flashcard[] = [];

  for (let i = 0; i < lines.length; i++) {
    const qMatch = HEADING_Q_RE.exec(lines[i]);
    if (!qMatch) continue;

    // Look ahead for the answer on the next non-blank line
    let answerLine = '';
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      if (lines[j].trim() === '') continue;
      const aMatch = BOLD_A_RE.exec(lines[j].trim());
      if (aMatch) {
        answerLine = aMatch[1].trim();
      }
      break;
    }

    const front = qMatch[1].trim();
    let h = 0;
    const s = `${notePath}:${i}:${front}`;
    for (let k = 0; k < s.length; k++) h = (Math.imul(31, h) + s.charCodeAt(k)) | 0;
    const id = (h >>> 0).toString(36);

    cards.push({
      id,
      type: 'basic',
      front,
      back: answerLine || undefined,
      tags: ['bismuth', 'study-vault'],
      deck,
      sourcePath: notePath,
      sourceLine: i,
      ankiNoteId: null,
    });
  }

  return cards;
}

/** Parse practice questions section from a topic note. */
export function parsePracticeQuestions(notePath: string, content: string): PracticeQuestion[] {
  const lines = content.split('\n');
  const questions: PracticeQuestion[] = [];
  let inSection = false;

  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,3}\s+Practice Questions/i.test(lines[i])) {
      inSection = true;
      continue;
    }
    if (inSection && /^#{1,3}\s/.test(lines[i])) {
      inSection = false;
      continue;
    }
    if (!inSection) continue;

    const qMatch = HEADING_Q_RE.exec(lines[i]);
    if (!qMatch) continue;

    let answer = '';
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      if (lines[j].trim() === '') continue;
      const aMatch = BOLD_A_RE.exec(lines[j].trim());
      if (aMatch) answer = aMatch[1].trim();
      break;
    }

    questions.push({ question: qMatch[1].trim(), answer, notePath, line: i });
  }

  return questions;
}

/** Combine Study Vault `## Q:` cards with standard flashcard syntax from the same note. */
export function parseAllCards(notePath: string, content: string): Flashcard[] {
  const standard = parseFlashcards(notePath, content).cards;
  const studyVault = parseStudyVaultCards(notePath, content);
  // Deduplicate by card id
  const seen = new Set(standard.map((c) => c.id));
  const unique = studyVault.filter((c) => !seen.has(c.id));
  return [...standard, ...unique];
}

function deriveStudyDeck(notePath: string): string {
  const parts = notePath.replace(/\.md$/, '').split('/');
  parts.pop();
  return parts.length === 0 ? 'Bismuth' : 'Bismuth::' + parts.join('::');
}
