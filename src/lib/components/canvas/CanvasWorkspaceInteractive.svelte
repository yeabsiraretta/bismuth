<script lang="ts">
  import { onMount } from 'svelte';
  import {
    currentCanvas,
    viewport,
    canvasSettings,
    activeTool,
    selectedElements,
    addElement,
    updateElement,
    deleteSelectedElements,
    selectElement,
    clearSelection,
  } from '@/stores/canvas/canvasStore';
  import { log } from '@/utils/logger';
  import { drawGrid, drawElements, drawElement, type ViewportState } from './canvasRendering';
  import {
    createInteractionState,
    handleMouseDown as _mouseDown,
    handleMouseMove as _mouseMove,
    handleMouseUp as _mouseUp,
    handleWheel as _wheel,
    handleKeyDown as _keyDown,
    type CanvasContext,
  } from './canvasInteractions';
  import { handleDragOver, handleDrop as _drop, handleComponentConfirm } from './canvasDragDrop';
  import CanvasToolbar from './CanvasToolbar.svelte';
  import CanvasContextMenu from './CanvasContextMenu.svelte';
  import CreateComponentDialog from './CreateComponentDialog.svelte';
  import FlowLinkOverlay from './FlowLinkOverlay.svelte';
  import FlowPreview from './FlowPreview.svelte';
  import FlowOverview from './FlowOverview.svelte';

  let canvasContainer: HTMLDivElement;
  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  let width = 800;
  let height = 600;

  let iState = createInteractionState();

  let showContextMenu = false;
  let contextMenuX = 0;
  let contextMenuY = 0;
  let showCreateComponentDialog = false;
  let showPreview = false;

  function getCtx(): CanvasContext {
    return {
      canvas: canvasEl,
      viewport: $viewport,
      settings: $canvasSettings,
      activeTool: $activeTool,
      elements: $currentCanvas?.elements ?? [],
      selectedIds: $selectedElements,
      layers: $currentCanvas?.layers ?? [],
      selectElement,
      clearSelection,
      addElement,
      updateElement,
      deleteSelected: deleteSelectedElements,
      updateViewport: (fn) => viewport.update(fn as (v: ViewportState) => ViewportState),
    };
  }

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate($viewport.x, $viewport.y);
    ctx.scale($viewport.scale, $viewport.scale);

    if ($canvasSettings.showGrid) {
      drawGrid(ctx, $viewport, $canvasSettings, width, height);
    }
    if ($currentCanvas) {
      drawElements(ctx, $currentCanvas.elements, $selectedElements, $viewport);
    }
    if (iState.previewElement) {
      drawElement(ctx, iState.previewElement, true, $viewport);
    }
    ctx.restore();
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    contextMenuX = e.clientX;
    contextMenuY = e.clientY;
    showContextMenu = true;
  }

  function handleCreateComponent() {
    showContextMenu = false;
    showCreateComponentDialog = true;
  }

  async function onComponentConfirm(e: CustomEvent<{ name: string; category: string }>) {
    const { name, category } = e.detail;
    await handleComponentConfirm(name, category || undefined);
    showCreateComponentDialog = false;
    render();
  }

  function onDrop(e: DragEvent) {
    _drop(e, canvasEl, $viewport);
    render();
  }

  function onMouseDown(e: MouseEvent) {
    if ($activeTool === 'pan' || e.button === 1 || e.shiftKey) {
      canvasEl.style.cursor = 'grabbing';
    }
    iState = _mouseDown(e, iState, getCtx());
    render();
  }

  function onMouseMove(e: MouseEvent) {
    iState = _mouseMove(e, iState, getCtx());
    render();
  }

  function onMouseUp() {
    iState = _mouseUp(iState, getCtx());
    if (!iState.isPanning) canvasEl.style.cursor = 'default';
    render();
  }

  function onWheel(e: WheelEvent) {
    _wheel(e, canvasEl, getCtx());
    render();
  }

  function onKeyDown(e: KeyboardEvent) {
    iState = _keyDown(e, iState, getCtx());
    render();
  }

  function resizeCanvas() {
    if (!canvasContainer || !canvasEl) return;
    const rect = canvasContainer.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvasEl.width = width;
    canvasEl.height = height;
    render();
  }

  onMount(() => {
    log.info('CanvasWorkspace mounted');
    if (canvasEl) {
      ctx = canvasEl.getContext('2d');
      resizeCanvas();
      render();
    }
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', onKeyDown);
      log.info('CanvasWorkspace unmounted');
    };
  });

  $: if ($currentCanvas || $viewport || $canvasSettings || $selectedElements || $activeTool) {
    render();
  }
</script>

<div class="canvas-container">
  <CanvasToolbar />

  <div class="canvas-workspace" bind:this={canvasContainer}>
    <canvas
      bind:this={canvasEl}
      on:mousedown={onMouseDown}
      on:mousemove={onMouseMove}
      on:mouseup={onMouseUp}
      on:mouseleave={onMouseUp}
      on:wheel={onWheel}
      on:contextmenu={handleContextMenu}
      on:dragover={handleDragOver}
      on:drop={onDrop}
    ></canvas>

    {#if !$currentCanvas}
      <div class="empty-state">
        <p>No canvas loaded</p>
        <p class="hint">Create a new canvas or open an existing one</p>
      </div>
    {/if}

    <FlowLinkOverlay />
    <FlowOverview />
  </div>

  <CanvasContextMenu
    bind:show={showContextMenu}
    x={contextMenuX}
    y={contextMenuY}
    on:createComponent={handleCreateComponent}
  />

  <CreateComponentDialog
    bind:show={showCreateComponentDialog}
    on:confirm={onComponentConfirm}
    on:cancel={() => (showCreateComponentDialog = false)}
  />

  <FlowPreview
    bind:show={showPreview}
    on:exit={() => (showPreview = false)}
  />
</div>

<style>
  .canvas-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  .canvas-workspace {
    position: relative;
    flex: 1;
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
    pointer-events: none;
  }

  .empty-state p {
    margin: var(--spacing-s) 0;
  }

  .hint {
    font-size: var(--font-smaller);
    color: var(--text-faint);
  }
</style>
