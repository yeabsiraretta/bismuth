<script lang="ts">
  import { onMount } from 'svelte';

  import { getSettings } from '@/hubs/core/stores/settings-store.svelte';
  import AnnotationSidebar from '@/hubs/media/components/AnnotationSidebar.svelte';
  import {
    buildCopyContext,
    buildPdfLink,
    createAnnotation,
    renderCopyTemplate,
  } from '@/hubs/media/services/pdf-service';
  import {
    addPdfAnnotation,
    clearPdfState,
    getAnnotationsByPage,
    getPdfAnnotations,
    isAnnotationSidebarOpen,
    loadAnnotations,
    saveAnnotations,
    setPdfAnnotations,
    setPdfViewerState,
    toggleAnnotationSidebar,
    updatePdfPage,
    updatePdfZoom,
  } from '@/hubs/media/stores/pdf-store.svelte';
  import type { PdfHighlightColor, PdfOutlineItem } from '@/hubs/media/types/pdf-types';
  import { fileName as fileBaseName } from '@/ui/panel-actions';

  let {
    filePath,
    initialPage = 1,
  }: {
    filePath: string;
    initialPage?: number;
  } = $props();

  let containerEl: HTMLDivElement | undefined = $state();
  const startPage = initialPage;
  let currentPage = $state(startPage);
  let totalPages = $state(0);
  let zoom = $state(1.0);
  let pageInput = $state(String(startPage));
  let showOutline = $state(false);
  let showColorPalette = $state(false);
  let outline = $state<PdfOutlineItem[]>([]);
  let selectedText = $state('');
  let pdfError = $state<string | null>(null);

  const settings = $derived(getSettings());
  const pdfSettings = $derived(settings.pdf);
  const highlightColors = $derived(pdfSettings.pdfHighlightColors);
  const pageAnnotations = $derived(getAnnotationsByPage(currentPage));
  const showAnnotationSidebar = $derived(isAnnotationSidebarOpen());
  const fileName = $derived(fileBaseName(filePath));
  const fileTitle = $derived(fileName.replace(/\.pdf$/i, ''));

  function goToPage(page: number) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    pageInput = String(page);
    updatePdfPage(page);
    scrollToPage(page);
  }

  function handlePageInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const page = parseInt(target.value, 10);
    if (!isNaN(page)) goToPage(page);
  }

  function handlePageKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      const page = parseInt(pageInput, 10);
      if (!isNaN(page)) goToPage(page);
    }
  }

  function zoomIn() {
    zoom = Math.min(5, zoom * 1.2);
    updatePdfZoom(zoom);
  }
  function zoomOut() {
    zoom = Math.max(0.25, zoom / 1.2);
    updatePdfZoom(zoom);
  }
  function fitWidth() {
    zoom = 1.0;
    updatePdfZoom(zoom);
  }

  function scrollToPage(_page: number) {
    containerEl?.dispatchEvent(new CustomEvent('pdf-page-change', { detail: { page: _page } }));
  }

  function handleColorClick(color: PdfHighlightColor) {
    if (!selectedText) return;
    const annotation = createAnnotation(
      'highlight',
      currentPage,
      selectedText,
      color.color,
      color.name
    );
    addPdfAnnotation(annotation);
    saveAnnotations(filePath, getPdfAnnotations());
    const ctx = buildCopyContext(
      { filePath, page: currentPage, colorName: color.name, annotation },
      selectedText
    );
    const copied = renderCopyTemplate(pdfSettings.pdfCopyTemplate, ctx);
    navigator.clipboard.writeText(copied).catch(() => {});
    showColorPalette = false;
    selectedText = '';
  }

  function handleCopyLink() {
    const link = buildPdfLink({ filePath, page: currentPage });
    navigator.clipboard.writeText(link).catch(() => {});
  }

  function toggleOutline() {
    showOutline = !showOutline;
  }

  function handleOutlineClick(item: PdfOutlineItem) {
    goToPage(item.page);
    showOutline = false;
  }

  function handleTextSelect() {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? '';
    selectedText = text;
    if (text.length > 0) showColorPalette = true;
  }

  onMount(() => {
    const stored = loadAnnotations(filePath);
    setPdfAnnotations(stored);
    setPdfViewerState({
      filePath,
      currentPage,
      totalPages: 0,
      zoom,
      spreadMode: 'none',
      sidebarView: pdfSettings.pdfSidebarDefault,
      scrollTop: 0,
    });
    document.addEventListener('selectionchange', handleTextSelect);
    return () => {
      document.removeEventListener('selectionchange', handleTextSelect);
      clearPdfState();
    };
  });
