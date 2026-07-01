<script lang="ts">
  import { currentCanvas, viewport, viewMode } from '@/features/canvas/stores';
  import type { CanvasElement, FlowLink } from '@/features/canvas/types';

  $: frames = ($currentCanvas?.elements ?? []).filter(
    (e: CanvasElement) => e.element_type === 'frame' || e.element_type === 'screen'
  );
  $: flowLinks = $currentCanvas?.flowLinks ?? [];

  $: boundingBox = (() => {
    if (frames.length === 0) return { x: 0, y: 0, width: 800, height: 600 };
    const minX = Math.min(...frames.map((f: CanvasElement) => f.x));
    const minY = Math.min(...frames.map((f: CanvasElement) => f.y));
    const maxX = Math.max(...frames.map((f: CanvasElement) => f.x + f.width));
    const maxY = Math.max(...frames.map((f: CanvasElement) => f.y + f.height));
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  })();

  function handleFrameDoubleClick(frame: CanvasElement) {
    // Animate viewport to center on this frame at 100% zoom
    viewport.set({
      x: -(frame.x - 40),
      y: -(frame.y - 40),
      scale: 1.0,
    });
    viewMode.set('detail');
  }

  function getFrameCenter(frameId: string): { x: number; y: number } | null {
    const f = frames.find((e: CanvasElement) => e.id === frameId);
    if (!f) return null;
    return { x: f.x + f.width / 2, y: f.y + f.height / 2 };
  }

  interface Connection {
    link: FlowLink;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }

  $: connections = flowLinks
    .map((link: FlowLink): Connection | null => {
      const from = getFrameCenter(link.fromFrameId);
      const to = getFrameCenter(link.toFrameId);
      if (!from || !to) return null;
      return { link, x1: from.x, y1: from.y, x2: to.x, y2: to.y };
    })
    .filter((c): c is Connection => c !== null);
</script>

{#if $viewMode === 'overview'}
  <div class="flow-overview">
    <div class="overview-header">
      <span class="overview-title">Flow Overview</span>
      <button class="overview-close" on:click={() => viewMode.set('detail')}>
        Exit Overview (Cmd+0)
      </button>
    </div>

    <div class="overview-canvas">
      <svg class="overview-svg" viewBox="{boundingBox.x - 40} {boundingBox.y - 40} {boundingBox.width + 80} {boundingBox.height + 80}">
        <defs>
          <marker
            id="overview-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--interactive-accent)" />
          </marker>
        </defs>

        {#each connections as { link, x1, y1, x2, y2 } (link.id)}
          <line
            {x1} {y1} {x2} {y2}
            stroke="var(--interactive-accent)"
            stroke-width="3"
            marker-end="url(#overview-arrow)"
            opacity="0.7"
          />
        {/each}

        {#each frames as frame (frame.id)}
          <g on:dblclick={() => handleFrameDoubleClick(frame)} role="button" tabindex="0">
            <rect
              x={frame.x}
              y={frame.y}
              width={frame.width}
              height={frame.height}
              fill={frame.properties.fill || 'var(--background-primary)'}
              stroke="var(--text-muted)"
              stroke-width="2"
              rx="4"
              class="frame-rect"
            />
            <text
              x={frame.x + frame.width / 2}
              y={frame.y - 10}
              text-anchor="middle"
              fill="var(--text-muted)"
              font-size="14"
              font-weight="500"
            >
              {frame.name ?? 'Frame'}
            </text>
          </g>
        {/each}
      </svg>
    </div>
  </div>
{/if}

<style>
  .flow-overview {
    position: absolute;
    inset: 0;
    background: var(--background-primary-alt);
    z-index: 500;
    display: flex;
    flex-direction: column;
  }

  .overview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-s) var(--spacing-m);
    background: var(--background-secondary);
    border-bottom: 1px solid var(--border-color);
  }

  .overview-title {
    font-size: var(--font-ui-small);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
  }

  .overview-close {
    padding: var(--spacing-xs) var(--spacing-s);
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: var(--font-smallest);
    color: var(--text-muted);
    cursor: pointer;
  }

  .overview-close:hover {
    background: var(--background-modifier-hover);
  }

  .overview-canvas {
    flex: 1;
    padding: var(--spacing-m);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .overview-svg {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
  }

  .frame-rect {
    cursor: pointer;
    transition: stroke var(--transition-fast);
  }

  .frame-rect:hover {
    stroke: var(--interactive-accent);
    stroke-width: 3;
  }
</style>
