import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(vi.fn()),
}));
vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('@/stores/vault/vault', () => ({
  notes: { subscribe: vi.fn((fn: any) => { fn([]); return vi.fn(); }) },
  refreshNotes: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/types/data/entity', () => ({
  deriveLifecycle: vi.fn((fm: any) => fm?.organized ? (fm?.archived ? 'archived' : 'organized') : 'captured'),
}));

import {
  selectedCaptures,
  isCaptureLoading,
  toggleCaptureSelection,
  clearCaptureSelection,
  quickCapture,
} from '../stores/capture';
import { invoke } from '@tauri-apps/api/core';

describe('capture store', () => {
  beforeEach(() => {
    selectedCaptures.set(new Set());
    isCaptureLoading.set(false);
    vi.clearAllMocks();
  });

  describe('toggleCaptureSelection', () => {
    it('adds path to selection', () => {
      toggleCaptureSelection('/vault/inbox/a.md');
      expect(get(selectedCaptures).has('/vault/inbox/a.md')).toBe(true);
    });

    it('removes path on second toggle', () => {
      toggleCaptureSelection('/vault/inbox/a.md');
      toggleCaptureSelection('/vault/inbox/a.md');
      expect(get(selectedCaptures).has('/vault/inbox/a.md')).toBe(false);
    });
  });

  describe('clearCaptureSelection', () => {
    it('empties the selection', () => {
      toggleCaptureSelection('/vault/a.md');
      toggleCaptureSelection('/vault/b.md');
      clearCaptureSelection();
      expect(get(selectedCaptures).size).toBe(0);
    });
  });

  describe('quickCapture', () => {
    it('calls invoke and returns path', async () => {
      vi.mocked(invoke).mockResolvedValue({ path: '/vault/inbox/new.md' });
      const path = await quickCapture('My Note');
      expect(invoke).toHaveBeenCalledWith('quick_capture', { title: 'My Note' });
      expect(path).toBe('/vault/inbox/new.md');
    });

    it('passes null title when not provided', async () => {
      vi.mocked(invoke).mockResolvedValue({ path: '/vault/inbox/untitled.md' });
      await quickCapture();
      expect(invoke).toHaveBeenCalledWith('quick_capture', { title: null });
    });

    it('throws on error', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('disk full'));
      await expect(quickCapture('X')).rejects.toThrow();
    });
  });
});
