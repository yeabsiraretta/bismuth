/**
 * Search panel logic — extracted from SearchPanel for the 300-line limit.
 * Provides state management for vault-wide note search in the command palette.
 */
import { searchNotes } from '../../services/search';
import { log } from '@/utils/logger';

/** A single search result returned from the Tantivy backend. */
export interface SearchResult {
  path: string;
  title: string;
  snippet: string;
  score: number;
}

/** Reactive state for the search panel UI. */
export interface SearchPanelState {
  results: SearchResult[];
  selectedIndex: number;
  isLoading: boolean;
  searchMode: 'vault' | 'current';
}

/**
 * Executes a vault search and returns updated panel state with results.
 * @param query - User-entered search query.
 * @param state - Current panel state (used as base for immutable update).
 * @returns New state with search results and reset selection index.
 */
export async function performSearch(
  query: string,
  state: SearchPanelState
): Promise<SearchPanelState> {
  if (!query.trim()) {
    return { ...state, results: [], isLoading: false };
  }

  try {
    const searchResults = (await searchNotes(query, 50)) as SearchResult[];
    return { ...state, results: searchResults, selectedIndex: 0, isLoading: false };
  } catch (error) {
    log.error('Search failed', error);
    return { ...state, results: [], isLoading: false };
  }
}

/**
 * Computes the next selected index when the user presses arrow keys.
 * @param direction - Navigation direction.
 * @param selectedIndex - Current index.
 * @param totalResults - Total number of results available.
 * @returns Clamped index within [0, totalResults - 1].
 */
export function navigateResults(
  direction: 'up' | 'down',
  selectedIndex: number,
  totalResults: number
): number {
  if (direction === 'down') {
    return Math.min(selectedIndex + 1, totalResults - 1);
  }
  return Math.max(selectedIndex - 1, 0);
}

/** Scrolls the result at the given index into view within the results list. */
export function scrollToSelected(index: number) {
  const element = document.querySelector(`[data-index="${index}"]`);
  element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
