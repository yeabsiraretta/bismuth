import { writable, derived } from 'svelte/store';
import type { CanvasDocument, Viewport, Tool, CanvasSettings } from '@/types/canvas';
import * as canvasService from '@/services/canvas/canvas';
import { alignElements, distributeElements } from '@/utils/canvasUtils';
import { log } from '@/utils/logger';

// Current canvas document
export const currentCanvas = writable<CanvasDocument | null>(null);

// Viewport state
export const viewport = writable<Viewport>({
  x: 0,
  y: 0,
  scale: 1.0,
});

// Canvas settings
export const canvasSettings = writable<CanvasSettings>({
  gridSize: 16,
  snapToGrid: true,
  showGrid: true,
  showRulers: false,
  showPixelGrid: false,
});

// Active tool
export const activeTool = writable<Tool>('select');

// Selected element IDs
export const selectedElements = writable<string[]>([]);

// Canvas list for library view
export const canvasList = writable<CanvasDocument[]>([]);

// Derived: Is canvas modified
export const isModified = derived(currentCanvas, ($canvas) => {
  if (!$canvas) return false;
  // Compare with last saved state (simplified for now)
  return false;
});

// Actions
export async function createNewCanvas(name: string) {
  log.info('Creating new canvas', { name });
  try {
    const canvas = await canvasService.createCanvas(name);
    currentCanvas.set(canvas);
    viewport.set({ x: 0, y: 0, scale: 1.0 });
    selectedElements.set([]);
    log.info('Canvas created and loaded', { id: canvas.id });
  } catch (error) {
    log.error('Failed to create canvas', error as Error);
    throw error;
  }
}

export async function loadCanvas(id: string) {
  log.info('Loading canvas', { id });
  try {
    const canvas = await canvasService.loadCanvas(id);
    currentCanvas.set(canvas);
    viewport.set(canvas.viewport);
    selectedElements.set([]);
    log.info('Canvas loaded', { id: canvas.id, name: canvas.name });
  } catch (error) {
    log.error('Failed to load canvas', error as Error);
    throw error;
  }
}

export async function saveCurrentCanvas() {
  const canvas = await new Promise<CanvasDocument | null>((resolve) => {
    const unsubscribe = currentCanvas.subscribe((value) => {
      resolve(value);
      unsubscribe();
    });
  });

  if (!canvas) {
    log.warn('No canvas to save');
    return;
  }

  log.info('Saving canvas', { id: canvas.id });
  try {
    // Update viewport before saving
    const currentViewport = await new Promise<Viewport>((resolve) => {
      const unsubscribe = viewport.subscribe((value) => {
        resolve(value);
        unsubscribe();
      });
    });

    canvas.viewport = currentViewport;
    canvas.modified_at = Math.floor(Date.now() / 1000);

    await canvasService.saveCanvas(canvas);
    currentCanvas.set(canvas);
    log.info('Canvas saved successfully', { id: canvas.id });
  } catch (error) {
    log.error('Failed to save canvas', error as Error);
    throw error;
  }
}

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

export async function deleteCanvasById(id: string) {
  log.info('Deleting canvas', { id });
  try {
    await canvasService.deleteCanvas(id);

    // If deleted canvas was current, clear it
    const canvas = await new Promise<CanvasDocument | null>((resolve) => {
      const unsubscribe = currentCanvas.subscribe((value) => {
        resolve(value);
        unsubscribe();
      });
    });

    if (canvas && canvas.id === id) {
      currentCanvas.set(null);
    }

    // Refresh list
    await refreshCanvasList();
    log.info('Canvas deleted successfully', { id });
  } catch (error) {
    log.error('Failed to delete canvas', error as Error);
    throw error;
  }
}

export function setViewport(newViewport: Viewport) {
  viewport.set(newViewport);
}

export function setActiveTool(tool: Tool) {
  activeTool.set(tool);
  log.debug('Active tool changed', { tool });
}

