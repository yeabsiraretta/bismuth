/**
 * Performance observer — tracks Web Vitals, long tasks, paint timing, navigation,
 * and resource behavior. Feeds data into the metrics collector for unified dashboarding.
 */

import { log } from '@/utils/log/logger';

import { metrics, type MetricSnapshot } from './metrics';

type ObserverKind = 'longtask' | 'paint' | 'layout-shift' | 'largest-contentful-paint' | 'resource';

export interface PerformanceObserverStatus {
  running: boolean;
  activeObservers: number;
  supportedObservers: ObserverKind[];
  unsupportedObservers: ObserverKind[];
  observedEntries: number;
  lastStartedAt: string | null;
  lastStoppedAt: string | null;
}

let observers: PerformanceObserver[] = [];
let isRunning = false;
let observedEntries = 0;
let lastStartedAt: string | null = null;
let lastStoppedAt: string | null = null;
let navigationTimingCleanup: (() => void) | null = null;
const supportedKinds = new Set<ObserverKind>();
const unsupportedKinds = new Set<ObserverKind>();

function markObserved(kind: ObserverKind): void {
  supportedKinds.add(kind);
  unsupportedKinds.delete(kind);
}

function markUnsupported(kind: ObserverKind): void {
  unsupportedKinds.add(kind);
  supportedKinds.delete(kind);
}

function isSupported(kind: ObserverKind): boolean {
  if (typeof PerformanceObserver === 'undefined') return false;
  const supported = PerformanceObserver.supportedEntryTypes;
  return Array.isArray(supported) && supported.includes(kind);
}

function addObserver(kind: ObserverKind, observer: PerformanceObserver): void {
  markObserved(kind);
  observers.push(observer);
  metrics.gauge('perf.observers.active').set(observers.length);
}

function findMetricValue(metricsSnapshot: MetricSnapshot[], name: string): number | null {
  const metric = metricsSnapshot.find((entry) => entry.name === name);
  if (!metric) return null;
  if (typeof metric.value === 'number') return metric.value;
  if (typeof metric.lastValue === 'number') return metric.lastValue;
  if (typeof metric.avg === 'number') return metric.avg;
  return null;
}

export function startPerformanceObservers(): void {
  if (isRunning) return;

  isRunning = true;
  lastStartedAt = new Date().toISOString();
  metrics.counter('perf.observers.start.total').inc();

  try {
    observeLongTasks();
  } catch (error) {
    markUnsupported('longtask');
    log.debug('LongTask observer not supported', { error: String(error) });
  }

  try {
    observePaintTiming();
  } catch (error) {
    markUnsupported('paint');
    log.debug('Paint timing observer not supported', { error: String(error) });
  }

  try {
    observeLayoutShift();
  } catch (error) {
    markUnsupported('layout-shift');
    log.debug('Layout shift observer not supported', { error: String(error) });
  }

  try {
    observeLargestContentfulPaint();
  } catch (error) {
    markUnsupported('largest-contentful-paint');
    log.debug('Largest contentful paint observer not supported', { error: String(error) });
  }

  try {
    observeResourceTiming();
  } catch (error) {
    markUnsupported('resource');
    log.debug('Resource timing observer not supported', { error: String(error) });
  }

  try {
    observeNavigationTiming();
  } catch (error) {
    log.debug('Navigation timing observer not supported', { error: String(error) });
  }

  metrics.gauge('perf.observers.running').set(1);
  metrics.gauge('perf.observers.active').set(observers.length);
  metrics.gauge('perf.observers.supported').set(supportedKinds.size);
  metrics.gauge('perf.observers.unsupported').set(unsupportedKinds.size);

  log.info('Performance observers started', { count: observers.length });
}

export function stopPerformanceObservers(): void {
  for (const observer of observers) {
    try {
      observer.disconnect();
    } catch (error) {
      log.debug('Failed to disconnect performance observer', { error: String(error) });
    }
  }

  observers = [];
  isRunning = false;
  lastStoppedAt = new Date().toISOString();
  navigationTimingCleanup?.();
  navigationTimingCleanup = null;

  metrics.counter('perf.observers.stop.total').inc();
  metrics.gauge('perf.observers.running').set(0);
  metrics.gauge('perf.observers.active').set(0);
}

export function getPerformanceObserverStatus(): PerformanceObserverStatus {
  return {
    running: isRunning,
    activeObservers: observers.length,
    supportedObservers: [...supportedKinds].sort(),
    unsupportedObservers: [...unsupportedKinds].sort(),
    observedEntries,
    lastStartedAt,
    lastStoppedAt,
  };
}

export function getWebVitals(): Record<string, number | null> {
  const snapshot = metrics.getAll();
  return {
    fcp: findMetricValue(snapshot, 'perf.fcp_ms'),
    lcp: findMetricValue(snapshot, 'perf.lcp_ms'),
    cls: findMetricValue(snapshot, 'perf.cls'),
    ttfb: findMetricValue(snapshot, 'perf.ttfb_ms'),
    domInteractive: findMetricValue(snapshot, 'perf.dom_interactive_ms'),
    domComplete: findMetricValue(snapshot, 'perf.dom_complete_ms'),
    loadMs: findMetricValue(snapshot, 'perf.load_ms'),
    longTaskCount: findMetricValue(snapshot, 'perf.longtask.count'),
    longTaskTotalMs: findMetricValue(snapshot, 'perf.longtask.total_ms'),
    fetchCount: findMetricValue(snapshot, 'perf.fetch.count'),
    slowResourceCount: findMetricValue(snapshot, 'perf.resource.slow.count'),
    resourceTransferKb: findMetricValue(snapshot, 'perf.resource.transfer_kb'),
  };
}

