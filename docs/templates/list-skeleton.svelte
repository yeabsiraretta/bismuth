<!--
  List Skeleton Template
  Usage: Copy this file as a starting point for scrollable list components.
  Location: src/lib/features/<feature>/components/<Feature>List.svelte
-->
<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  /** Items to render in the list */
  export let items: { id: string; label: string; icon?: string }[] = [];
  /** Whether list is in a loading state */
  export let loading = false;
  /** Currently selected item ID */
  export let selectedId: string | undefined = undefined;
  /** Empty state message */
  export let emptyMessage = 'No items found';

  function handleSelect(id: string) {
    selectedId = id;
  }

  function handleKeydown(e: KeyboardEvent, index: number) {
    if (e.key === 'ArrowDown' && index < items.length - 1) {
      e.preventDefault();
      const next = e.currentTarget as HTMLElement;
      (next.nextElementSibling as HTMLElement)?.focus();
    } else if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      const prev = e.currentTarget as HTMLElement;
      (prev.previousElementSibling as HTMLElement)?.focus();
    } else if (e.key === 'Enter') {
      handleSelect(items[index].id);
    }
  }
</script>

<div class="list-container" role="listbox" aria-label="Item list">
  {#if loading}
    <div class="list-loading">
      <span class="spinner" />
      <span>Loading...</span>
    </div>
  {:else if items.length === 0}
    <div class="list-empty">
      <Icon name="inbox" size={24} />
      <p>{emptyMessage}</p>
    </div>
  {:else}
    {#each items as item, index (item.id)}
      <button
        class="list-item"
        class:selected={selectedId === item.id}
        role="option"
        aria-selected={selectedId === item.id}
        tabindex={index === 0 ? 0 : -1}
        on:click={() => handleSelect(item.id)}
        on:keydown={(e) => handleKeydown(e, index)}
      >
        {#if item.icon}
          <Icon name={item.icon} size={16} />
        {/if}
        <span class="list-item-label">{item.label}</span>
      </button>
    {/each}
  {/if}
</div>

<style>
  .list-container {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    gap: var(--spacing-xxs);
  }

  .list-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-xs) var(--spacing-s);
    border: none;
    background: none;
    border-radius: var(--radius-s);
    cursor: pointer;
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    text-align: left;
    width: 100%;
  }

  .list-item:hover {
    background: var(--color-bg-hover);
  }

  .list-item.selected {
    background: var(--color-bg-active);
    color: var(--color-accent);
  }

  .list-item:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: -2px;
  }

  .list-item-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .list-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-xl);
    color: var(--color-text-muted);
  }

  .list-loading {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-m);
    color: var(--color-text-muted);
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
