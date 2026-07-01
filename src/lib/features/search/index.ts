export { default as SearchPanel } from './components/SearchPanel.svelte';
export { default as CommandPalette } from './components/command-palette/CommandPalette.svelte';
export { searchNotes, searchVault, searchInFile } from './services/search';
export type {
  SearchResult,
  SearchFilters,
  SearchQuery,
  FileSearchMatch,
} from '@/types/data/search';
