/**
 * SearchPanel logic — search operations and recent searches management.
 * Extracted from SearchPanel.svelte for 300-line compliance.
 */

import type { Note } from '@/types/vault';

const RECENT_KEY = 'bismuth-recent-searches';
const MAX_RECENT = 10;

export function loadRecent(): string[] {
  try {
    const saved = localStorage.getItem(RECENT_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveRecent(searches: string[]): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(searches.slice(0, MAX_RECENT)));
  } catch {
    // Ignore
  }
}

export function addToRecent(term: string, recentSearches: string[]): string[] {
  if (!term.trim()) return recentSearches;
  const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, MAX_RECENT);
  saveRecent(updated);
  return updated;
}

export function performSearch(
  query: string,
  notes: Note[],
  activeFilters: string[]
): Note[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const titleOnly = activeFilters.includes('title-only');

  return notes.filter(note => {
    const titleMatch = note.title.toLowerCase().includes(q);
    if (titleOnly) return titleMatch;
    const contentMatch = note.content?.toLowerCase().includes(q) ?? false;
    return titleMatch || contentMatch;
  }).slice(0, 50);
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
  if (end < content.length) snippet = snippet + '...';
  return snippet;
}
