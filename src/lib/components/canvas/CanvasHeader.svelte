<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { selectedElements } from '@/stores/canvas/canvasStore';
  import { canUndo, canRedo } from '@/stores/canvas/historyStore';

  interface Props {
    title?: string;
    showExportMenu?: boolean;
    onBackToLibrary: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onCopy: () => void;
    onPaste: () => void;
    onDuplicate: () => void;
    onAlign: (alignment: 'left' | 'center' | 'right') => void;
    onSave: () => void;
    onToggleExportMenu: () => void;
    onExportPNG: () => void;
    onExportSVG: () => void;
    onExportJSON: () => void;
  }

  let {
    title = 'Untitled',
    showExportMenu = false,
    onBackToLibrary,
    onUndo,
    onRedo,
    onCopy,
    onPaste,
    onDuplicate,
    onAlign,
    onSave,
    onToggleExportMenu,
    onExportPNG,
    onExportSVG,
    onExportJSON,
  }: Props = $props();

  interface HeaderAction {
    label: string;
    title: string;
    icon: string;
    action: () => void;
    disabled?: () => boolean;
  }

  const historyActions: HeaderAction[] = $derived([
    {
      label: 'Undo',
      title: 'Undo (Cmd+Z)',
      icon: 'corner-up-left',
      action: onUndo,
      disabled: () => !$canUndo,
    },
    {
      label: 'Redo',
      title: 'Redo (Cmd+Shift+Z)',
      icon: 'corner-up-right',
      action: onRedo,
      disabled: () => !$canRedo,
    },
  ]);

  const editActions: HeaderAction[] = $derived([
    {
      label: 'Copy',
      title: 'Copy (Cmd+C)',
      icon: 'copy',
      action: onCopy,
      disabled: () => $selectedElements.length === 0,
    },
    { label: 'Paste', title: 'Paste (Cmd+V)', icon: 'file-text', action: onPaste },
    {
      label: 'Duplicate',
      title: 'Duplicate (Cmd+D)',
      icon: 'copy',
      action: onDuplicate,
      disabled: () => $selectedElements.length === 0,
    },
  ]);

  const alignActions = $derived([
    { label: 'Align Left', alignment: 'left' as const },
    { label: 'Align Center', alignment: 'center' as const },
    { label: 'Align Right', alignment: 'right' as const },
  ]);

  const exportActions = $derived([
    { label: 'Export as PNG', action: onExportPNG },
    { label: 'Export as SVG', action: onExportSVG },
    { label: 'Export as JSON', action: onExportJSON },
  ]);
</script>

<div class="canvas-header">
  <button
    class="canvas-btn canvas-btn--secondary"
    onclick={onBackToLibrary}
    aria-label="Back to library"
  >
    <Icon name="arrow-left" size={16} />
    Back to Library
  </button>

  <h1 class="canvas-title">{title}</h1>

  <div class="canvas-actions">
    {#each historyActions as action (action.label)}
      <button
        class="canvas-btn canvas-btn--icon"
        onclick={action.action}
        disabled={action.disabled?.()}
        title={action.title}
        aria-label={action.label}
      >
        <Icon name={action.icon} size={16} />
      </button>
    {/each}

    <div class="canvas-divider canvas-divider--s"></div>

    {#each editActions as action (action.label)}
      <button
        class="canvas-btn canvas-btn--icon"
        onclick={action.action}
        disabled={action.disabled?.()}
        title={action.title}
        aria-label={action.label}
      >
        <Icon name={action.icon} size={16} />
      </button>
    {/each}

    <div class="canvas-divider canvas-divider--s"></div>

    {#each alignActions as action (action.alignment)}
      <button
        class="canvas-btn canvas-btn--icon"
        onclick={() => onAlign(action.alignment)}
        disabled={$selectedElements.length < 2}
        title={action.label}
        aria-label={action.label.toLowerCase()}
      >
        <Icon name="columns" size={16} />
      </button>
    {/each}

    <div class="canvas-divider canvas-divider--s"></div>

    <button class="canvas-btn canvas-btn--primary" onclick={onSave} aria-label="Save canvas">
      <Icon name="save" size={16} />
      Save
    </button>

    <div class="canvas-dropdown">
      <button
        class="canvas-btn canvas-btn--secondary"
        onclick={onToggleExportMenu}
        aria-label="Export options"
      >
        <Icon name="download" size={16} />
        Export
      </button>
      {#if showExportMenu}
        <div class="canvas-dropdown__menu">
          {#each exportActions as action (action.label)}
            <button onclick={action.action}>{action.label}</button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  @import '$lib/styles/canvas-components.css';

  .canvas-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-m);
    padding: var(--spacing-s) var(--spacing-m);
    background: var(--background-primary);
    border-bottom: 1px solid var(--border-color);
    box-shadow: var(--shadow-s);
  }

  .canvas-title {
    margin: 0;
    font-size: var(--font-ui-large);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
  }

  .canvas-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
  }
</style>
