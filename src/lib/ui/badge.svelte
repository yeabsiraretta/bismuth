<script lang="ts">
  /** Inline status badge with colour variants and size presets. @component */
  import type { Snippet } from 'svelte';

  let {
    variant = 'default',
    size = 'sm',
    children,
  }: {
    variant?: 'default' | 'accent' | 'success' | 'warning' | 'error';
    size?: 'xs' | 'sm' | 'md';
    children?: Snippet;
  } = $props();
</script>

<span class="badge badge-{variant} badge-{size}">
  {@render children?.()}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
    font-weight: 500;
    white-space: nowrap;
    user-select: none;
  }
  .badge-xs {
    padding: 0 4px;
    font-size: 0.6rem;
    min-height: 16px;
  }
  .badge-sm {
    padding: 1px 6px;
    font-size: 0.65rem;
    min-height: 18px;
  }
  .badge-md {
    padding: 2px 8px;
    font-size: 0.7rem;
    min-height: 22px;
  }
  .badge-default {
    background: var(--color-surface-hover);
    color: var(--color-text-muted);
  }
  .badge-accent {
    background: var(--color-accent);
    color: var(--color-background);
  }
  .badge-success {
    background: var(--color-success);
    color: var(--color-background);
  }
  .badge-warning {
    background: var(--color-warning);
    color: var(--color-background);
  }
  .badge-error {
    background: var(--color-error);
    color: var(--color-background);
  }
</style>
