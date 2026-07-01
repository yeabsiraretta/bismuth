<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    marpPreviewState, activeSlideIndex, slideCount, currentSlide,
    isPresenting, closeMarpPreview, nextMarpSlide, prevMarpSlide,
    goToMarpSlide, startMarpPresentation, stopMarpPresentation,
  } from '../stores/marpStore';
  import { renderPresentation } from '../services/marpRenderer';
  import { getMarpExportCommand } from '../services/marpRenderer';

  let slideContainer: HTMLDivElement;

  $: pres = $marpPreviewState.presentation;
  $: slide = $currentSlide;
  $: total = $slideCount;
  $: idx = $activeSlideIndex;
  $: presenting = $isPresenting;

  function handleKeydown(e: KeyboardEvent) {
    if (!pres) return;
    switch (e.key) {
      case 'ArrowRight': case ' ': e.preventDefault(); nextMarpSlide(); break;
      case 'ArrowLeft': e.preventDefault(); prevMarpSlide(); break;
      case 'Escape': e.preventDefault(); presenting ? stopMarpPresentation() : closeMarpPreview(); break;
      case 'Home': e.preventDefault(); goToMarpSlide(0); break;
      case 'End': e.preventDefault(); goToMarpSlide(total - 1); break;
      case 'f': case 'F': if (!e.metaKey && !e.ctrlKey) { e.preventDefault(); toggleFullscreen(); } break;
    }
  }

  function toggleFullscreen() {
    if (presenting) stopMarpPresentation();
    else startMarpPresentation();
  }

  function handleExport() {
    if (!pres) return;
    const html = renderPresentation(pres, true);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pres.notePath.replace(/\.md$/, '') || 'slides'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  onMount(() => { window.addEventListener('keydown', handleKeydown); });
  onDestroy(() => { window.removeEventListener('keydown', handleKeydown); });
</script>

{#if pres}
  <div class="marp-preview" class:fullscreen={presenting}>
    {#if !presenting}
      <div class="marp-toolbar">
        <button class="marp-btn" on:click={closeMarpPreview} title="Close">✕</button>
        <span class="slide-counter">{idx + 1} / {total}</span>
        <div class="marp-nav">
          <button class="marp-btn" on:click={prevMarpSlide} disabled={idx === 0} title="Previous">◀</button>
          <button class="marp-btn" on:click={nextMarpSlide} disabled={idx >= total - 1} title="Next">▶</button>
        </div>
        <div class="marp-spacer"></div>
        <button class="marp-btn" on:click={startMarpPresentation} title="Present (F)">⛶</button>
        <button class="marp-btn" on:click={handleExport} title="Export HTML">⤓</button>
      </div>
    {/if}

    <div class="slide-viewport" bind:this={slideContainer}>
      {#if slide}
        <div
          class="slide-frame"
          class:fade={slide.transition === 'fade'}
          style="{pres.globalDirectives.backgroundColor ? `background-color: ${pres.globalDirectives.backgroundColor};` : ''}"
        >
          {#if pres.globalDirectives.header}
            <div class="slide-header">{pres.globalDirectives.header}</div>
          {/if}

          <div class="slide-content">
            {@html slide.html}
          </div>

          {#if pres.globalDirectives.footer || pres.globalDirectives.paginate}
            <div class="slide-footer">
              <span class="footer-text">{pres.globalDirectives.footer}</span>
              {#if pres.globalDirectives.paginate}
                <span class="page-number">{idx + 1} / {total}</span>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>

    {#if !presenting && total > 1}
      <div class="slide-thumbnails">
        {#each pres.slides as s, i}
          <button
            class="thumb"
            class:active={i === idx}
            on:click={() => goToMarpSlide(i)}
            title="Slide {i + 1}"
          >
            <span class="thumb-num">{i + 1}</span>
          </button>
        {/each}
      </div>
    {/if}

    {#if presenting}
      <div class="presentation-controls">
        <button class="marp-btn" on:click={prevMarpSlide} disabled={idx === 0}>◀</button>
        <span class="slide-counter-present">{idx + 1} / {total}</span>
        <button class="marp-btn" on:click={nextMarpSlide} disabled={idx >= total - 1}>▶</button>
        <button class="marp-btn exit-btn" on:click={stopMarpPresentation}>Exit</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .marp-preview {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--background-primary);
    border-left: 1px solid var(--border-color);
    overflow: hidden;
  }
  .marp-preview.fullscreen {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: #1e1e2e;
    border: none;
  }

  .marp-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--background-secondary);
    border-bottom: 1px solid var(--border-color);
    font-size: 12px;
  }
  .marp-nav { display: flex; gap: 4px; }
  .marp-spacer { flex: 1; }
  .slide-counter { color: var(--text-muted); font-variant-numeric: tabular-nums; }

  .marp-btn {
    padding: 4px 8px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--background-primary);
    color: var(--text-normal);
    cursor: pointer;
    font-size: 12px;
    line-height: 1;
  }
  .marp-btn:disabled { opacity: 0.4; cursor: default; }
  .marp-btn:hover:not(:disabled) { background: var(--background-modifier-hover); }

  .slide-viewport {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    overflow: hidden;
  }

  .slide-frame {
    width: 100%;
    max-width: 960px;
    aspect-ratio: 16 / 9;
    background: #1e1e2e;
    color: #cdd6f4;
    border-radius: 8px;
    padding: 40px 56px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    position: relative;
  }
  .fullscreen .slide-frame {
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
    padding: 48px 64px;
  }
  .slide-frame.fade { animation: fadeSlide 0.3s ease-in; }
  @keyframes fadeSlide { from { opacity: 0; } to { opacity: 1; } }

  .slide-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: auto;
  }
  .slide-content :global(h1) { font-size: 2em; margin-bottom: 0.5em; color: #89b4fa; }
  .slide-content :global(h2) { font-size: 1.6em; margin-bottom: 0.4em; color: #a6e3a1; }
  .slide-content :global(h3) { font-size: 1.3em; margin-bottom: 0.3em; color: #f9e2af; }
  .slide-content :global(p) { font-size: 1.1em; line-height: 1.6; margin-bottom: 0.5em; }
  .slide-content :global(ul) { padding-left: 1.5em; font-size: 1.05em; line-height: 1.7; }
  .slide-content :global(li) { margin-bottom: 0.2em; }
  .slide-content :global(code) { background: #313244; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
  .slide-content :global(img) { max-width: 80%; max-height: 50vh; margin: 0 auto; border-radius: 8px; }
  .slide-content :global(strong) { color: #f38ba8; }

  .slide-header { font-size: 0.85em; color: #6c7086; padding-bottom: 8px; border-bottom: 1px solid #313244; margin-bottom: 12px; }
  .slide-footer { display: flex; justify-content: space-between; font-size: 0.75em; color: #6c7086; padding-top: 8px; border-top: 1px solid #313244; margin-top: auto; }

  .slide-thumbnails {
    display: flex; gap: 4px; padding: 8px 12px;
    background: var(--background-secondary);
    border-top: 1px solid var(--border-color);
    overflow-x: auto;
  }
  .thumb {
    width: 40px; height: 24px;
    border: 2px solid transparent;
    border-radius: 3px;
    background: var(--background-primary);
    color: var(--text-muted);
    font-size: 10px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }
  .thumb.active { border-color: var(--interactive-accent); }
  .thumb:hover { background: var(--background-modifier-hover); }

  .presentation-controls {
    position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 8px; align-items: center;
    background: rgba(30,30,46,0.9); padding: 8px 16px;
    border-radius: 8px; z-index: 10000;
    opacity: 0.3; transition: opacity 0.2s;
  }
  .presentation-controls:hover { opacity: 1; }
  .slide-counter-present { color: #cdd6f4; font-size: 13px; font-variant-numeric: tabular-nums; }
  .exit-btn { background: #f38ba8; color: #1e1e2e; border-color: #f38ba8; }
</style>
