<script lang="ts">
  import { currentCanvas, viewport } from '@/stores/canvas/canvasStore';
  import type { CanvasElement, FlowLink } from '@/types/canvas';

  $: flowLinks = $currentCanvas?.flowLinks ?? [];
  $: elements = $currentCanvas?.elements ?? [];

  function getFrameCenter(frameId: string): { x: number; y: number } | null {
    const el = elements.find((e: CanvasElement) => e.id === frameId);
    if (!el) return null;
    return {
      x: el.x + el.width / 2,
      y: el.y + el.height / 2,
    };
  }

  function getFrameEdge(
    frameId: string,
    targetX: number,
    targetY: number
  ): { x: number; y: number } | null {
    const el = elements.find((e: CanvasElement) => e.id === frameId);
    if (!el) return null;

    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    const dx = targetX - cx;
    const dy = targetY - cy;

    const scaleX = Math.abs(dx) > 0 ? (el.width / 2) / Math.abs(dx) : Infinity;
    const scaleY = Math.abs(dy) > 0 ? (el.height / 2) / Math.abs(dy) : Infinity;
    const scale = Math.min(scaleX, scaleY, 1);

    return {
      x: cx + dx * scale,
      y: cy + dy * scale,
    };
  }

  interface LinkPath {
    link: FlowLink;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }

  $: linkPaths = flowLinks
    .map((link: FlowLink): LinkPath | null => {
      const fromCenter = getFrameCenter(link.fromFrameId);
      const toCenter = getFrameCenter(link.toFrameId);
      if (!fromCenter || !toCenter) return null;

      const fromEdge = getFrameEdge(link.fromFrameId, toCenter.x, toCenter.y);
      const toEdge = getFrameEdge(link.toFrameId, fromCenter.x, fromCenter.y);
      if (!fromEdge || !toEdge) return null;

      return { link, x1: fromEdge.x, y1: fromEdge.y, x2: toEdge.x, y2: toEdge.y };
    })
    .filter((p): p is LinkPath => p !== null);
</script>

{#if linkPaths.length > 0}
  <svg
    class="flow-overlay"
    style="transform: translate({$viewport.x}px, {$viewport.y}px) scale({$viewport.scale})"
  >
    <defs>
      <marker
        id="flow-arrow"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#7c3aed" />
      </marker>
    </defs>

    {#each linkPaths as { link, x1, y1, x2, y2 } (link.id)}
      <line
        {x1}
        {y1}
        {x2}
        {y2}
        stroke="#7c3aed"
        stroke-width={2 / $viewport.scale}
        marker-end="url(#flow-arrow)"
      />
      {#if link.label}
        <text
          x={(x1 + x2) / 2}
          y={(y1 + y2) / 2 - 8}
          text-anchor="middle"
          fill="#7c3aed"
          font-size={11 / $viewport.scale}
        >
          {link.label}
        </text>
      {/if}
    {/each}
  </svg>
{/if}

<style>
  .flow-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: visible;
    transform-origin: 0 0;
  }
</style>
