<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { annotatorView, setPage, setZoom } from '../stores/annotatorStore';
  import { openPdf, renderPage, closePdf } from '../services/pdfService';
  import {
    generatePdfLink,
    resolvePdfBacklinks,
    loadPdfPlusConfig,
  } from '../services/pdfLinkService';
  import type { PDFBacklinkHighlight } from '../types';
  import { HIGHLIGHT_COLORS } from '../types';
  import PDFToolbar from './PDFToolbar.svelte';
  import { log } from '@/utils/logger';

  export let source: string;

  const dispatch = createEventDispatcher<{ linkCopied: string }>;
  const pdfConfig = loadPdfPlusConfig();

  let canvasEl: HTMLCanvasElement;
  let loading = true;
  let error = '';
  let backlinkHighlights: PDFBacklinkHighlight[] = [];
  let copyFeedback = '';

  $: currentPage = $annotatorView.currentPage;
  $: totalPages = $annotatorView.totalPages;
  $: zoom = $annotatorView.zoom;
  $: darkMode = $annotatorView.darkMode;

  onMount(async () => {
    try {
      const info = await openPdf(source);
      annotatorView.update((v) => ({ ...v, totalPages: info.numPages }));
      await renderCurrentPage();
      loading = false;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      loading = false;
      log.error('PDFViewer: failed to load document', e as Error);
    }
  });

  onDestroy(() => {
    closePdf();
  });

  async function renderCurrentPage() {
    if (!canvasEl) return;
    try {
      await renderPage(canvasEl, currentPage, zoom * 1.5);
    } catch (e) {
      log.error('PDFViewer: render error', e as Error);
    }
  }

  $: if (canvasEl && !loading) {
    renderCurrentPage();
  }

  function handlePrev() {
    if (currentPage > 1) setPage(currentPage - 1);
  }

  function handleNext() {
    if (currentPage < totalPages) setPage(currentPage + 1);
  }

  function handleZoomIn() {
    setZoom(zoom + 0.25);
  }

  function handleZoomOut() {
    setZoom(zoom - 0.25);
  }

  function handleWheel(e: WheelEvent) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(zoom + (e.deltaY < 0 ? 0.1 : -0.1));
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      handlePrev();
    }
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      handleNext();
    }
    if (e.key === '+' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleZoomIn();
    }
    if (e.key === '-' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleZoomOut();
    }
    if ((e.key === 'c' || e.key === 'C') && e.shiftKey && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      copySelectionLink();
    }
  }

  async function copySelectionLink() {
    const activeColor = $annotatorView.activeColor;
    const selection = window.getSelection()?.toString().trim();
    if (!selection) return;

    const link = generatePdfLink(source, currentPage, selection, null, activeColor, pdfConfig);
    try {
      await navigator.clipboard.writeText(link);
      copyFeedback = 'Copied!';
      dispatch('linkCopied', link);
      setTimeout(() => {
        copyFeedback = '';
      }, 1500);
      log.debug('PDFViewer: copied link to selection', { page: currentPage });
    } catch {
      log.warn('PDFViewer: clipboard write failed');
    }
  }

  async function loadBacklinkHighlights() {
    if (!pdfConfig.highlightBacklinks) return;
    backlinkHighlights = await resolvePdfBacklinks(
      source,
      currentPage,
      pdfConfig.filterBacklinksByPage
    );
  }

  $: if (!loading && currentPage) {
    loadBacklinkHighlights();
  }
</script>

<div
  class="pdf-viewer"
  class:dark-mode={darkMode}
  on:wheel={handleWheel}
  on:keydown={handleKeydown}
  tabindex="0"
  role="document"
  aria-label="PDF viewer"
>
  {#if loading}
    <div class="loading-state">Loading PDF…</div>
  {:else if error}
    <div class="error-state">
      <p>Failed to load PDF</p>
      <p class="error-detail">{error}</p>
    </div>
  {:else}
    <PDFToolbar
      {source}
      {copyFeedback}
      on:prev={handlePrev}
      on:next={handleNext}
      on:copyLink={copySelectionLink}
    />

    <div class="pdf-canvas-container">
      <canvas bind:this={canvasEl}></canvas>
      {#if backlinkHighlights.length > 0}
        <div class="backlink-highlights-overlay">
          {#each backlinkHighlights as hl (hl.sourcePath + hl.text)}
            <div
              class="backlink-chip"
              style="border-left-color: {HIGHLIGHT_COLORS[hl.color]}"
              title="{hl.sourcePath}: {hl.sourceContext}"
            >
              <span class="chip-color" style="background: {HIGHLIGHT_COLORS[hl.color]}"></span>
              <span class="chip-text">{hl.text || hl.sourcePath.split('/').pop()}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .pdf-viewer {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-secondary);
    outline: none;
  }
  .pdf-viewer.dark-mode {
    filter: invert(0.88) hue-rotate(180deg);
  }
  .backlink-highlights-overlay {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 220px;
    z-index: 5;
  }
  .backlink-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    background: var(--bg-primary);
    border-radius: var(--radius-sm);
    border-left: 3px solid;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
    cursor: default;
  }
  .chip-color {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .chip-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .separator {
    color: var(--text-muted);
  }
  .pdf-canvas-container {
    flex: 1;
    overflow: auto;
    display: flex;
    justify-content: center;
    padding: 16px;
    position: relative;
  }
  .pdf-canvas-container canvas {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    max-width: 100%;
  }
  .loading-state,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-secondary);
    gap: 8px;
  }
  .error-detail {
    font-size: var(--font-size-xs);
    color: var(--text-error);
  }
</style>
