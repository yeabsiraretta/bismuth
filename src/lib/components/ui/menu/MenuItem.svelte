<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  /** Lucide icon name */
  export let icon: string = '';
  /** Display label */
  export let label: string;
  /** Keyboard shortcut hint */
  export let shortcut: string = '';
  /** Danger/destructive styling */
  export let destructive: boolean = false;
  /** Disabled state */
  export let disabled: boolean = false;
</script>

<button class="menu-item" class:destructive {disabled} role="menuitem" title={label} on:click>
  {#if icon}
    <Icon name={icon} size={14} />
  {/if}
  <span class="menu-item-label">{label}</span>
  {#if shortcut}
    <span class="menu-item-shortcut">{shortcut}</span>
  {/if}
</button>

<style>
  .menu-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-s, 8px);
    width: 100%;
    padding: 6px 10px;
    border: none;
    background: transparent;
    color: var(--text-normal);
    font-size: var(--menu-item-font);
    text-align: left;
    border-radius: var(--radius-s, 4px);
    cursor: pointer;
    transition: background-color 0.1s ease;
  }

  .menu-item:hover:not(:disabled) {
    background: var(--interactive-hover);
  }

  .menu-item:disabled {
    opacity: var(--opacity-disabled, 0.5);
    cursor: not-allowed;
  }

  .menu-item.destructive {
    color: var(--text-error);
  }

  .menu-item.destructive:hover:not(:disabled) {
    background: color-mix(in srgb, var(--status-deleted) 10%, transparent);
  }

  .menu-item-label {
    flex: 1;
  }

  .menu-item-shortcut {
    font-size: var(--font-ui-badge);
    color: var(--text-faint);
    margin-left: auto;
  }
</style>
