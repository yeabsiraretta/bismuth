import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';

// Mock the status store before importing
vi.mock('@/stores/status/status', () => ({
  registerStatusItem: vi.fn(),
  removeStatusItem: vi.fn(),
  updateStatusItem: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('featureLoadStatus', () => {
  let mod: typeof import('../featureLoadStatus');
  let statusMod: typeof import('../status');

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    mod = await import('../featureLoadStatus');
    statusMod = await import('../status');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts features as idle', () => {
    expect(mod.getFeatureLoadState('graph')).toBe('idle');
  });

  it('markLoading sets state to loading and registers status item', () => {
    mod.markLoading('graph');
    expect(mod.getFeatureLoadState('graph')).toBe('loading');
    expect(statusMod.registerStatusItem).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'feature-load-graph',
        position: 'right',
        icon: 'loader',
      })
    );
  });

  it('markLoaded sets state to loaded and removes status item', () => {
    mod.markLoading('graph');
    mod.markLoaded('graph');
    expect(mod.getFeatureLoadState('graph')).toBe('loaded');
    expect(statusMod.removeStatusItem).toHaveBeenCalledWith('feature-load-graph');
  });

  it('markError sets state to error', () => {
    mod.markLoading('canvas');
    mod.markError('canvas', 'Module not found');
    expect(mod.getFeatureLoadState('canvas')).toBe('error');
  });

  it('markUnloaded sets state to unloaded', () => {
    mod.markLoading('graph');
    mod.markLoaded('graph');
    mod.markUnloaded('graph');
    expect(mod.getFeatureLoadState('graph')).toBe('unloaded');
  });

  it('markIdle removes feature from store', () => {
    mod.markLoading('graph');
    mod.markIdle('graph');
    expect(mod.getFeatureLoadState('graph')).toBe('idle');
  });

  it('loadingFeatures derived store tracks loading features', () => {
    mod.markLoading('graph');
    mod.markLoading('canvas');
    expect(get(mod.loadingFeatures)).toEqual(['graph', 'canvas']);
    mod.markLoaded('graph');
    expect(get(mod.loadingFeatures)).toEqual(['canvas']);
  });

  it('loadedFeatures derived store tracks loaded features', () => {
    mod.markLoading('graph');
    mod.markLoaded('graph');
    expect(get(mod.loadedFeatures)).toEqual(['graph']);
  });

  it('loadingCount reflects number of loading features', () => {
    expect(get(mod.loadingCount)).toBe(0);
    mod.markLoading('graph');
    mod.markLoading('canvas');
    expect(get(mod.loadingCount)).toBe(2);
    mod.markLoaded('graph');
    expect(get(mod.loadingCount)).toBe(1);
  });

  it('featureLoadStates exposes reactive map', () => {
    mod.markLoading('graph');
    const states = get(mod.featureLoadStates);
    expect(states['graph']).toBeDefined();
    expect(states['graph'].state).toBe('loading');
  });
});
