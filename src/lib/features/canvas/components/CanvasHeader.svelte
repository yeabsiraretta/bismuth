<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { selectedElements } from '@/features/canvas/stores';
  import { canUndo, canRedo } from '@/features/canvas/stores';
  import { showToast } from '@/stores/toast/toast';

  let hoverTimer: ReturnType<typeof setTimeout> | null = null;
  function handleHover(label: string) {
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => showToast(label, 'info', 1500), 400);
  }
  function cancelHover() {
    if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
  }

  interface Props {
    title?: string;
    showExportMenu?: boolean;
    showRoadmapExport?: boolean;
    showPresent?: boolean;
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
    onExportRoadmap?: () => void;
    onStartPresentation?: () => void;
  }

  let {
    title = 'Untitled',
    showExportMenu = false,
    showRoadmapExport = false,
    showPresent = false,
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
    onExportRoadmap,
    onStartPresentation,
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
        onmouseenter={() => handleHover(action.title)}
        onmouseleave={cancelHover}
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
        onmouseenter={() => handleHover(action.title)}
        onmouseleave={cancelHover}
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
        onmouseenter={() => handleHover(action.label)}
        onmouseleave={cancelHover}
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

    {#if showRoadmapExport && onExportRoadmap}
      <button
        class="canvas-btn canvas-btn--secondary"
        onclick={onExportRoadmap}
        aria-label="Export roadmap"
      >
        <Icon name="table" size={16} />
        Export Roadmap
      </button>
    {/if}

    {#if showPresent && onStartPresentation}
      <button
        class="canvas-btn canvas-btn--secondary canvas-btn--present"
        onclick={onStartPresentation}
        aria-label="Start slide presentation"
        title="Present (slides mode)"
      >
        <Icon name="play" size={16} />
        Present
      </button>
    {/if}

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

  .canvas-btn--present {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }

  .canvas-btn--present:hover {
    opacity: 0.9;
  }
</style>
