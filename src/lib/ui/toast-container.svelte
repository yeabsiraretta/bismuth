<script lang="ts">
  /** Fixed-position toast notification stack. @component */
  import BIcon from '@/ui/b-icon.svelte';
  import { getToasts, dismissToast } from '@/hubs/core/stores/toast-store.svelte';

  let toasts = $derived(getToasts());
</script>

{#if toasts.length > 0}
  <div class="toast-container" aria-live="polite" aria-label="Notifications">
    {#each toasts as t (t.id)}
      <div class="toast toast-{t.type}" role="alert">
        <span class="toast-msg">{t.message}</span>
        <button
          class="toast-close"
          onclick={() => dismissToast(t.id)}
          title="Dismiss"
          aria-label="Dismiss notification"
        >
          <BIcon name="close" size={14} />
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .toast-container {
    position: fixed;
    top: 48px;
    right: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: var(--z-toast);
    pointer-events: none;
  }
  .toast {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 280px;
    max-width: 440px;
    padding: 10px 14px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-l);
    font-size: 0.8rem;
    pointer-events: auto;
    animation: slide-in 0.25s ease;
  }
  .toast-msg {
    flex: 1;
    color: var(--color-text);
  }
  .toast-close {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: var(--radius-s);
    transition: background var(--transition-base);
  }
  .toast-close:hover {
    background: var(--color-surface-hover);
    color: var(--color-text);
  }
  .toast-info {
    border-left: 3px solid var(--color-info);
  }
  .toast-success {
    border-left: 3px solid var(--color-success);
  }
  .toast-warning {
    border-left: 3px solid var(--color-warning);
  }
  .toast-error {
    border-left: 3px solid var(--color-error);
  }
  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
</style>
