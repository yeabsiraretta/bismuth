/**
 * Core type definitions for Bismuth PKM Editor
 * @module types
 */

/**
 * Represents a note in the vault
 * @interface Note
 */
export interface Note {
  /** Absolute path to the note file */
  path: string;
  /** Note title (extracted from filename or frontmatter) */
  title: string;
  /** Raw markdown content */
  content: string;
  /** YAML frontmatter metadata */
  frontmatter: Record<string, unknown>;
  /** Creation timestamp */
  createdAt: Date;
  /** Last modification timestamp */
  modifiedAt: Date;
  /** List of tags from frontmatter or content */
  tags?: string[];
  /** List of wikilinks in the note */
  links?: Link[];
}

/**
 * Represents a wikilink between notes
 * @interface Link
 */
export interface Link {
  /** Source note path */
  sourcePath: string;
  /** Target note title or path */
  targetTitle: string;
  /** Resolved target path (if found) */
  targetPath?: string;
  /** Link alias (display text) */
  alias?: string;
  /** Whether the link target exists */
  isResolved: boolean;
  /** Link type (wikilink, embed, etc.) */
  type: 'wikilink' | 'embed' | 'block-ref';
}

/**
 * Represents a vault (collection of notes)
 * @interface Vault
 */
export interface Vault {
  /** Absolute path to vault root directory */
  rootPath: string;
  /** Vault name (directory name) */
  name: string;
  /** Path to vault settings file */
  settingsPath: string;
  /** Vault configuration */
  config: VaultConfig;
}

/**
 * Vault configuration settings
 * @interface VaultConfig
 */
export interface VaultConfig {
  /** Theme name */
  theme?: string;
  /** Enable Johnny.Decimal organization */
  useJohnnyDecimal?: boolean;
  /** Enable Zettelkasten features */
  useZettelkasten?: boolean;
  /** Default note template */
  defaultTemplate?: string;
  /** Folders to exclude from indexing */
  excludedFolders?: string[];
}

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
 * Tag with usage count
 * @interface Tag
 */
export interface Tag {
  /** Tag name (without #) */
  name: string;
  /** Number of notes using this tag */
  count: number;
  /** Parent tag (for hierarchical tags) */
  parent?: string;
  /** Child tags */
  children?: Tag[];
}

/**
 * Graph node representing a note
 * @interface GraphNode
 */
export interface GraphNode {
  /** Unique node ID (note path) */
  id: string;
  /** Display label (note title) */
  label: string;
  /** Node type */
  type: 'note' | 'tag' | 'folder';
  /** Number of connections */
  degree: number;
  /** Node metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Graph edge representing a link
 * @interface GraphEdge
 */
export interface GraphEdge {
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Edge type */
  type: 'link' | 'backlink' | 'tag';
  /** Edge weight/strength */
  weight: number;
}

/**
 * Complete graph data structure
 * @interface Graph
 */
export interface Graph {
  /** All nodes in the graph */
  nodes: GraphNode[];
  /** All edges in the graph */
  edges: GraphEdge[];
  /** Graph metadata */
  metadata?: {
    /** Total number of notes */
    noteCount: number;
    /** Total number of links */
    linkCount: number;
    /** Last updated timestamp */
    lastUpdated: Date;
  };
}

/**
 * Johnny.Decimal ID structure
 * @interface JohnnyDecimalId
 */
export interface JohnnyDecimalId {
  /** Area number (10-99) */
  area: number;
  /** Category number (00-99) */
  category: number;
  /** ID number (00-99) */
  id: number;
  /** Full ID string (e.g., "11.01") */
  fullId: string;
  /** Whether the ID is valid */
  isValid: boolean;
}

/**
 * Editor state
 * @interface EditorState
 */
export interface EditorState {
  /** Currently active note */
  activeNote?: Note;
  /** Editor content */
  content: string;
  /** Cursor position */
  cursorPosition: number;
  /** Selection range */
  selection?: { start: number; end: number };
  /** Whether content has unsaved changes */
  isDirty: boolean;
  /** Editor mode */
  mode: 'edit' | 'preview' | 'split';
}

/**
 * Application state
 * @interface AppState
 */
export interface AppState {
  /** Currently open vault */
  vault?: Vault;
  /** Editor state */
  editor: EditorState;
  /** UI state */
  ui: UIState;
  /** Search state */
  search: SearchState;
}

/**
 * UI state
 * @interface UIState
 */
export interface UIState {
  /** Whether sidebar is visible */
  sidebarVisible: boolean;
  /** Active sidebar panel */
  activeSidebarPanel: 'files' | 'search' | 'tags' | 'graph';
  /** Current theme */
  theme: 'light' | 'dark' | 'auto';
  /** Whether graph view is open */
  graphViewOpen: boolean;
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

/**
 * Tauri command result wrapper
 * @template T The type of the result data
 * @interface CommandResult
 */
export interface CommandResult<T> {
  /** Whether the command succeeded */
  success: boolean;
  /** Result data (if successful) */
  data?: T;
  /** Error message (if failed) */
  error?: string;
}

/**
 * File system event
 * @interface FileEvent
 */
export interface FileEvent {
  /** Event type */
  type: 'created' | 'modified' | 'deleted' | 'renamed';
  /** File path */
  path: string;
  /** Old path (for rename events) */
  oldPath?: string;
  /** Event timestamp */
  timestamp: Date;
}
