import { describe, expect, it } from 'vitest';

import {
  boxesIntersect,
  computeResize,
  computeRotation,
  getElementBounds,
  getElementsInMarquee,
  getHandleCoords,
  getSelectionBounds,
  handleCursor,
} from '@/hubs/canvas/services/canvas-math';
import { createCard, createLine, createRect } from '@/hubs/canvas/types/canvas-types';

// ── getElementBounds ─────────────────────────────────────────────

describe('getElementBounds', () => {
  it('returns x/y/width/height for regular element', () => {
    const el = createRect({ x: 10, y: 20, width: 100, height: 50 });
    const b = getElementBounds(el);
    expect(b).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });

  it('computes bounds from line endpoints', () => {
    const el = createLine({ x: 50, y: 100, x2: 200, y2: 30 });
    const b = getElementBounds(el);
    expect(b.x).toBe(50);
    expect(b.y).toBe(30);
    expect(b.width).toBe(150);
    expect(b.height).toBe(70);
  });

  it('handles reversed line endpoints', () => {
    const el = createLine({ x: 200, y: 100, x2: 50, y2: 30 });
    const b = getElementBounds(el);
    expect(b.x).toBe(50);
    expect(b.y).toBe(30);
    expect(b.width).toBe(150);
    expect(b.height).toBe(70);
  });
});

// ── getSelectionBounds ───────────────────────────────────────────

describe('getSelectionBounds', () => {
  it('returns null for empty array', () => {
    expect(getSelectionBounds([])).toBeNull();
  });

  it('returns single element bounds', () => {
    const el = createRect({ x: 10, y: 20, width: 100, height: 50 });
    expect(getSelectionBounds([el])).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });

  it('returns union of multiple elements', () => {
    const a = createRect({ x: 0, y: 0, width: 50, height: 50 });
    const b = createRect({ x: 100, y: 80, width: 30, height: 20 });
    const bounds = getSelectionBounds([a, b]);
    expect(bounds).toEqual({ x: 0, y: 0, width: 130, height: 100 });
  });
});

// ── getHandleCoords ──────────────────────────────────────────────

describe('getHandleCoords', () => {
  it('returns 8 handle positions', () => {
    const coords = getHandleCoords({ x: 0, y: 0, width: 100, height: 80 });
    expect(coords).toHaveLength(8);
  });

  it('corners at correct positions', () => {
    const coords = getHandleCoords({ x: 10, y: 20, width: 100, height: 80 });
    const nw = coords.find((h) => h.handle === 'nw')!;
    expect(nw.x).toBe(10);
    expect(nw.y).toBe(20);
    const se = coords.find((h) => h.handle === 'se')!;
    expect(se.x).toBe(110);
    expect(se.y).toBe(100);
  });

  it('midpoints at correct positions', () => {
    const coords = getHandleCoords({ x: 0, y: 0, width: 100, height: 80 });
    const n = coords.find((h) => h.handle === 'n')!;
    expect(n.x).toBe(50);
    expect(n.y).toBe(0);
    const s = coords.find((h) => h.handle === 's')!;
    expect(s.x).toBe(50);
    expect(s.y).toBe(80);
  });
});

// ── computeResize ────────────────────────────────────────────────

describe('computeResize', () => {
  const box = { x: 100, y: 100, width: 200, height: 100 };

  it('resizes SE corner', () => {
    const r = computeResize(box, 'se', 50, 30, false);
    expect(r.x).toBe(100);
    expect(r.y).toBe(100);
    expect(r.width).toBe(250);
    expect(r.height).toBe(130);
  });

  it('resizes NW corner', () => {
    const r = computeResize(box, 'nw', 20, 10, false);
    expect(r.x).toBe(120);
    expect(r.y).toBe(110);
    expect(r.width).toBe(180);
    expect(r.height).toBe(90);
  });

  it('resizes E edge (width only)', () => {
    const r = computeResize(box, 'e', 40, 999, false);
    expect(r.width).toBe(240);
    expect(r.height).toBe(100);
    expect(r.y).toBe(100);
  });

  it('resizes N edge (height only)', () => {
    const r = computeResize(box, 'n', 999, -30, false);
    expect(r.y).toBe(70);
    expect(r.height).toBe(130);
    expect(r.width).toBe(200);
  });

  it('enforces minimum size', () => {
    const r = computeResize(box, 'se', -300, -300, false);
    expect(r.width).toBe(10);
    expect(r.height).toBe(10);
  });

  it('locks aspect ratio on corner drag', () => {
    const sq = { x: 0, y: 0, width: 100, height: 100 };
    const r = computeResize(sq, 'se', 50, 20, true);
    expect(r.width).toBe(r.height);
  });
});

