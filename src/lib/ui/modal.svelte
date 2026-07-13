<script lang="ts">
  /** Generic modal dialog with backdrop dismiss and Escape-to-close. @component */
  import type { Snippet } from 'svelte';
  import { createFocusTrap, type FocusTrapInstance } from '@/utils/focus-trap';

  let {
    isOpen = false,
    title,
    ariaLabel = undefined,
    onClose = undefined,
    children,
  }: {
    isOpen?: boolean;
    title: string;
    ariaLabel?: string;
    onClose?: () => void;
    children?: Snippet;
  } = $props();

  let dialogEl: HTMLDivElement | undefined = $state();
  let trap: FocusTrapInstance | null = null;

  $effect(() => {
    if (isOpen && dialogEl) {
      trap = createFocusTrap(dialogEl, { returnFocus: true, onEscape: () => onClose?.() });
      trap.activate();
    } else if (trap) {
      trap.deactivate();
      trap = null;
    }
  });

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onClose?.();
  }
</script>

{#if isOpen}
  <div class="modal-overlay" onclick={onClose} onkeydown={handleKeydown} role="presentation">
    <div
      bind:this={dialogEl}
      class="modal"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? title}
      tabindex="-1"
    >
      <h3 class="modal-title">{title}</h3>
      {@render children?.()}
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: oklch(0 0 0 / 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
  }
  .modal {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-l);
    padding: 24px;
    min-width: 380px;
    max-width: 560px;
    box-shadow: var(--shadow-l);
    animation: modal-in 0.2s ease;
  }
  .modal-title {
    margin: 0 0 16px 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
  }
  @keyframes modal-in {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
