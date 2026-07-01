<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';

  export let message: string = '';
  export let type: 'info' | 'success' | 'warning' | 'error' = 'info';
  export let duration: number = 3000;
  export let onClose: () => void = () => {};

  let visible = true;
  let timer: number;

  onMount(() => {
    if (duration > 0) {
      timer = window.setTimeout(() => {
        visible = false;
        setTimeout(onClose, 300);
      }, duration);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  });

  function handleClose() {
    visible = false;
    setTimeout(onClose, 300);
  }
</script>

{#if visible}
  <div
    class="toast"
    class:toast-info={type === 'info'}
    class:toast-success={type === 'success'}
    class:toast-warning={type === 'warning'}
    class:toast-error={type === 'error'}
    transition:fly={{ y: -20, duration: 300 }}
  >
    <div class="toast-content">
      <span class="toast-message">{message}</span>
      <button class="toast-close" on:click={handleClose} title="Dismiss" aria-label="Dismiss notification">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" />
        </svg>
      </button>
    </div>
  </div>
{/if}

<style>
  .toast {
    display: flex;
    align-items: center;
    min-width: 300px;
    max-width: 500px;
    padding: var(--spacing-m);
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-l);
    font-family: var(--font-text);
    font-size: var(--font-ui-medium);
  }

  .toast-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: var(--spacing-m);
  }

  .toast-message {
    flex: 1;
    color: var(--text-normal);
  }

  .toast-close {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xs);
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--radius-s);
    transition: all var(--transition-fast);
  }

  .toast-close:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }

  .toast-info {
    border-left: 4px solid var(--interactive-accent);
  }

  .toast-success {
    border-left: 4px solid var(--interactive-success);
  }

  .toast-warning {
    border-left: 4px solid var(--text-accent);
  }

  .toast-error {
    border-left: 4px solid var(--text-error);
  }
</style>
