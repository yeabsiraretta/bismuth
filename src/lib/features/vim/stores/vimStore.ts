/**
 * Vim mode reactive store — tracks current vim mode (normal/insert/visual/replace)
 * for status bar display and styling.
 */

import { writable, derived } from 'svelte/store';

export type VimMode = 'normal' | 'insert' | 'visual' | 'replace';

export const vimCurrentMode = writable<VimMode>('normal');

export const vimModeLabel = derived(vimCurrentMode, ($mode) => {
  switch ($mode) {
    case 'normal':
      return 'NORMAL';
    case 'insert':
      return 'INSERT';
    case 'visual':
      return 'VISUAL';
    case 'replace':
      return 'REPLACE';
    default:
      return 'NORMAL';
  }
});
