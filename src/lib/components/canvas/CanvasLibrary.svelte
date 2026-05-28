<script lang="ts">
  import { onMount } from 'svelte';
  import {
    canvasList,
    refreshCanvasList,
    createNewCanvas,
    loadCanvas,
    deleteCanvasById,
  } from '@/stores/canvas/canvasStore';
  import { log } from '@/utils/logger';
  import Icon from '@/components/icons/Icon.svelte';

  let searchQuery = '';
  let isCreating = false;
  let newCanvasName = '';

  onMount(async () => {
    log.info('CanvasLibrary mounted');
    await refreshCanvasList();
  });

  async function handleCreateCanvas() {
    if (!newCanvasName.trim()) {
      log.warn('Canvas name is empty');
      return;
    }

    try {
      await createNewCanvas(newCanvasName);
      newCanvasName = '';
      isCreating = false;
      await refreshCanvasList();
    } catch (error) {
      log.error('Failed to create canvas', error as Error);
    }
  }

  async function handleLoadCanvas(id: string) {
    try {
      await loadCanvas(id);
      log.info('Canvas loaded from library', { id });
    } catch (error) {
      log.error('Failed to load canvas', error as Error);
    }
  }

  async function handleDeleteCanvas(id: string, name: string) {
    if (!confirm(`Delete canvas "${name}"?`)) {
      return;
    }

    try {
      await deleteCanvasById(id);
      log.info('Canvas deleted from library', { id, name });
    } catch (error) {
      log.error('Failed to delete canvas', error as Error);
    }
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  $: filteredCanvases = $canvasList.filter((canvas) =>
    canvas.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
</script>

<div class="canvas-library">
  <div class="library-header">
    <h2>Canvas Library</h2>
    <button class="btn-primary" on:click={() => (isCreating = true)}> + New Canvas </button>
  </div>

  {#if isCreating}
    <div class="create-form">
      <!-- svelte-ignore a11y_autofocus -->
      <input
        type="text"
        bind:value={newCanvasName}
        placeholder="Canvas name..."
        on:keydown={(e) => e.key === 'Enter' && handleCreateCanvas()}
        autofocus
      />
      <div class="form-actions">
        <button class="btn-primary" on:click={handleCreateCanvas}>Create</button>
        <button class="btn-secondary" on:click={() => (isCreating = false)}>Cancel</button>
      </div>
    </div>
  {/if}

  <div class="search-bar">
    <input type="search" bind:value={searchQuery} placeholder="Search canvases..." />
  </div>

  <div class="canvas-grid">
    {#if filteredCanvases.length === 0}
      <div class="empty-state">
        <p>No canvases found</p>
        <p class="hint">Create your first canvas to get started</p>
      </div>
    {:else}
      {#each filteredCanvases as canvas (canvas.id)}
        <div class="canvas-card">
          <div class="canvas-preview">
            <div class="preview-placeholder">
              <span class="element-count">{canvas.elements.length} elements</span>
            </div>
          </div>
          <div class="canvas-info">
            <h3 class="canvas-name">{canvas.name}</h3>
            <p class="canvas-meta">
              Modified {formatDate(canvas.modified_at)}
            </p>
          </div>
          <div class="canvas-actions">
            <button
              class="btn-icon"
              on:click={() => handleLoadCanvas(canvas.id)}
              title="Open"
              aria-label="Open canvas"
            >
              <Icon name="folder-open" size={16} />
            </button>
            <button
              class="btn-icon btn-danger"
              on:click={() => handleDeleteCanvas(canvas.id, canvas.name)}
              title="Delete"
              aria-label="Delete canvas"
            >
              <Icon name="trash-2" size={16} />
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .canvas-library {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: var(--spacing-l);
    background: var(--background-primary-alt);
    overflow: hidden;
  }

  .library-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-l);
  }

  .library-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: var(--font-semibold);
    color: var(--text-primary);
  }

  .create-form {
    background: var(--background-primary);
    padding: var(--spacing-m);
    border-radius: var(--radius-m);
    margin-bottom: var(--spacing-m);
    border: 1px solid var(--border-color);
  }

  .create-form input {
    width: 100%;
    padding: var(--spacing-s);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: var(--font-smaller);
    margin-bottom: var(--spacing-s);
    background: var(--background-modifier-form-field);
    color: var(--text-normal);
  }

  .form-actions {
    display: flex;
    gap: var(--spacing-s);
    justify-content: flex-end;
  }

  .search-bar {
    margin-bottom: var(--spacing-m);
  }

  .search-bar input {
    width: 100%;
    padding: var(--spacing-s) var(--spacing-m);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m);
    font-size: var(--font-smaller);
    background: var(--background-modifier-form-field);
    color: var(--text-normal);
  }

  .canvas-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--spacing-m);
    overflow-y: auto;
    padding-bottom: var(--spacing-m);
  }

  .canvas-card {
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m);
    overflow: hidden;
    transition: all var(--transition-medium);
    cursor: pointer;
  }

  .canvas-card:hover {
    border-color: var(--interactive-accent);
    box-shadow: var(--shadow-m);
  }

  .canvas-preview {
    height: 150px;
    background: var(--background-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid var(--border-color);
  }

  .preview-placeholder {
    text-align: center;
    color: var(--text-muted);
  }

  .element-count {
    font-size: var(--font-smaller);
    font-weight: var(--font-medium);
  }

  .canvas-info {
    padding: var(--spacing-m);
  }

  .canvas-name {
    margin: 0 0 var(--spacing-xs) 0;
    font-size: var(--font-ui-medium);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
  }

  .canvas-meta {
    margin: 0;
    font-size: var(--font-smallest);
    color: var(--text-muted);
  }

  .canvas-actions {
    display: flex;
    gap: var(--spacing-s);
    padding: var(--spacing-s) var(--spacing-m);
    border-top: 1px solid var(--border-color);
    background: var(--background-primary-alt);
  }

  .btn-primary {
    padding: var(--spacing-s) var(--spacing-m);
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-s);
    font-size: var(--font-smaller);
    font-weight: var(--font-medium);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .btn-primary:hover {
    background: var(--interactive-accent-hover);
  }

  .btn-secondary {
    padding: var(--spacing-s) var(--spacing-m);
    background: var(--background-primary);
    color: var(--text-normal);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: var(--font-smaller);
    font-weight: var(--font-medium);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-secondary:hover {
    background: var(--background-modifier-hover);
  }

  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-s);
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-icon:hover {
    background: var(--background-modifier-hover);
    border-color: var(--border-hover);
  }

  .btn-danger:hover {
    background: var(--background-modifier-error);
    border-color: var(--text-error);
    color: var(--text-on-accent);
  }

  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: var(--spacing-xxl) var(--spacing-m);
    color: var(--text-muted);
  }

  .empty-state p {
    margin: var(--spacing-s) 0;
  }

  .hint {
    font-size: var(--font-smaller);
    color: var(--text-faint);
  }
</style>
