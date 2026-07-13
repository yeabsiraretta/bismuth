<script lang="ts">
  import { getActiveNotePath } from '@/hubs/core/stores/vault-store.svelte';
  import { getCachedContent } from '@/hubs/editor/services/file-ops';
  import { getActiveTab } from '@/hubs/editor/stores/editor-tabs.svelte';
  import { flattenOutline, findOutlineItemByPage } from '@/hubs/media/services/pdf-service';
  import { getPdfOutline, getPdfViewerState } from '@/hubs/media/stores/pdf-store.svelte';
  import type { PdfOutlineItem } from '@/hubs/media/types/pdf-types';
  import ContextMenu from '@/ui/context-menu.svelte';
  import Panel from '@/ui/panel.svelte';

  let activeTab = $derived(getActiveTab());
  let isPdf = $derived(activeTab?.kind === 'pdf');

  // ── Markdown outline ───────────────────────────────────────────────────────
  let notePath = $derived(getActiveNotePath());
  let content = $derived(notePath ? (getCachedContent(notePath) ?? '') : '');

  let allExpanded = $state(true);

  interface HeadingItem {
    level: number;
    text: string;
    line: number;
  }

  let allHeadings = $derived(extractHeadings(content));
  let headings = $derived(allExpanded ? allHeadings : allHeadings.filter((h) => h.level <= 2));

  function extractHeadings(src: string): HeadingItem[] {
    const lines = src.split('\n');
    const items: HeadingItem[] = [];
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^(#{1,6})\s+(.+)/);
      if (match) {
        items.push({ level: match[1].length, text: match[2], line: i });
      }
    }
    return items;
  }

  function scrollToLine(line: number) {
    window.dispatchEvent(new CustomEvent('editor-scroll-to-line', { detail: { line } }));
  }

  // ── PDF outline ────────────────────────────────────────────────────────────
  let pdfOutline = $derived(getPdfOutline());
  let pdfViewerState = $derived(getPdfViewerState());
  let flatPdfOutline = $derived(flattenOutline(pdfOutline));
  let activePdfItem = $derived(
    pdfViewerState ? findOutlineItemByPage(pdfOutline, pdfViewerState.currentPage) : null
  );

  function goToPdfPage(item: PdfOutlineItem) {
    window.dispatchEvent(new CustomEvent('pdf-navigate', { detail: { page: item.page } }));
  }

  // ── Context menu ───────────────────────────────────────────────────────────
  let ctxHeading: HeadingItem | null = $state(null);
  let ctxX = $state(0);
  let ctxY = $state(0);

  function handleContext(e: MouseEvent, h: HeadingItem) {
    e.preventDefault();
    ctxHeading = h;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }

  function closeCtx() {
    ctxHeading = null;
  }
</script>

<Panel title="Outline">
  {#snippet actions()}
    {#if !isPdf}
      <button
        class="panel-action"
        title={allExpanded ? 'Collapse' : 'Expand'}
        onclick={() => (allExpanded = !allExpanded)}
      >
        {allExpanded ? '−' : '+'}
      </button>
    {/if}
  {/snippet}

  {#if isPdf}
    {#if flatPdfOutline.length === 0}
      <div class="panel-empty">No outline available</div>
    {:else}
      <ul class="heading-list">
        {#each flatPdfOutline as item (item.title + item.page)}
          <li class="heading-item" style="padding-left: {item.level * 12}px">
            <button
              class="heading-btn"
              class:active-pdf-item={activePdfItem?.title === item.title &&
                activePdfItem?.page === item.page}
              onclick={() => goToPdfPage(item)}
            >
              <span class="heading-level">p{item.page}</span>
              <span class="heading-text">{item.title}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  {:else if !content}
    <div class="panel-empty">No note open</div>
  {:else if headings.length === 0}
    <div class="panel-empty">No headings found</div>
  {:else}
    <ul class="heading-list">
      {#each headings as h (h.line)}
        <li class="heading-item" style="padding-left: {(h.level - 1) * 12}px">
          <button
            class="heading-btn"
            onclick={() => scrollToLine(h.line)}
            oncontextmenu={(e) => handleContext(e, h)}
          >
            <span class="heading-level">H{h.level}</span>
            <span class="heading-text">{h.text}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</Panel>

<ContextMenu x={ctxX} y={ctxY} show={!!ctxHeading} onclose={closeCtx}>
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxHeading) scrollToLine(ctxHeading.line);
      closeCtx();
    }}
    role="menuitem">Go to Line</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxHeading) navigator.clipboard.writeText(ctxHeading.text);
      closeCtx();
    }}
    role="menuitem">Copy Heading</button
  >
</ContextMenu>

<style>
  .heading-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .heading-item {
    margin: 0;
  }
  .heading-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 3px 6px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: var(--radius-s);
    font-size: 0.75rem;
    color: var(--color-text);
    text-align: left;
    font-family: inherit;
    outline: none;
  }
  .heading-btn:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  .heading-btn:hover {
    background: var(--color-surface-hover);
  }
  .heading-btn.active-pdf-item {
    background: oklch(from var(--color-accent) l c h / 0.1);
    color: var(--color-accent);
  }
  .heading-level {
    font-size: 0.6rem;
    font-weight: 600;
    color: var(--color-text-muted);
    background: var(--color-surface);
    padding: 0 4px;
    border-radius: var(--radius-s);
    min-width: 18px;
    text-align: center;
    flex-shrink: 0;
  }
  .heading-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