function observeLongTasks(): void {
  if (!isSupported('longtask')) {
    markUnsupported('longtask');
    return;
  }

  let totalDuration = 0;
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const durationMs = Math.round(entry.duration);
      observedEntries++;
      totalDuration += durationMs;

      metrics.counter('perf.longtask.count').inc();
      metrics.gauge('perf.longtask.total_ms').set(totalDuration);
      metrics.histogram('perf.longtask.duration_ms').observe(durationMs);

      if (durationMs > 100) {
        log.warn('Long task detected', { durationMs, startTime: Math.round(entry.startTime) });
      }
    }
  });

  observer.observe({ type: 'longtask', buffered: true });
  addObserver('longtask', observer);
}

function observePaintTiming(): void {
  if (!isSupported('paint')) {
    markUnsupported('paint');
    return;
  }

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      observedEntries++;
      const ms = Math.round(entry.startTime);
      if (entry.name === 'first-contentful-paint') {
        metrics.gauge('perf.fcp_ms').set(ms);
        log.info('FCP recorded', { ms });
      }
    }
  });

  observer.observe({ type: 'paint', buffered: true });
  addObserver('paint', observer);
}

function observeLayoutShift(): void {
  if (!isSupported('layout-shift')) {
    markUnsupported('layout-shift');
    return;
  }

  let clsValue = 0;
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      observedEntries++;
      const layoutShiftEntry = entry as PerformanceEntry & {
        hadRecentInput?: boolean;
        value?: number;
      };

      if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value) {
        clsValue += layoutShiftEntry.value;
        metrics.gauge('perf.cls').set(Math.round(clsValue * 1000) / 1000);
      }
    }
  });

  observer.observe({ type: 'layout-shift', buffered: true });
  addObserver('layout-shift', observer);
}

function observeLargestContentfulPaint(): void {
  if (!isSupported('largest-contentful-paint')) {
    markUnsupported('largest-contentful-paint');
    return;
  }

  let latestLcp = 0;
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      observedEntries++;
      latestLcp = Math.max(latestLcp, Math.round(entry.startTime));
      metrics.gauge('perf.lcp_ms').set(latestLcp);
    }
  });

  observer.observe({ type: 'largest-contentful-paint', buffered: true });
  addObserver('largest-contentful-paint', observer);
}

function observeResourceTiming(): void {
  if (!isSupported('resource')) {
    markUnsupported('resource');
    return;
  }

  let slowResources = 0;
  let transferKb = 0;
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      observedEntries++;
      const resourceEntry = entry as PerformanceResourceTiming;
      const durationMs = Math.round(resourceEntry.duration);
      const initiatorType = resourceEntry.initiatorType || 'unknown';
      const transferSizeKb = Math.round((resourceEntry.transferSize || 0) / 1024);

      metrics.histogram('perf.resource.duration_ms', { initiatorType }).observe(durationMs);
      metrics.counter('perf.resource.count', { initiatorType }).inc();

      if (resourceEntry.initiatorType === 'fetch' || resourceEntry.initiatorType === 'xmlhttprequest') {
        metrics.histogram('perf.fetch.duration_ms').observe(durationMs);
        metrics.counter('perf.fetch.count').inc();
      }

      transferKb += transferSizeKb;
      metrics.gauge('perf.resource.transfer_kb').set(transferKb);

      if (durationMs >= 1000) {
        slowResources++;
        metrics.gauge('perf.resource.slow.count').set(slowResources);
      }
    }
  });

  observer.observe({ type: 'resource', buffered: true });
  addObserver('resource', observer);
}

function recordNavigationTiming(): boolean {
  if (typeof performance === 'undefined') return false;

  const navigationEntry = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;

  if (!navigationEntry) return false;

  metrics.gauge('perf.ttfb_ms').set(
    Math.round(navigationEntry.responseStart - navigationEntry.requestStart)
  );
  metrics.gauge('perf.dom_interactive_ms').set(Math.round(navigationEntry.domInteractive));
  metrics.gauge('perf.dom_complete_ms').set(Math.round(navigationEntry.domComplete));
  metrics.gauge('perf.load_ms').set(Math.round(navigationEntry.loadEventEnd));
  metrics.gauge('perf.response_ms').set(
    Math.round(navigationEntry.responseEnd - navigationEntry.requestStart)
  );
  metrics.counter('perf.navigation.samples.total').inc();
  return true;
}

function observeNavigationTiming(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  navigationTimingCleanup?.();
  navigationTimingCleanup = null;

  const needsFinalSample = document.readyState !== 'complete';
  const sampled = recordNavigationTiming();

  if (!needsFinalSample && sampled) {
    return;
  }

  const onLoad = () => {
    recordNavigationTiming();
    navigationTimingCleanup = null;
  };

  navigationTimingCleanup = () => {
    window.removeEventListener('load', onLoad);
  };

  window.addEventListener('load', onLoad, { once: true });
}
