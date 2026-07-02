<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  /** Current input value */
  export let value: string = '';
  /** Placeholder text */
  export let placeholder: string = 'Search...';
  /** Auto-focus on mount */
  export let autofocus: boolean = false;
  export let onInput: ((value: string) => void) | undefined = undefined;
  export let onClear: (() => void) | undefined = undefined;

  function handleInput(e: Event) {
    value = (e.target as HTMLInputElement).value;
    onInput?.(value);
  }

  function handleClear() {
    value = '';
    onClear?.();
    onInput?.('');
  }
</script>

<div class="search-input-wrapper">
  <Icon name="search" size={14} />
  <!-- svelte-ignore a11y_autofocus -->
  <input
    class="search-input"
    type="text"
    {placeholder}
    {value}
    {autofocus}
    on:input={handleInput}
    on:keydown
  />
  {#if value}
    <button class="clear-btn" on:click={handleClear} title="Clear" aria-label="Clear search">
      <Icon name="x" size={12} />
    </button>
  {/if}
</div>

<style>
  .search-input-wrapper {
    display: flex;
    align-items: center;
    gap: var(--spacing-s, 8px);
    padding: 6px 10px;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s, 4px);
    color: var(--text-muted);
    transition: border-color var(--transition-fast, 150ms ease);
  }

  .search-input-wrapper:focus-within {
    border-color: var(--interactive-accent);
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--text-normal);
    font-size: var(--menu-item-font);
    outline: none;
    min-width: 0;
  }

  .search-input::placeholder {
    color: var(--text-faint);
  }

  .clear-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: none;
    background: var(--background-modifier-hover);
    border-radius: var(--radius-xs, 2px);
    color: var(--text-muted);
    cursor: pointer;
    flex-shrink: 0;
  }

  .clear-btn:hover {
    color: var(--text-normal);
  }
</style>
