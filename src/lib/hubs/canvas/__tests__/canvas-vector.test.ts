import { describe, expect, it } from 'vitest';

import {
  addPointToPath,
  closeCurrentPath,
  getPathBounds,
  normalizePath,
  parseSVGPath,
  scalePath,
  vectorPathsToSVG,
  vectorPathToSVG,
} from '@/hubs/canvas/services/canvas-vector';
import type { VectorPathSegment } from '@/hubs/canvas/types/canvas-types';

describe('canvas-vector', () => {
  const triangle: VectorPathSegment[] = [
    { type: 'M', x: 0, y: 0 },
    { type: 'L', x: 100, y: 0 },
    { type: 'L', x: 50, y: 80 },
    { type: 'Z', x: 0, y: 0 },
  ];

  describe('vectorPathToSVG', () => {
    it('serializes line segments', () => {
      const d = vectorPathToSVG(triangle);
      expect(d).toContain('M 0 0');
      expect(d).toContain('L 100 0');
      expect(d).toContain('Z');
    });

    it('handles cubic bezier', () => {
      const segs: VectorPathSegment[] = [
        { type: 'M', x: 0, y: 0 },
        { type: 'C', x: 100, y: 100, cx1: 25, cy1: 0, cx2: 75, cy2: 100 },
      ];
      const d = vectorPathToSVG(segs);
      expect(d).toContain('C 25 0, 75 100, 100 100');
    });

    it('handles quadratic bezier', () => {
      const segs: VectorPathSegment[] = [
        { type: 'M', x: 0, y: 0 },
        { type: 'Q', x: 100, y: 0, cx1: 50, cy1: 80 },
      ];
      const d = vectorPathToSVG(segs);
      expect(d).toContain('Q 50 80, 100 0');
    });
  });

  describe('vectorPathsToSVG', () => {
    it('joins multiple paths', () => {
      const d = vectorPathsToSVG([
        triangle,
        [
          { type: 'M', x: 200, y: 200 },
          { type: 'L', x: 300, y: 300 },
        ],
      ]);
      expect(d).toContain('M 0 0');
      expect(d).toContain('M 200 200');
    });
  });

  describe('parseSVGPath', () => {
    it('parses M and L', () => {
      const segs = parseSVGPath('M 10 20 L 30 40 L 50 60');
      expect(segs).toHaveLength(3);
      expect(segs[0]).toEqual({ type: 'M', x: 10, y: 20 });
      expect(segs[1]).toEqual({ type: 'L', x: 30, y: 40 });
    });

    it('parses C command', () => {
      const segs = parseSVGPath('M 0 0 C 10 20 30 40 50 60');
      expect(segs).toHaveLength(2);
      expect(segs[1].type).toBe('C');
      expect(segs[1].cx1).toBe(10);
      expect(segs[1].cy1).toBe(20);
      expect(segs[1].x).toBe(50);
      expect(segs[1].y).toBe(60);
    });

    it('parses Z', () => {
      const segs = parseSVGPath('M 0 0 L 100 0 Z');
      expect(segs[2].type).toBe('Z');
    });
  });

  describe('getPathBounds', () => {
    it('computes bounds for triangle', () => {
      const b = getPathBounds(triangle);
      expect(b.x).toBe(0);
      expect(b.y).toBe(0);
      expect(b.width).toBe(100);
      expect(b.height).toBe(80);
    });

    it('returns zero for empty path', () => {
      const b = getPathBounds([]);
      expect(b.width).toBe(0);
      expect(b.height).toBe(0);
    });

    it('includes control points', () => {
      const segs: VectorPathSegment[] = [
        { type: 'M', x: 0, y: 0 },
        { type: 'C', x: 100, y: 0, cx1: 50, cy1: -50, cx2: 50, cy2: 50 },
      ];
      const b = getPathBounds(segs);
      expect(b.y).toBe(-50);
    });
  });

  describe('normalizePath', () => {
    it('shifts path to origin', () => {
      const segs: VectorPathSegment[] = [
        { type: 'M', x: 50, y: 30 },
        { type: 'L', x: 150, y: 130 },
      ];
      const { normalized, offsetX, offsetY } = normalizePath(segs);
      expect(offsetX).toBe(50);
      expect(offsetY).toBe(30);
      expect(normalized[0].x).toBe(0);
      expect(normalized[0].y).toBe(0);
      expect(normalized[1].x).toBe(100);
    });
  });

  describe('scalePath', () => {
    it('scales coordinates', () => {
      const segs: VectorPathSegment[] = [
        { type: 'M', x: 10, y: 20 },
        { type: 'L', x: 30, y: 40 },
      ];
      const scaled = scalePath(segs, 2, 3);
      expect(scaled[0].x).toBe(20);
      expect(scaled[0].y).toBe(60);
      expect(scaled[1].x).toBe(60);
    });
  });

  describe('addPointToPath', () => {
    it('starts with M for empty path', () => {
      const r = addPointToPath([], 10, 20, false);
      expect(r).toHaveLength(1);
      expect(r[0].type).toBe('M');
    });

    it('adds L for subsequent points', () => {
      const start: VectorPathSegment[] = [{ type: 'M', x: 0, y: 0 }];
      const r = addPointToPath(start, 50, 50, false);
      expect(r).toHaveLength(2);
      expect(r[1].type).toBe('L');
    });

    it('closes path when requested', () => {
      const start: VectorPathSegment[] = [{ type: 'M', x: 0, y: 0 }];
      const r = addPointToPath(start, 50, 50, true);
      expect(r[r.length - 1].type).toBe('Z');
    });
  });

  describe('closeCurrentPath', () => {
    it('appends Z', () => {
      const segs: VectorPathSegment[] = [
        { type: 'M', x: 0, y: 0 },
        { type: 'L', x: 10, y: 10 },
      ];
      const r = closeCurrentPath(segs);
      expect(r[r.length - 1].type).toBe('Z');
    });

    it('does not double-close', () => {
      const segs: VectorPathSegment[] = [
        { type: 'M', x: 0, y: 0 },
        { type: 'Z', x: 0, y: 0 },
      ];
      const r = closeCurrentPath(segs);
      expect(r).toHaveLength(2);
    });
  });
});
