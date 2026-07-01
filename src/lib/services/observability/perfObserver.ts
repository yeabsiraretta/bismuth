/**
 * Performance observer — tracks Web Vitals, long tasks, and paint timing.
 * Feeds data into the metrics collector for unified dashboarding.
 */

import { metrics } from './metrics';
import { log } from '@/utils/logger';

let observers: PerformanceObserver[] = [];
let isRunning = false;

/** Start all performance observers. Safe to call multiple times. */
export function startPerformanceObservers(): void {
  if (isRunning) return;
  isRunning = true;

  try {
    observeLongTasks();
  } catch (e) {
    log.debug('LongTask observer not supported', { error: String(e) });
  }
  try {
    observePaintTiming();
  } catch (e) {
    log.debug('Paint timing observer not supported', { error: String(e) });
  }
  try {
    observeLayoutShift();
  } catch (e) {
    log.debug('Layout shift observer not supported', { error: String(e) });
  }
  try {
    observeResourceTiming();
  } catch (e) {
    log.debug('Resource timing observer not supported', { error: String(e) });
  }
  try {
    observeNavigationTiming();
  } catch (e) {
    log.debug('Navigation timing observer not supported', { error: String(e) });
  }

  log.info('Performance observers started', { count: observers.length });
}

/** Stop all performance observers. */
export function stopPerformanceObservers(): void {
  for (const obs of observers) {
    try {
      obs.disconnect();
    } catch (e) {
      log.debug('Failed to disconnect performance observer', { error: String(e) });
    }
  }
  observers = [];
  isRunning = false;
}

/** Get a snapshot of collected Web Vitals. */
export function getWebVitals(): Record<string, number | null> {
  const snap = metrics.getAll();
  const get = (name: string) => snap.find((m) => m.name === name)?.value ?? null;
  return {
    fcp: get('perf.fcp_ms'),
    lcp: get('perf.lcp_ms'),
    cls: get('perf.cls'),
    longTaskCount: get('perf.longtask.count'),
    longTaskTotalMs: get('perf.longtask.total_ms'),
  };
}

// ─── Observer implementations ─────────────────────────────────────────────────

function observeLongTasks() {
  const obs = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const durationMs = Math.round(entry.duration);
      metrics.counter('perf.longtask.count').inc();
      metrics.gauge('perf.longtask.total_ms').inc(durationMs);
      metrics.histogram('perf.longtask.duration_ms').observe(durationMs);
      if (durationMs > 100) {
        log.warn('Long task detected', { durationMs, startTime: Math.round(entry.startTime) });
      }
    }
  });
  obs.observe({ type: 'longtask', buffered: true });
  observers.push(obs);
}

function observePaintTiming() {
  const obs = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const ms = Math.round(entry.startTime);
      if (entry.name === 'first-contentful-paint') {
        metrics.gauge('perf.fcp_ms').set(ms);
        log.info('FCP recorded', { ms });
      }
    }
  });
  obs.observe({ type: 'paint', buffered: true });
  observers.push(obs);
}

function observeLayoutShift() {
  let clsValue = 0;
  const obs = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const lsEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
      if (!lsEntry.hadRecentInput && lsEntry.value) {
        clsValue += lsEntry.value;
        metrics.gauge('perf.cls').set(Math.round(clsValue * 1000) / 1000);
      }
    }
  });
  obs.observe({ type: 'layout-shift', buffered: true });
  observers.push(obs);
}

function observeResourceTiming() {
  const obs = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const resEntry = entry as PerformanceResourceTiming;
      if (resEntry.initiatorType === 'fetch' || resEntry.initiatorType === 'xmlhttprequest') {
        metrics.histogram('perf.fetch.duration_ms').observe(Math.round(resEntry.duration));
        metrics.counter('perf.fetch.count').inc();
      }
    }
  });
  obs.observe({ type: 'resource', buffered: false });
  observers.push(obs);
}

function observeNavigationTiming() {
  const nav = performance.getEntriesByType('navigation')[0] as
    PerformanceNavigationTiming | undefined;
  if (nav) {
    metrics.gauge('perf.ttfb_ms').set(Math.round(nav.responseStart - nav.requestStart));
    metrics.gauge('perf.dom_interactive_ms').set(Math.round(nav.domInteractive));
    metrics.gauge('perf.dom_complete_ms').set(Math.round(nav.domComplete));
    metrics.gauge('perf.load_ms').set(Math.round(nav.loadEventEnd));
  }
}
