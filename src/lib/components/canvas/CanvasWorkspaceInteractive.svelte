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
  import {
    createRectangle,
    createCircle,
    createText,
    snapToGrid,
    screenToCanvas,
    getElementAtPoint,
  } from '@/utils/canvasUtils';
  import { log } from '@/utils/logger';
  import type { CanvasElement } from '@/types/canvas';
  import CanvasToolbar from './CanvasToolbar.svelte';

  let canvasContainer: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  let width = 800;
  let height = 600;

  // Interaction state
  let isPanning = false;
  let isDrawing = false;
  let isDragging = false;
  let draggedElement: CanvasElement | null = null;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let previewElement: CanvasElement | null = null;

  onMount(() => {
    log.info('CanvasWorkspace mounted');

    if (canvas) {
      ctx = canvas.getContext('2d');
      resizeCanvas();
      render();
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
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

    ctx.clearRect(0, 0, width, height);
    ctx.save();

    ctx.translate($viewport.x, $viewport.y);
    ctx.scale($viewport.scale, $viewport.scale);

    if ($canvasSettings.showGrid) {
      drawGrid();
    }

    if ($currentCanvas) {
      drawElements();
    }

    if (previewElement) {
      drawElement(previewElement, true);
    }

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

    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

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
      const isSelected = $selectedElements.includes(element.id);
      drawElement(element, isSelected);
    }
  }

  function drawElement(element: CanvasElement, isSelected: boolean = false) {
    if (!ctx) return;

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

    if (isSelected) {
      drawSelectionBox(element);
    }

    ctx.restore();
  }

  function drawRectangle(element: CanvasElement) {
    if (!ctx) return;

    ctx.fillStyle = element.properties.fill || '#3b82f6';
    ctx.strokeStyle = element.properties.stroke || '#1e40af';
    ctx.lineWidth = element.properties.strokeWidth || 2;
    ctx.globalAlpha = element.properties.opacity || 1;

    ctx.fillRect(element.x, element.y, element.width, element.height);
    ctx.strokeRect(element.x, element.y, element.width, element.height);
  }

  function drawCircle(element: CanvasElement) {
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

  function drawText(element: CanvasElement) {
    if (!ctx) return;

    ctx.fillStyle = element.properties.fill || '#000000';
    ctx.font = `${element.properties.fontSize || 16}px ${element.properties.fontFamily || 'Inter, sans-serif'}`;
    ctx.globalAlpha = element.properties.opacity || 1;

    ctx.fillText(element.properties.text || '', element.x, element.y + (element.properties.fontSize || 16));
  }

  function drawSelectionBox(element: CanvasElement) {
    if (!ctx) return;

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2 / $viewport.scale;
    ctx.setLineDash([5 / $viewport.scale, 5 / $viewport.scale]);
    ctx.strokeRect(element.x - 2, element.y - 2, element.width + 4, element.height + 4);
    ctx.setLineDash([]);
  }

  function handleMouseDown(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const canvasCoords = screenToCanvas(screenX, screenY, $viewport);

    if ($activeTool === 'pan' || e.button === 1 || e.shiftKey) {
      isPanning = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.style.cursor = 'grabbing';
      return;
    }

    if ($activeTool === 'select') {
      if (!$currentCanvas) return;
      const clickedElement = getElementAtPoint(canvasCoords.x, canvasCoords.y, $currentCanvas.elements);

      if (clickedElement) {
        if (!e.metaKey && !e.ctrlKey) {
          clearSelection();
        }
        selectElement(clickedElement.id);
        isDragging = true;
        draggedElement = clickedElement;
        startX = canvasCoords.x - clickedElement.x;
        startY = canvasCoords.y - clickedElement.y;
      } else {
        clearSelection();
      }
      return;
    }

    if ($activeTool === 'rectangle' || $activeTool === 'circle') {
      if (!$currentCanvas || !$currentCanvas.layers[0]) return;

      isDrawing = true;
      startX = $canvasSettings.snapToGrid ? snapToGrid(canvasCoords.x, $canvasSettings.gridSize) : canvasCoords.x;
      startY = $canvasSettings.snapToGrid ? snapToGrid(canvasCoords.y, $canvasSettings.gridSize) : canvasCoords.y;
    }

    if ($activeTool === 'text') {
      if (!$currentCanvas || !$currentCanvas.layers[0]) return;

      const x = $canvasSettings.snapToGrid ? snapToGrid(canvasCoords.x, $canvasSettings.gridSize) : canvasCoords.x;
      const y = $canvasSettings.snapToGrid ? snapToGrid(canvasCoords.y, $canvasSettings.gridSize) : canvasCoords.y;

      const textElement = createText(x, y, 'Text', $currentCanvas.layers[0].id);
      addElement(textElement);
      render();
    }
  }

  function handleMouseMove(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const canvasCoords = screenToCanvas(screenX, screenY, $viewport);

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
      return;
    }

    if (isDragging && draggedElement) {
      const newX = canvasCoords.x - startX;
      const newY = canvasCoords.y - startY;

      const updatedElement = {
        ...draggedElement,
        x: $canvasSettings.snapToGrid ? snapToGrid(newX, $canvasSettings.gridSize) : newX,
        y: $canvasSettings.snapToGrid ? snapToGrid(newY, $canvasSettings.gridSize) : newY,
      };

      updateElement(updatedElement);
      draggedElement = updatedElement;
      render();
      return;
    }

    if (isDrawing && $currentCanvas) {
      const currentX = $canvasSettings.snapToGrid ? snapToGrid(canvasCoords.x, $canvasSettings.gridSize) : canvasCoords.x;
      const currentY = $canvasSettings.snapToGrid ? snapToGrid(canvasCoords.y, $canvasSettings.gridSize) : canvasCoords.y;

      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);

      if ($activeTool === 'rectangle') {
        previewElement = createRectangle(x, y, width, height, $currentCanvas.layers[0].id);
      } else if ($activeTool === 'circle') {
        const radius = Math.sqrt(width * width + height * height) / 2;
        previewElement = createCircle(startX, startY, radius, $currentCanvas.layers[0].id);
      }

      render();
    }
  }

  function handleMouseUp() {
    if (isDrawing && previewElement && $currentCanvas) {
      if (previewElement.width > 5 && previewElement.height > 5) {
        addElement(previewElement);
      }
      previewElement = null;
      isDrawing = false;
      render();
    }

    if (isDragging) {
      isDragging = false;
      draggedElement = null;
    }

    if (isPanning) {
      isPanning = false;
      canvas.style.cursor = 'default';
    }
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = $viewport.scale * delta;

    if (newScale < 0.1 || newScale > 5) return;

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

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if ($selectedElements.length > 0) {
        e.preventDefault();
        deleteSelectedElements();
        render();
      }
    }

    if (e.key === 'Escape') {
      clearSelection();
      previewElement = null;
      isDrawing = false;
      isDragging = false;
      render();
    }
  }

  $: if ($currentCanvas || $viewport || $canvasSettings || $selectedElements || $activeTool) {
    render();
  }
</script>

<div class="canvas-container">
  <CanvasToolbar />
  
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
    background: #f9fafb;
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
    color: #6b7280;
    pointer-events: none;
  }

  .empty-state p {
    margin: 0.5rem 0;
  }

  .hint {
    font-size: 0.875rem;
    color: #9ca3af;
  }
</style>
