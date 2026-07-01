import { describe, it, expect, beforeEach } from 'vitest';
import {
  addAxis,
  removeAxis,
  createVariant,
  deleteVariant,
  updateVariantOverrides,
  resolveVariant,
  getAllCombinations,
  clearVariantCache,
} from '../design/variantStore';
import type { ComponentDefinition } from '@/features/canvas/types/components';
import type { VariantAxis } from '@/features/canvas/types/design/variants';

function makeAxis(id: string, name: string, values: string[]): VariantAxis {
  return { id, name, values, defaultValue: values[0] };
}

function baseDef(): ComponentDefinition {
  return {
    id: 'comp-1',
    name: 'TestComponent',
    elements: [],
    exposedProps: [],
    width: 100,
    height: 100,
    variantAxes: [],
    variants: [],
    created_at: Date.now(),
    modified_at: Date.now(),
  };
}

describe('variantStore', () => {
  beforeEach(() => {
    clearVariantCache();
  });

  describe('addAxis', () => {
    it('should add an axis with values', () => {
      const result = addAxis(baseDef(), makeAxis('size', 'Size', ['sm', 'md', 'lg']));
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.variantAxes).toHaveLength(1);
        expect(result.variantAxes![0].name).toBe('Size');
      }
    });

    it('should enforce max 4 axes (SC-07)', () => {
      const def = baseDef();
      def.variantAxes = [
        makeAxis('a', 'A', ['1']),
        makeAxis('b', 'B', ['1']),
        makeAxis('c', 'C', ['1']),
        makeAxis('d', 'D', ['1']),
      ];
      const result = addAxis(def, makeAxis('e', 'E', ['1']));
      expect('error' in result).toBe(true);
    });

    it('should enforce max 64 char name (SC-07)', () => {
      const longName = 'x'.repeat(65);
      const result = addAxis(baseDef(), makeAxis('z', longName, ['a']));
      expect('error' in result).toBe(true);
    });

    it('should enforce max 20 values per axis (SC-07)', () => {
      const manyValues = Array.from({ length: 25 }, (_, i) => `v${i}`);
      const result = addAxis(baseDef(), makeAxis('x', 'X', manyValues));
      expect('error' in result).toBe(true);
    });
  });

  describe('removeAxis', () => {
    it('should remove an axis by id', () => {
      const def = baseDef();
      def.variantAxes = [makeAxis('size', 'Size', ['sm', 'md'])];
      const result = removeAxis(def, 'size');
      expect(result.variantAxes).toHaveLength(0);
    });
  });

  describe('createVariant / deleteVariant', () => {
    it('should create a variant with selections', () => {
      const def = baseDef();
      def.variantAxes = [makeAxis('size', 'Size', ['sm', 'md'])];
      const result = createVariant(def, { size: 'sm' });
      expect(result.variants).toHaveLength(1);
      expect(result.variants![0].selections).toEqual({ size: 'sm' });
    });

    it('should delete a variant', () => {
      let def = baseDef();
      def.variantAxes = [makeAxis('size', 'Size', ['sm'])];
      def = createVariant(def, { size: 'sm' });
      const variantId = def.variants![0].id;
      const result = deleteVariant(def, variantId);
      expect(result.variants).toHaveLength(0);
    });
  });

  describe('resolveVariant', () => {
    it('should resolve matching variant overrides', () => {
      let def = baseDef();
      def.variantAxes = [makeAxis('size', 'Size', ['sm', 'md'])];
      def = createVariant(def, { size: 'md' });
      const variantId = def.variants![0].id;
      def = updateVariantOverrides(def, variantId, [
        { elementId: 'el-1', properties: { width: 200 } },
      ]);
      const overrides = resolveVariant(def, { size: 'md' });
      expect(overrides).toHaveLength(1);
      expect(overrides[0].elementId).toBe('el-1');
    });

    it('should return empty for non-matching selections', () => {
      let def = baseDef();
      def.variantAxes = [makeAxis('size', 'Size', ['sm', 'md'])];
      def = createVariant(def, { size: 'sm' });
      const overrides = resolveVariant(def, { size: 'lg' });
      expect(overrides).toHaveLength(0);
    });
  });

  describe('getAllCombinations', () => {
    it('should generate all variant combinations', () => {
      const def = baseDef();
      def.variantAxes = [
        makeAxis('size', 'Size', ['sm', 'md']),
        makeAxis('state', 'State', ['default', 'hover']),
      ];
      const combos = getAllCombinations(def);
      expect(combos).toHaveLength(4);
    });
  });

  describe('memoization', () => {
    it('should return same result for same input', () => {
      let def = baseDef();
      def.variantAxes = [makeAxis('size', 'Size', ['sm'])];
      def = createVariant(def, { size: 'sm' });
      const r1 = resolveVariant(def, { size: 'sm' });
      const r2 = resolveVariant(def, { size: 'sm' });
      expect(r1).toEqual(r2);
    });

    it('should still resolve after clearVariantCache', () => {
      let def = baseDef();
      def.variantAxes = [makeAxis('size', 'Size', ['sm'])];
      def = createVariant(def, { size: 'sm' });
      resolveVariant(def, { size: 'sm' });
      clearVariantCache();
      const r = resolveVariant(def, { size: 'sm' });
      expect(r).toBeDefined();
    });
  });
});
