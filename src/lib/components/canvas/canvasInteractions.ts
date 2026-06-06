/**
 * Canvas mouse/keyboard interaction handlers.
 * Extracted from CanvasWorkspaceInteractive.svelte for the 300-line limit.
 */

import type { CanvasElement, CanvasSettings } from '@/types/canvas';
import {
  createRectangle,
  createCircle,
  createText,
  createFrame,
  createLine,
  createArrow,
  createPenPath,
  snapToGrid,
  screenToCanvas,
  getElementAtPoint,
} from '@/utils/canvas/utils';
import type { ViewportState } from './canvasRendering';

export interface InteractionState {
  isPanning: boolean;
  isDrawing: boolean;
  isDragging: boolean;
  draggedElement: CanvasElement | null;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  previewElement: CanvasElement | null;
  penPoints: Array<{ x: number; y: number }>;
  isDrawingPen: boolean;
}

export function createInteractionState(): InteractionState {
  return {
    isPanning: false,
    isDrawing: false,
    isDragging: false,
    draggedElement: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    previewElement: null,
    penPoints: [],
    isDrawingPen: false,
  };
}

export interface CanvasContext {
  canvas: HTMLCanvasElement;
  viewport: ViewportState;
  settings: CanvasSettings;
  activeTool: string;
  elements: CanvasElement[];
  selectedIds: string[];
  layers: Array<{ id: string }>;
  selectElement: (id: string) => void;
  clearSelection: () => void;
  addElement: (el: CanvasElement) => void;
  updateElement: (el: CanvasElement) => void;
  deleteSelected: () => void;
  updateViewport: (fn: (v: ViewportState) => ViewportState) => void;
}

export function handleMouseDown(
  e: MouseEvent,
  state: InteractionState,
  ctx: CanvasContext
): InteractionState {
  const rect = ctx.canvas.getBoundingClientRect();
  const screenX = e.clientX - rect.left;
  const screenY = e.clientY - rect.top;
  const canvasCoords = screenToCanvas(screenX, screenY, ctx.viewport);

  if (ctx.activeTool === 'pan' || e.button === 1 || e.shiftKey) {
    return { ...state, isPanning: true, lastX: e.clientX, lastY: e.clientY };
  }

  if (ctx.activeTool === 'select') {
    const clickedElement = getElementAtPoint(canvasCoords.x, canvasCoords.y, ctx.elements);
    if (clickedElement) {
      if (!e.metaKey && !e.ctrlKey) ctx.clearSelection();
      ctx.selectElement(clickedElement.id);
      return {
        ...state,
        isDragging: true,
        draggedElement: clickedElement,
        startX: canvasCoords.x - clickedElement.x,
        startY: canvasCoords.y - clickedElement.y,
      };
    } else {
      ctx.clearSelection();
    }
    return state;
  }

  if (['rectangle', 'circle', 'frame', 'line', 'arrow'].includes(ctx.activeTool)) {
    if (!ctx.layers[0]) return state;
    const sx = ctx.settings.snapToGrid ? snapToGrid(canvasCoords.x, ctx.settings.gridSize) : canvasCoords.x;
    const sy = ctx.settings.snapToGrid ? snapToGrid(canvasCoords.y, ctx.settings.gridSize) : canvasCoords.y;
    return { ...state, isDrawing: true, startX: sx, startY: sy };
  }

  if (ctx.activeTool === 'pen') {
    if (!ctx.layers[0]) return state;
    if (!state.isDrawingPen) {
      return { ...state, isDrawingPen: true, penPoints: [{ x: canvasCoords.x, y: canvasCoords.y }] };
    } else {
      return { ...state, penPoints: [...state.penPoints, { x: canvasCoords.x, y: canvasCoords.y }] };
    }
  }

  if (ctx.activeTool === 'text') {
    if (!ctx.layers[0]) return state;
    const x = ctx.settings.snapToGrid ? snapToGrid(canvasCoords.x, ctx.settings.gridSize) : canvasCoords.x;
    const y = ctx.settings.snapToGrid ? snapToGrid(canvasCoords.y, ctx.settings.gridSize) : canvasCoords.y;
    const textElement = createText(x, y, 'Text', ctx.layers[0].id);
    ctx.addElement(textElement);
  }

  return state;
}

