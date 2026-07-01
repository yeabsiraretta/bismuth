import type { Note } from '@/types/data/vault';
import { advancedSearch, hasFieldPrefix } from '../services/search';
import { log } from '@/utils/logger';

const RECENT_KEY = 'bismuth-recent-searches';
const MAX_RECENT = 10;

export function loadRecent(): string[] {
  try {
    const saved = localStorage.getItem(RECENT_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    log.warn('Failed to load recent searches from localStorage', { error: String(e) });
    return [];
  }
}

export function saveRecent(searches: string[]): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(searches.slice(0, MAX_RECENT)));
  } catch (e) {
    log.warn('Failed to save recent searches to localStorage', { error: String(e) });
  }
}

export function addToRecent(term: string, recentSearches: string[]): string[] {
  if (!term.trim()) return recentSearches;
  const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, MAX_RECENT);
  saveRecent(updated);
  return updated;
}

export function performSearch(query: string, notes: Note[], activeFilters: string[]): Note[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const titleOnly = activeFilters.includes('title-only');
  return notes
    .filter((note) => {
      const titleMatch = note.title.toLowerCase().includes(q);
      if (titleOnly) return titleMatch;
      return titleMatch || (note.content?.toLowerCase().includes(q) ?? false);
    })
    .slice(0, 50);
}

/** Runs backend advanced search for field-prefixed queries; falls back to local for plain queries. */
export async function performAdvancedSearch(
  query: string,
  notes: Note[],
  activeFilters: string[]
): Promise<Note[]> {
  const q = query.trim();
  if (!q) return [];

  if (hasFieldPrefix(q) || activeFilters.includes('tag') || activeFilters.includes('folder')) {
    const fieldQuery = buildFieldQuery(q, activeFilters);
    try {
      const results = await advancedSearch(fieldQuery, 50);
      return results.map(
        (r) =>
          notes.find((n) => n.path === r.path) ??
          ({
            path: r.path,
            title: r.title,
            content: r.snippet ?? '',
            frontmatter: {},
          } as Note)
      );
    } catch (e) {
      log.warn('Advanced search failed, falling back to local', { error: String(e) });
    }
  }

  return performSearch(q, notes, activeFilters);
}

function buildFieldQuery(query: string, filters: string[]): string {
  if (hasFieldPrefix(query)) return query;
  const parts: string[] = [query];
  if (filters.includes('tag')) parts[0] = `tags:${query}`;
  else if (filters.includes('folder')) parts[0] = `folder:${query}`;
  else if (filters.includes('title-only')) parts[0] = `title:${query}`;
  return parts.join(' ');
}

export function getSnippet(content: string | undefined, q: string): string {
  if (!content) return '';
  const lower = content.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx === -1) return content.slice(0, 100);
  const start = Math.max(0, idx - 40);
  const end = Math.min(content.length, idx + q.length + 60);
  let snippet = content.slice(start, end).replace(/\n/g, ' ');
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet += '...';
  return snippet;
}
