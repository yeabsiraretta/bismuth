<script lang="ts">
  import type { BoundingBox } from '@/hubs/canvas/services/canvas-math';
  import type { Point } from '@/hubs/canvas/services/canvas-connections';

  let {
    drawPreview,
    drawStart,
    connectSource,
    connectPreview,
    marquee,
    zoom,
    toolMode,
  }: {
    drawPreview: BoundingBox | null;
    drawStart: { x: number; y: number } | null;
    connectSource: { elId: string; point: Point } | null;
    connectPreview: Point | null;
    marquee: BoundingBox | null;
    zoom: number;
    toolMode: string;
  } = $props();
</script>

{#if drawPreview && drawStart}
  <svg class="overlay-layer" xmlns="http://www.w3.org/2000/svg">
    {#if toolMode === 'ellipse'}
      <ellipse
        cx={drawPreview.x + drawPreview.width / 2}
        cy={drawPreview.y + drawPreview.height / 2}
        rx={drawPreview.width / 2}
        ry={drawPreview.height / 2}
        fill="none"
        stroke="var(--color-accent)"
        stroke-width={1.5 / zoom}
        stroke-dasharray="{4 / zoom} {3 / zoom}"
      />
    {:else if toolMode === 'line'}
      <line
        x1={drawStart.x}
        y1={drawStart.y}
        x2={drawStart.x + drawPreview.width}
        y2={drawStart.y + drawPreview.height}
        stroke="var(--color-accent)"
        stroke-width={1.5 / zoom}
        stroke-dasharray="{4 / zoom} {3 / zoom}"
      />
    {:else}
      <rect
        x={drawPreview.x}
        y={drawPreview.y}
        width={drawPreview.width}
        height={drawPreview.height}
        fill="none"
        stroke="var(--color-accent)"
        stroke-width={1.5 / zoom}
        stroke-dasharray="{4 / zoom} {3 / zoom}"
      />
    {/if}
  </svg>
{/if}

{#if connectSource && connectPreview}
  <svg class="overlay-layer" xmlns="http://www.w3.org/2000/svg">
    <line
      x1={connectSource.point.x}
      y1={connectSource.point.y}
      x2={connectPreview.x}
      y2={connectPreview.y}
      stroke="var(--color-accent)"
      stroke-width={2 / zoom}
      stroke-dasharray="{6 / zoom} {4 / zoom}"
    />
  </svg>
{/if}

{#if marquee}
  <svg class="overlay-layer" xmlns="http://www.w3.org/2000/svg">
    <rect
      x={marquee.x}
      y={marquee.y}
      width={marquee.width}
      height={marquee.height}
      fill="oklch(from var(--color-accent) l c h / 0.08)"
      stroke="var(--color-accent)"
      stroke-width={1 / zoom}
      stroke-dasharray="{4 / zoom} {3 / zoom}"
    />
  </svg>
{/if}
