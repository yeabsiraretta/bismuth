/**
 * Text processing for topic modeling — tokenization, stemming,
 * stopword removal, and document sampling.
 */

import type { SamplingConfig, CorpusDocument } from '../types';

// ─── Stopwords ────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'shall',
  'can',
  'not',
  'no',
  'nor',
  'so',
  'yet',
  'both',
  'each',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'than',
  'too',
  'very',
  'just',
  'about',
  'above',
  'after',
  'again',
  'all',
  'also',
  'am',
  'any',
  'as',
  'because',
  'before',
  'between',
  'during',
  'here',
  'how',
  'if',
  'into',
  'it',
  'its',
  'itself',
  'let',
  'like',
  'made',
  'make',
  'many',
  'me',
  'much',
  'my',
  'new',
  'now',
  'off',
  'only',
  'out',
  'own',
  'over',
  'said',
  'same',
  'she',
  'he',
  'her',
  'his',
  'that',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'those',
  'through',
  'under',
  'until',
  'up',
  'us',
  'use',
  'used',
  'using',
  'we',
  'what',
  'when',
  'where',
  'which',
  'while',
  'who',
  'whom',
  'why',
  'you',
  'your',
  'one',
  'two',
  'first',
  'also',
  'back',
  'get',
  'go',
  'see',
  'come',
  'take',
  'know',
  'way',
  'well',
  'even',
  'still',
  'think',
  'say',
]);

// ─── Porter Stemmer (simplified) ──────────────────────────────────────────────

/** Simplified Porter stemmer — strips common English suffixes. */
export function stem(word: string): string {
  if (word.length < 4) return word;
  let w = word;

  // Step 1: plurals and past tenses
  if (w.endsWith('sses')) w = w.slice(0, -2);
  else if (w.endsWith('ies')) w = w.slice(0, -2);
  else if (w.endsWith('ss')) {
    /* keep */
  } else if (w.endsWith('s') && w.length > 3) w = w.slice(0, -1);

  if (w.endsWith('eed')) {
    if (w.length > 4) w = w.slice(0, -1);
  } else if (w.endsWith('ed') && hasVowel(w.slice(0, -2))) w = w.slice(0, -2);
  else if (w.endsWith('ing') && hasVowel(w.slice(0, -3))) w = w.slice(0, -3);

  // Step 2: common suffixes
  const suffixes = [
    'ational',
    'tional',
    'alize',
    'ation',
    'ness',
    'ment',
    'ful',
    'ous',
    'ive',
    'able',
    'ible',
    'ity',
    'ist',
    'ism',
    'ly',
  ];
  for (const s of suffixes) {
    if (w.endsWith(s) && w.length - s.length >= 3) {
      w = w.slice(0, -s.length);
      break;
    }
  }

  return w;
}

function hasVowel(s: string): boolean {
  return /[aeiou]/i.test(s);
}

// ─── Tokenization ─────────────────────────────────────────────────────────────

/** Strip markdown formatting from text. */
export function stripMarkdown(text: string): string {
  let clean = text;
  // Frontmatter
  clean = clean.replace(/^---[\s\S]*?---\n?/m, '');
  // Code blocks
  clean = clean.replace(/```[\s\S]*?```/g, '');
  clean = clean.replace(/`[^`]+`/g, '');
  // Wikilinks → display text
  clean = clean.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, t, a) => a || t);
  // Markdown links
  clean = clean.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  // Images
  clean = clean.replace(/!\[.*?\]\(.*?\)/g, '');
  // Headings
  clean = clean.replace(/#{1,6}\s/g, '');
  // Bold/italic/strikethrough
  clean = clean.replace(/[*_~]+/g, '');
  // Blockquotes
  clean = clean.replace(/^>\s?/gm, '');
  // List markers
  clean = clean.replace(/^[\s]*[-*+]\s+/gm, '');
  clean = clean.replace(/^[\s]*\d+\.\s+/gm, '');
  // Tasks
  clean = clean.replace(/\[[ x]\]\s*/gi, '');
  // Tags
  clean = clean.replace(/#[\w/-]+/g, '');
  // Horizontal rules
  clean = clean.replace(/^[-*_]{3,}$/gm, '');

  return clean;
}

/** Tokenize text into lowercase words, removing stopwords. */
export function tokenize(text: string, useStemming: boolean = false): string[] {
  const stripped = stripMarkdown(text);
  const words = stripped
    .toLowerCase()
    .split(/[\s,;:!?()\[\]{}"'`\-–—/\\|.]+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w) && /[a-z]/.test(w));

  if (useStemming) return words.map(stem);
  return words;
}

// ─── Document sampling ────────────────────────────────────────────────────────

/** Sample a subset of words from a token list. */
export function sampleTokens(tokens: string[], config: SamplingConfig): string[] {
  if (tokens.length === 0) return [];

  let count: number;
  if (config.fixedWordCount > 0) {
    count = Math.min(config.fixedWordCount, tokens.length);
  } else if (config.percentageOfText > 0) {
    count = Math.min(Math.ceil((tokens.length * config.percentageOfText) / 100), tokens.length);
  } else {
    return tokens;
  }

  if (config.randomise) {
    // Random sample without replacement
    const indices = Array.from({ length: tokens.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices
      .slice(0, count)
      .sort((a, b) => a - b)
      .map((i) => tokens[i]);
  }

  return tokens.slice(0, count);
}

// ─── Corpus building ──────────────────────────────────────────────────────────

/** Extract tags from content. */
export function extractTags(content: string): string[] {
  const tags = new Set<string>();
  const regex = /#([\w/-]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    tags.add(match[1].toLowerCase());
  }
  return [...tags];
}

/** Extract URLs from markdown content. */
export function extractUrls(content: string): Array<{ url: string; displayText?: string }> {
  const urls: Array<{ url: string; displayText?: string }> = [];
  // Markdown links
  const mdRegex = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  let match;
  while ((match = mdRegex.exec(content)) !== null) {
    urls.push({ url: match[2], displayText: match[1] || undefined });
  }
  // Bare URLs
  const bareRegex = /(?<!\()(https?:\/\/[^\s)<>]+)/g;
  while ((match = bareRegex.exec(content)) !== null) {
    if (!urls.some((u) => u.url === match![1])) {
      urls.push({ url: match[1] });
    }
  }
  return urls;
}

/** Build a corpus document from a note. */
export function buildDocument(
  path: string,
  content: string,
  sampling: SamplingConfig
): CorpusDocument {
  const title = path.split('/').pop()?.replace('.md', '') || path;
  const tags = extractTags(content);
  const allTokens = tokenize(content, sampling.stemming);
  const tokens = sampleTokens(allTokens, sampling);

  return { path, title, content, tokens, tags };
}

/** Filter files by glob-style pattern (simplified: supports * and path matching). */
export function matchesPattern(path: string, pattern: string): boolean {
  if (!pattern) return true;
  const parts = pattern.split('*');
  if (parts.length === 1) return path.toLowerCase().includes(pattern.toLowerCase());
  let idx = 0;
  for (const part of parts) {
    if (!part) continue;
    const found = path.toLowerCase().indexOf(part.toLowerCase(), idx);
    if (found < 0) return false;
    idx = found + part.length;
  }
  return true;
}

/** Filter by tag pattern (space-separated tags, any match). */
export function matchesTags(docTags: string[], tagPattern: string): boolean {
  if (!tagPattern.trim()) return true;
  const patterns = tagPattern
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/^#/, '').toLowerCase());
  return patterns.some((p) => docTags.includes(p));
}
