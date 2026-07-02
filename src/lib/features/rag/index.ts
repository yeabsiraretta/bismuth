/**
 * RAG (Retrieval-Augmented Generation) — graph-based AI chat for the vault.
 * Combines vector similarity + knowledge graph traversal for deep contextual answers.
 * Public API barrel.
 */

// Types
export type { RagSearchMode, RagCitation, RagContext, RagMessage, RagConfig } from './types';
export { DEFAULT_RAG_CONFIG } from './types';

// Services
export { retrieveContext } from './services/ragRetriever';
export { buildRagSystemPrompt, buildRagMessages, formatCitationFooter } from './services/ragPrompt';

// Store
export {
  ragConfig,
  ragMessages,
  ragLoading,
  ragCitations,
  updateRagConfig,
  resetRagConfig,
  clearRagMessages,
  askRag,
} from './stores/ragStore';

// Components
export { default as RagPanel } from './components/RagPanel.svelte';
