<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  export let icon: string = '';
  export let title: string = '';
  export let count: number | undefined = undefined;
  export let collapsible: boolean = false;
  export let collapsed: boolean = false;
</script>

<div class="panel-header">
  <div class="panel-header-left">
    {#if collapsible}
      <button
        class="collapse-toggle"
        on:click={() => {
          collapsed = !collapsed;
        }}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
      >
        <Icon name={collapsed ? 'chevron-right' : 'chevron-down'} size={12} />
      </button>
    {/if}
    {#if icon}
      <Icon name={icon} size={14} />
    {/if}
    <slot name="title">
      <h3 class="panel-header-title">{title}</h3>
    </slot>
    {#if count !== undefined}
      <span class="panel-header-count">{count}</span>
    {/if}
  </div>
  <div class="panel-header-actions">
    <slot name="actions" />
  </div>
</div>

<style>
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--spacing-m);
    border-bottom: 1px solid var(--color-border);
    background: var(--panel-header-bg, var(--background-secondary));
    height: var(--panel-header-height, 36px);
    min-height: var(--panel-header-height, 36px);
    flex-shrink: 0;
  }

  .panel-header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    min-width: 0;
    flex: 1;
    overflow: hidden;
    color: var(--text-muted);
  }

  .collapse-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--radius-xs);
    padding: 0;
  }

  .collapse-toggle:hover {
    color: var(--text-normal);
  }

  .panel-header-title {
    margin: 0;
    font-size: var(--font-ui-small);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .panel-header-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 var(--spacing-xs);
    border-radius: var(--radius-full);
    background: var(--background-modifier-hover);
    font-size: var(--font-smallest);
    font-weight: var(--font-semibold);
    color: var(--text-muted);
  }

  .panel-header-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    flex-shrink: 0;
  }
</style>
