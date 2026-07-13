<script lang="ts">
  import {
    getSelectedElements,
    getZoom,
    updateElement,
  } from '@/hubs/canvas/stores/canvas-store.svelte';
  import type { CanvasElement } from '@/hubs/canvas/types/canvas-types';
  import {
    computeResize,
    computeRotation,
    getHandleCoords,
    getSelectionBounds,
    handleCursor,
    type BoundingBox,
    type HandlePosition,
  } from '@/hubs/canvas/services/canvas-math';

  let selected = $derived(getSelectedElements());
  let zoom = $derived(getZoom());
  let bounds = $derived(getSelectionBounds(selected));

  let resizing: { handle: HandlePosition; original: BoundingBox; origEls: CanvasElement[] } | null =
    $state(null);
  let rotating: { centerX: number; centerY: number; origEls: CanvasElement[] } | null =
    $state(null);

  const HANDLE_SIZE = 8;

  function startResize(e: PointerEvent, handle: HandlePosition) {
    if (!bounds) return;
    e.stopPropagation();
    e.preventDefault();
    resizing = {
      handle,
      original: { ...bounds },
      origEls: selected.map((el) => ({ ...el }) as CanvasElement),
    };
    window.addEventListener('pointermove', onResizeMove);
    window.addEventListener('pointerup', onResizeUp);
  }

  function onResizeMove(e: PointerEvent) {
    if (!resizing || !bounds) return;
    const dx = e.movementX / zoom;
    const dy = e.movementY / zoom;
    if (selected.length === 1) {
      const el = selected[0];
      const r = computeResize(resizing.original, resizing.handle, dx, dy, e.shiftKey);
      updateElement(el.id, {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
      } as Partial<CanvasElement>);
      resizing = { ...resizing, original: { x: r.x, y: r.y, width: r.width, height: r.height } };
    } else {
      for (const orig of resizing.origEls) {
        const r = computeResize(
          { x: orig.x, y: orig.y, width: orig.width, height: orig.height },
          resizing.handle,
          dx,
          dy,
          e.shiftKey
        );
        updateElement(orig.id, {
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
        } as Partial<CanvasElement>);
      }
      resizing = {
        ...resizing,
        origEls: resizing.origEls.map((el) => {
          const r = computeResize(
            { x: el.x, y: el.y, width: el.width, height: el.height },
            resizing!.handle,
            dx,
            dy,
            e.shiftKey
          );
          return { ...el, x: r.x, y: r.y, width: r.width, height: r.height } as CanvasElement;
        }),
      };
    }
  }

  function onResizeUp() {
    resizing = null;
    window.removeEventListener('pointermove', onResizeMove);
    window.removeEventListener('pointerup', onResizeUp);
  }

  function startRotate(e: PointerEvent) {
    if (!bounds) return;
    e.stopPropagation();
    e.preventDefault();
    rotating = {
      centerX: bounds.x + bounds.width / 2,
      centerY: bounds.y + bounds.height / 2,
      origEls: selected.map((el) => ({ ...el }) as CanvasElement),
    };
    window.addEventListener('pointermove', onRotateMove);
    window.addEventListener('pointerup', onRotateUp);
  }

  function onRotateMove(e: PointerEvent) {
    if (!rotating) return;
    const viewport = document.querySelector('.canvas-viewport') as HTMLElement;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const world = document.querySelector('.canvas-world') as HTMLElement;
    if (!world) return;
    const style = world.style.transform;
    const translateMatch = style.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
    const scaleMatch = style.match(/scale\(([^)]+)\)/);
    const panX = translateMatch ? parseFloat(translateMatch[1]) : 0;
    const panY = translateMatch ? parseFloat(translateMatch[2]) : 0;
    const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
    const pointerX = (e.clientX - rect.left - panX) / scale;
    const pointerY = (e.clientY - rect.top - panY) / scale;
    const deg = computeRotation(rotating.centerX, rotating.centerY, pointerX, pointerY, e.shiftKey);
    for (const el of selected) {
      updateElement(el.id, { rotation: deg } as Partial<CanvasElement>);
    }
  }

  function onRotateUp() {
    rotating = null;
    window.removeEventListener('pointermove', onRotateMove);
    window.removeEventListener('pointerup', onRotateUp);
  }
</script>

{#if bounds && selected.length > 0}
  <svg class="selection-overlay" xmlns="http://www.w3.org/2000/svg">
    <!-- Selection bounding box -->
    <rect
      x={bounds.x}
      y={bounds.y}
      width={bounds.width}
      height={bounds.height}
      fill="none"
      stroke="var(--color-accent)"
      stroke-width={1 / zoom}
      stroke-dasharray="{4 / zoom} {3 / zoom}"
    />

    <!-- Resize handles -->
    {#each getHandleCoords(bounds) as h (h.handle)}
      <rect
        class="handle resize-handle"
        x={h.x - HANDLE_SIZE / 2 / zoom}
        y={h.y - HANDLE_SIZE / 2 / zoom}
        width={HANDLE_SIZE / zoom}
        height={HANDLE_SIZE / zoom}
        fill="white"
        stroke="var(--color-accent)"
        stroke-width={1.5 / zoom}
        style="cursor: {handleCursor(h.handle)}"
        onpointerdown={(e) => startResize(e, h.handle)}
        role="button"
        tabindex="0"
        aria-label="Resize {h.handle}"
      />
    {/each}

    <!-- Rotation handle -->
    <line
      x1={bounds.x + bounds.width / 2}
      y1={bounds.y}
      x2={bounds.x + bounds.width / 2}
      y2={bounds.y - 24 / zoom}
      stroke="var(--color-accent)"
      stroke-width={1 / zoom}
    />
    <circle
      class="handle rotate-handle"
      cx={bounds.x + bounds.width / 2}
      cy={bounds.y - 24 / zoom}
      r={5 / zoom}
      fill="white"
      stroke="var(--color-accent)"
      stroke-width={1.5 / zoom}
      style="cursor: grab"
      onpointerdown={startRotate}
      role="button"
      tabindex="0"
      aria-label="Rotate"
    />
  </svg>
{/if}

<style>
  .selection-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100000px;
    height: 100000px;
    pointer-events: none;
    overflow: visible;
  }
  .handle {
    pointer-events: auto;
  }
</style>
