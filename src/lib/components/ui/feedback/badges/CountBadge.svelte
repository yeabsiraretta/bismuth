<script lang="ts">
  export let count: number;
  export let variant: 'default' | 'accent' = 'default';
  export let label: string | undefined = undefined;
</script>

<span
  class="count-badge count-badge--{variant}"
  aria-label={label ?? String(count)}
>
  {count}
</span>

<style>
  .count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: var(--badge-size, 20px);
    height: var(--badge-size, 20px);
    padding: 0 var(--badge-padding-inline, 6px);
    border-radius: var(--radius-full, 10px);
    font-size: var(--badge-font-size, 11px);
    font-weight: var(--font-bold);
    line-height: 1;
    white-space: nowrap;
  }

  .count-badge--default {
    background: var(--background-modifier-hover);
    color: var(--text-muted);
  }

  .count-badge--accent {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }
</style>
