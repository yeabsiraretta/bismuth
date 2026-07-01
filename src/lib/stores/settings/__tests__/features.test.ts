import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

// Mock localStorage before importing the store
const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
  clear: vi.fn(() => { Object.keys(mockStorage).forEach((k) => delete mockStorage[k]); }),
});

describe('feature flags store', () => {
  beforeEach(async () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    vi.resetModules();
  });

  async function importStore() {
    const mod = await import('../features');
    return mod;
  }

  it('should load default flags when no saved state', async () => {
    const { featureFlags, DEFAULT_FEATURE_FLAGS } = await importStore();
    const flags = get(featureFlags);
    expect(flags).toEqual(DEFAULT_FEATURE_FLAGS);
  });

  it('should load saved flags from localStorage', async () => {
    mockStorage['bismuth-feature-flags'] = JSON.stringify({ graph: true, canvas: true });
    const { featureFlags, DEFAULT_FEATURE_FLAGS } = await importStore();
    const flags = get(featureFlags);
    expect(flags['graph']).toBe(true);
    expect(flags['canvas']).toBe(true);
    expect(flags['files']).toBe(DEFAULT_FEATURE_FLAGS['files']);
  });

  it('should handle corrupted JSON in localStorage', async () => {
    mockStorage['bismuth-feature-flags'] = '{invalid json';
    const { featureFlags, DEFAULT_FEATURE_FLAGS } = await importStore();
    const flags = get(featureFlags);
    expect(flags).toEqual(DEFAULT_FEATURE_FLAGS);
  });

  it('should enforce core features as always-on even if saved as false', async () => {
    mockStorage['bismuth-feature-flags'] = JSON.stringify({ files: false, search: false });
    const { featureFlags } = await importStore();
    const flags = get(featureFlags);
    expect(flags['files']).toBe(true);
    expect(flags['search']).toBe(true);
  });

  it('toggle should flip an optional flag and persist', async () => {
    const { featureFlags } = await importStore();
    expect(get(featureFlags)['graph']).toBe(false);
    featureFlags.toggle('graph');
    expect(get(featureFlags)['graph']).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('toggle should be a no-op for core features', async () => {
    const { featureFlags } = await importStore();
    featureFlags.toggle('files');
    expect(get(featureFlags)['files']).toBe(true);
  });

  it('toggle should flip back on second call', async () => {
    const { featureFlags } = await importStore();
    featureFlags.toggle('graph');
    featureFlags.toggle('graph');
    expect(get(featureFlags)['graph']).toBe(false);
  });

  it('setFlag should set a specific value', async () => {
    const { featureFlags } = await importStore();
    featureFlags.setFlag('canvas', true);
    expect(get(featureFlags)['canvas']).toBe(true);
    featureFlags.setFlag('canvas', false);
    expect(get(featureFlags)['canvas']).toBe(false);
  });

  it('isEnabled should return true for core features', async () => {
    const { featureFlags } = await importStore();
    expect(featureFlags.isEnabled('files')).toBe(true);
    expect(featureFlags.isEnabled('search')).toBe(true);
    expect(featureFlags.isEnabled('outline')).toBe(true);
  });

  it('isEnabled should return false for disabled optional features', async () => {
    const { featureFlags } = await importStore();
    expect(featureFlags.isEnabled('graph')).toBe(false);
    expect(featureFlags.isEnabled('canvas')).toBe(false);
  });

  it('reset should restore defaults and clear storage', async () => {
    const { featureFlags, DEFAULT_FEATURE_FLAGS } = await importStore();
    featureFlags.setFlag('graph', true);
    featureFlags.setFlag('canvas', true);
    featureFlags.reset();
    expect(get(featureFlags)).toEqual(DEFAULT_FEATURE_FLAGS);
    expect(localStorage.removeItem).toHaveBeenCalledWith('bismuth-feature-flags');
  });
});

describe('isTabEnabled derived store', () => {
  beforeEach(async () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    vi.resetModules();
  });

  async function importStore() {
    return await import('../features');
  }

  it('returns true for unknown tab IDs', async () => {
    const { isTabEnabled } = await importStore();
    const check = get(isTabEnabled);
    expect(check('nonexistent-tab')).toBe(true);
  });

  it('returns true for core tab IDs regardless of state', async () => {
    const { isTabEnabled } = await importStore();
    const check = get(isTabEnabled);
    expect(check('files')).toBe(true);
    expect(check('search')).toBe(true);
    expect(check('outline')).toBe(true);
  });

  it('returns flag state for optional tab IDs (tab ID = flag key)', async () => {
    const { isTabEnabled, featureFlags } = await importStore();
    featureFlags.setFlag('graph', true);
    const check = get(isTabEnabled);
    expect(check('graph')).toBe(true);
    expect(check('calendar')).toBe(false);
  });
});
