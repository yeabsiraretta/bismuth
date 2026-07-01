<script lang="ts">
  import { onMount } from 'svelte';
  import {
    canvasList,
    refreshCanvasList,
    createNewCanvas,
    loadCanvas,
    deleteCanvasById,
    currentCanvas,
  } from '@/features/canvas/stores';
  import { createDesignSystemPages } from '@/features/canvas/services/pageTemplates';
  import { BISMUTH_DESIGN_CANVAS } from '@/config/presets/bismuth-design-canvas';
  import { log } from '@/utils/logger';
  import { openConfirm } from '@/stores/confirm';
  import Icon from '@/components/icons/Icon.svelte';
  import CanvasCardGrid from '@/features/canvas/components/library/CanvasCardGrid.svelte';
  import CanvasCardList from '@/features/canvas/components/library/CanvasCardList.svelte';
  import { sortCanvases, filterCanvases, defaultLibraryState } from './canvasLibraryLogic';
  import type { ViewMode, SortField } from './canvasLibraryLogic';
  import './canvasLibrary.css';

  const _defaults = defaultLibraryState();
  let searchQuery = _defaults.searchQuery;
  let isCreating = _defaults.isCreating;
  let newCanvasName = _defaults.newCanvasName;
  let useDesignTemplate = _defaults.useDesignTemplate;
  let viewMode: ViewMode = _defaults.viewMode;
  let sortField: SortField = _defaults.sortField;

  onMount(async () => {
    log.info('CanvasLibrary mounted');
    await refreshCanvasList();
  });

  async function handleCreateCanvas() {
    if (!newCanvasName.trim()) return;
    try {
      await createNewCanvas(newCanvasName);
      if (useDesignTemplate) {
        currentCanvas.update((c) => { if (c) c.pages = createDesignSystemPages(); return c; });
      }
      newCanvasName = '';
      useDesignTemplate = false;
      isCreating = false;
      await refreshCanvasList();
    } catch (error) {
      log.error('Failed to create canvas', error as Error);
    }
  }

  async function handleCreateSlideDeck() {
    if (!newCanvasName.trim()) return;
    const name = newCanvasName;
    try {
      await createNewCanvas(name);
      currentCanvas.update((c) => c ? { ...c, documentType: 'slides', slideMetadata: [] } : c);
      newCanvasName = '';
      isCreating = false;
      await refreshCanvasList();
    } catch (error) {
      log.error('Failed to create slide deck', error as Error);
    }
  }

  async function handleOpen(detail: { id: string }) {
    try {
      await loadCanvas(detail.id);
    } catch (error) {
      log.error('Failed to load canvas', error as Error);
    }
  }

  async function handleDelete(detail: { id: string; name: string }) {
    openConfirm({
      title: 'Delete Canvas',
      message: `Delete canvas "${detail.name}"?`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteCanvasById(detail.id);
        } catch (error) {
          log.error('Failed to delete canvas', error as Error);
        }
      },
    });
  }

  function loadLivingDesignCanvas() {
    const canvas = { ...BISMUTH_DESIGN_CANVAS, created_at: Math.floor(Date.now() / 1000), modified_at: Math.floor(Date.now() / 1000) };
    currentCanvas.set(canvas);
    log.info('Loaded Bismuth Living Design Canvas');
  }

  $: filtered = filterCanvases($canvasList, searchQuery);
  $: sorted = sortCanvases(filtered, sortField);
</script>

<div class="canvas-library">
  <div class="library-toolbar">
    <div class="toolbar-left">
      <h2 class="library-title">Canvases</h2>
      <span class="canvas-count">{$canvasList.length}</span>
    </div>
    <div class="toolbar-right">
      <select class="sort-select" bind:value={sortField}>
        <option value="modified_at">Last modified</option>
        <option value="created_at">Date created</option>
        <option value="name">Name</option>
      </select>
      <div class="view-toggle">
        <button
          class="toggle-btn" class:active={viewMode === 'grid'}
          on:click={() => (viewMode = 'grid')} title="Grid view" aria-label="Grid view"
        >
          <Icon name="grid" size={16} />
        </button>
        <button
          class="toggle-btn" class:active={viewMode === 'list'}
          on:click={() => (viewMode = 'list')} title="List view" aria-label="List view"
        >
          <Icon name="list" size={16} />
        </button>
      </div>
    </div>
  </div>

  <div class="library-actions">
    <div class="search-bar">
      <Icon name="search" size={14} />
      <input type="search" bind:value={searchQuery} placeholder="Search canvases..." />
    </div>
    <button class="canvas-btn canvas-btn--primary" on:click={() => (isCreating = true)}>
      <Icon name="plus" size={14} /> New Canvas
    </button>
    <button class="canvas-btn canvas-btn--secondary" on:click={loadLivingDesignCanvas} title="Open the Bismuth Living Design Document">
      <Icon name="layers" size={14} /> Design Doc
    </button>
  </div>

  {#if isCreating}
    <div class="create-form">
      <input
        class="canvas-input"
        type="text"
        bind:value={newCanvasName}
        placeholder="Canvas name..."
        on:keydown={(e) => e.key === 'Enter' && handleCreateCanvas()}
      />
      <label class="template-toggle">
        <input type="checkbox" bind:checked={useDesignTemplate} />
        <span>Use Design System template</span>
      </label>
      <div class="form-actions">
        <button class="canvas-btn canvas-btn--primary" on:click={handleCreateCanvas}>Create Canvas</button>
        <button class="canvas-btn canvas-btn--secondary" on:click={handleCreateSlideDeck} title="Create a slide deck">Slide Deck</button>
        <button class="canvas-btn canvas-btn--secondary" on:click={() => (isCreating = false)}>Cancel</button>
      </div>
    </div>
  {/if}

  <div class="library-content">
    {#if viewMode === 'grid'}
      <CanvasCardGrid canvases={sorted} onOpen={handleOpen} onDelete={handleDelete} />
    {:else}
      <CanvasCardList canvases={sorted} onOpen={handleOpen} onDelete={handleDelete} />
    {/if}
  </div>
</div>
