<script lang="ts">
  /** Status type determining color */
  export let status: 'added' | 'modified' | 'deleted' | 'warning' | 'info' = 'info';
  /** Optional text label */
  export let label: string = '';
</script>

<span class="status-badge status-{status}" title={label || status}>
  {label || status}
</span>

<style>
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    border-radius: var(--radius-s, 4px);
    font-size: var(--font-ui-badge);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .status-added {
    background: color-mix(in srgb, var(--status-added) 15%, transparent);
    color: var(--status-added);
  }

  .status-modified {
    background: color-mix(in srgb, var(--status-modified) 15%, transparent);
    color: var(--status-modified);
  }

  .status-deleted {
    background: color-mix(in srgb, var(--status-deleted) 15%, transparent);
    color: var(--status-deleted);
  }

  .status-warning {
    background: color-mix(in srgb, var(--status-warning) 15%, transparent);
    color: var(--status-warning);
  }

  .status-info {
    background: color-mix(in srgb, var(--status-info) 15%, transparent);
    color: var(--status-info);
  }
</style>