export function selectElement(elementId: string) {
  selectedElements.update((selected) => {
    if (!selected.includes(elementId)) {
      return [...selected, elementId];
    }
    return selected;
  });
}

export function deselectElement(elementId: string) {
  selectedElements.update((selected) => selected.filter((id) => id !== elementId));
}

export function clearSelection() {
  selectedElements.set([]);
}

export function toggleSelection(elementId: string) {
  selectedElements.update((selected) => {
    if (selected.includes(elementId)) {
      return selected.filter((id) => id !== elementId);
    }
    return [...selected, elementId];
  });
}

// Element management actions
export function addElement(element: import('@/types/canvas').CanvasElement) {
  currentCanvas.update((canvas) => {
    if (!canvas) return canvas;
    canvas.elements.push(element);
    canvas.modified_at = Math.floor(Date.now() / 1000);
    return canvas;
  });
  log.debug('Element added', { id: element.id, type: element.element_type });
}

export function updateElement(element: import('@/types/canvas').CanvasElement) {
  currentCanvas.update((canvas) => {
    if (!canvas) return canvas;
    const index = canvas.elements.findIndex((e) => e.id === element.id);
    if (index !== -1) {
      canvas.elements[index] = element;
      canvas.modified_at = Math.floor(Date.now() / 1000);
    }
    return canvas;
  });
  log.debug('Element updated', { id: element.id });
}

export function deleteElement(elementId: string) {
  currentCanvas.update((canvas) => {
    if (!canvas) return canvas;
    canvas.elements = canvas.elements.filter((e) => e.id !== elementId);
    canvas.modified_at = Math.floor(Date.now() / 1000);
    return canvas;
  });
  deselectElement(elementId);
  log.debug('Element deleted', { id: elementId });
}

export function deleteSelectedElements() {
  const selected = new Promise<string[]>((resolve) => {
    const unsubscribe = selectedElements.subscribe((value) => {
      resolve(value);
      unsubscribe();
    });
  });

  selected.then((ids) => {
    currentCanvas.update((canvas) => {
      if (!canvas) return canvas;
      canvas.elements = canvas.elements.filter((e) => !ids.includes(e.id));
      canvas.modified_at = Math.floor(Date.now() / 1000);
      return canvas;
    });
    clearSelection();
    log.info('Deleted selected elements', { count: ids.length });
  });
}

// Clipboard for copy/paste
let clipboard: import('@/types/canvas').CanvasElement[] = [];

// Copy selected elements
export function copySelectedElements() {
  const selected = new Promise<string[]>((resolve) => {
    const unsubscribe = selectedElements.subscribe((value) => {
      resolve(value);
      unsubscribe();
    });
  });

  const canvas = new Promise<import('@/types/canvas').CanvasDocument | null>((resolve) => {
    const unsubscribe = currentCanvas.subscribe((value) => {
      resolve(value);
      unsubscribe();
    });
  });

  Promise.all([selected, canvas]).then(([ids, canvasDoc]) => {
    if (!canvasDoc) return;

    clipboard = canvasDoc.elements
      .filter((e) => ids.includes(e.id))
      .map((e) => ({ ...e })); // Deep copy

    log.info('Copied elements to clipboard', { count: clipboard.length });
  });
}

// Paste elements from clipboard
export function pasteElements() {
  if (clipboard.length === 0) {
    log.warn('Clipboard is empty');
    return;
  }

  const canvas = new Promise<import('@/types/canvas').CanvasDocument | null>((resolve) => {
    const unsubscribe = currentCanvas.subscribe((value) => {
      resolve(value);
      unsubscribe();
    });
  });

  canvas.then((canvasDoc) => {
    if (!canvasDoc) return;

    const newElements = clipboard.map((e) => ({
      ...e,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: e.x + 20, // Offset pasted elements
      y: e.y + 20,
    }));

    currentCanvas.update((c) => {
      if (!c) return c;
      c.elements.push(...newElements);
      c.modified_at = Math.floor(Date.now() / 1000);
      return c;
    });

    // Select pasted elements
    clearSelection();
    newElements.forEach((e) => selectElement(e.id));

    log.info('Pasted elements', { count: newElements.length });
  });
}

