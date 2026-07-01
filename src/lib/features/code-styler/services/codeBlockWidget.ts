/**
 * CodeMirror WidgetType for rendering styled code blocks in live preview.
 *
 * Renders: header (language icon + tag + title + fold + copy), line numbers,
 * highlighted lines, coloured left border, and fold state.
 */

import { WidgetType } from '@codemirror/view';
import type { CodeBlockParams, HighlightGroup, CodeStylerTheme } from '../types/codeStyler';
import { getLanguageColor, getLanguageName } from './languageIcons';

export class CodeBlockWidget extends WidgetType {
  constructor(
    private params: CodeBlockParams,
    private codeLines: string[],
    private highlights: HighlightGroup[],
    private theme: CodeStylerTheme,
    private collapsed: boolean
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cm-code-styled';
    const cb = this.theme.codeblock;
    const lang = this.params.language;
    const langColor = getLanguageColor(lang);

    wrap.style.borderRadius = `${cb.borderRadius}px`;
    wrap.style.background = cb.backgroundColor;
    wrap.style.overflow = 'hidden';

    if (cb.showLanguageBorder && lang) {
      wrap.style.borderLeft = `${cb.languageBorderWidth}px solid ${langColor}`;
    }

    // ── Header ──
    const showHeader = this.shouldShowHeader();
    if (showHeader) {
      const header = this.buildHeader(langColor);
      header.addEventListener('click', () => {
        this.collapsed = !this.collapsed;
        const body = wrap.querySelector('.cm-code-styled-body') as HTMLElement;
        if (body) body.style.display = this.collapsed ? 'none' : '';
        const chevron = header.querySelector('.cm-code-styled-fold') as HTMLElement;
        if (chevron) chevron.textContent = this.collapsed ? '▶' : '▼';
      });
      wrap.appendChild(header);
    }

    // ── Body ──
    const body = document.createElement('div');
    body.className = 'cm-code-styled-body';
    if (this.collapsed) body.style.display = 'none';

    const table = document.createElement('table');
    table.className = 'cm-code-styled-table';
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';

    const showLn = this.resolveLineNumbers();
    const startNum = typeof this.params.lineNumbers === 'number' ? this.params.lineNumbers : 1;

    for (let i = 0; i < this.codeLines.length; i++) {
      const tr = document.createElement('tr');
      tr.className = 'cm-code-styled-row';

      // Check highlights
      const hlColor = this.getLineHighlightColor(i);
      if (hlColor) {
        tr.style.background = hlColor;
      }

      // Line number gutter
      if (showLn) {
        const td = document.createElement('td');
        td.className = 'cm-code-styled-ln';
        td.textContent = String(startNum + i);
        td.style.color = cb.gutterTextColor;
        td.style.background = cb.gutterBackgroundColor;
        tr.appendChild(td);
      }

      // Code content
      const td = document.createElement('td');
      td.className = 'cm-code-styled-code';
      td.style.color = cb.textColor;

      const code = document.createElement('code');
      code.textContent = this.codeLines[i];
      td.appendChild(code);
      tr.appendChild(td);

      table.appendChild(tr);
    }

    body.appendChild(table);
    wrap.appendChild(body);

    return wrap;
  }

  eq(other: CodeBlockWidget): boolean {
    return (
      this.params.language === other.params.language &&
      this.params.title === other.params.title &&
      this.codeLines.join('\n') === other.codeLines.join('\n') &&
      this.collapsed === other.collapsed
    );
  }

  ignoreEvent(): boolean {
    return false;
  }

  private shouldShowHeader(): boolean {
    const cb = this.theme.codeblock;
    if (cb.showHeader === 'never') return false;
    if (cb.showHeader === 'always') return true;
    // 'ifTitle': show if title, fold, or language icon/tag forced to always
    return (
      !!this.params.title ||
      this.params.fold ||
      cb.showLanguageIcon === 'always' ||
      cb.showLanguageTag === 'always'
    );
  }

  private buildHeader(langColor: string): HTMLElement {
    const header = document.createElement('div');
    header.className = 'cm-code-styled-header';
    const cb = this.theme.codeblock;
    header.style.background = cb.headerBackgroundColor;
    header.style.borderBottom = `1px solid ${cb.headerSeparatorColor}`;
    header.style.cursor = 'pointer';

    // Language icon placeholder (coloured dot)
    const showIcon =
      cb.showLanguageIcon === 'always' ||
      (cb.showLanguageIcon === 'ifHeader' && this.params.language);
    if (showIcon && this.params.language) {
      const dot = document.createElement('span');
      dot.className = 'cm-code-styled-lang-dot';
      dot.style.background = langColor;
      header.appendChild(dot);
    }

    // Language tag
    const showTag =
      cb.showLanguageTag === 'always' ||
      (cb.showLanguageTag === 'ifHeader' && this.params.language);
    if (showTag && this.params.language) {
      const tag = document.createElement('span');
      tag.className = 'cm-code-styled-lang-tag';
      tag.textContent = getLanguageName(this.params.language);
      tag.style.background = cb.headerLangTagBackground;
      tag.style.color = cb.headerLangTagColor;
      header.appendChild(tag);
    }

    // Title
    if (this.params.title) {
      const title = document.createElement('span');
      title.className = 'cm-code-styled-title';
      title.textContent = this.params.title;
      title.style.color = cb.headerTitleColor;
      header.appendChild(title);
    }

    // Spacer
    const spacer = document.createElement('span');
    spacer.style.flex = '1';
    header.appendChild(spacer);

    // Fold indicator
    if (this.params.fold || this.params.title) {
      const fold = document.createElement('span');
      fold.className = 'cm-code-styled-fold';
      fold.textContent = this.collapsed ? '▶' : '▼';
      header.appendChild(fold);
    }

    // Copy button
    if (cb.showCopyButton) {
      const btn = document.createElement('button');
      btn.className = 'cm-code-styled-copy';
      btn.textContent = 'Copy';
      btn.title = 'Copy code to clipboard';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(this.codeLines.join('\n')).then(() => {
          btn.textContent = 'Copied!';
          setTimeout(() => {
            btn.textContent = 'Copy';
          }, 1500);
        });
      });
      header.appendChild(btn);
    }

    return header;
  }

  private resolveLineNumbers(): boolean {
    if (typeof this.params.lineNumbers === 'boolean') {
      return this.params.lineNumbers && this.theme.codeblock.showLineNumbers;
    }
    return true; // numeric offset always shows line numbers
  }

  private getLineHighlightColor(lineIdx: number): string | null {
    for (const group of this.highlights) {
      if (group.lines.has(lineIdx)) return group.color;
    }
    return null;
  }
}
