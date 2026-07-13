import { CANVAS_ACTIVE_KEY } from '@/constants/storage-keys';
import type { ConnectionElement } from '@/hubs/canvas/services/canvas-connections';
import {
  type CanvasFileData,
  loadCanvasFile,
  saveCanvasFile,
} from '@/hubs/canvas/services/canvas-file-service';
import {
  beginBatch,
  canRedo,
  canUndo,
  endBatch,
  pushState,
  redo,
  undo,
} from '@/hubs/canvas/services/canvas-history';
import type { CanvasElement } from '@/hubs/canvas/types/canvas-types';
import { log } from '@/utils/log/logger';

const storeLog = log.child('canvas-store');

// ── Active canvas tracking ────────────────────────────────────────

let activeCanvasPath = $state<string | null>(null);
let canvasLoading = $state(false);
let canvasDirty = $state(false);

export function getActiveCanvasPath(): string | null {
  return activeCanvasPath;
}
function isCanvasLoading(): boolean {
  return canvasLoading;
}
function isCanvasDirty(): boolean {
  return canvasDirty;
}

// ── Debounced auto-save ───────────────────────────────────────────

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleAutoSave(): void {
  canvasDirty = true;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    flushCanvas();
  }, 500);
}

async function flushCanvas(): Promise<void> {
  if (!activeCanvasPath || !canvasDirty) return;
  const data: CanvasFileData = {
    version: 1,
    elements,
    connections,
    viewport: { x: 0, y: 0, zoom },
  };
  try {
    await saveCanvasFile(activeCanvasPath, data);
    canvasDirty = false;
    storeLog.debug('Canvas auto-saved', { path: activeCanvasPath });
  } catch {
    /* Tauri-only */
  }
}

// ── Load / switch canvas ──────────────────────────────────────────

export async function openCanvas(path: string): Promise<void> {
  if (activeCanvasPath === path) return;
  await flushCanvas();
  canvasLoading = true;
  activeCanvasPath = path;
  try {
    localStorage.setItem(CANVAS_ACTIVE_KEY, path);
  } catch {
    /* noop */
  }
  try {
    const data = await loadCanvasFile(path);
    elements = data.elements;
    connections = data.connections;
    zoom = data.viewport?.zoom ?? 1;
    selectedIds = [];
    canvasDirty = false;
    storeLog.info('Canvas loaded', { path, elements: elements.length });
  } catch {
    elements = [];
    connections = [];
    zoom = 1;
  }
  canvasLoading = false;
}

function closeCanvas(): void {
  flushCanvas();
  activeCanvasPath = null;
  elements = [];
  connections = [];
  selectedIds = [];
  zoom = 1;
  canvasDirty = false;
  try {
    localStorage.removeItem(CANVAS_ACTIVE_KEY);
  } catch {
    /* noop */
  }
}

export function initCanvasStore(): void {
  try {
    const lastPath = localStorage.getItem(CANVAS_ACTIVE_KEY);
    if (lastPath) openCanvas(lastPath);
  } catch {
    /* noop */
  }
}

export function destroyCanvasStore(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  flushCanvas();
}

// ── State ─────────────────────────────────────────────────────────

let elements = $state<CanvasElement[]>([]);
let selectedIds = $state<string[]>([]);
let activeLayerId = $state('default');
let zoom = $state(1);
let clipboard: CanvasElement[] = [];
let connections = $state<ConnectionElement[]>([]);

// ── Elements (read) ───────────────────────────────────────────────

export function getElements(): CanvasElement[] {
  return elements;
}

export function getSortedElements(): CanvasElement[] {
  return [...elements].sort((a, b) => a.zIndex - b.zIndex);
}

export function getElementById(id: string): CanvasElement | undefined {
  return elements.find((e) => e.id === id);
}

export function getElementsByLayer(layerId: string): CanvasElement[] {
  return elements.filter((e) => e.layerId === layerId);
}

// ── Elements (write) ──────────────────────────────────────────────

function setElements(newElements: CanvasElement[]) {
  elements = newElements;
  scheduleAutoSave();
}

export function addElement(el: CanvasElement) {
  pushState(elements);
  elements = [...elements, { ...el, layerId: el.layerId || activeLayerId }];
  scheduleAutoSave();
}

export function updateElement(id: string, updates: Partial<CanvasElement>) {
  pushState(elements);
  elements = elements.map((e) => (e.id === id ? ({ ...e, ...updates } as CanvasElement) : e));
  scheduleAutoSave();
}

export function deleteElement(id: string) {
  pushState(elements);
  elements = elements.filter((e) => e.id !== id);
  selectedIds = selectedIds.filter((s) => s !== id);
  connections = connections.filter((c) => c.sourceId !== id && c.targetId !== id);
  scheduleAutoSave();
}

export function deleteElements(ids: string[]) {
  pushState(elements);
  const idSet = new Set(ids);
  elements = elements.filter((e) => !idSet.has(e.id));
  selectedIds = selectedIds.filter((s) => !idSet.has(s));
  connections = connections.filter((c) => !idSet.has(c.sourceId) && !idSet.has(c.targetId));
  scheduleAutoSave();
}

// ── Z-order ───────────────────────────────────────────────────────

