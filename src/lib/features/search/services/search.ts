import { invoke } from '@tauri-apps/api/core';
import type { SearchResult, SearchFilters, FileSearchMatch } from '@/types/data/search';

export async function searchVault(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
  try {
    return await invoke<SearchResult[]>('search_vault', { query, filters });
  } catch (error) {
    throw new Error('Failed to search vault');
  }
}

export async function searchInFile(path: string, query: string): Promise<FileSearchMatch[]> {
  try {
    return await invoke<FileSearchMatch[]>('search_in_file', { path, query });
  } catch (error) {
    throw new Error('Failed to search in file');
  }
}

export async function searchNotes(
  query: string,
  limit: number = 50
): Promise<Array<{ path: string; title: string; score: number; snippet?: string }>> {
  try {
    return await invoke('search_notes', { query, limit });
  } catch (error) {
    throw new Error('Failed to search notes');
  }
}

/** Field-scoped search using Tantivy advanced_search (title:, tags:, folder: prefixes).
 * Falls back to searchNotes if backend is unavailable. */
export async function advancedSearch(
  query: string,
  limit: number = 50
): Promise<Array<{ path: string; title: string; score: number; snippet?: string }>> {
  try {
    return await invoke('advanced_search', { query, limit });
  } catch {
    return searchNotes(query, limit);
  }
}

/** Returns true when query contains a recognized field prefix. */
export function hasFieldPrefix(query: string): boolean {
  return /^(title|tags?|folder|path|heading):/.test(query.trim());
}
