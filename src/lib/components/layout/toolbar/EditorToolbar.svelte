<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import EditorToolbarFormatting from './EditorToolbarFormatting.svelte';
  import { buildBreadcrumbs, resolveBreadcrumbPath } from './editorToolbarActions';

  export let currentNotePath: string = '';
  export let canUndo: boolean = false;
  export let canRedo: boolean = false;
  export let viewMode: 'edit' | 'preview' | 'split' = 'edit';
  export let onUndo: (() => void) | undefined = undefined;
  export let onRedo: (() => void) | undefined = undefined;
  export let onFormat: ((detail: { format: string }) => void) | undefined = undefined;
  export let onViewModeChange: ((detail: { mode: string }) => void) | undefined = undefined;
  export let onNavigate: ((detail: { path: string }) => void) | undefined = undefined;
  export let onBack: (() => void) | undefined = undefined;
  export let onForward: (() => void) | undefined = undefined;
  export let onShare: (() => void) | undefined = undefined;
  export let onMore: (() => void) | undefined = undefined;
  export let onFullscreen: (() => void) | undefined = undefined;

  $: breadcrumbs = buildBreadcrumbs(currentNotePath);

  function handleUndo() { onUndo?.(); }
  function handleRedo() { onRedo?.(); }
  function handleFormat(format: string) { onFormat?.({ format }); }
  function formatHandler(f: string) { handleFormat(f); }
  function handleViewMode(mode: 'edit' | 'preview' | 'split') { viewMode = mode; onViewModeChange?.({ mode }); }
  function navigateToBreadcrumb(index: number) { onNavigate?.({ path: resolveBreadcrumbPath(breadcrumbs, index) }); }
</script>

<div class="editor-toolbar">
  <!-- Left section: Navigation and history -->
  <div class="toolbar-section toolbar-left">
    <button class="toolbar-btn" on:click={() => onBack?.()} title="Go back">
      <Icon name="arrow-left" size={16} />
    </button>
    <button class="toolbar-btn" on:click={() => onForward?.()} title="Go forward">
      <Icon name="arrow-right" size={16} />
    </button>

    <div class="separator"></div>

    <button class="toolbar-btn" disabled={!canUndo} on:click={handleUndo} title="Undo (Cmd+Z)">
      <Icon name="corner-up-left" size={16} />
    </button>
    <button
      class="toolbar-btn"
      disabled={!canRedo}
      on:click={handleRedo}
      title="Redo (Cmd+Shift+Z)"
    >
      <Icon name="corner-up-right" size={16} />
    </button>
  </div>

  <!-- Center section: Formatting tools -->
  <div class="toolbar-section toolbar-center">
    <EditorToolbarFormatting onFormat={formatHandler} {onFullscreen} />
  </div>

  <!-- Right section: View controls and more -->
  <div class="toolbar-section toolbar-right">
    <div class="view-mode-toggle">
      <button
        class="view-mode-btn"
        class:active={viewMode === 'edit'}
        on:click={() => handleViewMode('edit')}
        title="Edit mode"
      >
        <Icon name="edit-3" size={16} />
      </button>
      <button
        class="view-mode-btn"
        class:active={viewMode === 'preview'}
        on:click={() => handleViewMode('preview')}
        title="Preview mode"
      >
        <Icon name="eye" size={16} />
      </button>
      <button
        class="view-mode-btn"
        class:active={viewMode === 'split'}
        on:click={() => handleViewMode('split')}
        title="Split view"
      >
        <Icon name="columns" size={16} />
      </button>
    </div>

    <div class="separator"></div>

    <button class="toolbar-btn" on:click={() => onShare?.()} title="Share">
      <Icon name="share" size={16} />
    </button>
    <button class="toolbar-btn" on:click={() => onMore?.()} title="More options">
      <Icon name="more-horizontal" size={16} />
    </button>
  </div>
</div>

<!-- Breadcrumb bar (below toolbar) -->
{#if breadcrumbs.length > 0}
  <div class="breadcrumb-bar">
    <Icon name="home" size={12} />
    {#each breadcrumbs as crumb, index}
      <Icon name="chevron-right" size={10} />
      <button class="breadcrumb-item" on:click={() => navigateToBreadcrumb(index)}>
        {crumb}
      </button>
    {/each}
  </div>
{/if}

<style>
  .editor-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--spacing-m, 12px);
    background-color: var(--background-primary);
    border-bottom: 1px solid var(--border-color);
    height: var(--panel-header-height);
    min-height: var(--panel-header-height);
    flex-shrink: 0;
    gap: var(--spacing-s, 8px);
  }

  .toolbar-section {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs, 4px);
  }

  .toolbar-left {
    flex-shrink: 0;
  }

  .toolbar-center {
    flex: 1;
    justify-content: center;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .toolbar-center::-webkit-scrollbar {
    display: none;
  }

  .toolbar-right {
    flex-shrink: 0;
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .toolbar-btn:hover:not(:disabled) {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }

  .toolbar-btn:active:not(:disabled) {
    color: var(--interactive-accent);
  }

  .toolbar-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .view-mode-toggle {
    display: flex;
    background-color: var(--background-secondary);
    border-radius: var(--radius-s);
    padding: 2px;
    gap: 2px;
  }

  .view-mode-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 28px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .view-mode-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }

  .view-mode-btn.active {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .breadcrumb-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    background-color: var(--background-secondary);
    border-bottom: 1px solid var(--border-color);
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .breadcrumb-bar::-webkit-scrollbar {
    display: none;
  }

  .breadcrumb-item {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: var(--font-ui-smaller);
    cursor: pointer;
    padding: 2px 4px;
    border-radius: var(--radius-s);
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .breadcrumb-item:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }

  .breadcrumb-item:last-child {
    color: var(--text-normal);
    font-weight: var(--font-medium);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .toolbar-center {
      display: none;
    }
  }
</style>
