/**
 * Code block parameter parser and highlight resolver.
 *
 * Parses the opening fence line of a fenced code block to extract:
 * language, title, fold, line numbers, highlights, unwrap, ignore, reference.
 *
 * Resolves highlight specs (numbers, ranges, text, regex) into line sets.
 */

import type { CodeBlockParams, HighlightGroup, AltHighlight } from '../types/codeStyler';

// ─── Fence line parser ───────────────────────────────────────────────────────

const FENCE_RE = /^(`{3,}|~{3,})\s*(.*)?$/;
const PARAM_RE = /(\w+)(?:[=:](?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
const RMARKDOWN_RE = /^\{(\w+)\s*(.*)\}$/;

/** Parse the opening fence line into structured parameters. */
export function parseCodeBlockParams(fenceLine: string): CodeBlockParams {
  const result: CodeBlockParams = {
    language: '',
    title: '',
    fold: false,
    foldPlaceholder: '',
    lineNumbers: true,
    highlights: {},
    unwrap: null,
    ignore: false,
    reference: '',
  };

  const fenceMatch = FENCE_RE.exec(fenceLine.trim());
  if (!fenceMatch) return result;

  let paramStr = (fenceMatch[2] ?? '').trim();

  // RMarkdown: ```{r title, hl=5}
  const rmdMatch = RMARKDOWN_RE.exec(paramStr);
  if (rmdMatch) {
    result.language = rmdMatch[1];
    paramStr = rmdMatch[2];
  }

  let firstToken = true;
  let m: RegExpExecArray | null;
  PARAM_RE.lastIndex = 0;

  while ((m = PARAM_RE.exec(paramStr)) !== null) {
    const key = m[1];
    const val = m[2] ?? m[3] ?? m[4] ?? '';

    if (firstToken && !rmdMatch && !val && !paramStr.includes(':') && !paramStr.includes('=')) {
      // First bare word without = or : is the language
      if (!result.language) result.language = key;
      firstToken = false;
      continue;
    }
    if (firstToken && !rmdMatch) {
      // First token could be language if it's a bare word before any params
      if (
        !result.language &&
        !['title', 'fold', 'ln', 'hl', 'unwrap', 'wrap', 'ignore', 'ref', 'reference'].includes(
          key
        ) &&
        !val
      ) {
        result.language = key;
        firstToken = false;
        continue;
      }
    }
    firstToken = false;

    switch (key) {
      case 'title':
        result.title = val;
        break;
      case 'fold':
        result.fold = true;
        if (val && val !== 'true') result.foldPlaceholder = val;
        break;
      case 'ln':
        if (val === 'false') result.lineNumbers = false;
        else if (val === 'true' || !val) result.lineNumbers = true;
        else {
          const num = parseInt(val, 10);
          result.lineNumbers = isNaN(num) ? true : num;
        }
        break;
      case 'hl':
        result.highlights['hl'] = val;
        break;
      case 'unwrap':
        if (val === 'false') result.unwrap = false;
        else if (val === 'inactive') result.unwrap = 'inactive';
        else result.unwrap = true;
        break;
      case 'wrap':
        result.unwrap = false;
        break;
      case 'ignore':
        result.ignore = true;
        break;
      case 'ref':
      case 'reference':
        result.reference = val;
        break;
      default:
        // Unknown key — treat as alternative highlight
        if (val) result.highlights[key] = val;
        break;
    }
  }

  return result;
}

// ─── Highlight resolver ──────────────────────────────────────────────────────

/**
 * Parse a highlight spec string into a set of 0-based line indices.
 *
 * Supports:
 * - Single numbers: `1` → line 0
 * - Ranges: `1-3` → lines 0,1,2
 * - Text search: `foo` → lines containing 'foo'
 * - Quoted text: `'bar baz'` or `"bar baz"` → lines containing 'bar baz'
 * - Regex: `/pattern/` → lines matching pattern
 */
export function resolveHighlightSpec(spec: string, codeLines: string[]): Set<number> {
  const result = new Set<number>();
  if (!spec) return result;

  const parts = splitHighlightSpec(spec);

  for (const part of parts) {
    // Regex: /pattern/
    if (part.startsWith('/') && part.endsWith('/') && part.length > 2) {
      try {
        const re = new RegExp(part.slice(1, -1));
        codeLines.forEach((line, idx) => {
          if (re.test(line)) result.add(idx);
        });
      } catch {
        /* invalid regex, skip */
      }
      continue;
    }

    // Quoted text: 'text' or "text"
    if (
      (part.startsWith("'") && part.endsWith("'")) ||
      (part.startsWith('"') && part.endsWith('"'))
    ) {
      const search = part.slice(1, -1);
      codeLines.forEach((line, idx) => {
        if (line.includes(search)) result.add(idx);
      });
      continue;
    }

    // Range: 1-3
    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10) - 1;
      const end = parseInt(rangeMatch[2], 10) - 1;
      for (let i = Math.max(0, start); i <= Math.min(end, codeLines.length - 1); i++) {
        result.add(i);
      }
      continue;
    }

    // Single number
    const num = parseInt(part, 10);
    if (!isNaN(num)) {
      const idx = num - 1;
      if (idx >= 0 && idx < codeLines.length) result.add(idx);
      continue;
    }

    // Plain text search
    codeLines.forEach((line, idx) => {
      if (line.includes(part)) result.add(idx);
    });
  }

  return result;
}

/** Split highlight spec on commas, respecting quotes and regex delimiters. */
function splitHighlightSpec(spec: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuote: string | null = null;
  let inRegex = false;

  for (let i = 0; i < spec.length; i++) {
    const ch = spec[i];

    if (inRegex) {
      current += ch;
      if (ch === '/') {
        inRegex = false;
        parts.push(current);
        current = '';
      }
      continue;
    }

    if (inQuote) {
      current += ch;
      if (ch === inQuote) {
        inQuote = null;
        parts.push(current);
        current = '';
      }
      continue;
    }

    if (ch === ',' && !inQuote && !inRegex) {
      if (current.trim()) parts.push(current.trim());
      current = '';
      continue;
    }

    if ((ch === "'" || ch === '"') && !current) {
      inQuote = ch;
      current += ch;
      continue;
    }
    if (ch === '/' && !current) {
      inRegex = true;
      current += ch;
      continue;
    }

    current += ch;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

/**
 * Resolve all highlight groups from parsed params and code lines.
 * Returns an array of HighlightGroup with resolved line indices.
 */
export function resolveHighlightGroups(
  highlights: Record<string, string>,
  codeLines: string[],
  altHighlights: AltHighlight[],
  defaultColor: string,
  isDark: boolean
): HighlightGroup[] {
  const groups: HighlightGroup[] = [];

  for (const [name, spec] of Object.entries(highlights)) {
    const lines = resolveHighlightSpec(spec, codeLines);
    if (lines.size === 0) continue;

    let color = defaultColor;
    if (name !== 'hl') {
      const alt = altHighlights.find((a) => a.name === name);
      if (alt) color = isDark ? alt.darkColor : alt.lightColor;
    }

    groups.push({ name, lines, color });
  }

  return groups;
}

// ─── Language detection ──────────────────────────────────────────────────────

/** Check if a language is in the excluded list (supports * wildcard). */
export function isLanguageExcluded(lang: string, excluded: string[]): boolean {
  if (!lang) return false;
  const lower = lang.toLowerCase();
  return excluded.some((pattern) => {
    const p = pattern.toLowerCase().trim();
    if (p.includes('*')) {
      const re = new RegExp('^' + p.replace(/\*/g, '.*') + '$');
      return re.test(lower);
    }
    return p === lower;
  });
}
