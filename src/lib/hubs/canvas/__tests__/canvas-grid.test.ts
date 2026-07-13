import { describe, expect, it } from 'vitest';

import {
  computeAlignment,
  computeDistribution,
  getSmartGuides,
  snapPoint,
  snapToGrid,
} from '@/hubs/canvas/services/canvas-grid';
import { createRect } from '@/hubs/canvas/types/canvas-types';

// ── snapToGrid ───────────────────────────────────────────────────

describe('snapToGrid', () => {
  it('snaps to nearest grid line', () => {
    expect(snapToGrid(13, 10)).toBe(10);
    expect(snapToGrid(17, 10)).toBe(20);
    expect(snapToGrid(15, 10)).toBe(20);
  });

  it('handles zero correctly', () => {
    expect(snapToGrid(0, 20)).toBe(0);
  });

  it('handles negative values', () => {
    expect(snapToGrid(-13, 10)).toBe(-10);
    expect(snapToGrid(-17, 10)).toBe(-20);
  });
});

// ── snapPoint ────────────────────────────────────────────────────

describe('snapPoint', () => {
  it('snaps both coordinates', () => {
    const p = snapPoint(13, 27, 10);
    expect(p.x).toBe(10);
    expect(p.y).toBe(30);
  });
});

// ── getSmartGuides ───────────────────────────────────────────────

describe('getSmartGuides', () => {
  it('detects vertical alignment guide', () => {
    const a = createRect({ x: 100, y: 0, width: 50, height: 50 });
    const dragBounds = { x: 98, y: 100, width: 50, height: 50 };
    const guides = getSmartGuides(dragBounds, [a], 5);
    const xGuides = guides.filter((g) => g.axis === 'x');
    expect(xGuides.length).toBeGreaterThan(0);
    expect(xGuides.some((g) => g.position === 100)).toBe(true);
  });

  it('detects horizontal alignment guide', () => {
    const a = createRect({ x: 0, y: 200, width: 50, height: 50 });
    const dragBounds = { x: 100, y: 198, width: 50, height: 50 };
    const guides = getSmartGuides(dragBounds, [a], 5);
    const yGuides = guides.filter((g) => g.axis === 'y');
    expect(yGuides.length).toBeGreaterThan(0);
    expect(yGuides.some((g) => g.position === 200)).toBe(true);
  });

  it('returns empty when nothing is aligned', () => {
    const a = createRect({ x: 500, y: 500, width: 50, height: 50 });
    const dragBounds = { x: 0, y: 0, width: 50, height: 50 };
    const guides = getSmartGuides(dragBounds, [a], 5);
    expect(guides).toHaveLength(0);
  });

  it('deduplicates guides at same position', () => {
    const a = createRect({ x: 100, y: 0, width: 50, height: 50 });
    const b = createRect({ x: 100, y: 200, width: 50, height: 50 });
    const dragBounds = { x: 100, y: 100, width: 50, height: 50 };
    const guides = getSmartGuides(dragBounds, [a, b], 5);
    const xGuides = guides.filter((g) => g.axis === 'x');
    const positions = xGuides.map((g) => g.position);
    expect(new Set(positions).size).toBe(positions.length);
  });
});

// ── computeAlignment ─────────────────────────────────────────────

describe('computeAlignment', () => {
  it('returns empty for less than 2 elements', () => {
    const a = createRect({ x: 10, y: 20, width: 50, height: 50 });
    expect(computeAlignment([a], 'left').size).toBe(0);
  });

  it('aligns left edges', () => {
    const a = createRect({ x: 10, y: 0, width: 50, height: 50 });
    const b = createRect({ x: 80, y: 0, width: 50, height: 50 });
    const result = computeAlignment([a, b], 'left');
    expect(result.get(a.id)!.x).toBe(10);
    expect(result.get(b.id)!.x).toBe(10);
  });

  it('aligns right edges', () => {
    const a = createRect({ x: 10, y: 0, width: 50, height: 50 });
    const b = createRect({ x: 80, y: 0, width: 30, height: 50 });
    const result = computeAlignment([a, b], 'right');
    expect(result.get(a.id)!.x + 50).toBe(110);
    expect(result.get(b.id)!.x + 30).toBe(110);
  });

  it('aligns top edges', () => {
    const a = createRect({ x: 0, y: 10, width: 50, height: 50 });
    const b = createRect({ x: 0, y: 80, width: 50, height: 50 });
    const result = computeAlignment([a, b], 'top');
    expect(result.get(a.id)!.y).toBe(10);
    expect(result.get(b.id)!.y).toBe(10);
  });

  it('aligns center-x', () => {
    const a = createRect({ x: 0, y: 0, width: 100, height: 50 });
    const b = createRect({ x: 200, y: 0, width: 50, height: 50 });
    const result = computeAlignment([a, b], 'center-x');
    const aCx = result.get(a.id)!.x + 50;
    const bCx = result.get(b.id)!.x + 25;
    expect(aCx).toBe(bCx);
  });
});

// ── computeDistribution ──────────────────────────────────────────

describe('computeDistribution', () => {
  it('returns empty for less than 3 elements', () => {
    const a = createRect({ x: 0, y: 0, width: 50, height: 50 });
    const b = createRect({ x: 100, y: 0, width: 50, height: 50 });
    expect(computeDistribution([a, b], 'horizontal').size).toBe(0);
  });

  it('distributes horizontally with equal gaps', () => {
    const a = createRect({ x: 0, y: 0, width: 20, height: 50 });
    const b = createRect({ x: 50, y: 0, width: 20, height: 50 });
    const c = createRect({ x: 200, y: 0, width: 20, height: 50 });
    const result = computeDistribution([a, b, c], 'horizontal');
    const positions = [result.get(a.id)!.x, result.get(b.id)!.x, result.get(c.id)!.x];
    const gaps = [positions[1] - (positions[0] + 20), positions[2] - (positions[1] + 20)];
    expect(Math.abs(gaps[0] - gaps[1])).toBeLessThan(0.01);
  });

  it('distributes vertically with equal gaps', () => {
    const a = createRect({ x: 0, y: 0, width: 50, height: 30 });
    const b = createRect({ x: 0, y: 60, width: 50, height: 30 });
    const c = createRect({ x: 0, y: 200, width: 50, height: 30 });
    const result = computeDistribution([a, b, c], 'vertical');
    const positions = [result.get(a.id)!.y, result.get(b.id)!.y, result.get(c.id)!.y];
    const gaps = [positions[1] - (positions[0] + 30), positions[2] - (positions[1] + 30)];
    expect(Math.abs(gaps[0] - gaps[1])).toBeLessThan(0.01);
  });
});