// Duplicate selected elements
export function duplicateSelectedElements() {
  copySelectedElements();
  setTimeout(() => pasteElements(), 10);
}

// Group selected elements
export function groupSelectedElements() {
  const selected = new Promise<string[]>((resolve) => {
    const unsubscribe = selectedElements.subscribe((value) => {
      resolve(value);
      unsubscribe();
    });
  });

  const canvas = new Promise<import('@/types/canvas').CanvasDocument | null>((resolve) => {
    const unsubscribe = currentCanvas.subscribe((value) => {
      resolve(value);
      unsubscribe();
    });
  });

  Promise.all([selected, canvas]).then(([ids, canvasDoc]) => {
    if (!canvasDoc || ids.length < 2) {
      log.warn('Need at least 2 elements to group');
      return;
    }

    const elementsToGroup = canvasDoc.elements.filter((e) => ids.includes(e.id));

    // Calculate bounding box
    const minX = Math.min(...elementsToGroup.map((e) => e.x));
    const minY = Math.min(...elementsToGroup.map((e) => e.y));
    const maxX = Math.max(...elementsToGroup.map((e) => e.x + e.width));
    const maxY = Math.max(...elementsToGroup.map((e) => e.y + e.height));

    const groupElement: import('@/types/canvas').CanvasElement = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      element_type: 'group',
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      rotation: 0,
      properties: {
        children: ids,
      },
      layer_id: elementsToGroup[0].layer_id,
      z_index: Math.max(...elementsToGroup.map((e) => e.z_index)),
      locked: false,
      visible: true,
    };

    currentCanvas.update((c) => {
      if (!c) return c;
      c.elements.push(groupElement);
      c.modified_at = Math.floor(Date.now() / 1000);
      return c;
    });

    clearSelection();
    selectElement(groupElement.id);

    log.info('Grouped elements', { count: ids.length, groupId: groupElement.id });
  });
}

// Ungroup selected group
export function ungroupSelectedElements() {
  const selected = new Promise<string[]>((resolve) => {
    const unsubscribe = selectedElements.subscribe((value) => {
      resolve(value);
      unsubscribe();
    });
  });

  const canvas = new Promise<import('@/types/canvas').CanvasDocument | null>((resolve) => {
    const unsubscribe = currentCanvas.subscribe((value) => {
      resolve(value);
      unsubscribe();
    });
  });

  Promise.all([selected, canvas]).then(([ids, canvasDoc]) => {
    if (!canvasDoc || ids.length === 0) return;

    const groupElements = canvasDoc.elements.filter(
      (e) => ids.includes(e.id) && e.element_type === 'group'
    );

    if (groupElements.length === 0) {
      log.warn('No groups selected');
      return;
    }

    currentCanvas.update((c) => {
      if (!c) return c;

      // Remove group elements
      c.elements = c.elements.filter((e) => !groupElements.some((g) => g.id === e.id));
      c.modified_at = Math.floor(Date.now() / 1000);

      return c;
    });

    // Select ungrouped children
    clearSelection();
    groupElements.forEach((group) => {
      const childIds = group.properties.children as string[];
      if (Array.isArray(childIds)) {
        childIds.forEach((id) => selectElement(id));
      }
    });

    log.info('Ungrouped elements', { count: groupElements.length });
  });
}

