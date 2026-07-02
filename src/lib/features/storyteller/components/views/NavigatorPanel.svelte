<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { filteredEntities, selectEntity, activeEntity } from '../../stores/entityStore';
  import { storyPlotlines } from '../../stores/plotlineStore';
  import type { SceneEntity } from '../../types/entity';

  let search = '';
  let sortMode: 'sequence' | 'status' | 'recent' | 'words' | 'title' = 'sequence';
  let groupByAct = true;
  let pinnedScenes: Set<string> = new Set();
  let plotlineFilter: string | null = null;

  $: scenes = $filteredEntities.filter((e) => e.type === 'scene') as unknown as SceneEntity[];
  $: filtered = scenes.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (plotlineFilter) {
      const pl = $storyPlotlines.find((p) => p.id === plotlineFilter);
      if (pl && !pl.sceneIds.includes(s.id)) return false;
    }
    return true;
  });
  $: sorted = sortScenes(filtered, sortMode);
  $: totalWords = scenes.reduce((s, sc) => s + (sc.wordCount ?? 0), 0);
  $: doneCount = scenes.filter((s) => s.status === 'final').length;
  $: progress = scenes.length > 0 ? doneCount / scenes.length : 0;

  function sortScenes(list: SceneEntity[], mode: string): SceneEntity[] {
    const arr = [...list];
    switch (mode) {
      case 'title':
        return arr.sort((a, b) => a.name.localeCompare(b.name));
      case 'words':
        return arr.sort((a, b) => (b.wordCount ?? 0) - (a.wordCount ?? 0));
      case 'status':
        return arr.sort((a, b) => a.status.localeCompare(b.status));
      default:
        return arr.sort((a, b) => a.sortOrder - b.sortOrder);
    }
  }

  function togglePin(id: string) {
    const next = new Set(pinnedScenes);
    next.has(id) ? next.delete(id) : next.add(id);
    pinnedScenes = next;
  }

  const STATUS_COLORS: Record<string, string> = {
    outline: '#6b7280',
    draft: '#3b82f6',
    revision: '#f59e0b',
    final: '#10b981',
    cut: '#ef4444',
  };
</script>

