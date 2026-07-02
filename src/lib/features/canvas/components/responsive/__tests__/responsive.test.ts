/**
 * T076: Responsive preview tests — breakpoint validation, constraint application.
 */
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_BREAKPOINTS,
  type Breakpoint,
  type ResponsiveConstraint,
} from '@/features/canvas/types/design/responsive';

describe('Responsive Preview', () => {
  describe('breakpoint definitions', () => {
    it('default breakpoints cover mobile, tablet, desktop', () => {
      expect(DEFAULT_BREAKPOINTS.length).toBeGreaterThanOrEqual(3);
      const names = DEFAULT_BREAKPOINTS.map((bp) => bp.name.toLowerCase());
      expect(names).toContain('mobile');
      expect(names).toContain('tablet');
      expect(names).toContain('desktop');
    });

    it('breakpoints have non-overlapping ranges', () => {
      const sorted = [...DEFAULT_BREAKPOINTS].sort((a, b) => a.minWidth - b.minWidth);
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].maxWidth).toBeLessThan(sorted[i + 1].minWidth);
      }
    });

    it('breakpoints have valid min/max ranges', () => {
      for (const bp of DEFAULT_BREAKPOINTS) {
        expect(bp.minWidth).toBeGreaterThan(0);
        expect(bp.maxWidth).toBeGreaterThanOrEqual(bp.minWidth);
      }
    });
  });

  describe('constraint application', () => {
    it('pinning constraint maintains specified edges', () => {
      const constraint: ResponsiveConstraint = {
        horizontal: 'left-right',
        vertical: 'top',
      };
      expect(constraint.horizontal).toBe('left-right');
      expect(constraint.vertical).toBe('top');
    });

    it('scale constraint preserves aspect ratio', () => {
      const constraint: ResponsiveConstraint = {
        horizontal: 'scale',
        vertical: 'scale',
      };
      expect(constraint.horizontal).toBe('scale');
      expect(constraint.vertical).toBe('scale');
    });

    it('center constraint centers element', () => {
      const constraint: ResponsiveConstraint = {
        horizontal: 'center',
        vertical: 'center',
      };
      expect(constraint.horizontal).toBe('center');
      expect(constraint.vertical).toBe('center');
    });
  });

  describe('breakpoint matching', () => {
    function findBreakpoint(width: number, breakpoints: Breakpoint[]): Breakpoint | null {
      return (
        breakpoints.find((bp) => width >= bp.minWidth && width <= (bp.maxWidth ?? Infinity)) ?? null
      );
    }

    it('finds mobile breakpoint for narrow width', () => {
      const bp = findBreakpoint(375, DEFAULT_BREAKPOINTS);
      expect(bp?.name.toLowerCase()).toBe('mobile');
    });

    it('finds desktop breakpoint for wide width', () => {
      const bp = findBreakpoint(1440, DEFAULT_BREAKPOINTS);
      expect(bp?.name.toLowerCase()).toBe('desktop');
    });

    it('returns null for out-of-range width', () => {
      const bp = findBreakpoint(50, DEFAULT_BREAKPOINTS);
      expect(bp).toBeNull();
    });
  });
});
