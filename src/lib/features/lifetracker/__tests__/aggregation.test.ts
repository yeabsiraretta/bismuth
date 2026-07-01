import { describe, it, expect } from 'vitest';
import {
  aggregateTimeSeries, movingAverage, computeTrend,
  buildHeatmap, heatmapColor, countListValues, detectScale,
} from '../services/aggregation';
import type { DataPoint, AggregatedPoint } from '../types';

function point(date: string, value: number): DataPoint {
  return { date, value, numericValue: value, sourcePath: `${date}.md` };
}

describe('aggregateTimeSeries', () => {
  it('aggregates daily values by average', () => {
    const points = [point('2026-01-01', 5), point('2026-01-01', 10), point('2026-01-02', 8)];
    const result = aggregateTimeSeries(points, 'daily', 'average');
    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(7.5);
    expect(result[1].value).toBe(8);
  });

  it('aggregates by sum', () => {
    const points = [point('2026-01-01', 100), point('2026-01-01', 200)];
    const result = aggregateTimeSeries(points, 'daily', 'sum');
    expect(result[0].value).toBe(300);
  });

  it('aggregates by count', () => {
    const points = [point('2026-01-01', 1), point('2026-01-01', 2), point('2026-01-01', 3)];
    const result = aggregateTimeSeries(points, 'daily', 'count');
    expect(result[0].value).toBe(3);
  });

  it('aggregates by min/max', () => {
    const points = [point('2026-01-01', 3), point('2026-01-01', 7), point('2026-01-01', 1)];
    expect(aggregateTimeSeries(points, 'daily', 'min')[0].value).toBe(1);
    expect(aggregateTimeSeries(points, 'daily', 'max')[0].value).toBe(7);
  });

  it('groups by month', () => {
    const points = [
      point('2026-01-05', 10), point('2026-01-20', 20),
      point('2026-02-10', 30),
    ];
    const result = aggregateTimeSeries(points, 'monthly', 'average');
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-01');
    expect(result[0].value).toBe(15);
  });

  it('skips null numeric values', () => {
    const points: DataPoint[] = [
      { date: '2026-01-01', value: 'hello', numericValue: null, sourcePath: 'test.md' },
    ];
    const result = aggregateTimeSeries(points, 'daily', 'average');
    expect(result).toHaveLength(0);
  });
});

describe('movingAverage', () => {
  it('computes moving average over window', () => {
    const pts: AggregatedPoint[] = [
      { date: '2026-01-01', value: 10, count: 1 },
      { date: '2026-01-02', value: 20, count: 1 },
      { date: '2026-01-03', value: 30, count: 1 },
    ];
    const result = movingAverage(pts, 2);
    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(15);
    expect(result[1].value).toBe(25);
  });

  it('returns original if window > length', () => {
    const pts: AggregatedPoint[] = [{ date: '2026-01-01', value: 10, count: 1 }];
    expect(movingAverage(pts, 5)).toEqual(pts);
  });
});

describe('computeTrend', () => {
  it('detects upward trend', () => {
    const pts: AggregatedPoint[] = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, '0')}`,
      value: i < 7 ? 10 : 20,
      count: 1,
    }));
    const trend = computeTrend(pts, 7);
    expect(trend.direction).toBe('up');
    expect(trend.arrow).toBe('\u2191');
    expect(trend.percentChange).toBe(100);
  });

  it('detects downward trend', () => {
    const pts: AggregatedPoint[] = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, '0')}`,
      value: i < 7 ? 20 : 10,
      count: 1,
    }));
    const trend = computeTrend(pts, 7);
    expect(trend.direction).toBe('down');
    expect(trend.arrow).toBe('\u2193');
  });

  it('reports flat for insufficient data', () => {
    const trend = computeTrend([], 7);
    expect(trend.direction).toBe('flat');
  });
});

describe('buildHeatmap', () => {
  it('produces cells for 52 weeks', () => {
    const cells = buildHeatmap([], 'average', 'monday', 52);
    expect(cells.length).toBe(52 * 7);
  });

  it('assigns levels based on value', () => {
    const points = [point(new Date().toISOString().slice(0, 10), 100)];
    const cells = buildHeatmap(points, 'sum', 'monday', 52);
    const todayCell = cells.find(c => c.date === new Date().toISOString().slice(0, 10));
    expect(todayCell?.level).toBe(4);
  });
});

describe('heatmapColor', () => {
  it('returns border color for level 0', () => {
    const color = heatmapColor(0, 'green');
    expect(color).toContain('background-modifier-border');
  });

  it('returns scheme color for levels 1-4', () => {
    expect(heatmapColor(1, 'green')).toBe('#0e4429');
    expect(heatmapColor(4, 'blue')).toBe('#58a6ff');
  });
});

describe('countListValues', () => {
  it('counts occurrences case-insensitively', () => {
    const points: DataPoint[] = [
      { date: '2026-01-01', value: ['Yoga', 'Running'], numericValue: null, sourcePath: 'a.md' },
      { date: '2026-01-02', value: ['yoga', 'Swimming'], numericValue: null, sourcePath: 'b.md' },
    ];
    const counts = countListValues(points);
    expect(counts.find(c => c.label === 'yoga')?.count).toBe(2);
    expect(counts.find(c => c.label === 'running')?.count).toBe(1);
  });

  it('handles string values', () => {
    const points: DataPoint[] = [
      { date: '2026-01-01', value: 'happy', numericValue: null, sourcePath: 'a.md' },
      { date: '2026-01-02', value: 'happy', numericValue: null, sourcePath: 'b.md' },
    ];
    const counts = countListValues(points);
    expect(counts[0]).toEqual({ label: 'happy', count: 2 });
  });
});

describe('detectScale', () => {
  it('detects min/max with padding', () => {
    const pts: AggregatedPoint[] = [
      { date: '2026-01-01', value: 10, count: 1 },
      { date: '2026-01-02', value: 50, count: 1 },
    ];
    const scale = detectScale(pts);
    expect(scale.min).toBeLessThan(10);
    expect(scale.max).toBeGreaterThan(50);
  });

  it('defaults for empty data', () => {
    const scale = detectScale([]);
    expect(scale.min).toBe(0);
    expect(scale.max).toBe(100);
  });
});
