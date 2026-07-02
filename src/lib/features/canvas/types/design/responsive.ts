/**
 * Responsive Preview & Breakpoints types.
 * Named breakpoints and responsive variant overrides.
 */

import type { ElementProperties } from '../elements';

/** A named breakpoint definition. */
export interface Breakpoint {
  id: string;
  name: string;
  minWidth: number;
  maxWidth?: number;
}

/** A responsive variant mapping overrides to a breakpoint. */
export interface ResponsiveVariant {
  breakpointId: string;
  overrides: Record<string, Partial<ElementProperties>>;
}

/** Responsive constraint describing how an element pins/scales at breakpoints. */
export interface ResponsiveConstraint {
  horizontal: 'left' | 'right' | 'left-right' | 'center' | 'scale';
  vertical: 'top' | 'bottom' | 'top-bottom' | 'center' | 'scale';
}

/** Default breakpoint definitions. */
export const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  { id: 'mobile', name: 'Mobile', minWidth: 320, maxWidth: 767 },
  { id: 'tablet', name: 'Tablet', minWidth: 768, maxWidth: 1023 },
  { id: 'desktop', name: 'Desktop', minWidth: 1024, maxWidth: 1920 },
];
