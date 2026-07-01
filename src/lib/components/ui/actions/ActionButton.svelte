<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  /** Icon name from lucide icon set */
  export let icon: string;
  /** Accessible title / tooltip */
  export let title: string;
  /** Whether the button is disabled */
  export let disabled: boolean = false;
  /** Size variant */
  export let size: 'sm' | 'md' = 'sm';
</script>

<button
  class="action-btn action-btn-{size}"
  {disabled}
  {title}
  aria-label={title}
  on:click
>
  <Icon name={icon} size={size === 'sm' ? 14 : 16} />
</button>

<style>
  .action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--text-muted, #6b7280);
    border-radius: var(--radius-s, 4px);
    cursor: pointer;
    transition: background-color var(--transition-fast, 150ms ease),
                color var(--transition-fast, 150ms ease);
    flex-shrink: 0;
  }

  .action-btn-sm {
    width: var(--panel-action-size, 28px);
    height: var(--panel-action-size, 28px);
  }

  .action-btn-md {
    width: 32px;
    height: 32px;
  }

  .action-btn:hover:not(:disabled) {
    background: var(--background-modifier-hover, #f3f4f6);
    color: var(--text-normal, #1f2937);
  }

  .action-btn:active:not(:disabled) {
    background: var(--background-secondary-alt, #e5e7eb);
  }

  .action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
