<script lang="ts">
  /**
   * Standard sidebar panel with a header (title, badge, action slots) and
   * scrollable body. Exposes global utility classes for child content.
   * @component
   */
  import type { Snippet } from 'svelte';

  let {
    title,
    badge = undefined,
    actions = undefined,
    children,
  }: {
    title: string;
    badge?: Snippet;
    actions?: Snippet;
    children: Snippet;
  } = $props();
</script>

<div class="panel">
  <div class="panel-header">
    <span class="panel-title">{title}</span>
    <div class="panel-header-end">
      {#if badge}
        {@render badge()}
      {/if}
      {#if actions}
        {@render actions()}
      {/if}
    </div>
  </div>
  <div class="panel-body">
    {@render children()}
  </div>
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    overflow: hidden;
  }
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    min-height: 37px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
    gap: 6px;
  }
  .panel-title {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }
  .panel-header-end {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .panel-body {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 8px;
  }

  /* ── Shared utility classes for panel consumers ────────── */
  .panel :global(.panel-badge) {
    font-size: 0.65rem;
    color: var(--color-text-subtle);
    background: var(--color-surface);
    padding: 0 5px;
    border-radius: var(--radius-m);
  }
  .panel :global(.panel-action) {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: var(--radius-s);
  }
  .panel :global(.panel-action:hover) {
    color: var(--color-text);
    background: var(--color-surface-hover);
  }
  .panel :global(.panel-empty) {
    padding: 24px 16px;
    text-align: center;
    color: var(--color-text-subtle);
    font-size: 0.75rem;
  }
  .panel :global(.panel-empty-hint) {
    font-size: 0.65rem;
    margin-top: 4px;
    color: var(--color-text-muted);
  }
</style>
