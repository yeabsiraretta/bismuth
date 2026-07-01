<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import BismuthLogo from '@/components/icons/BismuthLogo.svelte';
  import VerticalTabButton from './VerticalTabButton.svelte';
  import TabBarItem from './TabBarItem.svelte';
  import type { SidebarTab } from '@/types/layout';
  import { handleDragStartLogic, handleDropLogic, getNextTabIndex } from './tabBarDragLogic';
  import { dispatchTabSelect, handleTabKeydown } from './tabBarLogic';

  export let activeTab: string = 'files';
  export let onTabChange: ((detail: { tabId: string }) => void) | undefined = undefined;
  export let position: 'left' | 'right' = 'left';
  export let tabs: SidebarTab[] = [];
  export let lowerTabs: SidebarTab[] = [];
  export let bottomTabs: SidebarTab[] = [];
  export let onSettingsClick: (() => void) | undefined = undefined;
  export let onAboutClick: (() => void) | undefined = undefined;
  export let onCommandsClick: (() => void) | undefined = undefined;
  export let onQuickAction: (() => void) | undefined = undefined;
  export let onDailyNoteClick: (() => void) | undefined = undefined;
  export let onLayoutsClick: (() => void) | undefined = undefined;
  export let onPublishMarkClick: (() => void) | undefined = undefined;
  export let onReorder: ((reorderedTabs: SidebarTab[]) => void) | undefined = undefined;
  export let onLowerReorder: ((reorderedTabs: SidebarTab[]) => void) | undefined = undefined;
  export let onSectionChange: ((tabId: string, target: 'upper' | 'lower') => void) | undefined = undefined;

  let draggedTabId: string | null = null;
  let dragSource: 'upper' | 'lower' | null = null;
  let dropTargetId: string | null = null;
  let dropZoneActive = false;
  let upperDropZoneActive = false;

  function selectTab(tabId: string) {
    const next = dispatchTabSelect(tabId, activeTab, { onCommandsClick, onSettingsClick, onAboutClick, onDailyNoteClick, onLayoutsClick, onPublishMarkClick, onTabChange });
    if (next !== null) activeTab = next;
  }

  function handleDragStart(e: DragEvent, tabId: string, source: 'upper' | 'lower') {
    const result = handleDragStartLogic(e, tabId, source, tabs, lowerTabs);
    if (result) { draggedTabId = result.draggedTabId; dragSource = result.dragSource; }
  }

  function handleDragOver(e: DragEvent, tabId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedTabId || draggedTabId === tabId) { dropTargetId = null; return; }
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    dropTargetId = tabId;
  }

  function handleDragLeave() { dropTargetId = null; }

  function handleDrop(e: DragEvent, tabId: string, targetSection: 'upper' | 'lower') {
    e.preventDefault();
    e.stopPropagation();
    const result = handleDropLogic(draggedTabId, dragSource, tabId, targetSection, tabs, lowerTabs);
    if (result?.type === 'section-change') { onSectionChange?.(result.tabId!, result.targetSection); }
    else if (result?.type === 'reorder' && result.reordered) {
      if (targetSection === 'upper') { tabs = result.reordered; onReorder?.(result.reordered); }
      else { lowerTabs = result.reordered; onLowerReorder?.(result.reordered); }
    }
    resetDrag();
  }

  function handleDropZone(e: DragEvent) { e.preventDefault(); if (!draggedTabId || dragSource === 'lower') { resetDrag(); return; } onSectionChange?.(draggedTabId, 'lower'); resetDrag(); }
  function handleUpperDropZone(e: DragEvent) { e.preventDefault(); if (!draggedTabId || dragSource === 'upper') { resetDrag(); return; } onSectionChange?.(draggedTabId, 'upper'); resetDrag(); }
  function handleDropZoneDragOver(e: DragEvent) { e.preventDefault(); if (!draggedTabId || dragSource === 'lower') return; if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; dropZoneActive = true; }
  function handleUpperDropZoneDragOver(e: DragEvent) { e.preventDefault(); if (!draggedTabId || dragSource === 'upper') return; if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; upperDropZoneActive = true; }
  function handleDropZoneDragLeave() { dropZoneActive = false; }
  function handleUpperDropZoneDragLeave() { upperDropZoneActive = false; }
  function handleDragEnd() { resetDrag(); }
  function resetDrag() { draggedTabId = null; dragSource = null; dropTargetId = null; dropZoneActive = false; upperDropZoneActive = false; }

  function handleKeydown(e: KeyboardEvent) {
    handleTabKeydown(e, activeTab, [...tabs, ...lowerTabs, ...bottomTabs], getNextTabIndex, selectTab);
  }
