<script lang="ts">
  import {
    currentCanvas,
    activePageId,
    addPage,
    renamePage,
    deletePage,
    switchPage,
  } from '@/stores/canvas/canvasStore';
  import Icon from '@/components/icons/Icon.svelte';

  let newPageName = '';
  let editingPageId: string | null = null;
  let editName = '';

  function handleAddPage() {
    const name = newPageName.trim() || `Page ${($currentCanvas?.pages?.length || 0) + 1}`;
    addPage(name);
    newPageName = '';
  }

  function startRename(pageId: string, currentName: string) {
    editingPageId = pageId;
    editName = currentName;
  }

  function commitRename() {
    if (editingPageId && editName.trim()) {
      renamePage(editingPageId, editName.trim());
    }
    editingPageId = null;
    editName = '';
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') {
      editingPageId = null;
      editName = '';
    }
  }
</script>

<div class="pages-panel">
  <div class="canvas-panel-header">
    <Icon name="layers" size={14} />
    <span class="canvas-panel-title">Pages</span>
    <button class="canvas-btn canvas-btn--icon-sm" onclick={handleAddPage} title="Add page" aria-label="Add page">
      <Icon name="plus" size={14} />
    </button>
  </div>

  <div class="pages-list">
    {#if $currentCanvas?.pages && $currentCanvas.pages.length > 0}
      {#each $currentCanvas.pages as page (page.id)}
        <div
          class="page-item"
          class:active={$activePageId === page.id}
          role="button"
          tabindex="0"
          onclick={() => switchPage(page.id)}
          onkeydown={(e) => e.key === 'Enter' && switchPage(page.id)}
        >
          {#if editingPageId === page.id}
            <input
              class="page-rename-input"
              bind:value={editName}
              onblur={commitRename}
              onkeydown={handleKeyDown}
            />
          {:else}
            <span class="page-name">{page.name}</span>
            <div class="page-actions">
              <button
                class="canvas-btn canvas-btn--icon-sm"
                onclick={(e) => { e.stopPropagation(); startRename(page.id, page.name); }}
                title="Rename"
                aria-label="Rename page"
              >
                <Icon name="edit-2" size={12} />
              </button>
              {#if ($currentCanvas?.pages?.length || 0) > 1}
                <button
                  class="canvas-btn canvas-btn--icon-sm danger"
                  onclick={(e) => { e.stopPropagation(); deletePage(page.id); }}
                  title="Delete"
                  aria-label="Delete page"
                >
                  <Icon name="trash-2" size={12} />
                </button>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    {:else}
      <div class="empty-state">
        <p>No pages yet</p>
      </div>
    {/if}
  </div>
</div>

<style>
  @import '$lib/styles/canvas-components.css';

  .pages-panel {
    border-bottom: 1px solid var(--border-color);
    max-height: 200px;
    display: flex;
    flex-direction: column;
  }

  .pages-list {
    flex: 1;
    overflow-y: auto;
  }

  .page-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-xs) var(--spacing-m);
    cursor: pointer;
    transition: background var(--transition-fast);
    border-left: 3px solid transparent;
  }

  .page-item:hover {
    background: var(--background-modifier-hover);
  }

  .page-item.active {
    background: var(--interactive-hover);
    border-left-color: var(--interactive-accent);
  }

  .page-name {
    font-size: var(--font-smaller);
    color: var(--text-normal);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .page-actions {
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity var(--transition-fast);
  }

  .page-item:hover .page-actions {
    opacity: 1;
  }

  .page-rename-input {
    flex: 1;
    padding: 2px var(--spacing-xs);
    font-size: var(--font-smaller);
    background: var(--background-primary);
    border: 1px solid var(--interactive-accent);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    outline: none;
  }
</style>
