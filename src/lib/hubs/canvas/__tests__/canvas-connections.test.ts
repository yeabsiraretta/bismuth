import { describe, expect, it } from 'vitest';

import {
  computeBezierPath,
  computeElbowPath,
  computePath,
  computeStraightPath,
  createConnection,
  findNearestAnchor,
  getAnchorPoint,
  getAnchorPoints,
  getPathMidpoint,
} from '@/hubs/canvas/services/canvas-connections';
import { createRect } from '@/hubs/canvas/types/canvas-types';

const el = createRect({ x: 100, y: 200, width: 80, height: 60 });

// ── getAnchorPoint ───────────────────────────────────────────────

describe('getAnchorPoint', () => {
  it('returns north (top center)', () => {
    const p = getAnchorPoint(el, 'n');
    expect(p).toEqual({ x: 140, y: 200 });
  });

  it('returns east (right center)', () => {
    const p = getAnchorPoint(el, 'e');
    expect(p).toEqual({ x: 180, y: 230 });
  });

  it('returns south (bottom center)', () => {
    const p = getAnchorPoint(el, 's');
    expect(p).toEqual({ x: 140, y: 260 });
  });

  it('returns west (left center)', () => {
    const p = getAnchorPoint(el, 'w');
    expect(p).toEqual({ x: 100, y: 230 });
  });

  it('returns center', () => {
    const p = getAnchorPoint(el, 'center');
    expect(p).toEqual({ x: 140, y: 230 });
  });

  it('returns ne corner', () => {
    const p = getAnchorPoint(el, 'ne');
    expect(p).toEqual({ x: 180, y: 200 });
  });

  it('returns sw corner', () => {
    const p = getAnchorPoint(el, 'sw');
    expect(p).toEqual({ x: 100, y: 260 });
  });
});

// ── getAnchorPoints ──────────────────────────────────────────────

describe('getAnchorPoints', () => {
  it('returns 8 anchor points', () => {
    const pts = getAnchorPoints(el);
    expect(pts).toHaveLength(8);
    expect(pts.every((p) => 'anchor' in p && 'point' in p)).toBe(true);
  });
});

// ── computeStraightPath ──────────────────────────────────────────

describe('computeStraightPath', () => {
  it('creates M...L path', () => {
    const d = computeStraightPath({ x: 0, y: 0 }, { x: 100, y: 50 });
    expect(d).toBe('M 0 0 L 100 50');
  });
});

// ── computeElbowPath ─────────────────────────────────────────────

describe('computeElbowPath', () => {
  it('creates horizontal-to-horizontal elbow', () => {
    const d = computeElbowPath({ x: 0, y: 0 }, { x: 100, y: 50 }, 'e', 'w');
    expect(d).toContain('M 0 0');
    expect(d).toContain('L 100 50');
    expect(d.split('L').length).toBe(4);
  });

  it('creates vertical-to-vertical elbow', () => {
    const d = computeElbowPath({ x: 0, y: 0 }, { x: 100, y: 100 }, 's', 'n');
    expect(d).toContain('M 0 0');
    expect(d.split('L').length).toBe(4);
  });

  it('creates horizontal-to-vertical L-shape', () => {
    const d = computeElbowPath({ x: 0, y: 0 }, { x: 100, y: 100 }, 'e', 'n');
    expect(d).toContain('M 0 0');
    expect(d.split('L').length).toBe(3);
  });
});

// ── computeBezierPath ────────────────────────────────────────────

describe('computeBezierPath', () => {
  it('creates cubic bezier path', () => {
    const d = computeBezierPath({ x: 0, y: 0 }, { x: 200, y: 100 });
    expect(d).toContain('M 0 0');
    expect(d).toContain('C');
  });
});

// ── computePath ──────────────────────────────────────────────────

describe('computePath', () => {
  it('delegates to straight', () => {
    const d = computePath({ x: 0, y: 0 }, { x: 100, y: 50 }, 'straight', 'e', 'w');
    expect(d).toBe('M 0 0 L 100 50');
  });

  it('delegates to elbow', () => {
    const d = computePath({ x: 0, y: 0 }, { x: 100, y: 50 }, 'elbow', 'e', 'w');
    expect(d).toContain('L');
    expect(d.split('L').length).toBeGreaterThan(2);
  });

  it('delegates to bezier', () => {
    const d = computePath({ x: 0, y: 0 }, { x: 100, y: 50 }, 'bezier', 'e', 'w');
    expect(d).toContain('C');
  });
});

// ── getPathMidpoint ──────────────────────────────────────────────

describe('getPathMidpoint', () => {
  it('returns midpoint of two points', () => {
    const m = getPathMidpoint({ x: 0, y: 0 }, { x: 100, y: 200 });
    expect(m).toEqual({ x: 50, y: 100 });
  });
});

// ── findNearestAnchor ────────────────────────────────────────────

describe('findNearestAnchor', () => {
  it('returns nearest anchor to a point', () => {
    const a = findNearestAnchor(el, { x: 180, y: 230 });
    expect(a).toBe('e');
  });

  it('returns west for point to the left', () => {
    const a = findNearestAnchor(el, { x: 90, y: 230 });
    expect(a).toBe('w');
  });

  it('returns north for point above', () => {
    const a = findNearestAnchor(el, { x: 140, y: 190 });
    expect(a).toBe('n');
  });
});

// ── createConnection ─────────────────────────────────────────────

describe('createConnection', () => {
  it('creates with required fields and defaults', () => {
    const c = createConnection({ sourceId: 'a', targetId: 'b' });
    expect(c.sourceId).toBe('a');
    expect(c.targetId).toBe('b');
    expect(c.routing).toBe('straight');
    expect(c.endMarker).toBe('arrow');
    expect(c.startMarker).toBe('none');
    expect(c.id).toBeTruthy();
  });

  it('accepts overrides', () => {
    const c = createConnection({ sourceId: 'a', targetId: 'b', routing: 'bezier', label: 'test' });
    expect(c.routing).toBe('bezier');
    expect(c.label).toBe('test');
  });
});
