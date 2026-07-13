<script lang="ts">
  import { onMount } from 'svelte';

  /**
   * Reusable minimap overlay for any 2D pan/zoom viewport.
   *
   * Renders a small canvas in the bottom-right corner showing:
   * - Dots for each item in the world
   * - A viewport rectangle showing the currently visible region
   *
   * The viewport rect uses a stable `worldBounds` reference frame,
   * so it does NOT jitter when items move within the world.
   */

  export interface MinimapItem {
    x: number;
    y: number;
    id?: string;
  }

  export interface WorldBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  }

  interface Props {
    items: MinimapItem[];
    worldBounds: WorldBounds;
    panX: number;
    panY: number;
    zoom: number;
    viewportWidth: number;
    viewportHeight: number;
    highlightIds?: Set<string> | null;
    width?: number;
    height?: number;
  }

  let {
    items,
    worldBounds,
    panX,
    panY,
    zoom,
    viewportWidth,
    viewportHeight,
    highlightIds = null,
    width: mmW = 140,
    height: mmH = 100,
  }: Props = $props();

  let canvasEl: HTMLCanvasElement = $state(null!);
  let mounted = $state(false);

  onMount(() => {
    mounted = true;
  });

  function resolveVar(name: string, fallback: string): string {
    const style = getComputedStyle(document.documentElement);
    return style.getPropertyValue(name).trim() || fallback;
  }

  $effect(() => {
    void items;
    void worldBounds;
    void panX;
    void panY;
    void zoom;
    void viewportWidth;
    void viewportHeight;
    void highlightIds;
    if (canvasEl && mounted) drawMinimap();
  });

  function drawMinimap() {
    const dpr = window.devicePixelRatio || 1;
    canvasEl.width = mmW * dpr;
    canvasEl.height = mmH * dpr;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, mmW, mmH);

    const wb = worldBounds;
    const rangeX = wb.maxX - wb.minX || 1;
    const rangeY = wb.maxY - wb.minY || 1;
    const scale = Math.min((mmW - 16) / rangeX, (mmH - 16) / rangeY);

    const surfaceColor = resolveVar('--color-surface', '#1e1e1e');
    const borderColor = resolveVar('--color-border', '#444');
    const accentColor = resolveVar('--color-accent', '#7c3aed');
    const mutedColor = resolveVar('--color-text-muted', '#888');

    // Background
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, mmW, mmH, 6);
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = surfaceColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
    ctx.clip();
    ctx.globalAlpha = 1;

    const cx = mmW / 2;
    const cy = mmH / 2;
    const worldCenterX = wb.minX + rangeX / 2;
    const worldCenterY = wb.minY + rangeY / 2;

    // Item dots
    for (const item of items) {
      const nx = cx + (item.x - worldCenterX) * scale;
      const ny = cy + (item.y - worldCenterY) * scale;
      ctx.beginPath();
      ctx.arc(nx, ny, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = item.id && highlightIds?.has(item.id) ? accentColor : mutedColor;
      ctx.fill();
    }

    // Viewport rectangle (uses stable worldBounds, not live item positions)
    const vpLeft = cx + (-panX / zoom - worldCenterX) * scale;
    const vpTop = cy + (-panY / zoom - worldCenterY) * scale;
    const vpW = (viewportWidth / zoom) * scale;
    const vpH = (viewportHeight / zoom) * scale;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6;
    ctx.strokeRect(vpLeft, vpTop, vpW, vpH);

    ctx.restore();
  }
</script>

<canvas
  bind:this={canvasEl}
  class="minimap-canvas"
  style="width:{mmW}px;height:{mmH}px"
  aria-hidden="true"
></canvas>

<style>
  .minimap-canvas {
    position: absolute;
    bottom: 8px;
    right: 8px;
    pointer-events: none;
    border-radius: 6px;
  }
</style>
