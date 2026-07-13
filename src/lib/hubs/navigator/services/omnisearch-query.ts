/**
 * Query parser for Omnisearch.
 * Supports: "exact phrases", -exclusions, .ext file-type filters
 */

export interface ParsedQuery {
  /** Positive search terms (unquoted words) */
  terms: string[];
  /** Exact phrase matches (quoted strings) */
  phrases: string[];
  /** Terms to exclude (prefixed with -) */
  exclusions: string[];
  /** File extension filters (e.g. ".md", ".pdf") */
  extensions: string[];
  /** The raw query string */
  raw: string;
}

const PHRASE_RE = /"([^"]+)"/g;
const EXCLUSION_RE = /(?:^|\s)-(\S+)/g;

export function parseQuery(raw: string): ParsedQuery {
  const result: ParsedQuery = {
    terms: [],
    phrases: [],
    exclusions: [],
    extensions: [],
    raw,
  };

  if (!raw.trim()) return result;

  let working = raw;

  // Extract quoted phrases
  let match: RegExpExecArray | null;
  while ((match = PHRASE_RE.exec(raw)) !== null) {
    result.phrases.push(match[1]);
    working = working.replace(match[0], ' ');
  }

  // Extract exclusions (must run before extensions to avoid -word.md confusion)
  EXCLUSION_RE.lastIndex = 0;
  while ((match = EXCLUSION_RE.exec(raw)) !== null) {
    result.exclusions.push(match[1]);
    working = working.replace(match[0], ' ');
  }

  // Extract extension filters
  const KNOWN_EXTS = new Set([
    'md',
    'pdf',
    'png',
    'jpg',
    'jpeg',
    'gif',
    'svg',
    'webp',
    'txt',
    'csv',
    'json',
  ]);
  const extTokens = working.match(/\.([\w]+)\b/g) ?? [];
  for (const tok of extTokens) {
    const ext = tok.slice(1).toLowerCase();
    if (KNOWN_EXTS.has(ext)) {
      result.extensions.push(`.${ext}`);
      working = working.replace(tok, ' ');
    }
  }

  // Remaining words are positive terms
  result.terms = working
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !t.startsWith('-') && !t.startsWith('.'));

  return result;
}

/**
 * Build a MiniSearch-compatible query string from parsed query.
 * Returns the positive terms + phrases joined for searching.
 */
export function buildSearchTerms(parsed: ParsedQuery): string {
  const parts = [...parsed.terms, ...parsed.phrases];
  return parts.join(' ');
}

/**
 * Check if a document should be excluded based on parsed query.
 */
export function shouldExclude(
  parsed: ParsedQuery,
  doc: { path: string; title: string; content: string }
): boolean {
  // Extension filter
  if (parsed.extensions.length > 0) {
    const ext = '.' + (doc.path.split('.').pop() ?? '').toLowerCase();
    if (!parsed.extensions.includes(ext)) return true;
  }

  // Exclusion filter
  const lower = `${doc.title} ${doc.content}`.toLowerCase();
  for (const ex of parsed.exclusions) {
    if (lower.includes(ex.toLowerCase())) return true;
  }

  return false;
}

/**
 * Check if content matches all required phrases.
 */
export function matchesPhrases(content: string, phrases: string[]): boolean {
  if (phrases.length === 0) return true;
  const lower = content.toLowerCase();
  return phrases.every((p) => lower.includes(p.toLowerCase()));
}
