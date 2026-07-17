import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getRuntimeMode, resolveRuntimeMode } from '@/utils/platform';

describe('platform runtime mode', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to web when tauri is unavailable', () => {
    expect(resolveRuntimeMode({}, false)).toBe('web');
  });

  it('defaults to desktop when tauri is available', () => {
    expect(resolveRuntimeMode({}, true)).toBe('desktop');
  });

  it('forces web mode when configured', () => {
    expect(resolveRuntimeMode({ VITE_RUNTIME_MODE: 'web' }, true)).toBe('web');
  });

  it('keeps web mode when desktop is configured but tauri is unavailable', () => {
    expect(resolveRuntimeMode({ VITE_RUNTIME_MODE: 'desktop' }, false)).toBe('web');
  });

  it('detects desktop mode via __TAURI_INTERNALS__', () => {
    vi.stubGlobal('window', { __TAURI_INTERNALS__: {} });
    expect(getRuntimeMode({})).toBe('desktop');
  });

  it('detects desktop mode via __TAURI__ fallback', () => {
    vi.stubGlobal('window', { __TAURI__: {} });
    expect(getRuntimeMode({})).toBe('desktop');
  });
});
