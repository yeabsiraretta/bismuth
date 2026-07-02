<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import type { SidebarTab } from '@/types/layout';

  export let tab: SidebarTab;
  export let isActive = false;
  export let onSelect: (id: string) => void;
  export let onKeydown: (e: KeyboardEvent) => void;
</script>

<button
  class="tab-button"
  class:active={isActive}
  on:click={() => onSelect(tab.id)}
  on:keydown={onKeydown}
  title={tab.tooltip}
  aria-label={tab.label}
  role="tab"
  aria-selected={isActive}
  tabindex={isActive ? 0 : -1}
>
  <Icon name={tab.icon} size={18} />
</button>

<style>
  .tab-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin: 0 auto;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .tab-button:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }

  .tab-button.active {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
  }
</style>
