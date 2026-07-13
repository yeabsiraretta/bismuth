/**
 * Pure helper functions for canvas page interactions.
 * Extracted from +page.svelte to keep the component under the 500-line limit.
 */
import {
  createConnection,
  findNearestAnchor,
  getAnchorPoint,
  type Point,
} from '@/hubs/canvas/services/canvas-connections';
import {
  type BoundingBox,
  getElementsInMarquee,
  getSelectionBounds,
} from '@/hubs/canvas/services/canvas-math';
import {
  addConnection,
  addElement,
  clearSelection,
  copySelected,
  cutSelected,
  deleteElements,
  duplicateSelected,
  getElementById,
  getSelectedElements,
  getSelectedIds,
  pasteClipboard,
  redoCanvas,
  selectAll,
  selectElement,
  setZoom,
  undoCanvas,
  updateElement,
} from '@/hubs/canvas/stores/canvas-store.svelte';
import { resetToSelect } from '@/hubs/canvas/stores/canvas-tool-store.svelte';
import type { CanvasElement } from '@/hubs/canvas/types/canvas-types';
import {
  createEllipse,
  createLine,
  createNote,
  createRect,
  createText,
} from '@/hubs/canvas/types/canvas-types';

export function worldFromEvent(
  e: PointerEvent | MouseEvent,
  viewport: HTMLElement,
  panX: number,
  panY: number,
  zoom: number
) {
  const rect = viewport.getBoundingClientRect();
  return { x: (e.clientX - rect.left - panX) / zoom, y: (e.clientY - rect.top - panY) / zoom };
}

export function getViewport(): HTMLElement | null {
  return document.querySelector('.canvas-viewport');
}

export function elTransform(el: CanvasElement): string {
  let t = `translate(${el.x}px, ${el.y}px)`;
  if (el.rotation) t += ` rotate(${el.rotation}deg)`;
  return t;
}

export function finishDraw(box: BoundingBox, toolMode: string) {
  const w = Math.max(box.width, 10);
  const h = Math.max(box.height, 10);
  let newEl: CanvasElement | null = null;
  switch (toolMode) {
    case 'rect':
      newEl = createRect({ x: box.x, y: box.y, width: w, height: h });
      break;
    case 'ellipse':
      newEl = createEllipse({ x: box.x, y: box.y, width: w, height: h });
      break;
    case 'line':
      newEl = createLine({ x: box.x, y: box.y, x2: box.x + w, y2: box.y + h });
      break;
    case 'text':
      newEl = createText({ x: box.x, y: box.y, width: w, height: h });
      break;
    case 'note':
      newEl = createNote({ x: box.x, y: box.y, width: Math.max(w, 150), height: Math.max(h, 100) });
      break;
  }
  if (newEl) {
    addElement(newEl);
    selectElement(newEl.id);
  }
  resetToSelect();
}

export function handleConnectDown(
  e: PointerEvent,
  el: CanvasElement,
  panX: number,
  panY: number,
  zoom: number
) {
  e.stopPropagation();
  const viewport = getViewport();
  if (!viewport) return null;
  const w = worldFromEvent(e, viewport, panX, panY, zoom);
  const anchor = findNearestAnchor(el, { x: w.x, y: w.y });
  const point = getAnchorPoint(el, anchor);
  return { source: { elId: el.id, point }, preview: point };
}

export function handleConnectMove(
  e: PointerEvent,
  panX: number,
  panY: number,
  zoom: number
): Point | null {
  const viewport = getViewport();
  if (!viewport) return null;
  return worldFromEvent(e, viewport, panX, panY, zoom);
}

export function handleConnectUp(
  e: PointerEvent,
  connectSource: { elId: string; point: Point },
  sortedEls: CanvasElement[],
  panX: number,
  panY: number,
  zoom: number
) {
  const viewport = getViewport();
  if (!viewport) return;
  const w = worldFromEvent(e, viewport, panX, panY, zoom);
  const hitEl = sortedEls.find((el) => {
    if (el.id === connectSource.elId) return false;
    return w.x >= el.x && w.x <= el.x + el.width && w.y >= el.y && w.y <= el.y + el.height;
  });
  if (hitEl) {
    const sourceEl = getElementById(connectSource.elId);
    if (sourceEl) {
      const srcAnchor = findNearestAnchor(sourceEl, connectSource.point);
      const tgtAnchor = findNearestAnchor(hitEl, { x: w.x, y: w.y });
      addConnection(
        createConnection({
          sourceId: connectSource.elId,
          targetId: hitEl.id,
          sourceAnchor: srcAnchor,
          targetAnchor: tgtAnchor,
        })
      );
    }
  }
}

export function doMarqueeSelect(sortedEls: CanvasElement[], marquee: BoundingBox) {
  const els = getElementsInMarquee(sortedEls, marquee);
  for (const el of els) selectElement(el.id, true);
}

export function focusOnSelected(): { panX: number; panY: number } | null {
  const selected = getSelectedElements();
  if (selected.length === 0) return null;
  const bounds = getSelectionBounds(selected);
  if (!bounds) return null;
  const viewport = getViewport();
  if (!viewport) return null;
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const PAD = 60;
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  const fitZoom = Math.min(
    (vw - PAD * 2) / Math.max(bounds.width, 1),
    (vh - PAD * 2) / Math.max(bounds.height, 1)
  );
  const newZoom = Math.max(0.1, Math.min(2, fitZoom));
  setZoom(newZoom);
  return { panX: vw / 2 - cx * newZoom, panY: vh / 2 - cy * newZoom };
}

function nudge(dx: number, dy: number) {
  for (const id of getSelectedIds()) {
    const el = getElementById(id);
    if (el) updateElement(id, { x: el.x + dx, y: el.y + dy } as Partial<CanvasElement>);
  }
}

export interface KeyHandlerCallbacks {
  clearCtxMenu: () => void;
  toggleGrid: () => void;
  doFocus: () => void;
}

export function createKeyHandler(callbacks: KeyHandlerCallbacks) {
  return function handleKeyDown(e: KeyboardEvent) {
    const t = e.target as HTMLElement;
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
    const meta = e.metaKey || e.ctrlKey;
    if (e.key === 'Escape') {
      clearSelection();
      callbacks.clearCtxMenu();
      e.preventDefault();
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const ids = getSelectedIds();
      if (ids.length > 0) deleteElements(ids);
      e.preventDefault();
      return;
    }
    if (meta && e.key === 'a') {
      e.preventDefault();
      selectAll();
      return;
    }
    if (meta && e.key === 'd') {
      e.preventDefault();
      duplicateSelected();
      return;
    }
    if (meta && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      redoCanvas();
      return;
    }
    if (meta && e.key === 'z') {
      e.preventDefault();
      undoCanvas();
      return;
    }
    if (meta && e.key === 'c') {
      e.preventDefault();
      copySelected();
      return;
    }
    if (meta && e.key === 'v') {
      e.preventDefault();
      pasteClipboard();
      return;
    }
    if (meta && e.key === 'x') {
      e.preventDefault();
      cutSelected();
      return;
    }
    if (meta && e.key === "'") {
      e.preventDefault();
      callbacks.toggleGrid();
      return;
    }
    const selectedIds = getSelectedIds();
    if (selectedIds.length > 0) {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        callbacks.doFocus();
        return;
      }
      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nudge(-step, 0);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nudge(step, 0);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        nudge(0, -step);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        nudge(0, step);
        return;
      }
    }
  };
}
