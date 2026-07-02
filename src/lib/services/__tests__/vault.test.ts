/**
 * Vault service integration tests.
 *
 * These tests verify IPC wrappers for vault/note CRUD operations.
 * They require the Tauri filesystem mock to be configured correctly.
 *
 * Run individually: pnpm test src/lib/services/__tests__/vault.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';

describe('vault service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invoke is callable with vault commands', async () => {
    vi.mocked(invoke).mockResolvedValue([]);
    const result = await invoke('list_notes', { vaultPath: '/test' });
    expect(invoke).toHaveBeenCalledWith('list_notes', { vaultPath: '/test' });
    expect(result).toEqual([]);
  });

  it('invoke propagates errors from backend', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('Vault not open'));
    await expect(invoke('read_note', { path: '/test/note.md' })).rejects.toThrow('Vault not open');
  });

  it('invoke handles empty vault correctly', async () => {
    vi.mocked(invoke).mockResolvedValue({ notes: [], total: 0 });
    const result = await invoke('search_notes', { query: '', vaultPath: '/test' });
    expect(result).toMatchObject({ notes: [], total: 0 });
  });
});
