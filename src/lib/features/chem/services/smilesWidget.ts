/**
 * CodeMirror WidgetType for rendering SMILES strings as chemical structures.
 *
 * Lazy-loads smiles-drawer on first use. If not installed, shows a
 * helpful fallback with the SMILES string as plain text.
 */

import { WidgetType } from '@codemirror/view';
import type { EditorView } from '@codemirror/view';
import type { SmilesEntry, ChemConfig } from '../types';
import { DEFAULT_CHEM_CONFIG } from '../types';
import { escapeHtml } from '@/utils/html';

// ─── Lazy-loaded renderer ──────────────────────────────────────────────────────

interface SmilesDrawerApi {
  parse(smiles: string, cb: (tree: unknown) => void, errCb: (err: unknown) => void): void;
  draw(tree: unknown, canvas: HTMLCanvasElement | SVGElement, theme?: string, isInDark?: boolean): void;
}

interface SmilesDrawerModule {
  SmiDrawer: new (options?: Record<string, unknown>) => SmilesDrawerApi;
  parse(smiles: string, cb: (tree: unknown) => void, errCb: (err: unknown) => void): void;
}

let drawerModule: SmilesDrawerModule | null = null;
let drawerLoadFailed = false;

async function loadSmilesDrawer(): Promise<SmilesDrawerModule | null> {
  if (drawerModule) return drawerModule;
  if (drawerLoadFailed) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('smiles-drawer') as any;
    drawerModule = mod.default ?? mod;
    return drawerModule;
  } catch {
    drawerLoadFailed = true;
    return null;
  }
}

// ─── Config accessor ───────────────────────────────────────────────────────────

let currentConfig: ChemConfig = { ...DEFAULT_CHEM_CONFIG };

export function setChemWidgetConfig(config: ChemConfig): void {
  currentConfig = config;
}

/** Resolve theme based on config and system preference. */
function resolveTheme(config: ChemConfig): string {
  if (config.theme === 'auto') {
    return document.body.classList.contains('theme-dark') ? 'dark' : 'light';
  }
  return config.theme;
}

// ─── Widget ────────────────────────────────────────────────────────────────────

export class SmilesBlockWidget extends WidgetType {
  constructor(
    private entries: SmilesEntry[],
  ) {
    super();
  }

  toDOM(_view: EditorView): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cm-smiles-block';
    wrap.style.cssText = 'padding: 8px; border-radius: 6px; background: var(--background-primary); border: 1px solid var(--border-color); margin: 4px 0; display: flex; flex-wrap: wrap; gap: 12px; justify-content: center;';

    for (const entry of this.entries) {
      const item = document.createElement('div');
      item.className = 'cm-smiles-item';
      item.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 4px;';

      const canvas = document.createElement('canvas');
      canvas.width = currentConfig.width;
      canvas.height = currentConfig.height;
      canvas.className = 'cm-smiles-canvas';
      canvas.style.cssText = `max-width: 100%; height: auto; border-radius: 4px;`;
      item.appendChild(canvas);

      if (currentConfig.showLabel) {
        const label = document.createElement('div');
        label.className = 'cm-smiles-label';
        label.style.cssText = 'font-size: 11px; color: var(--text-muted); font-family: var(--font-monospace); word-break: break-all; max-width: 200px; text-align: center;';
        label.textContent = entry.label || entry.smiles;
        item.appendChild(label);
      }

      wrap.appendChild(item);
      this.renderSmiles(entry.smiles, canvas, item);
    }

