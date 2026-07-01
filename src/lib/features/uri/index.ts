/**
 * Advanced URI feature — public barrel export.
 *
 * Provides the `bismuth://` deep-link protocol for programmatic control
 * of Bismuth via URIs. Supports: open, edit, create, daily, command,
 * search, searchreplace, frontmatter, canvas, workspace, bookmark.
 */

// Types
export type { ParsedUri, UriAction, WriteMode, UriActionResult } from './types';

// Parser + builder
export { parseAdvancedUri, buildAdvancedUri } from './parser';

// Handlers
export { dispatchUri, applyWriteMode } from './handlers';

// Listener lifecycle
export { startUriListener, stopUriListener, triggerUri } from './listener';
