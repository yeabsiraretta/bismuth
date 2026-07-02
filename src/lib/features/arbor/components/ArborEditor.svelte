<script lang="ts">
  import ArborCard from './ArborCard.svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import {
    arborTree,
    arborSelection,
    arborConfig,
    breadcrumbPath,
    selectBlock,
    enterEditMode,
    createRootBlock,
    createChildBlock,
    createSiblingBlock,
    deleteBlock,
    navigateParent,
    navigateChild,
    navigatePrevSibling,
    navigateNextSibling,
    arborUndo,
    arborRedo,
  } from '../stores/arborStore';
  import { getChildren, getRootBlocks } from '../types';
  import type { ArborBlock } from '../types';

  function handleKeydown(e: KeyboardEvent) {
    if ($arborSelection.editing) return;

    const meta = e.metaKey || e.ctrlKey;
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        meta ? createSiblingBlock($arborSelection.blockId!, 'above') : navigatePrevSibling();
        break;
      case 'ArrowDown':
        e.preventDefault();
        meta ? createSiblingBlock($arborSelection.blockId!, 'below') : navigateNextSibling();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        navigateParent();
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (meta && $arborSelection.blockId) createChildBlock($arborSelection.blockId);
        else navigateChild();
        break;
      case 'Enter':
        e.preventDefault();
        if ($arborSelection.blockId) enterEditMode();
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        if ($arborSelection.blockId) deleteBlock($arborSelection.blockId, false);
        break;
      case 'z':
        if (meta) {
          e.preventDefault();
          e.shiftKey ? arborRedo() : arborUndo();
        }
        break;
    }
  }

  function handleWheel(e: WheelEvent) {
    if ((e.metaKey || e.ctrlKey) && $arborConfig.dragEnabled) {
      e.preventDefault();
      arborConfig.update((c) => ({
        ...c,
        zoom: Math.max(0.25, Math.min(2, c.zoom + (e.deltaY > 0 ? -0.05 : 0.05))),
      }));
    }
  }

  function resetZoom() {
    arborConfig.update((c) => ({ ...c, zoom: 1 }));
  }

  function getBlockChildren(blockId: string): ArborBlock[] {
    if (!$arborTree) return [];
    return getChildren($arborTree.blocks, blockId);
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="arbor-editor"
  role="application"
  aria-label="Arbor branching editor"
  on:keydown={handleKeydown}
  on:wheel={handleWheel}
  tabindex="-1"
>
  <!-- Toolbar -->
  <div class="arbor-toolbar">
    {#if $arborConfig.showBreadcrumbs && $breadcrumbPath.length > 0}
      <div class="breadcrumbs">
        {#each $breadcrumbPath as crumb, i}
          <button
            class="crumb"
            class:active={crumb.id === $arborSelection.blockId}
            on:click={() => selectBlock(crumb.id)}
          >
            {crumb.content.split('\n')[0]?.slice(0, 30) || '…'}
          </button>
          {#if i < $breadcrumbPath.length - 1}
            <span class="crumb-sep">›</span>
          {/if}
        {/each}
      </div>
    {/if}
    <div class="toolbar-actions">
      <button class="tool-btn" title="New root block" on:click={createRootBlock}>
        <Icon name="plus" size={14} />
      </button>
      <button class="tool-btn" title="Undo" on:click={arborUndo}>
        <Icon name="corner-up-left" size={14} />
      </button>
      <button class="tool-btn zoom-indicator" title="Reset zoom" on:click={resetZoom}>
        {Math.round($arborConfig.zoom * 100)}%
      </button>
    </div>
  </div>

  <!-- Scene canvas -->
  <div
    class="arbor-scene"
    style="transform: scale({$arborConfig.zoom}); transform-origin: top left;"
  >
    {#if $arborTree}
      <div class="arbor-columns">
        {#each getRootBlocks($arborTree.blocks) as root}
          <div class="arbor-branch">
            <ArborCard block={root} selected={$arborSelection.blockId === root.id} />
            {#if getBlockChildren(root.id).length > 0}
              <div class="arbor-children">
                {#each getBlockChildren(root.id) as child}
                  <ArborCard block={child} selected={$arborSelection.blockId === child.id} />
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty-state">
        <Icon name="git-branch" size={32} />
        <p>Open a note to start branching</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .arbor-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--background-primary);
    outline: none;
  }
  .arbor-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-xs) var(--spacing-s);
    border-bottom: 1px solid var(--border-color);
    min-height: 32px;
    gap: var(--spacing-s);
  }
  .breadcrumbs {
    display: flex;
    align-items: center;
    gap: 2px;
    overflow-x: auto;
    flex: 1;
    min-width: 0;
  }
  .crumb {
    font-size: 11px;
    color: var(--text-muted);
    background: none;
    border: none;
    padding: 2px 6px;
    border-radius: var(--radius-s);
    cursor: pointer;
    white-space: nowrap;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: background var(--transition-fast);
  }
  .crumb:hover {
    background: var(--background-modifier-hover);
  }
  .crumb.active {
    color: var(--text-normal);
    font-weight: var(--font-medium);
  }
  .crumb-sep {
    color: var(--text-faint);
    font-size: 10px;
  }
  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  .tool-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    transition:
      background var(--transition-fast),
      color var(--transition-fast);
  }
  .tool-btn:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }
  .zoom-indicator {
    width: auto;
    padding: 0 6px;
    font-size: 10px;
  }
  .arbor-scene {
    flex: 1;
    overflow: auto;
    padding: var(--spacing-l);
  }
  .arbor-columns {
    display: flex;
    gap: var(--spacing-l);
    align-items: flex-start;
  }
  .arbor-branch {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-m);
  }
  .arbor-children {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    gap: var(--spacing-s);
    color: var(--text-faint);
  }
  .empty-state p {
    margin: 0;
    font-size: var(--font-ui-small);
  }
</style>
