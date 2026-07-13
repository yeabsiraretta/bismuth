<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  import { runHealthChecks, getUptime, type SystemHealth } from '@/utils/log/health';
  import { log } from '@/utils/log/logger';
  import type { LogCounts } from '@/utils/log/logger';
  import { metrics, type MetricSnapshot } from '@/utils/log/metrics';
  import { getWebVitals } from '@/utils/log/perf-observer';

  let health = $state<SystemHealth | null>(null);
  let allMetrics = $state<MetricSnapshot[]>([]);
  let vitals: Record<string, number | null> = $state({});
  let logCounts = $state<LogCounts>({ debug: 0, info: 0, warn: 0, error: 0, fatal: 0 });
  let refreshInterval: ReturnType<typeof setInterval>;
  type Section = 'health' | 'metrics' | 'vitals' | 'logs';
  let activeSection: Section = $state('health');
  let metricsFilter = $state('');

  async function refresh() {
    health = await runHealthChecks();
    allMetrics = metrics.getAll();
    vitals = getWebVitals();
    logCounts = log.getLogCounts();
  }

  onMount(() => {
    refresh();
    refreshInterval = setInterval(refresh, 5000);
  });

  onDestroy(() => clearInterval(refreshInterval));

  function formatUptime(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function statusColor(status: string): string {
    if (status === 'healthy') return 'var(--color-success, #22c55e)';
    if (status === 'degraded') return 'var(--color-warning, #f59e0b)';
    return 'var(--color-error, #ef4444)';
  }

  function resetMetrics() {
    metrics.reset();
    refresh();
  }

  function exportMetrics() {
    const blob = new Blob([metrics.export()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bismuth-metrics-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadLogs() {
    log.downloadLogs();
  }

  let filteredMetrics = $derived(
    metricsFilter
      ? allMetrics.filter((m) => m.name.toLowerCase().includes(metricsFilter.toLowerCase()))
      : allMetrics
  );

  let uptime = $derived(health ? formatUptime(health.uptime) : formatUptime(getUptime()));

  const sections: { id: Section; label: string }[] = [
    { id: 'health', label: 'Health Checks' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'vitals', label: 'Web Vitals' },
    { id: 'logs', label: 'Logs' },
  ];
</script>

<div class="ob-panel">
  <h3 class="ob-heading">Observability & Monitoring</h3>
  <p class="ob-desc">System health, performance metrics, and diagnostics</p>

  <div class="ob-overview">
    <div
      class="ob-card"
      style="border-color: {health ? statusColor(health.overall) : 'var(--color-border)'}"
    >
      <span class="ob-card-label">Status</span>
      <span class="ob-card-value" style="color: {health ? statusColor(health.overall) : 'inherit'}">
        {health?.overall ?? '...'}
      </span>
    </div>
    <div class="ob-card">
      <span class="ob-card-label">Uptime</span>
      <span class="ob-card-value">{uptime}</span>
    </div>
    <div class="ob-card">
      <span class="ob-card-label">Metrics</span>
      <span class="ob-card-value">{allMetrics.length}</span>
    </div>
    <div class="ob-card">
      <span class="ob-card-label">Warnings</span>
      <span
        class="ob-card-value"
        style="color: {logCounts.warn > 0 ? 'var(--color-warning, #f59e0b)' : 'inherit'}"
      >
        {logCounts.warn}
      </span>
    </div>
    <div class="ob-card">
      <span class="ob-card-label">Errors</span>
      <span
        class="ob-card-value"
        style="color: {logCounts.error + logCounts.fatal > 0
          ? 'var(--color-error, #ef4444)'
          : 'inherit'}"
      >
        {logCounts.error + logCounts.fatal}
      </span>
    </div>
  </div>

  <div class="ob-tabs">
    {#each sections as sec (sec.id)}
      <button
        class="ob-tab"
        class:ob-tab-active={activeSection === sec.id}
        onclick={() => {
          activeSection = sec.id;
        }}
      >
        {sec.label}
      </button>
    {/each}
  </div>

  {#if activeSection === 'health'}
    <div class="ob-section">
      <div class="ob-section-header">
        <h4 class="ob-section-title">Health Checks</h4>
        <button class="ob-btn" onclick={refresh}>Refresh</button>
      </div>
      {#if health}
        {#each health.checks as check (check.name)}
          <div class="ob-check-row">
            <span class="ob-check-dot" style="background: {statusColor(check.status)}"></span>
            <div class="ob-check-info">
              <span class="ob-check-name" style="color: {statusColor(check.status)}"
                >{check.name}</span
              >
              <span class="ob-check-msg">{check.message}</span>
            </div>
            <span class="ob-check-dur">{check.durationMs}ms</span>
          </div>
        {/each}
      {:else}
        <p class="ob-hint">Running checks...</p>
      {/if}
    </div>
  {:else if activeSection === 'metrics'}
    <div class="ob-section">
      <div class="ob-section-header">
        <h4 class="ob-section-title">Metrics ({filteredMetrics.length})</h4>
        <div class="ob-header-actions">
          <input type="text" bind:value={metricsFilter} placeholder="Filter..." class="ob-filter" />
          <button class="ob-btn" onclick={exportMetrics}>Export</button>
          <button class="ob-btn ob-btn-danger" onclick={resetMetrics}>Reset</button>
        </div>
      </div>
      <div class="ob-metrics-grid">
        <div class="ob-metrics-header">
          <span class="ob-col-name">Name</span>
          <span class="ob-col-type">Type</span>
          <span class="ob-col-value">Value</span>
          <span class="ob-col-extra">Details</span>
        </div>
        {#each filteredMetrics as m (m.name)}
          <div class="ob-metrics-row">
            <span class="ob-col-name ob-metric-name">{m.name}</span>
            <span class="ob-col-type"><code>{m.type}</code></span>
            <span class="ob-col-value">
              {#if m.type === 'histogram'}
                {m.avg ?? 0} avg
              {:else}
                {m.value ?? 0}
              {/if}
            </span>
            <span class="ob-col-extra">
              {#if m.type === 'histogram'}
                n={m.count} p50={m.p50} p95={m.p95} p99={m.p99}
              {:else}
                —
              {/if}
            </span>
          </div>
        {/each}
        {#if filteredMetrics.length === 0}
          <div class="ob-empty-row">No metrics recorded yet</div>
        {/if}
      </div>
    </div>
  {:else if activeSection === 'vitals'}
    <div class="ob-section">
      <h4 class="ob-section-title">Web Vitals</h4>
      <div class="ob-vitals-grid">
        <div class="ob-vital-card">
          <span class="ob-vital-label">First Contentful Paint</span>
          <span class="ob-vital-value">{vitals.fcp != null ? `${vitals.fcp}ms` : '—'}</span>
        </div>
        <div class="ob-vital-card">
          <span class="ob-vital-label">Largest Contentful Paint</span>
          <span class="ob-vital-value">{vitals.lcp != null ? `${vitals.lcp}ms` : '—'}</span>
        </div>
        <div class="ob-vital-card">
          <span class="ob-vital-label">Cumulative Layout Shift</span>
          <span class="ob-vital-value"
            >{vitals.cls != null ? Number(vitals.cls).toFixed(3) : '—'}</span
          >
        </div>
        <div class="ob-vital-card">
          <span class="ob-vital-label">Time to First Byte</span>
          <span class="ob-vital-value">{vitals.ttfb != null ? `${vitals.ttfb}ms` : '—'}</span>
        </div>
        <div class="ob-vital-card">
          <span class="ob-vital-label">DOM Interactive</span>
          <span class="ob-vital-value"
            >{vitals.domInteractive != null ? `${vitals.domInteractive}ms` : '—'}</span
          >
        </div>
        <div class="ob-vital-card">
          <span class="ob-vital-label">DOM Complete</span>
          <span class="ob-vital-value"
            >{vitals.domComplete != null ? `${vitals.domComplete}ms` : '—'}</span
          >
        </div>
        <div class="ob-vital-card">
          <span class="ob-vital-label">Page Load</span>
          <span class="ob-vital-value">{vitals.loadMs != null ? `${vitals.loadMs}ms` : '—'}</span>
        </div>
        <div class="ob-vital-card">
          <span class="ob-vital-label">Long Tasks</span>
          <span class="ob-vital-value"
            >{vitals.longTaskCount ?? 0} ({vitals.longTaskTotalMs ?? 0}ms)</span
          >
        </div>
      </div>
    </div>
  {:else if activeSection === 'logs'}
    <div class="ob-section">
      <div class="ob-section-header">
        <h4 class="ob-section-title">Log Summary</h4>
        <button class="ob-btn" onclick={downloadLogs}>Export Logs</button>
      </div>
      <div class="ob-log-summary">
        <div class="ob-log-row">
          <span class="ob-log-badge ob-log-debug">DEBUG</span>
          <span class="ob-log-count">{logCounts.debug}</span>
        </div>
        <div class="ob-log-row">
          <span class="ob-log-badge ob-log-info">INFO</span>
          <span class="ob-log-count">{logCounts.info}</span>
        </div>
        <div class="ob-log-row">
          <span class="ob-log-badge ob-log-warn">WARN</span>
          <span class="ob-log-count">{logCounts.warn}</span>
        </div>
        <div class="ob-log-row">
          <span class="ob-log-badge ob-log-error">ERROR</span>
          <span class="ob-log-count">{logCounts.error}</span>
        </div>
        {#if logCounts.fatal > 0}
          <div class="ob-log-row">
            <span class="ob-log-badge ob-log-fatal">FATAL</span>
            <span class="ob-log-count">{logCounts.fatal}</span>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .ob-panel {
    max-width: 100%;
  }
  .ob-heading {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 4px;
    color: var(--color-text);
  }
  .ob-desc {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin: 0 0 16px;
  }

  /* Overview strip */
  .ob-overview {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .ob-card {
    flex: 1;
    min-width: 80px;
    padding: 8px 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    text-align: center;
    background: var(--color-surface);
  }
  .ob-card-label {
    display: block;
    font-size: 0.6rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .ob-card-value {
    display: block;
    font-size: 0.8rem;
    font-weight: 500;
    font-family: var(--font-mono);
    margin-top: 2px;
  }

  /* Tabs */
  .ob-tabs {
    display: flex;
    gap: 2px;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 2px;
    margin-bottom: 16px;
  }
  .ob-tab {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.7rem;
    cursor: pointer;
    border-radius: var(--radius-s) var(--radius-s) 0 0;
    font-family: inherit;
    transition: all 0.15s;
  }
  .ob-tab:hover {
    background: var(--color-surface-hover);
    color: var(--color-text);
  }
  .ob-tab-active {
    background: var(--color-surface);
    color: var(--color-text);
    font-weight: 600;
  }

  /* Sections */
  .ob-section {
    margin-bottom: 20px;
  }
  .ob-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .ob-section-title {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
    margin: 0;
  }
  .ob-header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* Buttons */
  .ob-btn {
    padding: 3px 10px;
    font-size: 0.65rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
    font-family: inherit;
    transition: background var(--transition-fast);
  }
  .ob-btn:hover {
    background: var(--color-surface-hover);
  }
  .ob-btn-danger {
    color: var(--color-error);
    border-color: var(--color-error);
  }
  .ob-btn-danger:hover {
    background: oklch(from var(--color-error) l c h / 0.12);
  }

  .ob-filter {
    padding: 2px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 0.65rem;
    width: 130px;
    font-family: inherit;
  }
  .ob-filter:focus {
    outline: 1px solid var(--color-accent);
    border-color: var(--color-accent);
  }

  /* Health checks */
  .ob-check-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid var(--color-border);
  }
  .ob-check-row:last-child {
    border-bottom: none;
  }
  .ob-check-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .ob-check-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .ob-check-name {
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
  }
  .ob-check-msg {
    font-size: 0.65rem;
    color: var(--color-text-muted);
  }
  .ob-check-dur {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    min-width: 40px;
    text-align: right;
    font-family: var(--font-mono);
  }
  .ob-hint {
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }

  /* Metrics grid */
  .ob-metrics-grid {
    font-size: 0.65rem;
  }
  .ob-metrics-header,
  .ob-metrics-row {
    display: grid;
    grid-template-columns: 2fr 0.5fr 0.7fr 1.5fr;
    gap: 6px;
    padding: 4px 0;
  }
  .ob-metrics-header {
    font-weight: 600;
    color: var(--color-text-muted);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    font-size: 0.6rem;
  }
  .ob-metrics-row {
    border-bottom: 1px solid var(--color-border);
  }
  .ob-metrics-row:last-child {
    border-bottom: none;
  }
  .ob-metrics-row:hover {
    background: var(--color-surface);
  }
  .ob-metric-name {
    font-family: var(--font-mono);
    font-weight: 500;
    color: var(--color-accent);
    word-break: break-all;
  }
  .ob-col-value {
    font-family: var(--font-mono);
  }
  .ob-col-extra {
    font-family: var(--font-mono);
    color: var(--color-text-muted);
  }
  .ob-empty-row {
    padding: 16px;
    text-align: center;
    color: var(--color-text-muted);
    grid-column: 1 / -1;
  }
  code {
    background: var(--color-surface);
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 0.6rem;
  }

  /* Vitals */
  .ob-vitals-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .ob-vital-card {
    padding: 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
  }
  .ob-vital-label {
    display: block;
    font-size: 0.6rem;
    color: var(--color-text-muted);
    margin-bottom: 3px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .ob-vital-value {
    font-size: 0.9rem;
    font-weight: 500;
    font-family: var(--font-mono);
  }

  /* Logs */
  .ob-log-summary {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ob-log-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 0;
  }
  .ob-log-badge {
    padding: 2px 8px;
    border-radius: var(--radius-s);
    font-size: 0.6rem;
    font-weight: 600;
    min-width: 50px;
    text-align: center;
    font-family: var(--font-mono);
  }
  .ob-log-debug {
    background: var(--color-surface);
    color: var(--color-text-muted);
  }
  .ob-log-info {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
  }
  .ob-log-warn {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
  }
  .ob-log-error {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }
  .ob-log-fatal {
    background: rgba(220, 38, 38, 0.2);
    color: #dc2626;
  }
  .ob-log-count {
    font-size: 0.8rem;
    font-weight: 500;
    font-family: var(--font-mono);
  }
</style>
