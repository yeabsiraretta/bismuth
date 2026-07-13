/**
 * Omnisearch Engine — BM25-based full-text search using MiniSearch.
 *
 * Features:
 * - BM25 scoring algorithm
 * - Smart field weighting: title (10x) > headings (5x) > tags (3x) > content (1x)
 * - Fuzzy matching (typo resistance)
 * - Prefix matching for partial words
 * - Context snippets around matches
 */
import MiniSearch from 'minisearch';

import { buildSearchTerms, matchesPhrases, parseQuery, shouldExclude } from './omnisearch-query';

export interface SearchDocument {
  id: string;
  path: string;
  title: string;
  content: string;
  headings: string;
  tags: string;
  folder: string;
  extension: string;
}

export interface OmnisearchResult {
  path: string;
  title: string;
  score: number;
  matches: ResultMatch[];
  folder: string;
}

interface ResultMatch {
  field: string;
  snippet: string;
  positions: [number, number][];
}

const SNIPPET_RADIUS = 60;

function extractHeadings(content: string): string {
  return content
    .split('\n')
    .filter((l) => /^#{1,6}\s/.test(l))
    .map((l) => l.replace(/^#{1,6}\s+/, ''))
    .join(' ');
}

function extractTags(content: string): string {
  const tagRe = /(?:^|\s)#([\w/-]+)/g;
  const tags: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(content)) !== null) tags.push(m[1]);
  return tags.join(' ');
}

function buildSnippet(content: string, term: string): ResultMatch | null {
  const lower = content.toLowerCase();
  const termLower = term.toLowerCase();
  const idx = lower.indexOf(termLower);
  if (idx === -1) return null;

  const start = Math.max(0, idx - SNIPPET_RADIUS);
  const end = Math.min(content.length, idx + term.length + SNIPPET_RADIUS);
  const snippet =
    (start > 0 ? '…' : '') +
    content.slice(start, end).replace(/\n/g, ' ') +
    (end < content.length ? '…' : '');

  return {
    field: 'content',
    snippet,
    positions: [
      [idx - start + (start > 0 ? 1 : 0), idx - start + term.length + (start > 0 ? 1 : 0)],
    ],
  };
}

export class OmnisearchEngine {
  private index: MiniSearch<SearchDocument>;
  private docs = new Map<string, SearchDocument>();

  constructor() {
    this.index = new MiniSearch<SearchDocument>({
      fields: ['title', 'headings', 'tags', 'content'],
      storeFields: ['path', 'title', 'folder'],
      idField: 'id',
      searchOptions: {
        boost: { title: 10, headings: 5, tags: 3, content: 1 },
        fuzzy: 0.2,
        prefix: true,
      },
      tokenize: (text) =>
        text
          .toLowerCase()
          .split(/[\s/\-_.,:;!?()[\]{}<>'"]+/)
          .filter(Boolean),
    });
  }

  /** Index a single document. Re-indexes if already present. */
  addDocument(path: string, title: string, content: string): void {
    const id = path;
    const existing = this.docs.get(id);
    if (existing) {
      this.index.discard(id);
    }

    const doc: SearchDocument = {
      id,
      path,
      title,
      content,
      headings: extractHeadings(content),
      tags: extractTags(content),
      folder: path.includes('/') ? path.split('/').slice(0, -1).join('/') : '',
      extension: '.' + (path.split('.').pop() ?? 'md'),
    };

    this.docs.set(id, doc);
    this.index.add(doc);
  }

  /** Remove a document from the index. */
  removeDocument(path: string): void {
    if (this.docs.has(path)) {
      this.index.discard(path);
      this.docs.delete(path);
    }
  }

  /** Clear the entire index. */
  clear(): void {
    this.index.removeAll();
    this.docs.clear();
  }

  /** Number of indexed documents. */
  get size(): number {
    return this.docs.size;
  }

  /** Search with full query parsing support. */
  search(rawQuery: string, limit = 50): OmnisearchResult[] {
    if (!rawQuery.trim()) return [];

    const parsed = parseQuery(rawQuery);
    const searchTerms = buildSearchTerms(parsed);
    if (!searchTerms.trim() && parsed.phrases.length === 0) return [];

    // Use MiniSearch for initial scoring
    const miniResults = searchTerms.trim()
      ? this.index.search(searchTerms, {
          fuzzy: 0.2,
          prefix: true,
          combineWith: 'AND',
        })
      : // If only phrases (no terms), search all docs
        Array.from(this.docs.values()).map((d) => ({
          id: d.id,
          score: 1,
          match: {},
          terms: [],
          queryTerms: [],
        }));

    const results: OmnisearchResult[] = [];

    for (const mr of miniResults) {
      const doc = this.docs.get(mr.id as string);
      if (!doc) continue;

      // Apply exclusion and extension filters
      if (shouldExclude(parsed, doc)) continue;

      // Apply exact phrase matching
      const fullText = `${doc.title} ${doc.headings} ${doc.content}`;
      if (!matchesPhrases(fullText, parsed.phrases)) continue;

      // Build match context snippets
      const matches: ResultMatch[] = [];
      const queryWords = [...parsed.terms, ...parsed.phrases];
      for (const word of queryWords) {
        const snippet = buildSnippet(doc.content, word);
        if (snippet) matches.push(snippet);
      }

      // If no content match but title/heading match, add a title snippet
      if (matches.length === 0 && doc.title) {
        matches.push({ field: 'title', snippet: doc.title, positions: [] });
      }

      results.push({
        path: doc.path,
        title: doc.title,
        score: mr.score,
        matches,
        folder: doc.folder,
      });

      if (results.length >= limit) break;
    }

    return results;
  }

  /** Search within a single document's content. Returns line-level matches. */
  searchInFile(path: string, query: string): InFileMatch[] {
    const doc = this.docs.get(path);
    if (!doc || !query.trim()) return [];

    const lines = doc.content.split('\n');
    const queryLower = query.toLowerCase();
    const results: InFileMatch[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();
      let pos = 0;
      const positions: [number, number][] = [];

      while (pos < lineLower.length) {
        const idx = lineLower.indexOf(queryLower, pos);
        if (idx === -1) break;
        positions.push([idx, idx + query.length]);
        pos = idx + query.length;
      }

      if (positions.length > 0) {
        results.push({
          lineNumber: i + 1,
          lineContent: line,
          positions,
        });
      }
    }

    return results;
  }

  /** Get autocomplete suggestions for partial input. */
  suggest(prefix: string, limit = 8): string[] {
    if (prefix.length < 2) return [];
    return this.index
      .autoSuggest(prefix, { fuzzy: 0.2 })
      .slice(0, limit)
      .map((s) => s.suggestion);
  }
}

export interface InFileMatch {
  lineNumber: number;
  lineContent: string;
  positions: [number, number][];
}
