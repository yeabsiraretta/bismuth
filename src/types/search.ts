/**
 * Search-related type definitions
 * @module types/search
 */

/**
 * Search result from full-text search
 * @interface SearchResult
 */
export interface SearchResult {
  /** Path to the note */
  path: string;
  /** Note title */
  title: string;
  /** Matching text snippet with context */
  snippet: string;
  /** Relevance score (0-1) */
  score: number;
  /** Highlighted matches */
  highlights?: SearchHighlight[];
}

/**
 * Highlighted text match in search results
 * @interface SearchHighlight
 */
export interface SearchHighlight {
  /** Start position in snippet */
  start: number;
  /** End position in snippet */
  end: number;
  /** Matched text */
  text: string;
}

/**
 * Search state
 * @interface SearchState
 */
export interface SearchState {
  /** Current search query */
  query: string;
  /** Search results */
  results: SearchResult[];
  /** Whether search is in progress */
  isSearching: boolean;
  /** Search filters */
  filters?: SearchFilters;
}

/**
 * Search filters
 * @interface SearchFilters
 */
export interface SearchFilters {
  /** Filter by tags */
  tags?: string[];
  /** Filter by folder */
  folder?: string;
  /** Filter by date range */
  dateRange?: { start: Date; end: Date };
  /** Case sensitive search */
  caseSensitive?: boolean;
  /** Use regex */
  useRegex?: boolean;
}
