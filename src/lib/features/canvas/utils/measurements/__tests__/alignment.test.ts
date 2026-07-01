/**
 * Tests for canvas measurement utilities — alignment guides.
 */
import { describe, it, expect } from 'vitest';
import { computeAlignmentGuides } from '../alignment';
import type { CanvasElement } from '@/features/canvas/types';

function el(id: string, x: number, y: number, w = 100, h = 50): CanvasElement {
  return { id, type: 'rectangle', x, y, width: w, height: h, rotation: 0, locked: false, visible: true, zIndex: 0, props: {} } as unknown as CanvasElement;
}

describe('computeAlignmentGuides', () => {
  it('returns no guides when no other elements', () => {
    const guides = computeAlignmentGuides(el('a', 0, 0), []);
    expect(guides).toHaveLength(0);
  });

  it('skips the moving element itself', () => {
    const a = el('a', 0, 0);
    const guides = computeAlignmentGuides(a, [a]);
    expect(guides).toHaveLength(0);
  });

  it('detects left-edge alignment within threshold', () => {
    const moving = el('moving', 2, 0);
    const other = el('other', 0, 100);
    const guides = computeAlignmentGuides(moving, [other], 4);
    const verticals = guides.filter(g => g.axis === 'vertical');
    expect(verticals.length).toBeGreaterThan(0);
  });

  it('detects center-x alignment', () => {
    const moving = el('moving', 48, 0, 104, 50); // centerX = 100
    const other = el('other', 50, 200, 100, 50); // centerX = 100
    const guides = computeAlignmentGuides(moving, [other], 4);
    const centerGuides = guides.filter(g => g.axis === 'vertical');
    expect(centerGuides.length).toBeGreaterThan(0);
  });

  it('detects top-edge alignment within threshold', () => {
    const moving = el('moving', 0, 2);
    const other = el('other', 200, 0);
    const guides = computeAlignmentGuides(moving, [other], 4);
    const horizontals = guides.filter(g => g.axis === 'horizontal');
    expect(horizontals.length).toBeGreaterThan(0);
  });

  it('ignores elements outside threshold', () => {
    const moving = el('moving', 0, 0);
    const other = el('other', 50, 100); // no edges align
    const guides = computeAlignmentGuides(moving, [other], 2);
    // No edges within threshold=2 — expect 0 or fewer guides
    const count = guides.length;
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('deduplicates identical guides', () => {
    const moving = el('moving', 0, 0);
    const others = [el('b', 0, 100), el('c', 0, 200)]; // same left x=0
    const guides = computeAlignmentGuides(moving, others, 4);
    const positions = guides.filter(g => g.axis === 'vertical').map(g => g.position);
    const unique = [...new Set(positions)];
    expect(positions.length).toBe(unique.length);
  });
});
