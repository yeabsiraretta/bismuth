import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));
vi.mock('@/utils/logger', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
// Mock settings store with default channel — path must match source import
vi.mock('@/features/settings', () => ({
  settings: {
    subscribe: vi.fn((cb) => {
      cb({ updateChannel: 'release' });
      return () => {};
    }),
  },
}));
vi.mock('svelte/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('svelte/store')>();
  return {
    ...actual,
    get: vi.fn((store) => {
      let val: unknown;
      store.subscribe((v: unknown) => { val = v; })();
      return val;
    }),
  };
});

import { invoke } from '@tauri-apps/api/core';
import { checkAppVersion, buildUpdateEndpoint } from '../updates';

const mockInvoke = vi.mocked(invoke);

describe('buildUpdateEndpoint (T17)', () => {
  it('returns alpha endpoint for alpha channel', () => {
    const url = buildUpdateEndpoint('alpha');
    expect(url).toContain('alpha-latest');
  });

  it('returns beta endpoint for beta channel', () => {
    const url = buildUpdateEndpoint('beta');
    expect(url).toContain('beta-latest');
  });

  it('returns release endpoint for release channel', () => {
    const url = buildUpdateEndpoint('release');
    expect(url).toContain('release-latest');
  });

  it('falls back to release endpoint for unknown channel', () => {
    const url = buildUpdateEndpoint('nightly');
    expect(url).toContain('release-latest');
  });
});

describe('updates service', () => {
  beforeEach(() => { mockInvoke.mockReset(); });

  it('returns current version, checked_at and channel from IPC', async () => {
    mockInvoke.mockResolvedValue({ current_version: '0.3.0', checked_at: 1700000000 });
    const result = await checkAppVersion();
    expect(result.currentVersion).toBe('0.3.0');
    expect(result.checkedAt).toBe(1700000000);
    expect(result.channel).toBeDefined();
  });

  it('calls check_app_version command with no extra args', async () => {
    mockInvoke.mockResolvedValue({ current_version: '1.0.0', checked_at: 0 });
    await checkAppVersion();
    expect(mockInvoke).toHaveBeenCalledWith('check_app_version');
  });

  it('throws on IPC error', async () => {
    mockInvoke.mockRejectedValue(new Error('IPC failed'));
    await expect(checkAppVersion()).rejects.toThrow();
  });
});
