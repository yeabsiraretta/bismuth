<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { toasts, dismissToast } from '@/stores/toast/toast';
  import type { ToastType } from '@/stores/toast/toast';

  function iconForType(type: ToastType): string {
    switch (type) {
      case 'success': return 'check-circle';
      case 'warning': return 'alert-triangle';
      case 'error': return 'x-circle';
      default: return 'info';
    }
  }
</script>

{#if $toasts.length > 0}
  <div class="toast-container">
    {#each $toasts as t (t.id)}
      <div class="toast toast-{t.type}" role="alert">
        <Icon name={iconForType(t.type)} size={16} />
        <span class="toast-message">{t.message}</span>
        <button class="toast-dismiss" on:click={() => dismissToast(t.id)}>
          <Icon name="x" size={14} />
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .toast-container {
    position: fixed;
    bottom: 36px;
    right: 16px;
    display: flex;
    flex-direction: column-reverse;
    gap: 8px;
    z-index: 9999;
    pointer-events: none;
    max-width: 400px;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: var(--radius-m, 8px);
    font-size: var(--toast-font);
    color: var(--text-normal);
    background-color: var(--background-secondary);
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-l, 0 4px 12px rgba(0,0,0,0.15));
    pointer-events: auto;
    animation: toast-in 0.25s ease-out;
  }

  .toast-info {
    border-left: 3px solid var(--interactive-accent, #dc2626);
  }
  .toast-success {
    border-left: 3px solid var(--color-success, #10b981);
  }
  .toast-warning {
    border-left: 3px solid var(--color-warning, #f59e0b);
  }
  .toast-error {
    border-left: 3px solid var(--color-error, #ef4444);
  }

  .toast-message {
    flex: 1;
  }

  .toast-dismiss {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    transition: color 0.15s;
  }

  .toast-dismiss:hover {
    color: var(--text-normal);
  }

  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
