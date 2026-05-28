<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

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

  // Breadcrumb navigation
  $: breadcrumbs = currentNotePath ? currentNotePath.split('/').filter(Boolean) : [];

  function handleUndo() {
    onUndo?.();
  }

  function handleRedo() {
    onRedo?.();
  }

  function handleFormat(format: string) {
    onFormat?.({ format });
  }

  function handleViewMode(mode: 'edit' | 'preview' | 'split') {
    viewMode = mode;
    onViewModeChange?.({ mode });
  }

  function navigateToBreadcrumb(index: number) {
    const path = breadcrumbs.slice(0, index + 1).join('/');
    onNavigate?.({ path });
  }
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
    <button class="toolbar-btn" on:click={() => handleFormat('bold')} title="Bold (Cmd+B)">
      <Icon name="bold" size={16} />
    </button>
    <button class="toolbar-btn" on:click={() => handleFormat('italic')} title="Italic (Cmd+I)">
      <Icon name="italic" size={16} />
    </button>
    <button
      class="toolbar-btn"
      on:click={() => handleFormat('strikethrough')}
      title="Strikethrough"
    >
      <Icon name="strikethrough" size={16} />
    </button>

    <div class="separator"></div>

    <button class="toolbar-btn" on:click={() => handleFormat('h1')} title="Heading 1"> H₁ </button>
    <button class="toolbar-btn" on:click={() => handleFormat('h2')} title="Heading 2"> H₂ </button>
    <button class="toolbar-btn" on:click={() => handleFormat('h3')} title="Heading 3"> H₃ </button>

    <div class="separator"></div>

    <button class="toolbar-btn" on:click={() => handleFormat('link')} title="Insert link (Cmd+K)">
      <Icon name="link" size={16} />
    </button>
    <button class="toolbar-btn" on:click={() => handleFormat('image')} title="Insert image">
      <Icon name="image" size={16} />
    </button>
    <button class="toolbar-btn" on:click={() => handleFormat('code')} title="Code block">
      <Icon name="code" size={16} />
    </button>
    <button class="toolbar-btn" on:click={() => handleFormat('quote')} title="Quote">
      <Icon name="quote" size={16} />
    </button>

    <div class="separator"></div>

    <button class="toolbar-btn" on:click={() => handleFormat('ul')} title="Bullet list">
      <Icon name="list" size={16} />
    </button>
    <button class="toolbar-btn" on:click={() => handleFormat('ol')} title="Numbered list">
      <Icon name="list-ordered" size={16} />
    </button>
    <button class="toolbar-btn" on:click={() => handleFormat('checklist')} title="Checklist">
      <Icon name="check-square" size={16} />
    </button>

    <div class="separator"></div>

    <button class="toolbar-btn" on:click={() => handleFormat('table')} title="Insert table">
      <Icon name="table" size={16} />
    </button>
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
    padding: 8px 12px;
    background-color: var(--background-primary);
    border-bottom: 1px solid var(--border-color);
    min-height: 44px;
    gap: 8px;
  }

  .toolbar-section {
    display: flex;
    align-items: center;
    gap: 4px;
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
    min-width: 32px;
    height: 32px;
    padding: 0 6px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: 14px;
    font-weight: 500;
  }

  .toolbar-btn:hover:not(:disabled) {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }

  .toolbar-btn:active:not(:disabled) {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .toolbar-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .separator {
    width: 1px;
    height: 20px;
    background-color: var(--border-color);
    margin: 0 4px;
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
    font-size: 12px;
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
    font-size: 12px;
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
    font-weight: 500;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .toolbar-center {
      display: none;
    }
  }
</style>