<div class="nv-panel">
  <div class="nv-header">
    <h3>Navigator</h3>
    <span class="nv-count">{filtered.length}/{scenes.length}</span>
  </div>

  <div class="nv-toolbar">
    <input class="nv-search" bind:value={search} placeholder="Search scenes…" />
    <select class="nv-sort" bind:value={sortMode}>
      <option value="sequence">Sequence</option>
      <option value="title">Title</option>
      <option value="status">Status</option>
      <option value="words">Words</option>
    </select>
  </div>

  {#if $storyPlotlines.length > 0}
    <div class="nv-plotline-filter">
      <button
        class="nv-pl-btn"
        class:active={plotlineFilter === null}
        on:click={() => {
          plotlineFilter = null;
        }}>All</button
      >
      {#each $storyPlotlines as pl (pl.id)}
        <button
          class="nv-pl-btn"
          class:active={plotlineFilter === pl.id}
          on:click={() => {
            plotlineFilter = pl.id;
          }}
        >
          <span class="nv-pl-dot" style="background: {pl.color}"></span>
          {pl.name} ({pl.sceneIds.length})
        </button>
      {/each}
    </div>
  {/if}

  <div class="nv-progress-bar">
    <div class="nv-progress-fill" style="width: {progress * 100}%"></div>
    <span class="nv-progress-text">{Math.round(progress * 100)}% complete</span>
  </div>

  {#if pinnedScenes.size > 0}
    <div class="nv-pinned">
      <div class="nv-pinned-label"><Icon name="star" size={11} /> Pinned</div>
      {#each sorted.filter((s) => pinnedScenes.has(s.id)) as scene (scene.id)}
        <button class="nv-scene pinned" on:click={() => selectEntity(scene.id)}>
          <span class="nv-status-dot" style="background: {STATUS_COLORS[scene.status] ?? '#666'}"
          ></span>
          <span class="nv-scene-name">{scene.name}</span>
        </button>
      {/each}
    </div>
  {/if}

  <div class="nv-list">
    {#each sorted as scene (scene.id)}
      <div class="nv-scene-row" class:active={$activeEntity?.id === scene.id}>
        <button class="nv-scene" on:click={() => selectEntity(scene.id)}>
          <span class="nv-status-dot" style="background: {STATUS_COLORS[scene.status] ?? '#666'}"
          ></span>
          <span class="nv-scene-name">{scene.name}</span>
          {#if scene.wordCount}<span class="nv-scene-wc">{scene.wordCount}</span>{/if}
        </button>
        <button
          class="nv-pin"
          class:is-pinned={pinnedScenes.has(scene.id)}
          on:click={() => togglePin(scene.id)}
          title={pinnedScenes.has(scene.id) ? 'Unpin' : 'Pin'}
        >
          <Icon name="star" size={11} />
        </button>
      </div>
    {/each}
    {#if sorted.length === 0}
      <div class="nv-empty">No scenes match your filters.</div>
    {/if}
  </div>

  <div class="nv-footer">
    <span>{totalWords.toLocaleString()} words total</span>
  </div>
</div>

<style>
  .nv-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .nv-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--background-modifier-border, #333);
  }
  .nv-header h3 {
    margin: 0;
    font-size: 14px;
  }
  .nv-count {
    font-size: 11px;
    opacity: 0.5;
  }
  .nv-toolbar {
    display: flex;
    gap: 6px;
    padding: 8px 14px;
    border-bottom: 1px solid var(--background-modifier-border, #333);
  }
  .nv-search {
    flex: 1;
    padding: 5px 8px;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 4px;
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: 12px;
  }
  .nv-sort {
    padding: 4px 6px;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 4px;
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: 11px;
  }
  .nv-plotline-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 6px 14px;
    border-bottom: 1px solid var(--background-modifier-border, #333);
  }
  .nv-pl-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 10px;
    background: none;
    color: var(--text-normal);
    cursor: pointer;
    font-size: 10px;
  }
  .nv-pl-btn.active {
    background: var(--interactive-accent, #7c3aed);
    color: #fff;
    border-color: transparent;
  }
  .nv-pl-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .nv-progress-bar {
    position: relative;
    height: 18px;
    margin: 0 14px;
    background: var(--background-modifier-border, #333);
    border-radius: 3px;
    overflow: hidden;
  }
  .nv-progress-fill {
    height: 100%;
    background: var(--interactive-accent, #7c3aed);
    transition: width 0.3s;
  }
  .nv-progress-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #fff;
  }
  .nv-pinned {
    padding: 6px 14px;
    border-bottom: 1px solid var(--background-modifier-border, #333);
  }
  .nv-pinned-label {
    font-size: 10px;
    opacity: 0.5;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
  }
  .nv-list {
    flex: 1;
    overflow-y: auto;
  }
  .nv-scene-row {
    display: flex;
    align-items: center;
    padding-right: 6px;
    border-bottom: 1px solid var(--background-modifier-border, #2a2a2a);
  }
  .nv-scene-row.active {
    background: var(--background-secondary-alt, #333);
  }
  .nv-scene-row:hover {
    background: var(--background-modifier-hover, #2a2a2a);
  }
  .nv-scene {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border: none;
    background: none;
    color: var(--text-normal);
    cursor: pointer;
    text-align: left;
    font-size: 12px;
  }
  .nv-scene.pinned {
    padding: 4px 6px;
    font-size: 11px;
  }
  .nv-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .nv-scene-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .nv-scene-wc {
    font-size: 10px;
    opacity: 0.4;
  }
  .nv-pin {
    border: none;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    opacity: 0;
    padding: 4px;
  }
  .nv-pin.is-pinned {
    opacity: 1;
    color: #f59e0b;
  }
  .nv-scene-row:hover .nv-pin {
    opacity: 1;
  }
  .nv-empty {
    text-align: center;
    padding: 20px;
    opacity: 0.4;
    font-size: 12px;
  }
  .nv-footer {
    padding: 6px 14px;
    border-top: 1px solid var(--background-modifier-border, #333);
    font-size: 11px;
    opacity: 0.5;
  }
</style>
