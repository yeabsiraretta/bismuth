<script lang="ts">
  import { log } from '@/utils/logger';
  import type { ProfileMenuItem } from './profileMenuTypes';

  export let initials: string;
  export let displayName: string;
  export let items: ProfileMenuItem[] = [];
  export let isOpen: boolean = false;
  export let onToggle: (open: boolean) => void;

  $: if (items.length > 5) {
    log.warn('ProfileMenu: more than 5 items degrades usability (Hick\'s Law)');
  }

  function toggle() {
    onToggle(!isOpen);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      onToggle(false);
    }
  }

  function handleItemClick(item: ProfileMenuItem) {
    onToggle(false);
    item.onClick?.();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="profile-menu" class:pm-open={isOpen}>
  <button
    class="pm-trigger"
    aria-expanded={isOpen}
    aria-haspopup="menu"
    aria-label="{displayName} — account menu"
    on:click={toggle}
  >
    <span class="pm-avatar" aria-hidden="true" title={displayName}>
      {initials.slice(0, 2).toUpperCase()}
    </span>
    <span class="pm-chevron" aria-hidden="true">&#8964;</span>
  </button>

  {#if isOpen}
    <div
      class="pm-backdrop"
      role="presentation"
      on:click={() => onToggle(false)}
      on:keydown={() => {}}
    ></div>
    <div class="pm-menu" role="menu" aria-label="{displayName} account menu">
      {#each items as item}
        <div class="pm-item" role="menuitem" tabindex="0"
          on:click={() => handleItemClick(item)}
          on:keydown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleItemClick(item); } }}
        >
          {#if item.href}
            <a href={item.href} class="pm-item-link" on:click|stopPropagation={() => onToggle(false)}>
              {item.label}
            </a>
          {:else}
            <span>{item.label}</span>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .profile-menu { position: relative; display: inline-flex; }

  .pm-trigger {
    display: inline-flex; align-items: center; gap: var(--spacing-xs, 4px);
    border: none; background: transparent; cursor: pointer;
    border-radius: var(--radius-s); padding: 4px;
  }
  .pm-trigger:focus-visible { outline: 2px solid var(--interactive-accent); outline-offset: 2px; }

  .pm-avatar {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    font-size: var(--font-ui-badge); font-weight: var(--font-bold);
    flex-shrink: 0;
  }

  .pm-chevron { color: var(--text-muted); font-size: var(--font-ui-smaller); }

  .pm-backdrop {
    position: fixed; inset: 0; z-index: var(--layer-popover, 100);
  }

  .pm-menu {
    position: absolute; top: calc(100% + 4px); right: 0;
    min-width: 160px;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-l);
    z-index: calc(var(--layer-popover, 100) + 1);
    padding: 4px;
  }

  .pm-item {
    padding: 7px 12px;
    border-radius: var(--radius-s);
    cursor: pointer;
    color: var(--text-normal);
    font-size: var(--font-ui-small);
  }
  .pm-item:hover, .pm-item:focus { background: var(--background-modifier-hover); outline: none; }

  .pm-item-link {
    display: block; color: inherit; text-decoration: none;
  }
</style>
