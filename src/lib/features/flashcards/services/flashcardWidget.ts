/**
 * CodeMirror widget for rendering editable inline flashcards in live preview.
 *
 * When the cursor is away from the flashcard line, this replaces the raw
 * `Question :: Answer` text with a styled card widget that shows front/back
 * as distinct sections. Clicking the widget focuses the editor on that line.
 */

import { WidgetType, type EditorView } from '@codemirror/view';

export type FlashcardVariant = 'basic' | 'reversed';

export class FlashcardWidget extends WidgetType {
  constructor(
    private front: string,
    private back: string,
    private variant: FlashcardVariant,
    private lineFrom: number
  ) {
    super();
  }

  toDOM(view: EditorView): HTMLElement {
    const card = document.createElement('div');
    card.className = `cm-fc-card cm-fc-${this.variant}`;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Flashcard — click to edit');
    card.tabIndex = 0;

    // Badge
    const badge = document.createElement('span');
    badge.className = 'cm-fc-badge';
    badge.textContent = this.variant === 'reversed' ? 'Reversed' : 'Basic';
    card.appendChild(badge);

    // Front section
    const frontEl = document.createElement('div');
    frontEl.className = 'cm-fc-front';
    frontEl.textContent = this.front.trim();
    card.appendChild(frontEl);

    // Separator
    const sep = document.createElement('div');
    sep.className = 'cm-fc-sep';
    card.appendChild(sep);

    // Back section
    const backEl = document.createElement('div');
    backEl.className = 'cm-fc-back';
    backEl.textContent = this.back.trim();
    card.appendChild(backEl);

    // Click to focus editor on this line
    card.addEventListener('click', () => {
      view.dispatch({
        selection: { anchor: this.lineFrom },
        effects: [],
      });
      view.focus();
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        view.dispatch({ selection: { anchor: this.lineFrom } });
        view.focus();
      }
    });

    return card;
  }

  eq(other: FlashcardWidget): boolean {
    return this.front === other.front && this.back === other.back && this.variant === other.variant;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

export class ClozeWidget extends WidgetType {
  constructor(
    private text: string,
    private clozes: Array<{ original: string; answer: string }>,
    private lineFrom: number
  ) {
    super();
  }

  toDOM(view: EditorView): HTMLElement {
    const card = document.createElement('div');
    card.className = 'cm-fc-card cm-fc-cloze';
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Cloze flashcard — click to edit');
    card.tabIndex = 0;

    // Badge
    const badge = document.createElement('span');
    badge.className = 'cm-fc-badge cm-fc-badge-cloze';
    badge.textContent = `Cloze (${this.clozes.length})`;
    card.appendChild(badge);

    // Content with highlighted clozes
    const content = document.createElement('div');
    content.className = 'cm-fc-cloze-content';

    let processed = this.text;
    // Replace ==text== and {text} with highlighted spans
    processed = processed.replace(/==(.+?)==/g, '<mark class="cm-fc-cloze-mark">$1</mark>');
    processed = processed.replace(
      /(?<!\{)\{(?!\{)([^{}]+)\}(?!\})/g,
      '<mark class="cm-fc-cloze-mark">$1</mark>'
    );
    content.innerHTML = processed;
    card.appendChild(content);

    card.addEventListener('click', () => {
      view.dispatch({ selection: { anchor: this.lineFrom } });
      view.focus();
    });

    return card;
  }

  eq(other: ClozeWidget): boolean {
    return this.text === other.text;
  }

  ignoreEvent(): boolean {
    return false;
  }
}
