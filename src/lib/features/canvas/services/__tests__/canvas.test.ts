import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));
vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  createCanvas,
  saveCanvas,
  loadCanvas,
  listCanvases,
  deleteCanvas,
  linkCanvasToNote,
  getCanvasesForNote,
} from '../canvas';
import { invoke } from '@tauri-apps/api/core';
import type { CanvasDocument } from '@/features/canvas/types';

const mockCanvas: CanvasDocument = {
  id: 'canvas-1',
  name: 'Test Canvas',
  elements: [],
  layers: [],
  pages: [],
  created_at: 1000,
  modified_at: 1000,
} as unknown as CanvasDocument;

describe('canvas service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCanvas', () => {
    it('calls invoke with name', async () => {
      vi.mocked(invoke).mockResolvedValue(mockCanvas);
      const result = await createCanvas('My Canvas');
      expect(invoke).toHaveBeenCalledWith('create_canvas', { name: 'My Canvas' });
      expect(result.id).toBe('canvas-1');
    });

    it('throws on failure', async () => {
      vi.mocked(invoke).mockRejectedValue('db error');
      await expect(createCanvas('x')).rejects.toThrow('Failed to create canvas');
    });
  });

  describe('saveCanvas', () => {
    it('calls invoke with canvas object', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);
      await saveCanvas(mockCanvas);
      expect(invoke).toHaveBeenCalledWith('save_canvas', { canvas: mockCanvas });
    });

    it('throws on failure', async () => {
      vi.mocked(invoke).mockRejectedValue('write error');
      await expect(saveCanvas(mockCanvas)).rejects.toThrow('Failed to save canvas');
    });
  });

  describe('loadCanvas', () => {
    it('calls invoke with id', async () => {
      vi.mocked(invoke).mockResolvedValue(mockCanvas);
      const result = await loadCanvas('canvas-1');
      expect(invoke).toHaveBeenCalledWith('load_canvas', { id: 'canvas-1' });
      expect(result.name).toBe('Test Canvas');
    });

    it('throws on failure', async () => {
      vi.mocked(invoke).mockRejectedValue('not found');
      await expect(loadCanvas('bad-id')).rejects.toThrow('Failed to load canvas');
    });
  });

  describe('listCanvases', () => {
    it('calls invoke and returns array', async () => {
      vi.mocked(invoke).mockResolvedValue([mockCanvas]);
      const result = await listCanvases();
      expect(invoke).toHaveBeenCalledWith('list_canvases');
      expect(result).toHaveLength(1);
    });
  });

  describe('deleteCanvas', () => {
    it('calls invoke with id', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);
      await deleteCanvas('canvas-1');
      expect(invoke).toHaveBeenCalledWith('delete_canvas', { id: 'canvas-1' });
    });

    it('throws on failure', async () => {
      vi.mocked(invoke).mockRejectedValue('permission denied');
      await expect(deleteCanvas('x')).rejects.toThrow('Failed to delete canvas');
    });
  });

  describe('linkCanvasToNote', () => {
    it('calls invoke with canvasId and notePath', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);
      await linkCanvasToNote('canvas-1', '/vault/note.md');
      expect(invoke).toHaveBeenCalledWith('link_canvas_to_note', {
        canvasId: 'canvas-1',
        notePath: '/vault/note.md',
      });
    });

    it('can unlink with null notePath', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);
      await linkCanvasToNote('canvas-1', null);
      expect(invoke).toHaveBeenCalledWith('link_canvas_to_note', {
        canvasId: 'canvas-1',
        notePath: null,
      });
    });
  });

  describe('getCanvasesForNote', () => {
    it('calls invoke with notePath', async () => {
      vi.mocked(invoke).mockResolvedValue([mockCanvas]);
      const result = await getCanvasesForNote('/vault/note.md');
      expect(invoke).toHaveBeenCalledWith('get_canvases_for_note', { notePath: '/vault/note.md' });
      expect(result).toHaveLength(1);
    });
  });
});
