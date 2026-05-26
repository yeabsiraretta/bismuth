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
    <button class="btn-primary" on:click={() => (isCreating = true)}>
      + New Canvas
    </button>
  </div>

  {#if isCreating}
    <div class="create-form">
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
    <input
      type="search"
      bind:value={searchQuery}
      placeholder="Search canvases..."
    />
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
            >
              📂
            </button>
            <button
              class="btn-icon btn-danger"
              on:click={() => handleDeleteCanvas(canvas.id, canvas.name)}
              title="Delete"
            >
              🗑️
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
    padding: 1.5rem;
    background: #f9fafb;
    overflow: hidden;
  }

  .library-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .library-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
  }

  .create-form {
    background: white;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    border: 1px solid #e5e7eb;
  }

  .create-form input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .search-bar {
    margin-bottom: 1rem;
  }

  .search-bar input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
  }

  .canvas-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    overflow-y: auto;
    padding-bottom: 1rem;
  }

  .canvas-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: hidden;
    transition: all 0.2s;
    cursor: pointer;
  }

  .canvas-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .canvas-preview {
    height: 150px;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid #e5e7eb;
  }

  .preview-placeholder {
    text-align: center;
    color: #6b7280;
  }

  .element-count {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .canvas-info {
    padding: 1rem;
  }

  .canvas-name {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
  }

  .canvas-meta {
    margin: 0;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .canvas-actions {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .btn-primary {
    padding: 0.5rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-primary:hover {
    background: #2563eb;
  }

  .btn-secondary {
    padding: 0.5rem 1rem;
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-secondary:hover {
    background: #f3f4f6;
  }

  .btn-icon {
    padding: 0.5rem;
    background: transparent;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.15s;
  }

  .btn-icon:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  .btn-danger:hover {
    background: #fee2e2;
    border-color: #ef4444;
  }

  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 3rem 1rem;
    color: #6b7280;
  }

  .empty-state p {
    margin: 0.5rem 0;
  }

  .hint {
    font-size: 0.875rem;
    color: #9ca3af;
  }
</style>
