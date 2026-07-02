/**
 * Pure utility functions for the ListPane component.
 * Filtering, sorting, formatting — no Svelte store dependencies.
 */

import type { Note } from '@/types/data/vault';

/** Extract a display-friendly filename from a note path. */
export function getFileName(path: string): string {
  return path.split('/').pop()?.replace(/\.md$/, '') || path;
}

/** Get a short content preview from a note, skipping headings and frontmatter delimiters. */
export function getPreview(note: Note): string {
  if (!note.content) return '';
  const lines = note.content.split('\n').filter((l) => {
    const t = l.trim();
    return t && !t.startsWith('#') && !t.startsWith('---');
  });
  return lines.slice(0, 2).join(' ').slice(0, 120);
}

/** Format a date string as a human-friendly relative date. */
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Extract up to 3 frontmatter tags from a note. */
export function getNoteTags(note: Note): string[] {
  const tags: string[] = [];
  const fm = note.frontmatter?.['tags'];
  if (Array.isArray(fm)) tags.push(...fm.slice(0, 3));
  return tags;
}

/** Resolve which notes to display based on the active tab selection. */
export function getSourceNotes(
  tab: string,
  allNotes: Note[],
  folder: string | null,
  tag: string | null,
  tagNotes: Note[],
  prop: unknown,
  propNotes: Note[]
): Note[] {
  if (tab === 'tags' && tag) return tagNotes;
  if (tab === 'properties' && prop) return propNotes;
  if (folder) return allNotes.filter((n) => n.path.startsWith(folder + '/'));
  return [];
}

/** Apply a text filter and sort notes. */
export function applyFilter(src: Note[], query: string, sort: string, direction: string): Note[] {
  let result = src;
  if (query) {
    const lower = query.toLowerCase();
    result = result.filter((n) => {
      const name = n.path.split('/').pop() || '';
      return name.toLowerCase().includes(lower);
    });
  }
  result = [...result].sort((a, b) => {
    let cmp = 0;
    if (sort === 'name') {
      cmp = getFileName(a.path).localeCompare(getFileName(b.path));
    } else if (sort === 'modified') {
      cmp = (a.modified_at || '').localeCompare(b.modified_at || '');
    } else if (sort === 'created') {
      cmp = (a.created_at || '').localeCompare(b.created_at || '');
    }
    return direction === 'desc' ? -cmp : cmp;
  });
  return result;
}
