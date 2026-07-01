<script lang="ts">
  /**
   * SlideThumbnailStrip — Vertical list of slide thumbnails (Spec 043, Phase 2).
   *
   * Props:
   *   - doc: CanvasDocument — the active canvas/slides document
   *   - activeFrameId: string — currently active slide frame ID
   *
   * Emits:
   *   - select-slide: { frameId: string } — user clicked or pressed Enter on a thumbnail
   */
  import type { CanvasDocument } from '@/features/canvas/types/document';
  import {
    getFramesAsSlides,
    getSlideOrder,
    resolveTransitionClass,
  } from '@/features/canvas/utils';
  import { log } from '@/utils/logger';

  export let doc: CanvasDocument;
  export let activeFrameId = '';
  export let onSelectSlide: ((detail: { frameId: string }) => void) | undefined = undefined;

  $: slides = getFramesAsSlides(doc);
  $: slideOrder = getSlideOrder(doc);

  // ─── Navigation ──────────────────────────────────────────────────────────
  function selectSlide(frameId: string) {
    log.debug('SlideThumbnailStrip: select-slide', { frameId });
    onSelectSlide?.({ frameId });
  }

  // ─── Keyboard navigation within the strip ────────────────────────────────
  let focusedIndex = 0;
  let thumbnailEls: HTMLButtonElement[] = [];

  $: {
    focusedIndex = slideOrder.indexOf(activeFrameId);
    if (focusedIndex < 0) focusedIndex = 0;
  }

  function handleKeydown(e: KeyboardEvent, index: number) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(index + 1, slides.length - 1);
      focusedIndex = next;
      thumbnailEls[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(index - 1, 0);
      focusedIndex = prev;
      thumbnailEls[prev]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectSlide(slides[index].frame.id);
    }
  }

  // Thumbnail colour derived from frame fill (or a default colour)
  function frameColor(fill?: string): string {
    return fill || 'var(--background-secondary)';
  }
</script>

<div
  class="thumbnail-strip"
  role="listbox"
  aria-label="Slide thumbnails"
  aria-orientation="vertical"
>
  {#each slides as { frame, meta }, index (frame.id)}
    <button
      class="thumbnail"
      class:active={frame.id === activeFrameId}
      role="option"
      aria-selected={frame.id === activeFrameId}
      tabindex={index === focusedIndex ? 0 : -1}
      bind:this={thumbnailEls[index]}
      on:click={() => selectSlide(frame.id)}
      on:keydown={(e) => handleKeydown(e, index)}
      title={frame.name ?? `Slide ${index + 1}`}
    >
      <!-- Slide number badge -->
      <span class="slide-number">{index + 1}</span>

      <!-- Mini preview rect -->
      <div
        class="slide-preview"
        style="background: {frameColor(frame.properties.fill)};"
        aria-hidden="true"
      >
        <span class="slide-name">{frame.name ?? `Slide ${index + 1}`}</span>
        {#if meta.transitionType !== 'instant'}
          <span class="transition-badge" title="Transition: {meta.transitionType}">
            {resolveTransitionClass(meta.transitionType) ? meta.transitionType[0].toUpperCase() : ''}
          </span>
        {/if}
      </div>
    </button>
  {/each}

  {#if slides.length === 0}
    <div class="no-slides">
      <span>No frames in this document.</span>
      <span>Add frames to create slides.</span>
    </div>
  {/if}
</div>

<style>
  .thumbnail-strip {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 6px;
    overflow-y: auto;
    height: 100%;
    background: var(--background-secondary);
    min-width: 120px;
    max-width: 160px;
  }

  .thumbnail {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 4px;
    background: transparent;
    border: 2px solid transparent;
    border-radius: var(--radius-m, 6px);
    cursor: pointer;
    transition: border-color 0.12s;
    width: 100%;
  }

  .thumbnail:hover {
    border-color: var(--background-modifier-border);
  }

  .thumbnail.active {
    border-color: var(--interactive-accent);
    background: var(--color-selection-bg, rgba(var(--interactive-accent-rgb), 0.1));
  }

  .thumbnail:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 2px;
  }

  .slide-number {
    font-size: 10px;
    color: var(--text-muted);
    user-select: none;
    align-self: flex-start;
    line-height: 1;
  }

  .slide-preview {
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: var(--radius-s, 3px);
    border: 1px solid var(--background-modifier-border);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .slide-name {
    font-size: 9px;
    color: var(--text-muted);
    text-align: center;
    padding: 2px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .transition-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 8px;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-radius: 2px;
    padding: 0 3px;
    line-height: 1.5;
  }

  .no-slides {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 4px;
    color: var(--text-faint);
    font-size: 11px;
    text-align: center;
    padding: 8px;
  }
</style>
