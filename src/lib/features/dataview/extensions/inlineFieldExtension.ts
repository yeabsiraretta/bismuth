/**
 * CodeMirror extension for decorating inline fields (Key:: Value).
 *
 * Highlights inline field keys and values with distinct styles,
 * and provides click-to-edit behavior for values.
 *
 * Supports:
 *   - `Key:: Value`      (full-line inline field)
 *   - `[Key:: Value]`    (bracket inline field)
 *   - `(Key:: Value)`    (paren inline field, hidden in preview)
 */

import { Decoration, ViewPlugin, EditorView, WidgetType } from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

/** Full-line inline field regex */
const FULL_LINE_RE = /^(?:\*{0,2})([a-zA-Z][\w-]*)(?:\*{0,2})\s*::\s*(.+)$/;

/** Bracket inline field regex */
const BRACKET_RE = /\[([a-zA-Z][\w-]*)\s*::\s*([^\]]*)\]/g;

/** Paren (hidden) inline field regex */
const PAREN_RE = /\(([a-zA-Z][\w-]*)\s*::\s*([^)]*)\)/g;

const keyMark = Decoration.mark({ class: 'cm-dv-inline-key' });
const valueMark = Decoration.mark({ class: 'cm-dv-inline-value' });

class InlineFieldHintWidget extends WidgetType {
  constructor(private key: string) {
    super();
  }
  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-dv-field-hint';
    span.title = `Inline field: ${this.key}`;
    span.textContent = '◆';
    return span;
  }
  eq(other: InlineFieldHintWidget) {
    return this.key === other.key;
  }
}

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

  // Track fenced code blocks to skip
  let inCodeBlock = false;
  let inFrontmatter = false;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const text = line.text;

    // Skip frontmatter
    if (i === 1 && text === '---') {
      inFrontmatter = true;
      continue;
    }
    if (inFrontmatter) {
      if (text === '---') inFrontmatter = false;
      continue;
    }

    // Skip code blocks
    if (/^(`{3,}|~{3,})/.test(text)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Full-line inline field
    const fullMatch = FULL_LINE_RE.exec(text);
    if (fullMatch) {
      const keyStart = line.from + text.indexOf(fullMatch[1]);
      const keyEnd = keyStart + fullMatch[1].length;
      const sepIdx = text.indexOf('::', fullMatch[1].length);
      const valueStart = line.from + sepIdx + 2;
      const valueEnd = line.to;

      builder.add(keyStart, keyEnd, keyMark);
      if (valueStart < valueEnd) {
        builder.add(valueStart, valueEnd, valueMark);
      }
      continue;
    }

    // Bracket fields: [Key:: Value]
    let m: RegExpExecArray | null;
    BRACKET_RE.lastIndex = 0;
    while ((m = BRACKET_RE.exec(text)) !== null) {
      const start = line.from + m.index;
      const keyStart = start + 1;
      const keyEnd = keyStart + m[1].length;
      const sepIdx = m[0].indexOf('::');
      const valueStart = start + sepIdx + 2;
      const valueEnd = start + m[0].length - 1;

      builder.add(keyStart, keyEnd, keyMark);
      if (valueStart < valueEnd) {
        builder.add(valueStart, valueEnd, valueMark);
      }
    }

    // Paren fields: (Key:: Value)
    PAREN_RE.lastIndex = 0;
    while ((m = PAREN_RE.exec(text)) !== null) {
      const start = line.from + m.index;
      builder.add(
        start,
        start,
        Decoration.widget({
          widget: new InlineFieldHintWidget(m[1]),
          side: -1,
        })
      );
    }
  }

  return builder.finish();
}

/**
 * Creates the inline field decoration extension.
 * Highlights `Key:: Value` syntax with distinct key/value styles.
 */
export function inlineFieldExtension() {
  const plugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildDecorations(update.view);
        }
      }
    },
    { decorations: (instance) => instance.decorations }
  );

  const theme = EditorView.baseTheme({
    '.cm-dv-inline-key': {
      color: 'var(--interactive-accent, #89b4fa)',
      fontWeight: '600',
    },
    '.cm-dv-inline-value': {
      color: 'var(--text-normal, #cdd6f4)',
      backgroundColor: 'var(--background-modifier-hover, rgba(255,255,255,0.04))',
      borderRadius: '2px',
      padding: '0 2px',
    },
    '.cm-dv-field-hint': {
      color: 'var(--text-faint, #6c7086)',
      fontSize: '0.7em',
      marginRight: '2px',
      verticalAlign: 'super',
    },
  });

  return [plugin, theme];
}
