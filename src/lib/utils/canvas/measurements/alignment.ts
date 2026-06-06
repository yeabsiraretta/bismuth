/**
 * Alignment guide computation and snapping utilities.
 */

import type { CanvasElement } from '@/types/canvas';
import type { AlignmentGuide, RulerTick } from './index';

function deduplicateGuides(guides: AlignmentGuide[]): AlignmentGuide[] {
  const seen = new Set<string>();
  return guides.filter((g) => {
    const key = `${g.axis}:${g.position.toFixed(1)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Computes alignment guides for a moving element against all other elements.
 * Returns guides that the element snaps to.
 */
export function computeAlignmentGuides(
  moving: CanvasElement,
  others: CanvasElement[],
  threshold: number = 4
): AlignmentGuide[] {
  const guides: AlignmentGuide[] = [];
  const movingCenterX = moving.x + moving.width / 2;
  const movingCenterY = moving.y + moving.height / 2;
  const movingRight = moving.x + moving.width;
  const movingBottom = moving.y + moving.height;

  for (const other of others) {
    if (other.id === moving.id) continue;

    const otherCenterX = other.x + other.width / 2;
    const otherCenterY = other.y + other.height / 2;
    const otherRight = other.x + other.width;
    const otherBottom = other.y + other.height;

    // Vertical guides (alignment on X axis)
    const xAlignments = [
      { pos: other.x, type: 'edge' as const },
      { pos: otherCenterX, type: 'center' as const },
      { pos: otherRight, type: 'edge' as const },
    ];

    for (const align of xAlignments) {
      if (Math.abs(moving.x - align.pos) <= threshold) {
        guides.push({
          axis: 'vertical',
          position: align.pos,
          start: Math.min(moving.y, other.y),
          end: Math.max(movingBottom, otherBottom),
          type: align.type,
        });
      }
      if (Math.abs(movingCenterX - align.pos) <= threshold) {
        guides.push({
          axis: 'vertical',
          position: align.pos,
          start: Math.min(moving.y, other.y),
          end: Math.max(movingBottom, otherBottom),
          type: 'center',
        });
      }
      if (Math.abs(movingRight - align.pos) <= threshold) {
        guides.push({
          axis: 'vertical',
          position: align.pos,
          start: Math.min(moving.y, other.y),
          end: Math.max(movingBottom, otherBottom),
          type: align.type,
        });
      }
    }

    // Horizontal guides (alignment on Y axis)
    const yAlignments = [
      { pos: other.y, type: 'edge' as const },
      { pos: otherCenterY, type: 'center' as const },
      { pos: otherBottom, type: 'edge' as const },
    ];

    for (const align of yAlignments) {
      if (Math.abs(moving.y - align.pos) <= threshold) {
        guides.push({
          axis: 'horizontal',
          position: align.pos,
          start: Math.min(moving.x, other.x),
          end: Math.max(movingRight, otherRight),
          type: align.type,
        });
      }
      if (Math.abs(movingCenterY - align.pos) <= threshold) {
        guides.push({
          axis: 'horizontal',
          position: align.pos,
          start: Math.min(moving.x, other.x),
          end: Math.max(movingRight, otherRight),
          type: 'center',
        });
      }
      if (Math.abs(movingBottom - align.pos) <= threshold) {
        guides.push({
          axis: 'horizontal',
          position: align.pos,
          start: Math.min(moving.x, other.x),
          end: Math.max(movingRight, otherRight),
          type: align.type,
        });
      }
    }
  }

  return deduplicateGuides(guides);
}

/**
 * Generates ruler tick marks for the visible viewport.
 */
export function generateRulerTicks(
  viewportStart: number,
  viewportEnd: number,
  scale: number
): RulerTick[] {
  const ticks: RulerTick[] = [];

  let majorSpacing = 100;
  if (scale < 0.25) majorSpacing = 400;
  else if (scale < 0.5) majorSpacing = 200;
  else if (scale > 2) majorSpacing = 50;
  else if (scale > 4) majorSpacing = 25;

  const minorSpacing = majorSpacing / 5;
  const microSpacing = majorSpacing / 10;

  const start = Math.floor(viewportStart / microSpacing) * microSpacing;
  const end = Math.ceil(viewportEnd / microSpacing) * microSpacing;

  for (let pos = start; pos <= end; pos += microSpacing) {
    if (pos % majorSpacing === 0) {
      ticks.push({ position: pos, label: String(pos), size: 'major' });
    } else if (pos % minorSpacing === 0) {
      ticks.push({ position: pos, label: '', size: 'minor' });
    } else {
      ticks.push({ position: pos, label: '', size: 'micro' });
    }
  }

  return ticks;
}

/**
 * Snaps a value to the nearest guide position if within threshold.
 */
export function snapToGuide(
  value: number,
  guides: AlignmentGuide[],
  axis: 'horizontal' | 'vertical',
  threshold: number = 4
): number | null {
  for (const guide of guides) {
    if (guide.axis === axis && Math.abs(value - guide.position) <= threshold) {
      return guide.position;
    }
  }
  return null;
}

/**
 * Maps a raw pixel measurement to the nearest design token spacing value.
 */
export function snapToTokenSpacing(px: number): { value: number; token: string } | null {
  const SPACING_SCALE = [
    { value: 4, token: 'Spacing/XS' },
    { value: 8, token: 'Spacing/S' },
    { value: 12, token: 'Spacing/12' },
    { value: 16, token: 'Spacing/M' },
    { value: 20, token: 'Spacing/20' },
    { value: 24, token: 'Spacing/L' },
    { value: 32, token: 'Spacing/XL' },
    { value: 40, token: 'Spacing/40' },
    { value: 48, token: 'Spacing/2XL' },
    { value: 56, token: 'Spacing/56' },
    { value: 64, token: 'Spacing/3XL' },
  ];

  let closest = SPACING_SCALE[0];
  let minDiff = Math.abs(px - closest.value);

  for (const entry of SPACING_SCALE) {
    const diff = Math.abs(px - entry.value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }

  if (minDiff <= 2) {
    return closest;
  }
  return null;
}
