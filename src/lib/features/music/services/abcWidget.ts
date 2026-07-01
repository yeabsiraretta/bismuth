/**
 * CodeMirror WidgetType for rendering ABC music notation via abcjs.
 *
 * Lazy-loads abcjs on first use so the library is only fetched when
 * an ```abc code block is actually present. If abcjs is not installed,
 * shows a helpful fallback message.
 */

import { WidgetType } from '@codemirror/view';
import type { EditorView } from '@codemirror/view';

interface AbcjsApi {
  renderAbc(target: HTMLElement | string, abc: string, options?: Record<string, unknown>): unknown[];
}

let abcjsModule: AbcjsApi | null = null;
let abcjsLoadFailed = false;

async function loadAbcjs(): Promise<AbcjsApi | null> {
  if (abcjsModule) return abcjsModule;
  if (abcjsLoadFailed) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('abcjs') as any;
    abcjsModule = mod.default ?? mod;
    return abcjsModule;
  } catch {
    abcjsLoadFailed = true;
    return null;
  }
}

export class AbcNotationWidget extends WidgetType {
  constructor(
    private notation: string,
    private options: Record<string, unknown>,
    private optionsError?: string,
  ) {
    super();
  }

  toDOM(_view: EditorView): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cm-abc-notation';
    wrap.style.cssText = 'padding: 8px; border-radius: 6px; background: var(--background-primary); border: 1px solid var(--border-color); margin: 4px 0;';

    // Options error banner
    if (this.optionsError) {
      const banner = document.createElement('div');
      banner.className = 'abc-error-banner';
      banner.style.cssText = 'background: color-mix(in srgb, var(--text-error) 12%, transparent); color: var(--text-error); padding: 6px 10px; border-radius: 4px; font-size: 12px; margin-bottom: 8px;';
      banner.textContent = `⚠ ${this.optionsError}`;
      wrap.appendChild(banner);
    }

    // Render container
    const renderDiv = document.createElement('div');
    renderDiv.className = 'abc-render';
    wrap.appendChild(renderDiv);

    // Title from X: and T: fields
    const titleMatch = this.notation.match(/^T:\s*(.+)$/m);
    if (titleMatch) {
      const titleEl = document.createElement('div');
      titleEl.className = 'abc-title';
      titleEl.style.cssText = 'font-size: 11px; color: var(--text-muted); margin-bottom: 4px; font-weight: 600;';
      titleEl.textContent = `♪ ${titleMatch[1].trim()}`;
      wrap.insertBefore(titleEl, renderDiv);
    }

    // Async render
    this.renderAbc(renderDiv);

    return wrap;
  }

  private async renderAbc(container: HTMLElement): Promise<void> {
    const abcjs = await loadAbcjs();

    if (!abcjs) {
      container.innerHTML = `
        <div style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 12px;">
          <div style="margin-bottom: 6px;">📝 ABC Notation</div>
          <pre style="text-align: left; font-size: 11px; padding: 8px; background: var(--panel-bg-alt, #181825); border-radius: 4px; overflow-x: auto; white-space: pre-wrap;">${escapeHtml(this.notation)}</pre>
          <div style="margin-top: 8px; font-size: 11px; opacity: 0.7;">Install <code>abcjs</code> to render: <code>pnpm add abcjs</code></div>
        </div>
      `;
      return;
    }

    try {
      const renderOptions: Record<string, unknown> = {
        responsive: 'resize',
        ...this.options,
      };

      abcjs.renderAbc(container, this.notation, renderOptions);

      // Style the rendered SVG
      const svg = container.querySelector('svg');
      if (svg) {
        svg.style.maxWidth = '100%';
        svg.style.height = 'auto';
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      container.innerHTML = `
        <div style="padding: 8px; color: var(--text-error); font-size: 12px;">
          <strong>ABC Render Error:</strong> ${escapeHtml(msg)}
        </div>
        <pre style="font-size: 11px; padding: 8px; background: var(--panel-bg-alt, #181825); border-radius: 4px; overflow-x: auto; white-space: pre-wrap;">${escapeHtml(this.notation)}</pre>
      `;
    }
  }

  eq(other: AbcNotationWidget): boolean {
    return this.notation === other.notation &&
      JSON.stringify(this.options) === JSON.stringify(other.options);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
