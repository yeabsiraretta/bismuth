/**
 * CodeMirror WidgetType for interactive cloze deletions.
 *
 * Renders a clickable blank that toggles between hidden/revealed state.
 * Supports hover-to-reveal, hints, and fixed-width blanks.
 */

import { WidgetType } from '@codemirror/view';
import type { EditorView } from '@codemirror/view';
import type { ClozeConfig } from '../types/cloze';
import { getClozeBlank } from './clozeService';
import { escapeHtml } from '@/utils/html';

export class InteractiveClozeWidget extends WidgetType {
  private revealed: boolean;

  constructor(
    private text: string,
    private hint: string | undefined,
    private config: ClozeConfig,
    private globalRevealed: boolean
  ) {
    super();
    this.revealed = globalRevealed || config.defaultRevealed;
  }

  toDOM(_view: EditorView): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-cloze-interactive';

    this.renderState(span);

    // Click to toggle individual cloze
    span.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.revealed = !this.revealed;
      this.renderState(span);
    });

    // Context menu for "More Hint" (reveal partial text)
    span.addEventListener('contextmenu', (e) => {
      if (!this.revealed) {
        e.preventDefault();
        this.revealed = true;
        this.renderState(span);
      }
    });

    // Listen for global toggle events
    const handleGlobalToggle = (evt: Event) => {
      const detail = (evt as CustomEvent).detail;
      this.revealed = detail.revealed;
      this.renderState(span);
    };
    window.addEventListener('cloze-toggle-all', handleGlobalToggle);

    // Cleanup listener when widget is removed
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.removedNodes) {
          if (node === span || (node instanceof Element && node.contains(span))) {
            window.removeEventListener('cloze-toggle-all', handleGlobalToggle);
            observer.disconnect();
            return;
          }
        }
      }
    });
    if (span.parentElement) {
      observer.observe(span.parentElement, { childList: true, subtree: true });
    }

    return span;
  }

  private renderState(span: HTMLElement): void {
    const { config, text, hint, revealed } = this;

    if (revealed) {
      span.className = 'cm-cloze-interactive cm-cloze-revealed';
      span.innerHTML = escapeHtml(text);
      span.title = 'Click to hide';
      span.style.cssText = '';
    } else {
      span.className = 'cm-cloze-interactive cm-cloze-hidden';
      const blank = getClozeBlank(text, hint, config.hint);
      span.textContent = blank;
      span.title = 'Click to reveal';

      if (config.fixedWidth) {
        span.style.cssText = `display: inline-block; width: ${config.fixedWidthPx}px; text-align: center;`;
      } else {
        span.style.cssText = '';
      }

      if (config.hoverReveal) {
        span.setAttribute('data-cloze-hover', escapeHtml(text));
      }
    }
  }

  eq(other: WidgetType): boolean {
    if (!(other instanceof InteractiveClozeWidget)) return false;
    return (
      this.text === other.text &&
      this.hint === other.hint &&
      this.globalRevealed === other.globalRevealed
    );
  }

  ignoreEvent(): boolean {
    return false;
  }
}
