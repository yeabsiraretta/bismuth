/**
 * CodeMirror extension for clickable media timestamp links.
 *
 * Decorates `[HH:MM:SS](source#t=HH:MM:SS)` patterns in notes,
 * making them clickable to seek the active media player.
 */

import { Decoration, EditorView, ViewPlugin, WidgetType } from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import type { Range } from '@codemirror/state';
import { parseTimestamp } from '../services/playerService';
import { seekTo, openMedia, activeSource } from '../stores/playerStore';
import { get } from 'svelte/store';
import { log } from '@/utils/logger';

/** Regex for timestamp links: [label](source#t=time) */
const TS_LINK_RE = /\[([^\]]+)\]\(([^)]+)#t=([^)]+)\)/g;

class TimestampWidget extends WidgetType {
  constructor(
    private display: string,
    private source: string,
    private timeStr: string
  ) {
    super();
  }

  eq(other: TimestampWidget): boolean {
    return (
      this.display === other.display &&
      this.source === other.source &&
      this.timeStr === other.timeStr
    );
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-ts-link';
    span.setAttribute('role', 'button');
    span.setAttribute('tabindex', '0');
    span.title = `Seek to ${this.display} in ${this.source.split('/').pop()}`;

    const icon = document.createElement('span');
    icon.className = 'cm-ts-icon';
    icon.textContent = '\u25B6';
    span.appendChild(icon);

    const time = document.createElement('span');
    time.className = 'cm-ts-time';
    time.textContent = this.display;
    span.appendChild(time);

    span.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const seconds = parseTimestamp(this.timeStr.split(',')[0]);
      const current = get(activeSource);
      if (!current || current.url !== this.source) {
        openMedia(this.source);
      }
      setTimeout(() => seekTo(seconds), 50);
      log.debug('TimestampLink: clicked', { source: this.source, time: seconds });
    });

    span.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') span.click();
    });

    return span;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

function buildDecorations(view: EditorView): DecorationSet {
  const decos: Range<Decoration>[] = [];
  const doc = view.state.doc;
  let inFrontmatter = false;
  let inCodeBlock = false;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const text = line.text;

    if (i === 1 && text === '---') {
      inFrontmatter = true;
      continue;
    }
    if (inFrontmatter) {
      if (text === '---') inFrontmatter = false;
      continue;
    }
    if (/^(`{3,}|~{3,})/.test(text)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    TS_LINK_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = TS_LINK_RE.exec(text)) !== null) {
      const from = line.from + m.index;
      const to = from + m[0].length;
      const display = m[1];
      const source = m[2];
      const timeStr = m[3];
      const widget = new TimestampWidget(display, source, timeStr);
      decos.push(Decoration.replace({ widget }).range(from, to));
    }
  }

  return Decoration.set(decos, true);
}

/** Creates the timestamp link extension. Click [MM:SS](file#t=) to seek. */
export function timestampLinkExtension() {
  const plugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildDecorations(view);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged || update.selectionSet) {
          this.decorations = buildDecorations(update.view);
        }
      }
    },
    { decorations: (v) => v.decorations }
  );

  const theme = EditorView.baseTheme({
    '.cm-ts-link': {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '3px',
      backgroundColor: 'var(--tag-background, rgba(137,180,250,0.15))',
      color: 'var(--interactive-accent, #89b4fa)',
      borderRadius: '4px',
      padding: '1px 6px',
      cursor: 'pointer',
      fontSize: '0.9em',
      verticalAlign: 'middle',
      transition: 'background-color 0.15s',
    },
    '.cm-ts-link:hover': {
      backgroundColor: 'var(--tag-background-hover, rgba(137,180,250,0.25))',
    },
    '.cm-ts-icon': {
      fontSize: '0.7em',
      opacity: '0.7',
    },
    '.cm-ts-time': {
      fontVariantNumeric: 'tabular-nums',
      fontWeight: '500',
    },
  });

  return [plugin, theme];
}
