<script lang="ts">
  import { currentCanvas, viewport } from '@/features/canvas/stores';
  import type { CanvasElement } from '@/features/canvas/types';
  import {
    calculateMinimapBounds,
    viewportToMinimap,
    minimapToViewport,
    type MinimapBounds,
  } from './minimapLogic';

  export let canvasWidth = 800;
  export let canvasHeight = 600;

  const MINIMAP_W = 180;
  const MINIMAP_H = 120;

  let collapsed = false;
  let isDragging = false;
  let minimapEl: HTMLDivElement;

  $: elements = $currentCanvas?.elements ?? [];
  $: bounds = calculateMinimapBounds(elements);
  $: vpRect = bounds
    ? viewportToMinimap(
        $viewport,
        bounds,
        { width: MINIMAP_W, height: MINIMAP_H },
        { width: canvasWidth, height: canvasHeight }
      )
    : null;

  function getElementScale(bounds: MinimapBounds): number {
    const sx = MINIMAP_W / bounds.width;
    const sy = MINIMAP_H / bounds.height;
    return Math.min(sx, sy);
  }

  function getElementRect(el: CanvasElement, b: MinimapBounds) {
    const s = getElementScale(b);
    const ox = (MINIMAP_W - b.width * s) / 2;
    const oy = (MINIMAP_H - b.height * s) / 2;
    return {
      x: ox + (el.x - b.minX) * s,
      y: oy + (el.y - b.minY) * s,
      w: el.width * s,
      h: el.height * s,
    };
  }

  function navigateTo(clientX: number, clientY: number) {
    if (!bounds || !minimapEl) return;
    const rect = minimapEl.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const target = minimapToViewport(
      localX,
      localY,
      bounds,
      { width: MINIMAP_W, height: MINIMAP_H },
      { width: canvasWidth, height: canvasHeight },
      $viewport.scale
    );
    viewport.set({ ...$viewport, x: target.x, y: target.y });
  }

  function onMinimapClick(e: MouseEvent) {
    if (isDragging) return;
    navigateTo(e.clientX, e.clientY);
  }

  function onPointerDown(e: PointerEvent) {
    isDragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging) return;
    navigateTo(e.clientX, e.clientY);
  }

  function onPointerUp(e: PointerEvent) {
    isDragging = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }
</script>

{#if elements.length > 5}
  <div class="minimap-wrapper" class:collapsed>
    <button
      class="minimap-toggle"
      on:click={() => (collapsed = !collapsed)}
      aria-label="Toggle minimap"
    >
      {collapsed ? '◱' : '◳'}
    </button>

    {#if !collapsed && bounds}
      <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
      <div
        class="minimap-canvas"
        bind:this={minimapEl}
        on:click={onMinimapClick}
        on:pointerdown={onPointerDown}
        on:pointermove={onPointerMove}
        on:pointerup={onPointerUp}
        style="width:{MINIMAP_W}px;height:{MINIMAP_H}px"
      >
        <svg width={MINIMAP_W} height={MINIMAP_H}>
          {#each elements as el (el.id)}
            {@const r = getElementRect(el, bounds)}
            <rect
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              fill="var(--text-muted)"
              opacity="0.3"
              rx="1"
            />
          {/each}

          {#if vpRect}
            <rect
              x={vpRect.x}
              y={vpRect.y}
              width={vpRect.width}
              height={vpRect.height}
              fill="none"
              stroke="var(--interactive-accent)"
              stroke-width="1.5"
              rx="2"
            />
          {/if}
        </svg>
      </div>
    {/if}
  </div>
{/if}

<style>
  .minimap-wrapper {
    position: absolute;
    bottom: 12px;
    right: 12px;
    z-index: var(--layer-overlay, 50);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }
  .minimap-toggle {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s, 4px);
    color: var(--text-muted);
    font-size: 14px;
    width: 26px;
    height: 26px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .minimap-toggle:hover {
    background: var(--color-surface-hover);
  }
  .minimap-canvas {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s, 4px);
    cursor: crosshair;
    overflow: hidden;
  }
  .collapsed .minimap-canvas {
    display: none;
  }
</style>
