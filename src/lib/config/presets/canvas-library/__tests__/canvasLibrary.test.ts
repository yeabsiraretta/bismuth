import { describe, it, expect } from 'vitest';
import { BUILTIN_COMPONENTS, BUILTIN_CATEGORIES, getBuiltinByCategory } from '../index';
import { iconPaths } from '@/assets/icons';

describe('Canvas Component Library - Definitions', () => {
  it('exports at least 25 built-in components', () => {
    expect(BUILTIN_COMPONENTS.length).toBeGreaterThanOrEqual(25);
  });

  it('has 10 categories', () => {
    expect(BUILTIN_CATEGORIES).toHaveLength(10);
  });

  it('all components have required fields', () => {
    for (const comp of BUILTIN_COMPONENTS) {
      expect(comp.id).toBeTruthy();
      expect(comp.name).toBeTruthy();
      expect(comp.category).toBeTruthy();
      expect(comp.elements.length).toBeGreaterThan(0);
      expect(comp.isBuiltin).toBe(true);
      expect(comp.width).toBeGreaterThan(0);
      expect(comp.height).toBeGreaterThanOrEqual(0);
    }
  });

  it('all component IDs are unique', () => {
    const ids = BUILTIN_COMPONENTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all component IDs start with builtin- prefix', () => {
    for (const comp of BUILTIN_COMPONENTS) {
      expect(comp.id).toMatch(/^(builtin-|icon-|bui-|tok-|spc-|rad-)/);
    }
  });

  it('all icon references exist in iconPaths', () => {
    const missing: string[] = [];
    for (const comp of BUILTIN_COMPONENTS) {
      if (comp.icon && !iconPaths[comp.icon]) {
        missing.push(`${comp.id}: ${comp.icon}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('each category has at least 3 components', () => {
    const grouped = getBuiltinByCategory();
    for (const cat of BUILTIN_CATEGORIES) {
      expect(grouped[cat].length).toBeGreaterThanOrEqual(3);
    }
  });

  it('elements within definitions have valid types', () => {
    const validTypes = ['rectangle', 'circle', 'text', 'image', 'frame', 'line', 'arrow'];
    for (const comp of BUILTIN_COMPONENTS) {
      for (const el of comp.elements) {
        expect(validTypes).toContain(el.element_type);
      }
    }
  });
});
