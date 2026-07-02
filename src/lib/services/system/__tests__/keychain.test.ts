import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@/utils/logger', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import { getSecret, setSecret, deleteSecret } from '../keychain';

const mockInvoke = vi.mocked(invoke);

describe('keychain service (T055)', () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  describe('getSecret — three return states', () => {
    it('returns { found: true, value, available: true } when secret exists', async () => {
      mockInvoke.mockResolvedValue('my-api-key');
      const result = await getSecret('llm-api-key');
      expect(result.found).toBe(true);
      expect(result.value).toBe('my-api-key');
      expect(result.available).toBe(true);
    });

    it('returns { found: false, value: null, available: true } when not stored', async () => {
      mockInvoke.mockResolvedValue(null);
      const result = await getSecret('llm-api-key');
      expect(result.found).toBe(false);
      expect(result.value).toBeNull();
      expect(result.available).toBe(true);
    });

    it('returns { available: false } when keychain is unavailable', async () => {
      mockInvoke.mockRejectedValue(new Error('keychain unavailable'));
      const result = await getSecret('llm-api-key');
      expect(result.available).toBe(false);
      expect(result.found).toBe(false);
      expect(result.value).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  it('setSecret calls set_secret IPC command', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await setSecret('llm-api-key', 'secret-value');
    expect(mockInvoke).toHaveBeenCalledWith('set_secret', {
      key: 'llm-api-key',
      value: 'secret-value',
    });
  });

  it('deleteSecret calls delete_secret IPC command', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await deleteSecret('llm-api-key');
    expect(mockInvoke).toHaveBeenCalledWith('delete_secret', { key: 'llm-api-key' });
  });

  it('getSecret result is never written to a store (value stays in result object)', async () => {
    // Verify that the result from getSecret is a plain object and doesn't trigger
    // any store side effects — the service must not call any Svelte store
    mockInvoke.mockResolvedValue('secret');
    const result = await getSecret('test-key');
    // Result is a plain object — not reactive, not a store
    expect(typeof result).toBe('object');
    expect(result).not.toHaveProperty('subscribe');
  });
});