    return wrap;
  }

  private async renderSmiles(smiles: string, canvas: HTMLCanvasElement, container: HTMLElement): Promise<void> {
    const mod = await loadSmilesDrawer();

    if (!mod) {
      canvas.remove();
      const fallback = document.createElement('div');
      fallback.style.cssText = 'padding: 12px; text-align: center; color: var(--text-muted); font-size: 12px;';
      fallback.innerHTML = `
        <div style="margin-bottom: 6px;">🧪 SMILES Structure</div>
        <code style="font-size: 11px; padding: 4px 8px; background: var(--panel-bg-alt, #181825); border-radius: 4px;">${escapeHtml(smiles)}</code>
        <div style="margin-top: 8px; font-size: 11px; opacity: 0.7;">Install <code>smiles-drawer</code> to render: <code>pnpm add smiles-drawer</code></div>
      `;
      container.insertBefore(fallback, container.firstChild);
      return;
    }

    try {
      const theme = resolveTheme(currentConfig);
      const drawer = new mod.SmiDrawer({
        width: currentConfig.width,
        height: currentConfig.height,
        bondThickness: currentConfig.bondThickness,
        themes: {
          dark: {
            C: '#fff', O: '#e74c3c', N: '#3498db', S: '#f1c40f', P: '#e67e22',
            F: '#2ecc71', Cl: '#2ecc71', Br: '#e67e22', I: '#9b59b6',
            BACKGROUND: currentConfig.transparentExport ? 'transparent' : '#1a1a2e',
          },
          light: {
            C: '#222', O: '#e74c3c', N: '#3498db', S: '#f39c12', P: '#e67e22',
            F: '#27ae60', Cl: '#27ae60', Br: '#e67e22', I: '#8e44ad',
            BACKGROUND: currentConfig.transparentExport ? 'transparent' : '#ffffff',
          },
        },
      });

      mod.parse(smiles, (tree: unknown) => {
        drawer.draw(tree, canvas, theme, theme === 'dark');
      }, (err: unknown) => {
        this.showError(canvas, container, smiles, String(err));
      });
    } catch (e) {
      this.showError(canvas, container, smiles, e instanceof Error ? e.message : String(e));
    }
  }

  private showError(canvas: HTMLCanvasElement, container: HTMLElement, smiles: string, msg: string): void {
    canvas.remove();
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'padding: 8px; color: var(--text-error); font-size: 12px; text-align: center;';
    errorDiv.innerHTML = `
      <div><strong>Invalid SMILES:</strong> ${escapeHtml(msg)}</div>
      <code style="font-size: 11px; opacity: 0.7;">${escapeHtml(smiles)}</code>
    `;
    container.insertBefore(errorDiv, container.firstChild);
  }

  eq(other: SmilesBlockWidget): boolean {
    if (this.entries.length !== other.entries.length) return false;
    return this.entries.every((e, i) => e.smiles === other.entries[i].smiles && e.label === other.entries[i].label);
  }
}

export class SmilesInlineWidget extends WidgetType {
  constructor(private smiles: string) { super(); }

  toDOM(_view: EditorView): HTMLElement {
    const wrap = document.createElement('span');
    wrap.className = 'cm-smiles-inline';
    wrap.style.cssText = 'display: inline-block; vertical-align: middle;';

    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 80;
    canvas.style.cssText = 'max-height: 1.5em; width: auto; vertical-align: middle; border-radius: 3px;';
    wrap.appendChild(canvas);

    this.renderInline(canvas, wrap);
    return wrap;
  }

  private async renderInline(canvas: HTMLCanvasElement, wrap: HTMLElement): Promise<void> {
    const mod = await loadSmilesDrawer();
    if (!mod) {
      canvas.remove();
      const code = document.createElement('code');
      code.textContent = this.smiles;
      code.style.cssText = 'font-size: 0.85em; color: var(--text-muted);';
      wrap.appendChild(code);
      return;
    }

    try {
      const theme = resolveTheme(currentConfig);
      const drawer = new mod.SmiDrawer({ width: 120, height: 80, bondThickness: 0.6 });
      mod.parse(this.smiles, (tree: unknown) => {
        drawer.draw(tree, canvas, theme, theme === 'dark');
      }, () => {
        canvas.remove();
        const code = document.createElement('code');
        code.textContent = this.smiles;
        code.style.cssText = 'font-size: 0.85em; color: var(--text-error);';
        wrap.appendChild(code);
      });
    } catch {
      canvas.remove();
    }
  }

  eq(other: SmilesInlineWidget): boolean {
    return this.smiles === other.smiles;
  }
}
