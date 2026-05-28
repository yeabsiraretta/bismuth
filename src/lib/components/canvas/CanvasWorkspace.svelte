<script lang="ts">
  import { onMount } from 'svelte';
  import { currentCanvas, viewport, canvasSettings } from '@/stores/canvas/canvasStore';
  import { log } from '@/utils/logger';

  let canvasContainer: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  let width = 800;
  let height = 600;
  let isPanning = false;
  let lastX = 0;
  let lastY = 0;

  onMount(() => {
    log.info('CanvasWorkspace mounted');

    // Set up canvas
    if (canvas) {
      ctx = canvas.getContext('2d');
      resizeCanvas();
      render();
    }

    // Handle window resize
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      log.info('CanvasWorkspace unmounted');
    };
  });

  function resizeCanvas() {
    if (!canvasContainer || !canvas) return;

    const rect = canvasContainer.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width;
    canvas.height = height;

    render();
  }

  function render() {
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Save context state
    ctx.save();

    // Apply viewport transform
    ctx.translate($viewport.x, $viewport.y);
    ctx.scale($viewport.scale, $viewport.scale);

    // Draw grid if enabled
    if ($canvasSettings.showGrid) {
      drawGrid();
    }

    // Draw elements
    if ($currentCanvas) {
      drawElements();
    }

    // Restore context state
    ctx.restore();
  }

  function drawGrid() {
    if (!ctx) return;

    const gridSize = $canvasSettings.gridSize;
    const startX = Math.floor(-$viewport.x / $viewport.scale / gridSize) * gridSize;
    const startY = Math.floor(-$viewport.y / $viewport.scale / gridSize) * gridSize;
    const endX = startX + width / $viewport.scale + gridSize;
    const endY = startY + height / $viewport.scale + gridSize;

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1 / $viewport.scale;

    // Vertical lines
    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  }

  function drawElements() {
    if (!ctx || !$currentCanvas) return;

    for (const element of $currentCanvas.elements) {
      if (!element.visible) continue;

      ctx.save();
      ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
      ctx.rotate((element.rotation * Math.PI) / 180);
      ctx.translate(-(element.x + element.width / 2), -(element.y + element.height / 2));

      switch (element.element_type) {
        case 'rectangle':
          drawRectangle(element);
          break;
        case 'circle':
          drawCircle(element);
          break;
        case 'text':
          drawText(element);
          break;
      }

      ctx.restore();
    }
  }

  function drawRectangle(element: any) {
    if (!ctx) return;

    ctx.fillStyle = element.properties.fill || '#3b82f6';
    ctx.strokeStyle = element.properties.stroke || '#1e40af';
    ctx.lineWidth = element.properties.strokeWidth || 2;
    ctx.globalAlpha = element.properties.opacity || 1;

    ctx.fillRect(element.x, element.y, element.width, element.height);
    ctx.strokeRect(element.x, element.y, element.width, element.height);
  }

  function drawCircle(element: any) {
    if (!ctx) return;

    const radius = element.properties.radius || element.width / 2;
    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;

    ctx.fillStyle = element.properties.fill || '#10b981';
    ctx.strokeStyle = element.properties.stroke || '#059669';
    ctx.lineWidth = element.properties.strokeWidth || 2;
    ctx.globalAlpha = element.properties.opacity || 1;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function drawText(element: any) {
    if (!ctx) return;

    ctx.fillStyle = element.properties.fill || '#000000';
    ctx.font = `${element.properties.fontSize || 16}px ${element.properties.fontFamily || 'Inter, sans-serif'}`;
    ctx.globalAlpha = element.properties.opacity || 1;

    ctx.fillText(
      element.properties.text || '',
      element.x,
      element.y + (element.properties.fontSize || 16)
    );
  }

  function handleMouseDown(e: MouseEvent) {
    if (e.button === 1 || e.shiftKey || e.metaKey) {
      // Middle mouse or Shift/Cmd + click = pan
      isPanning = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.style.cursor = 'grabbing';
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (isPanning) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;

      viewport.update((v) => ({
        ...v,
        x: v.x + dx,
        y: v.y + dy,
      }));

      lastX = e.clientX;
      lastY = e.clientY;
      render();
    }
  }

  function handleMouseUp() {
    if (isPanning) {
      isPanning = false;
      canvas.style.cursor = 'default';
    }
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = $viewport.scale * delta;

    // Limit zoom range
    if (newScale < 0.1 || newScale > 5) return;

    // Zoom towards mouse position
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    viewport.update((v) => ({
      x: mouseX - (mouseX - v.x) * delta,
      y: mouseY - (mouseY - v.y) * delta,
      scale: newScale,
    }));

    render();
  }

  // Re-render when canvas or viewport changes
  $: if ($currentCanvas || $viewport || $canvasSettings) {
    render();
  }
</script>

<div class="canvas-workspace" bind:this={canvasContainer}>
  <canvas
    bind:this={canvas}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:mouseleave={handleMouseUp}
    on:wheel={handleWheel}
  ></canvas>

  {#if !$currentCanvas}
    <div class="empty-state">
      <p>No canvas loaded</p>
      <p class="hint">Create a new canvas or open an existing one</p>
    </div>
  {/if}
</div>

<style>
  .canvas-workspace {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--background-primary-alt);
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: default;
  }

  .empty-state {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: var(--text-muted);
  }

  .empty-state p {
    margin: var(--spacing-s) 0;
  }

  .hint {
    font-size: var(--font-smaller);
    color: var(--text-faint);
  }
</style>
