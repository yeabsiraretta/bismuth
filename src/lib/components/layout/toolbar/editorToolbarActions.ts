/**
 * EditorToolbar actions — action dispatch map and breadcrumb derivation.
 * Extracted from EditorToolbar.svelte for logic co-location.
 */

import { derived } from 'svelte/store';
import { activeEditorTabId, editorTabs } from '@/stores/editor/tabs';
import { currentVault } from '@/stores/vault/vault';

/** Builds a breadcrumb path array from a note path string. */
export function buildBreadcrumbs(notePath: string): string[] {
  return notePath ? notePath.split('/').filter(Boolean) : [];
}

/** Derived store: breadcrumbs from the active tab's path. Falls back to vault name when no tabs open. */
export const activeBreadcrumbs = derived(
  [activeEditorTabId, editorTabs, currentVault],
  ([$activeId, $tabs, $vault]) => {
    if ($activeId) {
      const tab = $tabs.find((t) => t.id === $activeId);
      if (tab) return buildBreadcrumbs(tab.path);
    }
    return $vault ? [$vault.name] : [];
  }
);

/** Resolves a breadcrumb click into a navigable path. */
export function resolveBreadcrumbPath(breadcrumbs: string[], index: number): string {
  return breadcrumbs.slice(0, index + 1).join('/');
}

/** Format action identifiers for the toolbar dropdown. */
export type FormatAction =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'superscript'
  | 'subscript'
  | 'code'
  | 'code-block'
  | 'heading'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'link'
  | 'image'
  | 'quote'
  | 'callout'
  | 'list'
  | 'numbered-list'
  | 'task-list'
  | 'checklist'
  | 'highlight'
  | 'horizontal-rule'
  | 'hr'
  | 'indent'
  | 'outdent'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'align-justify'
  | 'font-color'
  | 'table';

/** View mode options for the editor. */
export type EditorViewMode = 'edit' | 'preview' | 'split';
