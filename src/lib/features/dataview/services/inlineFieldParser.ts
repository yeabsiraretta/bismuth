/**
 * Inline field parser — extracts `Key:: Value` metadata from markdown content.
 *
 * Supports three syntaxes:
 *   - `Key:: Value`          (full-line inline field)
 *   - `[Key:: Value]`        (bracket inline, visible)
 *   - `(Key:: Value)`        (paren inline, hidden in preview)
 *
 * Also coerces values to appropriate DvValue types (number, boolean, date, link, list).
 */

import type { InlineField, DvValue, DvLink } from '@/features/dataview/types/dataview';

/** Full-line: `Key:: Value` (key must start at line beginning or after bold/italic markers) */
const FULL_LINE_RE = /^(?:\*{0,2})([a-zA-Z][\w-]*)(?:\*{0,2})\s*::\s*(.+)$/;

/** Bracket: `[Key:: Value]` */
const BRACKET_RE = /\[([a-zA-Z][\w-]*)\s*::\s*([^\]]*)\]/g;

/** Paren (hidden): `(Key:: Value)` */
const PAREN_RE = /\(([a-zA-Z][\w-]*)\s*::\s*([^)]*)\)/g;

/** Wikilink pattern inside values */
const LINK_RE = /^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/;

/** Comma-separated list pattern */
const LIST_RE = /,\s*/;

/**
 * Coerce a raw string value into a typed DvValue.
 * Order: null → boolean → number → date → link → list → string
 */
export function coerceValue(raw: string): DvValue {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'null') return null;
  if (trimmed.toLowerCase() === 'true') return true;
  if (trimmed.toLowerCase() === 'false') return false;

  // Number
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);

  // ISO date
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/.test(trimmed)) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
  }

  // Wikilink
  const linkMatch = LINK_RE.exec(trimmed);
  if (linkMatch) {
    return { type: 'link', path: linkMatch[1], display: linkMatch[2] } as DvLink;
  }

  // Comma-separated list (only if >1 items)
  if (LIST_RE.test(trimmed)) {
    const parts = trimmed.split(LIST_RE).map((p) => coerceValue(p));
    if (parts.length > 1) return parts;
  }

  return trimmed;
}

/**
 * Parse all inline fields from a line of text.
 * @param lineText - The raw line text.
 * @param lineOffset - The character offset of this line within the document.
 */
export function parseLineInlineFields(lineText: string, lineOffset: number): InlineField[] {
  const fields: InlineField[] = [];

  // Full-line field
  const fullMatch = FULL_LINE_RE.exec(lineText);
  if (fullMatch) {
    fields.push({
      key: fullMatch[1],
      value: coerceValue(fullMatch[2]),
      from: lineOffset,
      to: lineOffset + lineText.length,
      source: 'inline',
    });
    return fields;
  }

  // Bracket fields
  let m: RegExpExecArray | null;
  BRACKET_RE.lastIndex = 0;
  while ((m = BRACKET_RE.exec(lineText)) !== null) {
    fields.push({
      key: m[1],
      value: coerceValue(m[2]),
      from: lineOffset + m.index,
      to: lineOffset + m.index + m[0].length,
      source: 'inline-bracket',
    });
  }

  // Paren fields
  PAREN_RE.lastIndex = 0;
  while ((m = PAREN_RE.exec(lineText)) !== null) {
    fields.push({
      key: m[1],
      value: coerceValue(m[2]),
      from: lineOffset + m.index,
      to: lineOffset + m.index + m[0].length,
      source: 'inline-paren',
    });
  }

  return fields;
}

/**
 * Extract all inline fields from a full markdown document.
 * Skips frontmatter (between `---` fences) and fenced code blocks.
 */
export function parseDocumentInlineFields(content: string): InlineField[] {
  const lines = content.split('\n');
  const fields: InlineField[] = [];
  let inFrontmatter = false;
  let inCodeBlock = false;
  let offset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track frontmatter
    if (i === 0 && line === '---') { inFrontmatter = true; offset += line.length + 1; continue; }
    if (inFrontmatter) {
      if (line === '---') inFrontmatter = false;
      offset += line.length + 1;
      continue;
    }

    // Track fenced code blocks
    if (/^(`{3,}|~{3,})/.test(line)) {
      inCodeBlock = !inCodeBlock;
      offset += line.length + 1;
      continue;
    }
    if (inCodeBlock) { offset += line.length + 1; continue; }

    fields.push(...parseLineInlineFields(line, offset));
    offset += line.length + 1;
  }

  return fields;
}

/**
 * Extract markdown tasks from document content.
 */
export function parseDocumentTasks(content: string, path: string): Array<{
  text: string;
  completed: boolean;
  line: number;
  path: string;
  tags: string[];
}> {
  const tasks: Array<{ text: string; completed: boolean; line: number; path: string; tags: string[] }> = [];
  const lines = content.split('\n');
  const TASK_RE = /^[\s>]*- \[([ xX])\]\s*(.*)$/;
  const TAG_RE = /#([\w/-]+)/g;

  for (let i = 0; i < lines.length; i++) {
    const m = TASK_RE.exec(lines[i]);
    if (!m) continue;
    const text = m[2].trim();
    const tags: string[] = [];
    let tm: RegExpExecArray | null;
    TAG_RE.lastIndex = 0;
    while ((tm = TAG_RE.exec(text)) !== null) tags.push(tm[1]);
    tasks.push({ text, completed: m[1] !== ' ', line: i + 1, path, tags });
  }

  return tasks;
}
