/**
 * Metrics collector — counters, gauges, histograms, and timers.
 *
 * All metrics are local-only (no external telemetry). Data is held
 * in-memory only — no localStorage persistence (Rust backend owns
 * persistent logging via tauri-plugin-log).
 *
 * Usage:
 *   metrics.counter('ipc.calls').inc();
 *   metrics.gauge('notes.count').set(42);
 *   metrics.histogram('editor.save.ms').observe(120);
 *   const end = metrics.timer('vault.scan');  await scan(); end();
 */

const MAX_HISTOGRAM_SAMPLES = 200;

export interface MetricSnapshot {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
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

interface CounterMetric {
  type: 'counter';
  name: string;
  value: number;
  labels?: Record<string, string>;
}

interface GaugeMetric {
  type: 'gauge';
  name: string;
  value: number;
  labels?: Record<string, string>;
}

interface HistogramMetric {
  type: 'histogram';
  name: string;
  samples: number[];
  count: number;
  sum: number;
  labels?: Record<string, string>;
}

class CounterHandle {
  constructor(private metric: CounterMetric) {}
  inc(amount = 1): void {
    this.metric.value += amount;
  }
  get(): number {
    return this.metric.value;
  }
  reset(): void {
    this.metric.value = 0;
  }
}

class GaugeHandle {
  constructor(private metric: GaugeMetric) {}
  set(value: number): void {
    this.metric.value = value;
  }
  inc(amount = 1): void {
    this.metric.value += amount;
  }
  dec(amount = 1): void {
    this.metric.value -= amount;
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
  } {
    const s = [...this.metric.samples].sort((a, b) => a - b);
    const { count, sum } = this.metric;
    if (s.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
    }
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
  }
}

class MetricsCollector {
  private counters = new Map<string, CounterMetric>();
  private gauges = new Map<string, GaugeMetric>();
  private histograms = new Map<string, HistogramMetric>();

  counter(name: string, labels?: Record<string, string>): CounterHandle {
    const key = this.key(name, labels);
    if (!this.counters.has(key)) {
      this.counters.set(key, { type: 'counter', name, value: 0, labels });
    }
    return new CounterHandle(this.counters.get(key)!);
  }

  gauge(name: string, labels?: Record<string, string>): GaugeHandle {
    const key = this.key(name, labels);
    if (!this.gauges.has(key)) {
      this.gauges.set(key, { type: 'gauge', name, value: 0, labels });
    }
    return new GaugeHandle(this.gauges.get(key)!);
  }

  histogram(name: string, labels?: Record<string, string>): HistogramHandle {
    const key = this.key(name, labels);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, {
        type: 'histogram',
        name,
        samples: [],
        count: 0,
        sum: 0,
        labels,
      });
    }
    return new HistogramHandle(this.histograms.get(key)!);
  }

  timer(name: string, labels?: Record<string, string>): () => number {
    const start = performance.now();
    const hist = this.histogram(name, labels);
    return () => {
      const ms = Math.round(performance.now() - start);
      hist.observe(ms);
      return ms;
    };
  }

  getAll(): MetricSnapshot[] {
    const out: MetricSnapshot[] = [];

    for (const m of this.counters.values()) {
      out.push({ name: m.name, type: 'counter', value: m.value, labels: m.labels });
    }
    for (const m of this.gauges.values()) {
      out.push({ name: m.name, type: 'gauge', value: m.value, labels: m.labels });
    }
    for (const m of this.histograms.values()) {
      const h = new HistogramHandle(m);
      const s = h.snapshot();
      out.push({
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

    return out.sort((a, b) => a.name.localeCompare(b.name));
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  export(): string {
    return JSON.stringify({ timestamp: new Date().toISOString(), metrics: this.getAll() }, null, 2);
  }

  private key(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) return name;
    const sorted = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
    return `${name}{${sorted.map(([k, v]) => `${k}="${v}"`).join(',')}}`;
  }
}

export const metrics = new MetricsCollector();
