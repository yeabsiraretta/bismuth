/**
 * Core type definitions for Bismuth PKM Editor
 * Re-exports from modular type files
 * @module types
 */

// Note-related types
export type { Note, Link, Tag, JohnnyDecimalId } from './note';

// Vault-related types
export type { Vault, VaultConfig, FileEvent } from './vault';
export { VaultTemplate } from './vault';

// Graph-related types
export type { GraphNode, GraphEdge, Graph } from './graph';

// Search-related types
export type { SearchResult, SearchHighlight, SearchState, SearchFilters } from './search';

// State-related types
export type { EditorState, UIState, AppState, CommandResult } from './state';
