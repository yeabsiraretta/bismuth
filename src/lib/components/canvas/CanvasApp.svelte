<script lang="ts">
  import { onMount } from 'svelte';
  import CanvasWorkspaceInteractive from './CanvasWorkspaceInteractive.svelte';
  import CanvasLibrary from './CanvasLibrary.svelte';
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
        <button class="btn-back" on:click={() => (view = 'library')}> ← Back to Library </button>

        <h1 class="canvas-title">{$currentCanvas?.name || 'Untitled'}</h1>

        <div class="canvas-actions">
          <button class="btn-icon" on:click={undo} disabled={!$canUndo} title="Undo (Cmd+Z)">
            ↶
          </button>
          <button class="btn-icon" on:click={redo} disabled={!$canRedo} title="Redo (Cmd+Shift+Z)">
            ↷
          </button>

          <div class="divider"></div>

          <button
            class="btn-icon"
            on:click={copySelectedElements}
            disabled={$selectedElements.length === 0}
            title="Copy (Cmd+C)"
          >
            📋
          </button>
          <button class="btn-icon" on:click={pasteElements} title="Paste (Cmd+V)"> 📄 </button>
          <button
            class="btn-icon"
            on:click={duplicateSelectedElements}
            disabled={$selectedElements.length === 0}
            title="Duplicate (Cmd+D)"
          >
            ⎘
          </button>

          <div class="divider"></div>

          <button
            class="btn-icon"
            on:click={() => alignSelectedElements('left')}
            disabled={$selectedElements.length < 2}
            title="Align Left"
          >
            ⫷
          </button>
          <button
            class="btn-icon"
            on:click={() => alignSelectedElements('center')}
            disabled={$selectedElements.length < 2}
            title="Align Center"
          >
            ⫸
          </button>
          <button
            class="btn-icon"
            on:click={() => alignSelectedElements('right')}
            disabled={$selectedElements.length < 2}
            title="Align Right"
          >
            ⫹
          </button>

          <div class="divider"></div>

          <button class="btn-primary" on:click={handleSave}> 💾 Save </button>

          <div class="export-dropdown">
            <button class="btn-secondary" on:click={() => (showExportMenu = !showExportMenu)}>
              Export ▼
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

      <CanvasWorkspaceInteractive />
    </div>
  {/if}
</div>

<style>
  .canvas-app {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f9fafb;
  }

  .canvas-view {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .canvas-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .btn-back {
    padding: 0.5rem 1rem;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-back:hover {
    background: #f3f4f6;
  }

  .canvas-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
  }

  .canvas-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .divider {
    width: 1px;
    height: 1.5rem;
    background: #e5e7eb;
  }

  .btn-icon {
    padding: 0.5rem 0.75rem;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-icon:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  .btn-icon:disabled {
    opacity: 0.4;
    cursor: not-allowed;
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

  .export-dropdown {
    position: relative;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.25rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10;
    min-width: 150px;
  }

  .dropdown-menu button {
    display: block;
    width: 100%;
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    text-align: left;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.15s;
  }

  .dropdown-menu button:hover {
    background: #f3f4f6;
  }

  .dropdown-menu button:first-child {
    border-radius: 0.375rem 0.375rem 0 0;
  }

  .dropdown-menu button:last-child {
    border-radius: 0 0 0.375rem 0.375rem;
  }
</style>
