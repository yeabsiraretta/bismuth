<script lang="ts">
  import { openNote } from '@/ui/panel-actions';
  import Panel from '@/ui/panel.svelte';
  import BIcon from '@/ui/b-icon.svelte';
  import {
    getAllPortentObjects,
    findObjectsBelongingTo,
  } from '@/hubs/knowledge/services/portent-service';
  import {
    PORTENT_TYPES,
    LIFECYCLE_STATES,
    getTypeMeta,
    type PortentType,
    type LifecycleState,
    type PortentObject,
  } from '@/hubs/knowledge/types/portent-types';

  let typeFilter = $state<PortentType | 'all'>('all');
  let lifecycleFilter = $state<LifecycleState | 'all'>('all');
  let search = $state('');
  let expandedItem = $state<string | null>(null);

  let all = $derived(getAllPortentObjects());
  let filtered = $derived(
    all
      .filter((o) => typeFilter === 'all' || o.type === typeFilter)
      .filter((o) => lifecycleFilter === 'all' || o.lifecycle === lifecycleFilter)
      .filter((o) => !search || o.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.title.localeCompare(b.title))
  );

  let typeCounts = $derived(() => {
    const counts: Record<string, number> = {};
    for (const o of all) counts[o.type] = (counts[o.type] ?? 0) + 1;
    return counts;
  });

  function toggleExpand(path: string) {
    expandedItem = expandedItem === path ? null : path;
  }

  function childrenOf(obj: PortentObject): PortentObject[] {
    return findObjectsBelongingTo(obj.title);
  }

  function typeLabel(t: PortentType): string {
    return getTypeMeta(t).label;
  }

  function lifecycleColor(lc: LifecycleState): string {
    if (lc === 'captured') return 'var(--color-accent)';
    if (lc === 'organized') return 'var(--color-text-muted)';
    return 'var(--color-text-subtle)';
  }

  const TYPE_ICONS: Record<PortentType, string> = {
    project: 'folder',
    operation: 'refresh',
    responsibility: 'shield',
    task: 'checkCircle',
    event: 'calendar',
    note: 'fileText',
    topic: 'hash',
    person: 'user',
  };
</script>

<Panel title="Portent">
  {#snippet badge()}<span class="panel-badge">{filtered.length}</span>{/snippet}
  <input type="text" bind:value={search} placeholder="Search objects…" class="pt-search" />
  <div class="pt-filters">
    <select class="pt-select" bind:value={typeFilter}>
      <option value="all">All types</option>
      {#each PORTENT_TYPES as t (t)}
        <option value={t}>{typeLabel(t)} ({typeCounts()[t] ?? 0})</option>
      {/each}
    </select>
    <select class="pt-select" bind:value={lifecycleFilter}>
      <option value="all">All states</option>
      {#each LIFECYCLE_STATES as lc (lc)}
        <option value={lc}>{lc}</option>
      {/each}
    </select>
  </div>
  {#if filtered.length === 0}
    <p class="panel-empty">
      {#if all.length === 0}
        No Portent objects found. Add <code>type: project</code> (or task, note, etc.) to note frontmatter.
      {:else}
        No matches for current filters.
      {/if}
    </p>
  {:else}
    <ul class="pt-list">
      {#each filtered as obj (obj.path)}
        {@const children = expandedItem === obj.path ? childrenOf(obj) : []}
        <li class="pt-item">
          <button class="pt-row" onclick={() => toggleExpand(obj.path)}>
            <BIcon name={TYPE_ICONS[obj.type]} size={14} />
            <span class="pt-title">{obj.title}</span>
            <span class="pt-type">{obj.type}</span>
            <span class="pt-lifecycle" style="color:{lifecycleColor(obj.lifecycle)}"
              >{obj.lifecycle}</span
            >
          </button>
          {#if expandedItem === obj.path}
            <div class="pt-detail">
              <button class="pt-open" onclick={() => openNote(obj.path)}>Open Note →</button>
              {#if obj.tags.length > 0}
                <div class="pt-tags">{obj.tags.map((t) => `#${t}`).join(' ')}</div>
              {/if}
              {#if obj.belongsTo.length > 0}
                <div class="pt-rel">↳ belongs to: {obj.belongsTo.join(', ')}</div>
              {/if}
              {#if obj.relatedTo.length > 0}
                <div class="pt-rel">⟷ related to: {obj.relatedTo.join(', ')}</div>
              {/if}
              {#if children.length > 0}
                <div class="pt-children">
                  <span class="pt-children-label"
                    >{children.length} child{children.length > 1 ? 'ren' : ''}:</span
                  >
                  {#each children.slice(0, 5) as child (child.path)}
                    <button class="pt-child-link" onclick={() => openNote(child.path)}
                      >{child.title}</button
                    >
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</Panel>

<style>
  .pt-search {
    width: 100%;
    padding: 5px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.75rem;
    outline: none;
    margin-bottom: 4px;
  }
  .pt-search:focus {
    border-color: var(--color-accent);
  }
  .pt-filters {
    display: flex;
    gap: 4px;
    margin-bottom: 6px;
  }
  .pt-select {
    flex: 1;
    padding: 3px 4px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.68rem;
  }
  .pt-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .pt-item {
    border-bottom: 1px solid var(--color-border);
  }
  .pt-row {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 5px 4px;
    border: none;
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    font-size: 0.73rem;
    text-align: left;
  }
  .pt-row:hover {
    background: var(--color-surface-hover);
  }
  .pt-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pt-type {
    font-size: 0.58rem;
    color: var(--color-text-subtle);
    text-transform: uppercase;
  }
  .pt-lifecycle {
    font-size: 0.58rem;
  }
  .pt-detail {
    padding: 4px 8px 6px 22px;
  }
  .pt-open {
    border: none;
    background: none;
    color: var(--color-accent);
    font-size: 0.7rem;
    cursor: pointer;
    padding: 0;
    margin-bottom: 4px;
  }
  .pt-open:hover {
    text-decoration: underline;
  }
  .pt-tags {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    margin-bottom: 2px;
  }
  .pt-rel {
    font-size: 0.65rem;
    color: var(--color-text-subtle);
    margin-bottom: 2px;
  }
  .pt-children {
    margin-top: 4px;
  }
  .pt-children-label {
    font-size: 0.62rem;
    color: var(--color-text-muted);
  }
  .pt-child-link {
    border: none;
    background: none;
    color: var(--color-accent);
    font-size: 0.65rem;
    cursor: pointer;
    padding: 0;
    margin-left: 4px;
  }
  .pt-child-link:hover {
    text-decoration: underline;
  }
</style>
