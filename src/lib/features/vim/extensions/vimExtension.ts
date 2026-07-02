/**
 * CodeMirror vim extension — provides a compartment-based vim mode
 * that can be hot-toggled via settings. Loads .obsidian.vimrc on enable
 * and tracks vim mode changes for the status bar.
 */

import { type Extension, Compartment } from '@codemirror/state';
import { vim, Vim, getCM } from '@replit/codemirror-vim';
import { EditorView } from '@codemirror/view';
import { vimCurrentMode } from '../stores/vimStore';
import type { VimMode } from '../stores/vimStore';
import { loadVimrc, applyVimrcCommands } from '../services/vimrcLoader';
import { log } from '@/utils/logger';

export const vimCompartment = new Compartment();

/**
 * Build the vim extension array for initial editor state.
 * Returns empty array when vim mode is disabled.
 */
export function buildVimExtension(enabled: boolean): Extension {
  return vimCompartment.of(enabled ? createVimExtensions() : []);
}

/**
 * Create the vim extensions including mode-change tracking.
 */
function createVimExtensions(): Extension[] {
  return [
    vim(),
    EditorView.updateListener.of((update) => {
      if (!update.view) return;
      try {
        const cm = getCM(update.view);
        if (!cm) return;
        const state = cm.state;
        const modeName = getVimModeName(state);
        vimCurrentMode.set(modeName);
      } catch {
        // Silently ignore — vim state may not be ready
      }
    }),
  ];
}

/**
 * Reconfigure vim mode on/off at runtime.
 */
export function reconfigureVim(view: EditorView, enabled: boolean): void {
  try {
    view.dispatch({
      effects: vimCompartment.reconfigure(enabled ? createVimExtensions() : []),
    });
    if (!enabled) {
      vimCurrentMode.set('normal');
    }
    log.info('Vim mode reconfigured', { enabled });
  } catch (e) {
    log.error('Vim mode reconfigure failed', e as Error);
  }
}

/**
 * Load and apply vimrc file to the Vim instance.
 */
export async function loadAndApplyVimrc(vimrcPath: string): Promise<void> {
  try {
    const result = await loadVimrc(vimrcPath);
    if (!result || result.commands.length === 0) return;
    applyVimrcCommands(Vim, result.commands);
  } catch (e) {
    log.warn('Failed to load/apply vimrc', { path: vimrcPath, error: String(e) });
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getVimModeName(state: { mode?: string } | undefined): VimMode {
  if (!state || !state.mode) return 'normal';
  const mode = String(state.mode).toLowerCase();
  if (mode.includes('insert')) return 'insert';
  if (mode.includes('visual')) return 'visual';
  if (mode.includes('replace')) return 'replace';
  return 'normal';
}
