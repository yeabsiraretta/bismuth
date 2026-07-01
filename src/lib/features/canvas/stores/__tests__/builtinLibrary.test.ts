import { describe, it, expect, vi } from 'vitest';

vi.mock('@/features/canvas/services/components', () => ({
  listComponents: vi.fn().mockResolvedValue([]),
  saveComponent: vi.fn(),
  deleteComponent: vi.fn(),
}));

vi.mock('@/features/canvas/stores/elements/canvasStore', () => ({
  currentCanvas: {
    subscribe: vi.fn((cb) => {
      cb(null);
      return () => {};
    }),
    update: vi.fn(),
    set: vi.fn(),
  },
  selectedElements: {
    subscribe: vi.fn((cb) => {
      cb([]);
      return () => {};
    }),
  },
  clearSelection: vi.fn(),
  selectElement: vi.fn(),
}));

vi.mock('@/features/canvas/stores/elements/canvasElements', () => ({
  addElement: vi.fn(),
}));

import {
  isBuiltinComponent,
  getBuiltinById,
  canDeleteComponent,
  getBuiltinCount,
  resolveComponent,
} from '../library/builtinLibrary';

import { BUILTIN_COMPONENTS } from '@/config/presets/canvas-library';

describe('builtinLibrary store', () => {
  it('isBuiltinComponent returns true for built-in IDs', () => {
    expect(isBuiltinComponent('builtin-btn-primary')).toBe(true);
    expect(isBuiltinComponent('user-comp-123')).toBe(false);
  });

  it('getBuiltinById returns the correct definition', () => {
    const def = getBuiltinById('builtin-btn-primary');
    expect(def).toBeDefined();
    expect(def?.name).toBe('Primary');
  });

  it('getBuiltinById returns undefined for unknown ID', () => {
    expect(getBuiltinById('nonexistent')).toBeUndefined();
  });

  it('canDeleteComponent blocks built-in deletion', () => {
    expect(canDeleteComponent('builtin-btn-primary')).toBe(false);
    expect(canDeleteComponent('user-comp-123')).toBe(true);
  });

  it('getBuiltinCount returns total count', () => {
    expect(getBuiltinCount()).toBe(BUILTIN_COMPONENTS.length);
  });

  it('resolveComponent finds built-in definitions', () => {
    const comp = resolveComponent('builtin-card-basic');
    expect(comp).toBeDefined();
    expect(comp?.name).toBe('Card');
  });

  it('resolveComponent returns undefined for unknown IDs', () => {
    expect(resolveComponent('nonexistent-id')).toBeUndefined();
  });
});