</script>

<div class="vertical-tab-bar" class:left={position === 'left'} class:right={position === 'right'} role="tablist" aria-orientation="vertical">
  {#if position === 'left'}
    <div class="brand-area"><BismuthLogo size={18} /></div>
  {:else}
    <div class="brand-area">
      {#if onQuickAction}
        <button class="tab-button" on:click={onQuickAction} title="Quick Actions (⌘K)" aria-label="Quick actions">
          <Icon name="plus" size={18} />
        </button>
      {/if}
    </div>
  {/if}

  <div class="tabs-main">
    <div class="tabs-section" role="list" on:dragover={handleUpperDropZoneDragOver} on:dragleave={handleUpperDropZoneDragLeave} on:drop={handleUpperDropZone} class:drop-zone-active={upperDropZoneActive}>
      {#each tabs as tab (tab.id)}
        <VerticalTabButton {tab} active={activeTab === tab.id} dragOver={dropTargetId === tab.id} onSelect={selectTab} onKeydown={handleKeydown} onDragStart={(e) => handleDragStart(e, tab.id, 'upper')} onDragOver={(e) => handleDragOver(e, tab.id)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, tab.id, 'upper')} onDragEnd={handleDragEnd} />
      {/each}
    </div>

    {#if lowerTabs.length > 0 || draggedTabId}
      <div class="section-divider" role="separator" aria-orientation="horizontal" class:drop-zone-active={dropZoneActive} on:dragover={handleDropZoneDragOver} on:dragleave={handleDropZoneDragLeave} on:drop={handleDropZone}>
        <div class="divider-line"></div>
      </div>
    {/if}

    {#if lowerTabs.length > 0}
      <div class="tabs-section tabs-lower">
        {#each lowerTabs as tab (tab.id)}
          <VerticalTabButton {tab} active={activeTab === tab.id} dragOver={dropTargetId === tab.id} onSelect={selectTab} onKeydown={handleKeydown} onDragStart={(e) => handleDragStart(e, tab.id, 'lower')} onDragOver={(e) => handleDragOver(e, tab.id)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, tab.id, 'lower')} onDragEnd={handleDragEnd} />
        {/each}
      </div>
    {/if}
  </div>

  <div class="tabs-bottom">
    {#each bottomTabs as tab}
      <TabBarItem {tab} isActive={activeTab === tab.id} onSelect={selectTab} onKeydown={handleKeydown} />
    {/each}
  </div>
</div>

<style>
  .vertical-tab-bar { display: flex; flex-direction: column; justify-content: space-between; width: 40px; min-width: 40px; height: 100%; background-color: var(--background-secondary); border-right: 1px solid var(--border-color); flex-shrink: 0; }
  .vertical-tab-bar.right { border-right: none; border-left: 1px solid var(--border-color); }
  .brand-area { display: flex; align-items: center; justify-content: center; height: var(--panel-header-height); min-height: var(--panel-header-height); flex-shrink: 0; }
  .tabs-main { display: flex; flex-direction: column; flex: 1; overflow-y: auto; overflow-x: hidden; }
  .tabs-section { display: flex; flex-direction: column; gap: 4px; padding: 8px 6px; }
  .tabs-section.drop-zone-active { background-color: var(--background-modifier-hover); }
  .tabs-bottom { display: flex; flex-direction: column; gap: 4px; padding: 8px 6px; border-top: 1px solid var(--border-color); }
  .section-divider { display: flex; align-items: center; justify-content: center; padding: 4px 8px; min-height: 12px; cursor: default; transition: background-color 0.15s; }
  .section-divider.drop-zone-active { background-color: var(--interactive-accent); opacity: 0.2; min-height: 24px; }
  .divider-line { width: 24px; height: 1px; background-color: var(--border-color); border-radius: 1px; }
</style>
