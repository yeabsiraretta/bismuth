export { default as AutoLinker } from './components/AutoLinker.svelte';
export { findUnlinkedReferences } from './services/wikilink';
export type { LinkSuggestion, LinkMatch } from './services/wikilink';
export { subscribeConceptSuggestions } from './services/conceptEvents';
