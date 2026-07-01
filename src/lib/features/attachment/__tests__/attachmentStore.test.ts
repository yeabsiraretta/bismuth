import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  attachmentConfig,
  attachmentOverrides,
  originalNames,
  updateAttachmentConfig,
  resetAttachmentConfig,
  setOverride,
  removeOverride,
  resetOverridesForPath,
  clearOverrides,
  clearOriginalNames,
  recordOriginalName,
  getOriginalName,
  pruneOriginalNames,
} from '../stores/attachmentStore';
import type { AttachmentOverride } from '../types';

describe('attachmentStore', () => {
  beforeEach(() => {
    resetAttachmentConfig();
    clearOverrides();
    clearOriginalNames();
    vi.clearAllMocks();
  });

  describe('config', () => {
    it('provides default config', () => {
      const cfg = get(attachmentConfig);
      expect(cfg.rootPathMode).toBe('subfolder');
      expect(cfg.attachmentPath).toBe('${notepath}/${notename}');
      expect(cfg.attachmentFormat).toBe('IMG-${date}');
    });

    it('updateAttachmentConfig merges partial', () => {
      updateAttachmentConfig({ fixedRoot: 'media' });
      expect(get(attachmentConfig).fixedRoot).toBe('media');
      expect(get(attachmentConfig).rootPathMode).toBe('subfolder');
    });

    it('resetAttachmentConfig restores defaults', () => {
      updateAttachmentConfig({ fixedRoot: 'changed' });
      resetAttachmentConfig();
      expect(get(attachmentConfig).fixedRoot).toBe('attachments');
    });
  });

  describe('overrides', () => {
    const mkOverride = (id: string, path: string): AttachmentOverride => ({
      id,
      targetPath: path,
      targetType: 'file',
      attachmentPath: 'p',
      attachmentFormat: 'f',
      dateFormat: '',
    });

    it('setOverride adds a new override', () => {
      setOverride(mkOverride('1', '/a.md'));
      expect(get(attachmentOverrides)).toHaveLength(1);
    });

    it('setOverride updates existing by id', () => {
      setOverride(mkOverride('1', '/a.md'));
      setOverride({ ...mkOverride('1', '/b.md') });
      const overrides = get(attachmentOverrides);
      expect(overrides).toHaveLength(1);
      expect(overrides[0].targetPath).toBe('/b.md');
    });

    it('removeOverride removes by id', () => {
      setOverride(mkOverride('1', '/a.md'));
      setOverride(mkOverride('2', '/b.md'));
      removeOverride('1');
      expect(get(attachmentOverrides)).toHaveLength(1);
      expect(get(attachmentOverrides)[0].id).toBe('2');
    });

    it('resetOverridesForPath removes all matching path', () => {
      setOverride(mkOverride('1', '/notes/a.md'));
      setOverride(mkOverride('2', '/notes/a.md'));
      setOverride(mkOverride('3', '/notes/b.md'));
      resetOverridesForPath('/notes/a.md');
      expect(get(attachmentOverrides)).toHaveLength(1);
    });
  });

  describe('original names', () => {
    it('records and retrieves original name by md5', () => {
      recordOriginalName('hash1', 'photo.png');
      expect(getOriginalName('hash1')).toBe('photo.png');
    });

    it('does not duplicate entries for same md5', () => {
      recordOriginalName('hash1', 'photo.png');
      recordOriginalName('hash1', 'different.png');
      expect(get(originalNames)).toHaveLength(1);
      expect(getOriginalName('hash1')).toBe('photo.png');
    });

    it('returns null for unknown md5', () => {
      expect(getOriginalName('unknown')).toBeNull();
    });

    it('pruneOriginalNames removes unreferenced', () => {
      recordOriginalName('keep', 'a.png');
      recordOriginalName('remove', 'b.png');
      const pruned = pruneOriginalNames(new Set(['keep']));
      expect(pruned).toBe(1);
      expect(get(originalNames)).toHaveLength(1);
      expect(getOriginalName('keep')).toBe('a.png');
    });
  });
});
