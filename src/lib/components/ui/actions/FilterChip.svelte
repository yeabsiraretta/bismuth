<script lang="ts">
  /** Chip label text */
  export let label: string;
  /** Whether the chip is active/selected */
  export let active: boolean = false;
  /** Optional count badge */
  export let count: number | undefined = undefined;
</script>

<button
  class="filter-chip"
  class:active
  title={label}
  on:click
>
  <span>{label}</span>
  {#if count !== undefined}
    <span class="chip-count">{count}</span>
  {/if}
</button>

<style>
  .filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-full, 9999px);
    background: transparent;
    color: var(--text-muted);
    font-size: var(--font-ui-smaller);
    cursor: pointer;
    transition: all var(--transition-fast, 150ms ease);
    white-space: nowrap;
  }

  .filter-chip:hover {
    border-color: var(--interactive-accent);
    color: var(--text-normal);
  }

  .filter-chip.active {
    background: var(--interactive-accent);
    border-color: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .chip-count {
    font-size: var(--font-ui-xs);
    font-weight: var(--font-semibold);
    opacity: 0.8;
  }
</style>
