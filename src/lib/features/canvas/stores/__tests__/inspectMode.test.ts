import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  inspectEnabled,
  measureFrom,
  measureTo,
  spacing,
  toggleInspect,
  registerBounds,
  setMeasurement,
  clearMeasurement,
} from '../design/inspectMode';

describe('inspectMode', () => {
  beforeEach(() => {
    inspectEnabled.set(false);
    measureFrom.set(null);
    measureTo.set(null);
  });

  describe('toggleInspect', () => {
    it('should toggle inspect mode on', () => {
      toggleInspect();
      expect(get(inspectEnabled)).toBe(true);
    });

    it('should toggle inspect mode off', () => {
      inspectEnabled.set(true);
      toggleInspect();
      expect(get(inspectEnabled)).toBe(false);
    });
  });

  describe('setMeasurement / clearMeasurement', () => {
    it('should set measurement points', () => {
      setMeasurement('el-1', 'el-2');
      expect(get(measureFrom)).toBe('el-1');
      expect(get(measureTo)).toBe('el-2');
    });

    it('should clear measurement points', () => {
      setMeasurement('el-1', 'el-2');
      clearMeasurement();
      expect(get(measureFrom)).toBeNull();
      expect(get(measureTo)).toBeNull();
    });
  });

  describe('spacing derived store', () => {
    it('should return null when no measurement is set', () => {
      expect(get(spacing)).toBeNull();
    });

    it('should calculate spacing between registered elements', () => {
      registerBounds('el-1', { x: 0, y: 0, width: 100, height: 50 });
      registerBounds('el-2', { x: 150, y: 0, width: 100, height: 50 });
      setMeasurement('el-1', 'el-2');
      const s = get(spacing);
      expect(s).not.toBeNull();
      expect(s!.horizontal).toBe(50);
    });

    it('should return null if one element is missing bounds', () => {
      registerBounds('el-1', { x: 0, y: 0, width: 100, height: 50 });
      setMeasurement('el-1', 'el-missing');
      expect(get(spacing)).toBeNull();
    });
  });
});
