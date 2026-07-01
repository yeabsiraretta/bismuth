import { describe, it, expect } from 'vitest';
import {
  createDesignSystemPages,
  getDesignPageId,
  isDesignSystemPage,
  DESIGN_SYSTEM_PAGES,
} from './pageTemplates';

describe('pageTemplates', () => {
  describe('createDesignSystemPages', () => {
    it('produces exactly 6 pages', () => {
      const pages = createDesignSystemPages();
      expect(pages).toHaveLength(6);
    });

    it('produces pages with correct names in order', () => {
      const pages = createDesignSystemPages();
      const names = pages.map((p) => p.name);
      expect(names).toEqual(['Tokens', 'Components', 'Layouts', 'Flows', 'Pages', 'Sandbox']);
    });

    it('assigns sequential order values starting at 0', () => {
      const pages = createDesignSystemPages();
      pages.forEach((page, idx) => {
        expect(page.order).toBe(idx);
      });
    });

    it('generates lowercase page IDs with page_ prefix', () => {
      const pages = createDesignSystemPages();
      expect(pages[0].id).toBe('page_tokens');
      expect(pages[1].id).toBe('page_components');
      expect(pages[2].id).toBe('page_layouts');
      expect(pages[3].id).toBe('page_flows');
      expect(pages[4].id).toBe('page_pages');
      expect(pages[5].id).toBe('page_sandbox');
    });

    it('initializes each page with empty elements array', () => {
      const pages = createDesignSystemPages();
      pages.forEach((page) => {
        expect(page.elements).toEqual([]);
      });
    });
  });

  describe('getDesignPageId', () => {
    it('returns correct ID for each page name', () => {
      expect(getDesignPageId('Tokens')).toBe('page_tokens');
      expect(getDesignPageId('Components')).toBe('page_components');
      expect(getDesignPageId('Sandbox')).toBe('page_sandbox');
    });
  });

  describe('isDesignSystemPage', () => {
    it('returns true for valid design system page names', () => {
      DESIGN_SYSTEM_PAGES.forEach((name) => {
        expect(isDesignSystemPage(name)).toBe(true);
      });
    });

    it('returns false for non-design-system page names', () => {
      expect(isDesignSystemPage('Random')).toBe(false);
      expect(isDesignSystemPage('')).toBe(false);
      expect(isDesignSystemPage('tokens')).toBe(false); // lowercase
    });
  });
});
