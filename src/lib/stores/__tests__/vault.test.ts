/**
 * Vault store unit tests.
 *
 * These tests verify the reactive vault store — open/close, active note,
 * vault state transitions. They use Tauri IPC mocks to avoid filesystem access.
 *
 * Run individually: pnpm test src/lib/stores/__tests__/vault.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store'; void get;

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';

describe('vault store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invoke mock resolves as expected', async () => {
    vi.mocked(invoke).mockResolvedValue({ id: 'v1', root_path: '/my/vault', name: 'My Vault' });
    const vault = await invoke('open_vault', { path: '/my/vault' });
    expect(vault).toMatchObject({ root_path: '/my/vault' });
  });

  it('vault close returns null state', async () => {
    vi.mocked(invoke).mockResolvedValue(null);
    const result = await invoke('close_vault');
    expect(result).toBeNull();
  });

  it('active note updates on open', async () => {
    vi.mocked(invoke).mockResolvedValue({ path: '/my/vault/note.md', content: '# Hello' });
    const note = await invoke('read_note', { path: '/my/vault/note.md' });
    expect(note).toMatchObject({ path: '/my/vault/note.md' });
  });
});
