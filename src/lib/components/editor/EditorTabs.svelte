<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    editorTabs, activeEditorTabId, tabOrientation,
    switchTab, closeTab, closeOtherTabs,
  } from '@/stores/editor/tabs';
  import {
    tabGroups, pinTab, closeTabsToRight, closeTabsToLeft,
    createTabGroup, toggleGroupCollapse,
  } from '@/stores/editor/tabFeatures';
  import type { EditorTab, TabGroup } from '@/stores/editor/tabs';
  import { moveTabToGroup } from '@/stores/editor/tabs';

  let ctxTab: EditorTab | null = null;
  let ctxX = 0;
  let ctxY = 0;

  function handleMiddleClick(e: MouseEvent, tabId: string) {
    if (e.button === 1) { e.preventDefault(); closeTab(tabId); }
  }

  function handleContext(e: MouseEvent, tab: EditorTab) {
    e.preventDefault();
    ctxTab = tab; ctxX = e.clientX; ctxY = e.clientY;
  }

  function closeCtx() { ctxTab = null; }

  function handleNewGroup() {
    if (!ctxTab) return;
    const gid = createTabGroup('Group');
    moveTabToGroup(ctxTab.id, gid);
    closeCtx();
  }

  function handleMoveToGroup(groupId: string) {
    if (!ctxTab) return;
    moveTabToGroup(ctxTab.id, groupId);
    closeCtx();
  }

  $: groupedTabs = (() => {
    const groups: Map<string | null, EditorTab[]> = new Map();
    for (const tab of $editorTabs) {
      const key = tab.groupId;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tab);
    }
    return groups;
  })();

  function groupFor(id: string): TabGroup | undefined {
    return $tabGroups.find(g => g.id === id);
  }
</script>

<svelte:window on:click={closeCtx} />

