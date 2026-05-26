import { invoke } from '@tauri-apps/api/core';
import type { SearchResult, SearchFilters } from '@/types/search';

export async function searchVault(
  query: string,
  filters?: SearchFilters
): Promise<SearchResult[]> {
  try {
    return await invoke<SearchResult[]>('search_vault', { query, filters });
  } catch (error) {
    throw new Error(`Failed to search vault: ${error}`);
  }
}

export async function searchInFile(path: string, query: string): Promise<any[]> {
  try {
    return await invoke<any[]>('search_in_file', { path, query });
  } catch (error) {
    throw new Error(`Failed to search in file: ${error}`);
  }
}
