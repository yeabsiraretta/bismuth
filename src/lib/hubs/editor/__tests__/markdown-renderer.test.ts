import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (p: string) => p }));
vi.mock('@/hubs/core/stores/vault-store.svelte', () => ({
  getNotes: () => [],
  getVault: () => null,
  setVault: vi.fn(),
  setNotes: vi.fn(),
  setActiveNote: vi.fn(),
  initVaultStore: vi.fn(),
  rescanVault: vi.fn(),
  isStoreInitialized: () => true,
}));
vi.mock('@/hubs/editor/services/file-ops', () => ({
  getCachedContent: () => undefined,
  updateCachedContent: vi.fn(),
  clearFileCache: vi.fn(),
  hydrateVaultContent: vi.fn(),
  isContentHydrated: () => false,
}));
vi.mock('@/utils/log/logger', () => ({
  log: { child: () => ({ info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() }) },
}));

import { renderMarkdown } from '@/hubs/editor/services/markdown-renderer';

describe('markdown-renderer', () => {
  describe('basic rendering', () => {
    it('renders headings', () => {
      const html = renderMarkdown('# Hello');
      expect(html).toContain('<h1>Hello</h1>');
    });

    it('renders bold and italic', () => {
      const html = renderMarkdown('**bold** and *italic*');
      expect(html).toContain('<strong>bold</strong>');
      expect(html).toContain('<em>italic</em>');
    });

    it('renders unordered lists', () => {
      const html = renderMarkdown('- item 1\n- item 2');
      expect(html).toContain('<li>item 1</li>');
      expect(html).toContain('<li>item 2</li>');
    });

    it('renders ordered lists', () => {
      const html = renderMarkdown('1. first\n2. second');
      expect(html).toContain('<li>first</li>');
    });

    it('renders links', () => {
      const html = renderMarkdown('[click](https://example.com)');
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('click');
    });

    it('renders horizontal rules', () => {
      const html = renderMarkdown('---');
      expect(html).toContain('<hr');
    });

    it('renders blockquotes', () => {
      const html = renderMarkdown('> a quote');
      expect(html).toContain('<blockquote>');
    });

    it('renders inline code', () => {
      const html = renderMarkdown('use `foo()` here');
      expect(html).toContain('<code>foo()</code>');
    });

    it('renders strikethrough', () => {
      const html = renderMarkdown('~~deleted~~');
      expect(html).toContain('<del>deleted</del>');
    });

    it('renders tables', () => {
      const html = renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |');
      expect(html).toContain('<table>');
      expect(html).toContain('<td>1</td>');
    });

    it('renders multi-row tables with headers', () => {
      const md = [
        '| Range | Area      | Purpose                               |',
        '| ----- | --------- | ------------------------------------- |',
        '| 10-19 | Personal  | Core note-taking, journal, knowledge  |',
        '| 20-29 | Projects  | Project management, development notes |',
        '| 30-39 | Reference | Templates, examples, documentation    |',
      ].join('\n');
      const html = renderMarkdown(md);
      expect(html).toContain('<table>');
      expect(html).toContain('<th>Range</th>');
      expect(html).toContain('<th>Area</th>');
      expect(html).toContain('<th>Purpose</th>');
      expect(html).toContain('<td>Personal</td>');
      expect(html).toContain('<td>Project management, development notes</td>');
      expect(html).toContain('</thead>');
      expect(html).toContain('</tbody>');
    });
  });

  describe('wikilinks', () => {
    it('renders [[wikilink]] as anchor with data attribute', () => {
      const html = renderMarkdown('see [[My Note]]');
      expect(html).toContain('data-wikilink="My Note"');
      expect(html).toContain('class="wikilink"');
      expect(html).toContain('>My Note</a>');
    });

    it('renders [[target|alias]] with alias text', () => {
      const html = renderMarkdown('see [[My Note|click here]]');
      expect(html).toContain('data-wikilink="My Note"');
      expect(html).toContain('>click here</a>');
    });

    it('handles multiple wikilinks in one line', () => {
      const html = renderMarkdown('see [[A]] and [[B]]');
      expect(html).toContain('data-wikilink="A"');
      expect(html).toContain('data-wikilink="B"');
    });

    it('does not render wikilinks inside fenced code blocks', () => {
      const html = renderMarkdown('```\n[[My Note]]\n```');
      expect(html).not.toContain('data-wikilink');
      expect(html).not.toContain('class="wikilink"');
      expect(html).toContain('[[My Note]]');
    });

    it('does not render wikilinks inside code blocks with language', () => {
      const html = renderMarkdown('```txt\nsee [[Link]] here\n```');
      expect(html).not.toContain('data-wikilink');
      expect(html).toContain('[[Link]]');
    });

    it('still renders wikilinks outside code blocks in same document', () => {
      const html = renderMarkdown('see [[Outside]]\n\n```\n[[Inside]]\n```');
      expect(html).toContain('data-wikilink="Outside"');
      expect(html).not.toContain('data-wikilink="Inside"');
    });

    it('renders wikilinks inside table cells', () => {
      const md = '| Link |\n|------|\n| [[My Note]] |';
      const html = renderMarkdown(md);
      expect(html).toContain('<table>');
      expect(html).toContain('data-wikilink="My Note"');
      expect(html).toContain('class="wikilink"');
      expect(html).toContain('>My Note</a>');
    });
  });

  describe('checkboxes', () => {
    it('renders unchecked checkbox', () => {
      const html = renderMarkdown('- [ ] todo item');
      expect(html).toContain('type="checkbox"');
      expect(html).not.toContain('checked');
      expect(html).toContain('task-list-item');
    });

    it('renders checked checkbox', () => {
      const html = renderMarkdown('- [x] done item');
      expect(html).toContain('type="checkbox"');
      expect(html).toContain('checked');
    });
  });

  describe('callouts', () => {
    it('renders callout blockquotes', () => {
      const html = renderMarkdown('> [!note] My Title\n> some body');
      expect(html).toContain('callout callout-note');
      expect(html).toContain('My Title');
    });

    it('renders callout with default title', () => {
      const html = renderMarkdown('> [!warning]\n> be careful');
      expect(html).toContain('callout callout-warning');
      expect(html).toContain('Warning');
    });

    it('renders quote callout with attribution and blockquote', () => {
      const html = renderMarkdown(
        '> [!quote] Luhmann on his Zettelkasten\n> "I don\'t think everything on my own."'
      );
      expect(html).toContain('callout callout-quote');
      expect(html).toContain('callout-quote-mark');
      expect(html).toContain('callout-quote-text');
      expect(html).toContain('callout-quote-attribution');
      expect(html).toContain('Luhmann on his Zettelkasten');
    });

    it('renders cite alias as quote', () => {
      const html = renderMarkdown('> [!cite] Source\n> Some citation');
      expect(html).toContain('callout-quote');
      expect(html).toContain('callout-quote-attribution');
    });
  });

  describe('code blocks', () => {
    it('renders code block with language class', () => {
      const html = renderMarkdown('```javascript\nconsole.log("hi")\n```');
      expect(html).toContain('class="language-javascript"');
      expect(html).toContain('console.log');
    });

    it('renders code block without language', () => {
      const html = renderMarkdown('```\nplain text\n```');
      expect(html).toContain('<pre><code>');
      expect(html).toContain('plain text');
    });

    it('escapes HTML in code blocks', () => {
      const html = renderMarkdown('```\n<script>alert(1)</script>\n```');
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>');
    });
  });

  describe('mermaid placeholders', () => {
    it('renders mermaid block as placeholder div', () => {
      const html = renderMarkdown('```mermaid\ngraph TD\n  A-->B\n```');
      expect(html).toContain('mermaid-placeholder');
      expect(html).toContain('data-mermaid-code');
    });

    it('encodes mermaid code in data attribute', () => {
      const code = 'graph TD\n  A-->B';
      const html = renderMarkdown('```mermaid\n' + code + '\n```');
      expect(html).toContain(encodeURIComponent(code));
    });

    it('shows source code in fallback pre block', () => {
      const html = renderMarkdown('```mermaid\ngraph TD\n  A-->B\n```');
      expect(html).toContain('mermaid-source');
      expect(html).toContain('graph TD');
    });
  });

  describe('hard line breaks', () => {
    it('uses hard line breaks by default', () => {
      const html = renderMarkdown('line1\nline2', true);
      expect(html).toContain('<br');
    });

    it('does not use hard breaks when disabled', () => {
      const html = renderMarkdown('line1\nline2', false);
      expect(html).not.toContain('<br');
    });
  });

  describe('dataview blocks', () => {
    it('renders dataview block as dv-result', () => {
      const html = renderMarkdown('```dataview\nTABLE\n```');
      expect(html).toContain('dv-result');
    });

    it('renders dataview result for unrecognized query (graceful fallback)', () => {
      const html = renderMarkdown('```dataview\nINVALID GARBAGE QUERY\n```');
      expect(html).toContain('dv-result');
    });

    it('renders empty result for valid query with no notes', () => {
      const html = renderMarkdown('```dataview\nLIST\n```');
      expect(html).toContain('dv-result');
      expect(html).toContain('No results');
    });
  });

  describe('progressbar blocks', () => {
    it('renders progressbar block as widget', () => {
      const html = renderMarkdown('```progressbar\nkind: day-year\n```');
      expect(html).toContain('progress-bar-widget');
      expect(html).toContain('progress-bar-track');
      expect(html).toContain('progress-bar-fill');
    });

    it('renders manual progressbar with percentage', () => {
      const html = renderMarkdown('```progressbar\nvalue: 50\nmax: 100\n```');
      expect(html).toContain('progress-bar-fill');
      expect(html).toContain('50%');
    });

    it('renders progressbar label', () => {
      const html = renderMarkdown('```progressbar\nkind: day-week\n```');
      expect(html).toContain('progress-bar-label');
      expect(html).toContain('Day of Week');
    });
  });

  describe('symbol prettification', () => {
    it('converts arrow triggers in text', () => {
      const html = renderMarkdown('A --> B');
      expect(html).toContain('\u2192');
    });

    it('converts ellipsis', () => {
      const html = renderMarkdown('Wait...');
      expect(html).toContain('\u2026');
    });

    it('does not corrupt horizontal rules', () => {
      const html = renderMarkdown('---');
      expect(html).toContain('<hr');
    });

    it('does not corrupt tables', () => {
      const html = renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |');
      expect(html).toContain('<table>');
    });

    it('does not corrupt mermaid code', () => {
      const html = renderMarkdown('```mermaid\ngraph TD\n  A-->B\n```');
      expect(html).toContain('mermaid-placeholder');
      expect(html).toContain('graph%20TD');
    });
  });

  describe('images', () => {
    it('renders image tags', () => {
      const html = renderMarkdown('![alt text](https://example.com/img.png)');
      expect(html).toContain('<img');
      expect(html).toContain('src="https://example.com/img.png"');
      expect(html).toContain('alt="alt text"');
    });
  });
});