{#if $editorTabs.length > 0}
  <div class="editor-tabs" class:vertical={$tabOrientation === 'vertical'} class:horizontal={$tabOrientation === 'horizontal'} role="tablist" aria-label="Open notes">
    {#each [...groupedTabs.entries()] as [groupId, tabs] (groupId ?? '__ungrouped')}
      {@const group = groupId ? groupFor(groupId) : null}
      {#if group}
        <button class="group-header" style="--grp-color: {group.color}" on:click={() => toggleGroupCollapse(group.id)} title={group.name}>
          <Icon name={group.collapsed ? 'chevron-right' : 'chevron-down'} size={10} />
          <span class="group-name">{group.name}</span>
          <span class="group-count">{tabs.length}</span>
        </button>
      {/if}
      {#if !group?.collapsed}
        {#each tabs as tab (tab.id)}
          <div class="tab-item" class:active={tab.id === $activeEditorTabId} class:dirty={tab.dirty} class:ephemeral={tab.ephemeral}
            style={group ? `border-left-color: ${group.color}` : ''}
            role="tab" aria-selected={tab.id === $activeEditorTabId} tabindex="0"
            on:click={() => switchTab(tab.id)} on:mousedown={(e) => handleMiddleClick(e, tab.id)}
            on:dblclick={() => tab.ephemeral && pinTab(tab.id)}
            on:contextmenu={(e) => handleContext(e, tab)}
            on:keydown={(e) => e.key === 'Enter' && switchTab(tab.id)}
          >
            <Icon name="file-text" size={14} />
            <span class="tab-title" class:italic={tab.ephemeral}>{tab.title}</span>
            {#if tab.dirty}<span class="dirty-dot" aria-label="Unsaved changes"></span>{/if}
            {#if tab.zoomLevel !== 100}<span class="zoom-badge">{tab.zoomLevel}%</span>{/if}
            <button class="tab-close" on:click|stopPropagation={() => closeTab(tab.id)} aria-label="Close {tab.title}">
              <Icon name="x" size={10} />
            </button>
          </div>
        {/each}
      {/if}
    {/each}
  </div>
{/if}

{#if ctxTab}
  <div class="ctx-menu" style="left:{ctxX}px;top:{ctxY}px" role="menu">
    {#if ctxTab.ephemeral}
      <button class="ctx-item" role="menuitem" on:click={() => { pinTab(ctxTab.id); closeCtx(); }}>Pin Tab</button>
    {/if}
    <button class="ctx-item" role="menuitem" on:click={() => { closeOtherTabs(ctxTab.id); closeCtx(); }}>Close Others</button>
    <button class="ctx-item" role="menuitem" on:click={() => { closeTabsToRight(ctxTab.id); closeCtx(); }}>Close to Right</button>
    <button class="ctx-item" role="menuitem" on:click={() => { closeTabsToLeft(ctxTab.id); closeCtx(); }}>Close to Left</button>
    <div class="ctx-sep"></div>
    <button class="ctx-item" role="menuitem" on:click={handleNewGroup}>Move to New Group</button>
    {#each $tabGroups as g (g.id)}
      {#if g.id !== ctxTab?.groupId}
        <button class="ctx-item" role="menuitem" on:click={() => handleMoveToGroup(g.id)}>Move to {g.name}</button>
      {/if}
    {/each}
    {#if ctxTab.groupId}
      <button class="ctx-item" role="menuitem" on:click={() => { moveTabToGroup(ctxTab.id, null); closeCtx(); }}>Remove from Group</button>
    {/if}
  </div>
{/if}

<style>
  .editor-tabs { display: flex; align-items: center; background: var(--background-secondary); border-bottom: 1px solid var(--border-color); min-height: var(--tab-height); overflow: hidden; }
  .editor-tabs.vertical { flex-direction: column; align-items: stretch; border-bottom: none; min-height: unset; height: 100%; overflow-y: auto; }

  .group-header { display: flex; align-items: center; gap: 4px; padding: 3px var(--spacing-s); background: none; border: none; border-left: 3px solid var(--grp-color, var(--text-muted)); cursor: pointer; font-size: var(--font-ui-small); color: var(--text-muted); width: 100%; }
  .group-header:hover { background: var(--background-modifier-hover); }
  .group-name { flex: 1; text-align: left; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
  .group-count { font-size: 10px; opacity: 0.6; }

  .tab-item { display: flex; align-items: center; gap: var(--spacing-xs); padding: var(--spacing-xs) var(--spacing-s); background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; font-size: var(--font-ui-small); color: var(--text-muted); white-space: nowrap; max-width: 160px; transition: background 0.1s, color 0.1s; }
  .tab-item:hover { background: var(--tab-hover-bg); color: var(--text-normal); }
  .tab-item.active { background: var(--background-primary); color: var(--text-normal); border-bottom-color: var(--tab-active-indicator); }
  .tab-item.ephemeral { opacity: 0.75; }

  .vertical .tab-item { border-bottom: none; border-left: 2px solid transparent; max-width: unset; width: 100%; }
  .vertical .tab-item.active { border-left-color: var(--tab-active-indicator); border-bottom-color: transparent; }

  .tab-title { overflow: hidden; text-overflow: ellipsis; flex: 1; text-align: left; }
  .tab-title.italic { font-style: italic; }
  .dirty-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--interactive-accent); flex-shrink: 0; }
  .zoom-badge { font-size: 9px; padding: 0 3px; border-radius: 3px; background: var(--background-modifier-hover); color: var(--text-muted); flex-shrink: 0; }

  .tab-close { display: flex; align-items: center; justify-content: center; padding: 2px; border: none; background: transparent; border-radius: var(--radius-xs); cursor: pointer; opacity: 0; color: var(--text-muted); flex-shrink: 0; transition: opacity 0.1s; }
  .tab-item:hover .tab-close { opacity: 1; }
  .tab-close:hover { background: var(--background-modifier-hover); color: var(--text-error); }

  .ctx-menu { position: fixed; z-index: 1000; min-width: 160px; padding: 4px; background: var(--background-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-m, 6px); box-shadow: var(--shadow-l, 0 8px 24px rgba(0,0,0,0.15)); }
  .ctx-item { display: block; width: 100%; padding: 5px 10px; border: none; background: none; text-align: left; font-size: var(--font-ui-small); color: var(--text-normal); cursor: pointer; border-radius: 3px; }
  .ctx-item:hover { background: var(--background-modifier-hover); }
  .ctx-sep { height: 1px; margin: 3px 4px; background: var(--border-color); }
</style>
