import { type EditorState, StateField } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, WidgetType } from '@codemirror/view';

import { cursorLineNumbers, selectionCrossedLine } from '@/hubs/editor/services/cursor-utils';

const INLINE_BASIC_RE = /^(.+?)\s*(::)\s*(.+)$/;
const INLINE_REVERSED_RE = /^(.+?)\s*(:::)\s*(.+)$/;
const MULTILINE_SEP_RE = /^(\?\?)$/;
const MULTILINE_SINGLE_RE = /^(\?)$/;
const CARD_TAG_RE = /#card(?:[-/]reverse(?:d)?|[-/]spaced)?/gi;
const CLOZE_BRACE_RE = /(?<!\{)\{(?!\{)([^{}]+)\}(?!\})/g;
const CLOZE_HIGHLIGHT_RE = /==(.+?)==/g;
const HAS_CLOZE_RE = /==.+?==|(?<!\{)\{(?!\{)[^{}]+\}(?!\})/;
const QA_Q_RE = /^(#{1,4}\s+Q:)\s*(.+)$/;
const QA_A_RE = /^(\*\*A:\*\*)\s*(.+)$/;

const sepMark = Decoration.mark({ class: 'cm-flashcard-sep' });
const cardTagMark = Decoration.mark({ class: 'cm-flashcard-tag' });
const clozeMark = Decoration.mark({ class: 'cm-flashcard-cloze' });
const qMark = Decoration.mark({ class: 'cm-flashcard-q' });
const aMark = Decoration.mark({ class: 'cm-flashcard-a' });

function renderInlineMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

class ClozeWidget extends WidgetType {
  constructor(
    readonly originalText: string,
    readonly sourceFrom: number
  ) {
    super();
  }

  eq(other: ClozeWidget): boolean {
    return this.originalText === other.originalText && this.sourceFrom === other.sourceFrom;
  }

  toDOM(view: EditorView): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-flashcard-widget';

    const card = document.createElement('div');
    card.className = 'cm-flashcard-card cm-flashcard-cloze-card';

    const baseHtml = renderInlineMarkdown(this.originalText);

    // Pre-render both views upfront to avoid innerHTML on click.
    // Toggle via style.display — CM6 MutationObserver does NOT watch
    // the style attribute (only class/name), so this is safe.
    const blankEl = document.createElement('div');
    blankEl.className = 'cm-flashcard-front';
    blankEl.innerHTML = baseHtml
      .replace(/==(.+?)==/g, '<span class="cm-cloze-blank">[___]</span>')
      .replace(/(?<!\{)\{(?!\{)([^{}]+)\}(?!\})/g, '<span class="cm-cloze-blank">[___]</span>');

    const answerEl = document.createElement('div');
    answerEl.className = 'cm-flashcard-front';
    answerEl.style.display = 'none';
    answerEl.innerHTML = baseHtml
      .replace(/==(.+?)==/g, '<span class="cm-cloze-answer">$1</span>')
      .replace(/(?<!\{)\{(?!\{)([^{}]+)\}(?!\})/g, '<span class="cm-cloze-answer">$1</span>');

    card.appendChild(blankEl);
    card.appendChild(answerEl);

    const srcFrom = this.sourceFrom;
    card.addEventListener('click', (e) => {
      if (e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        view.dispatch({ selection: { anchor: srcFrom } });
        view.focus();
        return;
      }
      // style.display is NOT observed by CM6 MutationObserver
      const showing = blankEl.style.display !== 'none';
      blankEl.style.display = showing ? 'none' : '';
      answerEl.style.display = showing ? '' : 'none';
    });

    const badge = document.createElement('span');
    badge.className = 'cm-flashcard-badge';
    badge.textContent = 'cloze';
    card.appendChild(badge);

    wrapper.appendChild(card);
    return wrapper;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

class FlashcardInlineWidget extends WidgetType {
  constructor(
    readonly front: string,
    readonly back: string,
    readonly sep: string,
    readonly sourceFrom: number
  ) {
    super();
  }

  eq(other: FlashcardInlineWidget): boolean {
    return (
      this.front === other.front && this.back === other.back && this.sourceFrom === other.sourceFrom
    );
  }

  toDOM(view: EditorView): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-flashcard-widget';

    const card = document.createElement('div');
    card.className = 'cm-flashcard-card';

    const frontEl = document.createElement('div');
    frontEl.className = 'cm-flashcard-front';
    frontEl.innerHTML = renderInlineMarkdown(this.front.trim());

    const sepEl = document.createElement('div');
    sepEl.className = 'cm-flashcard-divider';
    sepEl.textContent = this.sep;

    const backEl = document.createElement('div');
    backEl.className = 'cm-flashcard-back';
    backEl.innerHTML = renderInlineMarkdown(this.back.trim());

    sepEl.style.display = 'none';
    backEl.style.display = 'none';

    card.appendChild(frontEl);
    card.appendChild(sepEl);
    card.appendChild(backEl);

    const srcFrom = this.sourceFrom;
    card.addEventListener('click', (e) => {
      if (e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        view.dispatch({ selection: { anchor: srcFrom } });
        view.focus();
        return;
      }
      // style.display is NOT observed by CM6 MutationObserver
      const hidden = backEl.style.display === 'none';
      backEl.style.display = hidden ? '' : 'none';
      sepEl.style.display = hidden ? '' : 'none';
    });

    wrapper.appendChild(card);
    return wrapper;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

function buildDecorations(state: EditorState): DecorationSet {
  const activeLines = cursorLineNumbers(state);
  const doc = state.doc;
  const decorations: { from: number; to: number; deco: Decoration }[] = [];

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const text = line.text;

    const revMatch = INLINE_REVERSED_RE.exec(text);
    if (revMatch) {
      if (activeLines.has(i)) {
        const idx = text.indexOf(':::');
        decorations.push({ from: line.from + idx, to: line.from + idx + 3, deco: sepMark });
      } else {
        const widget = new FlashcardInlineWidget(revMatch[1], revMatch[3], ':::', line.from);
        decorations.push({
          from: line.from,
          to: line.to,
          deco: Decoration.replace({ widget, block: true }),
        });
      }
      continue;
    }

    const basicMatch = INLINE_BASIC_RE.exec(text);
    if (basicMatch) {
      if (activeLines.has(i)) {
        const idx = text.indexOf('::');
        decorations.push({ from: line.from + idx, to: line.from + idx + 2, deco: sepMark });
      } else {
        const widget = new FlashcardInlineWidget(basicMatch[1], basicMatch[3], '::', line.from);
        decorations.push({
          from: line.from,
          to: line.to,
          deco: Decoration.replace({ widget, block: true }),
        });
      }
      continue;
    }

    if (MULTILINE_SEP_RE.test(text.trim()) || MULTILINE_SINGLE_RE.test(text.trim())) {
      decorations.push({ from: line.from, to: line.to, deco: sepMark });
      continue;
    }

    CARD_TAG_RE.lastIndex = 0;
    let tagMatch: RegExpExecArray | null;
    while ((tagMatch = CARD_TAG_RE.exec(text)) !== null) {
      decorations.push({
        from: line.from + tagMatch.index,
        to: line.from + tagMatch.index + tagMatch[0].length,
        deco: cardTagMark,
      });
    }

    if (HAS_CLOZE_RE.test(text)) {
      if (activeLines.has(i)) {
        CLOZE_BRACE_RE.lastIndex = 0;
        let clozeMatch: RegExpExecArray | null;
        while ((clozeMatch = CLOZE_BRACE_RE.exec(text)) !== null) {
          decorations.push({
            from: line.from + clozeMatch.index,
            to: line.from + clozeMatch.index + clozeMatch[0].length,
            deco: clozeMark,
          });
        }
        CLOZE_HIGHLIGHT_RE.lastIndex = 0;
        let hlMatch: RegExpExecArray | null;
        while ((hlMatch = CLOZE_HIGHLIGHT_RE.exec(text)) !== null) {
          decorations.push({
            from: line.from + hlMatch.index,
            to: line.from + hlMatch.index + hlMatch[0].length,
            deco: clozeMark,
          });
        }
      } else {
        const widget = new ClozeWidget(text, line.from);
        decorations.push({
          from: line.from,
          to: line.to,
          deco: Decoration.replace({ widget, block: true }),
        });
      }
      continue;
    }

    const qMatch = QA_Q_RE.exec(text);
    if (qMatch) {
      decorations.push({ from: line.from, to: line.from + qMatch[1].length, deco: qMark });
      continue;
    }

    const aMatch = QA_A_RE.exec(text);
    if (aMatch) {
      decorations.push({ from: line.from, to: line.from + aMatch[1].length, deco: aMark });
    }
  }

  decorations.sort((a, b) => a.from - b.from || a.to - b.to);
  return Decoration.set(
    decorations.map((d) => d.deco.range(d.from, d.to)),
    true
  );
}

const flashcardField = StateField.define<DecorationSet>({
  create(state) {
    return buildDecorations(state);
  },
  update(value, tr) {
    if (tr.docChanged) return buildDecorations(tr.state);
    if (tr.selection && selectionCrossedLine(tr.startState, tr.state)) {
      return buildDecorations(tr.state);
    }
    return value;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const flashcardTheme = EditorView.baseTheme({
  '.cm-flashcard-sep': {
    color: 'var(--color-accent)',
    fontWeight: '700',
    background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
    borderRadius: '2px',
    padding: '0 2px',
  },
  '.cm-flashcard-tag': {
    color: 'var(--color-success)',
    fontWeight: '600',
    background: 'color-mix(in srgb, var(--color-success) 10%, transparent)',
    borderRadius: '3px',
    padding: '0 2px',
  },
  '.cm-flashcard-cloze': {
    background: 'color-mix(in srgb, var(--color-info) 15%, transparent)',
    borderRadius: '3px',
    padding: '0 2px',
    borderBottom: '2px dashed var(--color-info)',
  },
  '.cm-flashcard-q': {
    color: 'var(--color-primary)',
    fontWeight: '700',
  },
  '.cm-flashcard-a': {
    color: 'var(--color-success)',
    fontWeight: '700',
  },
  '.cm-flashcard-widget': {
    padding: '4px 0',
    display: 'flex',
    justifyContent: 'center',
  },
  '.cm-flashcard-card': {
    border: '1px solid color-mix(in srgb, var(--color-accent) 30%, var(--color-border))',
    borderRadius: '8px',
    background: 'var(--color-surface)',
    padding: '12px 16px',
    maxWidth: '480px',
    width: '100%',
    cursor: 'pointer',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontSize: '0.85rem',
    lineHeight: '1.5',
  },
  '.cm-flashcard-card:hover': {
    borderColor: 'var(--color-accent)',
    boxShadow: '0 2px 8px color-mix(in srgb, var(--color-accent) 15%, transparent)',
  },
  '.cm-flashcard-card.cm-flashcard-revealed': {
    borderColor: 'var(--color-accent)',
  },
  '.cm-flashcard-front': {
    fontWeight: '600',
    color: 'var(--color-text)',
  },
  '.cm-flashcard-divider': {
    height: '1px',
    background: 'var(--color-border)',
    margin: '8px 0',
    fontSize: '0',
    overflow: 'hidden',
    color: 'transparent',
  },
  '.cm-flashcard-back': {
    color: 'var(--color-text-muted)',
    fontStyle: 'italic',
  },
  '.cm-flashcard-cloze-card': {
    borderColor: 'color-mix(in srgb, var(--color-info) 30%, var(--color-border))',
    position: 'relative',
  },
  '.cm-flashcard-cloze-card:hover': {
    borderColor: 'var(--color-info)',
    boxShadow: '0 2px 8px color-mix(in srgb, var(--color-info) 15%, transparent)',
  },
  '.cm-flashcard-cloze-card.cm-flashcard-revealed': {
    borderColor: 'var(--color-info)',
  },
  '.cm-flashcard-badge': {
    position: 'absolute',
    top: '6px',
    right: '8px',
    fontSize: '0.6rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'var(--color-info)',
    background: 'color-mix(in srgb, var(--color-info) 10%, transparent)',
    padding: '1px 6px',
    borderRadius: '3px',
    fontWeight: '600',
  },
  '.cm-cloze-blank': {
    display: 'inline-block',
    minWidth: '40px',
    background: 'color-mix(in srgb, var(--color-info) 12%, transparent)',
    borderBottom: '2px dashed var(--color-info)',
    borderRadius: '2px',
    padding: '0 4px',
    color: 'var(--color-info)',
    fontWeight: '600',
    textAlign: 'center' as const,
    cursor: 'pointer',
  },
  '.cm-cloze-answer': {
    background: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
    borderBottom: '2px solid var(--color-success)',
    borderRadius: '2px',
    padding: '0 4px',
    color: 'var(--color-success)',
    fontWeight: '600',
  },
});

export function flashcardExtension() {
  return [flashcardField, flashcardTheme];
}
