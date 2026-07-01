<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import { createFocusTrap, type FocusTrapInstance } from '@/utils/accessibility/focusTrap';

  export let open: boolean = false;
  export let title: string;
  export let subtitle: string | undefined = undefined;
  export let width: number | string = 480;
  export let ariaLabel: string | undefined = undefined;
  export let onClose: () => void;

  let panelEl: HTMLElement;
  let trap: FocusTrapInstance | null = null;
  let prevOverflow = '';

  $: if (typeof document !== 'undefined') {
    if (open) {
      openDrawer();
    } else {
      closeDrawer();
    }
  }

  async function openDrawer() {
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    await tick();
    if (panelEl) {
      trap = createFocusTrap(panelEl, { onEscape: onClose, returnFocus: true });
      trap.activate();
    }
  }

  function closeDrawer() {
    trap?.deactivate();
    trap = null;
    document.body.style.overflow = prevOverflow;
  }

  onDestroy(() => {
    trap?.deactivate();
    trap = null;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = prevOverflow;
    }
  });

  function panelWidth() {
    if (typeof width === 'number') return `${width}px`;
    return width;
  }
</script>

{#if open}
  <div class="drawer-backdrop" role="presentation" on:click={onClose} on:keydown={() => {}}></div>
  <div
    bind:this={panelEl}
    class="drawer-panel"
    style="--drawer-width: {panelWidth()}"
    role="dialog"
    aria-modal="true"
    aria-labelledby="drawer-title"
    aria-label={ariaLabel}
  >
    <div class="drawer-header">
      <div class="drawer-header-text">
        <h2 id="drawer-title" class="bismuth-heading-sm">{title}</h2>
        {#if subtitle}
          <p class="drawer-subtitle bismuth-body-sm">{subtitle}</p>
        {/if}
      </div>
      <button class="drawer-close" on:click={onClose} aria-label="Close panel"> &times; </button>
    </div>
    <div class="drawer-body">
      <slot />
    </div>
    {#if $$slots.staging}
      <div class="drawer-staging">
        <slot name="staging" />
      </div>
    {/if}
    {#if $$slots['footer-regressive'] || $$slots['footer-progressive']}
      <div class="drawer-footer">
        <div class="drawer-footer-regressive">
          <slot name="footer-regressive" />
        </div>
        <div class="drawer-footer-progressive">
          <slot name="footer-progressive" />
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .drawer-backdrop {
    position: fixed;
    inset: 0;
    background: var(--background-modifier-cover);
    z-index: var(--layer-modal, 1000);
  }

  .drawer-panel {
    position: fixed;
    top: 0;
    right: 0;
    height: 100%;
    width: var(--drawer-width, 480px);
    background: var(--background-primary);
    border-left: 1px solid var(--background-modifier-border);
    box-shadow: var(--shadow-l, -4px 0 16px rgba(0, 0, 0, 0.15));
    z-index: calc(var(--layer-modal, 1000) + 1);
    display: flex;
    flex-direction: column;
    animation: slideIn var(--transition-medium, 250ms ease) forwards;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @media (max-width: 600px) {
    .drawer-panel {
      width: 100vw;
    }
  }

  .drawer-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-m, 12px);
    padding: var(--spacing-l, 16px) var(--spacing-l, 16px) var(--spacing-m, 12px);
    border-bottom: 1px solid var(--background-modifier-border);
    flex-shrink: 0;
  }

  .drawer-header-text {
    flex: 1;
    min-width: 0;
  }

  .drawer-subtitle {
    color: var(--text-muted);
    margin: 4px 0 0;
  }

  .drawer-close {
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--radius-s);
    font-size: var(--font-size-xl);
    flex-shrink: 0;
  }

  .drawer-close:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }
  .drawer-close:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 2px;
  }

  .drawer-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-l, 16px);
  }

  .drawer-staging {
    flex-shrink: 0;
    padding: var(--spacing-m, 12px) var(--spacing-l, 16px);
    border-top: 1px solid var(--background-modifier-border);
  }

  .drawer-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-m, 12px);
    padding: var(--spacing-m, 12px) var(--spacing-l, 16px);
    border-top: 1px solid var(--background-modifier-border);
    flex-shrink: 0;
  }

  .drawer-footer-regressive {
    display: flex;
    gap: var(--spacing-s, 8px);
  }
  .drawer-footer-progressive {
    display: flex;
    gap: var(--spacing-s, 8px);
    margin-left: auto;
  }
</style>
