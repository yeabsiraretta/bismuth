import { describe, it, expect } from 'vitest';
import {
  intensityLevel,
  getIntensityRange,
  buildYearHeatmapGrid,
  COLOR_SCHEMES,
} from '../heatmapData';
import type { HeatmapEntry } from '../heatmapData';

describe('intensityLevel', () => {
  it('returns 0 when value <= min', () => {
    expect(intensityLevel(0, 0, 10)).toBe(0);
    expect(intensityLevel(-5, 0, 10)).toBe(0);
  });

  it('returns 4 when value >= max', () => {
    expect(intensityLevel(10, 0, 10)).toBe(4);
    expect(intensityLevel(15, 0, 10)).toBe(4);
  });

  it('returns intermediate levels', () => {
    expect(intensityLevel(1, 0, 10)).toBe(0);
    expect(intensityLevel(3, 0, 10)).toBe(1);
    expect(intensityLevel(5, 0, 10)).toBe(2);
    expect(intensityLevel(7, 0, 10)).toBe(3);
    expect(intensityLevel(9, 0, 10)).toBe(4);
  });

  it('returns 0 when max <= min', () => {
    expect(intensityLevel(5, 10, 10)).toBe(0);
    expect(intensityLevel(5, 10, 5)).toBe(0);
  });
});

describe('getIntensityRange', () => {
  it('returns default range for empty entries', () => {
    expect(getIntensityRange([], 0, 0)).toEqual({ min: 0, max: 1 });
  });

  it('derives min/max from entries when config is 0', () => {
    const entries: HeatmapEntry[] = [
      { date: '2024-01-01', intensity: 3 },
      { date: '2024-01-02', intensity: 7 },
      { date: '2024-01-03', intensity: 5 },
    ];
    expect(getIntensityRange(entries, 0, 0)).toEqual({ min: 3, max: 7 });
  });

  it('uses config overrides when specified', () => {
    const entries: HeatmapEntry[] = [
      { date: '2024-01-01', intensity: 3 },
      { date: '2024-01-02', intensity: 7 },
    ];
    expect(getIntensityRange(entries, 1, 10)).toEqual({ min: 1, max: 10 });
  });

  it('prevents max <= min', () => {
    const entries: HeatmapEntry[] = [{ date: '2024-01-01', intensity: 5 }];
    expect(getIntensityRange(entries, 5, 5)).toEqual({ min: 5, max: 6 });
  });
});

describe('buildYearHeatmapGrid', () => {
  it('produces weeks with 7 days each', () => {
    const grid = buildYearHeatmapGrid(2024);
    for (const week of grid) {
      expect(week).toHaveLength(7);
    }
  });

  it('covers all 366 days of a leap year', () => {
    const grid = buildYearHeatmapGrid(2024);
    const allDates = grid.flat().filter((d) => d.startsWith('2024-'));
    const uniqueDates = new Set(allDates);
    expect(uniqueDates.size).toBe(366);
  });

  it('covers all 365 days of a non-leap year', () => {
    const grid = buildYearHeatmapGrid(2023);
    const allDates = grid.flat().filter((d) => d.startsWith('2023-'));
    const uniqueDates = new Set(allDates);
    expect(uniqueDates.size).toBe(365);
  });

  it('produces between 52 and 54 weeks', () => {
    const grid = buildYearHeatmapGrid(2024);
    expect(grid.length).toBeGreaterThanOrEqual(52);
    expect(grid.length).toBeLessThanOrEqual(54);
  });

  it('starts with the correct first day', () => {
    const grid = buildYearHeatmapGrid(2024);
    // Jan 1 2024 is a Monday, so week 0 should start on the preceding Sunday (Dec 31 2023)
    expect(grid[0][0]).toBe('2023-12-31');
    expect(grid[0][1]).toBe('2024-01-01');
  });
});

describe('COLOR_SCHEMES', () => {
  it('has 5 colors per scheme', () => {
    for (const [, colors] of Object.entries(COLOR_SCHEMES)) {
      expect(colors).toHaveLength(5);
    }
  });

  it('has all expected schemes', () => {
    expect(Object.keys(COLOR_SCHEMES)).toEqual(
      expect.arrayContaining(['green', 'blue', 'red', 'orange', 'purple'])
    );
  });
});
