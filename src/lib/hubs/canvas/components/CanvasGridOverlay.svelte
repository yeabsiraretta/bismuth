<script lang="ts">
  import type { GridConfig } from '@/hubs/canvas/services/canvas-grid';

  let {
    grid,
    panX,
    panY,
    zoom,
  }: {
    grid: GridConfig;
    panX: number;
    panY: number;
    zoom: number;
  } = $props();

  let patternId = 'canvas-grid-pattern';
  let scaledSize = $derived(grid.size * zoom);
  let offsetX = $derived(panX % scaledSize);
  let offsetY = $derived(panY % scaledSize);
</script>

{#if grid.enabled}
  <svg class="grid-overlay" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern
        id={patternId}
        width={scaledSize}
        height={scaledSize}
        patternUnits="userSpaceOnUse"
        x={offsetX}
        y={offsetY}
      >
        <circle
          cx={scaledSize / 2}
          cy={scaledSize / 2}
          r={1.2}
          fill={grid.color}
          opacity={grid.opacity}
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#{patternId})" />
  </svg>
{/if}

<style>
  .grid-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
</style>
