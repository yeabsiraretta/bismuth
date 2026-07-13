import { describe, expect, it } from 'vitest';

import {
  applyConstraints,
  type AutoLayoutConfig,
  computeAutoLayout,
  computeHugSize,
  DEFAULT_AUTO_LAYOUT,
  DEFAULT_PADDING,
} from '@/hubs/canvas/services/canvas-auto-layout';
import { createRect } from '@/hubs/canvas/types/canvas-types';

function rect(id: string, x: number, y: number, w: number, h: number) {
  return createRect({ x, y, width: w, height: h, name: id });
}

describe('canvas-auto-layout', () => {
  describe('computeAutoLayout — vertical', () => {
    it('lays out children vertically with gap', () => {
      const config: AutoLayoutConfig = {
        ...DEFAULT_AUTO_LAYOUT,
        direction: 'vertical',
        gap: 10,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
      };
      const children = [rect('a', 0, 0, 100, 30), rect('b', 0, 0, 100, 40)];
      const results = computeAutoLayout(config, 300, 200, children);
      expect(results).toHaveLength(2);
      expect(results[0].y).toBe(0);
      expect(results[1].y).toBe(40);
    });

    it('applies padding', () => {
      const config: AutoLayoutConfig = {
        ...DEFAULT_AUTO_LAYOUT,
        direction: 'vertical',
        gap: 0,
        padding: { top: 10, right: 20, bottom: 10, left: 20 },
      };
      const children = [rect('a', 0, 0, 100, 50)];
      const results = computeAutoLayout(config, 300, 200, children);
      expect(results[0].x).toBe(20);
      expect(results[0].y).toBe(10);
    });

    it('handles empty children', () => {
      const results = computeAutoLayout(DEFAULT_AUTO_LAYOUT, 300, 200, []);
      expect(results).toHaveLength(0);
    });
  });

  describe('computeAutoLayout — horizontal', () => {
    it('lays out children horizontally', () => {
      const config: AutoLayoutConfig = {
        ...DEFAULT_AUTO_LAYOUT,
        direction: 'horizontal',
        gap: 10,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
      };
      const children = [rect('a', 0, 0, 50, 100), rect('b', 0, 0, 60, 100)];
      const results = computeAutoLayout(config, 300, 200, children);
      expect(results[0].x).toBe(0);
      expect(results[1].x).toBe(60);
    });

    it('centers on counter axis', () => {
      const config: AutoLayoutConfig = {
        ...DEFAULT_AUTO_LAYOUT,
        direction: 'horizontal',
        gap: 0,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        counterAlign: 'center',
      };
      const children = [rect('a', 0, 0, 50, 40), rect('b', 0, 0, 50, 20)];
      const results = computeAutoLayout(config, 300, 100, children);
      expect(results[0].y).toBe(30);
      expect(results[1].y).toBe(40);
    });
  });

  describe('computeAutoLayout — fill sizing', () => {
    it('distributes fill space equally', () => {
      const config: AutoLayoutConfig = {
        ...DEFAULT_AUTO_LAYOUT,
        direction: 'horizontal',
        gap: 0,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
      };
      const children = [rect('a', 0, 0, 50, 50), rect('b', 0, 0, 50, 50)];
      const overrides = [
        { elementId: children[0].id, widthMode: 'fill' as const, heightMode: 'fixed' as const },
        { elementId: children[1].id, widthMode: 'fill' as const, heightMode: 'fixed' as const },
      ];
      const results = computeAutoLayout(config, 200, 100, children, overrides);
      expect(results[0].width).toBe(100);
      expect(results[1].width).toBe(100);
    });
  });

  describe('computeAutoLayout — space-between', () => {
    it('distributes elements with space-between', () => {
      const config: AutoLayoutConfig = {
        ...DEFAULT_AUTO_LAYOUT,
        direction: 'horizontal',
        gap: 0,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        primaryAlign: 'space-between',
      };
      const children = [rect('a', 0, 0, 40, 40), rect('b', 0, 0, 40, 40), rect('c', 0, 0, 40, 40)];
      const results = computeAutoLayout(config, 200, 100, children);
      expect(results[0].x).toBe(0);
      expect(results[2].x).toBe(160);
    });
  });

  describe('computeAutoLayout — wrap', () => {
    it('wraps children to next row', () => {
      const config: AutoLayoutConfig = {
        ...DEFAULT_AUTO_LAYOUT,
        direction: 'wrap',
        gap: 10,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
      };
      const children = [rect('a', 0, 0, 60, 30), rect('b', 0, 0, 60, 30), rect('c', 0, 0, 60, 30)];
      const results = computeAutoLayout(config, 140, 200, children);
      expect(results[0].y).toBe(0);
      expect(results[1].y).toBe(0);
      expect(results[2].y).toBe(40);
    });
  });

  describe('applyConstraints', () => {
    it('left constraint stays fixed', () => {
      const r = applyConstraints(
        { horizontal: 'left', vertical: 'top' },
        { x: 10, y: 20, width: 50, height: 30 },
        400,
        300,
        300,
        200
      );
      expect(r.x).toBe(10);
      expect(r.y).toBe(20);
    });

    it('right constraint shifts with parent', () => {
      const r = applyConstraints(
        { horizontal: 'right', vertical: 'bottom' },
        { x: 10, y: 20, width: 50, height: 30 },
        400,
        300,
        300,
        200
      );
      expect(r.x).toBe(110);
      expect(r.y).toBe(120);
    });

    it('stretch constraint grows element', () => {
      const r = applyConstraints(
        { horizontal: 'stretch', vertical: 'stretch' },
        { x: 10, y: 20, width: 50, height: 30 },
        400,
        300,
        300,
        200
      );
      expect(r.width).toBe(150);
      expect(r.height).toBe(130);
    });

    it('center constraint shifts half', () => {
      const r = applyConstraints(
        { horizontal: 'center', vertical: 'center' },
        { x: 10, y: 20, width: 50, height: 30 },
        400,
        300,
        300,
        200
      );
      expect(r.x).toBe(60);
      expect(r.y).toBe(70);
    });

    it('scale constraint scales proportionally', () => {
      const r = applyConstraints(
        { horizontal: 'scale', vertical: 'scale' },
        { x: 30, y: 20, width: 60, height: 40 },
        600,
        400,
        300,
        200
      );
      expect(r.x).toBe(60);
      expect(r.width).toBe(120);
    });
  });

  describe('computeHugSize', () => {
    it('returns padding only for empty children', () => {
      const size = computeHugSize(DEFAULT_AUTO_LAYOUT, []);
      expect(size.width).toBe(DEFAULT_PADDING.left + DEFAULT_PADDING.right);
      expect(size.height).toBe(DEFAULT_PADDING.top + DEFAULT_PADDING.bottom);
    });

    it('computes vertical hug', () => {
      const config: AutoLayoutConfig = {
        ...DEFAULT_AUTO_LAYOUT,
        direction: 'vertical',
        gap: 10,
        padding: { top: 8, right: 8, bottom: 8, left: 8 },
      };
      const children = [rect('a', 0, 0, 100, 30), rect('b', 0, 0, 80, 40)];
      const size = computeHugSize(config, children);
      expect(size.width).toBe(8 + 100 + 8);
      expect(size.height).toBe(8 + 30 + 10 + 40 + 8);
    });

    it('computes horizontal hug', () => {
      const config: AutoLayoutConfig = {
        ...DEFAULT_AUTO_LAYOUT,
        direction: 'horizontal',
        gap: 5,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
      };
      const children = [rect('a', 0, 0, 50, 60), rect('b', 0, 0, 30, 40)];
      const size = computeHugSize(config, children);
      expect(size.width).toBe(50 + 5 + 30);
      expect(size.height).toBe(60);
    });
  });
});
