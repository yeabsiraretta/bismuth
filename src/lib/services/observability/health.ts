/**
 * Health check service — monitors system resource usage, IPC responsiveness,
 * and application state. All checks are local-only.
 */

import { metrics } from './metrics';

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
}

const appStartTime = Date.now();

// ─── Individual check implementations ─────────────────────────────────────────

async function checkMemory(): Promise<HealthCheck> {
  const start = performance.now();
  const name = 'memory';
  try {
    if ('memory' in performance) {
      const mem = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      if (mem) {
        const usedMB = Math.round(mem.usedJSHeapSize / 1024 / 1024);
        const totalMB = Math.round(mem.totalJSHeapSize / 1024 / 1024);
        const limitMB = Math.round(mem.jsHeapSizeLimit / 1024 / 1024);
        const pct = Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100);

        metrics.gauge('health.memory.used_mb').set(usedMB);
        metrics.gauge('health.memory.pct').set(pct);

        const status: HealthStatus = pct > 90 ? 'unhealthy' : pct > 70 ? 'degraded' : 'healthy';
        return {
          name, status, durationMs: Math.round(performance.now() - start),
          message: `${usedMB}MB / ${totalMB}MB (${pct}% of ${limitMB}MB limit)`,
          timestamp: new Date().toISOString(),
          details: { usedMB, totalMB, limitMB, pct },
        };
      }
    }
    return {
      name, status: 'healthy', durationMs: Math.round(performance.now() - start),
      message: 'Memory API not available (non-Chromium)',
      timestamp: new Date().toISOString(),
    };
  } catch (e) {
    return {
      name, status: 'degraded', durationMs: Math.round(performance.now() - start),
      message: `Memory check failed: ${e}`,
      timestamp: new Date().toISOString(),
    };
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
    const status: HealthStatus = duration > 2000 ? 'unhealthy' : duration > 500 ? 'degraded' : 'healthy';
    return {
      name, status, durationMs: duration,
      message: `IPC round-trip: ${duration}ms`,
      timestamp: new Date().toISOString(),
      details: { latencyMs: duration },
    };
  } catch (e) {
    const duration = Math.round(performance.now() - start);
    return {
      name, status: 'unhealthy', durationMs: duration,
      message: `IPC unreachable: ${e}`,
      timestamp: new Date().toISOString(),
    };
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
        const val = localStorage.getItem(key);
        estimatedBytes += (key.length + (val?.length ?? 0)) * 2; // UTF-16
      }
    }
    const usedKB = Math.round(estimatedBytes / 1024);
    metrics.gauge('health.storage.keys').set(usedKeys);
    metrics.gauge('health.storage.kb').set(usedKB);

    const status: HealthStatus = usedKB > 4096 ? 'degraded' : 'healthy';
    return {
      name, status, durationMs: Math.round(performance.now() - start),
      message: `${usedKeys} keys, ~${usedKB}KB used`,
      timestamp: new Date().toISOString(),
      details: { usedKeys, usedKB },
    };
  } catch (e) {
    return {
      name, status: 'unhealthy', durationMs: Math.round(performance.now() - start),
      message: `localStorage inaccessible: ${e}`,
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkDom(): Promise<HealthCheck> {
  const start = performance.now();
  const name = 'dom';
  try {
    const nodeCount = document.querySelectorAll('*').length;
    metrics.gauge('health.dom.nodes').set(nodeCount);
    const status: HealthStatus = nodeCount > 10000 ? 'degraded' : 'healthy';
    return {
      name, status, durationMs: Math.round(performance.now() - start),
      message: `${nodeCount.toLocaleString()} DOM nodes`,
      timestamp: new Date().toISOString(),
      details: { nodeCount },
    };
  } catch (e) {
    return {
      name, status: 'degraded', durationMs: Math.round(performance.now() - start),
      message: `DOM check failed: ${e}`,
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkEventLoop(): Promise<HealthCheck> {
  const name = 'eventLoop';
  const start = performance.now();
  return new Promise((resolve) => {
    const scheduleTime = performance.now();
    setTimeout(() => {
      const lag = Math.round(performance.now() - scheduleTime);
      metrics.histogram('health.eventloop.lag_ms').observe(lag);
      const status: HealthStatus = lag > 100 ? 'unhealthy' : lag > 50 ? 'degraded' : 'healthy';
      resolve({
        name, status, durationMs: Math.round(performance.now() - start),
        message: `Event loop lag: ${lag}ms`,
        timestamp: new Date().toISOString(),
        details: { lagMs: lag },
      });
    }, 0);
  });
}

// ─── Aggregate health ─────────────────────────────────────────────────────────

function computeOverall(checks: HealthCheck[]): HealthStatus {
  if (checks.some((c) => c.status === 'unhealthy')) return 'unhealthy';
  if (checks.some((c) => c.status === 'degraded')) return 'degraded';
  return 'healthy';
}

/** Run all health checks and return aggregate status. */
export async function runHealthChecks(): Promise<SystemHealth> {
  const checks = await Promise.all([
    checkMemory(),
    checkIpc(),
    checkLocalStorage(),
    checkDom(),
    checkEventLoop(),
  ]);

  metrics.counter('health.checks.total').inc();
  const result: SystemHealth = {
    overall: computeOverall(checks),
    checks,
    uptime: Math.round((Date.now() - appStartTime) / 1000),
    timestamp: new Date().toISOString(),
  };

  return result;
}

/** Get app uptime in seconds. */
export function getUptime(): number {
  return Math.round((Date.now() - appStartTime) / 1000);
}