export function reorderElement(id: string, direction: 'front' | 'back' | 'forward' | 'backward') {
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  const idx = sorted.findIndex((e) => e.id === id);
  if (idx === -1) return;

  if (direction === 'front') {
    const maxZ = Math.max(...sorted.map((e) => e.zIndex));
    updateElement(id, { zIndex: maxZ + 1 } as Partial<CanvasElement>);
  } else if (direction === 'back') {
    const minZ = Math.min(...sorted.map((e) => e.zIndex));
    updateElement(id, { zIndex: minZ - 1 } as Partial<CanvasElement>);
  } else if (direction === 'forward' && idx < sorted.length - 1) {
    const above = sorted[idx + 1];
    const current = sorted[idx];
    updateElement(id, { zIndex: above.zIndex } as Partial<CanvasElement>);
    updateElement(above.id, { zIndex: current.zIndex } as Partial<CanvasElement>);
  } else if (direction === 'backward' && idx > 0) {
    const below = sorted[idx - 1];
    const current = sorted[idx];
    updateElement(id, { zIndex: below.zIndex } as Partial<CanvasElement>);
    updateElement(below.id, { zIndex: current.zIndex } as Partial<CanvasElement>);
  }
}

// ── Selection ─────────────────────────────────────────────────────

export function getSelectedIds(): string[] {
  return selectedIds;
}

function setSelectedIds(ids: string[]) {
  selectedIds = ids;
}

function getSelectedId(): string | null {
  return selectedIds.length === 1 ? selectedIds[0] : null;
}

export function setSelectedId(id: string | null) {
  selectedIds = id ? [id] : [];
}

export function selectElement(id: string, multi = false) {
  if (multi) {
    if (selectedIds.includes(id)) {
      selectedIds = selectedIds.filter((s) => s !== id);
    } else {
      selectedIds = [...selectedIds, id];
    }
  } else {
    selectedIds = [id];
  }
}

function deselectElement(id: string) {
  selectedIds = selectedIds.filter((s) => s !== id);
}

export function clearSelection() {
  selectedIds = [];
}

export function selectAll() {
  selectedIds = elements.filter((e) => !e.locked).map((e) => e.id);
}

export function isSelected(id: string): boolean {
  return selectedIds.includes(id);
}

export function getSelectedElements(): CanvasElement[] {
  return elements.filter((e) => selectedIds.includes(e.id));
}

export function getSelectedCard(): CanvasElement | null {
  if (selectedIds.length !== 1) return null;
  return elements.find((e) => e.id === selectedIds[0]) ?? null;
}

export function duplicateSelected(offsetX = 10, offsetY = 10): CanvasElement[] {
  pushState(elements);
  const selected = getSelectedElements();
  const newEls: CanvasElement[] = selected.map((el) => ({
    ...el,
    id: crypto.randomUUID(),
    x: el.x + offsetX,
    y: el.y + offsetY,
    zIndex: Math.max(...elements.map((e) => e.zIndex), 0) + 1,
  })) as CanvasElement[];
  elements = [...elements, ...newEls];
  selectedIds = newEls.map((e) => e.id);
  scheduleAutoSave();
  return newEls;
}

// ── Undo / Redo ──────────────────────────────────────────────────

export function undoCanvas() {
  const prev = undo(elements);
  if (prev) {
    elements = prev;
    selectedIds = [];
    scheduleAutoSave();
  }
}

export function redoCanvas() {
  const next = redo(elements);
  if (next) {
    elements = next;
    selectedIds = [];
    scheduleAutoSave();
  }
}

export {  canRedo, canUndo,  };

function endBatchCanvas() {
  endBatch(elements);
}

// ── Clipboard ────────────────────────────────────────────────────

export function copySelected() {
  const selected = getSelectedElements();
  if (selected.length === 0) return;
  const minX = Math.min(...selected.map((e) => e.x));
  const minY = Math.min(...selected.map((e) => e.y));
  clipboard = selected.map((el) => ({ ...el, x: el.x - minX, y: el.y - minY }) as CanvasElement);
}

export function pasteClipboard(offsetX = 20, offsetY = 20) {
  if (clipboard.length === 0) return;
  pushState(elements);
  const newEls = clipboard.map((el) => ({
    ...el,
    id: crypto.randomUUID(),
    x: el.x + offsetX,
    y: el.y + offsetY,
    zIndex: Math.max(...elements.map((e) => e.zIndex), 0) + 1,
  })) as CanvasElement[];
  elements = [...elements, ...newEls];
  selectedIds = newEls.map((e) => e.id);
  scheduleAutoSave();
}

export function cutSelected() {
  copySelected();
  const ids = selectedIds.slice();
  if (ids.length > 0) deleteElements(ids);
}

export function hasClipboard(): boolean {
  return clipboard.length > 0;
}

// ── Active layer ──────────────────────────────────────────────────

export function getActiveLayerId(): string {
  return activeLayerId;
}

export function setActiveLayerId(id: string) {
  activeLayerId = id;
}

// ── Zoom ──────────────────────────────────────────────────────────

export function getZoom(): number {
  return zoom;
}

export function setZoom(z: number) {
  zoom = z;
  scheduleAutoSave();
}

// ── Connections ──────────────────────────────────────────────────

export function getConnections(): ConnectionElement[] {
  return connections;
}

export function addConnection(conn: ConnectionElement) {
  connections = [...connections, conn];
  scheduleAutoSave();
}

export function updateConnection(id: string, updates: Partial<ConnectionElement>) {
  connections = connections.map((c) => (c.id === id ? { ...c, ...updates } : c));
  scheduleAutoSave();
}

export function deleteConnection(id: string) {
  connections = connections.filter((c) => c.id !== id);
  scheduleAutoSave();
}

function getConnectionsForElement(elementId: string): ConnectionElement[] {
  return connections.filter((c) => c.sourceId === elementId || c.targetId === elementId);
}
