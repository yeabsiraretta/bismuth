<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import TopicsPanel from './TopicsPanel.svelte';
  import GapsPanel from './GapsPanel.svelte';
  import MetricsPanel from './MetricsPanel.svelte';
  import {
    analyticsTab,
    analyticsLoading,
    analyticsResult,
    setAnalyticsTab,
    runAnalysis,
    clearAnalytics,
    analyticsSettings,
    updateAnalyticsSettings,
  } from '../../stores/analyticsStore';
  import type { GraphNode, GraphEdge } from '../../types';

  export let nodes: GraphNode[] = [];
  export let edges: GraphEdge[] = [];

  type Tab = 'topics' | 'gaps' | 'metrics';
  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'topics', label: 'Topics', icon: 'layers' },
    { id: 'gaps', label: 'Gaps', icon: 'zap' },
    { id: 'metrics', label: 'Metrics', icon: 'activity' },
  ];

  function handleAnalyze() {
    runAnalysis(nodes, edges);
  }

  $: hasResult = $analyticsResult !== null;
  $: stale =
    hasResult &&
    ($analyticsResult!.nodeCount !== nodes.length || $analyticsResult!.edgeCount !== edges.length);
</script>

<div class="analytics-view">
  <PanelHeader icon="activity" title="Graph Analytics">
    <svelte:fragment slot="actions">
      <button
        class="icon-btn"
        on:click={handleAnalyze}
        disabled={$analyticsLoading}
        title="Run analysis"
      >
        <Icon name={$analyticsLoading ? 'loader' : 'play'} size={14} />
      </button>
      {#if hasResult}
        <button class="icon-btn" on:click={clearAnalytics} title="Clear results">
          <Icon name="x" size={14} />
        </button>
      {/if}
    </svelte:fragment>
  </PanelHeader>

  {#if !hasResult}
    <div class="empty-state">
      <Icon name="activity" size={28} />
      <p class="empty-title">Advanced Graph Analytics</p>
      <p class="empty-desc">
        Detect topical clusters, find structural gaps, and compute network science metrics on your
        knowledge graph.
      </p>
      <button
        class="analyze-btn"
        on:click={handleAnalyze}
        disabled={$analyticsLoading || nodes.length === 0}
      >
        {$analyticsLoading ? 'Analyzing...' : `Analyze ${nodes.length} nodes`}
      </button>

      <div class="settings-compact">
        <label class="setting-row">
          <span>Concept mode</span>
          <select
            value={$analyticsSettings.conceptMode}
            on:change={(e) =>
              updateAnalyticsSettings({ conceptMode: e.currentTarget.value as any })}
          >
            <option value="wikilinks-and-concepts">Wiki Links + Concepts</option>
            <option value="wikilinks-only">Wiki Links Only</option>
          </select>
        </label>
        <label class="setting-row">
          <span>Max clusters</span>
          <input
            type="number"
            min="2"
            max="20"
            value={$analyticsSettings.maxClusters}
            on:change={(e) =>
              updateAnalyticsSettings({ maxClusters: parseInt(e.currentTarget.value) || 8 })}
          />
        </label>
      </div>
    </div>
  {:else}
    {#if stale}
      <div class="stale-banner">
        <Icon name="alert-triangle" size={12} />
        <span>Graph changed. Re-run analysis for updated results.</span>
        <button class="rerun-btn" on:click={handleAnalyze}>Re-run</button>
      </div>
    {/if}

    <div class="tab-bar">
      {#each TABS as tab}
        <button
          class="tab-btn"
          class:active={$analyticsTab === tab.id}
          on:click={() => setAnalyticsTab(tab.id)}
        >
          <Icon name={tab.icon} size={11} />
          {tab.label}
        </button>
      {/each}
    </div>

    <div class="tab-content">
      {#if $analyticsTab === 'topics'}
        <TopicsPanel />
      {:else if $analyticsTab === 'gaps'}
        <GapsPanel />
      {:else}
        <MetricsPanel />
      {/if}
    </div>
  {/if}
</div>

<style>
  .analytics-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-xl) var(--spacing-m);
    text-align: center;
    color: var(--text-muted);
  }
  .empty-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-normal);
    margin: 0;
  }
  .empty-desc {
    font-size: 11px;
    margin: 0;
    max-width: 280px;
  }
  .analyze-btn {
    padding: var(--spacing-xs) var(--spacing-m);
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-s);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .analyze-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .settings-compact {
    width: 100%;
    max-width: 260px;
    margin-top: var(--spacing-s);
  }
  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 10px;
    color: var(--text-muted);
    padding: 3px 0;
  }
  .setting-row select,
  .setting-row input {
    font-size: 10px;
    padding: 2px 4px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
  }
  .setting-row input[type='number'] {
    width: 48px;
    text-align: center;
  }
  .stale-banner {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: rgba(249, 115, 22, 0.1);
    color: #f97316;
    font-size: 10px;
    border-bottom: 1px solid rgba(249, 115, 22, 0.2);
  }
  .rerun-btn {
    margin-left: auto;
    padding: 2px 8px;
    background: #f97316;
    color: white;
    border: none;
    border-radius: var(--radius-s);
    font-size: 9px;
    cursor: pointer;
  }
  .tab-bar {
    display: flex;
    gap: 2px;
    padding: var(--spacing-xs) var(--spacing-s);
    border-bottom: 1px solid var(--border-color);
  }
  .tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 4px 8px;
    border: none;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    font-size: 10px;
    cursor: pointer;
  }
  .tab-btn.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }
  .tab-content {
    flex: 1;
    overflow-y: auto;
  }
</style>
