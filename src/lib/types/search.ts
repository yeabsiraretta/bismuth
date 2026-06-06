export interface SearchResult {
  path: string;
  title: string;
  snippet: string;
  score: number;
}

export interface SearchFilters {
  tags?: string[];
  portent_type?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  fuzzy?: boolean;
}

export interface FileSearchMatch {
  line: number;
  text: string;
  column?: number;
}
