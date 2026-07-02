<script lang="ts">
  import { topMetrics, bigrams, modularity, analyticsResult } from '../../stores/analyticsStore';

  $: nodeCount = $analyticsResult?.nodeCount ?? 0;
  $: edgeCount = $analyticsResult?.edgeCount ?? 0;
  $: clusterCount = $analyticsResult?.clusters.length ?? 0;

  let metricsView: 'centrality' | 'bigrams' = 'centrality';
</script>

<div class="metrics-panel">
  <h4 class="section-title">Network Metrics</h4>

  <div class="summary-grid">
    <div class="stat-card">
      <span class="stat-value">{nodeCount}</span>
      <span class="stat-label">Nodes</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{edgeCount}</span>
      <span class="stat-label">Edges</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{clusterCount}</span>
      <span class="stat-label">Clusters</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{$modularity.toFixed(3)}</span>
      <span class="stat-label">Modularity</span>
    </div>
  </div>

  <div class="view-toggle">
    <button
      class="toggle-btn"
      class:active={metricsView === 'centrality'}
      on:click={() => (metricsView = 'centrality')}
    >
      Centrality
    </button>
    <button
      class="toggle-btn"
      class:active={metricsView === 'bigrams'}
      on:click={() => (metricsView = 'bigrams')}
    >
      Relations
    </button>
  </div>

  {#if metricsView === 'centrality'}
    <div class="metrics-table">
      <div class="table-header">
        <span class="col-label">Concept</span>
        <span class="col-num">BC</span>
        <span class="col-num">Deg</span>
        <span class="col-num">Inf</span>
      </div>
      {#each $topMetrics as m, i (m.id)}
        <div class="table-row" class:top={i < 3}>
          <span class="col-label" title={m.id}>
            <span class="rank">{i + 1}</span>
            {m.label}
          </span>
          <span class="col-num">{m.betweenness.toFixed(3)}</span>
          <span class="col-num">{m.degree}</span>
          <span class="col-num">
            <span class="influence-bar" style="width:{Math.round(m.influence * 100)}%"></span>
            {(m.influence * 100).toFixed(0)}%
          </span>
        </div>
      {/each}
    </div>
  {:else}
    <div class="bigrams-list">
      <div class="table-header">
        <span class="col-label">Relation (Bigram)</span>
        <span class="col-num">Weight</span>
      </div>
      {#each $bigrams as bg, i (i)}
        <div class="table-row">
          <span class="col-label">
            <span class="bigram-a">{bg.a}</span>
            <span class="bigram-sep">↔</span>
            <span class="bigram-b">{bg.b}</span>
          </span>
          <span class="col-num">{bg.weight}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .metrics-panel {
    padding: var(--spacing-s);
  }
  .section-title {
    font-size: 12px;
    font-weight: 600;
    margin: 0 0 var(--spacing-s);
    color: var(--text-normal);
  }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    margin-bottom: var(--spacing-s);
  }
  .stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 4px;
    background: var(--background-secondary);
    border-radius: var(--radius-s);
  }
  .stat-value {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-normal);
    font-family: var(--font-monospace);
  }
  .stat-label {
    font-size: 8px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .view-toggle {
    display: flex;
    gap: 2px;
    margin-bottom: var(--spacing-xs);
  }
  .toggle-btn {
    flex: 1;
    padding: 3px 8px;
    border: none;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    font-size: 10px;
    cursor: pointer;
  }
  .toggle-btn.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }
  .metrics-table,
  .bigrams-list {
    font-size: 10px;
  }
  .table-header {
    display: flex;
    gap: 4px;
    padding: 3px 6px;
    color: var(--text-faint);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    font-size: 9px;
    border-bottom: 1px solid var(--border-color);
  }
  .table-row {
    display: flex;
    gap: 4px;
    padding: 3px 6px;
    border-radius: var(--radius-s);
  }
  .table-row:hover {
    background: var(--background-modifier-hover);
  }
  .table-row.top {
    font-weight: 600;
  }
  .col-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-normal);
  }
  .col-num {
    width: 48px;
    text-align: right;
    color: var(--text-muted);
    font-family: var(--font-monospace);
    position: relative;
  }
  .rank {
    display: inline-block;
    width: 16px;
    color: var(--text-faint);
  }
  .influence-bar {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 3px;
    background: var(--interactive-accent);
    border-radius: 2px;
    opacity: 0.3;
  }
  .bigram-a {
    color: var(--text-normal);
  }
  .bigram-sep {
    color: var(--text-faint);
    margin: 0 2px;
    font-size: 9px;
  }
  .bigram-b {
    color: var(--text-normal);
  }
</style>