export function handleMouseMove(
  e: MouseEvent,
  state: InteractionState,
  ctx: CanvasContext
): InteractionState {
  const rect = ctx.canvas.getBoundingClientRect();
  const screenX = e.clientX - rect.left;
  const screenY = e.clientY - rect.top;
  const canvasCoords = screenToCanvas(screenX, screenY, ctx.viewport);

  if (state.isPanning) {
    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;
    ctx.updateViewport((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
    return { ...state, lastX: e.clientX, lastY: e.clientY };
  }

  if (state.isDragging && state.draggedElement) {
    const newX = canvasCoords.x - state.startX;
    const newY = canvasCoords.y - state.startY;
    const updated = {
      ...state.draggedElement,
      x: ctx.settings.snapToGrid ? snapToGrid(newX, ctx.settings.gridSize) : newX,
      y: ctx.settings.snapToGrid ? snapToGrid(newY, ctx.settings.gridSize) : newY,
    };
    ctx.updateElement(updated);
    return { ...state, draggedElement: updated };
  }

  if (state.isDrawing) {
    const currentX = ctx.settings.snapToGrid ? snapToGrid(canvasCoords.x, ctx.settings.gridSize) : canvasCoords.x;
    const currentY = ctx.settings.snapToGrid ? snapToGrid(canvasCoords.y, ctx.settings.gridSize) : canvasCoords.y;
    const w = Math.abs(currentX - state.startX);
    const h = Math.abs(currentY - state.startY);
    const x = Math.min(state.startX, currentX);
    const y = Math.min(state.startY, currentY);
    const layerId = ctx.layers[0].id;

    let preview: CanvasElement | null = null;
    if (ctx.activeTool === 'rectangle') preview = createRectangle(x, y, w, h, layerId);
    else if (ctx.activeTool === 'circle') {
      const radius = Math.sqrt(w * w + h * h) / 2;
      preview = createCircle(state.startX, state.startY, radius, layerId);
    } else if (ctx.activeTool === 'frame') preview = createFrame(x, y, w, h, layerId);
    else if (ctx.activeTool === 'line') preview = createLine(state.startX, state.startY, currentX, currentY, layerId);
    else if (ctx.activeTool === 'arrow') preview = createArrow(state.startX, state.startY, currentX, currentY, layerId);

    return { ...state, previewElement: preview };
  }

  return state;
}

export function handleMouseUp(state: InteractionState, ctx: CanvasContext): InteractionState {
  if (state.isDrawing && state.previewElement) {
    const diag = Math.sqrt(state.previewElement.width ** 2 + state.previewElement.height ** 2);
    if (diag > 5) ctx.addElement(state.previewElement);
    return { ...state, previewElement: null, isDrawing: false };
  }
  if (state.isDragging) return { ...state, isDragging: false, draggedElement: null };
  if (state.isPanning) return { ...state, isPanning: false };
  return state;
}

export function handleWheel(e: WheelEvent, canvas: HTMLCanvasElement, ctx: CanvasContext) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  const newScale = ctx.viewport.scale * delta;
  if (newScale < 0.1 || newScale > 5) return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  ctx.updateViewport((v) => ({
    x: mouseX - (mouseX - v.x) * delta,
    y: mouseY - (mouseY - v.y) * delta,
    scale: newScale,
  }));
}

export function handleKeyDown(
  e: KeyboardEvent,
  state: InteractionState,
  ctx: CanvasContext
): InteractionState {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (ctx.selectedIds.length > 0) {
      e.preventDefault();
      ctx.deleteSelected();
    }
  }

  if (e.key === 'Escape') {
    ctx.clearSelection();
    if (state.isDrawingPen && state.penPoints.length >= 2 && ctx.layers[0]) {
      const penEl = createPenPath(state.penPoints, ctx.layers[0].id);
      ctx.addElement(penEl);
    }
    return { ...state, previewElement: null, isDrawing: false, isDragging: false, isDrawingPen: false, penPoints: [] };
  }

  if (e.key === 'Enter' && state.isDrawingPen && state.penPoints.length >= 2 && ctx.layers[0]) {
    const penEl = createPenPath(state.penPoints, ctx.layers[0].id);
    ctx.addElement(penEl);
    return { ...state, isDrawingPen: false, penPoints: [] };
  }

  return state;
}
