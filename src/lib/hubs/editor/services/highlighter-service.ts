/**
 * Highlighter Service — custom color-coded highlighting.
 *
 * Ported from Obsidian Highlightr plugin by Chetachi Ezikeuzor.
 * Supports both inline CSS (`<mark style="background: ...">`) and
 * CSS class (`<mark class="hltr-{name}">`) modes.
 *
 * Pure functions, no side effects.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface HighlighterColor {
  name: string;
  color: string;
}

export type HighlighterMode = 'inline' | 'css-class';

// ── Default palette ──────────────────────────────────────────────────────────

export const DEFAULT_HIGHLIGHTER_COLORS: HighlighterColor[] = [
  { name: 'Yellow', color: '#FDE68A' },
  { name: 'Green', color: '#BBF7D0' },
  { name: 'Blue', color: '#BFDBFE' },
  { name: 'Pink', color: '#FBCFE8' },
  { name: 'Purple', color: '#DDD6FE' },
  { name: 'Orange', color: '#FED7AA' },
  { name: 'Red', color: '#FECACA' },
  { name: 'Cyan', color: '#A5F3FC' },
];

// ── Wrap / unwrap ────────────────────────────────────────────────────────────

export function wrapHighlight(
  text: string,
  color: HighlighterColor,
  mode: HighlighterMode = 'inline'
): string {
  if (mode === 'css-class') {
    const className = toClassName(color.name);
    return `<mark class="hltr-${className}">${text}</mark>`;
  }
  return `<mark style="background: ${color.color}">${text}</mark>`;
}

export function unwrapHighlight(text: string): string {
  return text.replace(/<\/?mark[^>]*>/g, '');
}

// ── Parse highlight from string ──────────────────────────────────────────────

export interface ParsedHighlight {
  text: string;
  color: string | null;
  className: string | null;
  mode: HighlighterMode;
}

const MARK_INLINE_RE = /<mark\s+style="background:\s*([^"]+)">([\s\S]*?)<\/mark>/g;
const MARK_CLASS_RE = /<mark\s+class="hltr-([^"]+)">([\s\S]*?)<\/mark>/g;
const MARK_PLAIN_RE = /<mark>([\s\S]*?)<\/mark>/g;

export function parseHighlights(content: string): ParsedHighlight[] {
  const results: ParsedHighlight[] = [];

  let match: RegExpExecArray | null;

  MARK_INLINE_RE.lastIndex = 0;
  while ((match = MARK_INLINE_RE.exec(content)) !== null) {
    results.push({
      text: match[2],
      color: match[1].trim(),
      className: null,
      mode: 'inline',
    });
  }

  MARK_CLASS_RE.lastIndex = 0;
  while ((match = MARK_CLASS_RE.exec(content)) !== null) {
    results.push({
      text: match[2],
      color: null,
      className: match[1],
      mode: 'css-class',
    });
  }

  MARK_PLAIN_RE.lastIndex = 0;
  while ((match = MARK_PLAIN_RE.exec(content)) !== null) {
    const alreadyCaptured = results.some((r) => r.text === match![1]);
    if (!alreadyCaptured) {
      results.push({
        text: match[1],
        color: null,
        className: null,
        mode: 'inline',
      });
    }
  }

  return results;
}

// ── CSS class generation ─────────────────────────────────────────────────────

export function toClassName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function generateHighlighterCSS(colors: HighlighterColor[]): string {
  return colors
    .map((c) => {
      const cls = toClassName(c.name);
      return `.hltr-${cls} { background: ${c.color}; }`;
    })
    .join('\n');
}

// ── Color resolution ─────────────────────────────────────────────────────────

export function findColorByName(
  name: string,
  colors: HighlighterColor[]
): HighlighterColor | undefined {
  const lower = name.toLowerCase();
  return colors.find((c) => c.name.toLowerCase() === lower);
}

export function findColorByClassName(
  className: string,
  colors: HighlighterColor[]
): HighlighterColor | undefined {
  return colors.find((c) => toClassName(c.name) === className);
}
