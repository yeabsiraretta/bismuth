<script lang="ts">
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import { onMount, afterUpdate } from 'svelte';
  import { log } from '@/utils/logger';
  import { applyContextualTypography } from '@/features/typography';
  import { getLanguageColor, getLanguageName } from '@/features/code-styler';
  import { renderBibtexBlock, BIBTEX_STYLES } from '@/features/citations';

  export let content: string = '';
  export let onWikilinkClick: ((title: string) => void) | undefined = undefined;

  let containerEl: HTMLDivElement;

  // Configure marked once: GFM + line breaks
  marked.setOptions({ gfm: true, breaks: false });

  $: rendered = renderMarkdown(content);

  function renderMarkdown(raw: string): string {
    try {
      const html = marked.parse(raw) as string;
      if (typeof window !== 'undefined' && DOMPurify.isSupported) {
        return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
      }
      return html;
    } catch (err) {
      log.warn('MarkdownPreview: render failed', { error: String(err) });
      return `<pre>${raw}</pre>`;
    }
  }

  function handleClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href') ?? '';
    // Wikilink rendered as [[target]] → href="#wikilink:target" by custom renderer, or plain text
    if (href.startsWith('#wikilink:')) {
      e.preventDefault();
      onWikilinkClick?.(decodeURIComponent(href.slice('#wikilink:'.length)));
      return;
    }
    // External link — let it open normally (Tauri will handle via shell)
  }

  onMount(() => {
    // Inject Pretty BibTeX styles once
    if (!document.getElementById('bismuth-bibtex-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'bismuth-bibtex-styles';
      styleEl.textContent = BIBTEX_STYLES;
      document.head.appendChild(styleEl);
    }

    // Re-configure marked with custom renderers
    const renderer = new marked.Renderer();

    // Wikilink renderer
    const origText = renderer.text.bind(renderer);
    renderer.text = (token) => {
      const t = typeof token === 'string' ? token : token.text ?? '';
      const replaced = t.replace(
        /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
        (_, target, alias) => {
          const displayText = alias || target;
          return `<a href="#wikilink:${encodeURIComponent(target)}" class="md-wikilink">${displayText}</a>`;
        }
      );
      return replaced !== t ? replaced : (origText ? origText(token) : t);
    };

    // Styled code block renderer
    renderer.code = (token) => {
      const code = typeof token === 'string' ? token : token.text ?? '';
      const lang = (typeof token === 'object' ? token.lang : '') ?? '';

      // Pretty BibTeX rendering
      if (lang === 'bibtex' || lang === 'bib') {
        const pretty = renderBibtexBlock(code);
        if (pretty) return pretty;
      }
      const langColor = getLanguageColor(lang);
      const langName = getLanguageName(lang);
      const lines = code.split('\n');
      const borderStyle = lang ? `border-left: 3px solid ${langColor};` : '';

      let header = '';
      if (lang) {
        header = `<div class="md-code-header"><span class="md-code-lang-dot" style="background:${langColor}"></span><span class="md-code-lang-tag">${langName}</span><span class="md-code-spacer"></span><button class="md-code-copy" onclick="navigator.clipboard.writeText(this.closest('.md-code-styled').querySelector('code').textContent).then(()=>{this.textContent='Copied!';setTimeout(()=>{this.textContent='Copy'},1500)})">Copy</button></div>`;
      }

      const numberedLines = lines.map((l, idx) =>
        `<tr><td class="md-code-ln">${idx + 1}</td><td class="md-code-content">${l || ' '}</td></tr>`
      ).join('');

      return `<div class="md-code-styled" style="${borderStyle}"><div>${header}<table class="md-code-table">${numberedLines}</table></div></div>`;
    };

    marked.use({ renderer });
  });

  afterUpdate(() => {
    if (containerEl) applyContextualTypography(containerEl);
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_no_noninteractive_element_interactions -->
<div
  class="markdown-preview"
  bind:this={containerEl}
  on:click={handleClick}
  role="document"
  aria-label="Note preview"
>
  {@html rendered}
</div>

<style>
  .markdown-preview {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    padding: 16px 20px;
    font-size: var(--editor-font-size, 16px);
    line-height: var(--editor-line-height, 1.6);
    font-family: var(--font-text, var(--font-sans, sans-serif));
    color: var(--text-normal);
    background: var(--background-primary);
    box-sizing: border-box;
  }

  /* Headings */
  .markdown-preview :global(h1) { font-size: 1.6em; font-weight: 700; letter-spacing: -0.02em; margin: 1em 0 0.4em; color: var(--text-normal); }
  .markdown-preview :global(h2) { font-size: 1.4em; font-weight: 700; letter-spacing: -0.01em; margin: 0.9em 0 0.35em; color: var(--text-normal); }
  .markdown-preview :global(h3) { font-size: 1.2em; font-weight: 600; margin: 0.8em 0 0.3em; color: var(--text-normal); }
  .markdown-preview :global(h4) { font-size: 1.1em; font-weight: 600; margin: 0.75em 0 0.25em; }
  .markdown-preview :global(h5) { font-size: 1em; font-weight: 600; color: var(--text-muted); margin: 0.7em 0 0.2em; }
  .markdown-preview :global(h6) { font-size: 0.95em; font-weight: 600; font-style: italic; color: var(--text-muted); margin: 0.7em 0 0.2em; }

  /* Paragraphs and spacing */
  .markdown-preview :global(p) { margin: 0 0 0.8em; }
  .markdown-preview :global(p:last-child) { margin-bottom: 0; }

  /* Inline */
  .markdown-preview :global(strong) { font-weight: 700; }
  .markdown-preview :global(em) { font-style: italic; }
  .markdown-preview :global(del) { text-decoration: line-through; opacity: 0.6; }
  .markdown-preview :global(mark) { background: var(--text-highlight-bg, rgba(255,208,0,0.4)); border-radius: 2px; padding: 1px 0; }
  .markdown-preview :global(u) { text-decoration: underline; }
  .markdown-preview :global(sup) { vertical-align: super; font-size: 0.75em; }
  .markdown-preview :global(sub) { vertical-align: sub; font-size: 0.75em; }

  /* Inline code */
  .markdown-preview :global(code) {
    font-family: var(--font-mono, "JetBrains Mono", monospace);
    background: var(--background-secondary);
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 0.9em;
  }
  /* Legacy pre (fallback) */
  .markdown-preview :global(pre) {
    background: var(--background-secondary);
    border-radius: var(--radius-m, 6px);
    padding: 12px 16px;
    overflow-x: auto;
    margin: 0.8em 0;
  }
  .markdown-preview :global(pre code) {
    background: none;
    padding: 0;
    font-size: 0.88em;
    line-height: 1.5;
  }
  /* Styled code blocks */
  .markdown-preview :global(.md-code-styled) {
    background: var(--background-secondary);
    border-radius: var(--radius-m, 8px);
    border: 1px solid var(--border-color);
    overflow: hidden;
    margin: 0.8em 0;
    font-family: var(--font-mono, "JetBrains Mono", monospace);
    font-size: 0.88em;
    line-height: 1.55;
  }
  .markdown-preview :global(.md-code-header) {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--background-secondary-alt, var(--background-secondary));
    border-bottom: 1px solid var(--border-color);
    font-size: 0.85em;
    user-select: none;
  }
  .markdown-preview :global(.md-code-lang-dot) {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  }
  .markdown-preview :global(.md-code-lang-tag) {
    padding: 1px 8px; border-radius: 4px; font-weight: 600; letter-spacing: 0.02em;
    background: var(--background-modifier-hover); color: var(--text-muted);
  }
  .markdown-preview :global(.md-code-spacer) { flex: 1; }
  .markdown-preview :global(.md-code-copy) {
    padding: 2px 10px; font-size: 0.8em; font-weight: 500;
    border: 1px solid var(--border-color); border-radius: 4px;
    background: var(--background-primary); color: var(--text-muted);
    cursor: pointer; font-family: var(--font-sans, system-ui);
  }
  .markdown-preview :global(.md-code-copy:hover) {
    background: var(--background-modifier-hover); color: var(--text-normal);
  }
  .markdown-preview :global(.md-code-table) {
    border-collapse: collapse; width: 100%; table-layout: fixed;
  }
  .markdown-preview :global(.md-code-ln) {
    width: 3.5em; min-width: 3.5em; max-width: 3.5em;
    padding: 0 8px 0 0; text-align: right; user-select: none;
    font-size: 0.85em; color: var(--text-faint); opacity: 0.7;
    vertical-align: top; border-right: 1px solid var(--border-color);
  }
  .markdown-preview :global(.md-code-content) {
    padding: 0 16px; white-space: pre; word-break: break-all; vertical-align: top;
  }

  /* Blockquote */
  .markdown-preview :global(blockquote) {
    border-left: 3px solid var(--interactive-accent);
    margin: 0.8em 0;
    padding: 6px 12px;
    color: var(--text-muted);
    font-style: italic;
    background: var(--background-secondary, #f8f9fa);
    border-radius: var(--radius-s, 4px);
  }
  .markdown-preview :global(blockquote p:last-child) { margin-bottom: 0; }

  /* Lists */
  .markdown-preview :global(ul) { margin: 0.4em 0 0.8em; padding-left: 1.5em; list-style: disc; }
  .markdown-preview :global(ol) { margin: 0.4em 0 0.8em; padding-left: 1.8em; list-style: decimal; }
  .markdown-preview :global(li) { margin-bottom: 0.2em; }
  .markdown-preview :global(ul ul), .markdown-preview :global(ol ol),
  .markdown-preview :global(ul ol), .markdown-preview :global(ol ul) {
    margin: 0.2em 0;
  }
  /* Task list checkboxes */
  .markdown-preview :global(input[type="checkbox"]) {
    appearance: none;
    width: 15px; height: 15px;
    border: 2px solid var(--text-muted);
    border-radius: 3px;
    vertical-align: middle;
    margin-right: 5px;
    position: relative;
    cursor: default;
  }
  .markdown-preview :global(input[type="checkbox"]:checked) {
    background: var(--interactive-accent);
    border-color: var(--interactive-accent);
  }
  .markdown-preview :global(input[type="checkbox"]:checked::after) {
    content: '';
    position: absolute;
    left: 3px; top: 0;
    width: 4px; height: 8px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  /* Links */
  .markdown-preview :global(a) { color: var(--interactive-accent); text-decoration: underline; cursor: pointer; }
  .markdown-preview :global(a.md-wikilink) { color: var(--interactive-accent); text-decoration: none; }
  .markdown-preview :global(a.md-wikilink:hover) { text-decoration: underline; }

  /* Horizontal rule */
  .markdown-preview :global(hr) { border: none; border-top: 1px solid var(--border-color); margin: 1.2em 0; opacity: 0.6; }

  /* Tables */
  .markdown-preview :global(table) { border-collapse: collapse; width: 100%; margin: 0.8em 0; font-size: 0.9em; }
  .markdown-preview :global(th), .markdown-preview :global(td) { border: 1px solid var(--border-color); padding: 5px 10px; text-align: left; }
  .markdown-preview :global(th) { background: var(--background-secondary); font-weight: 600; }
  .markdown-preview :global(tr:nth-child(even) td) { background: var(--background-primary-alt); }

  /* Images */
  .markdown-preview :global(img) { max-width: 100%; border-radius: var(--radius-m, 6px); display: block; margin: 0.5em 0; }
</style>
