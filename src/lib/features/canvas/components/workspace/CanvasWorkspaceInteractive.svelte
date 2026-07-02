<script lang="ts">
  import { onMount } from 'svelte';
  import {
    currentCanvas,
    viewport,
    canvasSettings,
    activeTool,
    selectedElements,
    selectedFlowLink,
    addElement,
    updateElement,
    deleteSelectedElements,
    selectElement,
    clearSelection,
  } from '@/features/canvas/stores';
  import { addFlowLink } from '@/features/canvas/stores';
  import { log } from '@/utils/logger';
  import {
    drawGrid,
    drawElements,
    drawElement,
    type ViewportState,
  } from '@/features/canvas/components/workspace/canvasRendering';
  import {
    createInteractionState,
    handleMouseDown as _mouseDown,
    handleMouseMove as _mouseMove,
    handleMouseUp as _mouseUp,
    handleWheel as _wheel,
    handleKeyDown as _keyDown,
    type CanvasContext,
  } from '@/features/canvas/components/workspace/canvasInteractions';
  import {
    handleDragOver,
    handleDrop as _drop,
    handleComponentConfirm,
  } from '@/features/canvas/components/workspace/canvasDragDrop';
  import CanvasToolbar from '@/features/canvas/components/CanvasToolbar.svelte';
  import CanvasContextMenu from '@/features/canvas/components/workspace/CanvasContextMenu.svelte';
  import CreateComponentDialog from '@/features/canvas/components/components/CreateComponentDialog.svelte';
  import FlowLinkOverlay from '@/features/canvas/components/flow/FlowLinkOverlay.svelte';
  import FlowLinkEditor from '@/features/canvas/components/flow/FlowLinkEditor.svelte';
  import CanvasMinimap from '@/features/canvas/components/workspace/minimap/CanvasMinimap.svelte';
  import FlowPreview from '@/features/canvas/components/flow/FlowPreview.svelte';
  import FlowOverview from '@/features/canvas/components/flow/FlowOverview.svelte';
  import AutoLayoutOverlay from '@/features/canvas/components/layout/AutoLayoutOverlay.svelte';
  import InspectOverlay from '@/features/canvas/components/inspect/InspectOverlay.svelte';
  import ResponsiveToolbar from '@/features/canvas/components/responsive/ResponsiveToolbar.svelte';
  import { inspectEnabled } from '@/features/canvas/stores/design/inspectMode';

  let responsivePreviewActive = false;

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
  export { showCreateComponentDialog };
  let showPreview = false;
  let editingFlowLinkId: string | null = null;

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
      addFlowLink,
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

  async function onComponentConfirm(detail: { name: string; category: string }) {
    const { name, category } = detail;
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
    // T057: Inspect mode toggle (Cmd+Shift+I)
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      inspectEnabled.update((v) => !v);
      return;
    }
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

  $: if (!$selectedFlowLink) {
    editingFlowLinkId = null;
  }
</script>

<div class="canvas-container">
  <CanvasToolbar />

  <!-- T075: Responsive preview toolbar -->
  <ResponsiveToolbar active={responsivePreviewActive} />

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

    <FlowLinkOverlay
      onEditFlowLink={(id) => {
        editingFlowLinkId = id;
      }}
    />
    <FlowOverview />
    {#if editingFlowLinkId}
      <FlowLinkEditor linkId={editingFlowLinkId} />
    {/if}

    <!-- T047: Auto Layout spacing handles when auto-layout frame selected -->
    {#if $currentCanvas && $selectedElements.length === 1}
      {@const selEl = $currentCanvas.elements.find((e) => e.id === $selectedElements[0])}
      {#if selEl?.properties?.autoLayout}
        <AutoLayoutOverlay
          layout={selEl.properties.autoLayout}
          selected={true}
          scale={$viewport.scale}
        />
      {/if}
    {/if}

    <!-- T058: Inspect mode measurement overlays -->
    {#if $inspectEnabled}
      <InspectOverlay
        scale={$viewport.scale}
        offsetX={$viewport.x}
        offsetY={$viewport.y}
        elements={$currentCanvas?.elements ?? []}
      />
    {/if}

    <CanvasMinimap canvasWidth={width} canvasHeight={height} />
  </div>

  <CanvasContextMenu
    bind:show={showContextMenu}
    x={contextMenuX}
    y={contextMenuY}
    onCreateComponent={handleCreateComponent}
  />

  <CreateComponentDialog
    bind:show={showCreateComponentDialog}
    onConfirm={onComponentConfirm}
    onCancel={() => (showCreateComponentDialog = false)}
  />

  <FlowPreview bind:show={showPreview} onExit={() => (showPreview = false)} />
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
