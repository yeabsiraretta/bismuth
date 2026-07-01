<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    searchOpen,
    searchQuery,
    setSearchQuery,
    toggleSearch,
  } from '../stores/navigatorActions';
  import { setFilterQuery, setActivePane } from '../stores/navigator';
  export let onClose: (() => void) | undefined = undefined;

  let inputEl: HTMLInputElement;

  $: if ($searchOpen && inputEl) {
    inputEl.focus();
  }

  function handleInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    setSearchQuery(value);
    setFilterQuery(value);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      clearAndClose();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      setActivePane('list');
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        setActivePane('navigation');
      } else {
        setActivePane('list');
      }
    }
  }

  function clearAndClose() {
    setSearchQuery('');
    setFilterQuery('');
    toggleSearch();
    onClose?.();
  }

  function clearQuery() {
    setSearchQuery('');
    setFilterQuery('');
    if (inputEl) inputEl.focus();
  }
</script>

{#if $searchOpen}
  <div class="search-bar">
    <Icon name="search" size={13} />
    <input
      bind:this={inputEl}
      type="text"
      class="search-input"
      placeholder="Filter files... (#tag, .key=val, @date)"
      value={$searchQuery}
      on:input={handleInput}
      on:keydown={handleKeydown}
      aria-label="Filter notes"
    />
    {#if $searchQuery}
      <button class="clear-btn" on:click={clearQuery} title="Clear search">
        <Icon name="x" size={12} />
      </button>
    {/if}
    <button class="close-btn" on:click={clearAndClose} title="Close search (Esc)">
      <Icon name="x-circle" size={13} />
    </button>
  </div>
{/if}

<style>
  .search-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-bottom: 1px solid var(--border-color);
    background: var(--background-primary);
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    border: none;
    background: none;
    font-size: 12px;
    color: var(--text-normal);
    outline: none;
    min-width: 0;
    padding: 2px 0;
  }

  .search-input::placeholder {
    color: var(--text-faint);
  }

  .clear-btn,
  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: none;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--radius-s);
    padding: 0;
    flex-shrink: 0;
  }

  .clear-btn:hover,
  .close-btn:hover {
    background: var(--interactive-hover);
    color: var(--text-normal);
  }
</style>
