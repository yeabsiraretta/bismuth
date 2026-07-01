<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    clusters, selectedClusterId, modularity,
    selectCluster,
  } from '../../stores/analyticsStore';

  $: sortedClusters = $clusters;
</script>

<div class="topics-panel">
  <div class="panel-header-row">
    <h4 class="section-title">Topical Clusters</h4>
    <span class="modularity-badge" title="Graph modularity (0-1, higher = more modular)">
      Q={$modularity.toFixed(2)}
    </span>
  </div>

  {#if sortedClusters.length === 0}
    <div class="empty">No clusters detected. Run analysis on a graph first.</div>
  {:else}
    <div class="cluster-list">
      {#each sortedClusters as cluster (cluster.id)}
        <button
          class="cluster-item"
          class:selected={$selectedClusterId === cluster.id}
          on:click={() => selectCluster($selectedClusterId === cluster.id ? null : cluster.id)}
        >
          <span class="cluster-dot" style="background:{cluster.color}"></span>
          <div class="cluster-info">
            <span class="cluster-label">{cluster.label}</span>
            <span class="cluster-meta">
              {cluster.nodeIds.length} nodes · density {(cluster.density * 100).toFixed(0)}%
            </span>
          </div>
          <Icon name={$selectedClusterId === cluster.id ? 'chevron-down' : 'chevron-right'} size={12} />
        </button>

        {#if $selectedClusterId === cluster.id}
          <div class="cluster-detail">
            <div class="detail-section">
              <span class="detail-label">Top concepts</span>
              <div class="concept-pills">
                {#each cluster.topConcepts as concept}
                  <span class="concept-pill" style="border-color:{cluster.color}">{concept}</span>
                {/each}
              </div>
            </div>
            <div class="detail-stats">
              <span>Relevance: {cluster.totalRelevance.toFixed(2)}</span>
              <span>Nodes: {cluster.nodeIds.length}</span>
            </div>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .topics-panel { padding: var(--spacing-s); }
  .panel-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-s); }
  .section-title { font-size: 12px; font-weight: 600; margin: 0; color: var(--text-normal); }
  .modularity-badge { font-size: 10px; color: var(--text-muted); background: var(--background-secondary); padding: 2px 6px; border-radius: var(--radius-s); font-family: var(--font-monospace); }
  .empty { font-size: 11px; color: var(--text-muted); padding: var(--spacing-m); text-align: center; }
  .cluster-list { display: flex; flex-direction: column; gap: 2px; }
  .cluster-item { display: flex; align-items: center; gap: var(--spacing-xs); width: 100%; padding: 6px 8px; border: none; background: none; border-radius: var(--radius-s); cursor: pointer; text-align: left; color: var(--text-normal); }
  .cluster-item:hover { background: var(--background-modifier-hover); }
  .cluster-item.selected { background: var(--background-modifier-hover); }
  .cluster-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .cluster-info { flex: 1; min-width: 0; }
  .cluster-label { display: block; font-size: 11px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cluster-meta { display: block; font-size: 9px; color: var(--text-muted); }
  .cluster-detail { padding: 6px 8px 6px 28px; }
  .detail-section { margin-bottom: 6px; }
  .detail-label { font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
  .concept-pills { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 3px; }
  .concept-pill { font-size: 10px; padding: 1px 6px; border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-normal); background: var(--background-secondary); }
  .detail-stats { display: flex; gap: var(--spacing-s); font-size: 9px; color: var(--text-muted); }
</style>
