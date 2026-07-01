export type SearchFilterId = 'title-only' | 'tags' | 'folder';

export interface SearchFilter {
  id: SearchFilterId;
  label: string;
}

export const SEARCH_FILTERS: SearchFilter[] = [
  { id: 'title-only', label: 'Title' },
  { id: 'tags', label: 'Tags' },
  { id: 'folder', label: 'Folder' },
];
