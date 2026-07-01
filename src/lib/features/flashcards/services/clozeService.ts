/**
 * Cloze service — find, wrap, unwrap, and generate hints for cloze deletions.
 *
 * Supports: ==highlighted==, **bold**, <u>underlined</u>, {curly}.
 * Generates hints based on first-letter count or percentage of content.
 */

import type { ClozeAutoConvert, ClozeHintConfig } from '../types/cloze';

// ─── Cloze span patterns ───────────────────────────────────────────────────────

export const CLOZE_HIGHLIGHT_RE = /==(.+?)==/g;
export const CLOZE_CURLY_RE = /(?<!\{)\{(?!\{)([^{}]+)\}(?!\})/g;
export const CLOZE_BOLD_RE = /\*\*([^*:]+)\*\*(?!:)/g;
export const CLOZE_UNDERLINE_RE = /<u>(.+?)<\/u>/g;
export const CLOZE_SPAN_RE = /<span\s+class="cloze-span"(?:\s+data-cloze-hint="([^"]*)")?\s*>(.+?)<\/span>/g;

/** A detected cloze region in the text. */
export interface ClozeMatch {
  from: number;
  to: number;
  text: string;
  hint?: string;
  source: 'highlight' | 'bold' | 'underline' | 'curly' | 'custom-span';
}

// ─── Detection ─────────────────────────────────────────────────────────────────

/** Find all cloze regions in a text string based on auto-convert settings. */
export function findClozes(text: string, autoConvert: ClozeAutoConvert): ClozeMatch[] {
  const matches: ClozeMatch[] = [];

  if (autoConvert.highlights) {
    const re = new RegExp(CLOZE_HIGHLIGHT_RE.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push({ from: m.index, to: m.index + m[0].length, text: m[1], source: 'highlight' });
    }
  }

  if (autoConvert.bold) {
    const re = new RegExp(CLOZE_BOLD_RE.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push({ from: m.index, to: m.index + m[0].length, text: m[1], source: 'bold' });
    }
  }

  if (autoConvert.underline) {
    const re = new RegExp(CLOZE_UNDERLINE_RE.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push({ from: m.index, to: m.index + m[0].length, text: m[1], source: 'underline' });
    }
  }

  if (autoConvert.curly) {
    const re = new RegExp(CLOZE_CURLY_RE.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push({ from: m.index, to: m.index + m[0].length, text: m[1], source: 'curly' });
    }
  }

  // Always detect custom <span class="cloze-span"> regardless of settings
  const spanRe = new RegExp(CLOZE_SPAN_RE.source, 'g');
  let sm: RegExpExecArray | null;
  while ((sm = spanRe.exec(text)) !== null) {
    matches.push({
      from: sm.index,
      to: sm.index + sm[0].length,
      text: sm[2],
      hint: sm[1] || undefined,
      source: 'custom-span',
    });
  }

  // Sort by position, deduplicate overlapping ranges
  matches.sort((a, b) => a.from - b.from);
  return deduplicateMatches(matches);
}

/** Remove overlapping matches (keep the first). */
function deduplicateMatches(matches: ClozeMatch[]): ClozeMatch[] {
  const result: ClozeMatch[] = [];
  let lastEnd = -1;
  for (const m of matches) {
    if (m.from >= lastEnd) {
      result.push(m);
      lastEnd = m.to;
    }
  }
  return result;
}

// ─── Wrapping / unwrapping ─────────────────────────────────────────────────────

/** Wrap selected text in a custom cloze span. */
export function wrapCloze(text: string, hint?: string): string {
  const hintAttr = hint ? ` data-cloze-hint="${hint}"` : '';
  return `<span class="cloze-span"${hintAttr}>${text}</span>`;
}

/** Remove all cloze spans from text, keeping inner content. */
export function unwrapClozes(text: string): string {
  return text.replace(CLOZE_SPAN_RE, '$2');
}

// ─── Hint generation ───────────────────────────────────────────────────────────

/** Generate a hint string for a cloze based on the config. */
export function generateHint(text: string, config: ClozeHintConfig): string {
  switch (config.mode) {
    case 'none':
      return '';
    case 'first-letters': {
      const count = Math.max(1, config.firstLetterCount);
      return text.slice(0, count) + '…';
    }
    case 'percentage': {
      const pct = Math.max(1, Math.min(100, config.percentage));
      const charCount = Math.max(1, Math.ceil((text.length * pct) / 100));
      return text.slice(0, charCount) + '…';
    }
    default:
      return '';
  }
}

/** Check if a note's frontmatter contains the required tag. */
export function noteHasTag(content: string, tag: string): boolean {
  if (!tag) return true;
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return false;
  const fm = fmMatch[1];
  // Check tags: [tag1, tag2] or tags:\n  - tag
  return fm.includes(tag);
}

/** Get the blank display text for a hidden cloze. */
export function getClozeBlank(
  text: string,
  hint: string | undefined,
  hintConfig: ClozeHintConfig,
): string {
  if (hint) return hint;
  const generated = generateHint(text, hintConfig);
  return generated || '[...]';
}
