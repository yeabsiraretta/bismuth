<script lang="ts">
  import type { WorkflowCategory } from './workflowBadgeTypes';

  export let category: WorkflowCategory;
  export let label: string;
  export let showIcon: boolean = false;
</script>

<span
  class="workflow-badge workflow-badge-{category}"
  role="status"
  aria-live="polite"
  title={label}
>
  {#if showIcon}
    <span class="wbadge-icon" aria-hidden="true">&#9679;</span>
  {/if}
  {label}
</span>

<style>
  .workflow-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: var(--radius-s, 4px);
    font-size: var(--font-ui-badge);
    font-weight: var(--font-semibold);
    white-space: nowrap;
    user-select: none;
  }

  .workflow-badge-draft {
    background: color-mix(in srgb, var(--status-warning) 15%, transparent);
    color: var(--status-warning);
  }

  .workflow-badge-active {
    background: color-mix(in srgb, var(--status-info) 15%, transparent);
    color: var(--status-info);
  }

  .workflow-badge-complete {
    background: color-mix(in srgb, var(--status-added) 15%, transparent);
    color: var(--status-added);
  }

  .workflow-badge-blocked {
    background: color-mix(in srgb, var(--status-deleted) 15%, transparent);
    color: var(--status-deleted);
  }

  .workflow-badge-archived {
    background: color-mix(in srgb, var(--text-muted) 15%, transparent);
    color: var(--text-muted);
  }

  .workflow-badge-review {
    background: color-mix(in srgb, var(--status-modified) 15%, transparent);
    color: var(--status-modified);
  }

  .workflow-badge-published {
    background: color-mix(in srgb, var(--interactive-accent) 15%, transparent);
    color: var(--interactive-accent);
  }

  .workflow-badge-pending {
    background: color-mix(in srgb, var(--text-muted) 15%, transparent);
    color: var(--text-muted);
  }

  .wbadge-icon {
    font-size: var(--font-ui-xs);
  }
</style>
