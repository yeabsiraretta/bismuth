/**
 * Canvas Vector Service — path serialization, hit testing, and boolean operations for vector elements.
 * Pure functions, no side effects.
 */

import type { VectorPathSegment } from '@/hubs/canvas/types/canvas-types';

// ── Path → SVG ────────────────────────────────────────────────────────────────

export function vectorPathToSVG(segments: VectorPathSegment[]): string {
  return segments
    .map((seg) => {
      switch (seg.type) {
        case 'M':
          return `M ${seg.x} ${seg.y}`;
        case 'L':
          return `L ${seg.x} ${seg.y}`;
        case 'C':
          return `C ${seg.cx1 ?? seg.x} ${seg.cy1 ?? seg.y}, ${seg.cx2 ?? seg.x} ${seg.cy2 ?? seg.y}, ${seg.x} ${seg.y}`;
        case 'Q':
          return `Q ${seg.cx1 ?? seg.x} ${seg.cy1 ?? seg.y}, ${seg.x} ${seg.y}`;
        case 'Z':
          return 'Z';
      }
    })
    .join(' ');
}

export function vectorPathsToSVG(paths: VectorPathSegment[][]): string {
  return paths.map(vectorPathToSVG).join(' ');
}

// ── SVG → Path segments ───────────────────────────────────────────────────────

export function parseSVGPath(d: string): VectorPathSegment[] {
  const segments: VectorPathSegment[] = [];
  const re = /([MLCQZ])\s*([\d.e+-]*(?:\s*,?\s*[\d.e+-]*)*)*/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(d)) !== null) {
    const type = match[1].toUpperCase() as VectorPathSegment['type'];
    const nums = (match[2] || '')
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);

    switch (type) {
      case 'M':
      case 'L':
        if (nums.length >= 2) segments.push({ type, x: nums[0], y: nums[1] });
        break;
      case 'C':
        if (nums.length >= 6)
          segments.push({
            type,
            x: nums[4],
            y: nums[5],
            cx1: nums[0],
            cy1: nums[1],
            cx2: nums[2],
            cy2: nums[3],
          });
        break;
      case 'Q':
        if (nums.length >= 4)
          segments.push({ type, x: nums[2], y: nums[3], cx1: nums[0], cy1: nums[1] });
        break;
      case 'Z':
        segments.push({ type: 'Z', x: 0, y: 0 });
        break;
    }
  }
  return segments;
}

// ── Bounding box for path ─────────────────────────────────────────────────────

export function getPathBounds(segments: VectorPathSegment[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (segments.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const seg of segments) {
    if (seg.type === 'Z') continue;
    minX = Math.min(minX, seg.x);
    minY = Math.min(minY, seg.y);
    maxX = Math.max(maxX, seg.x);
    maxY = Math.max(maxY, seg.y);
    if (seg.cx1 !== undefined && seg.cy1 !== undefined) {
      minX = Math.min(minX, seg.cx1);
      minY = Math.min(minY, seg.cy1);
      maxX = Math.max(maxX, seg.cx1);
      maxY = Math.max(maxY, seg.cy1);
    }
    if (seg.cx2 !== undefined && seg.cy2 !== undefined) {
      minX = Math.min(minX, seg.cx2);
      minY = Math.min(minY, seg.cy2);
      maxX = Math.max(maxX, seg.cx2);
      maxY = Math.max(maxY, seg.cy2);
    }
  }

  if (!isFinite(minX)) return { x: 0, y: 0, width: 0, height: 0 };
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// ── Normalize path to origin ──────────────────────────────────────────────────

export function normalizePath(segments: VectorPathSegment[]): {
  normalized: VectorPathSegment[];
  offsetX: number;
  offsetY: number;
} {
  const bounds = getPathBounds(segments);
  const offsetX = bounds.x;
  const offsetY = bounds.y;
  const normalized = segments.map((seg) => {
    if (seg.type === 'Z') return { ...seg };
    const result: VectorPathSegment = { ...seg, x: seg.x - offsetX, y: seg.y - offsetY };
    if (seg.cx1 !== undefined) result.cx1 = seg.cx1 - offsetX;
    if (seg.cy1 !== undefined) result.cy1 = seg.cy1 - offsetY;
    if (seg.cx2 !== undefined) result.cx2 = seg.cx2 - offsetX;
    if (seg.cy2 !== undefined) result.cy2 = seg.cy2 - offsetY;
    return result;
  });
  return { normalized, offsetX, offsetY };
}

// ── Scale path ────────────────────────────────────────────────────────────────

export function scalePath(
  segments: VectorPathSegment[],
  sx: number,
  sy: number
): VectorPathSegment[] {
  return segments.map((seg) => {
    if (seg.type === 'Z') return { ...seg };
    const result: VectorPathSegment = { ...seg, x: seg.x * sx, y: seg.y * sy };
    if (seg.cx1 !== undefined) result.cx1 = seg.cx1 * sx;
    if (seg.cy1 !== undefined) result.cy1 = seg.cy1 * sy;
    if (seg.cx2 !== undefined) result.cx2 = seg.cx2 * sx;
    if (seg.cy2 !== undefined) result.cy2 = seg.cy2 * sy;
    return result;
  });
}

// ── Boolean operations (simplified polygon-based) ─────────────────────────────

type BooleanOp = 'union' | 'subtract' | 'intersect' | 'exclude';

function booleanOperation(
  _op: BooleanOp,
  _pathA: VectorPathSegment[],
  _pathB: VectorPathSegment[]
): VectorPathSegment[][] {
  // Stub — full boolean ops require Clipper.js or similar polygon clipping library.
  // For now, return both paths combined as a multi-path vector.
  return [_pathA, _pathB];
}

// ── Point on path (for pen tool) ──────────────────────────────────────────────

export function addPointToPath(
  segments: VectorPathSegment[],
  x: number,
  y: number,
  closed: boolean
): VectorPathSegment[] {
  const result = segments.filter((s) => s.type !== 'Z');
  if (result.length === 0) {
    result.push({ type: 'M', x, y });
  } else {
    result.push({ type: 'L', x, y });
  }
  if (closed) result.push({ type: 'Z', x: 0, y: 0 });
  return result;
}

export function closeCurrentPath(segments: VectorPathSegment[]): VectorPathSegment[] {
  if (segments.length === 0) return segments;
  if (segments[segments.length - 1].type === 'Z') return segments;
  return [...segments, { type: 'Z', x: 0, y: 0 }];
}
