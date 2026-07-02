<script lang="ts">
  import type { DesignDocDiff, PatchOperation } from '@/services/design-docs';

  export let diff: DesignDocDiff | null = null;

  function opColor(op: PatchOperation['op']): string {
    if (op === 'add') return 'var(--color-success)';
    if (op === 'remove') return 'var(--color-error)';
    return 'var(--color-warning)';
  }

  function opLabel(op: PatchOperation['op']): string {
    if (op === 'add') return '+';
    if (op === 'remove') return '−';
    return '~';
  }
</script>

<div class="diff-view">
  {#if !diff}
    <div class="diff-empty">No diff available</div>
  {:else}
    <div class="diff-summary">
      <span class="diff-stat added">+{diff.summary.added}</span>
      <span class="diff-stat removed">−{diff.summary.removed}</span>
      <span class="diff-stat changed">~{diff.summary.changed}</span>
      <span class="diff-versions">v{diff.from_version} → v{diff.to_version}</span>
    </div>
    <ul class="diff-ops">
      {#each diff.operations.slice(0, 20) as op}
        <li class="diff-op">
          <span class="op-badge" style="color: {opColor(op.op)}">{opLabel(op.op)}</span>
          <span class="op-path">{op.path}</span>
        </li>
      {/each}
      {#if diff.operations.length > 20}
        <li class="diff-more">...and {diff.operations.length - 20} more changes</li>
      {/if}
    </ul>
  {/if}
</div>

<style>
  .diff-view {
    padding: var(--spacing-s);
    font-size: 11px;
  }
  .diff-empty {
    color: var(--text-muted);
    text-align: center;
    padding: var(--spacing-m);
  }
  .diff-summary {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding-bottom: var(--spacing-s);
    border-bottom: 1px solid var(--border-subtle);
    margin-bottom: var(--spacing-s);
  }
  .diff-stat {
    font-weight: var(--font-semibold);
    font-variant-numeric: tabular-nums;
  }
  .diff-stat.added {
    color: var(--color-success);
  }
  .diff-stat.removed {
    color: var(--color-error);
  }
  .diff-stat.changed {
    color: var(--color-warning);
  }
  .diff-versions {
    margin-left: auto;
    color: var(--text-muted);
  }
  .diff-ops {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 200px;
    overflow-y: auto;
  }
  .diff-op {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: 2px 0;
    font-family: var(--font-mono);
  }
  .op-badge {
    width: 14px;
    text-align: center;
    font-weight: bold;
  }
  .op-path {
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .diff-more {
    color: var(--text-muted);
    font-style: italic;
    padding-top: var(--spacing-xs);
  }
</style>
