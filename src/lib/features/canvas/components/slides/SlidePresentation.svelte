<script lang="ts">
  /**
   * SlidePresentation — Fullscreen presentation wrapper (Spec 043, Phase 4).
   *
   * Wraps FlowPreview.svelte via component composition (no modifications to
   * FlowPreview). Layout: fullscreen slide (left) + PresenterSidebar (right).
   * Keyboard: Space/ArrowRight=next, ArrowLeft=prev, Escape=exit, F=fullscreen.
   */
  import { onMount, onDestroy } from 'svelte';
  import FlowPreview from '@/features/canvas/components/flow/FlowPreview.svelte';
  import PresenterSidebar from '@/features/canvas/components/slides/PresenterSidebar.svelte';
  import { currentCanvas } from '@/features/canvas/stores';
  import {
    activeSlideFrameId,
    presenterElapsedMs,
    goToSlide,
    nextSlide,
    prevSlide,
    stopPresentation,
    resetTimer,
  } from '@/features/canvas/stores';
  import {
    getSlideMetadata,
    defaultSlideMetadata,
    resolveTransitionClass,
    updateSlideMetadata,
  } from '@/features/canvas/utils';
  import { log } from '@/utils/logger';

  export let show = false;

  let rightPanelVisible = true;
  let transitionClass = '';
  let transitionTimer: ReturnType<typeof setTimeout> | null = null;

  $: doc = $currentCanvas;
  $: frameId = $activeSlideFrameId ?? '';
  $: meta = doc
    ? (getSlideMetadata(doc, frameId) ?? defaultSlideMetadata(frameId))
    : defaultSlideMetadata('');
  $: notes = meta.speakerNotes;
  $: elapsedMs = $presenterElapsedMs;
  $: elapsedFormatted = formatElapsed(elapsedMs);

  $: if (frameId && doc) applyTransition(meta);

  function formatElapsed(ms: number): string {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  function applyTransition(slideMeta: typeof meta) {
    const cls = resolveTransitionClass(slideMeta.transitionType);
    if (!cls) return;
    transitionClass = cls;
    if (transitionTimer) clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => { transitionClass = ''; }, slideMeta.transitionDuration + 50);
  }

  function handleSelectSlide(detail: { frameId: string }) {
    if (!doc) return;
    goToSlide(doc, detail.frameId);
  }

  function handleUpdateNotes(detail: { frameId: string; notes: string }) {
    if (!doc) return;
    const updated = updateSlideMetadata(doc, detail.frameId, { speakerNotes: detail.notes });
    currentCanvas.set(updated);
    log.debug('SlidePresentation: notes updated', { frameId: detail.frameId });
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!show) return;
    switch (e.key) {
      case ' ': case 'ArrowRight': e.preventDefault(); if (doc) nextSlide(doc); break;
      case 'ArrowLeft': e.preventDefault(); if (doc) prevSlide(doc); break;
      case 'Escape': e.preventDefault(); exitPresentation(); break;
      case 'f': case 'F': e.preventDefault(); toggleFullscreen(); break;
    }
  }

  function exitPresentation() {
    stopPresentation();
    show = false;
    log.interaction('ui', 'slides:presentation:exit');
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  }

  onMount(() => { window.addEventListener('keydown', handleKeydown); });
  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
    if (transitionTimer) clearTimeout(transitionTimer);
  });
</script>

{#if show && doc}
  <div class="slide-presentation" role="main" aria-label="Slide presentation">
    <!-- Slide stage (left) -->
    <div class="slide-stage">
      <div
        class="slide-frame-wrapper {transitionClass}"
        style="--slide-transition-duration: {meta.transitionDuration}ms;"
      >
        <FlowPreview bind:show onExit={exitPresentation} />
      </div>
      <div class="slide-indicator" aria-live="polite">
        {#if doc.slideMetadata}
          Slide {(doc.slideMetadata.findIndex(m => m.frameId === frameId) + 1)} of {doc.slideMetadata.length}
        {/if}
      </div>
    </div>

    <!-- Presenter sidebar (right) -->
    {#if rightPanelVisible}
      <PresenterSidebar
        {doc}
        {frameId}
        {notes}
        {elapsedFormatted}
        onResetTimer={resetTimer}
        onSelectSlide={handleSelectSlide}
        onUpdateNotes={handleUpdateNotes}
        onCollapse={() => (rightPanelVisible = false)}
      />
    {:else}
      <button
        class="expand-panel-btn"
        on:click={() => (rightPanelVisible = true)}
        title="Show presenter panel"
        aria-label="Expand presenter panel"
      >&lsaquo;</button>
    {/if}
  </div>
{/if}

<style>
  .slide-presentation {
    position: fixed;
    inset: 0;
    display: flex;
    z-index: 3000;
    background: #000;
  }

  .slide-stage {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .slide-frame-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.slide-enter-fade) { animation: slideEnterFade var(--slide-transition-duration, 300ms) ease forwards; }
  :global(.slide-enter-slide-left) { animation: slideEnterLeft var(--slide-transition-duration, 300ms) ease forwards; }
  :global(.slide-enter-slide-right) { animation: slideEnterRight var(--slide-transition-duration, 300ms) ease forwards; }
  :global(.slide-enter-scale) { animation: slideEnterScale var(--slide-transition-duration, 300ms) ease forwards; }

  @keyframes slideEnterFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideEnterLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
  @keyframes slideEnterRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  @keyframes slideEnterScale { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

  .slide-indicator {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    background: rgba(0, 0, 0, 0.5);
    padding: 3px 10px;
    border-radius: var(--radius-m, 6px);
    user-select: none;
    pointer-events: none;
  }

  .expand-panel-btn {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-right: none;
    border-radius: var(--radius-s, 3px) 0 0 var(--radius-s, 3px);
    color: var(--text-muted);
    font-size: 18px;
    padding: 8px 4px;
    cursor: pointer;
    z-index: 3001;
  }

  .expand-panel-btn:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  @media print {
    .expand-panel-btn,
    .slide-indicator { display: none; }
    .slide-presentation { position: static; }
    .slide-stage { page-break-after: always; }
  }
</style>
