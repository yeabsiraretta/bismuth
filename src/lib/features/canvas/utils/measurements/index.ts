/**
 * Measurement Guides & Rulers System (T138)
 *
 * Provides visual measurement overlays for the canvas:
 * - Distance lines between elements (redlines)
 * - Alignment guides (snap indicators)
 * - Ruler markings along viewport edges
 * - Smart spacing indicators (shows gap values between siblings)
 */

import type { Point } from '@/features/canvas/types';

// ─── Measurement Types ───────────────────────────────────────────────────────

/** A distance measurement between two points or element edges. */
export interface Measurement {
  /** Start point of the measurement line. */
  from: Point;
  /** End point of the measurement line. */
  to: Point;
  /** Computed distance in pixels. */
  distance: number;
  /** Axis of measurement. */
  axis: 'horizontal' | 'vertical';
  /** Label to display (formatted distance). */
  label: string;
}

/** Alignment guide shown during element positioning. */
export interface AlignmentGuide {
  /** Axis of the guide. */
  axis: 'horizontal' | 'vertical';
  /** Position on the perpendicular axis (px). */
  position: number;
  /** Start extent of the guide line. */
  start: number;
  /** End extent of the guide line. */
  end: number;
  /** Type of alignment this guide represents. */
  type: 'center' | 'edge' | 'spacing';
}

/** Ruler tick mark for the viewport ruler. */
export interface RulerTick {
  /** Position along the ruler in canvas coordinates. */
  position: number;
  /** Display label (e.g., "100", "200"). */
  label: string;
  /** Tick importance (determines height). */
  size: 'major' | 'minor' | 'micro';
}

export { measureBetween, measureToParent } from './distance';
export {
  computeAlignmentGuides,
  generateRulerTicks,
  snapToGuide,
  snapToTokenSpacing,
} from './alignment';
