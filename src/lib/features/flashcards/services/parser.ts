/**
 * Flashcard parser — extracts flashcards from Bismuth Markdown note content.
 *
 * Supported syntaxes (inspired by Yanki / Obsidian Flashcards plugin):
 *
 * 1. Block basic:
 *    Question text
 *    #card
 *    Answer text
 *
 * 2. Inline basic:
 *    Question :: Answer
 *
 * 3. Inline reversed:
 *    Question ::: Answer
 *
 * 4. Cloze:
 *    Text with ==highlighted== deletion
 *    or {curly brace} deletion
 *
 * 5. Separator basic (Yanki-style):
 *    Front
 *    ---
 *    Back
 *    (only when inside a #card block or flashcard fence)
 */

import type { Flashcard, FlashcardType, NoteFlashcards } from '../types/flashcard';

const INLINE_BASIC_RE = /^(.+?)\s*::\s*(.+)$/;
const INLINE_REVERSED_RE = /^(.+?)\s*:::\s*(.+)$/;
const _CLOZE_HIGHLIGHT_RE = /==(.+?)==/g;
void _CLOZE_HIGHLIGHT_RE;
const _CLOZE_CURLY_RE = /\{([^}]+)\}/g;
void _CLOZE_CURLY_RE;
const CARD_TAG_RE = /#card(?:[-/]reverse(?:d)?|[-/]spaced)?/i;
const MULTILINE_SEP_RE = /^\?$/;
const MULTILINE_REV_SEP_RE = /^\?\?$/;
const FLASHCARDS_TAG_RE = /#flashcards(?:\/[\w-]+)*/i;
const HEADING_RE = /^(#{1,6})\s+(.+)$/;
const BOLD_CLOZE_RE = /\*\*([^*:]+)\*\*(?!:)/g;

/** Deterministic short hash for stable card IDs across re-parses. */
function stableId(notePath: string, line: number, front: string): string {
  let h = 0;
  const s = `${notePath}:${line}:${front}`;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

/** Derive deck name from note path: "Journal/2026/Note" → "Bismuth::Journal::2026". */
function deckFromPath(notePath: string): string {
  const parts = notePath.replace(/\.md$/, '').split('/');
  parts.pop(); // drop filename
  if (parts.length === 0) return 'Bismuth';
  return 'Bismuth::' + parts.join('::');
}

/** Derive deck from #flashcards/sub/deck tag: "#flashcards/CS/Algorithms" → "Bismuth::CS::Algorithms". */
function deckFromTag(tag: string): string | null {
  const match = FLASHCARDS_TAG_RE.exec(tag);
  if (!match) return null;
  const raw = match[0].replace(/^#flashcards\/?/i, '');
  if (!raw) return 'Bismuth';
  return 'Bismuth::' + raw.split('/').join('::');
}

/** Build heading breadcrumb context from the heading stack at a given line. */
function buildContext(notePath: string, headingStack: string[]): string {
  const noteTitle = notePath.split('/').pop()?.replace(/\.md$/, '') ?? '';
  if (headingStack.length === 0) return noteTitle;
  return noteTitle + ' > ' + headingStack.join(' > ');
}

/** Extract tags from note frontmatter YAML block. */
function extractFrontmatterTags(content: string): string[] {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return [];
  const tagsMatch = match[1].match(/^tags:\s*\[([^\]]*)\]/m);
  if (tagsMatch) {
    return tagsMatch[1]
      .split(',')
      .map((t) => t.trim().replace(/['"]/g, ''))
      .filter(Boolean);
  }
  const yamlListMatch = match[1].match(/^tags:\s*\n((?:\s+-\s+.+\n?)+)/m);
  if (yamlListMatch) {
    return yamlListMatch[1]
      .split('\n')
      .map((l) => l.replace(/^\s*-\s*/, '').trim())
      .filter(Boolean);
  }
  return [];
}

export function parseFlashcards(notePath: string, content: string): NoteFlashcards {
  const lines = content.split('\n');
  const baseTags = extractFrontmatterTags(content);
  const cards: Flashcard[] = [];

  // Determine deck from #flashcards tag in content or frontmatter, else from path
  let deck = deckFromPath(notePath);
  for (const tag of baseTags) {
    const tagDeck = deckFromTag('#' + tag);
    if (tagDeck) {
      deck = tagDeck;
      break;
    }
  }
  // Also scan body for inline #flashcards tag
  for (const line of lines) {
    const tagMatch = line.match(FLASHCARDS_TAG_RE);
    if (tagMatch) {
      const tagDeck = deckFromTag(tagMatch[0]);
      if (tagDeck) {
        deck = tagDeck;
        break;
      }
    }
  }

  // Heading stack for card context
  const headingStack: string[] = [];

  let inCardBlock = false;
  let blockFrontLines: string[] = [];
  let blockStartLine = 0;
  let blockType: FlashcardType = 'basic';
  let blockTags: string[] = [];
  // Multi-line ?/?? separator state
  let multilineFrontLines: string[] = [];
  let multilineStartLine = 0;
  let multilineType: FlashcardType | null = null;

  const pushBlockCard = (backLines: string[], _endLine: number) => {
    const front = blockFrontLines.join('\n').trim();
    const back = backLines.join('\n').trim();
    if (!front) return;
    cards.push({
      id: stableId(notePath, blockStartLine, front),
      type: blockType,
      front,
      back: back || undefined,
      tags: [...new Set([...baseTags, ...blockTags, 'bismuth'])],
      deck,
      sourcePath: notePath,
      sourceLine: blockStartLine,
      ankiNoteId: null,
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // --- Track heading stack for card context
    const headingMatch = HEADING_RE.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length;
      // Pop to parent level
      while (headingStack.length >= level) headingStack.pop();
      headingStack.push(headingMatch[2].trim());
    }

    // --- Multi-line separator ? (forward) or ?? (reversed)
    if (multilineType === null && !inCardBlock) {
      if (MULTILINE_REV_SEP_RE.test(trimmed)) {
        // Collect preceding non-blank lines as front
        multilineFrontLines = [];
        for (let j = i - 1; j >= 0; j--) {
          if (lines[j].trim() === '') break;
          if (HEADING_RE.test(lines[j])) break;
          multilineFrontLines.unshift(lines[j]);
        }
        multilineStartLine = i - multilineFrontLines.length;
        multilineType = 'multiline-reversed';
        continue;
      }
      if (MULTILINE_SEP_RE.test(trimmed)) {
        multilineFrontLines = [];
        for (let j = i - 1; j >= 0; j--) {
          if (lines[j].trim() === '') break;
          if (HEADING_RE.test(lines[j])) break;
          multilineFrontLines.unshift(lines[j]);
        }
        multilineStartLine = i - multilineFrontLines.length;
        multilineType = 'multiline';
        continue;
      }
    }

    // Collecting answer lines after ? or ??
    if (multilineType !== null) {
      if (trimmed === '' || HEADING_RE.test(line)) {
        // End of answer block
        const front = multilineFrontLines.join('\n').trim();
        const back = lines
          .slice(multilineStartLine + multilineFrontLines.length + 1, i)
          .join('\n')
          .trim();
        if (front && back) {
          cards.push({
            id: stableId(notePath, multilineStartLine, front),
            type: multilineType,
            front,
            back,
            tags: [...new Set([...baseTags, 'bismuth'])],
            deck,
            sourcePath: notePath,
            sourceLine: multilineStartLine,
            ankiNoteId: null,
            context: buildContext(notePath, headingStack),
          });
        }
        multilineType = null;
        multilineFrontLines = [];
        // Don't skip — this line could be a heading or content
      } else {
        continue; // collecting answer lines
      }
    }

    // --- Inline reversed (:::) — check before basic (::)
    const revMatch = INLINE_REVERSED_RE.exec(line);
    if (revMatch && !inCardBlock) {
      cards.push({
        id: stableId(notePath, i, revMatch[1]),
        type: 'basic-reversed',
        front: revMatch[1].trim(),
        back: revMatch[2].trim(),
        tags: [...new Set([...baseTags, 'bismuth'])],
        deck,
        sourcePath: notePath,
        sourceLine: i,
        ankiNoteId: null,
        context: buildContext(notePath, headingStack),
      });
      continue;
    }

    // --- Inline basic (::)
    const basicMatch = INLINE_BASIC_RE.exec(line);
    if (basicMatch && !inCardBlock && !revMatch) {
      cards.push({
        id: stableId(notePath, i, basicMatch[1]),
        type: 'basic',
        front: basicMatch[1].trim(),
        back: basicMatch[2].trim(),
        tags: [...new Set([...baseTags, 'bismuth'])],
        deck,
        sourcePath: notePath,
        sourceLine: i,
        ankiNoteId: null,
        context: buildContext(notePath, headingStack),
      });
      continue;
    }

    // --- #card tag — starts or terminates a block card
    if (CARD_TAG_RE.test(line)) {
      const isReversed = /reverse/i.test(line);
      if (!inCardBlock) {
        // Start block: lines above this are the front
        blockFrontLines = lines
          .slice(Math.max(0, i - 20), i)
          .reverse()
          .reduce<string[]>((acc, l) => {
            if (l.trim() === '' && acc.length > 0) return acc; // stop at blank line
            if (l.startsWith('#') && acc.length > 0) return acc; // stop at heading
            acc.unshift(l);
            return acc;
          }, []);
        blockStartLine = i - blockFrontLines.length;
        blockType = isReversed ? 'basic-reversed' : 'basic';
        blockTags = (line.match(/#[\w-/]+/g) || [])
          .filter((t) => !CARD_TAG_RE.test(t))
          .map((t) => t.slice(1));
        inCardBlock = true;
        blockFrontLines = []; // will collect from next lines for back
      } else {
        // End of block
        pushBlockCard(blockFrontLines, i);
        inCardBlock = false;
        blockFrontLines = [];
      }
      continue;
    }

    if (inCardBlock) {
      blockFrontLines.push(line);
      continue;
    }

    // --- Cloze via ==highlights==, {curly}, or **bold** deletions
    const hasCloze =
      /==.+?==/g.test(line) || /(?<!\{)\{(?!\{)[^{}]+\}/g.test(line) || BOLD_CLOZE_RE.test(line);
    // Reset lastIndex after .test()
    BOLD_CLOZE_RE.lastIndex = 0;
    if (hasCloze) {
      let clozeIndex = 1;
      // Replace ==highlights== first
      let front = line.replace(/==(.+?)==/g, (_, t) => `{{c${clozeIndex++}::${t}}}`);
      // Replace {curly} that are NOT already {{double-braced}}
      front = front.replace(
        /(?<!\{)\{(?!\{)([^{}]+)\}(?!\})/g,
        (_, t) => `{{c${clozeIndex++}::${t}}}`
      );
      // Replace **bold** (not followed by :) that are NOT already wrapped
      front = front.replace(/\*\*([^*:]+)\*\*(?!:)/g, (full, t) => {
        if (full.includes('{{c')) return full; // already converted
        return `{{c${clozeIndex++}::${t}}}`;
      });
      if (clozeIndex > 1) {
        cards.push({
          id: stableId(notePath, i, front),
          type: 'cloze',
          front,
          tags: [...new Set([...baseTags, 'bismuth'])],
          deck,
          sourcePath: notePath,
          sourceLine: i,
          ankiNoteId: null,
          context: buildContext(notePath, headingStack),
        });
      }
    }
  }

  // Close any open block card at EOF
  if (inCardBlock && blockFrontLines.length > 0) {
    pushBlockCard([], lines.length - 1);
  }

  // Close any open multi-line card at EOF
  if (multilineType !== null) {
    const front = multilineFrontLines.join('\n').trim();
    const sepLine = multilineStartLine + multilineFrontLines.length;
    const back = lines
      .slice(sepLine + 1)
      .join('\n')
      .trim();
    if (front && back) {
      cards.push({
        id: stableId(notePath, multilineStartLine, front),
        type: multilineType,
        front,
        back,
        tags: [...new Set([...baseTags, 'bismuth'])],
        deck,
        sourcePath: notePath,
        sourceLine: multilineStartLine,
        ankiNoteId: null,
        context: buildContext(notePath, headingStack),
      });
    }
  }

  return { notePath, cards, hasCards: cards.length > 0 };
}
