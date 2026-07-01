import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
  clear: vi.fn(() => { Object.keys(mockStorage).forEach((k) => delete mockStorage[k]); }),
  length: 0,
  key: vi.fn(() => null),
});

vi.stubGlobal('crypto', { randomUUID: () => 'test-session' });

describe('MetricsCollector', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    vi.resetModules();
  });

  async function getMetrics() {
    const mod = await import('../metrics');
    return mod.metrics;
  }

  it('counter increments', async () => {
    const m = await getMetrics();
    m.resetAll();
    m.counter('test.counter').inc();
    m.counter('test.counter').inc(5);
    expect(m.counter('test.counter').get()).toBe(6);
  });

  it('gauge sets value', async () => {
    const m = await getMetrics();
    m.resetAll();
    m.gauge('test.gauge').set(42);
    expect(m.gauge('test.gauge').get()).toBe(42);
  });

  it('gauge increments and decrements', async () => {
    const m = await getMetrics();
    m.resetAll();
    m.gauge('test.gauge2').set(10);
    m.gauge('test.gauge2').inc(5);
    m.gauge('test.gauge2').dec(3);
    expect(m.gauge('test.gauge2').get()).toBe(12);
  });

  it('histogram records samples', async () => {
    const m = await getMetrics();
    m.resetAll();
    const h = m.histogram('test.hist');
    h.observe(10);
    h.observe(20);
    h.observe(30);
    const snap = h.getSnapshot();
    expect(snap.count).toBe(3);
    expect(snap.sum).toBe(60);
    expect(snap.avg).toBe(20);
    expect(snap.min).toBe(10);
    expect(snap.max).toBe(30);
  });

  it('timer records duration', async () => {
    const m = await getMetrics();
    m.resetAll();
    const end = m.timer('test.timer');
    // Small delay to get non-zero duration
    const duration = end();
    expect(duration).toBeGreaterThanOrEqual(0);
    const all = m.getAll();
    const timerMetric = all.find(x => x.name === 'test.timer');
    expect(timerMetric).toBeDefined();
    expect(timerMetric?.type).toBe('histogram');
    expect(timerMetric?.count).toBe(1);
  });

  it('getAll returns all metric types', async () => {
    const m = await getMetrics();
    m.resetAll();
    m.counter('c1').inc();
    m.gauge('g1').set(5);
    m.histogram('h1').observe(100);
    const all = m.getAll();
    expect(all.length).toBe(3);
    expect(all.map(x => x.name).sort()).toEqual(['c1', 'g1', 'h1']);
  });

  it('resetAll clears everything', async () => {
    const m = await getMetrics();
    m.counter('a').inc();
    m.gauge('b').set(1);
    m.resetAll();
    expect(m.getAll().length).toBe(0);
  });

  it('export produces valid JSON', async () => {
    const m = await getMetrics();
    m.resetAll();
    m.counter('export.test').inc();
    const json = m.export();
    const parsed = JSON.parse(json);
    expect(parsed.timestamp).toBeDefined();
    expect(parsed.metrics).toBeInstanceOf(Array);
    expect(parsed.metrics.length).toBe(1);
  });

  it('labels create separate metrics', async () => {
    const m = await getMetrics();
    m.resetAll();
    m.counter('http.requests', { method: 'GET' }).inc();
    m.counter('http.requests', { method: 'POST' }).inc(3);
    expect(m.counter('http.requests', { method: 'GET' }).get()).toBe(1);
    expect(m.counter('http.requests', { method: 'POST' }).get()).toBe(3);
  });
});

describe('health checks', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    vi.resetModules();
  });

  it('getUptime returns positive number', async () => {
    const { getUptime } = await import('../health');
    expect(getUptime()).toBeGreaterThanOrEqual(0);
  });
});
