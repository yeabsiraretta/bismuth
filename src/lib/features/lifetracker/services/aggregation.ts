/**
 * Aggregation service — heatmap cells, time-series aggregation,
 * trend calculation, moving averages, list value counting.
 */
import type {
  DataPoint, AggregatedPoint, HeatmapCell, TrendInfo,
  AggregationMethod, TimeGranularity, ColorScheme, FirstDayOfWeek,
} from '../types';
import { COLOR_SCHEMES } from '../types';

// ─── Numeric aggregation ─────────────────────────────────────────────────────

function aggregate(values: number[], method: AggregationMethod): number {
  if (values.length === 0) return 0;
  switch (method) {
    case 'sum': return values.reduce((a, b) => a + b, 0);
    case 'average': return values.reduce((a, b) => a + b, 0) / values.length;
    case 'count': return values.length;
    case 'min': return Math.min(...values);
    case 'max': return Math.max(...values);
    case 'latest': return values[values.length - 1];
  }
}

// ─── Time bucket keys ────────────────────────────────────────────────────────

function bucketKey(date: string, granularity: TimeGranularity): string {
  const d = new Date(date);
  switch (granularity) {
    case 'daily': return date;
    case 'weekly': {
      const day = d.getDay();
      const diff = day === 0 ? 6 : day - 1;
      d.setDate(d.getDate() - diff);
      return d.toISOString().slice(0, 10);
    }
    case 'monthly': return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    case 'quarterly': return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
    case 'yearly': return `${d.getFullYear()}`;
  }
}

// ─── Time-series aggregation ─────────────────────────────────────────────────

export function aggregateTimeSeries(
  points: DataPoint[],
  granularity: TimeGranularity,
  method: AggregationMethod,
): AggregatedPoint[] {
  const buckets = new Map<string, number[]>();

  for (const p of points) {
    if (p.numericValue === null) continue;
    const key = bucketKey(p.date, granularity);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(p.numericValue);
  }

  return Array.from(buckets.entries())
    .map(([date, values]) => ({
      date,
      value: aggregate(values, method),
      count: values.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Moving average ──────────────────────────────────────────────────────────

export function movingAverage(points: AggregatedPoint[], window: number): AggregatedPoint[] {
  if (window <= 1 || points.length < window) return points;
  const result: AggregatedPoint[] = [];
  for (let i = window - 1; i < points.length; i++) {
    const slice = points.slice(i - window + 1, i + 1);
    const avg = slice.reduce((s, p) => s + p.value, 0) / window;
    result.push({ date: points[i].date, value: Math.round(avg * 100) / 100, count: window });
  }
  return result;
}

// ─── Trend calculation ───────────────────────────────────────────────────────

export function computeTrend(points: AggregatedPoint[], periodSize = 7): TrendInfo {
  if (points.length < periodSize * 2) return { direction: 'flat', percentChange: 0, arrow: '\u2192' };

  const recent = points.slice(-periodSize);
  const previous = points.slice(-periodSize * 2, -periodSize);

  const recentAvg = recent.reduce((s, p) => s + p.value, 0) / recent.length;
  const prevAvg = previous.reduce((s, p) => s + p.value, 0) / previous.length;

  if (prevAvg === 0) return { direction: recentAvg > 0 ? 'up' : 'flat', percentChange: 0, arrow: recentAvg > 0 ? '\u2191' : '\u2192' };

  const pct = ((recentAvg - prevAvg) / Math.abs(prevAvg)) * 100;
  const rounded = Math.round(pct * 10) / 10;

  if (Math.abs(rounded) < 1) return { direction: 'flat', percentChange: 0, arrow: '\u2192' };
  return {
    direction: rounded > 0 ? 'up' : 'down',
    percentChange: Math.abs(rounded),
    arrow: rounded > 0 ? '\u2191' : '\u2193',
  };
}

// ─── Heatmap cells ───────────────────────────────────────────────────────────

export function buildHeatmap(
  points: DataPoint[],
  method: AggregationMethod,
  firstDay: FirstDayOfWeek,
  weeks = 52,
): HeatmapCell[] {
  const aggregated = aggregateTimeSeries(points, 'daily', method);
  const values = aggregated.map(p => p.value);
  const maxVal = values.length > 0 ? Math.max(...values) : 1;

  const byDate = new Map(aggregated.map(p => [p.date, p.value]));

  const today = new Date();
  const cells: HeatmapCell[] = [];
  const totalDays = weeks * 7;

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const raw = d.getDay();
    const dayOfWeek = firstDay === 'monday' ? (raw === 0 ? 6 : raw - 1) : raw;
    const weekIndex = Math.floor((totalDays - 1 - i) / 7);
    const value = byDate.get(dateStr) ?? 0;
    const ratio = maxVal > 0 ? value / maxVal : 0;
    const level: HeatmapCell['level'] = value === 0 ? 0 : ratio < 0.25 ? 1 : ratio < 0.5 ? 2 : ratio < 0.75 ? 3 : 4;

    cells.push({ date: dateStr, value, level, dayOfWeek, weekIndex });
  }
  return cells;
}

export function heatmapColor(level: HeatmapCell['level'], scheme: ColorScheme): string {
  if (level === 0) return 'var(--background-modifier-border, #30363d)';
  return COLOR_SCHEMES[scheme].levels[level - 1];
}

// ─── List/tag value counting ─────────────────────────────────────────────────

export function countListValues(points: DataPoint[]): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of points) {
    const values = Array.isArray(p.value) ? p.value : typeof p.value === 'string' ? [p.value] : [];
    for (const v of values) {
      const key = String(v).toLowerCase().trim();
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

// ─── Scale helpers ───────────────────────────────────────────────────────────

export function detectScale(points: AggregatedPoint[]): { min: number; max: number } {
  if (points.length === 0) return { min: 0, max: 100 };
  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.1 || 1;
  return { min: Math.floor(min - padding), max: Math.ceil(max + padding) };
}

// ─── Chart data formatting ───────────────────────────────────────────────────

export function formatDateLabel(date: string, granularity: TimeGranularity): string {
  const d = new Date(date);
  switch (granularity) {
    case 'daily': return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'weekly': return `W${Math.ceil(d.getDate() / 7)}`;
    case 'monthly': return d.toLocaleDateString('en-US', { month: 'short' });
    case 'quarterly': return `Q${Math.floor(d.getMonth() / 3) + 1}`;
    case 'yearly': return `${d.getFullYear()}`;
  }
}
