<script lang="ts">
  import SectionHeader from '@/components/ui/layout/SectionHeader.svelte';
  import ListItem from '@/components/ui/layout/ListItem.svelte';
  import EmptyState from '@/components/ui/feedback/EmptyState.svelte';

  // Replace T with your item type
  type T = { id: string; title: string; subtitle?: string };

  export let items: T[] = [];
  export let activeId: string | undefined = undefined;
  export let sectionTitle: string = 'Items';
  export let onSelect: ((item: T) => void) | undefined = undefined;
</script>

<div class="list-panel">
  <SectionHeader title={sectionTitle} count={items.length} />

  {#if items.length === 0}
    <EmptyState icon="list" title="No items" description="Items will appear here." />
  {:else}
    <div class="list-items" role="listbox">
      {#each items as item (item.id)}
        <ListItem active={activeId === item.id} on:click={() => onSelect?.(item)}>
          {item.title}
          <svelte:fragment slot="subtitle">
            {#if item.subtitle}{item.subtitle}{/if}
          </svelte:fragment>
        </ListItem>
      {/each}
    </div>
  {/if}
</div>

<style>
  .list-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .list-items {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-xs);
  }
</style>
