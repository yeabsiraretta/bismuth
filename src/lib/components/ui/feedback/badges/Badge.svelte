<script lang="ts">
  /** Numeric count to display */
  export let count: number = 0;
  /** Visual variant */
  export let variant: 'default' | 'accent' = 'default';
  /** Size variant */
  export let size: 'sm' | 'md' = 'md';
</script>

{#if count > 0}
  <span class="badge badge-{variant} badge-{size}" aria-label="{count} items">
    {count > 99 ? '99+' : count}
  </span>
{/if}

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
    font-weight: var(--font-semibold);
    line-height: 1;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .badge-md {
    min-width: var(--badge-size, 16px);
    height: var(--badge-size, 16px);
    padding: 0 5px;
    font-size: var(--badge-font-size-sm);
  }

  .badge-sm {
    min-width: 14px;
    height: 14px;
    padding: 0 var(--spacing-xs);
    font-size: var(--font-ui-xs);
  }

  .badge-default {
    background: var(--background-modifier-hover, #f3f4f6);
    color: var(--text-muted, #6b7280);
  }

  .badge-accent {
    background: var(--badge-bg, var(--interactive-accent));
    color: var(--badge-text, var(--text-on-accent));
  }
</style>
