import { type EditorState, StateField } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, WidgetType } from '@codemirror/view';

import { cursorLineNumbers, selectionCrossedLine } from '@/hubs/editor/services/cursor-utils';

const CALLOUT_START_RE = /^>\s*\[!(\w+)\]\s*(.*)?$/;
const CALLOUT_CONT_RE = /^>\s?(.*)$/;

type CalloutType =
  | 'note'
  | 'tip'
  | 'info'
  | 'warning'
  | 'danger'
  | 'bug'
  | 'example'
  | 'quote'
  | 'abstract'
  | 'todo'
  | 'success'
  | 'question'
  | 'failure';

const CALLOUT_ALIASES: Record<string, CalloutType> = {
  note: 'note',
  tip: 'tip',
  hint: 'tip',
  important: 'tip',
  info: 'info',
  warning: 'warning',
  caution: 'warning',
  attention: 'warning',
  danger: 'danger',
  error: 'danger',
  bug: 'bug',
  example: 'example',
  quote: 'quote',
  cite: 'quote',
  abstract: 'abstract',
  summary: 'abstract',
  tldr: 'abstract',
  todo: 'todo',
  success: 'success',
  check: 'success',
  done: 'success',
  question: 'question',
  help: 'question',
  faq: 'question',
  failure: 'failure',
  fail: 'failure',
  missing: 'failure',
};

const CALLOUT_ICONS: Record<CalloutType, string> = {
  note: 'ℹ️',
  tip: '💡',
  info: 'ℹ️',
  warning: '⚠️',
  danger: '🔴',
  bug: '🐛',
  example: '📋',
  quote: '❝',
  abstract: '📝',
  todo: '☑️',
  success: '✅',
  question: '❓',
  failure: '❌',
};

function resolveType(raw: string): CalloutType {
  return CALLOUT_ALIASES[raw.toLowerCase()] ?? 'note';
}

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

class CalloutWidget extends WidgetType {
  constructor(
    readonly calloutType: CalloutType,
    readonly title: string,
    readonly bodyLines: string[],
    readonly sourceFrom: number
  ) {
    super();
  }

  eq(other: CalloutWidget): boolean {
    return (
      this.calloutType === other.calloutType &&
      this.title === other.title &&
      this.sourceFrom === other.sourceFrom &&
      this.bodyLines.length === other.bodyLines.length &&
      this.bodyLines.every((l, i) => l === other.bodyLines[i])
    );
  }

  toDOM(view: EditorView): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = `cm-callout-widget cm-callout cm-callout-${this.calloutType}`;

    const header = document.createElement('div');
    header.className = 'cm-callout-widget-title';
    const icon = CALLOUT_ICONS[this.calloutType] ?? 'ℹ️';
    header.innerHTML = `<span class="cm-callout-widget-icon">${icon}</span> ${renderInlineMarkdown(this.title)}`;
    wrapper.appendChild(header);

    if (this.bodyLines.length > 0) {
      const body = document.createElement('div');
      body.className = 'cm-callout-widget-body';
      if (this.calloutType === 'quote') {
        body.classList.add('cm-callout-widget-body-quote');
      }
      body.innerHTML = this.bodyLines.map(renderInlineMarkdown).join('<br>');
      wrapper.appendChild(body);
    }

    const srcFrom = this.sourceFrom;
    wrapper.addEventListener('click', (e) => {
      if (e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        view.dispatch({ selection: { anchor: srcFrom } });
        view.focus();
      }
    });

