/**
 * RAG (Retrieval-Augmented Generation) types.
 * Graph-based AI chat for the vault.
 */

/** Search strategy for context retrieval. */
export type RagSearchMode = 'vector' | 'graph' | 'hybrid';

/** A single source citation from the retrieval step. */
export interface RagCitation {
  index: number;
  notePath: string;
  noteTitle: string;
  excerpt: string;
  score: number;
  source: 'vector' | 'graph';
}

/** A retrieved context chunk assembled from vault notes. */
export interface RagContext {
  citations: RagCitation[];
  contextText: string;
  tokenEstimate: number;
}

/** RAG chat message extending the base LLM message. */
export interface RagMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  citations?: RagCitation[];
}

/** Configuration for the RAG feature. */
export interface RagConfig {
  searchMode: RagSearchMode;
  topK: number;
  maxContextTokens: number;
  graphDepth: number;
  showCitations: boolean;
  excludeFolders: string[];
}

export const DEFAULT_RAG_CONFIG: RagConfig = {
  searchMode: 'hybrid',
  topK: 8,
  maxContextTokens: 4000,
  graphDepth: 2,
  showCitations: true,
  excludeFolders: [],
};
