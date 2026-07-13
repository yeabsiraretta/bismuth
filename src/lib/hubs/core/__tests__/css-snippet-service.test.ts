import { afterEach, describe, expect, it } from 'vitest';

import {
  injectSnippet,
  isSnippetActive,
  mergeSnippetList,
  removeSnippet,
} from '@/hubs/core/services/css-snippet-service';
import type { CssSnippetEntry } from '@/hubs/core/types/settings';

describe('css-snippet-service', () => {
  describe('injectSnippet', () => {
    afterEach(() => {
      document.querySelectorAll('style[data-snippet]').forEach((el) => el.remove());
    });

    it('should inject a style element into the head', () => {
      injectSnippet('test.css', 'body { color: red; }');
      const el = document.querySelector('style[data-snippet="test.css"]');
      expect(el).not.toBeNull();
      expect(el?.textContent).toBe('body { color: red; }');
    });

    it('should update existing snippet content', () => {
      injectSnippet('test.css', 'body { color: red; }');
      injectSnippet('test.css', 'body { color: blue; }');
      const els = document.querySelectorAll('style[data-snippet="test.css"]');
      expect(els.length).toBe(1);
      expect(els[0]?.textContent).toBe('body { color: blue; }');
    });

    it('should inject multiple snippets independently', () => {
      injectSnippet('a.css', '.a {}');
      injectSnippet('b.css', '.b {}');
      expect(document.querySelectorAll('style[data-snippet]').length).toBe(2);
    });
  });

  describe('removeSnippet', () => {
    afterEach(() => {
      document.querySelectorAll('style[data-snippet]').forEach((el) => el.remove());
    });

    it('should remove an injected snippet', () => {
      injectSnippet('test.css', 'body {}');
      removeSnippet('test.css');
      expect(document.querySelector('style[data-snippet="test.css"]')).toBeNull();
    });

    it('should be safe to remove a non-existent snippet', () => {
      expect(() => removeSnippet('missing.css')).not.toThrow();
    });
  });

  describe('isSnippetActive', () => {
    afterEach(() => {
      document.querySelectorAll('style[data-snippet]').forEach((el) => el.remove());
    });

    it('should return true for active snippet', () => {
      injectSnippet('active.css', '.active {}');
      expect(isSnippetActive('active.css')).toBe(true);
    });

    it('should return false for inactive snippet', () => {
      expect(isSnippetActive('inactive.css')).toBe(false);
    });

    it('should return false after removal', () => {
      injectSnippet('temp.css', '.temp {}');
      removeSnippet('temp.css');
      expect(isSnippetActive('temp.css')).toBe(false);
    });
  });

  describe('mergeSnippetList', () => {
    it('should create entries for newly discovered snippets', () => {
      const result = mergeSnippetList([], ['theme.css', 'custom.css']);
      expect(result).toEqual([
        { name: 'theme.css', enabled: false },
        { name: 'custom.css', enabled: false },
      ]);
    });

    it('should preserve enabled state from existing entries', () => {
      const existing: CssSnippetEntry[] = [
        { name: 'theme.css', enabled: true },
        { name: 'old.css', enabled: false },
      ];
      const result = mergeSnippetList(existing, ['theme.css', 'new.css']);
      expect(result).toEqual([
        { name: 'theme.css', enabled: true },
        { name: 'new.css', enabled: false },
      ]);
    });

    it('should remove entries for snippets no longer discovered', () => {
      const existing: CssSnippetEntry[] = [{ name: 'old.css', enabled: true }];
      const result = mergeSnippetList(existing, ['new.css']);
      expect(result).toEqual([{ name: 'new.css', enabled: false }]);
      expect(result.find((e) => e.name === 'old.css')).toBeUndefined();
    });

    it('should return empty for no discovered snippets', () => {
      const result = mergeSnippetList([{ name: 'a.css', enabled: true }], []);
      expect(result).toEqual([]);
    });

    it('should sort by discovered order', () => {
      const result = mergeSnippetList([], ['b.css', 'a.css', 'c.css']);
      expect(result.map((e) => e.name)).toEqual(['b.css', 'a.css', 'c.css']);
    });
  });
});
