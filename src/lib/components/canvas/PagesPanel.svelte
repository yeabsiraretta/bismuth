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
  <div class="panel-header">
    <Icon name="layers" size={14} />
    <span class="panel-title">Pages</span>
    <button class="btn-add" on:click={handleAddPage} title="Add page" aria-label="Add page">
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
          on:click={() => switchPage(page.id)}
          on:keydown={(e) => e.key === 'Enter' && switchPage(page.id)}
        >
          {#if editingPageId === page.id}
            <input
              class="page-rename-input"
              bind:value={editName}
              on:blur={commitRename}
              on:keydown={handleKeyDown}
              autofocus
            />
          {:else}
            <span class="page-name">{page.name}</span>
            <div class="page-actions">
              <button
                class="btn-icon-sm"
                on:click|stopPropagation={() => startRename(page.id, page.name)}
                title="Rename"
                aria-label="Rename page"
              >
                <Icon name="edit-2" size={12} />
              </button>
              {#if ($currentCanvas?.pages?.length || 0) > 1}
                <button
                  class="btn-icon-sm danger"
                  on:click|stopPropagation={() => deletePage(page.id)}
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
  .pages-panel {
    border-bottom: 1px solid var(--border-color);
    max-height: 200px;
    display: flex;
    flex-direction: column;
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-s) var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
    background: var(--background-secondary);
  }

  .panel-title {
    flex: 1;
    font-size: var(--font-smaller);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }

  .btn-add {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    background: none;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-add:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
    border-color: var(--border-color);
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

  .btn-icon-sm {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-icon-sm:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .btn-icon-sm.danger:hover {
    color: var(--text-error);
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

  .empty-state {
    padding: var(--spacing-m);
    text-align: center;
    color: var(--text-faint);
    font-size: var(--font-smaller);
  }
</style>
