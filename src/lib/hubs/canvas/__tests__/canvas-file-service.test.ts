import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  canvasNameFromPath,
  createCanvasFile,
  deleteCanvasFile,
  emptyCanvasData,
  getCanvasList,
  loadCanvasFile,
  renameCanvasFile,
  saveCanvasFile,
} from '@/hubs/canvas/services/canvas-file-service';

// ── Mock SAL ───────────────────────────────────────────────────────

const mockStore = new Map<string, string>();

vi.mock('@/sal/note-service', () => ({
  readNote: vi.fn(async (path: string) => {
    const content = mockStore.get(path) ?? '';
    return { path, title: path, content, modifiedAt: Date.now(), createdAt: Date.now() };
  }),
  writeNote: vi.fn(async (path: string, content: string) => {
    mockStore.set(path, content);
  }),
  deleteNote: vi.fn(async (path: string) => {
    mockStore.delete(path);
  }),
}));

vi.mock('@/utils/log/logger', () => ({
  log: { child: () => ({ info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() }) },
}));

// ── Mock localStorage ──────────────────────────────────────────────

const lsStore = new Map<string, string>();
const lsMock = {
  getItem: vi.fn((key: string) => lsStore.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    lsStore.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    lsStore.delete(key);
  }),
};
Object.defineProperty(globalThis, 'localStorage', { value: lsMock, writable: true });

// ── Setup / Teardown ───────────────────────────────────────────────

beforeEach(() => {
  mockStore.clear();
  lsStore.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────

describe('canvasNameFromPath', () => {
  it('extracts name from path', () => {
    expect(canvasNameFromPath('My Canvas.canvas')).toBe('My Canvas');
    expect(canvasNameFromPath('folder/nested/Board.canvas')).toBe('Board');
  });

  it('handles paths without .canvas extension', () => {
    expect(canvasNameFromPath('plain-file')).toBe('plain-file');
  });
});

describe('emptyCanvasData', () => {
  it('returns valid empty structure', () => {
    const data = emptyCanvasData();
    expect(data.version).toBe(1);
    expect(data.elements).toEqual([]);
    expect(data.connections).toEqual([]);
    expect(data.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
  });
});

describe('createCanvasFile', () => {
  it('creates a canvas file and adds to list', async () => {
    const entry = await createCanvasFile('My Canvas');
    expect(entry.path).toBe('My Canvas.canvas');
    expect(entry.name).toBe('My Canvas');
    expect(entry.modifiedAt).toBeGreaterThan(0);

    const list = getCanvasList();
    expect(list).toHaveLength(1);
    expect(list[0].path).toBe('My Canvas.canvas');

    const stored = mockStore.get('My Canvas.canvas');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.version).toBe(1);
    expect(parsed.elements).toEqual([]);
  });

  it('creates in a subfolder', async () => {
    const entry = await createCanvasFile('Board', 'projects');
    expect(entry.path).toBe('projects/Board.canvas');
  });

  it('trims whitespace from name', async () => {
    const entry = await createCanvasFile('  Trimmed  ');
    expect(entry.name).toBe('Trimmed');
    expect(entry.path).toBe('Trimmed.canvas');
  });

  it('uses Untitled for empty name', async () => {
    const entry = await createCanvasFile('');
    expect(entry.name).toBe('Untitled');
  });
});

describe('loadCanvasFile', () => {
  it('loads saved canvas data', async () => {
    await createCanvasFile('Test');
    const data = await loadCanvasFile('Test.canvas');
    expect(data.version).toBe(1);
    expect(data.elements).toEqual([]);
  });

  it('returns empty data for missing file', async () => {
    const data = await loadCanvasFile('nonexistent.canvas');
    expect(data.version).toBe(1);
    expect(data.elements).toEqual([]);
  });
});

describe('saveCanvasFile', () => {
  it('saves data and updates modifiedAt', async () => {
    await createCanvasFile('Test');
    const before = getCanvasList()[0].modifiedAt;

    // Small delay so timestamp changes
    await new Promise((r) => setTimeout(r, 10));

    const data = emptyCanvasData();
    data.elements = [
      {
        id: '1',
        kind: 'card',
        name: '',
        x: 0,
        y: 0,
        width: 100,
        height: 80,
        rotation: 0,
        opacity: 1,
        locked: false,
        layerId: 'default',
        zIndex: 0,
        title: 'Test',
        content: '',
        color: '#fff',
      },
    ] as ReturnType<typeof emptyCanvasData>['elements'];
    await saveCanvasFile('Test.canvas', data);

    const after = getCanvasList()[0].modifiedAt;
    expect(after).toBeGreaterThanOrEqual(before);

    const loaded = await loadCanvasFile('Test.canvas');
    expect(loaded.elements).toHaveLength(1);
  });
});

describe('deleteCanvasFile', () => {
  it('removes from list and storage', async () => {
    await createCanvasFile('ToDelete');
    expect(getCanvasList()).toHaveLength(1);

    await deleteCanvasFile('ToDelete.canvas');
    expect(getCanvasList()).toHaveLength(0);
    expect(mockStore.has('ToDelete.canvas')).toBe(false);
  });
});

describe('renameCanvasFile', () => {
  it('renames canvas and updates list', async () => {
    await createCanvasFile('OldName');
    const entry = await renameCanvasFile('OldName.canvas', 'NewName');

    expect(entry.path).toBe('NewName.canvas');
    expect(entry.name).toBe('NewName');

    const list = getCanvasList();
    expect(list).toHaveLength(1);
    expect(list[0].path).toBe('NewName.canvas');
    expect(mockStore.has('OldName.canvas')).toBe(false);
    expect(mockStore.has('NewName.canvas')).toBe(true);
  });

  it('preserves canvas data through rename', async () => {
    await createCanvasFile('Original');
    const data = emptyCanvasData();
    data.viewport.zoom = 2.5;
    await saveCanvasFile('Original.canvas', data);

    await renameCanvasFile('Original.canvas', 'Renamed');
    const loaded = await loadCanvasFile('Renamed.canvas');
    expect(loaded.viewport.zoom).toBe(2.5);
  });
});

describe('getCanvasList', () => {
  it('returns empty array when no canvases', () => {
    expect(getCanvasList()).toEqual([]);
  });

  it('returns multiple canvases', async () => {
    await createCanvasFile('A');
    await createCanvasFile('B');
    await createCanvasFile('C');
    expect(getCanvasList()).toHaveLength(3);
  });
});
