/**
 * Margin Parser — extracts %%> %% and %%< %% margin notes from content,
 * resolves semantic prefixes, detects images and blur markers.
 */
import type { MarginNote, PrefixConfig, MarginDirection } from '../types';
import {
  MARGIN_ANY_RE, MARGIN_IMG_RE, BLUR_SUFFIX_RE, DEFAULT_PREFIXES,
} from '../types';

let nextId = 0;
function genId(): string { return `mn-${Date.now().toString(36)}-${nextId++}`; }

// ─── Prefix resolution ──────────────────────────────────────────────────────

export function resolvePrefix(
  text: string,
  prefixes: PrefixConfig[] = DEFAULT_PREFIXES,
): { prefix: PrefixConfig | null; cleanText: string } {
  for (const p of prefixes) {
    if (text.startsWith(p.symbol + ' ') || text.startsWith(p.symbol)) {
      const after = text.startsWith(p.symbol + ' ')
        ? text.slice(p.symbol.length + 1).trim()
        : text.slice(p.symbol.length).trim();
      return { prefix: p, cleanText: after };
    }
  }
  return { prefix: null, cleanText: text };
}

// ─── Image detection ─────────────────────────────────────────────────────────

export function parseImage(text: string): { isImage: boolean; imagePath: string | null } {
  const match = text.match(MARGIN_IMG_RE);
  if (match) return { isImage: true, imagePath: match[1] };
  return { isImage: false, imagePath: null };
}

// ─── Blur detection ──────────────────────────────────────────────────────────

export function isBlurNote(text: string): boolean {
  return BLUR_SUFFIX_RE.test(text);
}

export function stripBlurSuffix(text: string): string {
  return text.replace(BLUR_SUFFIX_RE, '').trim();
}

// ─── Main parser ─────────────────────────────────────────────────────────────

export function parseMarginNotes(
  content: string,
  filePath: string,
  prefixes: PrefixConfig[] = DEFAULT_PREFIXES,
): MarginNote[] {
  const notes: MarginNote[] = [];
  const lines = content.split('\n');

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const re = new RegExp(MARGIN_ANY_RE.source, 'g');
    let match: RegExpExecArray | null;

    while ((match = re.exec(line)) !== null) {
      const dirChar = match[1] as '>' | '<';
      const rawText = match[2].trim();
      const direction: MarginDirection = dirChar === '>' ? 'right' : 'left';
      const { prefix, cleanText } = resolvePrefix(rawText, prefixes);
      const { isImage, imagePath } = parseImage(cleanText);
      const blur = isBlurNote(cleanText);
      const displayText = blur ? stripBlurSuffix(cleanText) : cleanText;

      notes.push({
        id: genId(),
        text: displayText,
        rawSyntax: match[0],
        direction,
        prefix,
        line: lineIdx + 1,
        column: match.index + 1,
        filePath,
        isBlur: blur,
        isImage,
        imagePath,
      });
    }
  }

  return notes;
}

// ─── Content stripping ───────────────────────────────────────────────────────

/** Remove all margin note syntax from content for clean display */
export function stripMarginNotes(content: string): string {
  return content.replace(new RegExp(MARGIN_ANY_RE.source, 'g'), '').trim();
}

/** Extract just the main body text for a line (without margin notes) */
export function lineMainText(line: string): string {
  return line.replace(new RegExp(MARGIN_ANY_RE.source, 'g'), '').trim();
}

// ─── Insertion helpers ───────────────────────────────────────────────────────

/** Insert a margin note at a specific line in content */
export function insertMarginNote(
  content: string,
  line: number,
  text: string,
  direction: MarginDirection = 'right',
): string {
  const lines = content.split('\n');
  const idx = Math.max(0, Math.min(line - 1, lines.length - 1));
  const dirChar = direction === 'right' ? '>' : '<';
  const syntax = ` %%${dirChar} ${text} %%`;
  lines[idx] = lines[idx] + syntax;
  return lines.join('\n');
}

/** Wrap selected text with margin note syntax */
export function wrapWithMarginNote(
  selectedText: string,
  direction: MarginDirection = 'right',
): string {
  const dirChar = direction === 'right' ? '>' : '<';
  return `%%${dirChar} ${selectedText} %%`;
}

/** Wrap content in a cornell fenced block with margin note placeholder */
export function wrapCornellBlock(content: string): string {
  return `\`\`\`cornell\n%%>  %%\n${content}\n\`\`\``;
}

// ─── Batch scanning ──────────────────────────────────────────────────────────

export interface FileMarginNotes {
  filePath: string;
  title: string;
  notes: MarginNote[];
}

/** Parse margin notes from multiple files */
export function parseMultipleFiles(
  files: { path: string; content: string }[],
  prefixes: PrefixConfig[] = DEFAULT_PREFIXES,
): FileMarginNotes[] {
  return files
    .map(f => ({
      filePath: f.path,
      title: f.path.split('/').pop()?.replace('.md', '') ?? f.path,
      notes: parseMarginNotes(f.content, f.path, prefixes),
    }))
    .filter(f => f.notes.length > 0);
}

// ─── Grouping helpers ────────────────────────────────────────────────────────

export function groupByColor(
  notes: MarginNote[],
): Map<string, MarginNote[]> {
  const groups = new Map<string, MarginNote[]>();
  for (const note of notes) {
    const key = note.prefix?.label ?? 'Default';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(note);
  }
  return groups;
}

export function groupByFile(
  notes: MarginNote[],
): Map<string, MarginNote[]> {
  const groups = new Map<string, MarginNote[]>();
  for (const note of notes) {
    const key = note.filePath;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(note);
  }
  return groups;
}
