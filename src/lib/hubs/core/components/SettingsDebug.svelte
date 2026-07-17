<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  import {
    getUptime,
    runHealthChecks,
    type SystemHealth,
  } from '@/utils/log/health';
  import {
    log,
    type InteractionSummary,
    type LogCounts,
    type LogEntry,
  } from '@/utils/log/logger';
  import {
    clearRuntimeErrors,
    getRuntimeErrors,
    type RuntimeErrorRecord,
  } from '@/utils/log/runtime-errors';
  import { metrics, type MetricSnapshot, type MetricSummary } from '@/utils/log/metrics';
  import {
    getPerformanceObserverStatus,
    getWebVitals,
    type PerformanceObserverStatus,
  } from '@/utils/log/perf-observer';

  let health = $state<SystemHealth | null>(null);
  let allMetrics = $state<MetricSnapshot[]>([]);
  let metricSummary = $state<MetricSummary | null>(null);
  let vitals: Record<string, number | null> = $state({});
  let observerStatus = $state<PerformanceObserverStatus | null>(null);
  let logCounts = $state<LogCounts>({ debug: 0, info: 0, warn: 0, error: 0, fatal: 0 });
  let recentLogs = $state<LogEntry[]>([]);
  let interactionSummary = $state<InteractionSummary | null>(null);
  let runtimeErrors = $state<RuntimeErrorRecord[]>([]);
  let refreshInterval: ReturnType<typeof setInterval>;

  type Section = 'health' | 'metrics' | 'vitals' | 'logs';
  let activeSection: Section = $state('health');
  let metricsFilter = $state('');

  async function refresh() {
    health = await runHealthChecks();
    allMetrics = metrics.getAll();
    metricSummary = metrics.getSummary();
    vitals = getWebVitals();
    observerStatus = getPerformanceObserverStatus();
    logCounts = log.getLogCounts();
    recentLogs = log.getLogs(20);
    interactionSummary = log.getInteractionSummary();
    runtimeErrors = getRuntimeErrors(10);
  }

  onMount(() => {
    void refresh();
    refreshInterval = setInterval(() => void refresh(), 5000);
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

  function formatMetricValue(metric: MetricSnapshot): string {
    if (metric.type === 'histogram') {
      return metric.avg != null ? `${metric.avg}` : '0';
    }
    return `${metric.value ?? 0}`;
  }

  function formatMetricDetails(metric: MetricSnapshot): string {
    if (metric.type === 'histogram') {
      return `n=${metric.count ?? 0} p50=${metric.p50 ?? 0} p95=${metric.p95 ?? 0} p99=${metric.p99 ?? 0}`;
    }

    if (metric.labels && Object.keys(metric.labels).length > 0) {
      return Object.entries(metric.labels)
        .map(([key, value]) => `${key}=${value}`)
        .join(', ');
    }

    return '—';
  }

  function formatAge(ageMs: number): string {
    if (ageMs < 1000) return `${ageMs}ms`;
    const seconds = Math.round(ageMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
  }

  function stringifyDetails(details?: Record<string, unknown>): string {
    return details ? JSON.stringify(details, null, 2) : '';
  }

  function resetMetrics() {
    metrics.reset();
    void refresh();
  }

  function exportMetrics() {
    const blob = new Blob([metrics.export()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `bismuth-metrics-${new Date().toISOString().slice(0, 19)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function downloadLogs() {
    log.downloadLogs();
  }

  function clearErrorHistory() {
    clearRuntimeErrors();
    void refresh();
  }

  let filteredMetrics = $derived(
    metricsFilter
      ? allMetrics.filter((metric) => metric.name.toLowerCase().includes(metricsFilter.toLowerCase()))
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
  <p class="ob-desc">Local health, metrics, performance, and diagnostics for desktop and web runtime.</p>

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
      <span class="ob-card-label">Checks</span>
      <span class="ob-card-value">{health?.checks.length ?? 0}</span>
    </div>
    <div class="ob-card">
      <span class="ob-card-label">Metrics</span>
      <span class="ob-card-value">{metricSummary?.totalMetrics ?? allMetrics.length}</span>
    </div>
    <div class="ob-card">
      <span class="ob-card-label">Runtime Errors</span>
      <span
        class="ob-card-value"
        style="color: {runtimeErrors.length > 0 ? 'var(--color-warning, #f59e0b)' : 'inherit'}"
      >
        {runtimeErrors.length}
      </span>
    </div>
    <div class="ob-card">
      <span class="ob-card-label">Log Errors</span>
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
        <button class="ob-btn" onclick={() => void refresh()}>Refresh</button>
      </div>

      {#if health}
        <div class="ob-summary-strip">
          <div class="ob-summary-chip" style="border-color: {statusColor('healthy')}">
            Healthy: {health.healthyCount}
          </div>
          <div class="ob-summary-chip" style="border-color: {statusColor('degraded')}">
            Degraded: {health.degradedCount}
          </div>
          <div class="ob-summary-chip" style="border-color: {statusColor('unhealthy')}">
            Unhealthy: {health.unhealthyCount}
          </div>
          <div class="ob-summary-chip">Last run: {health.timestamp}</div>
        </div>

        {#each health.checks as check (check.name)}
          <div class="ob-check-row">
            <span class="ob-check-dot" style="background: {statusColor(check.status)}"></span>
            <div class="ob-check-info">
              <div class="ob-check-topline">
                <span class="ob-check-name" style="color: {statusColor(check.status)}">{check.name}</span>
                <span class="ob-check-time">{check.timestamp}</span>
              </div>
              <span class="ob-check-msg">{check.message}</span>
              {#if check.details}
                <pre>{stringifyDetails(check.details)}</pre>
              {/if}
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

      <div class="ob-mini-grid">
        <div class="ob-mini-card">
          <span class="ob-mini-label">Total</span>
          <span class="ob-mini-value">{metricSummary?.totalMetrics ?? 0}</span>
        </div>
        <div class="ob-mini-card">
          <span class="ob-mini-label">Updates</span>
          <span class="ob-mini-value">{metricSummary?.totalUpdates ?? 0}</span>
        </div>
        <div class="ob-mini-card">
          <span class="ob-mini-label">Histograms</span>
          <span class="ob-mini-value">{metricSummary?.histograms ?? 0}</span>
        </div>
        <div class="ob-mini-card">
          <span class="ob-mini-label">Stale</span>
          <span class="ob-mini-value">{metricSummary?.staleMetrics ?? 0}</span>
        </div>
      </div>

      <div class="ob-metrics-grid">
        <div class="ob-metrics-header">
          <span>Name</span>
          <span>Type</span>
          <span>Value</span>
          <span>Age</span>
          <span>Updates</span>
          <span>Details</span>
        </div>
        {#each filteredMetrics as metric (metric.name + metric.updatedAt)}
          <div class="ob-metrics-row">
            <span class="ob-metric-name">{metric.name}</span>
            <span><code>{metric.type}</code></span>
            <span class="ob-mono">{formatMetricValue(metric)}</span>
            <span class="ob-mono">{formatAge(metric.ageMs)}</span>
            <span class="ob-mono">{metric.updates}</span>
            <span class="ob-col-extra">{formatMetricDetails(metric)}</span>
          </div>
        {/each}
        {#if filteredMetrics.length === 0}
          <div class="ob-empty-row">No metrics recorded yet</div>
        {/if}
      </div>
    </div>
  {:else if activeSection === 'vitals'}
    <div class="ob-section">
      <div class="ob-section-header">
        <h4 class="ob-section-title">Web Vitals & Observers</h4>
        <button class="ob-btn" onclick={() => void refresh()}>Refresh</button>
      </div>

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
          <span class="ob-vital-value">{vitals.cls != null ? Number(vitals.cls).toFixed(3) : '—'}</span>
        </div>
        <div class="ob-vital-card">
          <span class="ob-vital-label">Time to First Byte</span>
          <span class="ob-vital-value">{vitals.ttfb != null ? `${vitals.ttfb}ms` : '—'}</span>
        </div>
        <div class="ob-vital-card">
          <span class="ob-vital-label">Long Tasks</span>
          <span class="ob-vital-value"
            >{vitals.longTaskCount ?? 0} ({vitals.longTaskTotalMs ?? 0}ms)</span
          >
        </div>
        <div class="ob-vital-card">
          <span class="ob-vital-label">Slow Resources</span>
          <span class="ob-vital-value">{vitals.slowResourceCount ?? 0}</span>
        </div>
      </div>

      <div class="ob-diagnostics-grid">
        <div class="ob-diagnostics-card">
          <h5 class="ob-subheading">Observer State</h5>
          <div class="ob-kv-list">
            <div><span>Running</span><strong>{observerStatus?.running ? 'yes' : 'no'}</strong></div>
            <div><span>Active</span><strong>{observerStatus?.activeObservers ?? 0}</strong></div>
            <div><span>Entries</span><strong>{observerStatus?.observedEntries ?? 0}</strong></div>
            <div><span>Started</span><strong>{observerStatus?.lastStartedAt ?? '—'}</strong></div>
          </div>
        </div>
        <div class="ob-diagnostics-card">
          <h5 class="ob-subheading">Supported Observers</h5>
          <div class="ob-tag-list">
            {#if observerStatus && observerStatus.supportedObservers.length > 0}
              {#each observerStatus.supportedObservers as kind (kind)}
                <span class="ob-tag">{kind}</span>
              {/each}
            {:else}
              <p class="ob-hint">No supported observers detected yet.</p>
            {/if}
          </div>
          {#if observerStatus && observerStatus.unsupportedObservers.length > 0}
            <h5 class="ob-subheading ob-subheading-spaced">Unsupported Observers</h5>
            <div class="ob-tag-list">
              {#each observerStatus.unsupportedObservers as kind (kind)}
                <span class="ob-tag ob-tag-muted">{kind}</span>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {:else if activeSection === 'logs'}
    <div class="ob-section">
      <div class="ob-section-header">
        <h4 class="ob-section-title">Logs & Diagnostics</h4>
        <div class="ob-header-actions">
          <button class="ob-btn" onclick={downloadLogs}>Export Logs</button>
          <button class="ob-btn ob-btn-danger" onclick={clearErrorHistory}>Clear Errors</button>
        </div>
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
        <div class="ob-log-row">
          <span class="ob-log-badge ob-log-fatal">FATAL</span>
          <span class="ob-log-count">{logCounts.fatal}</span>
        </div>
      </div>

      <div class="ob-diagnostics-grid">
        <div class="ob-diagnostics-card">
          <h5 class="ob-subheading">Interaction Summary</h5>
          {#if interactionSummary}
            <div class="ob-kv-list">
              <div><span>Total</span><strong>{interactionSummary.total}</strong></div>
              <div><span>With errors</span><strong>{interactionSummary.withErrors}</strong></div>
            </div>

            {#if interactionSummary.categories.length > 0}
              {#each interactionSummary.categories as item (item.category)}
                <div class="ob-entry-item">
                  <div class="ob-entry-head">
                    <span class="ob-entry-level">{item.category}</span>
                    <span class="ob-entry-time">{item.count} events</span>
                  </div>
                  <div class="ob-entry-message">
                    errors={item.errorCount}
                    {#if item.avgDurationMs != null}
                      avg={item.avgDurationMs}ms
                    {/if}
                  </div>
                </div>
              {/each}
            {:else}
              <p class="ob-hint">No tracked interactions yet.</p>
            {/if}
          {/if}
        </div>

        <div class="ob-diagnostics-card">
          <h5 class="ob-subheading">Recent Runtime Errors</h5>
          {#if runtimeErrors.length === 0}
            <p class="ob-hint">No persisted runtime errors.</p>
          {:else}
            {#each runtimeErrors as runtimeError (runtimeError.code)}
              <div class="ob-error-item">
                <div class="ob-error-head">
                  <span class="ob-error-code">{runtimeError.code}</span>
                  <span class="ob-error-time">{runtimeError.timestamp}</span>
                </div>
                <div class="ob-error-source">{runtimeError.source}</div>
                <div class="ob-error-message">{runtimeError.message}</div>
                {#if runtimeError.details}
                  <pre>{runtimeError.details}</pre>
                {/if}
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <div class="ob-diagnostics-card ob-logs-card">
        <h5 class="ob-subheading">Recent Log Entries</h5>
        {#if recentLogs.length === 0}
          <p class="ob-hint">No in-app log entries yet.</p>
        {:else}
          {#each recentLogs as entry, index (`${entry.timestamp}-${entry.scope}-${index}`)}
            <div class="ob-entry-item">
              <div class="ob-entry-head">
                <span class="ob-entry-level">{entry.level.toUpperCase()}</span>
                <span class="ob-entry-scope">{entry.scope}</span>
                <span class="ob-entry-time">{entry.timestamp}</span>
              </div>
              <div class="ob-entry-message">{entry.message}</div>
              {#if entry.context}
                <pre>{JSON.stringify(entry.context, null, 2)}</pre>
              {/if}
            </div>
          {/each}
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
    margin: 0 0 4px;
    color: var(--color-text);
    font-size: 1rem;
    font-weight: 600;
  }

  .ob-desc {
    margin: 0 0 16px;
    color: var(--color-text-muted);
    font-size: 0.75rem;
  }

  .ob-overview,
  .ob-mini-grid,
  .ob-vitals-grid,
  .ob-diagnostics-grid {
    display: grid;
    gap: 8px;
  }

  .ob-overview {
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    margin-bottom: 16px;
  }

  .ob-card,
  .ob-mini-card,
  .ob-vital-card,
  .ob-diagnostics-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
  }

  .ob-card,
  .ob-mini-card,
  .ob-vital-card {
    padding: 10px;
  }

  .ob-card-label,
  .ob-mini-label,
  .ob-vital-label {
    display: block;
    margin-bottom: 3px;
    color: var(--color-text-muted);
    font-size: 0.6rem;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .ob-card-value,
  .ob-mini-value,
  .ob-vital-value {
    font-family: var(--font-mono);
    font-weight: 500;
  }

  .ob-card-value {
    font-size: 0.85rem;
  }

  .ob-mini-grid {
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    margin-bottom: 12px;
  }

  .ob-mini-value {
    font-size: 0.8rem;
  }

  .ob-tabs {
    display: flex;
    gap: 2px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 2px;
  }

  .ob-tab {
    border: none;
    border-radius: var(--radius-s) var(--radius-s) 0 0;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    font-family: inherit;
    font-size: 0.7rem;
    padding: 4px 10px;
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

  .ob-section {
    margin-bottom: 20px;
  }

  .ob-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
  }

  .ob-section-title,
  .ob-subheading {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .ob-subheading {
    color: var(--color-text);
    font-size: 0.72rem;
    margin-bottom: 10px;
  }

  .ob-subheading-spaced {
    margin-top: 12px;
  }

  .ob-header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .ob-btn,
  .ob-filter {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: inherit;
    font-size: 0.65rem;
  }

  .ob-btn {
    cursor: pointer;
    padding: 3px 10px;
  }

  .ob-btn:hover {
    background: var(--color-surface-hover);
  }

  .ob-btn-danger {
    border-color: var(--color-error);
    color: var(--color-error);
  }

  .ob-filter {
    padding: 2px 8px;
    width: 130px;
  }

  .ob-filter:focus {
    border-color: var(--color-accent);
    outline: 1px solid var(--color-accent);
  }

  .ob-summary-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .ob-summary-chip,
  .ob-tag {
    border: 1px solid var(--color-border);
    border-radius: 999px;
    padding: 4px 8px;
    font-family: var(--font-mono);
    font-size: 0.62rem;
  }

  .ob-tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .ob-tag-muted {
    color: var(--color-text-muted);
  }

  .ob-check-row,
  .ob-entry-item,
  .ob-error-item {
    border-bottom: 1px solid var(--color-border);
    padding: 8px 0;
  }

  .ob-check-row:last-child,
  .ob-entry-item:last-child,
  .ob-error-item:last-child {
    border-bottom: none;
  }

  .ob-check-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .ob-check-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 6px;
  }

  .ob-check-info {
    flex: 1;
    min-width: 0;
  }

  .ob-check-topline,
  .ob-entry-head,
  .ob-error-head,
  .ob-kv-list > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .ob-check-name {
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  .ob-check-msg,
  .ob-entry-message,
  .ob-error-message {
    color: var(--color-text);
    font-size: 0.68rem;
    margin-top: 2px;
  }

  .ob-check-time,
  .ob-check-dur,
  .ob-entry-time,
  .ob-entry-scope,
  .ob-error-time,
  .ob-error-code,
  .ob-error-source {
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    font-size: 0.6rem;
  }

  .ob-check-dur {
    min-width: 42px;
    text-align: right;
  }

  .ob-metrics-grid {
    font-size: 0.65rem;
  }

  .ob-metrics-header,
  .ob-metrics-row {
    display: grid;
    gap: 6px;
    grid-template-columns: minmax(140px, 2fr) 0.7fr 0.8fr 0.7fr 0.7fr 1.8fr;
    padding: 4px 0;
  }

  .ob-metrics-header {
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text-muted);
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    padding-bottom: 6px;
    text-transform: uppercase;
  }

  .ob-metrics-row {
    border-bottom: 1px solid var(--color-border);
  }

  .ob-metric-name,
  .ob-mono {
    font-family: var(--font-mono);
  }

  .ob-metric-name {
    color: var(--color-accent);
    font-weight: 500;
    word-break: break-all;
  }

  .ob-col-extra {
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }

  .ob-empty-row,
  .ob-hint {
    color: var(--color-text-muted);
    font-size: 0.7rem;
  }

  .ob-empty-row {
    grid-column: 1 / -1;
    padding: 16px;
    text-align: center;
  }

  .ob-vitals-grid,
  .ob-diagnostics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ob-diagnostics-card {
    padding: 12px;
  }

  .ob-kv-list {
    display: grid;
    gap: 8px;
    font-size: 0.68rem;
  }

  .ob-kv-list span {
    color: var(--color-text-muted);
  }

  .ob-entry-level {
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: 0.6rem;
    font-weight: 600;
  }

  .ob-log-summary {
    display: grid;
    gap: 6px;
    margin-bottom: 16px;
  }

  .ob-log-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .ob-log-badge {
    border-radius: var(--radius-s);
    font-family: var(--font-mono);
    font-size: 0.6rem;
    font-weight: 600;
    min-width: 50px;
    padding: 2px 8px;
    text-align: center;
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
    font-family: var(--font-mono);
    font-size: 0.8rem;
    font-weight: 500;
  }

  .ob-logs-card {
    margin-top: 12px;
  }

  pre,
  code {
    background: var(--color-background);
    border-radius: var(--radius-s);
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }

  code {
    padding: 1px 4px;
  }

  pre {
    margin: 6px 0 0;
    max-height: 180px;
    overflow: auto;
    padding: 8px;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 0.6rem;
    line-height: 1.45;
  }

  @media (max-width: 960px) {
    .ob-metrics-header,
    .ob-metrics-row {
      grid-template-columns: 1.6fr 0.8fr 0.8fr 0.8fr 0.8fr 1.4fr;
    }
  }

  @media (max-width: 900px) {
    .ob-vitals-grid,
    .ob-diagnostics-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
