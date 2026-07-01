<script lang="ts">
  /**
   * PDFToolbar — color palette, page navigation, zoom controls,
   * and copy-link-to-selection for the PDF viewer.
   */
  import { createEventDispatcher } from 'svelte';
  import { annotatorView, setPage, setZoom, setActiveColor } from '../stores/annotatorStore';
  import { HIGHLIGHT_COLORS } from '../types';
  import type { HighlightColor } from '../types';

  export let source: string;
  export let copyFeedback: string = '';

  const dispatch = createEventDispatcher<{ copyLink: void; prev: void; next: void }>();

  $: currentPage = $annotatorView.currentPage;
  $: totalPages = $annotatorView.totalPages;
  $: zoom = $annotatorView.zoom;
  $: activeColor = $annotatorView.activeColor;

  let pageInput = '';

  function handlePageInput(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      const num = parseInt(pageInput, 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) setPage(num);
      pageInput = '';
    }
  }

  function selectColor(color: HighlightColor) {
    setActiveColor(color);
    dispatch('copyLink');
  }
</script>

<div class="pdf-toolbar">
  <button on:click={() => dispatch('prev')} disabled={currentPage <= 1} title="Previous page">←</button>
  <span class="page-info">{currentPage} / {totalPages}</span>
  <button on:click={() => dispatch('next')} disabled={currentPage >= totalPages} title="Next page">→</button>
  <input
    class="page-input"
    type="text"
    placeholder="Go to"
    bind:value={pageInput}
    on:keydown={handlePageInput}
  />
  <span class="separator">|</span>
  <button on:click={() => setZoom(zoom - 0.25)} title="Zoom out">−</button>
  <span class="zoom-info">{Math.round(zoom * 100)}%</span>
  <button on:click={() => setZoom(zoom + 0.25)} title="Zoom in">+</button>
  <span class="separator">|</span>
  <div class="color-palette-bar">
    {#each Object.entries(HIGHLIGHT_COLORS) as [name, hex]}
      <button
        class="palette-swatch"
        class:active={activeColor === name}
        style="background: {hex}"
        on:click={() => selectColor(name as HighlightColor)}
        title="Copy link with {name} highlight"
      ></button>
    {/each}
  </div>
  {#if copyFeedback}
    <span class="copy-feedback">{copyFeedback}</span>
  {/if}
</div>

<style>
  .pdf-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-primary);
    font-size: var(--font-size-sm);
  }
  .pdf-toolbar button {
    padding: 2px 8px;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    background: var(--bg-secondary);
    color: var(--text-primary);
    cursor: pointer;
    font-size: var(--font-size-sm);
  }
  .pdf-toolbar button:disabled { opacity: 0.4; cursor: not-allowed; }
  .page-info, .zoom-info { min-width: 60px; text-align: center; color: var(--text-secondary); }
  .page-input {
    width: 48px; padding: 1px 4px;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: var(--font-size-xs);
    text-align: center;
  }
  .separator { color: var(--text-muted); }
  .color-palette-bar { display: flex; gap: 3px; align-items: center; }
  .palette-swatch {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid transparent; cursor: pointer; padding: 0;
  }
  .palette-swatch.active {
    border-color: var(--text-primary);
    box-shadow: 0 0 0 1px var(--bg-primary);
  }
  .copy-feedback { font-size: var(--font-size-xs); color: var(--text-accent); font-weight: 600; }
</style>
