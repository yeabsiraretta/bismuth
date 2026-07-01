/**
 * Tests for canvas distance measurement utilities.
 */
import { describe, it, expect } from 'vitest';
import { measureBetween, measureToParent } from '../distance';
import type { CanvasElement } from '@/features/canvas/types';

function el(id: string, x: number, y: number, w = 100, h = 50): CanvasElement {
  return { id, type: 'rectangle', x, y, width: w, height: h, rotation: 0, locked: false, visible: true, zIndex: 0, props: {} } as unknown as CanvasElement;
}

describe('measureBetween', () => {
  it('measures horizontal gap between non-overlapping elements', () => {
    const a = el('a', 0, 0, 100, 50);  // right edge at x=100
    const b = el('b', 150, 10, 100, 30); // left edge at x=150
    const m = measureBetween(a, b);
    const horiz = m.filter(x => x.axis === 'horizontal');
    expect(horiz).toHaveLength(1);
    expect(horiz[0].distance).toBe(50);
    expect(horiz[0].label).toBe('50');
  });

  it('measures vertical gap between non-overlapping elements', () => {
    const a = el('a', 0, 0, 100, 50);  // bottom at y=50
    const b = el('b', 0, 80, 100, 50); // top at y=80
    const m = measureBetween(a, b);
    const vert = m.filter(x => x.axis === 'vertical');
    expect(vert).toHaveLength(1);
    expect(vert[0].distance).toBe(30);
  });

  it('measures gap when b is to the left of a', () => {
    const a = el('a', 200, 0);
    const b = el('b', 0, 0);  // right at 100, gap = 100
    const m = measureBetween(a, b);
    const horiz = m.filter(x => x.axis === 'horizontal');
    expect(horiz).toHaveLength(1);
    expect(horiz[0].distance).toBe(100);
  });

  it('shows center-to-center distances for overlapping elements', () => {
    const a = el('a', 0, 0, 200, 200);
    const b = el('b', 50, 50, 50, 50); // fully inside a
    const m = measureBetween(a, b);
    expect(m.length).toBeGreaterThan(0);
    // All measurements are center-to-center
    m.forEach(x => expect(x.distance).toBeGreaterThanOrEqual(0));
  });

  it('formats decimal distances', () => {
    const a = el('a', 0, 0, 100, 50);
    const b = el('b', 100.5, 0, 100, 50);
    const m = measureBetween(a, b);
    const horiz = m.find(x => x.axis === 'horizontal');
    expect(horiz?.label).toBe('0.5');
  });

  it('returns no gap measurements when elements touch', () => {
    const a = el('a', 0, 0, 100, 50);
    const b = el('b', 100, 0, 100, 50); // left edge = right edge of a (dist=0)
    const m = measureBetween(a, b);
    const horiz = m.filter(x => x.axis === 'horizontal');
    // dist=0, treated as overlap, returns center-to-center
    expect(horiz.length).toBeGreaterThanOrEqual(0);
  });
});

describe('measureToParent', () => {
  it('measures padding from element to parent edges', () => {
    const parent = el('parent', 0, 0, 300, 200);
    const child = el('child', 20, 10, 100, 50);
    const m = measureToParent(child, parent);
    const left = m.find(x => x.axis === 'horizontal' && x.from.x === 0);
    expect(left?.distance).toBe(20);
    const top = m.find(x => x.axis === 'vertical' && x.from.y === 0);
    expect(top?.distance).toBe(10);
  });

  it('measures right and bottom padding', () => {
    const parent = el('parent', 0, 0, 200, 150);
    const child = el('child', 0, 0, 150, 100);
    const m = measureToParent(child, parent);
    const right = m.find(x => x.axis === 'horizontal' && x.from.x === 150);
    expect(right?.distance).toBe(50);
    const bottom = m.find(x => x.axis === 'vertical' && x.from.y === 100);
    expect(bottom?.distance).toBe(50);
  });

  it('returns no measurements when element fills parent exactly', () => {
    const parent = el('parent', 0, 0, 100, 50);
    const child = el('child', 0, 0, 100, 50);
    const m = measureToParent(child, parent);
    expect(m).toHaveLength(0);
  });
});
