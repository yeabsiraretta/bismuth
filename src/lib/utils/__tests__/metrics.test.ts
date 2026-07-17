import { beforeEach, describe, expect, it } from 'vitest';

import { metrics } from '@/utils/log/metrics';

describe('metrics collector', () => {
  beforeEach(() => {
    metrics.reset();
  });

  it('tracks counters, gauges, and histograms with summary metadata', () => {
    metrics.counter('ipc.calls', { target: 'desktop' }).inc();
    metrics.gauge('vault.notes').set(42);
    metrics.histogram('vault.scan.ms').observe(120);
    metrics.histogram('vault.scan.ms').observe(240);

    const snapshots = metrics.getAll();
    const summary = metrics.getSummary();

    const counter = snapshots.find((metric) => metric.name === 'ipc.calls');
    const gauge = snapshots.find((metric) => metric.name === 'vault.notes');
    const histogram = snapshots.find((metric) => metric.name === 'vault.scan.ms');

    expect(counter).toMatchObject({
      type: 'counter',
      value: 1,
      labels: { target: 'desktop' },
    });
    expect(gauge).toMatchObject({
      type: 'gauge',
      value: 42,
    });
    expect(histogram).toMatchObject({
      type: 'histogram',
      count: 2,
      min: 120,
      max: 240,
      p50: 180,
      p95: 234,
    });

    expect(summary.totalMetrics).toBe(3);
    expect(summary.counters).toBe(1);
    expect(summary.gauges).toBe(1);
    expect(summary.histograms).toBe(1);
    expect(summary.totalUpdates).toBeGreaterThanOrEqual(4);
    expect(summary.lastUpdatedAt).toBeTruthy();
  });

  it('exports summary and metric snapshots', () => {
    metrics.counter('health.checks.total').inc();

    const exported = JSON.parse(metrics.export()) as {
      summary: { totalMetrics: number };
      metrics: Array<{ name: string }>;
    };

    expect(exported.summary.totalMetrics).toBe(1);
    expect(exported.metrics).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'health.checks.total' })])
    );
  });

  it('interpolates percentiles across the retained sample window', () => {
    metrics.histogram('editor.save.ms').observe(10);
    metrics.histogram('editor.save.ms').observe(20);
    metrics.histogram('editor.save.ms').observe(40);
    metrics.histogram('editor.save.ms').observe(80);

    const histogram = metrics.getAll().find((metric) => metric.name === 'editor.save.ms');

    expect(histogram).toMatchObject({
      type: 'histogram',
      p50: 30,
      p95: 74,
      p99: 78.8,
    });
  });
});