// ── computeRotation ──────────────────────────────────────────────

describe('computeRotation', () => {
  it('returns 0 when pointer is directly above center', () => {
    const deg = computeRotation(100, 100, 100, 0, false);
    expect(deg).toBe(0);
  });

  it('returns 90 when pointer is directly right', () => {
    const deg = computeRotation(100, 100, 200, 100, false);
    expect(deg).toBe(90);
  });

  it('returns 180 when pointer is directly below', () => {
    const deg = computeRotation(100, 100, 100, 200, false);
    expect(deg).toBe(180);
  });

  it('snaps to 15-degree increments', () => {
    const deg = computeRotation(0, 0, 10, -100, true);
    expect(deg % 15).toBe(0);
  });
});

// ── boxesIntersect ───────────────────────────────────────────────

describe('boxesIntersect', () => {
  it('detects overlapping boxes', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 50, y: 50, width: 100, height: 100 };
    expect(boxesIntersect(a, b)).toBe(true);
  });

  it('detects non-overlapping boxes', () => {
    const a = { x: 0, y: 0, width: 50, height: 50 };
    const b = { x: 100, y: 100, width: 50, height: 50 };
    expect(boxesIntersect(a, b)).toBe(false);
  });

  it('detects touching boxes as intersecting', () => {
    const a = { x: 0, y: 0, width: 50, height: 50 };
    const b = { x: 50, y: 0, width: 50, height: 50 };
    expect(boxesIntersect(a, b)).toBe(true);
  });

  it('detects contained box', () => {
    const a = { x: 0, y: 0, width: 200, height: 200 };
    const b = { x: 50, y: 50, width: 30, height: 30 };
    expect(boxesIntersect(a, b)).toBe(true);
  });
});

// ── getElementsInMarquee ─────────────────────────────────────────

describe('getElementsInMarquee', () => {
  it('returns elements within marquee', () => {
    const a = createCard({ x: 10, y: 10, width: 50, height: 50 });
    const b = createCard({ x: 500, y: 500, width: 50, height: 50 });
    const result = getElementsInMarquee([a, b], { x: 0, y: 0, width: 100, height: 100 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(a.id);
  });

  it('excludes locked elements', () => {
    const a = createCard({ x: 10, y: 10, width: 50, height: 50, locked: true });
    const result = getElementsInMarquee([a], { x: 0, y: 0, width: 200, height: 200 });
    expect(result).toHaveLength(0);
  });

  it('returns empty for no intersections', () => {
    const a = createCard({ x: 300, y: 300, width: 50, height: 50 });
    const result = getElementsInMarquee([a], { x: 0, y: 0, width: 100, height: 100 });
    expect(result).toHaveLength(0);
  });
});

// ── handleCursor ─────────────────────────────────────────────────

describe('handleCursor', () => {
  it('returns correct cursor for each handle', () => {
    expect(handleCursor('nw')).toBe('nwse-resize');
    expect(handleCursor('n')).toBe('ns-resize');
    expect(handleCursor('ne')).toBe('nesw-resize');
    expect(handleCursor('e')).toBe('ew-resize');
    expect(handleCursor('se')).toBe('nwse-resize');
    expect(handleCursor('s')).toBe('ns-resize');
    expect(handleCursor('sw')).toBe('nesw-resize');
    expect(handleCursor('w')).toBe('ew-resize');
  });
});
