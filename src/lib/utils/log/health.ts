/**
 * Health check service — monitors system resource usage, IPC responsiveness,
 * observability runtime state, and application environment. All checks are local-only.
 */

import { isTauriAvailable } from '@/utils/platform';

import { metrics } from './metrics';
import { getPerformanceObserverStatus } from './perf-observer';
import { getRuntimeErrors } from './runtime-errors';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  message: string;
  durationMs: number;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface SystemHealth {
  overall: HealthStatus;
  checks: HealthCheck[];
  uptime: number;
  timestamp: string;
  healthyCount: number;
  degradedCount: number;
  unhealthyCount: number;
}

const appStartTime = Date.now();

function finishCheck(
  name: string,
  start: number,
  status: HealthStatus,
  message: string,
  details?: Record<string, unknown>
): HealthCheck {
  return {
    name,
    status,
    message,
    durationMs: Math.round(performance.now() - start),
    timestamp: new Date().toISOString(),
    details,
  };
}

async function checkMemory(): Promise<HealthCheck> {
  const start = performance.now();
  const name = 'memory';

  try {
    if (!('memory' in performance)) {
      return finishCheck(name, start, 'healthy', 'Memory API not available (non-Chromium)');
    }

    const memory = (
      performance as Performance & {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
      }
    ).memory;

    if (!memory) {
      return finishCheck(name, start, 'healthy', 'Memory API unavailable');
    }

    const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
    const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
    const pct = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);

    metrics.gauge('health.memory.used_mb').set(usedMB);
    metrics.gauge('health.memory.total_mb').set(totalMB);
    metrics.gauge('health.memory.limit_mb').set(limitMB);
    metrics.gauge('health.memory.pct').set(pct);

    const status: HealthStatus = pct > 90 ? 'unhealthy' : pct > 70 ? 'degraded' : 'healthy';
    return finishCheck(name, start, status, `${usedMB}MB / ${totalMB}MB (${pct}% of ${limitMB}MB limit)`, {
      usedMB,
      totalMB,
      limitMB,
      pct,
    });
  } catch (error) {
    return finishCheck(name, start, 'degraded', `Memory check failed: ${String(error)}`);
  }
}

async function checkIpc(): Promise<HealthCheck> {
  const start = performance.now();
  const name = 'ipc';

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('plugin:app|version');
    const duration = Math.round(performance.now() - start);

    metrics.histogram('health.ipc.latency_ms').observe(duration);
    const status: HealthStatus =
      duration > 2000 ? 'unhealthy' : duration > 500 ? 'degraded' : 'healthy';

    return finishCheck(name, start, status, `IPC round-trip: ${duration}ms`, { latencyMs: duration });
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    if (!isTauriAvailable()) {
      return finishCheck(name, start, 'healthy', 'Running in browser (IPC not available)', {
        latencyMs: duration,
      });
    }

    return finishCheck(name, start, 'unhealthy', `IPC unreachable: ${String(error)}`, {
      latencyMs: duration,
    });
  }
}

async function checkLocalStorage(): Promise<HealthCheck> {
  const start = performance.now();
  const name = 'localStorage';

  try {
    const testKey = '__bismuth_health_check__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);

    let usedKeys = 0;
    let estimatedBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      usedKeys++;
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        estimatedBytes += (key.length + (value?.length ?? 0)) * 2;
      }
    }

    const usedKB = Math.round(estimatedBytes / 1024);
    metrics.gauge('health.storage.keys').set(usedKeys);
    metrics.gauge('health.storage.kb').set(usedKB);

    const status: HealthStatus = usedKB > 4096 ? 'degraded' : 'healthy';
    return finishCheck(name, start, status, `${usedKeys} keys, ~${usedKB}KB used`, {
      usedKeys,
      usedKB,
    });
  } catch (error) {
    return finishCheck(name, start, 'unhealthy', `localStorage inaccessible: ${String(error)}`);
  }
}

