import { log } from '@/utils/logger';

/**
 * Metrics collector — counters, gauges, histograms, and timers.
 *
 * All metrics are local-only (no external telemetry). Data is held in
 * memory with optional localStorage persistence for cross-session trends.
 *
 * Usage:
 *   metrics.counter('ipc.calls').inc();
 *   metrics.gauge('notes.count').set(42);
 *   metrics.histogram('editor.save.ms').observe(120);
 *   const end = metrics.timer('vault.scan');  // ... await scan(); end();
 */

const STORAGE_KEY = 'bismuth-metrics';
const MAX_HISTOGRAM_SAMPLES = 200;

// ─── Metric types ─────────────────────────────────────────────────────────────

export interface CounterMetric {
  type: 'counter';
  name: string;
  value: number;
  labels?: Record<string, string>;
}

export interface GaugeMetric {
  type: 'gauge';
  name: string;
  value: number;
  labels?: Record<string, string>;
}

export interface HistogramMetric {
  type: 'histogram';
  name: string;
  samples: number[];
  count: number;
  sum: number;
  labels?: Record<string, string>;
}

export type Metric = CounterMetric | GaugeMetric | HistogramMetric;

export interface MetricSnapshot {
  name: string;
  type: Metric['type'];
  value?: number;
  count?: number;
  sum?: number;
  avg?: number;
  min?: number;
  max?: number;
  p50?: number;
  p95?: number;
  p99?: number;
  labels?: Record<string, string>;
}

// ─── Handles ──────────────────────────────────────────────────────────────────

class CounterHandle {
  constructor(
    private metric: CounterMetric,
    private onUpdate: () => void
  ) {}
  inc(amount = 1): void {
    this.metric.value += amount;
    this.onUpdate();
  }
  get(): number {
    return this.metric.value;
  }
  reset(): void {
    this.metric.value = 0;
    this.onUpdate();
  }
}

class GaugeHandle {
  constructor(
    private metric: GaugeMetric,
    private onUpdate: () => void
  ) {}
  set(value: number): void {
    this.metric.value = value;
    this.onUpdate();
  }
  inc(amount = 1): void {
    this.metric.value += amount;
    this.onUpdate();
  }
  dec(amount = 1): void {
    this.metric.value -= amount;
    this.onUpdate();
  }
  get(): number {
    return this.metric.value;
  }
}

class HistogramHandle {
  constructor(
    private metric: HistogramMetric,
    private onUpdate: () => void
  ) {}
  observe(value: number): void {
    this.metric.samples.push(value);
    this.metric.count++;
    this.metric.sum += value;
    if (this.metric.samples.length > MAX_HISTOGRAM_SAMPLES) {
      this.metric.samples = this.metric.samples.slice(-MAX_HISTOGRAM_SAMPLES);
    }
    this.onUpdate();
  }
  getSnapshot(): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } {
    const s = [...this.metric.samples].sort((a, b) => a - b);
    const count = this.metric.count;
    const sum = this.metric.sum;
    if (s.length === 0) return { count: 0, sum: 0, avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
    return {
      count,
      sum,
      avg: Math.round(sum / count),
      min: s[0],
      max: s[s.length - 1],
      p50: s[Math.floor(s.length * 0.5)],
      p95: s[Math.floor(s.length * 0.95)],
      p99: s[Math.floor(s.length * 0.99)],
    };
  }
  reset(): void {
    this.metric.samples = [];
    this.metric.count = 0;
    this.metric.sum = 0;
    this.onUpdate();
  }
}

// ─── Collector ────────────────────────────────────────────────────────────────

