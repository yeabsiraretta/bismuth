<script lang="ts">
  import { BUILTIN_CATEGORIES } from '@/config/presets/canvas-library';
  import { builtinByCategory } from '@/features/canvas/stores';
  import BuiltinCategoryGroup from './BuiltinCategoryGroup.svelte';

  export let searchQuery = '';

  let showBuiltins = true;

  $: filteredGroups = BUILTIN_CATEGORIES.map((cat) => {
    let comps = builtinByCategory[cat] || [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      comps = comps.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return { category: cat, components: comps };
  }).filter((g) => g.components.length > 0);

  function toggleBuiltins() {
    showBuiltins = !showBuiltins;
  }
</script>

<div class="builtin-library">
  <div class="library-badge">
    <span class="badge-text">Built-in Library</span>
    <button
      class="collapse-toggle"
      class:collapsed={!showBuiltins}
      on:click={toggleBuiltins}
      aria-label={showBuiltins ? 'Collapse built-in library' : 'Expand built-in library'}
      aria-expanded={showBuiltins}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M2 4L6 8L10 4" />
      </svg>
    </button>
  </div>

  {#if showBuiltins}
    {#if filteredGroups.length === 0}
      <div class="empty-msg">No matching components</div>
    {:else}
      {#each filteredGroups as group (group.category)}
        <BuiltinCategoryGroup
          category={group.category}
          components={group.components}
        />
      {/each}
    {/if}
  {/if}
</div>

<style>
  .builtin-library {
    border-bottom: 2px solid var(--border-color);
  }

  .library-badge {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-xs) var(--spacing-m);
    background: var(--background-primary-alt);
    border-bottom: 1px solid var(--border-color);
  }

  .badge-text {
    font-size: var(--font-smallest);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--interactive-accent);
  }

  .collapse-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: var(--text-muted);
    border-radius: var(--radius-s);
    transition: transform 0.15s ease, color 0.15s;
  }

  .collapse-toggle:hover {
    color: var(--text-normal);
    background: var(--background-modifier-hover);
  }

  .collapse-toggle.collapsed svg {
    transform: rotate(-90deg);
  }

  .empty-msg {
    padding: var(--spacing-m);
    text-align: center;
    font-size: 12px;
    color: var(--text-faint);
  }
</style>
