/**
 * Sticky Notes & Annotations System (T136)
 *
 * Provides canvas-level annotations that overlay the design:
 * - Sticky notes (colored cards with text)
 * - Pin annotations (numbered markers with tooltip)
 * - Freehand annotations (drawing overlay)
 */

import type { Point } from '@/types/canvas';

// ─── Annotation Types ────────────────────────────────────────────────────────

export type AnnotationType = 'sticky' | 'pin' | 'freehand' | 'highlight';

export type StickyColor = 'yellow' | 'blue' | 'green' | 'pink' | 'orange' | 'purple';

export const STICKY_COLORS: Record<StickyColor, { bg: string; border: string }> = {
  yellow: { bg: '#fef9c3', border: '#fde047' },
  blue: { bg: '#dbeafe', border: '#93c5fd' },
  green: { bg: '#dcfce7', border: '#86efac' },
  pink: { bg: '#fce7f3', border: '#f9a8d4' },
  orange: { bg: '#ffedd5', border: '#fdba74' },
  purple: { bg: '#ede9fe', border: '#c4b5fd' },
};

/** A sticky note annotation on the canvas. */
export interface StickyNote {
  id: string;
  type: 'sticky';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: StickyColor;
  author?: string;
  created_at: number;
  /** If set, this sticky is anchored to a specific element. */
  anchoredToElementId?: string;
  collapsed: boolean;
}

/** A numbered pin marker on the canvas. */
export interface PinAnnotation {
  id: string;
  type: 'pin';
  x: number;
  y: number;
  /** Pin number (auto-assigned). */
  number: number;
  text: string;
  color: string;
  author?: string;
  created_at: number;
  anchoredToElementId?: string;
  resolved: boolean;
}

/** A freehand drawing annotation (pen strokes). */
export interface FreehandAnnotation {
  id: string;
  type: 'freehand';
  points: Point[];
  strokeColor: string;
  strokeWidth: number;
  created_at: number;
}

/** A rectangular highlight overlay. */
export interface HighlightAnnotation {
  id: string;
  type: 'highlight';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  created_at: number;
  anchoredToElementId?: string;
}

export type Annotation =
  | StickyNote
  | PinAnnotation
  | FreehandAnnotation
  | HighlightAnnotation;

// ─── Annotation Store Interface ─────────────────────────────────────────────

export interface AnnotationLayer {
  id: string;
  canvasId: string;
  name: string;
  visible: boolean;
  annotations: Annotation[];
}

// ─── Factory Functions ──────────────────────────────────────────────────────

function generateId(): string {
  return `ann-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

export function createStickyNote(
  x: number,
  y: number,
  options: Partial<StickyNote> = {}
): StickyNote {
  return {
    id: generateId(),
    type: 'sticky',
    x,
    y,
    width: 200,
    height: 150,
    text: '',
    color: 'yellow',
    created_at: Math.floor(Date.now() / 1000),
    collapsed: false,
    ...options,
  };
}

export function createPinAnnotation(
  x: number,
  y: number,
  number: number,
  options: Partial<PinAnnotation> = {}
): PinAnnotation {
  return {
    id: generateId(),
    type: 'pin',
    x,
    y,
    number,
    text: '',
    color: '#ef4444',
    created_at: Math.floor(Date.now() / 1000),
    resolved: false,
    ...options,
  };
}

export function createFreehandAnnotation(
  points: Point[],
  options: Partial<FreehandAnnotation> = {}
): FreehandAnnotation {
  return {
    id: generateId(),
    type: 'freehand',
    points,
    strokeColor: '#ef4444',
    strokeWidth: 2,
    created_at: Math.floor(Date.now() / 1000),
    ...options,
  };
}

export function createHighlightAnnotation(
  x: number,
  y: number,
  width: number,
  height: number,
  options: Partial<HighlightAnnotation> = {}
): HighlightAnnotation {
  return {
    id: generateId(),
    type: 'highlight',
    x,
    y,
    width,
    height,
    color: '#fde047',
    opacity: 0.3,
    created_at: Math.floor(Date.now() / 1000),
    ...options,
  };
}

// ─── Annotation Utilities ───────────────────────────────────────────────────

/** Filters annotations anchored to a specific element. */
export function getAnnotationsForElement(
  annotations: Annotation[],
  elementId: string
): Annotation[] {
  return annotations.filter((a) => {
    if ('anchoredToElementId' in a) {
      return a.anchoredToElementId === elementId;
    }
    return false;
  });
}

/** Returns unresolved pin annotations (for review mode). */
export function getUnresolvedPins(annotations: Annotation[]): PinAnnotation[] {
  return annotations.filter(
    (a): a is PinAnnotation => a.type === 'pin' && !a.resolved
  );
}

/** Generates the next pin number in sequence. */
export function nextPinNumber(annotations: Annotation[]): number {
  const pins = annotations.filter((a): a is PinAnnotation => a.type === 'pin');
  return pins.length > 0 ? Math.max(...pins.map((p) => p.number)) + 1 : 1;
}
