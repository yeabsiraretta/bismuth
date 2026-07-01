<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import EmptyState from '@/components/ui/feedback/EmptyState.svelte';
  import GraphFilter from './controls/GraphFilter.svelte';
  import GraphControlsPanel from './controls/GraphControlsPanel.svelte';
  import { openNote } from '@/appNavigation';
  import {
    loadGraphStats,
    extractTags,
    extractTypes,
    DEFAULT_GRAPH_SETTINGS,
    type GraphStats,
  } from './graphSidebarLogic';
  import type { GraphData, GraphSettings } from '../types';

  let graphData: GraphData = { nodes: [], edges: [] };
  let stats: GraphStats = { nodeCount: 0, edgeCount: 0, orphanCount: 0, tagCount: 0, typeBreakdown: {} };
  let isLoading = false;
  let selectedNode: string | null = null;

  let availableTags: string[] = [];
  let availableTypes: string[] = [];
  let filterTags: string[] = [];
  let filterTypes: string[] = [];
  let filterFolder = '';
  let filterDepth = 3;

  let graphSettings: GraphSettings = { ...DEFAULT_GRAPH_SETTINGS };
  let showFilters = true;
  let showControls = false;

  async function refresh() {
    isLoading = true;
    const result = await loadGraphStats();
    graphData = result.data;
    stats = result.stats;
    availableTags = extractTags(graphData);
    availableTypes = extractTypes(graphData);
    isLoading = false;
  }

  function handleFilter(detail: { tags: string[]; types: string[]; folder: string; depth: number }) {
    filterTags = detail.tags;
    filterTypes = detail.types;
    filterFolder = detail.folder;
    filterDepth = detail.depth;
  }

  function handleSettingsChange(s: GraphSettings) {
    graphSettings = s;
    window.dispatchEvent(new CustomEvent('graph-settings-change', { detail: s }));
  }

  function handleOpenNote(path: string) {
    selectedNode = path;
    openNote(path);
  }

  function handleOpenGraph() {
    window.dispatchEvent(new CustomEvent('open-graph-view'));
  }

  onMount(() => { refresh(); });
</script>

<div class="graph-sidebar">
  <PanelHeader icon="share-2" title="Graph" count={stats.nodeCount || undefined}>
    <svelte:fragment slot="actions">
      <ActionButton icon="maximize-2" title="Open graph view" on:click={handleOpenGraph} />
      <ActionButton icon="refresh-cw" title="Refresh" on:click={refresh} />
    </svelte:fragment>
  </PanelHeader>

  {#if isLoading}
    <div class="loading-state">
      <Icon name="loader" size={24} />
      <p>Loading graph data...</p>
    </div>
  {:else if stats.nodeCount === 0}
    <EmptyState icon="share-2" title="No graph data" description="Open a vault to visualize its knowledge graph" />
  {:else}
    <div class="graph-stats">
      <div class="stat-item">
        <span class="stat-value">{stats.nodeCount}</span>
        <span class="stat-label">Notes</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{stats.edgeCount}</span>
        <span class="stat-label">Links</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{stats.orphanCount}</span>
        <span class="stat-label">Orphans</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{stats.tagCount}</span>
        <span class="stat-label">Tags</span>
      </div>
    </div>

    {#if selectedNode}
      <div class="selected-node-info">
        <span class="section-label">Selected</span>
        <div class="selected-node-card">
          <Icon name="file-text" size={14} />
          <span class="node-name">{selectedNode.split('/').pop()?.replace('.md', '')}</span>
          <button class="open-btn" on:click={() => handleOpenNote(selectedNode || '')} title="Open note">
            <Icon name="external-link" size={12} />
          </button>
        </div>
      </div>
    {/if}

    <div class="graph-sidebar-section">
      <button class="section-toggle" on:click={() => (showFilters = !showFilters)}>
        <Icon name={showFilters ? 'chevron-down' : 'chevron-right'} size={14} />
        <span>Filters</span>
      </button>
      {#if showFilters}
        <GraphFilter
          {availableTags}
          {availableTypes}
          selectedTags={filterTags}
          selectedTypes={filterTypes}
          folderFilter={filterFolder}
          linkDepth={filterDepth}
          onFilter={handleFilter}
        />
      {/if}
    </div>

    <div class="graph-sidebar-section">
      <button class="section-toggle" on:click={() => (showControls = !showControls)}>
        <Icon name={showControls ? 'chevron-down' : 'chevron-right'} size={14} />
        <span>Display Settings</span>
      </button>
      {#if showControls}
        <GraphControlsPanel settings={graphSettings} onSettingsChange={handleSettingsChange} />
      {/if}
    </div>
  {/if}
</div>

<style>
  .graph-sidebar { display: flex; flex-direction: column; height: 100%; overflow-y: auto; }

  .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: var(--spacing-s); color: var(--text-muted); text-align: center; padding: var(--spacing-xl) var(--spacing-m); }
  .loading-state p { font-size: var(--font-ui-small); font-weight: 500; margin: 0; }

  .graph-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-xs); padding: var(--spacing-m); border-bottom: 1px solid var(--border-color); }
  .stat-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .stat-value { font-size: var(--font-size-lg); font-weight: 700; color: var(--text-normal); }
  .stat-label { font-size: var(--font-size-2xs); color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.04em; }

  .selected-node-info { padding: var(--spacing-s) var(--spacing-m); border-bottom: 1px solid var(--border-color); }
  .section-label { font-size: var(--font-size-2xs); font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; display: block; }
  .selected-node-card { display: flex; align-items: center; gap: var(--spacing-xs); padding: var(--spacing-xs) var(--spacing-s); background: var(--background-secondary); border-radius: var(--radius-s); color: var(--text-normal); font-size: var(--font-size-xs); }
  .node-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .open-btn { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; background: none; border: none; border-radius: var(--radius-s); color: var(--text-muted); cursor: pointer; }
  .open-btn:hover { background: var(--background-modifier-hover); color: var(--interactive-accent); }

  .graph-sidebar-section { border-bottom: 1px solid var(--border-color); }
  .section-toggle { display: flex; align-items: center; gap: var(--spacing-xs); width: 100%; padding: var(--spacing-s) var(--spacing-m); border: none; background: none; color: var(--text-normal); font-size: var(--font-ui-small); font-weight: 600; cursor: pointer; }
  .section-toggle:hover { background: var(--interactive-hover); }
</style>