async function checkStorageQuota(): Promise<HealthCheck> {
  const start = performance.now();
  const name = 'storageQuota';

  try {
    const estimate = await navigator.storage?.estimate?.();
    if (!estimate) {
      return finishCheck(name, start, 'healthy', 'Storage estimate API not available');
    }

    const quotaMB = Math.round((estimate.quota ?? 0) / 1024 / 1024);
    const usageMB = Math.round((estimate.usage ?? 0) / 1024 / 1024);
    const pct = estimate.quota ? Math.round(((estimate.usage ?? 0) / estimate.quota) * 100) : 0;

    metrics.gauge('health.storage.quota_mb').set(quotaMB);
    metrics.gauge('health.storage.usage_mb').set(usageMB);
    metrics.gauge('health.storage.usage_pct').set(pct);

    const status: HealthStatus = pct > 90 ? 'unhealthy' : pct > 75 ? 'degraded' : 'healthy';
    return finishCheck(name, start, status, `${usageMB}MB / ${quotaMB}MB (${pct}% used)`, {
      usageMB,
      quotaMB,
      pct,
    });
  } catch (error) {
    return finishCheck(name, start, 'degraded', `Storage quota check failed: ${String(error)}`);
  }
}

async function checkDom(): Promise<HealthCheck> {
  const start = performance.now();
  const name = 'dom';

  try {
    const nodeCount = document.querySelectorAll('*').length;
    const scriptCount = document.scripts.length;

    metrics.gauge('health.dom.nodes').set(nodeCount);
    metrics.gauge('health.dom.scripts').set(scriptCount);

    const status: HealthStatus = nodeCount > 10_000 ? 'degraded' : 'healthy';
    return finishCheck(name, start, status, `${nodeCount.toLocaleString()} DOM nodes`, {
      nodeCount,
      scriptCount,
    });
  } catch (error) {
    return finishCheck(name, start, 'degraded', `DOM check failed: ${String(error)}`);
  }
}

async function checkEventLoop(): Promise<HealthCheck> {
  const start = performance.now();
  const name = 'eventLoop';

  return new Promise((resolve) => {
    const scheduleTime = performance.now();
    setTimeout(() => {
      const lag = Math.round(performance.now() - scheduleTime);
      metrics.histogram('health.eventloop.lag_ms').observe(lag);

      const status: HealthStatus = lag > 100 ? 'unhealthy' : lag > 50 ? 'degraded' : 'healthy';
      resolve(finishCheck(name, start, status, `Event loop lag: ${lag}ms`, { lagMs: lag }));
    }, 0);
  });
}

async function checkRuntimeErrors(): Promise<HealthCheck> {
  const start = performance.now();
  const name = 'runtimeErrors';

  try {
    const errors = getRuntimeErrors(25);
    const total = errors.length;
    const recent = errors.filter((entry) => Date.now() - Date.parse(entry.timestamp) < 15 * 60_000).length;

    metrics.gauge('health.runtime_errors.total').set(total);
    metrics.gauge('health.runtime_errors.recent').set(recent);

    const status: HealthStatus = recent >= 5 ? 'unhealthy' : total > 0 ? 'degraded' : 'healthy';
    return finishCheck(
      name,
      start,
      status,
      total > 0 ? `${total} persisted runtime errors (${recent} recent)` : 'No persisted runtime errors',
      {
        total,
        recent,
        latestCode: errors[0]?.code ?? null,
      }
    );
  } catch (error) {
    return finishCheck(name, start, 'degraded', `Runtime error check failed: ${String(error)}`);
  }
}

