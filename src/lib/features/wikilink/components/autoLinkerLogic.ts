/**
 * AutoLinker logic — extracted from AutoLinker.svelte to respect 300-line limit.
 */
import { get } from 'svelte/store';
import { findUnlinkedReferences } from '../services/wikilink';
import type { LinkSuggestion, LinkMatch } from '../services/wikilink';
import { activeNote } from '@/stores/vault/vault';
import { writeNote } from '@/services/vault/vault';

export type { LinkSuggestion, LinkMatch };

export interface AutoLinkerState {
  suggestions: LinkSuggestion[];
  isLoading: boolean;
  caseSensitive: boolean;
  selectedSuggestions: Map<string, Set<number>>;
  expandedNotes: Set<string>;
}

export function createInitialState(): AutoLinkerState {
  return {
    suggestions: [],
    isLoading: false,
    caseSensitive: false,
    selectedSuggestions: new Map(),
    expandedNotes: new Set(),
  };
}

export async function scanForUnlinked(caseSensitive: boolean): Promise<{
  suggestions: LinkSuggestion[];
  expandedNotes: Set<string>;
}> {
  const note = get(activeNote);
  if (!note) return { suggestions: [], expandedNotes: new Set() };

  const suggestions = await findUnlinkedReferences(note.path, note.content, caseSensitive);
  const expandedNotes = new Set<string>();
  if (suggestions.length > 0) {
    expandedNotes.add(suggestions[0].note_title);
  }
  return { suggestions, expandedNotes };
}

export function toggleExpand(expandedNotes: Set<string>, title: string): Set<string> {
  const next = new Set(expandedNotes);
  if (next.has(title)) {
    next.delete(title);
  } else {
    next.add(title);
  }
  return next;
}

export function toggleMatch(
  selectedSuggestions: Map<string, Set<number>>,
  noteTitle: string,
  matchIndex: number
): Map<string, Set<number>> {
  const next = new Map(selectedSuggestions);
  if (!next.has(noteTitle)) {
    next.set(noteTitle, new Set());
  }
  const selected = next.get(noteTitle)!;
  if (selected.has(matchIndex)) {
    selected.delete(matchIndex);
  } else {
    selected.add(matchIndex);
  }
  return next;
}

export function selectAllForNote(
  selectedSuggestions: Map<string, Set<number>>,
  suggestions: LinkSuggestion[],
  noteTitle: string
): Map<string, Set<number>> {
  const suggestion = suggestions.find((s: LinkSuggestion) => s.note_title === noteTitle);
  if (!suggestion) return selectedSuggestions;
  const next = new Map(selectedSuggestions);
  const allIndices = new Set(suggestion.matches.map((_: LinkMatch, i: number) => i));
  next.set(noteTitle, allIndices);
  return next;
}

export function deselectAllForNote(
  selectedSuggestions: Map<string, Set<number>>,
  noteTitle: string
): Map<string, Set<number>> {
  const next = new Map(selectedSuggestions);
  next.delete(noteTitle);
  return next;
}

export function getSelectedCount(selectedSuggestions: Map<string, Set<number>>): number {
  let count = 0;
  for (const selected of selectedSuggestions.values()) {
    count += selected.size;
  }
  return count;
}

export async function applySelectedLinks(
  selectedSuggestions: Map<string, Set<number>>,
  suggestions: LinkSuggestion[]
): Promise<boolean> {
  const note = get(activeNote);
  if (!note) return false;

  const replacements: Array<{ start: number; end: number; replacement: string }> = [];

  for (const [noteTitle, indices] of selectedSuggestions.entries()) {
    const suggestion = suggestions.find((s: LinkSuggestion) => s.note_title === noteTitle);
    if (!suggestion) continue;

    for (const idx of indices) {
      const match = suggestion.matches[idx];
      replacements.push({
        start: match.start,
        end: match.end,
        replacement: `[[${noteTitle}]]`,
      });
    }
  }

  // Sort descending by start position to apply from end to beginning
  replacements.sort((a, b) => b.start - a.start);

  let newContent = note.content;
  for (const { start, end, replacement } of replacements) {
    newContent = newContent.slice(0, start) + replacement + newContent.slice(end);
  }

  await writeNote(note.path, newContent);
  return true;
}
