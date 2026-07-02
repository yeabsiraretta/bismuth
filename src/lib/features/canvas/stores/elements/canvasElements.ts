import { get } from 'svelte/store';
import type { CanvasElement, CanvasDocument, FlowLink } from '@/features/canvas/types';
import {
  currentCanvas,
  selectedElements,
  clearSelection,
  selectElement,
  selectedFlowLink,
} from './canvasStore';
import { generateId } from '@/utils/id';
import { log } from '@/utils/logger';

/**
 * Appends a new element to the current canvas and marks it as modified.
 * @param element - The fully-constructed element to add.
 */
export function addElement(element: CanvasElement) {
  currentCanvas.update((canvas: CanvasDocument | null) => {
    if (!canvas) return canvas;
    canvas.elements.push(element);
    canvas.modified_at = Math.floor(Date.now() / 1000);
    return canvas;
  });
  log.debug('Element added', { id: element.id, type: element.element_type });
}

/**
 * Replaces an element in-place by ID, updating modified_at.
 * @param element - The element with updated properties (must have existing ID).
 */
export function updateElement(element: CanvasElement) {
  currentCanvas.update((canvas: CanvasDocument | null) => {
    if (!canvas) return canvas;
    const index = canvas.elements.findIndex((e: CanvasElement) => e.id === element.id);
    if (index !== -1) {
      canvas.elements[index] = element;
      canvas.modified_at = Math.floor(Date.now() / 1000);
    }
    return canvas;
  });
  log.debug('Element updated', { id: element.id });
}

/**
 * Removes a single element by ID, deselects it if selected,
 * and cascade-removes any flow links connected to it.
 * @param elementId - The ID of the element to remove.
 */
export function deleteElement(elementId: string) {
  removeFlowLinksForElement(elementId);
  currentCanvas.update((canvas: CanvasDocument | null) => {
    if (!canvas) return canvas;
    canvas.elements = canvas.elements.filter((e: CanvasElement) => e.id !== elementId);
    canvas.modified_at = Math.floor(Date.now() / 1000);
    return canvas;
  });
  const selected = get(selectedElements);
  if (selected.includes(elementId)) {
    selectedElements.update((s: string[]) => s.filter((id: string) => id !== elementId));
  }
  log.debug('Element deleted', { id: elementId });
}

/** Removes all currently selected elements and clears the selection. */
export function deleteSelectedElements() {
  const ids = get(selectedElements);
  if (ids.length === 0) return;

  // Cascade-remove flow links for all deleted elements (T060)
  currentCanvas.update((canvas: CanvasDocument | null) => {
    if (!canvas) return canvas;
    if (canvas.flowLinks) {
      canvas.flowLinks = canvas.flowLinks.filter(
        (l: FlowLink) => !ids.includes(l.fromFrameId) && !ids.includes(l.toFrameId)
      );
    }
    canvas.elements = canvas.elements.filter((e: CanvasElement) => !ids.includes(e.id));
    canvas.modified_at = Math.floor(Date.now() / 1000);
    return canvas;
  });
  clearSelection();
  log.info('Deleted selected elements', { count: ids.length });
}

/** Internal clipboard buffer for copy/paste operations. */
let clipboard: CanvasElement[] = [];

/** Copies the currently selected elements into the internal clipboard. */
export function copySelectedElements() {
  const ids = get(selectedElements);
  const canvasDoc = get(currentCanvas);
  if (!canvasDoc || ids.length === 0) return;

  clipboard = canvasDoc.elements
    .filter((e: CanvasElement) => ids.includes(e.id))
    .map((e: CanvasElement) => ({ ...e }));

  log.info('Copied elements to clipboard', { count: clipboard.length });
}

/** Pastes clipboard contents with new IDs, offset by 20px. Selects the new elements. */
export function pasteElements() {
  if (clipboard.length === 0) {
    log.warn('Clipboard is empty');
    return;
  }

  const canvasDoc = get(currentCanvas);
  if (!canvasDoc) return;

  const newElements = clipboard.map((e: CanvasElement) => ({
    ...e,
    id: generateId(),
    x: e.x + 20,
    y: e.y + 20,
  }));

  currentCanvas.update((c: CanvasDocument | null) => {
    if (!c) return c;
    c.elements.push(...newElements);
    c.modified_at = Math.floor(Date.now() / 1000);
    return c;
  });

  clearSelection();
  newElements.forEach((e) => selectElement(e.id));

  log.info('Pasted elements', { count: newElements.length });
}

/** Copies then pastes the current selection (duplicate in-place with offset). */
export function duplicateSelectedElements() {
  copySelectedElements();
  setTimeout(() => pasteElements(), 10);
}

// ─── Flow Link CRUD ────────────────────────────────────────────────────────

/**
 * Appends a new flow link to the current canvas document.
 * Initializes flowLinks array if the document does not have one.
 * @param link - The fully-constructed FlowLink to add.
 */
export function addFlowLink(link: FlowLink) {
  currentCanvas.update((canvas: CanvasDocument | null) => {
    if (!canvas) return canvas;
    canvas.flowLinks = [...(canvas.flowLinks ?? []), link];
    canvas.modified_at = Math.floor(Date.now() / 1000);
    return canvas;
  });
  log.debug('Flow link added', { id: link.id, from: link.fromFrameId, to: link.toFrameId });
}

/**
 * Updates a flow link's properties by ID.
 * @param id - The flow link ID to update.
 * @param updates - Partial FlowLink fields to merge.
 */
export function updateFlowLink(id: string, updates: Partial<FlowLink>) {
  currentCanvas.update((canvas: CanvasDocument | null) => {
    if (!canvas || !canvas.flowLinks) return canvas;
    const index = canvas.flowLinks.findIndex((l: FlowLink) => l.id === id);
    if (index !== -1) {
      canvas.flowLinks[index] = { ...canvas.flowLinks[index], ...updates };
      canvas.modified_at = Math.floor(Date.now() / 1000);
    }
    return canvas;
  });
  log.debug('Flow link updated', { id });
}

/**
 * Removes a flow link by ID and clears selection if it was selected.
 * @param id - The flow link ID to remove.
 */
export function removeFlowLink(id: string) {
  currentCanvas.update((canvas: CanvasDocument | null) => {
    if (!canvas || !canvas.flowLinks) return canvas;
    canvas.flowLinks = canvas.flowLinks.filter((l: FlowLink) => l.id !== id);
    canvas.modified_at = Math.floor(Date.now() / 1000);
    return canvas;
  });
  if (get(selectedFlowLink) === id) {
    selectedFlowLink.set(null);
  }
  log.debug('Flow link removed', { id });
}

/**
 * Removes all flow links connected to a given element (frame).
 * Used for cascade deletion when a frame is removed.
 * @param elementId - The frame element ID whose links should be removed.
 */
export function removeFlowLinksForElement(elementId: string) {
  currentCanvas.update((canvas: CanvasDocument | null) => {
    if (!canvas || !canvas.flowLinks) return canvas;
    const before = canvas.flowLinks.length;
    canvas.flowLinks = canvas.flowLinks.filter(
      (l: FlowLink) => l.fromFrameId !== elementId && l.toFrameId !== elementId
    );
    if (canvas.flowLinks.length !== before) {
      canvas.modified_at = Math.floor(Date.now() / 1000);
    }
    return canvas;
  });
  log.debug('Flow links cascade-removed for element', { elementId });
}