// Alignment actions
export function alignSelectedElements(alignment: import('@/utils/canvasUtils').AlignmentType) {
  const selected = new Promise<string[]>((resolve) => {
    const unsubscribe = selectedElements.subscribe((value) => {
      resolve(value);
      unsubscribe();
    });
  });

  const canvas = new Promise<import('@/types/canvas').CanvasDocument | null>((resolve) => {
    const unsubscribe = currentCanvas.subscribe((value) => {
      resolve(value);
      unsubscribe();
    });
  });

  Promise.all([selected, canvas]).then(([ids, canvasDoc]) => {
    if (!canvasDoc || ids.length < 2) {
      log.warn('Need at least 2 elements to align');
      return;
    }

    const elementsToAlign = canvasDoc.elements.filter((e) => ids.includes(e.id));
    const alignedElements = alignElements(elementsToAlign, alignment);

    currentCanvas.update((c) => {
      if (!c) return c;

      alignedElements.forEach((aligned: import('@/types/canvas').CanvasElement) => {
        const element = c.elements.find((e) => e.id === aligned.id);
        if (element) {
          element.x = aligned.x;
          element.y = aligned.y;
        }
      });

      c.modified_at = Math.floor(Date.now() / 1000);
      return c;
    });

    log.info('Aligned elements', { alignment, count: ids.length });
  });
}

// ─── Pages ───────────────────────────────────────────────────────────────────

/** Active page ID */
export const activePageId = writable<string>('');

/** Elements visible on the active page */
export const activePageElements = derived(
  [currentCanvas, activePageId],
  ([$canvas, $pageId]) => {
    if (!$canvas) return [];
    const page = $canvas.pages?.find((p) => p.id === $pageId);
    if (!page) return $canvas.elements;
    return $canvas.elements.filter((el) => page.elements.includes(el.id));
  }
);

export function addPage(name: string) {
  const id = `page-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  currentCanvas.update((c) => {
    if (!c) return c;
    const newPage: import('@/types/canvas').Page = {
      id,
      name,
      order: (c.pages?.length || 0) + 1,
      elements: [],
    };
    c.pages = [...(c.pages || []), newPage];
    c.activePageId = id;
    c.modified_at = Math.floor(Date.now() / 1000);
    return c;
  });
  activePageId.set(id);
  log.info('Page added', { id, name });
}

export function renamePage(pageId: string, name: string) {
  currentCanvas.update((c) => {
    if (!c) return c;
    const page = c.pages?.find((p) => p.id === pageId);
    if (page) page.name = name;
    return c;
  });
}

export function deletePage(pageId: string) {
  currentCanvas.update((c) => {
    if (!c) return c;
    c.pages = (c.pages || []).filter((p) => p.id !== pageId);
    // Remove orphaned elements
    c.elements = c.elements.filter(
      (el) => !c.pages || c.pages.some((p) => p.elements.includes(el.id))
    );
    if (c.activePageId === pageId && c.pages.length > 0) {
      c.activePageId = c.pages[0].id;
      activePageId.set(c.activePageId);
    }
    c.modified_at = Math.floor(Date.now() / 1000);
    return c;
  });
  log.info('Page deleted', { pageId });
}

export function switchPage(pageId: string) {
  activePageId.set(pageId);
  currentCanvas.update((c) => {
    if (!c) return c;
    c.activePageId = pageId;
    return c;
  });
  clearSelection();
  log.debug('Switched to page', { pageId });
}

// ─── Components (Reusable Symbols) ──────────────────────────────────────────

export function createComponentFromSelection() {
  const getSync = <T>(store: { subscribe: (fn: (v: T) => void) => () => void }): T => {
    let val: T;
    store.subscribe((v: T) => { val = v; })();
    return val!;
  };

  const ids = getSync(selectedElements);
  const canvasDoc = getSync(currentCanvas);
  if (!canvasDoc || ids.length === 0) return;

  const elements = canvasDoc.elements.filter((e) => ids.includes(e.id));
  if (elements.length === 0) return;

  const minX = Math.min(...elements.map((e) => e.x));
  const minY = Math.min(...elements.map((e) => e.y));
  const maxX = Math.max(...elements.map((e) => e.x + e.width));
  const maxY = Math.max(...elements.map((e) => e.y + e.height));

  // Normalize positions relative to component origin
  const normalized = elements.map((e) => ({
    ...e,
    x: e.x - minX,
    y: e.y - minY,
  }));

  const compId = `comp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const component: import('@/types/canvas').ComponentDefinition = {
    id: compId,
    name: `Component ${(canvasDoc.components?.length || 0) + 1}`,
    elements: normalized,
    exposedProps: [],
    width: maxX - minX,
    height: maxY - minY,
    created_at: Math.floor(Date.now() / 1000),
    modified_at: Math.floor(Date.now() / 1000),
  };

  // Replace selection with a component instance
  const instanceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const instance: import('@/types/canvas').CanvasElement = {
    id: instanceId,
    element_type: 'component_instance',
    x: minX,
    y: minY,
    width: component.width,
    height: component.height,
    rotation: 0,
    properties: { componentId: compId, overrides: {} },
    layer_id: elements[0].layer_id,
    z_index: Math.max(...elements.map((e) => e.z_index)),
    locked: false,
    visible: true,
  };

  currentCanvas.update((c) => {
    if (!c) return c;
    c.components = [...(c.components || []), component];
    c.elements = c.elements.filter((e) => !ids.includes(e.id));
    c.elements.push(instance);
    c.modified_at = Math.floor(Date.now() / 1000);
    return c;
  });

  clearSelection();
  selectElement(instanceId);
  log.info('Component created', { id: compId, name: component.name });
}

