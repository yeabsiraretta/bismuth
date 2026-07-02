<!--
  Panel Skeleton Template
  Usage: Copy this file as a starting point for new sidebar panel components.
  Location: src/lib/features/<feature>/components/<Feature>Panel.svelte
-->
<script lang="ts">
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/ActionButton.svelte';

  /** Panel title displayed in the header */
  export let title = 'Panel Title';
  /** Item count badge (optional) */
  export let count: number | undefined = undefined;
  /** Icon name from the icon registry */
  export let icon = 'file';

  let searchVisible = false;
  let searchQuery = '';

  function toggleSearch() {
    searchVisible = !searchVisible;
    if (!searchVisible) searchQuery = '';
  }
</script>

<div class="panel" role="region" aria-label={title}>
  <PanelHeader {icon} {title} {count}>
    <svelte:fragment slot="actions">
      <ActionButton icon="search" title="Filter" on:click={toggleSearch} />
    </svelte:fragment>
  </PanelHeader>

  {#if searchVisible}
    <div class="panel-search">
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Filter..."
        aria-label="Filter {title}"
      />
    </div>
  {/if}

  <div class="panel-body">
    <!-- Panel content goes here -->
    <slot />
  </div>
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .panel-search {
    padding: var(--spacing-xs) var(--spacing-m);
    border-bottom: 1px solid var(--color-border);
  }

  .panel-search input {
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-s);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-s) var(--spacing-m);
  }
</style>