</script>

<div class="pdf-viewer" bind:this={containerEl}>
  <div class="pdf-toolbar">
    <div class="pdf-toolbar-left">
      <button
        class="pdf-btn"
        onclick={toggleOutline}
        title="Toggle Outline"
        class:active={showOutline}>☰</button
      >
      <span class="pdf-title" title={filePath}>{fileTitle}</span>
    </div>

    <div class="pdf-toolbar-center">
      <button
        class="pdf-btn"
        onclick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        title="Previous page">◀</button
      >
      <input
        class="pdf-page-input"
        type="text"
        bind:value={pageInput}
        onkeydown={handlePageKeydown}
        onchange={handlePageInput}
        title="Go to page"
        aria-label="Page number"
      />
      <span class="pdf-page-total">/ {totalPages || '?'}</span>
      <button
        class="pdf-btn"
        onclick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        title="Next page">▶</button
      >
    </div>

    <div class="pdf-toolbar-right">
      <button class="pdf-btn" onclick={zoomOut} title="Zoom out">−</button>
      <span class="pdf-zoom-label">{Math.round(zoom * 100)}%</span>
      <button class="pdf-btn" onclick={zoomIn} title="Zoom in">+</button>
      <button class="pdf-btn" onclick={fitWidth} title="Fit width">↔</button>
      <button class="pdf-btn" onclick={handleCopyLink} title="Copy link to page">🔗</button>
      <button
        class="pdf-btn"
        onclick={toggleAnnotationSidebar}
        title="Toggle Annotations"
        class:active={showAnnotationSidebar}>📝</button
      >
    </div>
  </div>

  {#if showColorPalette && selectedText}
    <div class="pdf-color-palette">
      <span class="palette-label">Highlight:</span>
      {#each highlightColors as color (color.name)}
        <button
          class="palette-swatch"
          style="background: {color.color}"
          title={color.name}
          onclick={() => handleColorClick(color)}
          aria-label="Highlight {color.name}"
        ></button>
      {/each}
      <button
        class="palette-close"
        onclick={() => {
          showColorPalette = false;
        }}>✕</button
      >
    </div>
  {/if}

  <div class="pdf-body">
    {#if showOutline}
      <aside class="pdf-outline-sidebar">
        <div class="outline-header">
          <span class="outline-title">Outline</span>
          <button class="pdf-btn small" onclick={toggleOutline}>✕</button>
        </div>
        {#if outline.length === 0}
          <div class="outline-empty">No outline available</div>
        {:else}
          <div class="outline-list">
            {#each outline as item (item.title + item.page)}
              <button
                class="outline-item"
                style="padding-left: {12 + item.level * 16}px"
                onclick={() => handleOutlineClick(item)}
              >
                <span class="outline-item-title">{item.title}</span>
                <span class="outline-item-page">{item.page}</span>
              </button>
              {#if item.children.length > 0}
                {#each item.children as child (child.title + child.page)}
                  <button
                    class="outline-item"
                    style="padding-left: {12 + child.level * 16}px"
                    onclick={() => handleOutlineClick(child)}
                  >
                    <span class="outline-item-title">{child.title}</span>
                    <span class="outline-item-page">{child.page}</span>
                  </button>
                {/each}
              {/if}
            {/each}
          </div>
        {/if}
      </aside>
    {/if}

    <div class="pdf-canvas" style="--pdf-zoom: {zoom}">
      {#if pdfError}
        <div class="pdf-error">
          <p>Failed to load PDF</p>
          <p class="pdf-error-detail">{pdfError}</p>
        </div>
      {:else}
        <div class="pdf-placeholder">
          <p class="pdf-placeholder-name">{fileName}</p>
          <p class="pdf-placeholder-info">
            Page {currentPage}{totalPages ? ` of ${totalPages}` : ''}
          </p>
          <p class="pdf-placeholder-hint">PDF rendering via @embedpdf/svelte-pdf-viewer</p>
          {#if pageAnnotations.length > 0}
            <div class="pdf-annotations-badge">
              {pageAnnotations.length} annotation{pageAnnotations.length !== 1 ? 's' : ''}
            </div>
          {/if}
        </div>
      {/if}
    </div>

    {#if showAnnotationSidebar}
      <AnnotationSidebar {filePath} {highlightColors} onGoToPage={goToPage} />
    {/if}
  </div>
</div>

<style>
  .pdf-viewer {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--color-background);
  }

  .pdf-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 10px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
    flex-shrink: 0;
    gap: 8px;
    min-height: 36px;
  }

  .pdf-toolbar-left,
  .pdf-toolbar-center,
  .pdf-toolbar-right {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .pdf-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text);
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pdf-btn {
    padding: 3px 8px;
    font-size: 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    font-family: inherit;
    line-height: 1;
  }
  .pdf-btn:hover:not(:disabled) {
    background: var(--color-surface-hover);
  }
  .pdf-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .pdf-btn.active {
    background: var(--color-accent);
    color: var(--color-background);
    border-color: var(--color-accent);
  }
  .pdf-btn.small {
    padding: 1px 5px;
    font-size: 0.6rem;
  }

  .pdf-page-input {
    width: 40px;
    padding: 2px 4px;
    font-size: 0.7rem;
    text-align: center;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
  }
  .pdf-page-input:focus {
    border-color: var(--color-accent);
    outline: none;
  }

  .pdf-page-total {
    font-size: 0.65rem;
    color: var(--color-text-muted);
  }

  .pdf-zoom-label {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    min-width: 36px;
    text-align: center;
  }

  .pdf-color-palette {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
  }

  .palette-label {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    font-weight: 500;
  }

  .palette-swatch {
    width: 20px;
    height: 20px;
    border: 2px solid transparent;
    border-radius: var(--radius-s);
    cursor: pointer;
    padding: 0;
    transition: border-color var(--transition-fast);
  }
  .palette-swatch:hover {
    border-color: var(--color-text);
  }

  .palette-close {
    padding: 1px 5px;
    font-size: 0.65rem;
    border: none;
    background: none;
    color: var(--color-text-muted);
    cursor: pointer;
    margin-left: auto;
  }

  .pdf-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .pdf-outline-sidebar {
    width: 240px;
    border-right: 1px solid var(--color-border);
    background: var(--color-surface);
    overflow-y: auto;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
  }

  .outline-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border-bottom: 1px solid var(--color-border);
  }

  .outline-title {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .outline-empty {
    padding: 24px 12px;
    text-align: center;
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }

  .outline-list {
    flex: 1;
    overflow-y: auto;
  }

  .outline-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 5px 12px;
    border: none;
    background: none;
    color: var(--color-text);
    font-size: 0.7rem;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    gap: 6px;
  }
  .outline-item:hover {
    background: var(--color-surface-hover);
  }

  .outline-item-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .outline-item-page {
    font-size: 0.6rem;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .pdf-canvas {
    flex: 1;
    overflow: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-background);
  }

  .pdf-placeholder {
    text-align: center;
    padding: 64px 32px;
    color: var(--color-text-muted);
  }

  .pdf-placeholder-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 8px;
  }

  .pdf-placeholder-info {
    font-size: 0.85rem;
    margin-bottom: 4px;
  }

  .pdf-placeholder-hint {
    font-size: 0.7rem;
    color: var(--color-text-subtle, var(--color-text-muted));
  }

  .pdf-annotations-badge {
    margin-top: 12px;
    display: inline-block;
    padding: 3px 10px;
    font-size: 0.65rem;
    background: oklch(from var(--color-accent) l c h / 0.12);
    color: var(--color-accent);
    border-radius: var(--radius-s);
  }

  .pdf-error {
    text-align: center;
    padding: 64px 32px;
    color: var(--color-error);
  }

  .pdf-error-detail {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin-top: 8px;
  }
</style>