export function insertComponentInstance(componentId: string, x: number, y: number) {
  const getSync = <T>(store: { subscribe: (fn: (v: T) => void) => () => void }): T => {
    let val: T;
    store.subscribe((v: T) => { val = v; })();
    return val!;
  };

  const canvasDoc = getSync(currentCanvas);
  if (!canvasDoc) return;

  const comp = canvasDoc.components?.find((c) => c.id === componentId);
  if (!comp) return;

  const instanceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const instance: import('@/types/canvas').CanvasElement = {
    id: instanceId,
    element_type: 'component_instance',
    x,
    y,
    width: comp.width,
    height: comp.height,
    rotation: 0,
    properties: { componentId, overrides: {} },
    layer_id: canvasDoc.layers[0]?.id || 'default',
    z_index: canvasDoc.elements.length,
    locked: false,
    visible: true,
  };

  addElement(instance);
  clearSelection();
  selectElement(instanceId);
  log.info('Component instance inserted', { componentId, instanceId });
}

// Distribution actions
export function distributeSelectedElements(direction: 'horizontal' | 'vertical') {
  const selected = new Promise<string[]>((resolve) => {
    const unsubscribe = selectedElements.subscribe((value) => {
      resolve(value);
      unsubscribe();
    });
  });

  const canvas = new Promise<import('@/types/canvas').CanvasDocument | null>((resolve) => {
    const unsubscribe = currentCanvas.subscribe((value) => {
      resolve(value);
      unsubscribe();
    });
  });

  Promise.all([selected, canvas]).then(([ids, canvasDoc]) => {
    if (!canvasDoc || ids.length < 3) {
      log.warn('Need at least 3 elements to distribute');
      return;
    }

    const elementsToDistribute = canvasDoc.elements.filter((e) => ids.includes(e.id));
    const distributedElements = distributeElements(elementsToDistribute, direction);

    currentCanvas.update((c) => {
      if (!c) return c;

      distributedElements.forEach((distributed: import('@/types/canvas').CanvasElement) => {
        const element = c.elements.find((e) => e.id === distributed.id);
        if (element) {
          element.x = distributed.x;
          element.y = distributed.y;
        }
      });

      c.modified_at = Math.floor(Date.now() / 1000);
      return c;
    });

    log.info('Distributed elements', { direction, count: ids.length });
  });
}
