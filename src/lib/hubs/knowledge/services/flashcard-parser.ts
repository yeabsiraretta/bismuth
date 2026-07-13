/**
 * Flashcard parser — extracts flashcards from markdown note content.
 * Supports: inline (:: / :::), multiline (? / ??), #card blocks, cloze (== / {} / **bold**),
 * and Study Vault (## Q: / **A:**) formats.
 * Ported from v1 parser.ts + studyParser.ts.
 */

import type {
  Flashcard,
  FlashcardType,
  NoteFlashcards,
} from '@/hubs/knowledge/types/flashcard-types';

const INLINE_BASIC_RE = /^(.+?)\s*::\s*(.+)$/;
const INLINE_REVERSED_RE = /^(.+?)\s*:::\s*(.+)$/;
const CARD_TAG_RE = /#card(?:[-/]reverse(?:d)?|[-/]spaced)?/i;
const MULTILINE_SEP_RE = /^\?$/;
const MULTILINE_REV_SEP_RE = /^\?\?$/;
const FLASHCARDS_TAG_RE = /#flashcards(?:\/[\w-]+)*/i;
const HEADING_RE = /^(#{1,6})\s+(.+)$/;
const BOLD_CLOZE_RE = /\*\*([^*:]+)\*\*(?!:)/g;
const HEADING_Q_RE = /^#{1,4}\s+Q:\s*(.+)$/;
const BOLD_A_RE = /^\*\*A:\*\*\s*(.+)$/;

function stableId(notePath: string, line: number, front: string): string {
  let h = 0;
  const s = `${notePath}:${line}:${front}`;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function deckFromPath(notePath: string): string {
  const parts = notePath.replace(/\.md$/, '').split('/');
  parts.pop();
  return parts.length === 0 ? 'Bismuth' : 'Bismuth::' + parts.join('::');
}

function deckFromTag(tag: string): string | null {
  const match = FLASHCARDS_TAG_RE.exec(tag);
  if (!match) return null;
  const raw = match[0].replace(/^#flashcards\/?/i, '');
  return raw ? 'Bismuth::' + raw.split('/').join('::') : 'Bismuth';
}

function buildContext(notePath: string, headingStack: string[]): string {
  const noteTitle = notePath.split('/').pop()?.replace(/\.md$/, '') ?? '';
  return headingStack.length === 0 ? noteTitle : noteTitle + ' > ' + headingStack.join(' > ');
}

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
  let deck = deckFromPath(notePath);

  for (const tag of baseTags) {
    const d = deckFromTag('#' + tag);
    if (d) {
      deck = d;
      break;
    }
  }
  for (const line of lines) {
    const m = line.match(FLASHCARDS_TAG_RE);
    if (m) {
      const d = deckFromTag(m[0]);
      if (d) {
        deck = d;
        break;
      }
    }
  }

  const headingStack: string[] = [];
  let inCardBlock = false;
  let blockFrontLines: string[] = [];
  let blockStartLine = 0;
  let blockType: FlashcardType = 'basic';
  let blockTags: string[] = [];
  let mlFrontLines: string[] = [];
  let mlStartLine = 0;
  let mlType: FlashcardType | null = null;

  const mkCard = (
    type: FlashcardType,
    line: number,
    front: string,
    back?: string,
    extraTags: string[] = []
  ): Flashcard => ({
    id: stableId(notePath, line, front),
    type,
    front,
    back,
    deck,
    sourcePath: notePath,
    sourceLine: line,
    tags: [...new Set([...baseTags, ...extraTags, 'bismuth'])],
    context: buildContext(notePath, headingStack),
  });

  const pushBlock = (backLines: string[]) => {
    const front = blockFrontLines.join('\n').trim();
    const back = backLines.join('\n').trim();
    if (front) cards.push(mkCard(blockType, blockStartLine, front, back || undefined, blockTags));
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const hm = HEADING_RE.exec(line);
    if (hm) {
      while (headingStack.length >= hm[1].length) headingStack.pop();
      headingStack.push(hm[2].trim());
    }

    if (mlType === null && !inCardBlock) {
      if (MULTILINE_REV_SEP_RE.test(trimmed)) {
        mlFrontLines = [];
        for (let j = i - 1; j >= 0; j--) {
          if (lines[j].trim() === '' || HEADING_RE.test(lines[j])) break;
          mlFrontLines.unshift(lines[j]);
        }
        mlStartLine = i - mlFrontLines.length;
        mlType = 'multiline-reversed';
        continue;
      }
      if (MULTILINE_SEP_RE.test(trimmed)) {
        mlFrontLines = [];
        for (let j = i - 1; j >= 0; j--) {
          if (lines[j].trim() === '' || HEADING_RE.test(lines[j])) break;
          mlFrontLines.unshift(lines[j]);
        }
        mlStartLine = i - mlFrontLines.length;
        mlType = 'multiline';
        continue;
      }
    }

    if (mlType !== null) {
      if (trimmed === '' || HEADING_RE.test(line)) {
        const front = mlFrontLines.join('\n').trim();
        const back = lines
          .slice(mlStartLine + mlFrontLines.length + 1, i)
          .join('\n')
          .trim();
        if (front && back) cards.push(mkCard(mlType, mlStartLine, front, back));
        mlType = null;
        mlFrontLines = [];
      } else {
        continue;
      }
    }

    const revMatch = INLINE_REVERSED_RE.exec(line);
    if (revMatch && !inCardBlock) {
      cards.push(mkCard('basic-reversed', i, revMatch[1].trim(), revMatch[2].trim()));
      continue;
    }

    const basicMatch = INLINE_BASIC_RE.exec(line);
    if (basicMatch && !inCardBlock && !revMatch) {
      cards.push(mkCard('basic', i, basicMatch[1].trim(), basicMatch[2].trim()));
      continue;
    }

    if (CARD_TAG_RE.test(line)) {
      const isReversed = /reverse/i.test(line);
      if (!inCardBlock) {
        blockFrontLines = lines
          .slice(Math.max(0, i - 20), i)
          .reverse()
          .reduce<string[]>((acc, l) => {
            if ((l.trim() === '' || l.startsWith('#')) && acc.length > 0) return acc;
            acc.unshift(l);
            return acc;
          }, []);
        blockStartLine = i - blockFrontLines.length;
        blockType = isReversed ? 'basic-reversed' : 'basic';
        blockTags = (line.match(/#[\w-/]+/g) || [])
          .filter((t) => !CARD_TAG_RE.test(t))
          .map((t) => t.slice(1));
        inCardBlock = true;
        blockFrontLines = [];
      } else {
        pushBlock(blockFrontLines);
        inCardBlock = false;
        blockFrontLines = [];
      }
      continue;
    }

    if (inCardBlock) {
      blockFrontLines.push(line);
      continue;
    }

    const hasCloze =
      /==.+?==/g.test(line) || /(?<!\{)\{(?!\{)[^{}]+\}/g.test(line) || BOLD_CLOZE_RE.test(line);
    BOLD_CLOZE_RE.lastIndex = 0;
    if (hasCloze) {
      let ci = 1;
      let front = line.replace(/==(.+?)==/g, (_, t) => `{{c${ci++}::${t}}}`);
      front = front.replace(/(?<!\{)\{(?!\{)([^{}]+)\}(?!\})/g, (_, t) => `{{c${ci++}::${t}}}`);
      front = front.replace(/\*\*([^*:]+)\*\*(?!:)/g, (full, t) =>
        full.includes('{{c') ? full : `{{c${ci++}::${t}}}`
      );
      if (ci > 1) cards.push(mkCard('cloze', i, front));
    }
  }

  if (inCardBlock && blockFrontLines.length > 0) pushBlock([]);
  if (mlType !== null) {
    const front = mlFrontLines.join('\n').trim();
    const back = lines
      .slice(mlStartLine + mlFrontLines.length + 1)
      .join('\n')
      .trim();
    if (front && back) cards.push(mkCard(mlType, mlStartLine, front, back));
  }

  return { notePath, cards, hasCards: cards.length > 0 };
}

export function parseStudyVaultCards(notePath: string, content: string): Flashcard[] {
  const lines = content.split('\n');
  const deck = deckFromPath(notePath);
  const cards: Flashcard[] = [];
  for (let i = 0; i < lines.length; i++) {
    const qMatch = HEADING_Q_RE.exec(lines[i]);
    if (!qMatch) continue;
    let answer = '';
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      if (lines[j].trim() === '') continue;
      const aMatch = BOLD_A_RE.exec(lines[j].trim());
      if (aMatch) answer = aMatch[1].trim();
      break;
    }
    const front = qMatch[1].trim();
    cards.push({
      id: stableId(notePath, i, front),
      type: 'basic',
      front,
      back: answer || undefined,
      tags: ['bismuth', 'study-vault'],
      deck,
      sourcePath: notePath,
      sourceLine: i,
    });
  }
  return cards;
}

export function parseAllCards(notePath: string, content: string): Flashcard[] {
  const standard = parseFlashcards(notePath, content).cards;
  const studyVault = parseStudyVaultCards(notePath, content);
  const seen = new Set(standard.map((c) => c.id));
  return [...standard, ...studyVault.filter((c) => !seen.has(c.id))];
}
