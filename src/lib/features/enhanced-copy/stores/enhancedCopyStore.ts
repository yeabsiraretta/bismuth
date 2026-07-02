/**
 * Enhanced Copy store — persists config and exposes the copy action.
 */

import { writable, derived } from 'svelte/store';
import { log } from '@/utils/logger';
import type { EnhancedCopyConfig } from '../types';
import { DEFAULT_ENHANCED_COPY_CONFIG } from '../types';
import { enhancedCopyTransform } from '../services/enhancedCopyTransform';

const CONFIG_KEY = 'bismuth:enhanced-copy-config';

function loadConfig(): EnhancedCopyConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_ENHANCED_COPY_CONFIG, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_ENHANCED_COPY_CONFIG };
}

function saveConfig(cfg: EnhancedCopyConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    log.warn('enhancedCopyStore: failed to persist config');
  }
}

const configInternal = writable<EnhancedCopyConfig>(loadConfig());

/** Reactive enhanced-copy configuration. */
export const enhancedCopyConfig = derived(configInternal, ($c) => $c);

/** Update configuration and persist. */
export function updateEnhancedCopyConfig(patch: Partial<EnhancedCopyConfig>): void {
  configInternal.update((c) => {
    const next = { ...c, ...patch };
    saveConfig(next);
    return next;
  });
}

/** Reset config to defaults. */
export function resetEnhancedCopyConfig(): void {
  configInternal.set({ ...DEFAULT_ENHANCED_COPY_CONFIG });
  saveConfig(DEFAULT_ENHANCED_COPY_CONFIG);
}

/**
 * Get the selected text from the active editor (CodeMirror) or
 * the reading-mode preview (window selection).
 */
function getSelectedTextFromDom(): string {
  const sel = window.getSelection();
  return sel ? sel.toString() : '';
}

/**
 * Get selected text from a CodeMirror EditorView.
 */
function getSelectedTextFromEditor(view: unknown): string {
  try {
    const v = view as {
      state: {
        selection: { main: { from: number; to: number } };
        sliceDoc: (from: number, to: number) => string;
      };
    };
    const { from, to } = v.state.selection.main;
    if (from === to) return '';
    return v.state.sliceDoc(from, to);
  } catch {
    return '';
  }
}

/**
 * Find the active CodeMirror EditorView in the DOM.
 */
function findEditorView(): unknown | null {
  const editorEl = document.querySelector('.editor-container .cm-editor');
  if (!editorEl) return null;
  return (editorEl as unknown as { cmView?: { view: unknown } }).cmView?.view ?? null;
}

/**
 * Perform an enhanced copy: get selected text, transform it, write to clipboard.
 * Returns true if text was copied, false if nothing was selected.
 */
export async function enhancedCopy(sourceView?: 'reading' | 'editing'): Promise<boolean> {
  let config = DEFAULT_ENHANCED_COPY_CONFIG;
  configInternal.subscribe((c) => {
    config = c;
  })();

  // Determine which text to grab based on the source
  let selectedText = '';

  if (sourceView === 'editing' || (!sourceView && config.viewScope !== 'reading')) {
    const view = findEditorView();
    if (view) {
      selectedText = getSelectedTextFromEditor(view);
    }
  }

  // Fall back to DOM selection (reading mode or if editor had nothing)
  if (!selectedText) {
    selectedText = getSelectedTextFromDom();
  }

  if (!selectedText) return false;

  const transformed = enhancedCopyTransform(selectedText, config);

  try {
    if (config.copyAsHtml) {
      const { marked } = await import('marked');
      const html = marked.parse(transformed) as string;
      const blob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([transformed], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blob,
          'text/plain': textBlob,
        }),
      ]);
    } else {
      await navigator.clipboard.writeText(transformed);
    }
    log.info('enhancedCopy: copied', { length: transformed.length, html: config.copyAsHtml });
    return true;
  } catch (err) {
    log.error('enhancedCopy: clipboard write failed', err as Error);
    return false;
  }
}
