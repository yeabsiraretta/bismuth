<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import {
    campaigns, activeCampaign, activeCampaignId,
    campaignElements, activeElementId,
    createNewCampaign, selectCampaign, removeCampaign,
    createNewElement, selectElement, removeElement,
  } from '../stores/rpgStore';
  import { ELEMENT_META, ELEMENT_TYPE_ORDER, NARRATIVE_TYPES } from '../types/elementMeta';
  import type { ElementType, RpgElement } from '../types';

  let showNewCampaign = false;
  let newCampaignName = '';
  let newElementType: ElementType = 'adventure';
  let newElementName = '';
  let showNewElement = false;
  let expandedTypes = new Set<ElementType>(['adventure', 'session', 'npc', 'location']);

  function handleCreateCampaign() {
    if (!newCampaignName.trim()) return;
    createNewCampaign(newCampaignName.trim());
    newCampaignName = '';
    showNewCampaign = false;
  }

  function handleCreateElement() {
    if (!newElementName.trim()) return;
    const parentId = NARRATIVE_TYPES.includes(newElementType) ? null : null;
    createNewElement(newElementType, newElementName.trim(), parentId);
    newElementName = '';
    showNewElement = false;
  }

  function toggleType(type: ElementType) {
    if (expandedTypes.has(type)) expandedTypes.delete(type);
    else expandedTypes.add(type);
    expandedTypes = new Set(expandedTypes);
  }

  function groupByType(els: RpgElement[]): Map<ElementType, RpgElement[]> {
    const map = new Map<ElementType, RpgElement[]>();
    for (const t of ELEMENT_TYPE_ORDER) {
      const items = els.filter((e) => e.type === t);
      if (items.length > 0) map.set(t, items);
    }
    return map;
  }

  $: grouped = groupByType($campaignElements);
</script>

