import { writable, derived, get } from 'svelte/store';
import type { CanvasDocument, Viewport, Tool, CanvasSettings } from '@/types/canvas';
import * as canvasService from '@/services/canvas/canvas';
import { log } from '@/utils/logger';

// ─── State Declarations ──────────────────────────────────────────────────────

/** The currently loaded canvas document, or `null` when no canvas is open. */
export const currentCanvas = writable<CanvasDocument | null>(null);

/** Current camera position and zoom level. */
export const viewport = writable<Viewport>({
  x: 0,
  y: 0,
  scale: 1.0,
});

/** Grid, snap, and display preferences for the canvas workspace. */
export const canvasSettings = writable<CanvasSettings>({
  gridSize: 16,
  snapToGrid: true,
  showGrid: true,
  showRulers: false,
  showPixelGrid: false,
});

/** The currently active drawing/interaction tool. */
export const activeTool = writable<Tool>('select');

/** IDs of all currently selected elements (supports multi-select). */
export const selectedElements = writable<string[]>([]);

/** All canvases in the vault, used by the library/picker view. */
export const canvasList = writable<CanvasDocument[]>([]);

/** ID of the currently visible page in a multi-page canvas. */
export const activePageId = writable<string>('');

/** Epoch seconds of the last save/load — used to derive `isModified`. */
export const lastSavedAt = writable<number>(0);

/** Derived: `true` when the canvas has unsaved changes. */
export const isModified = derived(
  [currentCanvas, lastSavedAt],
  ([$canvas, $lastSavedAt]: [CanvasDocument | null, number]) => {
    if (!$canvas) return false;
    return $canvas.modified_at > $lastSavedAt;
  }
);

// ─── Selection Helpers ───────────────────────────────────────────────────────

/** Adds an element to the current selection (no-op if already selected). */
export function selectElement(elementId: string) {
  selectedElements.update((selected: string[]) => {
    if (!selected.includes(elementId)) {
      return [...selected, elementId];
    }
    return selected;
  });
}

/** Removes a single element from the selection. */
export function deselectElement(elementId: string) {
  selectedElements.update((selected: string[]) => selected.filter((id: string) => id !== elementId));
}

/** Empties the selection set. */
export function clearSelection() {
  selectedElements.set([]);
}

/** Toggles an element in/out of the selection. */
export function toggleSelection(elementId: string) {
  selectedElements.update((selected: string[]) => {
    if (selected.includes(elementId)) {
      return selected.filter((id: string) => id !== elementId);
    }
    return [...selected, elementId];
  });
}

// ─── Canvas CRUD Operations ──────────────────────────────────────────────────

/**
 * Creates a new canvas via backend IPC and makes it the active document.
 * @param name - Display name for the new canvas.
 */
export async function createNewCanvas(name: string) {
  log.info('Creating new canvas', { name });
  try {
    const canvas = await canvasService.createCanvas(name);
    currentCanvas.set(canvas);
    viewport.set({ x: 0, y: 0, scale: 1.0 });
    selectedElements.set([]);
    lastSavedAt.set(canvas.modified_at);
    log.info('Canvas created and loaded', { id: canvas.id });
  } catch (error) {
    log.error('Failed to create canvas', error as Error);
    throw error;
  }
}

/**
 * Loads an existing canvas by ID from the backend database.
 * Resets viewport and selection state.
 * @param id - Canvas document ID.
 */
export async function loadCanvas(id: string) {
  log.info('Loading canvas', { id });
  try {
    const canvas = await canvasService.loadCanvas(id);
    currentCanvas.set(canvas);
    viewport.set(canvas.viewport);
    selectedElements.set([]);
    lastSavedAt.set(canvas.modified_at);
    log.info('Canvas loaded', { id: canvas.id, name: canvas.name });
  } catch (error) {
    log.error('Failed to load canvas', error as Error);
    throw error;
  }
}

/**
 * Persists the current canvas state (elements, viewport, metadata) to the backend.
 * No-ops if no canvas is loaded.
 */
export async function saveCurrentCanvas() {
  const canvas = get(currentCanvas);

  if (!canvas) {
    log.warn('No canvas to save');
    return;
  }

  log.info('Saving canvas', { id: canvas.id });
  try {
    const currentViewport = get(viewport);
    canvas.viewport = currentViewport;
    canvas.modified_at = Math.floor(Date.now() / 1000);

    await canvasService.saveCanvas(canvas);
    currentCanvas.set(canvas);
    lastSavedAt.set(canvas.modified_at);
    log.info('Canvas saved successfully', { id: canvas.id });
  } catch (error) {
    log.error('Failed to save canvas', error as Error);
    throw error;
  }
}

/** Fetches all canvases from the backend and updates the library store. */
export async function refreshCanvasList() {
  log.debug('Refreshing canvas list');
  try {
    const canvases = await canvasService.listCanvases();
    canvasList.set(canvases);
    log.info('Canvas list refreshed', { count: canvases.length });
  } catch (error) {
    log.error('Failed to refresh canvas list', error as Error);
    throw error;
  }
}

/**
 * Deletes a canvas by ID. Unloads it if currently open.
 * @param id - Canvas document ID to delete.
 */
export async function deleteCanvasById(id: string) {
  log.info('Deleting canvas', { id });
  try {
    await canvasService.deleteCanvas(id);

    const canvas = get(currentCanvas);
    if (canvas && canvas.id === id) {
      currentCanvas.set(null);
    }

    await refreshCanvasList();
    log.info('Canvas deleted successfully', { id });
  } catch (error) {
    log.error('Failed to delete canvas', error as Error);
    throw error;
  }
}

/** Directly sets the viewport (pan/zoom) state. */
export function setViewport(newViewport: Viewport) {
  viewport.set(newViewport);
}

/** Switches the active drawing/interaction tool. */
export function setActiveTool(tool: Tool) {
  activeTool.set(tool);
  log.debug('Active tool changed', { tool });
}

// ─── Re-exports from split modules ──────────────────────────────────────────

export {
  addElement,
  updateElement,
  deleteElement,
  deleteSelectedElements,
  copySelectedElements,
  pasteElements,
  duplicateSelectedElements,
} from './canvasElements';

export {
  groupSelectedElements,
  ungroupSelectedElements,
  alignSelectedElements,
  distributeSelectedElements,
  activePageElements,
  addPage,
  renamePage,
  deletePage,
  switchPage,
  createComponentFromSelection,
  insertComponentInstance,
} from './canvasArrangement';