async function checkNetwork(): Promise<HealthCheck> {
  const start = performance.now();
  const name = 'network';

  try {
    const online = navigator.onLine;
    const connection = (
      navigator as Navigator & {
        connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean };
      }
    ).connection;

    if (typeof connection?.downlink === 'number') {
      metrics.gauge('health.network.downlink_mbps').set(Math.round(connection.downlink * 100) / 100);
    }
    if (typeof connection?.rtt === 'number') {
      metrics.gauge('health.network.rtt_ms').set(connection.rtt);
    }
    metrics.gauge('health.network.online').set(online ? 1 : 0);

    const status: HealthStatus = online ? 'healthy' : 'degraded';
    const message = online
      ? `Online${connection?.effectiveType ? ` (${connection.effectiveType})` : ''}`
      : 'Offline';

    return finishCheck(name, start, status, message, {
      online,
      effectiveType: connection?.effectiveType ?? null,
      downlinkMbps: connection?.downlink ?? null,
      rttMs: connection?.rtt ?? null,
      saveData: connection?.saveData ?? null,
    });
  } catch (error) {
    return finishCheck(name, start, 'degraded', `Network check failed: ${String(error)}`);
  }
}

async function checkDocumentState(): Promise<HealthCheck> {
  const start = performance.now();
  const name = 'documentState';

  try {
    const visibilityState = document.visibilityState;
    const focused = document.hasFocus();

    metrics.gauge('health.document.visible').set(visibilityState === 'visible' ? 1 : 0);
    metrics.gauge('health.document.focused').set(focused ? 1 : 0);

    return finishCheck(
      name,
      start,
      visibilityState === 'visible' ? 'healthy' : 'degraded',
      `${visibilityState}${focused ? ', focused' : ', not focused'}`,
      { visibilityState, focused }
    );
  } catch (error) {
    return finishCheck(name, start, 'degraded', `Document state check failed: ${String(error)}`);
  }
}

async function checkPerformanceObservers(): Promise<HealthCheck> {
  const start = performance.now();
  const name = 'performanceObservers';

  try {
    const observerStatus = getPerformanceObserverStatus();
    metrics.gauge('health.performance_observers.active').set(observerStatus.activeObservers);
    metrics.gauge('health.performance_observers.supported').set(observerStatus.supportedObservers.length);
    metrics.gauge('health.performance_observers.unsupported').set(
      observerStatus.unsupportedObservers.length
    );

    const status: HealthStatus = !observerStatus.running
      ? 'degraded'
      : observerStatus.activeObservers === 0
        ? 'degraded'
        : 'healthy';

    return finishCheck(
      name,
      start,
      status,
      observerStatus.running
        ? `${observerStatus.activeObservers} active observers`
        : 'Performance observers not running',
      observerStatus
    );
  } catch (error) {
    return finishCheck(name, start, 'degraded', `Observer check failed: ${String(error)}`);
  }
}

function computeOverall(checks: HealthCheck[]): HealthStatus {
  if (checks.some((check) => check.status === 'unhealthy')) return 'unhealthy';
  if (checks.some((check) => check.status === 'degraded')) return 'degraded';
  return 'healthy';
}

export async function runHealthChecks(): Promise<SystemHealth> {
  const checks = await Promise.all([
    checkMemory(),
    checkIpc(),
    checkLocalStorage(),
    checkStorageQuota(),
    checkDom(),
    checkEventLoop(),
    checkRuntimeErrors(),
    checkNetwork(),
    checkDocumentState(),
    checkPerformanceObservers(),
  ]);

  const healthyCount = checks.filter((check) => check.status === 'healthy').length;
  const degradedCount = checks.filter((check) => check.status === 'degraded').length;
  const unhealthyCount = checks.filter((check) => check.status === 'unhealthy').length;
  const overall = computeOverall(checks);

  metrics.counter('health.checks.total').inc();
  metrics.gauge('health.summary.healthy').set(healthyCount);
  metrics.gauge('health.summary.degraded').set(degradedCount);
  metrics.gauge('health.summary.unhealthy').set(unhealthyCount);
  metrics.gauge('health.summary.total').set(checks.length);

  return {
    overall,
    checks,
    uptime: getUptime(),
    timestamp: new Date().toISOString(),
    healthyCount,
    degradedCount,
    unhealthyCount,
  };
}

export function getUptime(): number {
  return Math.round((Date.now() - appStartTime) / 1000);
}
