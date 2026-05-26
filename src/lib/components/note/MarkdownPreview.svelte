<script lang="ts">
  import { marked } from 'marked';
  import { onMount } from 'svelte';

  export let content: string = '';
  export let onWikilinkClick: ((target: string) => void) | undefined = undefined;

  let previewHtml = '';

  // Configure marked for wikilinks
  const renderer = new marked.Renderer();

  // Custom wikilink renderer
  renderer.text = (text: string) => {
    // Match [[wikilink]] or [[wikilink|alias]]
    return text.replace(
      /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
      (_match: string, target: string, alias?: string) => {
        const displayText = alias || target;
        return `<a href="#" class="wikilink" data-target="${target}">${displayText}</a>`;
      }
    );
  };

  marked.setOptions({
    renderer,
    breaks: true,
    gfm: true,
  });

  $: {
    try {
      previewHtml = marked(content || '');
    } catch (error) {
      console.error('Markdown parsing error:', error);
      previewHtml = '<p>Error rendering markdown</p>';
    }
  }

  function handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('wikilink')) {
      event.preventDefault();
      const wikilinkTarget = target.getAttribute('data-target');
      if (wikilinkTarget && onWikilinkClick) {
        onWikilinkClick(wikilinkTarget);
      }
    }
  }

  onMount(() => {
    // Add click listener for wikilinks
    return () => {};
  });
</script>

<div class="markdown-preview" on:click={handleClick} role="article">
  {@html previewHtml}
</div>

<style>
  .markdown-preview {
    padding: var(--spacing-l);
    max-width: 800px;
    margin: 0 auto;
    color: var(--text-primary);
    line-height: 1.6;
  }

  .markdown-preview :global(h1) {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    margin-top: var(--spacing-xl);
    margin-bottom: var(--spacing-m);
    color: var(--text-primary);
    border-bottom: 2px solid var(--background-modifier-border);
    padding-bottom: var(--spacing-s);
  }

  .markdown-preview :global(h2) {
    font-size: var(--font-size-xl);
    font-weight: 600;
    margin-top: var(--spacing-l);
    margin-bottom: var(--spacing-m);
    color: var(--text-primary);
  }

  .markdown-preview :global(h3) {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin-top: var(--spacing-m);
    margin-bottom: var(--spacing-s);
    color: var(--text-primary);
  }

  .markdown-preview :global(p) {
    margin-bottom: var(--spacing-m);
  }

  .markdown-preview :global(ul),
  .markdown-preview :global(ol) {
    margin-bottom: var(--spacing-m);
    padding-left: var(--spacing-xl);
  }

  .markdown-preview :global(li) {
    margin-bottom: var(--spacing-xs);
  }

  .markdown-preview :global(code) {
    background-color: var(--background-secondary);
    padding: 2px 6px;
    border-radius: var(--radius-xs);
    font-family: 'Fira Code', monospace;
    font-size: 0.9em;
  }

  .markdown-preview :global(pre) {
    background-color: var(--background-secondary);
    padding: var(--spacing-m);
    border-radius: var(--radius-s);
    overflow-x: auto;
    margin-bottom: var(--spacing-m);
  }

  .markdown-preview :global(pre code) {
    background: none;
    padding: 0;
  }

  .markdown-preview :global(blockquote) {
    border-left: 4px solid var(--accent-primary);
    padding-left: var(--spacing-m);
    margin-left: 0;
    margin-bottom: var(--spacing-m);
    color: var(--text-muted);
    font-style: italic;
  }

  .markdown-preview :global(a) {
    color: var(--accent-primary);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .markdown-preview :global(a:hover) {
    color: var(--accent-hover);
    text-decoration: underline;
  }

  .markdown-preview :global(.wikilink) {
    color: var(--accent-primary);
    text-decoration: underline;
    cursor: pointer;
    font-weight: 500;
  }

  .markdown-preview :global(.wikilink:hover) {
    color: var(--accent-hover);
    background-color: var(--background-modifier-hover);
    padding: 2px 4px;
    border-radius: var(--radius-xs);
  }

  .markdown-preview :global(table) {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: var(--spacing-m);
  }

  .markdown-preview :global(th),
  .markdown-preview :global(td) {
    border: 1px solid var(--background-modifier-border);
    padding: var(--spacing-s);
    text-align: left;
  }

  .markdown-preview :global(th) {
    background-color: var(--background-secondary);
    font-weight: 600;
  }

  .markdown-preview :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: var(--radius-s);
    margin: var(--spacing-m) 0;
  }

  .markdown-preview :global(hr) {
    border: none;
    border-top: 2px solid var(--background-modifier-border);
    margin: var(--spacing-xl) 0;
  }
</style>
