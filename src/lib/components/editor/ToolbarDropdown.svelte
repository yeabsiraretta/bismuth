<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  export let icon: string = '';
  export let label: string = '';
  export let title: string = '';
  export let size: number = 16;

  let open = false;
  let buttonEl: HTMLButtonElement;

  function toggle() {
    open = !open;
  }

  function close() {
    open = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      close();
      buttonEl?.focus();
    }
  }

  function handleClickOutside(e: MouseEvent) {
    if (buttonEl && !buttonEl.parentElement?.contains(e.target as Node)) {
      close();
    }
  }
</script>

<svelte:window on:click={handleClickOutside} on:keydown={handleKeydown} />

<div class="toolbar-dropdown" class:open>
  <button
    bind:this={buttonEl}
    class="toolbar-btn dropdown-trigger"
    class:active={open}
    on:click|stopPropagation={toggle}
    {title}
    aria-haspopup="true"
    aria-expanded={open}
  >
    {#if icon}
      <Icon name={icon} {size} />
    {/if}
    {#if label}
      <span class="dropdown-label">{label}</span>
    {/if}
  </button>

  {#if open}
    <div
      class="dropdown-menu"
      role="menu"
      tabindex="-1"
      on:click={close}
      on:keydown={handleKeydown}
    >
      <slot />
    </div>
  {/if}
</div>

<style>
  .toolbar-dropdown {
    position: relative;
    display: inline-flex;
  }

  .dropdown-trigger {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    transition: background-color 0.1s ease;
  }

  .dropdown-trigger:hover,
  .dropdown-trigger.active {
    background-color: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .dropdown-label {
    font-size: var(--font-ui-smaller);
    font-weight: var(--font-medium);
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    min-width: 140px;
    background-color: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    z-index: 50;
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
</style>