class MetricsCollector {
  private counters = new Map<string, CounterMetric>();
  private gauges = new Map<string, GaugeMetric>();
  private histograms = new Map<string, HistogramMetric>();
  private persistTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.loadFromStorage();
  }

  /** Get or create a counter. */
  counter(name: string, labels?: Record<string, string>): CounterHandle {
    const key = this.metricKey(name, labels);
    if (!this.counters.has(key)) {
      this.counters.set(key, { type: 'counter', name, value: 0, labels });
    }
    return new CounterHandle(this.counters.get(key)!, () => this.schedulePersist());
  }

  /** Get or create a gauge. */
  gauge(name: string, labels?: Record<string, string>): GaugeHandle {
    const key = this.metricKey(name, labels);
    if (!this.gauges.has(key)) {
      this.gauges.set(key, { type: 'gauge', name, value: 0, labels });
    }
    return new GaugeHandle(this.gauges.get(key)!, () => this.schedulePersist());
  }

  /** Get or create a histogram. */
  histogram(name: string, labels?: Record<string, string>): HistogramHandle {
    const key = this.metricKey(name, labels);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, { type: 'histogram', name, samples: [], count: 0, sum: 0, labels });
    }
    return new HistogramHandle(this.histograms.get(key)!, () => this.schedulePersist());
  }

  /** Start a timer; returns a stop function that records the duration in ms. */
  timer(name: string, labels?: Record<string, string>): () => number {
    const start = performance.now();
    const hist = this.histogram(name, labels);
    return () => {
      const duration = Math.round(performance.now() - start);
      hist.observe(duration);
      return duration;
    };
  }

  /** Get all metrics as snapshots. */
  getAll(): MetricSnapshot[] {
    const snapshots: MetricSnapshot[] = [];

    for (const m of this.counters.values()) {
      snapshots.push({ name: m.name, type: 'counter', value: m.value, labels: m.labels });
    }

    for (const m of this.gauges.values()) {
      snapshots.push({ name: m.name, type: 'gauge', value: m.value, labels: m.labels });
    }

    for (const [, m] of this.histograms) {
      const h = new HistogramHandle(m, () => {});
      const s = h.getSnapshot();
      snapshots.push({
        name: m.name,
        type: 'histogram',
        labels: m.labels,
        count: s.count,
        sum: s.sum,
        avg: s.avg,
        min: s.min,
        max: s.max,
        p50: s.p50,
        p95: s.p95,
        p99: s.p99,
      });
    }

    return snapshots.sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Reset all metrics. */
  resetAll(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      log.warn('Failed to remove metrics from localStorage', { error: String(e) });
    }
  }

  /** Export metrics as JSON. */
  export(): string {
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        metrics: this.getAll(),
      },
      null,
      2
    );
  }

  // ─── Internal ───────────────────────────────────────────────────────────────

  private metricKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) return name;
    const sorted = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
    return `${name}{${sorted.map(([k, v]) => `${k}="${v}"`).join(',')}}`;
  }

  private schedulePersist(): void {
    if (this.persistTimer) return;
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      this.persistToStorage();
    }, 2000);
  }

  private persistToStorage(): void {
    try {
      const data = {
        counters: Object.fromEntries(this.counters),
        gauges: Object.fromEntries(this.gauges),
        histograms: Object.fromEntries(
          Array.from(this.histograms.entries()).map(([k, v]) => [
            k,
            {
              ...v,
              samples: v.samples.slice(-50),
            },
          ])
        ),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      log.warn('Failed to persist metrics to localStorage', { error: String(e) });
    }
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.counters) {
        for (const [key, val] of Object.entries(data.counters)) {
          this.counters.set(key, val as CounterMetric);
        }
      }
      if (data.gauges) {
        for (const [key, val] of Object.entries(data.gauges)) {
          this.gauges.set(key, val as GaugeMetric);
        }
      }
      if (data.histograms) {
        for (const [key, val] of Object.entries(data.histograms)) {
          this.histograms.set(key, val as HistogramMetric);
        }
      }
    } catch (e) {
      log.warn('Failed to load metrics from localStorage, starting fresh', { error: String(e) });
    }
  }
}

/** Singleton metrics collector. */
export const metrics = new MetricsCollector();
