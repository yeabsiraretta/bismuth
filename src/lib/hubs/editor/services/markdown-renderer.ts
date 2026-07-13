import { Marked } from 'marked';

import { isMermaidBlock } from '@/hubs/editor/services/mermaid-service';
import {
  computeProgressBar,
  parseProgressBarYaml,
} from '@/hubs/editor/services/progressbar-parser';
import { DEFAULT_RULES, prettifyText } from '@/hubs/editor/services/symbol-prettifier';
import { renderQueryResult, runDataviewQuery } from '@/hubs/knowledge/services/dataview-api';
import { sanitizeHtml } from '@/utils/sanitize';

const sortedRules = DEFAULT_RULES.filter((r) => r.enabled);
const CALLOUT_RE = /^\[!(\w+)\]\s*(.*)?$/;
const CHECKBOX_LI_RE = /<li>(<input [^>]*type="checkbox"[^>]*>)/g;
const CALLOUT_TYPE_ALIASES: Record<string, string> = {
  cite: 'quote',
  hint: 'tip',
  important: 'tip',
  caution: 'warning',
  attention: 'warning',
  error: 'danger',
  summary: 'abstract',
  tldr: 'abstract',
  check: 'success',
  done: 'success',
  help: 'question',
  faq: 'question',
  fail: 'failure',
  missing: 'failure',
};
const CALLOUT_ICONS: Record<string, string> = {
  note: '\u2139\ufe0f',
  tip: '\ud83d\udca1',
  info: '\u2139\ufe0f',
  warning: '\u26a0\ufe0f',
  danger: '\ud83d\udd34',
  bug: '\ud83d\udc1b',
  example: '\ud83d\udccb',
  quote: '\u275d',
  abstract: '\ud83d\udcdd',
  todo: '\u2611\ufe0f',
  success: '\u2705',
  question: '\u2753',
  failure: '\u274c',
};

const calloutExtension = {
  renderer: {
    blockquote(token: { text: string }): string | false {
      const text = typeof token === 'string' ? token : token.text;
      const lines = text.split('\n');
      const firstLine = lines[0]?.replace(/^<p>/, '').trim();
      const match = CALLOUT_RE.exec(firstLine ?? '');
      if (!match) return false;

      const rawType = match[1].toLowerCase();
      const type = CALLOUT_TYPE_ALIASES[rawType] ?? rawType;
      const defaultTitle = type.charAt(0).toUpperCase() + type.slice(1);
      const title = match[2]
        ? match[2]
            .replace(/<br\s*\/?>$/i, '')
            .replace(/<\/p>\s*$/i, '')
            .trim() || defaultTitle
        : defaultTitle;
      const body = lines
        .slice(1)
        .join('\n')
        .replace(/<\/p>\s*$/, '');

      if (type === 'quote') {
        return `<div class="callout callout-quote"><div class="callout-quote-mark">\u201C</div><div class="callout-quote-content"><blockquote class="callout-quote-text">${body}</blockquote><cite class="callout-quote-attribution">${title}</cite></div></div>`;
      }

      const icon = CALLOUT_ICONS[type] ?? '\u2139\ufe0f';
      return `<div class="callout callout-${type}"><div class="callout-title"><span class="callout-icon">${icon}</span> ${title}</div><div class="callout-body">${body}</div></div>`;
    },
  },
};

const codeBlockExtension = {
  renderer: {
    code(token: { text: string; lang?: string }): string {
      const lang = token.lang?.trim().toLowerCase() ?? '';
      const escaped = token.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      if (isMermaidBlock(lang)) {
        const encoded = encodeURIComponent(token.text);
        return `<div class="mermaid-placeholder" data-mermaid-code="${encoded}"><pre class="mermaid-source"><code>${escaped}</code></pre></div>`;
      }

      if (lang === 'progressbar') {
        try {
          const config = parseProgressBarYaml(token.text);
          const bar = computeProgressBar(config);
          return (
            `<div class="progress-bar-widget" style="width:${bar.width}">` +
            `<div class="progress-bar-label">${bar.label}</div>` +
            `<div class="progress-bar-track"><div class="progress-bar-fill" style="width:${bar.percentage}%"></div></div>` +
            `</div>`
          );
        } catch {
          return `<div class="progress-bar-error">Progress bar error: ${escaped}</div>`;
        }
      }

      if (lang === 'dataview') {
        try {
          const result = runDataviewQuery(token.text);
          return `<div class="dv-result">${renderQueryResult(result)}</div>`;
        } catch {
          return `<div class="dv-error">Dataview error: ${escaped}</div>`;
        }
      }

      const langClass = lang ? ` class="language-${lang}"` : '';
      return `<pre><code${langClass}>${escaped}</code></pre>`;
    },
  },
};

const textPrettifyExtension = {
  renderer: {
    text(token: { text: string }): string {
      return prettifyText(token.text, sortedRules);
    },
  },
};

function createParser(hardBreaks: boolean): Marked {
  const m = new Marked({ gfm: true, breaks: hardBreaks });
  m.use(calloutExtension);
  m.use(codeBlockExtension);
  m.use(textPrettifyExtension);
  return m;
}

const marked = createParser(true);
const markedSoft = createParser(false);

export function renderMarkdown(source: string, hardLineBreaks = true): string {
  const parser = hardLineBreaks ? marked : markedSoft;
  let raw = parser.parse(source);
  if (typeof raw !== 'string') return '';
  raw = renderWikilinks(raw);
  raw = renderCheckboxes(raw);
  return sanitizeHtml(raw);
}

function renderWikilinks(html: string): string {
  return html.replace(
    /(<pre[\s>][\s\S]*?<\/pre>)|(\[\[([^\]|]+)(?:\|([^\]]+))?\]\])/g,
    (_match, preBlock: string | undefined, _wl: string, target?: string, alias?: string) => {
      if (preBlock) return preBlock;
      const display = alias?.trim() || (target ?? '').trim();
      const escaped = (target ?? '').trim().replace(/"/g, '&quot;');
      return `<a class="wikilink" data-wikilink="${escaped}" href="#">${display}</a>`;
    }
  );
}

function renderCheckboxes(html: string): string {
  let idx = 0;
  return html.replace(CHECKBOX_LI_RE, (_match, input: string) => {
    const i = idx++;
    const enhanced = input.replace('>', ` data-checkbox-index="${i}">`);
    return `<li class="task-list-item">${enhanced}`;
  });
}
