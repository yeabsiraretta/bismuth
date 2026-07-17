/**
 * Metrics collector — counters, gauges, histograms, and timers.
 *
 * All metrics are local-only (no external telemetry). Data is held
 * in-memory only — no localStorage persistence (Rust backend owns
 * persistent logging via tauri-plugin-log).
 */

const MAX_HISTOGRAM_SAMPLES = 200;

type MetricType = 'counter' | 'gauge' | 'histogram';

interface BaseMetric {
  type: MetricType;
  name: string;
  labels?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  updates: number;
}

interface CounterMetric extends BaseMetric {
  type: 'counter';
  value: number;
}

interface GaugeMetric extends BaseMetric {
  type: 'gauge';
  value: number;
}

interface HistogramMetric extends BaseMetric {
  type: 'histogram';
  samples: number[];
  count: number;
  sum: number;
  lastValue?: number;
}

export interface MetricSnapshot {
  name: string;
  type: MetricType;
  value?: number;
  count?: number;
  sum?: number;
  avg?: number;
  min?: number;
  max?: number;
  p50?: number;
  p95?: number;
  p99?: number;
  lastValue?: number;
  samplesStored?: number;
  labels?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  ageMs: number;
  updates: number;
}

export interface MetricSummary {
  totalMetrics: number;
  counters: number;
  gauges: number;
  histograms: number;
  totalUpdates: number;
  staleMetrics: number;
  lastUpdatedAt: string | null;
}

function timestamp(): string {
  return new Date().toISOString();
}

function metricAge(updatedAt: string): number {
  const parsed = Date.parse(updatedAt);
  return Number.isNaN(parsed) ? 0 : Math.max(0, Date.now() - parsed);
}

function createBaseMetric(
  name: string,
  labels?: Record<string, string>
): Omit<BaseMetric, 'type'> & { labels?: Record<string, string> } {
  const now = timestamp();
  return {
    name,
    labels,
    createdAt: now,
    updatedAt: now,
    updates: 0,
  };
}

function percentile(samples: number[], ratio: number): number {
  if (samples.length === 0) return 0;
  if (samples.length === 1) return samples[0];

  const clampedRatio = Math.min(Math.max(ratio, 0), 1);
  const position = (samples.length - 1) * clampedRatio;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const lowerValue = samples[lowerIndex];
  const upperValue = samples[upperIndex];

  if (lowerIndex === upperIndex || lowerValue === upperValue) {
    return lowerValue;
  }

  const weight = position - lowerIndex;
  return Math.round((lowerValue + (upperValue - lowerValue) * weight) * 1000) / 1000;
}

class CounterHandle {
  constructor(private metric: CounterMetric) {}

  inc(amount = 1): void {
    this.metric.value += amount;
    this.metric.updates++;
    this.metric.updatedAt = timestamp();
  }

  get(): number {
    return this.metric.value;
  }

  reset(): void {
    this.metric.value = 0;
    this.metric.updatedAt = timestamp();
  }
}

class GaugeHandle {
  constructor(private metric: GaugeMetric) {}

  set(value: number): void {
    this.metric.value = value;
    this.metric.updates++;
    this.metric.updatedAt = timestamp();
  }

  inc(amount = 1): void {
    this.set(this.metric.value + amount);
  }

  dec(amount = 1): void {
    this.set(this.metric.value - amount);
  }

  get(): number {
    return this.metric.value;
  }
}

class HistogramHandle {
  constructor(private metric: HistogramMetric) {}

  observe(value: number): void {
    this.metric.samples.push(value);
    this.metric.count++;
    this.metric.sum += value;
    this.metric.lastValue = value;
    this.metric.updates++;
    this.metric.updatedAt = timestamp();

    if (this.metric.samples.length > MAX_HISTOGRAM_SAMPLES) {
      this.metric.samples = this.metric.samples.slice(-MAX_HISTOGRAM_SAMPLES);
    }
  }

  snapshot(): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
    lastValue?: number;
    samplesStored: number;
  } {
    const samples = [...this.metric.samples].sort((a, b) => a - b);
    const { count, sum } = this.metric;
    if (samples.length === 0) {
      return {
        count: 0,
        sum: 0,
        avg: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        lastValue: this.metric.lastValue,
        samplesStored: 0,
      };
    }

    return {
      count,
      sum,
      avg: Math.round(sum / count),
      min: samples[0],
      max: samples[samples.length - 1],
      p50: percentile(samples, 0.5),
      p95: percentile(samples, 0.95),
      p99: percentile(samples, 0.99),
      lastValue: this.metric.lastValue,
      samplesStored: samples.length,
    };
  }

  reset(): void {
    this.metric.samples = [];
    this.metric.count = 0;
    this.metric.sum = 0;
    this.metric.lastValue = undefined;
    this.metric.updatedAt = timestamp();
  }
}

