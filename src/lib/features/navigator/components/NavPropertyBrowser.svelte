<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { notes } from '@/stores/vault/vault';
  import {
    selectedProperty,
    selectProperty,
    type PropertySelection,
  } from '../stores/navigatorActions';
  import type { Note } from '@/types/data/vault';

  interface PropertyGroup {
    key: string;
    values: Map<string, number>;
    totalCount: number;
  }

  let expandedKeys = new Set<string>();
  let filterText = '';

  $: propertyGroups = buildPropertyGroups($notes, filterText);

  function buildPropertyGroups(allNotes: Note[], filter: string): PropertyGroup[] {
    const groups = new Map<string, Map<string, number>>();

    for (const note of allNotes) {
      if (!note.frontmatter) continue;
      for (const [key, val] of Object.entries(note.frontmatter)) {
        if (key === 'tags' || key === 'position') continue;
        if (!groups.has(key)) groups.set(key, new Map());
        const valMap = groups.get(key)!;
        const strVal = formatValue(val);
        valMap.set(strVal, (valMap.get(strVal) || 0) + 1);
      }
    }

    let result: PropertyGroup[] = Array.from(groups.entries()).map(([key, values]) => ({
      key,
      values,
      totalCount: Array.from(values.values()).reduce((a, b) => a + b, 0),
    }));

    if (filter) {
      const lower = filter.toLowerCase();
      result = result.filter(
        (g) =>
          g.key.toLowerCase().includes(lower) ||
          Array.from(g.values.keys()).some((v) => v.toLowerCase().includes(lower))
      );
    }

    return result.sort((a, b) => a.key.localeCompare(b.key));
  }

  function formatValue(val: unknown): string {
    if (val === null || val === undefined) return '(empty)';
    if (Array.isArray(val)) return val.join(', ');
    return String(val);
  }

  function toggleExpand(key: string) {
    if (expandedKeys.has(key)) expandedKeys.delete(key);
    else expandedKeys.add(key);
    expandedKeys = expandedKeys;
  }

  function handleKeyClick(key: string) {
    selectProperty(key);
  }

  function handleValueClick(key: string, value: string) {
    selectProperty(`${key}=${value}`);
  }

  function handleKeydown(e: KeyboardEvent, key: string, value?: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (value !== undefined) handleValueClick(key, value);
      else handleKeyClick(key);
    }
    if (e.key === 'ArrowRight' && !value && !expandedKeys.has(key)) {
      e.preventDefault();
      toggleExpand(key);
    }
    if (e.key === 'ArrowLeft' && !value && expandedKeys.has(key)) {
      e.preventDefault();
      toggleExpand(key);
    }
  }

  function isKeySelected(key: string, sel: PropertySelection | null): boolean {
    return sel !== null && sel.key === key && sel.value === undefined;
  }

  function isValueSelected(key: string, value: string, sel: PropertySelection | null): boolean {
    return sel !== null && sel.key === key && sel.value === value;
  }
</script>

<div class="property-browser">
  <div class="property-header">
    <input
      class="property-filter"
      type="text"
      placeholder="Filter properties..."
      bind:value={filterText}
    />
  </div>

  {#if propertyGroups.length === 0}
    <div class="empty-state">
      <Icon name="sliders" size={16} />
      <p>{filterText ? 'No matches' : 'No properties found'}</p>
    </div>
  {:else}
    <div class="property-list" role="tree" aria-label="Properties">
      {#each propertyGroups as group (group.key)}
        {@const isExpanded = expandedKeys.has(group.key)}
        {@const keySelected = isKeySelected(group.key, $selectedProperty)}
        <div
          class="prop-item"
          class:selected={keySelected}
          role="treeitem"
          tabindex="0"
          aria-expanded={isExpanded}
          aria-selected={keySelected}
          on:click={() => handleKeyClick(group.key)}
          on:keydown={(e) => handleKeydown(e, group.key)}
        >
          <button
            class="expand-btn"
            on:click|stopPropagation={() => toggleExpand(group.key)}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size={12} />
          </button>
          <Icon name="key" size={12} />
          <span class="prop-key-name">{group.key}</span>
          <span class="prop-badge">{group.totalCount}</span>
        </div>

        {#if isExpanded}
          {#each Array.from(group.values.entries()).sort( ([a], [b]) => a.localeCompare(b) ) as [value, count] (value)}
            {@const valSelected = isValueSelected(group.key, value, $selectedProperty)}
            <div
              class="prop-item prop-value-item"
              class:selected={valSelected}
              role="treeitem"
              tabindex="0"
              aria-selected={valSelected}
              on:click|stopPropagation={() => handleValueClick(group.key, value)}
              on:keydown={(e) => handleKeydown(e, group.key, value)}
            >
              <span class="expand-spacer"></span>
              <span class="expand-spacer"></span>
              <span class="prop-value-text">{value}</span>
              <span class="prop-badge">{count}</span>
            </div>
          {/each}
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .property-browser {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .property-header {
    padding: 4px 8px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--border-color);
  }

  .property-filter {
    width: 100%;
    padding: 4px 6px;
    font-size: 11px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    outline: none;
  }

  .property-filter:focus {
    border-color: var(--interactive-accent);
  }

  .property-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px;
  }

  .prop-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 4px;
    border-radius: var(--radius-s);
    cursor: pointer;
    font-size: 12px;
    color: var(--text-normal);
    user-select: none;
  }

  .prop-item:hover {
    background: var(--interactive-hover);
  }

  .prop-item.selected {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .prop-value-item {
    padding-left: 8px;
  }

  .expand-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: none;
    background: none;
    color: inherit;
    cursor: pointer;
    border-radius: var(--radius-s);
    flex-shrink: 0;
  }

  .expand-btn:hover {
    background: var(--background-modifier-hover);
  }

  .expand-spacer {
    width: 16px;
    flex-shrink: 0;
  }

  .prop-key-name {
    flex: 1;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .prop-value-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 11px;
    color: var(--text-muted);
  }

  .selected .prop-value-text {
    color: var(--text-on-accent);
    opacity: 0.85;
  }

  .prop-badge {
    font-size: 10px;
    color: var(--text-faint);
    flex-shrink: 0;
    min-width: 16px;
    text-align: right;
  }

  .selected .prop-badge {
    color: var(--text-on-accent);
    opacity: 0.7;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
    gap: 8px;
    font-size: 12px;
  }
</style>
