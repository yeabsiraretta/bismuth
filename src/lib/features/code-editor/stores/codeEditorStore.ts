/**
 * Code Editor store — manages code file state, config, and code block editing.
 */

import { writable, derived, get } from 'svelte/store';
import type { CodeEditorConfig } from '../types';
import { DEFAULT_CODE_EDITOR_CONFIG } from '../types';
import {
  loadCodeEditorConfig,
  saveCodeEditorConfig,
  isCodeFile,
} from '../services/languageDetector';
import { log } from '@/utils/logger';

/** Current code editor configuration. */
export const codeEditorConfig = writable<CodeEditorConfig>(loadCodeEditorConfig());

/** Whether the code block edit modal is open. */
export const codeBlockModalOpen = writable(false);

/** Current code block being edited (code + language + callback). */
export const activeCodeBlock = writable<{
  code: string;
  language: string;
  onSave: (newCode: string) => void;
} | null>(null);

/** Derived: list of supported file extensions. */
export const supportedExtensions = derived(codeEditorConfig, ($cfg) => $cfg.extensions);

/** Update and persist code editor config. */
export function updateCodeEditorConfig(partial: Partial<CodeEditorConfig>): void {
  codeEditorConfig.update((cfg) => {
    const updated = { ...cfg, ...partial };
    saveCodeEditorConfig(updated);
    log.debug('Code editor config updated', { keys: Object.keys(partial) });
    return updated;
  });
}

/** Reset config to defaults. */
export function resetCodeEditorConfig(): void {
  const defaults = { ...DEFAULT_CODE_EDITOR_CONFIG };
  codeEditorConfig.set(defaults);
  saveCodeEditorConfig(defaults);
  log.info('Code editor config reset to defaults');
}

/** Add a file extension to the supported list. */
export function addExtension(ext: string): void {
  const clean = ext.replace(/^\./, '').toLowerCase();
  if (!clean) return;
  codeEditorConfig.update((cfg) => {
    if (cfg.extensions.includes(clean)) return cfg;
    const updated = { ...cfg, extensions: [...cfg.extensions, clean] };
    saveCodeEditorConfig(updated);
    return updated;
  });
}

/** Remove a file extension from the supported list. */
export function removeExtension(ext: string): void {
  const clean = ext.replace(/^\./, '').toLowerCase();
  codeEditorConfig.update((cfg) => {
    const updated = { ...cfg, extensions: cfg.extensions.filter((e) => e !== clean) };
    saveCodeEditorConfig(updated);
    return updated;
  });
}

/** Open a code block for editing in the modal. */
export function editCodeBlock(
  code: string,
  language: string,
  onSave: (newCode: string) => void
): void {
  activeCodeBlock.set({ code, language, onSave });
  codeBlockModalOpen.set(true);
  log.debug('Code block edit opened', { language, lines: code.split('\n').length });
}

/** Close the code block editor modal. */
export function closeCodeBlockModal(): void {
  codeBlockModalOpen.set(false);
  activeCodeBlock.set(null);
}

/** Save and close the code block editor. */
export function saveCodeBlock(newCode: string): void {
  const block = get(activeCodeBlock);
  if (block) {
    block.onSave(newCode);
    log.debug('Code block saved', { language: block.language });
  }
  closeCodeBlockModal();
}

/** Check if a path should open in the code editor. */
export function shouldUseCodeEditor(path: string): boolean {
  const cfg = get(codeEditorConfig);
  return isCodeFile(path, cfg);
}
