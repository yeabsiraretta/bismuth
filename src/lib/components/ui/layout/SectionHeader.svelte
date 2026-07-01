<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  export let title: string;
  export let count: number | undefined = undefined;
  export let collapsible: boolean = false;
  export let collapsed: boolean = false;
  export let onToggle: ((detail: { collapsed: boolean }) => void) | undefined = undefined;

  function toggle() {
    collapsed = !collapsed;
    onToggle?.({ collapsed });
  }
</script>

<div class="section-header">
  <div class="section-header-left">
    {#if collapsible}
      <button
        class="collapse-btn"
        on:click={toggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand section' : 'Collapse section'}
      >
        <Icon name={collapsed ? 'chevron-right' : 'chevron-down'} size={12} />
      </button>
    {/if}
    <span class="section-title">{title}</span>
    {#if count !== undefined}
      <span class="section-count">{count}</span>
    {/if}
  </div>
  <div class="section-actions">
    <slot name="actions" />
  </div>
</div>

<style>
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-xs) var(--spacing-s);
    min-height: 28px;
  }

  .section-header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    min-width: 0;
    overflow: hidden;
  }

  .collapse-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    min-height: 40px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0;
    border-radius: var(--radius-s);
    margin: calc(-1 * var(--spacing-s)) calc(-1 * var(--spacing-xs));
  }

  .collapse-btn:hover {
    color: var(--text-normal);
  }

  .section-title {
    font-size: var(--font-ui-small);
    font-weight: var(--font-semibold);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .section-count {
    font-size: var(--font-smallest);
    color: var(--text-faint);
  }

  .section-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    flex-shrink: 0;
  }
</style>
