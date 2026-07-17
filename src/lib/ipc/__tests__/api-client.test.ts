import { describe, expect, it } from 'vitest';

import { buildDeepLink, resolveApiBase } from '@/ipc/api-client';

describe('api-client', () => {
  describe('resolveApiBase', () => {
    it('uses the local desktop API when Tauri internals are present', () => {
      Object.assign(window, { __TAURI_INTERNALS__: {} });
      expect(resolveApiBase()).toBe('http://127.0.0.1:21721');
      delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    });

    it('uses relative paths in plain web runtime', () => {
      delete (window as Window & { __TAURI__?: unknown }).__TAURI__;
      delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
      expect(resolveApiBase()).toBe('');
    });
  });

  describe('buildDeepLink', () => {
    it('builds open link', () => {
      expect(buildDeepLink('open', 'folder/note.md')).toBe('bismuth://open/folder%2Fnote.md');
    });

    it('builds search link', () => {
      expect(buildDeepLink('search', 'hello world')).toBe('bismuth://search/hello%20world');
    });

    it('builds new note link', () => {
      expect(buildDeepLink('new', 'My Note')).toBe('bismuth://new/My%20Note');
    });

    it('builds vault link', () => {
      expect(buildDeepLink('vault')).toBe('bismuth://vault');
    });

    it('handles empty value for open', () => {
      expect(buildDeepLink('open')).toBe('bismuth://open/');
    });
  });
});
