import { describe, expect, it } from 'vitest';

import { buildDeepLink } from '@/ipc/api-client';

describe('api-client', () => {
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