<div class="rpg-panel">
  <PanelHeader icon="shield">
    <svelte:fragment slot="title">
      <h3 class="panel-header-title">RPG Manager</h3>
    </svelte:fragment>
    <svelte:fragment slot="actions">
      <button class="rpg-btn-sm" on:click={() => (showNewCampaign = !showNewCampaign)} title="New Campaign">
        <Icon name="plus" size={13} />
      </button>
    </svelte:fragment>
  </PanelHeader>

  <div class="rpg-body">
    {#if $campaigns.length === 0 && !showNewCampaign}
      <div class="rpg-empty">
        <Icon name="shield" size={32} color="var(--text-faint)" />
        <p>No campaigns yet</p>
        <button class="rpg-btn" on:click={() => (showNewCampaign = true)}>Create Campaign</button>
      </div>
    {/if}

    {#if showNewCampaign}
      <div class="rpg-form">
        <input bind:value={newCampaignName} placeholder="Campaign name..." on:keydown={(e) => e.key === 'Enter' && handleCreateCampaign()} />
        <div class="rpg-form-actions">
          <button class="rpg-btn" on:click={handleCreateCampaign}>Create</button>
          <button class="rpg-btn-ghost" on:click={() => (showNewCampaign = false)}>Cancel</button>
        </div>
      </div>
    {/if}

    {#if $campaigns.length > 0}
      <div class="rpg-campaign-select">
        <select bind:value={$activeCampaignId} on:change={() => $activeCampaignId && selectCampaign($activeCampaignId)}>
          <option value={null}>Select campaign...</option>
          {#each $campaigns as c}
            <option value={c.id}>{c.name}</option>
          {/each}
        </select>
      </div>
    {/if}

    {#if $activeCampaign}
      <div class="rpg-actions-bar">
        <button class="rpg-btn-sm" on:click={() => (showNewElement = !showNewElement)} title="New Element">
          <Icon name="plus" size={12} /> New
        </button>
        <button class="rpg-btn-sm danger" on:click={() => $activeCampaignId && removeCampaign($activeCampaignId)} title="Delete Campaign">
          <Icon name="trash-2" size={12} />
        </button>
      </div>

      {#if showNewElement}
        <div class="rpg-form">
          <select bind:value={newElementType}>
            {#each ELEMENT_TYPE_ORDER.filter(t => t !== 'campaign') as t}
              <option value={t}>{ELEMENT_META[t].label}</option>
            {/each}
          </select>
          <input bind:value={newElementName} placeholder="{ELEMENT_META[newElementType].label} name..." on:keydown={(e) => e.key === 'Enter' && handleCreateElement()} />
          <div class="rpg-form-actions">
            <button class="rpg-btn" on:click={handleCreateElement}>Create</button>
            <button class="rpg-btn-ghost" on:click={() => (showNewElement = false)}>Cancel</button>
          </div>
        </div>
      {/if}

      <div class="rpg-elements-tree">
        {#each [...grouped.entries()] as [type, items]}
          {@const meta = ELEMENT_META[type]}
          <div class="rpg-type-group">
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="rpg-type-header" on:click={() => toggleType(type)} on:keydown={(e) => e.key === 'Enter' && toggleType(type)}>
              <span class="rpg-chevron" class:expanded={expandedTypes.has(type)}>
                <Icon name="chevron-right" size={12} />
              </span>
              <Icon name={meta.icon} size={13} color={meta.color} />
              <span class="rpg-type-label">{meta.pluralLabel}</span>
              <span class="rpg-type-count">{items.length}</span>
            </div>
            {#if expandedTypes.has(type)}
              <div class="rpg-type-items">
                {#each items.sort((a, b) => a.sortOrder - b.sortOrder) as el}
                  <button
                    class="rpg-element-item"
                    class:active={$activeElementId === el.id}
                    on:click={() => selectElement(el.id)}
                  >
                    <span class="rpg-el-dot" style="background: {meta.color}"></span>
                    <span class="rpg-el-name">{el.name}</span>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .rpg-panel { display: flex; flex-direction: column; height: 100%; }
  .rpg-body { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 8px; }
  .rpg-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px 12px; color: var(--text-muted); text-align: center; }
  .rpg-empty p { margin: 0; font-size: 0.8rem; }
  .rpg-form { display: flex; flex-direction: column; gap: 6px; padding: 8px; background: var(--background-secondary); border-radius: var(--radius-s); }
  .rpg-form input, .rpg-form select { font-size: 0.8rem; padding: 5px 8px; border: 1px solid var(--border-color); border-radius: var(--radius-s); background: var(--background-primary); color: var(--text-normal); }
  .rpg-form-actions { display: flex; gap: 4px; }
  .rpg-btn { font-size: 0.75rem; padding: 4px 10px; border-radius: var(--radius-s); border: none; background: var(--interactive-accent); color: #fff; cursor: pointer; }
  .rpg-btn:hover { opacity: 0.9; }
  .rpg-btn-ghost { font-size: 0.75rem; padding: 4px 10px; border-radius: var(--radius-s); border: 1px solid var(--border-color); background: none; color: var(--text-muted); cursor: pointer; }
  .rpg-btn-sm { display: flex; align-items: center; gap: 3px; font-size: 0.7rem; padding: 3px 6px; border-radius: var(--radius-s); border: 1px solid var(--border-color); background: var(--background-primary); color: var(--text-muted); cursor: pointer; }
  .rpg-btn-sm:hover { background: var(--background-modifier-hover); color: var(--text-normal); }
  .rpg-btn-sm.danger:hover { color: var(--text-error); border-color: var(--text-error); }
  .rpg-campaign-select select { width: 100%; font-size: 0.8rem; padding: 5px 8px; border: 1px solid var(--border-color); border-radius: var(--radius-s); background: var(--background-primary); color: var(--text-normal); }
  .rpg-actions-bar { display: flex; gap: 4px; justify-content: flex-end; }
  .rpg-elements-tree { display: flex; flex-direction: column; }
  .rpg-type-group { border-bottom: 1px solid var(--border-color); }
  .rpg-type-header { display: flex; align-items: center; gap: 6px; padding: 6px 4px; cursor: pointer; user-select: none; font-size: 0.78rem; color: var(--text-muted); }
  .rpg-type-header:hover { color: var(--text-normal); }
  .rpg-type-label { flex: 1; font-weight: 600; }
  .rpg-type-count { font-size: 0.65rem; background: var(--background-modifier-hover); padding: 0 5px; border-radius: 8px; }
  .rpg-chevron { transition: transform 0.15s ease; display: flex; }
  .rpg-chevron.expanded { transform: rotate(90deg); }
  .rpg-type-items { padding-left: 12px; }
  .rpg-element-item { display: flex; align-items: center; gap: 6px; width: 100%; padding: 4px 6px; font-size: 0.78rem; border: none; background: none; color: var(--text-normal); cursor: pointer; border-radius: var(--radius-s); text-align: left; }
  .rpg-element-item:hover { background: var(--background-modifier-hover); }
  .rpg-element-item.active { background: var(--background-modifier-active-hover, var(--background-modifier-hover)); color: var(--interactive-accent); }
  .rpg-el-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .rpg-el-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
