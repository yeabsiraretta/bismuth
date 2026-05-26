<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let position: 'left' | 'right' = 'left';
  export let width: number = 300;
  export let minWidth: number = 200;
  export let maxWidth: number = 600;
  export let collapsed: boolean = false;
  export let title: string = '';
  export let collapsible: boolean = true;
  export let resizable: boolean = true;

  const dispatch = createEventDispatcher();

  let isResizing = false;
  let startX = 0;
  let startWidth = 0;

  function handleResizeStart(event: MouseEvent) {
    if (!resizable) return;
    
    isResizing = true;
    startX = event.clientX;
    startWidth = width;
    event.preventDefault();
  }

  function handleResizeMove(event: MouseEvent) {
    if (!isResizing) return;

    const delta = position === 'left' 
      ? event.clientX - startX 
      : startX - event.clientX;
    
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta));
    width = newWidth;
    dispatch('resize', { width: newWidth });
  }

  function handleResizeEnd() {
    isResizing = false;
  }

  function toggleCollapse() {
    if (!collapsible) return;
    collapsed = !collapsed;
    dispatch('collapse', { collapsed });
  }

  function handleMouseMove(event: MouseEvent) {
    handleResizeMove(event);
  }

  function handleMouseUp() {
    handleResizeEnd();
  }

  $: if (typeof window !== 'undefined') {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
  }
</script>

<aside 
  class="resizable-panel panel-{position}" 
  class:collapsed
  style="width: {collapsed ? '0' : width + 'px'};"
>
  {#if !collapsed}
    <div class="panel-header">
      <h2 class="panel-title">{title}</h2>
      <div class="panel-actions">
        {#if collapsible}
          <button 
            class="panel-action-btn" 
            on:click={toggleCollapse}
            aria-label="Collapse panel"
            title="Collapse"
          >
            {#if position === 'left'}
              ←
            {:else}
              →
            {/if}
          </button>
        {/if}
      </div>
    </div>

    <div class="panel-body">
      <slot />
    </div>

    {#if resizable}
      <div 
        class="resize-handle resize-{position}"
        on:mousedown={handleResizeStart}
        role="separator"
        aria-valuenow={width}
        aria-valuemin={minWidth}
        aria-valuemax={maxWidth}
        aria-label="Resize panel"
      >
        <div class="resize-indicator"></div>
      </div>
    {/if}
  {:else}
    <button 
      class="expand-btn expand-{position}"
      on:click={toggleCollapse}
      aria-label="Expand panel"
      title="Expand {title}"
    >
      {#if position === 'left'}
        →
      {:else}
        ←
      {/if}
    </button>
  {/if}
</aside>

<style>
  .resizable-panel {
    position: relative;
    height: 100%;
    background: var(--panel-bg, #ffffff);
    border: 1px solid var(--panel-border, #e5e7eb);
    display: flex;
    flex-direction: column;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
  }

  .panel-left {
    border-right: 1px solid var(--panel-border, #e5e7eb);
    border-left: none;
    border-top: none;
    border-bottom: none;
  }

  .panel-right {
    border-left: 1px solid var(--panel-border, #e5e7eb);
    border-right: none;
    border-top: none;
    border-bottom: none;
  }

  .collapsed {
    width: 0 !important;
    min-width: 0;
    border: none;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--panel-header-bg, #f9fafb);
    border-bottom: 1px solid var(--panel-border, #e5e7eb);
    min-height: 48px;
    flex-shrink: 0;
  }

  .panel-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text, #212529);
    margin: 0;
  }

  .panel-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .panel-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--color-text-muted, #6c757d);
    cursor: pointer;
    border-radius: 4px;
    font-size: 1rem;
    transition: all 0.15s ease;
  }

  .panel-action-btn:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--color-text, #212529);
  }

  .panel-action-btn:focus-visible {
    outline: 2px solid var(--color-primary, #0d6efd);
    outline-offset: 2px;
  }

  .panel-body {
    flex: 1;
    overflow: auto;
    background: var(--panel-bg, #ffffff);
  }

  .resize-handle {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 8px;
    cursor: col-resize;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease;
  }

  .resize-left {
    right: -4px;
  }

  .resize-right {
    left: -4px;
  }

  .resize-handle:hover {
    background: rgba(13, 110, 253, 0.1);
  }

  .resize-handle:active {
    background: rgba(13, 110, 253, 0.2);
  }

  .resize-indicator {
    width: 2px;
    height: 40px;
    background: var(--panel-border, #e5e7eb);
    border-radius: 1px;
    transition: background 0.15s ease;
  }

  .resize-handle:hover .resize-indicator {
    background: var(--color-primary, #0d6efd);
  }

  .expand-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 80px;
    border: 1px solid var(--panel-border, #e5e7eb);
    background: var(--panel-bg, #ffffff);
    color: var(--color-text-muted, #6c757d);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    transition: all 0.15s ease;
    z-index: 20;
  }

  .expand-left {
    right: -24px;
    border-radius: 0 4px 4px 0;
    border-left: none;
  }

  .expand-right {
    left: -24px;
    border-radius: 4px 0 0 4px;
    border-right: none;
  }

  .expand-btn:hover {
    background: var(--panel-header-bg, #f9fafb);
    color: var(--color-text, #212529);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .expand-btn:focus-visible {
    outline: 2px solid var(--color-primary, #0d6efd);
    outline-offset: 2px;
  }

  @media (max-width: 640px) {
    .resizable-panel {
      width: 100% !important;
      max-height: 40vh;
      border-right: none !important;
      border-left: none !important;
      border-bottom: 1px solid var(--panel-border, #e5e7eb);
    }

    .resize-handle {
      display: none;
    }

    .expand-btn {
      display: none;
    }
  }
</style>
