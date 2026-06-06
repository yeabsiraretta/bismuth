import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core');
vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  openVault,
  createVault,
  getNote,
  writeNote,
  deleteNote,
  renameNote,
  listNotes,
  scanVault,
} from '../vault/vault';

describe('vault service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('openVault', () => {
    it('should invoke open_vault command', async () => {
      const mockVault = { name: 'test', root_path: '/test' };
      vi.mocked(invoke).mockResolvedValue(mockVault);

      const result = await openVault('/test');

      expect(invoke).toHaveBeenCalledWith('open_vault', { path: '/test' });
      expect(result).toEqual(mockVault);
    });

    it('should throw on backend error', async () => {
      vi.mocked(invoke).mockRejectedValue('Vault not found');

      await expect(openVault('/bad')).rejects.toThrow('Failed to open vault');
    });
  });

  describe('createVault', () => {
    it('should invoke create_vault for blank template', async () => {
      const mockVault = { name: 'new', root_path: '/new' };
      vi.mocked(invoke).mockResolvedValue(mockVault);

      const result = await createVault('/new');

      expect(invoke).toHaveBeenCalledWith('create_vault', { path: '/new' });
      expect(result).toEqual(mockVault);
    });

    it('should invoke create_vault_from_template for non-blank', async () => {
      const mockVault = { name: 'para', root_path: '/para' };
      vi.mocked(invoke).mockResolvedValue(mockVault);

      // VaultTemplate.PARA = 1
      const result = await createVault('/para', 1 as any);

      expect(invoke).toHaveBeenCalledWith('create_vault_from_template', {
        path: '/para',
        template: 1,
      });
      expect(result).toEqual(mockVault);
    });
  });

  describe('getNote', () => {
    it('should invoke read_note command', async () => {
      const mockNote = { path: '/test/note.md', title: 'Note', content: '# Hi' };
      vi.mocked(invoke).mockResolvedValue(mockNote);

      const result = await getNote('/test/note.md');

      expect(invoke).toHaveBeenCalledWith('read_note', { path: '/test/note.md' });
      expect(result).toEqual(mockNote);
    });

    it('should throw on error', async () => {
      vi.mocked(invoke).mockRejectedValue('File not found');
      await expect(getNote('/missing.md')).rejects.toThrow('Failed to get note');
    });
  });

  describe('writeNote', () => {
    it('should invoke write_note command', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await writeNote('/test/note.md', '# Content');

      expect(invoke).toHaveBeenCalledWith('write_note', {
        path: '/test/note.md',
        content: '# Content',
      });
    });

    it('should throw on error', async () => {
      vi.mocked(invoke).mockRejectedValue('Permission denied');
      await expect(writeNote('/readonly.md', '')).rejects.toThrow('Failed to write note');
    });
  });

  describe('deleteNote', () => {
    it('should invoke delete_note command', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);
      await deleteNote('/test/note.md');
      expect(invoke).toHaveBeenCalledWith('delete_note', { path: '/test/note.md' });
    });
  });

  describe('renameNote', () => {
    it('should invoke rename_note command', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);
      await renameNote('/old.md', '/new.md');
      expect(invoke).toHaveBeenCalledWith('rename_note', {
        old_path: '/old.md',
        new_path: '/new.md',
      });
    });
  });

  describe('listNotes', () => {
    it('should invoke list_notes command', async () => {
      const mockNotes = [{ path: '/test/a.md' }, { path: '/test/b.md' }];
      vi.mocked(invoke).mockResolvedValue(mockNotes);

      const result = await listNotes('/test', 'subfolder');

      expect(invoke).toHaveBeenCalledWith('list_notes', {
        vault_path: '/test',
        folder_path: 'subfolder',
      });
      expect(result).toHaveLength(2);
    });

    it('should default folderPath to empty string', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      await listNotes('/test');
      expect(invoke).toHaveBeenCalledWith('list_notes', {
        vault_path: '/test',
        folder_path: '',
      });
    });
  });

  describe('scanVault', () => {
    it('should invoke scan_vault command', async () => {
      const mockNotes = [{ path: '/test/note.md' }];
      vi.mocked(invoke).mockResolvedValue(mockNotes);

      const result = await scanVault();

      expect(invoke).toHaveBeenCalledWith('scan_vault');
      expect(result).toHaveLength(1);
    });
  });
});
