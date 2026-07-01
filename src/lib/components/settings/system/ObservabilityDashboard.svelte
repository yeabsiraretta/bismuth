<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { metrics, runHealthChecks, getUptime, getWebVitals } from '@/services/observability';
  import type { SystemHealth, MetricSnapshot } from '@/services/observability';
  import { logger } from '@/utils/logger/logger';
  import { LogLevel } from '@/utils/logger/logger';

  let health: SystemHealth | null = null;
  let allMetrics: MetricSnapshot[] = [];
  let vitals: Record<string, number | null> = {};
  let logCounts = { debug: 0, info: 0, warn: 0, error: 0 };
  let refreshInterval: ReturnType<typeof setInterval>;
  type Section = 'health' | 'metrics' | 'vitals' | 'logs';
  let activeSection: Section = 'health';
  let metricsFilter = '';

  const sections: { id: Section; icon: string; label: string }[] = [
    { id: 'health', icon: 'activity', label: 'Health Checks' },
    { id: 'metrics', icon: 'bar-chart-2', label: 'Metrics' },
    { id: 'vitals', icon: 'zap', label: 'Web Vitals' },
    { id: 'logs', icon: 'file-text', label: 'Logs' },
  ];

  async function refresh() {
    health = await runHealthChecks();
    allMetrics = metrics.getAll();
    vitals = getWebVitals();
    const logs = logger.getLogs();
    logCounts = {
      debug: logs.filter(l => l.level === LogLevel.DEBUG).length,
      info: logs.filter(l => l.level === LogLevel.INFO).length,
      warn: logs.filter(l => l.level === LogLevel.WARN).length,
      error: logs.filter(l => l.level >= LogLevel.ERROR).length,
    };
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

  function statusIcon(status: string): string {
    if (status === 'healthy') return 'check-circle';
    if (status === 'degraded') return 'alert-triangle';
    return 'x-circle';
  }

  function statusColor(status: string): string {
    if (status === 'healthy') return 'var(--text-success, #22c55e)';
    if (status === 'degraded') return 'var(--text-warning, #f59e0b)';
    return 'var(--text-error, #ef4444)';
  }

  function resetMetrics() {
    metrics.resetAll();
    refresh();
  }

  function exportMetrics() {
    const blob = new Blob([metrics.export()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bismuth-metrics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadLogs() {
    logger.downloadLogs();
  }

  $: filteredMetrics = metricsFilter
    ? allMetrics.filter(m => m.name.toLowerCase().includes(metricsFilter.toLowerCase()))
    : allMetrics;

  $: uptime = health ? formatUptime(health.uptime) : formatUptime(getUptime());
</script>

<div class="settings-section stack stack-md">
  <div class="section-header">
    <h3>Observability & Monitoring</h3>
    <p class="setting-hint">System health, performance metrics, and diagnostics</p>
  </div>

  <div class="overview-strip">
    <div class="overview-card" style="border-color: {health ? statusColor(health.overall) : 'var(--border-color)'}">
      <span class="overview-label">Status</span>
      <span class="overview-value" style="color: {health ? statusColor(health.overall) : 'inherit'}">{health?.overall ?? '...'}</span>
    </div>
    <div class="overview-card">
      <span class="overview-label">Uptime</span>
      <span class="overview-value">{uptime}</span>
    </div>
    <div class="overview-card">
      <span class="overview-label">Metrics</span>
      <span class="overview-value">{allMetrics.length}</span>
    </div>
    <div class="overview-card">
      <span class="overview-label">Warnings</span>
      <span class="overview-value" style="color: {logCounts.warn > 0 ? 'var(--text-warning, #f59e0b)' : 'inherit'}">{logCounts.warn}</span>
    </div>
    <div class="overview-card">
      <span class="overview-label">Errors</span>
      <span class="overview-value" style="color: {logCounts.error > 0 ? 'var(--text-error, #ef4444)' : 'inherit'}">{logCounts.error}</span>
    </div>
  </div>

  <div class="tab-bar">
    {#each sections as sec}
      <button class="tab-btn" class:active={activeSection === sec.id} on:click={() => { activeSection = sec.id; }}>
        <Icon name={sec.icon} size={14} />
        {sec.label}
      </button>
    {/each}
  </div>

  {#if activeSection === 'health'}
    <div class="setting-group">
      <div class="group-header">
        <h4>Health Checks</h4>
        <button class="btn btn-sm btn-ghost" on:click={refresh}>
          <Icon name="refresh-cw" size={14} /> Refresh
        </button>
      </div>
      {#if health}
        {#each health.checks as check}
          <div class="check-row">
            <Icon name={statusIcon(check.status)} size={16} />
            <div class="check-info">
              <span class="check-name" style="color: {statusColor(check.status)}">{check.name}</span>
              <span class="check-message">{check.message}</span>
            </div>
            <span class="check-duration">{check.durationMs}ms</span>
          </div>
        {/each}
      {:else}
        <p class="hint">Running checks...</p>
      {/if}
    </div>

  {:else if activeSection === 'metrics'}
    <div class="setting-group">
      <div class="group-header">
        <h4>Metrics ({filteredMetrics.length})</h4>
        <div class="header-actions">
          <input type="text" bind:value={metricsFilter} placeholder="Filter..." class="filter-input" />
          <button class="btn btn-sm btn-ghost" on:click={exportMetrics} title="Export">
            <Icon name="download" size={14} />
          </button>
          <button class="btn btn-sm btn-ghost" on:click={resetMetrics} title="Reset">
            <Icon name="trash-2" size={14} />
          </button>
        </div>
      </div>
      <div class="metrics-table">
        <div class="metrics-header">
          <span class="col-name">Name</span>
          <span class="col-type">Type</span>
          <span class="col-value">Value</span>
          <span class="col-extra">Details</span>
        </div>
        {#each filteredMetrics as m}
          <div class="metrics-row">
            <span class="col-name metric-name">{m.name}</span>
            <span class="col-type"><code>{m.type}</code></span>
            <span class="col-value">
              {#if m.type === 'histogram'}
                {m.avg ?? 0} avg
              {:else}
                {m.value ?? 0}
              {/if}
            </span>
            <span class="col-extra">
              {#if m.type === 'histogram'}
                n={m.count} p50={m.p50} p95={m.p95} p99={m.p99}
              {:else}
                —
              {/if}
            </span>
          </div>
        {/each}
        {#if filteredMetrics.length === 0}
          <div class="empty-row">No metrics recorded yet</div>
        {/if}
      </div>
    </div>

  {:else if activeSection === 'vitals'}
    <div class="setting-group">
      <h4>Web Vitals</h4>
      <div class="vitals-grid">
        <div class="vital-card">
          <span class="vital-label">First Contentful Paint</span>
          <span class="vital-value">{vitals.fcp != null ? `${vitals.fcp}ms` : '—'}</span>
        </div>
        <div class="vital-card">
          <span class="vital-label">Largest Contentful Paint</span>
          <span class="vital-value">{vitals.lcp != null ? `${vitals.lcp}ms` : '—'}</span>
        </div>
        <div class="vital-card">
          <span class="vital-label">Cumulative Layout Shift</span>
          <span class="vital-value">{vitals.cls != null ? vitals.cls.toFixed(3) : '—'}</span>
        </div>
        <div class="vital-card">
          <span class="vital-label">Long Tasks</span>
          <span class="vital-value">{vitals.longTaskCount ?? 0} ({vitals.longTaskTotalMs ?? 0}ms)</span>
        </div>
      </div>
    </div>

  {:else if activeSection === 'logs'}
    <div class="setting-group">
      <div class="group-header">
        <h4>Log Summary</h4>
        <button class="btn btn-sm btn-ghost" on:click={downloadLogs}>
          <Icon name="download" size={14} /> Export Logs
        </button>
      </div>
      <div class="log-summary">
        <div class="log-level-row">
          <span class="log-badge debug">DEBUG</span>
          <span class="log-count">{logCounts.debug}</span>
        </div>
        <div class="log-level-row">
          <span class="log-badge info">INFO</span>
          <span class="log-count">{logCounts.info}</span>
        </div>
        <div class="log-level-row">
          <span class="log-badge warn">WARN</span>
          <span class="log-count">{logCounts.warn}</span>
        </div>
        <div class="log-level-row">
          <span class="log-badge error">ERROR</span>
          <span class="log-count">{logCounts.error}</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .section-header { margin-bottom: var(--spacing-sm); }
  .overview-strip { display: flex; gap: var(--spacing-xs); flex-wrap: wrap; }
  .overview-card { flex: 1; min-width: 80px; padding: var(--spacing-xs) var(--spacing-sm); border: 1px solid var(--border-color); border-radius: var(--radius-sm); text-align: center; }
  .overview-label { display: block; font-size: var(--font-size-xs); color: var(--text-muted); }
  .overview-value { display: block; font-size: var(--font-size-sm); font-weight: var(--font-medium); }
  .tab-bar { display: flex; gap: 2px; border-bottom: 1px solid var(--border-color); padding-bottom: 2px; }
  .tab-btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border: none; background: transparent; color: var(--text-muted); font-size: var(--font-size-sm); cursor: pointer; border-radius: var(--radius-sm) var(--radius-sm) 0 0; transition: all 0.15s; }
  .tab-btn:hover { background: var(--background-modifier-hover); color: var(--text-primary); }
  .tab-btn.active { background: var(--background-primary-alt); color: var(--text-primary); font-weight: var(--font-medium); }
  .group-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-xs); }
  .header-actions { display: flex; align-items: center; gap: var(--spacing-xs); }
  .filter-input { padding: 2px 8px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--background-primary); color: var(--text-primary); font-size: var(--font-size-xs); width: 140px; }
  .check-row { display: flex; align-items: center; gap: var(--spacing-sm); padding: var(--spacing-xs) 0; border-bottom: 1px solid var(--border-color); }
  .check-row:last-child { border-bottom: none; }
  .check-info { flex: 1; display: flex; flex-direction: column; }
  .check-name { font-size: var(--font-size-sm); font-weight: var(--font-medium); text-transform: capitalize; }
  .check-message { font-size: var(--font-size-xs); color: var(--text-muted); }
  .check-duration { font-size: var(--font-size-xs); color: var(--text-faint); min-width: 40px; text-align: right; }
  .metrics-table { font-size: var(--font-size-xs); }
  .metrics-header, .metrics-row { display: grid; grid-template-columns: 2fr 0.5fr 0.7fr 1.5fr; gap: var(--spacing-xs); padding: 3px 0; }
  .metrics-header { font-weight: var(--font-medium); color: var(--text-muted); border-bottom: 1px solid var(--border-color); padding-bottom: var(--spacing-xs); }
  .metrics-row { border-bottom: 1px solid var(--border-color); }
  .metrics-row:last-child { border-bottom: none; }
  .metric-name { font-family: var(--font-mono, monospace); word-break: break-all; }
  .empty-row { padding: var(--spacing-sm); text-align: center; color: var(--text-faint); grid-column: 1 / -1; }
  code { background: var(--background-primary-alt); padding: 1px 4px; border-radius: 3px; font-size: var(--font-size-xs); }
  .vitals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm); }
  .vital-card { padding: var(--spacing-sm); border: 1px solid var(--border-color); border-radius: var(--radius-sm); }
  .vital-label { display: block; font-size: var(--font-size-xs); color: var(--text-muted); margin-bottom: 2px; }
  .vital-value { font-size: var(--font-size-lg, 1.1em); font-weight: var(--font-medium); }
  .log-summary { display: flex; flex-direction: column; gap: var(--spacing-xs); }
  .log-level-row { display: flex; align-items: center; gap: var(--spacing-sm); padding: var(--spacing-xs) 0; }
  .log-badge { padding: 2px 8px; border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: var(--font-medium); min-width: 50px; text-align: center; }
  .log-badge.debug { background: var(--background-primary-alt); color: var(--text-muted); }
  .log-badge.info { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
  .log-badge.warn { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
  .log-badge.error { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
  .log-count { font-size: var(--font-size-sm); font-weight: var(--font-medium); }
  .hint { font-size: var(--font-size-xs); color: var(--text-faint); }
  .btn { display: inline-flex; align-items: center; gap: 4px; padding: var(--spacing-xs) var(--spacing-sm); border: none; border-radius: var(--radius-sm); cursor: pointer; font-size: var(--font-size-sm); transition: all 0.15s; }
  .btn-ghost { background: transparent; color: var(--text-muted); }
  .btn-ghost:hover { background: var(--background-modifier-hover); color: var(--text-primary); }
  .btn-sm { padding: 2px 6px; font-size: var(--font-size-xs); }
</style>
