/**
 * Connections feature module.
 * Semantic similarity panel and link suggestions.
 */

// Components
export { default as ConnectionsView } from './components/ConnectionsView.svelte';
export { default as ConnectionItem } from './components/ConnectionItem.svelte';
export { default as LinkSuggestions } from './components/LinkSuggestions.svelte';

// Services
export {
  fetchSimilarNotes,
  lookupByText,
  togglePin,
  copyAsWikilinks,
  pickRandomConnection,
  buildDragData,
  extractTags,
  extractLinkedPaths,
  computeLinkSuggestions,
} from './services/connectionsLogic';
export type { Connection, ViewTab, FetchSimilarResult } from './services/connectionsLogic';
