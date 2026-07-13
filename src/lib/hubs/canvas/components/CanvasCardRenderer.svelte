<script lang="ts">
  import { onMount, tick } from 'svelte';

  import { renderMarkdown } from '@/hubs/editor/services/markdown-renderer';
  import { postProcessMermaid } from '@/hubs/editor/services/mermaid-service';
  import { getCachedContent } from '@/hubs/editor/services/file-ops';

  interface Props {
    title: string;
    content: string;
    color: string;
    notePath?: string;
    onTitleChange: (title: string) => void;
    onContentChange: (content: string) => void;
  }

  let { title, content, color, notePath, onTitleChange, onContentChange }: Props = $props();

  let editing = $state(false);
  let previewRef = $state<HTMLDivElement>();
  let textareaRef = $state<HTMLTextAreaElement>();

  let displayContent = $derived(notePath ? (getCachedContent(notePath) ?? content) : content);
  let renderedHtml = $derived(renderMarkdown(displayContent, false));

  function enterEdit(e: MouseEvent) {
    e.stopPropagation();
    editing = true;
    tick().then(() => textareaRef?.focus());
  }

  function exitEdit() {
    editing = false;
  }

  function handleContentInput(e: Event) {
    const value = (e.target as HTMLTextAreaElement).value;
    onContentChange(value);
  }

  function handleTitleInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    onTitleChange(value);
  }

  function handlePreviewClick(e: MouseEvent) {
    const target = e.target as HTMLElement;

    const wikilink = target.closest('[data-wikilink]');
    if (wikilink) {
      e.preventDefault();
      e.stopPropagation();
      const noteTarget = wikilink.getAttribute('data-wikilink');
      if (noteTarget) {
        window.dispatchEvent(new CustomEvent('wikilink-click', { detail: { target: noteTarget } }));
      }
      return;
    }

    const checkbox = target.closest<HTMLInputElement>('input[type="checkbox"]');
    if (checkbox) {
      e.stopPropagation();
      const idx = parseInt(checkbox.getAttribute('data-checkbox-index') ?? '-1', 10);
      if (idx >= 0) toggleCheckbox(idx);
      return;
    }
  }

  function toggleCheckbox(index: number) {
    const lines = content.split('\n');
    let cbIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*- \[[ x]\]/i.test(line)) {
        if (cbIdx === index) {
          lines[i] =
            line.includes('- [x]') || line.includes('- [X]')
              ? line.replace(/- \[[xX]\]/, '- [ ]')
              : line.replace(/- \[ \]/, '- [x]');
          onContentChange(lines.join('\n'));
          return;
        }
        cbIdx++;
      }
    }
  }

  async function processMermaid() {
    await tick();
    if (previewRef) await postProcessMermaid(previewRef);
  }

  onMount(() => {
    processMermaid();
  });

  $effect(() => {
    if (renderedHtml && previewRef && !editing) processMermaid();
  });
</script>

