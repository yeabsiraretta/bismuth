/**
 * Application state type definitions
 * @module types/state
 */

import type { Note } from './note';
import type { Vault } from './vault';
import type { SearchState } from './search';

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
