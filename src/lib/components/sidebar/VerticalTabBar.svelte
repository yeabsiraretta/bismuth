<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import type { SidebarTab } from '@/types/layout';

  export let activeTab: string = 'files';
  export let onTabChange: ((detail: { tabId: string }) => void) | undefined = undefined;
  export let position: 'left' | 'right' = 'left';
  /** Main tabs — passed in by parent (SidebarShell or App) */
  export let tabs: SidebarTab[] = [];
  /** Bottom action tabs (settings, help) */
  export let bottomTabs: SidebarTab[] = [];
  /** Fires when the settings button is clicked (instead of treating it as a tab) */
  export let onSettingsClick: (() => void) | undefined = undefined;
  /** Fires when tabs are reordered via drag-and-drop */
  export let onReorder: ((reorderedTabs: SidebarTab[]) => void) | undefined = undefined;

  let draggedTabId: string | null = null;
  let dropTargetId: string | null = null;

  function selectTab(tabId: string) {
    if (tabId === 'settings' && onSettingsClick) {
      onSettingsClick();
      return;
    }
    activeTab = tabId;
    onTabChange?.({ tabId });
  }

  function handleDragStart(e: DragEvent, tabId: string) {
    if (!e.dataTransfer) return;
    draggedTabId = tabId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tabId);
  }

  function handleDragOver(e: DragEvent, tabId: string) {
    e.preventDefault();
    if (!draggedTabId || draggedTabId === tabId) return;
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    dropTargetId = tabId;
  }

  function handleDragLeave() {
    dropTargetId = null;
  }

  function handleDrop(e: DragEvent, tabId: string) {
    e.preventDefault();
    if (!draggedTabId || draggedTabId === tabId) {
      draggedTabId = null;
      dropTargetId = null;
      return;
    }

    const fromIdx = tabs.findIndex(t => t.id === draggedTabId);
    const toIdx = tabs.findIndex(t => t.id === tabId);

    if (fromIdx !== -1 && toIdx !== -1) {
      const reordered = [...tabs];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      tabs = reordered;
      onReorder?.(reordered);
    }

    draggedTabId = null;
    dropTargetId = null;
  }

  function handleDragEnd() {
    draggedTabId = null;
    dropTargetId = null;
  }

  function handleKeydown(e: KeyboardEvent) {
    const allTabs = [...tabs, ...bottomTabs];
    const currentIndex = allTabs.findIndex(t => t.id === activeTab);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % allTabs.length;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + allTabs.length) % allTabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = allTabs.length - 1;
    } else {
      return;
    }

    selectTab(allTabs[nextIndex].id);
    const buttons = (e.currentTarget as HTMLElement)?.closest('.vertical-tab-bar')?.querySelectorAll('.tab-button');
    if (buttons && buttons[nextIndex]) {
      (buttons[nextIndex] as HTMLElement).focus();
    }
  }
</script>

<div class="vertical-tab-bar" class:left={position === 'left'} class:right={position === 'right'} role="tablist" aria-orientation="vertical">
  <div class="tabs-top">
    {#each tabs as tab (tab.id)}
      <button
        class="tab-button"
        class:active={activeTab === tab.id}
        class:drag-over={dropTargetId === tab.id}
        on:click={() => selectTab(tab.id)}
        on:keydown={handleKeydown}
        draggable="true"
        on:dragstart={(e) => handleDragStart(e, tab.id)}
        on:dragover={(e) => handleDragOver(e, tab.id)}
        on:dragleave={handleDragLeave}
        on:drop={(e) => handleDrop(e, tab.id)}
        on:dragend={handleDragEnd}
        title={tab.tooltip}
        aria-label={tab.label}
        aria-selected={activeTab === tab.id}
        role="tab"
        tabindex={activeTab === tab.id ? 0 : -1}
      >
        <Icon name={tab.icon} size={20} />
        {#if tab.badge && tab.badge > 0}
          <span class="tab-badge">{tab.badge > 99 ? '99+' : tab.badge}</span>
        {/if}
      </button>
    {/each}
  </div>

  <div class="tabs-bottom">
    {#each bottomTabs as tab}
      <button
        class="tab-button"
        class:active={activeTab === tab.id}
        on:click={() => selectTab(tab.id)}
        on:keydown={handleKeydown}
        title={tab.tooltip}
        aria-label={tab.label}
        role="tab"
      >
        <Icon name={tab.icon} size={20} />
      </button>
    {/each}
  </div>
</div>

<style>
  .vertical-tab-bar {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 48px;
    height: 100%;
    background-color: var(--background-secondary);
    border-right: 1px solid var(--border-color);
    z-index: 10;
  }

  .vertical-tab-bar.right {
    border-right: none;
    border-left: 1px solid var(--border-color);
  }

  .tabs-top,
  .tabs-bottom {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 4px;
  }

  .tab-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
  }

  .tab-button:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }

  .tab-button.drag-over {
    outline: 2px dashed var(--interactive-accent);
    outline-offset: -2px;
  }

  .tab-button.active {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .tab-button.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 24px;
    background-color: var(--interactive-accent);
    border-radius: 0 2px 2px 0;
  }

  .vertical-tab-bar.right .tab-button.active::before {
    left: auto;
    right: 0;
    border-radius: 2px 0 0 2px;
  }

  .tab-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    min-width: 14px;
    height: 14px;
    padding: 0 3px;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-radius: 7px;
    font-size: 9px;
    font-weight: 700;
    line-height: 14px;
    text-align: center;
  }
</style>
