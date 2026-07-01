/**
 * Wikilink service — IPC wrappers for wikilink operations.
 */
import { invoke } from '@tauri-apps/api/core';

/** A match location within a note's content */
export interface LinkMatch {
  text: string;
  start: number;
  end: number;
  context: string;
}

/** A suggestion for an unlinked reference to another note */
export interface LinkSuggestion {
  note_title: string;
  note_path: string;
  matches: LinkMatch[];
}

/**
 * Find unlinked references in a note — scans for substrings that match
 * other note titles but aren't already wrapped in [[wikilinks]].
 */
export async function findUnlinkedReferences(
  notePath: string,
  content: string,
  caseSensitive = false
): Promise<LinkSuggestion[]> {
  return invoke<LinkSuggestion[]>('find_unlinked_references', {
    notePath,
    content,
    caseSensitive,
  });
}
