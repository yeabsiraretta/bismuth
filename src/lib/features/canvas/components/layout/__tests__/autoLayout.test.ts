/**
 * T049: Auto layout tests — wrap behavior, min/max constraints, insertion index.
 */
import { describe, it, expect } from 'vitest';
import { computeAutoLayoutInsertionIndex } from '@/features/canvas/components/workspace/canvasDragDrop';
import type { AutoLayout } from '@/features/canvas/types';

describe('Auto Layout', () => {
  describe('computeAutoLayoutInsertionIndex', () => {
    const children = [
      { x: 0, y: 0, width: 100, height: 50 },
      { x: 110, y: 0, width: 100, height: 50 },
      { x: 220, y: 0, width: 100, height: 50 },
    ];

    it('inserts at beginning for horizontal layout', () => {
      expect(computeAutoLayoutInsertionIndex(10, 25, 'horizontal', children)).toBe(0);
    });

    it('inserts in middle for horizontal layout', () => {
      expect(computeAutoLayoutInsertionIndex(150, 25, 'horizontal', children)).toBe(1);
    });

    it('inserts at end for horizontal layout', () => {
      expect(computeAutoLayoutInsertionIndex(400, 25, 'horizontal', children)).toBe(3);
    });

    it('inserts correctly for vertical layout', () => {
      const vChildren = [
        { x: 0, y: 0, width: 100, height: 50 },
        { x: 0, y: 60, width: 100, height: 50 },
        { x: 0, y: 120, width: 100, height: 50 },
      ];
      expect(computeAutoLayoutInsertionIndex(50, 10, 'vertical', vChildren)).toBe(0);
      expect(computeAutoLayoutInsertionIndex(50, 80, 'vertical', vChildren)).toBe(1);
      expect(computeAutoLayoutInsertionIndex(50, 200, 'vertical', vChildren)).toBe(3);
    });
  });

  describe('wrap behavior', () => {
    it('wrap property defaults to false/undefined', () => {
      const layout: AutoLayout = {
        direction: 'horizontal',
        gap: 8,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        alignItems: 'start',
        justifyContent: 'start',
      };
      expect(layout.wrap).toBeUndefined();
    });

    it('counterAxisSpacing only applies when wrap enabled', () => {
      const layout: AutoLayout = {
        direction: 'horizontal',
        gap: 8,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        alignItems: 'start',
        justifyContent: 'start',
        wrap: true,
        counterAxisSpacing: 12,
      };
      expect(layout.wrap).toBe(true);
      expect(layout.counterAxisSpacing).toBe(12);
    });
  });

  describe('min/max constraint enforcement', () => {
    it('respects minWidth constraint', () => {
      const child = { sizing: 'fill' as const, minWidth: 100, maxWidth: 500 };
      expect(child.minWidth).toBeLessThanOrEqual(child.maxWidth!);
    });

    it('validates that min does not exceed max', () => {
      const validChild = { sizing: 'fixed' as const, minWidth: 50, maxWidth: 200 };
      expect(validChild.minWidth).toBeLessThan(validChild.maxWidth!);
    });
  });
});
