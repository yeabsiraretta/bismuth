<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import { onMount } from 'svelte';
  import { trackerSettings, trackerData, trackerLoading, propertyDefs, visibleCards, refreshTrackerData, setTimeFrame, addPropertyDef, startCapture } from '../stores/trackerStore';
  import type { TimeFrame, CardConfig, VisualizationType } from '../types';
  import HeatmapCard from './views/HeatmapCard.svelte';
  import ChartCard from './views/ChartCard.svelte';
  import PieCard from './views/PieCard.svelte';
  import CaptureModal from './dialogs/CaptureModal.svelte';

  let showAddProp = false;
  let newPropName = '';
  let newPropType: 'number' | 'text' | 'checkbox' | 'list' = 'number';

  onMount(() => { if ($propertyDefs.length > 0) refreshTrackerData(); });

  function handleAddProperty() {
    if (!newPropName.trim()) return;
    addPropertyDef({ name: newPropName.trim(), type: newPropType });
    newPropName = '';
    showAddProp = false;
    refreshTrackerData();
  }

  async function handleCapture() {
    const { get } = await import('svelte/store');
    const { activeNote } = await import('@/stores/vault/vault');
    const note = get(activeNote);
    if (note?.path) startCapture(note.path);
  }

  function vizComponent(viz: VisualizationType): 'heatmap' | 'pie' | 'chart' {
    if (viz === 'heatmap') return 'heatmap';
    if (viz === 'pie' || viz === 'doughnut') return 'pie';
    return 'chart';
  }

  const TIME_FRAMES: { id: TimeFrame; label: string }[] = [
    { id: 'last-7', label: '7d' }, { id: 'last-30', label: '30d' },
    { id: 'last-90', label: '90d' }, { id: 'last-365', label: '1y' },
    { id: 'this-week', label: 'Week' }, { id: 'this-month', label: 'Month' },
    { id: 'this-year', label: 'Year' }, { id: 'all', label: 'All' },
  ];
</script>

<div class="tracker-dashboard" role="tabpanel" aria-label="Life Tracker">
  <PanelHeader icon="activity" title="Life Tracker" count={$propertyDefs.length || undefined}>
    <svelte:fragment slot="actions">
      <button class="icon-btn" on:click={() => refreshTrackerData()} title="Refresh data">
        <Icon name="refresh-cw" size={14} />
      </button>
      <button class="icon-btn" on:click={handleCapture} title="Capture properties">
        <Icon name="edit-2" size={14} />
      </button>
      <button class="icon-btn" on:click={() => (showAddProp = !showAddProp)} title="Add property">
        <Icon name="plus" size={14} />
      </button>
    </svelte:fragment>
  </PanelHeader>

  <div class="toolbar">
    <div class="tf-pills">
      {#each TIME_FRAMES as tf}
        <button class="tf-pill" class:active={$trackerSettings.timeFrame === tf.id} on:click={() => { setTimeFrame(tf.id); refreshTrackerData(); }}>
          {tf.label}
        </button>
      {/each}
    </div>
    <div class="col-control">
      <label class="col-label" for="col-select">Columns</label>
      <select id="col-select" class="col-select" bind:value={$trackerSettings.columns}>
        {#each [1, 2, 3, 4, 5, 6] as n}<option value={n}>{n}</option>{/each}
      </select>
    </div>
  </div>

  {#if showAddProp}
    <div class="add-form">
      <input bind:value={newPropName} placeholder="Property name..." class="input-field" on:keydown={(e) => e.key === 'Enter' && handleAddProperty()} />
      <select bind:value={newPropType} class="type-select">
        <option value="number">Number</option>
        <option value="text">Text</option>
        <option value="checkbox">Checkbox</option>
        <option value="list">List</option>
      </select>
      <button class="btn-primary" on:click={handleAddProperty} disabled={!newPropName.trim()}>Add</button>
    </div>
  {/if}

  {#if $trackerLoading}
    <div class="empty-state"><p>Loading data...</p></div>
  {:else if $propertyDefs.length === 0}
    <div class="empty-state">
      <Icon name="activity" size={32} />
      <p>No properties tracked yet</p>
      <p class="hint">Add frontmatter properties to track (e.g. mood, weight, sleep)</p>
      <button class="btn-primary" on:click={() => (showAddProp = true)}>Add your first property</button>
    </div>
  {:else}
    <div class="card-grid" style="grid-template-columns:repeat({$trackerSettings.columns}, 1fr)">
      {#each $visibleCards as card (card.id)}
        {@const points = $trackerData.get(card.propertyName) ?? []}
        <div class="viz-card">
          {#if vizComponent(card.visualization) === 'heatmap'}
            <HeatmapCard {points} colorScheme={card.colorScheme} aggregation={card.aggregation} title={card.propertyName} />
          {:else if vizComponent(card.visualization) === 'pie'}
            <PieCard {points} visualization={card.visualization} colorScheme={card.colorScheme} title={card.propertyName} />
          {:else}
            <ChartCard
              {points} visualization={card.visualization} colorScheme={card.colorScheme}
              aggregation={card.aggregation} scale={card.scale} referenceLines={card.referenceLines}
              movingAvgWindow={card.movingAverage} showGrid={card.showGrid} showLegend={card.showLegend}
              title={card.propertyName}
            />
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<CaptureModal />

<style>
  .tracker-dashboard { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
  .toolbar { display: flex; align-items: center; gap: var(--spacing-s); padding: var(--spacing-xs) var(--spacing-s); border-bottom: 1px solid var(--border-color); flex-wrap: wrap; }
  .tf-pills { display: flex; gap: 2px; flex: 1; }
  .tf-pill { padding: 2px 8px; border: none; border-radius: var(--radius-s); background: none; color: var(--text-muted); font-size: 10px; cursor: pointer; transition: all 0.15s; }
  .tf-pill:hover { color: var(--text-normal); }
  .tf-pill.active { background: var(--interactive-accent); color: var(--text-on-accent); }
  .col-control { display: flex; align-items: center; gap: 4px; }
  .col-label { font-size: 10px; color: var(--text-muted); }
  .col-select { padding: 1px 4px; border: 1px solid var(--border-color); border-radius: var(--radius-s); background: var(--background-primary); color: var(--text-normal); font-size: 10px; }
  .add-form { display: flex; gap: var(--spacing-xs); padding: var(--spacing-s); border-bottom: 1px solid var(--border-color); }
  .input-field { flex: 1; padding: var(--spacing-xs) var(--spacing-s); border: 1px solid var(--border-color); border-radius: var(--radius-s); background: var(--background-primary); color: var(--text-normal); font-size: var(--font-ui-small); }
  .type-select { padding: var(--spacing-xs); border: 1px solid var(--border-color); border-radius: var(--radius-s); background: var(--background-primary); color: var(--text-normal); font-size: var(--font-ui-small); }
  .btn-primary { padding: var(--spacing-xs) var(--spacing-s); background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: var(--radius-s); font-size: var(--font-ui-small); cursor: pointer; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .empty-state { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-s); padding: var(--spacing-xl); color: var(--text-muted); text-align: center; }
  .hint { font-size: 11px; }
  .card-grid { display: grid; gap: var(--spacing-s); padding: var(--spacing-s); overflow-y: auto; flex: 1; align-content: start; }
  .viz-card { background: var(--background-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-m); overflow: hidden; }
</style>
