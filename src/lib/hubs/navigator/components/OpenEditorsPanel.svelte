<script lang="ts">
  import BIcon from '@/ui/b-icon.svelte';
  import { goto } from '$app/navigation';
  import {
    closeAllTabs,
    closeOtherTabs,
    closeTab,
    getActiveTabId,
    getTabs,
    pinTab,
    switchTab,
  } from '@/hubs/editor/stores/editor-tabs.svelte';
  import { setActiveNote } from '@/hubs/core/stores/vault-store.svelte';
  import ContextMenu from '@/ui/context-menu.svelte';
  import Panel from '@/ui/panel.svelte';

  let tabs = $derived(getTabs());
  let activeId = $derived(getActiveTabId());

  function selectTab(id: string, path: string) {
    switchTab(id);
    setActiveNote(path);
    goto('/editor');
  }

  interface TabRef {
    id: string;
    path: string;
  }
  let ctxTab: TabRef | null = $state(null);
  let ctxX = $state(0);
  let ctxY = $state(0);

  function handleContext(e: MouseEvent, tab: TabRef) {
    e.preventDefault();
    ctxTab = tab;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }

  function closeCtx() {
    ctxTab = null;
  }
</script>

<Panel title="Open Editors">
  {#if tabs.length === 0}
    <div class="panel-empty">No open editors</div>
  {:else}
    <ul class="oe-list">
      {#each tabs as tab (tab.id)}
        <li class="oe-item" class:active={tab.id === activeId}>
          <button
            class="oe-btn"
            onclick={() => selectTab(tab.id, tab.path)}
            ondblclick={() => tab.ephemeral && pinTab(tab.id)}
            oncontextmenu={(e) => handleContext(e, tab)}
            title={tab.path}
          >
            <BIcon name="documentBlank" size={14} class="oe-icon" />
            <span class="oe-name" class:italic={tab.ephemeral}>{tab.title}</span>
            {#if tab.dirty}
              <span class="oe-dot" aria-label="Unsaved"></span>
            {/if}
          </button>
          <button
            class="oe-close"
            onclick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
            aria-label="Close {tab.title}"
          >
            <BIcon name="close" size={12} class="oe-close-icon" />
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</Panel>

<ContextMenu x={ctxX} y={ctxY} show={!!ctxTab} onclose={closeCtx}>
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxTab) closeTab(ctxTab.id);
      closeCtx();
    }}
    role="menuitem">Close</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxTab) closeOtherTabs(ctxTab.id);
      closeCtx();
    }}
    role="menuitem">Close Others</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      closeAllTabs();
      closeCtx();
    }}
    role="menuitem">Close All</button
  >
  <div class="ctx-sep"></div>
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxTab) navigator.clipboard.writeText(ctxTab.path);
      closeCtx();
    }}
    role="menuitem">Copy Path</button
  >
</ContextMenu>

<style>
  .oe-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .oe-item {
    display: flex;
    align-items: center;
    border-radius: var(--radius-s);
  }
  .oe-item:hover {
    background: var(--color-surface-hover);
  }
  .oe-item.active {
    background: var(--color-surface);
  }
  .oe-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
    padding: 4px 8px;
    border: none;
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    font-size: 0.75rem;
    font-family: inherit;
    text-align: left;
  }
  .oe-btn :global(.oe-icon) {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: var(--color-text-muted);
  }
  .oe-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .oe-name.italic {
    font-style: italic;
  }
  .oe-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-accent);
    flex-shrink: 0;
  }
  .oe-close {
    padding: 2px;
    border: none;
    background: transparent;
    color: var(--color-text-subtle);
    cursor: pointer;
    border-radius: var(--radius-s);
    margin-right: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
  }
  .oe-item:hover .oe-close {
    opacity: 1;
  }
  .oe-close:hover {
    color: var(--color-error);
    background: var(--color-surface-hover);
  }
  .oe-close :global(.oe-close-icon) {
    width: 12px;
    height: 12px;
  }
</style>
