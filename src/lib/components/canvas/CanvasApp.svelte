<script lang="ts">
  import { onMount } from 'svelte';
  import CanvasWorkspaceInteractive from './CanvasWorkspaceInteractive.svelte';
  import CanvasLibrary from './CanvasLibrary.svelte';
  import PropertyPanel from './PropertyPanel.svelte';
  import LayerPanel from './LayerPanel.svelte';
  import PagesPanel from './PagesPanel.svelte';
  import ComponentsPanel from './ComponentsPanel.svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import {
    currentCanvas,
    saveCurrentCanvas,
    copySelectedElements,
    pasteElements,
    duplicateSelectedElements,
    groupSelectedElements,
    ungroupSelectedElements,
    alignSelectedElements,
    selectedElements,
    createComponentFromSelection,
  } from '@/stores/canvas/canvasStore';
  import { undo, redo, canUndo, canRedo } from '@/stores/canvas/historyStore';
  import {
    exportToPNG,
    exportToSVG,
    downloadFile,
    downloadSVG,
    exportToJSON,
  } from '@/utils/canvasExport';
  import { log } from '@/utils/logger';

  let view: 'library' | 'canvas' = 'library';
  let showExportMenu = false;

  onMount(() => {
    log.info('CanvasApp mounted');

    // Set up keyboard shortcuts
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  function handleKeyDown(e: KeyboardEvent) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    if (!cmdOrCtrl) return;

    switch (e.key.toLowerCase()) {
      case 'z':
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        break;
      case 'c':
        e.preventDefault();
        copySelectedElements();
        break;
      case 'v':
        e.preventDefault();
        pasteElements();
        break;
      case 'd':
        e.preventDefault();
        duplicateSelectedElements();
        break;
      case 'g':
        e.preventDefault();
        if (e.shiftKey) {
          ungroupSelectedElements();
        } else {
          groupSelectedElements();
        }
        break;
      case 's':
        e.preventDefault();
        handleSave();
        break;
      case 'k':
        if (e.shiftKey) {
          e.preventDefault();
          createComponentFromSelection();
        }
        break;
    }
  }

  async function handleSave() {
    try {
      await saveCurrentCanvas();
      log.info('Canvas saved via keyboard shortcut');
    } catch (error) {
      log.error('Failed to save canvas', error as Error);
    }
  }

  async function handleExportPNG() {
    if (!$currentCanvas) return;

    try {
      const blob = await exportToPNG($currentCanvas);
      downloadFile(blob, `${$currentCanvas.name}.png`);
      showExportMenu = false;
    } catch (error) {
      log.error('Failed to export PNG', error as Error);
    }
  }

  async function handleExportSVG() {
    if (!$currentCanvas) return;

    try {
      const svg = exportToSVG($currentCanvas);
      downloadSVG(svg, `${$currentCanvas.name}.svg`);
      showExportMenu = false;
    } catch (error) {
      log.error('Failed to export SVG', error as Error);
    }
  }

  async function handleExportJSON() {
    if (!$currentCanvas) return;

    try {
      const json = exportToJSON($currentCanvas);
      const blob = new Blob([json], { type: 'application/json' });
      downloadFile(blob, `${$currentCanvas.name}.json`);
      showExportMenu = false;
    } catch (error) {
      log.error('Failed to export JSON', error as Error);
    }
  }

  $: if ($currentCanvas) {
    view = 'canvas';
  }
</script>

<div class="canvas-app">
  {#if view === 'library'}
    <CanvasLibrary />
  {:else if view === 'canvas'}
    <div class="canvas-view">
      <div class="canvas-header">
        <button class="btn-back" on:click={() => (view = 'library')} aria-label="Back to library">
          <Icon name="arrow-left" size={16} />
          Back to Library
        </button>

        <h1 class="canvas-title">{$currentCanvas?.name || 'Untitled'}</h1>

        <div class="canvas-actions">
          <button
            class="btn-icon"
            on:click={undo}
            disabled={!$canUndo}
            title="Undo (Cmd+Z)"
            aria-label="Undo"
          >
            <Icon name="corner-up-left" size={16} />
          </button>
          <button
            class="btn-icon"
            on:click={redo}
            disabled={!$canRedo}
            title="Redo (Cmd+Shift+Z)"
            aria-label="Redo"
          >
            <Icon name="corner-up-right" size={16} />
          </button>

          <div class="divider"></div>

          <button
            class="btn-icon"
            on:click={copySelectedElements}
            disabled={$selectedElements.length === 0}
            title="Copy (Cmd+C)"
            aria-label="Copy"
          >
            <Icon name="copy" size={16} />
          </button>
          <button
            class="btn-icon"
            on:click={pasteElements}
            title="Paste (Cmd+V)"
            aria-label="Paste"
          >
            <Icon name="file-text" size={16} />
          </button>
          <button
            class="btn-icon"
            on:click={duplicateSelectedElements}
            disabled={$selectedElements.length === 0}
            title="Duplicate (Cmd+D)"
            aria-label="Duplicate"
          >
            <Icon name="copy" size={16} />
          </button>

          <div class="divider"></div>

          <button
            class="btn-icon"
            on:click={() => alignSelectedElements('left')}
            disabled={$selectedElements.length < 2}
            title="Align Left"
            aria-label="Align left"
          >
            <Icon name="columns" size={16} />
          </button>
          <button
            class="btn-icon"
            on:click={() => alignSelectedElements('center')}
            disabled={$selectedElements.length < 2}
            title="Align Center"
            aria-label="Align center"
          >
            <Icon name="columns" size={16} />
          </button>
          <button
            class="btn-icon"
            on:click={() => alignSelectedElements('right')}
            disabled={$selectedElements.length < 2}
            title="Align Right"
            aria-label="Align right"
          >
            <Icon name="columns" size={16} />
          </button>

          <div class="divider"></div>

          <button class="btn-primary" on:click={handleSave} aria-label="Save canvas">
            <Icon name="save" size={16} />
            Save
          </button>

          <div class="export-dropdown">
            <button
              class="btn-secondary"
              on:click={() => (showExportMenu = !showExportMenu)}
              aria-label="Export options"
            >
              <Icon name="download" size={16} />
              Export
            </button>
            {#if showExportMenu}
              <div class="dropdown-menu">
                <button on:click={handleExportPNG}>Export as PNG</button>
                <button on:click={handleExportSVG}>Export as SVG</button>
                <button on:click={handleExportJSON}>Export as JSON</button>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <div class="canvas-body">
        <CanvasWorkspaceInteractive />
        <div class="canvas-sidebar">
          <PagesPanel />
          <ComponentsPanel />
          <PropertyPanel />
          <LayerPanel />
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .canvas-app {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--background-primary-alt);
  }

  .canvas-view {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .canvas-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .canvas-sidebar {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .canvas-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-m);
    padding: var(--spacing-s) var(--spacing-m);
    background: var(--background-primary);
    border-bottom: 1px solid var(--border-color);
    box-shadow: var(--shadow-s);
  }

  .btn-back {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-s) var(--spacing-m);
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: var(--font-smaller);
    color: var(--text-normal);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-back:hover {
    background: var(--background-modifier-hover);
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

  .divider {
    width: 1px;
    height: 1.5rem;
    background: var(--border-color);
  }

  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-s);
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-icon:hover:not(:disabled) {
    background: var(--background-modifier-hover);
    border-color: var(--border-hover);
  }

  .btn-icon:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-primary {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
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
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
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

  .export-dropdown {
    position: relative;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: var(--spacing-xs);
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-m);
    z-index: var(--layer-menu);
    min-width: 150px;
  }

  .dropdown-menu button {
    display: block;
    width: 100%;
    padding: var(--spacing-s) var(--spacing-m);
    background: none;
    border: none;
    text-align: left;
    font-size: var(--font-smaller);
    color: var(--text-normal);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .dropdown-menu button:hover {
    background: var(--background-modifier-hover);
  }

  .dropdown-menu button:first-child {
    border-radius: var(--radius-m) var(--radius-m) 0 0;
  }

  .dropdown-menu button:last-child {
    border-radius: 0 0 var(--radius-m) var(--radius-m);
  }
</style>
