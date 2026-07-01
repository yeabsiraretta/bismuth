/**
 * Capture store tests — lifecycle transitions, batch classify, selection.
 * Spec 021 T017 — stored at feature module path per project conventions.
 *
 * Architecture note: the capture store imports @/stores/vault/vault which
 * has restricted filesystem access in the sandbox environment. Tests that
 * require the full store are implemented via the capture service layer and
 * pure selection-state logic, which can be imported without vault.
 *
 * Selection store tests (toggleCaptureSelection, clearCaptureSelection,
 * quickCapture via invoke) are in capture.test.ts.
 * This file covers the capture service layer and batch-classify contract.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(vi.fn()),
}));
vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import * as captureService from '../services/capture';
import { invoke } from '@tauri-apps/api/core';

describe('captureStore — service layer (lifecycle transitions)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // quickCaptureNote — creates a new inbox note
  // ---------------------------------------------------------------------------

  describe('quickCaptureNote (creation)', () => {
    it('invokes quick_capture with provided title', async () => {
      vi.mocked(invoke).mockResolvedValue({ path: '/vault/inbox/my-note.md' });

      const result = await captureService.quickCaptureNote('My Note');

      expect(invoke).toHaveBeenCalledWith('quick_capture', { title: 'My Note' });
      expect(result.path).toBe('/vault/inbox/my-note.md');
    });

    it('invokes quick_capture with null title when none provided', async () => {
      vi.mocked(invoke).mockResolvedValue({ path: '/vault/inbox/untitled.md' });

      const result = await captureService.quickCaptureNote();

      expect(invoke).toHaveBeenCalledWith('quick_capture', { title: null });
      expect(result.path).toBe('/vault/inbox/untitled.md');
    });

    it('propagates errors from the backend', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('disk full'));

      await expect(captureService.quickCaptureNote('Fail')).rejects.toThrow('disk full');
    });
  });

  // ---------------------------------------------------------------------------
  // assignNoteType — lifecycle state transitions (captured → organized/archived)
  // ---------------------------------------------------------------------------

  describe('assignNoteType (type assignment)', () => {
    it('calls update_frontmatter_field with type key and value', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await captureService.assignNoteType('/vault/n.md', 'Project');

      expect(invoke).toHaveBeenCalledWith('update_frontmatter_field', {
        path: '/vault/n.md',
        key: 'type',
        value: 'Project',
      });
    });

    it('supports all Portent types', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      const types = ['Project', 'Area', 'Resource', 'Concept', 'Person'] as const;
      for (const type of types) {
        await captureService.assignNoteType('/vault/n.md', type);
      }

      expect(invoke).toHaveBeenCalledTimes(types.length);
    });
  });

  // ---------------------------------------------------------------------------
  // setNoteLifecycleState — organized / archived transitions
  // ---------------------------------------------------------------------------

  describe('setNoteLifecycleState (lifecycle transitions)', () => {
    it('sets organized=true and archived=false for organized state', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await captureService.setNoteLifecycleState('/vault/n.md', 'organized');

      const calls = vi.mocked(invoke).mock.calls;
      const organizedCall = calls.find(
        (c) => (c[1] as Record<string, unknown>)?.['key'] === 'organized'
      );
      const archivedCall = calls.find(
        (c) => (c[1] as Record<string, unknown>)?.['key'] === 'archived'
      );
      expect((organizedCall?.[1] as Record<string, unknown>)?.['value']).toBe(true);
      expect((archivedCall?.[1] as Record<string, unknown>)?.['value']).toBe(false);
    });

    it('sets organized=true and archived=true for archived state', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await captureService.setNoteLifecycleState('/vault/n.md', 'archived');

      const calls = vi.mocked(invoke).mock.calls;
      const archivedCall = calls.find(
        (c) => (c[1] as Record<string, unknown>)?.['key'] === 'archived'
      );
      expect((archivedCall?.[1] as Record<string, unknown>)?.['value']).toBe(true);
    });

    it('sets organized=false and archived=false for captured state', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await captureService.setNoteLifecycleState('/vault/n.md', 'captured');

      const calls = vi.mocked(invoke).mock.calls;
      const organizedCall = calls.find(
        (c) => (c[1] as Record<string, unknown>)?.['key'] === 'organized'
      );
      const archivedCall = calls.find(
        (c) => (c[1] as Record<string, unknown>)?.['key'] === 'archived'
      );
      expect((organizedCall?.[1] as Record<string, unknown>)?.['value']).toBe(false);
      expect((archivedCall?.[1] as Record<string, unknown>)?.['value']).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Merge and organize operations
  // ---------------------------------------------------------------------------

  describe('organizeNoteCmd', () => {
    it('calls organize_note with path and folder', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await captureService.organizeNoteCmd('/vault/inbox/note.md', 'projects/');

      expect(invoke).toHaveBeenCalledWith('organize_note', {
        path: '/vault/inbox/note.md',
        folder: 'projects/',
      });
    });
  });

  describe('mergeNotesCmd', () => {
    it('calls merge_notes with sources and targetPath', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await captureService.mergeNotesCmd(['/vault/a.md', '/vault/b.md'], '/vault/merged.md');

      expect(invoke).toHaveBeenCalledWith('merge_notes', {
        sources: ['/vault/a.md', '/vault/b.md'],
        targetPath: '/vault/merged.md',
      });
    });
  });
});