    return wrapper;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

function buildDecorations(state: EditorState): DecorationSet {
  const activeLines = cursorLineNumbers(state);
  const doc = state.doc;
  const decorations: { from: number; to: number; decoration: Decoration }[] = [];

  let i = 1;
  while (i <= doc.lines) {
    const line = doc.line(i);
    const match = CALLOUT_START_RE.exec(line.text);
    if (!match) {
      i++;
      continue;
    }

    const calloutType = resolveType(match[1]);
    const startLine = i;
    const bodyLines: string[] = [];

    i++;
    while (i <= doc.lines) {
      const contLine = doc.line(i);
      const contMatch = CALLOUT_CONT_RE.exec(contLine.text);
      if (!contMatch) break;
      bodyLines.push(contMatch[1]);
      i++;
    }
    const endLineNum = i - 1;

    let cursorOnCallout = false;
    for (let ln = startLine; ln <= endLineNum; ln++) {
      if (activeLines.has(ln)) {
        cursorOnCallout = true;
        break;
      }
    }

    if (cursorOnCallout) {
      const cls = `cm-callout cm-callout-${calloutType}`;
      decorations.push({
        from: doc.line(startLine).from,
        to: doc.line(startLine).from,
        decoration: Decoration.line({ class: `${cls} cm-callout-title` }),
      });
      for (let ln = startLine + 1; ln <= endLineNum; ln++) {
        decorations.push({
          from: doc.line(ln).from,
          to: doc.line(ln).from,
          decoration: Decoration.line({ class: `${cls} cm-callout-body-line` }),
        });
      }
    } else {
      const title = match[2]?.trim() || calloutType.charAt(0).toUpperCase() + calloutType.slice(1);
      const from = doc.line(startLine).from;
      const to = doc.line(endLineNum).to;
      const widget = new CalloutWidget(calloutType, title, bodyLines, from);
      decorations.push({
        from,
        to,
        decoration: Decoration.replace({ widget, block: true }),
      });
    }
  }

  decorations.sort((a, b) => a.from - b.from || a.to - b.to);
  return Decoration.set(
    decorations.map((d) => d.decoration.range(d.from, d.to)),
    true
  );
}

const calloutField = StateField.define<DecorationSet>({
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

const calloutTheme = EditorView.baseTheme({
  '.cm-callout': {
    borderLeft: '3px solid var(--callout-color, var(--color-text-muted))',
    paddingLeft: '12px',
    background: 'var(--callout-bg, transparent)',
  },
  '.cm-callout-title': {
    fontWeight: '600',
  },
  '.cm-callout-note': {
    '--callout-color': 'var(--color-primary)',
    '--callout-bg': 'color-mix(in srgb, var(--color-primary) 8%, transparent)',
  },
  '.cm-callout-tip': {
    '--callout-color': 'var(--color-success)',
    '--callout-bg': 'color-mix(in srgb, var(--color-success) 8%, transparent)',
  },
  '.cm-callout-info': {
    '--callout-color': 'var(--color-info)',
    '--callout-bg': 'color-mix(in srgb, var(--color-info) 8%, transparent)',
  },
  '.cm-callout-warning': {
    '--callout-color': 'var(--color-warning)',
    '--callout-bg': 'color-mix(in srgb, var(--color-warning) 8%, transparent)',
  },
  '.cm-callout-danger, .cm-callout-failure': {
    '--callout-color': 'var(--color-error)',
    '--callout-bg': 'color-mix(in srgb, var(--color-error) 8%, transparent)',
  },
  '.cm-callout-bug': {
    '--callout-color': 'var(--color-error)',
    '--callout-bg': 'color-mix(in srgb, var(--color-error) 6%, transparent)',
  },
  '.cm-callout-example': {
    '--callout-color': '#a855f7',
    '--callout-bg': 'color-mix(in srgb, #a855f7 8%, transparent)',
  },
  '.cm-callout-quote, .cm-callout-abstract': {
    '--callout-color': 'var(--color-text-muted)',
    '--callout-bg': 'color-mix(in srgb, var(--color-text-muted) 6%, transparent)',
  },
  '.cm-callout-quote.cm-callout-body-line': {
    fontStyle: 'italic',
  },
  '.cm-callout-quote.cm-callout-title': {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: '0.9em',
    color: 'var(--color-text-muted)',
  },
  '.cm-callout-todo': {
    '--callout-color': 'var(--color-accent)',
    '--callout-bg': 'color-mix(in srgb, var(--color-accent) 8%, transparent)',
  },
  '.cm-callout-success': {
    '--callout-color': 'var(--color-success)',
    '--callout-bg': 'color-mix(in srgb, var(--color-success) 8%, transparent)',
  },
  '.cm-callout-question': {
    '--callout-color': 'var(--color-warning)',
    '--callout-bg': 'color-mix(in srgb, var(--color-warning) 6%, transparent)',
  },
  '.cm-callout-widget': {
    padding: '8px 12px',
    margin: '2px 0',
    borderRadius: '0 6px 6px 0',
    cursor: 'default',
  },
  '.cm-callout-widget-title': {
    fontWeight: '600',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  '.cm-callout-widget-icon': {
    fontSize: '1.1em',
    flexShrink: '0',
  },
  '.cm-callout-widget-body': {
    color: 'var(--color-text)',
    lineHeight: '1.6',
  },
  '.cm-callout-widget-body-quote': {
    fontStyle: 'italic',
  },
});

export function calloutExtension() {
  return [calloutField, calloutTheme];
}