class MetricsCollector {
  private counters = new Map<string, CounterMetric>();
  private gauges = new Map<string, GaugeMetric>();
  private histograms = new Map<string, HistogramMetric>();

  counter(name: string, labels?: Record<string, string>): CounterHandle {
    const key = this.key(name, labels);
    if (!this.counters.has(key)) {
      this.counters.set(key, {
        type: 'counter',
        value: 0,
        ...createBaseMetric(name, labels),
      });
    }
    return new CounterHandle(this.counters.get(key)!);
  }

  gauge(name: string, labels?: Record<string, string>): GaugeHandle {
    const key = this.key(name, labels);
    if (!this.gauges.has(key)) {
      this.gauges.set(key, {
        type: 'gauge',
        value: 0,
        ...createBaseMetric(name, labels),
      });
    }
    return new GaugeHandle(this.gauges.get(key)!);
  }

  histogram(name: string, labels?: Record<string, string>): HistogramHandle {
    const key = this.key(name, labels);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, {
        type: 'histogram',
        samples: [],
        count: 0,
        sum: 0,
        ...createBaseMetric(name, labels),
      });
    }
    return new HistogramHandle(this.histograms.get(key)!);
  }

  timer(name: string, labels?: Record<string, string>): () => number {
    const start = performance.now();
    const histogram = this.histogram(name, labels);
    return () => {
      const ms = Math.round(performance.now() - start);
      histogram.observe(ms);
      return ms;
    };
  }

  getAll(): MetricSnapshot[] {
    const snapshots: MetricSnapshot[] = [];

    for (const metric of this.counters.values()) {
      snapshots.push({
        name: metric.name,
        type: metric.type,
        value: metric.value,
        labels: metric.labels,
        createdAt: metric.createdAt,
        updatedAt: metric.updatedAt,
        ageMs: metricAge(metric.updatedAt),
        updates: metric.updates,
      });
    }

    for (const metric of this.gauges.values()) {
      snapshots.push({
        name: metric.name,
        type: metric.type,
        value: metric.value,
        labels: metric.labels,
        createdAt: metric.createdAt,
        updatedAt: metric.updatedAt,
        ageMs: metricAge(metric.updatedAt),
        updates: metric.updates,
      });
    }

    for (const metric of this.histograms.values()) {
      const snapshot = new HistogramHandle(metric).snapshot();
      snapshots.push({
        name: metric.name,
        type: metric.type,
        count: snapshot.count,
        sum: snapshot.sum,
        avg: snapshot.avg,
        min: snapshot.min,
        max: snapshot.max,
        p50: snapshot.p50,
        p95: snapshot.p95,
        p99: snapshot.p99,
        lastValue: snapshot.lastValue,
        samplesStored: snapshot.samplesStored,
        labels: metric.labels,
        createdAt: metric.createdAt,
        updatedAt: metric.updatedAt,
        ageMs: metricAge(metric.updatedAt),
        updates: metric.updates,
      });
    }

    return snapshots.sort((a, b) => a.name.localeCompare(b.name));
  }

  getSummary(staleAfterMs = 5 * 60_000): MetricSummary {
    const all = this.getAll();
    const latest = all
      .map((metric) => metric.updatedAt)
      .sort((a, b) => Date.parse(b) - Date.parse(a))[0];

    return {
      totalMetrics: all.length,
      counters: all.filter((metric) => metric.type === 'counter').length,
      gauges: all.filter((metric) => metric.type === 'gauge').length,
      histograms: all.filter((metric) => metric.type === 'histogram').length,
      totalUpdates: all.reduce((sum, metric) => sum + metric.updates, 0),
      staleMetrics: all.filter((metric) => metric.ageMs > staleAfterMs).length,
      lastUpdatedAt: latest ?? null,
    };
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  export(): string {
    return JSON.stringify(
      {
        timestamp: timestamp(),
        summary: this.getSummary(),
        metrics: this.getAll(),
      },
      null,
      2
    );
  }

  private key(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) return name;
    const sorted = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
    return `${name}{${sorted.map(([k, v]) => `${k}="${v}"`).join(',')}}`;
  }
}

export const metrics = new MetricsCollector();
