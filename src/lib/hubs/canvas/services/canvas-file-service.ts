import { CANVAS_LIST_KEY } from '@/constants/storage-keys';
import type { ConnectionElement } from '@/hubs/canvas/services/canvas-connections';
import type { CanvasElement } from '@/hubs/canvas/types/canvas-types';
import { deleteNote, readNote, writeNote } from '@/sal/note-service';
import { log } from '@/utils/log/logger';

// ── .canvas file format ──────────────────────────────────────────

export interface CanvasFileData {
  version: 1;
  elements: CanvasElement[];
  connections: ConnectionElement[];
  viewport: { x: number; y: number; zoom: number };
}

export interface CanvasFileEntry {
  path: string;
  name: string;
  modifiedAt: number;
}

const fileLog = log.child('canvas-file');

export function emptyCanvasData(): CanvasFileData {
  return { version: 1, elements: [], connections: [], viewport: { x: 0, y: 0, zoom: 1 } };
}

// ── Canvas list persistence ──────────────────────────────────────

export function getCanvasList(): CanvasFileEntry[] {
  try {
    const raw = localStorage.getItem(CANVAS_LIST_KEY);
    return raw ? (JSON.parse(raw) as CanvasFileEntry[]) : [];
  } catch {
    return [];
  }
}

function saveCanvasList(list: CanvasFileEntry[]): void {
  localStorage.setItem(CANVAS_LIST_KEY, JSON.stringify(list));
}

export function canvasNameFromPath(path: string): string {
  const base = path.split('/').pop() ?? path;
  return base.replace(/\.canvas$/, '');
}

// ── CRUD ─────────────────────────────────────────────────────────

export async function createCanvasFile(name: string, folder?: string): Promise<CanvasFileEntry> {
  const safeName = name.trim() || 'Untitled';
  const path = folder ? `${folder}/${safeName}.canvas` : `${safeName}.canvas`;
  const data = emptyCanvasData();
  await writeNote(path, JSON.stringify(data, null, 2));
  const entry: CanvasFileEntry = { path, name: safeName, modifiedAt: Date.now() };
  const list = getCanvasList().filter((e) => e.path !== path);
  list.push(entry);
  saveCanvasList(list);
  fileLog.info('Created canvas', { path });
  return entry;
}

export async function loadCanvasFile(path: string): Promise<CanvasFileData> {
  try {
    const resp = await readNote(path);
    return JSON.parse(resp.content) as CanvasFileData;
  } catch {
    fileLog.warn('Failed to load canvas, returning empty', { path });
    return emptyCanvasData();
  }
}

export async function saveCanvasFile(path: string, data: CanvasFileData): Promise<void> {
  await writeNote(path, JSON.stringify(data, null, 2));
  const list = getCanvasList();
  const idx = list.findIndex((e) => e.path === path);
  if (idx >= 0) {
    list[idx].modifiedAt = Date.now();
    saveCanvasList(list);
  }
}

export async function deleteCanvasFile(path: string): Promise<void> {
  await deleteNote(path);
  const list = getCanvasList().filter((e) => e.path !== path);
  saveCanvasList(list);
  fileLog.info('Deleted canvas', { path });
}

export async function renameCanvasFile(oldPath: string, newName: string): Promise<CanvasFileEntry> {
  const data = await loadCanvasFile(oldPath);
  const folder = oldPath.includes('/') ? oldPath.split('/').slice(0, -1).join('/') : undefined;
  const newPath = folder ? `${folder}/${newName}.canvas` : `${newName}.canvas`;
  await writeNote(newPath, JSON.stringify(data, null, 2));
  await deleteNote(oldPath);
  const list = getCanvasList().filter((e) => e.path !== oldPath);
  const entry: CanvasFileEntry = { path: newPath, name: newName, modifiedAt: Date.now() };
  list.push(entry);
  saveCanvasList(list);
  fileLog.info('Renamed canvas', { oldPath, newPath });
  return entry;
}