<div class="ccr-card">
  <div class="ccr-header" style="background: {color}20">
    <input
      class="ccr-title"
      value={title}
      onclick={(e) => e.stopPropagation()}
      oninput={handleTitleInput}
    />
    <button
      class="ccr-mode-btn"
      onclick={(e) => {
        e.stopPropagation();
        editing = !editing;
      }}
      title={editing ? 'Preview' : 'Edit'}>{editing ? 'View' : '✎'}</button
    >
  </div>

  {#if editing}
    <textarea
      bind:this={textareaRef}
      class="ccr-textarea"
      value={content}
      placeholder="Write markdown..."
      onclick={(e) => e.stopPropagation()}
      oninput={handleContentInput}
      onblur={exitEdit}></textarea>
  {:else}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      bind:this={previewRef}
      class="ccr-preview prose-view"
      ondblclick={enterEdit}
      onclick={handlePreviewClick}
    >
      {#if displayContent.trim()}
        {@html renderedHtml}
      {:else}
        <span class="ccr-empty">Double-click to edit...</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .ccr-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .ccr-header {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    border-bottom: 1px solid var(--color-border);
    gap: 4px;
  }
  .ccr-title {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--color-text);
    font-size: 0.75rem;
    font-weight: 600;
    font-family: inherit;
    outline: none;
    cursor: text;
    min-width: 0;
  }
  .ccr-mode-btn {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: 0.65rem;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity var(--transition-base);
  }
  .ccr-card:hover .ccr-mode-btn {
    opacity: 1;
  }
  .ccr-mode-btn:hover {
    background: var(--color-surface);
    border-color: var(--color-border);
    color: var(--color-text);
  }
  .ccr-textarea {
    flex: 1;
    padding: 6px 8px;
    border: none;
    background: transparent;
    color: var(--color-text);
    font-size: 0.7rem;
    font-family: var(--font-mono, monospace);
    outline: none;
    resize: none;
    cursor: text;
    min-height: 60px;
    line-height: 1.5;
  }
  .ccr-preview {
    flex: 1;
    padding: 6px 8px;
    overflow-y: auto;
    cursor: default;
    font-size: 0.7rem;
    line-height: 1.5;
    color: var(--color-text);
  }
  .ccr-preview :global(h1) {
    font-size: 1.1em;
    margin: 4px 0;
    font-weight: 700;
  }
  .ccr-preview :global(h2) {
    font-size: 1em;
    margin: 4px 0;
    font-weight: 600;
  }
  .ccr-preview :global(h3) {
    font-size: 0.95em;
    margin: 3px 0;
    font-weight: 600;
  }
  .ccr-preview :global(p) {
    margin: 3px 0;
  }
  .ccr-preview :global(ul),
  .ccr-preview :global(ol) {
    margin: 3px 0;
    padding-left: 16px;
  }
  .ccr-preview :global(li) {
    margin: 1px 0;
  }
  .ccr-preview :global(a) {
    color: var(--color-accent);
    text-decoration: none;
  }
  .ccr-preview :global(a:hover) {
    text-decoration: underline;
  }
  .ccr-preview :global(.wikilink) {
    color: var(--color-accent);
    cursor: pointer;
  }
  .ccr-preview :global(code) {
    font-family: var(--font-mono, monospace);
    font-size: 0.85em;
    background: var(--color-surface);
    padding: 1px 4px;
    border-radius: var(--radius-s);
  }
  .ccr-preview :global(pre) {
    background: var(--color-surface);
    padding: 6px 8px;
    border-radius: var(--radius-s);
    overflow-x: auto;
    margin: 4px 0;
  }
  .ccr-preview :global(pre code) {
    background: none;
    padding: 0;
  }
  .ccr-preview :global(blockquote) {
    border-left: 3px solid var(--color-border);
    margin: 4px 0;
    padding: 2px 8px;
    color: var(--color-text-muted);
  }
  .ccr-preview :global(hr) {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 6px 0;
  }
  .ccr-preview :global(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 4px 0;
    font-size: 0.85em;
  }
  .ccr-preview :global(th),
  .ccr-preview :global(td) {
    border: 1px solid var(--color-border);
    padding: 3px 6px;
    text-align: left;
  }
  .ccr-preview :global(th) {
    background: var(--color-surface);
    font-weight: 600;
  }
  .ccr-preview :global(img) {
    max-width: 100%;
    border-radius: var(--radius-s);
  }
  .ccr-preview :global(.task-list-item) {
    list-style: none;
    margin-left: -16px;
  }
  .ccr-preview :global(.task-list-item input) {
    margin-right: 4px;
    cursor: pointer;
    pointer-events: auto;
  }
  .ccr-preview :global(.callout) {
    border-left: 3px solid var(--color-accent);
    background: oklch(from var(--color-accent) l c h / 0.06);
    padding: 6px 8px;
    border-radius: var(--radius-s);
    margin: 4px 0;
  }
  .ccr-preview :global(.callout-title) {
    font-weight: 600;
    font-size: 0.85em;
    margin-bottom: 2px;
  }
  .ccr-preview :global(.mermaid-placeholder) {
    background: var(--color-surface);
    padding: 8px;
    border-radius: var(--radius-s);
    margin: 4px 0;
    text-align: center;
  }
  .ccr-preview :global(.mermaid-rendered) {
    text-align: center;
    margin: 4px 0;
  }
  .ccr-preview :global(.mermaid-rendered svg) {
    max-width: 100%;
    height: auto;
  }
  .ccr-preview :global(.mermaid-error) {
    background: oklch(from var(--color-danger, red) l c h / 0.08);
    border: 1px solid var(--color-danger, red);
    border-radius: var(--radius-s);
    padding: 6px 8px;
    margin: 4px 0;
  }
  .ccr-preview :global(.mermaid-error-msg) {
    color: var(--color-danger, red);
    font-size: 0.8em;
    margin-bottom: 4px;
  }
  .ccr-preview :global(.mermaid-error-code) {
    font-size: 0.75em;
  }
  .ccr-empty {
    color: var(--color-text-subtle);
    font-style: italic;
  }
</style>
