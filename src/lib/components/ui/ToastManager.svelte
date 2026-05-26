<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { listen, type UnlistenFn } from '@tauri-apps/api/event';

  interface Toast {
    id: number;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'success';
    duration: number;
  }

  let toasts: Toast[] = [];
  let nextId = 0;
  let unlisten: UnlistenFn | null = null;

  function addToast(message: string, severity: Toast['severity'] = 'info', duration = 5000) {
    const id = nextId++;
    const toast: Toast = { id, message, severity, duration };
    toasts = [...toasts, toast];

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }

  function removeToast(id: number) {
    toasts = toasts.filter(t => t.id !== id);
  }

  onMount(async () => {
    unlisten = await listen('vault://warning', (event: any) => {
      const { message, severity } = event.payload;
      addToast(message, severity || 'warning');
    });
  });

  onDestroy(() => {
    if (unlisten) {
      unlisten();
    }
  });
</script>

<div class="toast-container">
  {#each toasts as toast (toast.id)}
    <div class="toast toast-{toast.severity}" role="alert" aria-live="polite">
      <div class="toast-content">
        <span class="toast-icon">
          {#if toast.severity === 'success'}✓{/if}
          {#if toast.severity === 'warning'}⚠{/if}
          {#if toast.severity === 'error'}✕{/if}
          {#if toast.severity === 'info'}ℹ{/if}
        </span>
        <span class="toast-message">{toast.message}</span>
      </div>
      <button class="toast-close" on:click={() => removeToast(toast.id)} aria-label="Close notification">
        ×
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: var(--space-4);
    right: var(--space-4);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    max-width: 400px;
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: auto;
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .toast-content {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex: 1;
  }

  .toast-icon {
    font-size: 1.25rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .toast-message {
    font-size: 0.875rem;
    line-height: 1.4;
    color: var(--color-text);
  }

  .toast-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: none;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: 4px;
    font-size: 1.25rem;
    line-height: 1;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .toast-close:hover {
    background: var(--color-border);
    color: var(--color-text);
  }

  .toast-close:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .toast-success {
    border-left: 4px solid #10b981;
  }

  .toast-success .toast-icon {
    color: #10b981;
  }

  .toast-warning {
    border-left: 4px solid #f59e0b;
  }

  .toast-warning .toast-icon {
    color: #f59e0b;
  }

  .toast-error {
    border-left: 4px solid #ef4444;
  }

  .toast-error .toast-icon {
    color: #ef4444;
  }

  .toast-info {
    border-left: 4px solid #3b82f6;
  }

  .toast-info .toast-icon {
    color: #3b82f6;
  }

  @media (max-width: 640px) {
    .toast-container {
      left: var(--space-2);
      right: var(--space-2);
      max-width: none;
    }
  }
</style>
