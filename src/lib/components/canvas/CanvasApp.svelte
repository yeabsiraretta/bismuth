<script lang="ts">
  import { onMount } from 'svelte';
  import CanvasWorkspaceInteractive from './CanvasWorkspaceInteractive.svelte';
  import CanvasLibrary from './CanvasLibrary.svelte';
  import CanvasHeader from './CanvasHeader.svelte';
  import CanvasSidebar from './CanvasSidebar.svelte';
  import {
    currentCanvas,
    saveCurrentCanvas,
    copySelectedElements,
    pasteElements,
    duplicateSelectedElements,
    groupSelectedElements,
    ungroupSelectedElements,
    alignSelectedElements,
    createComponentFromSelection,
    activeTool,
    setActiveTool,
    viewMode,
  } from '@/stores/canvas/canvasStore';
  import { undo, redo } from '@/stores/canvas/historyStore';
  import { log } from '@/utils/logger';
  import { exportCanvas, saveCanvasWithLogging, type ExportFormat } from './canvasActions';
  import { handleCanvasShortcut } from './canvasShortcuts';

  let view: 'library' | 'canvas' = 'library';
  let showExportMenu = false;

  function togglePreview() {
    if ($activeTool === 'preview') {
      setActiveTool('select');
    } else {
      setActiveTool('preview');
    }
  }

  function toggleOverview() {
    viewMode.update((m) => (m === 'overview' ? 'detail' : 'overview'));
  }

  onMount(() => {
    log.info('CanvasApp mounted');
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  function handleKeyDown(e: KeyboardEvent) {
    handleCanvasShortcut(e, {
      undo,
      redo,
      copy: copySelectedElements,
      paste: pasteElements,
      duplicate: duplicateSelectedElements,
      group: groupSelectedElements,
      ungroup: ungroupSelectedElements,
      save: handleSave,
      createComponent: createComponentFromSelection,
      togglePreview,
      toggleOverview,
    });
  }

  function handleSave() {
    saveCanvasWithLogging(saveCurrentCanvas);
  }

  async function handleExport(format: ExportFormat) {
    await exportCanvas($currentCanvas, format);
    showExportMenu = false;
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
      <CanvasHeader
        title={$currentCanvas?.name || 'Untitled'}
        {showExportMenu}
        onBackToLibrary={() => (view = 'library')}
        onUndo={undo}
        onRedo={redo}
        onCopy={copySelectedElements}
        onPaste={pasteElements}
        onDuplicate={duplicateSelectedElements}
        onAlign={alignSelectedElements}
        onSave={handleSave}
        onToggleExportMenu={() => (showExportMenu = !showExportMenu)}
        onExportPNG={() => handleExport('PNG')}
        onExportSVG={() => handleExport('SVG')}
        onExportJSON={() => handleExport('JSON')}
      />

      <div class="canvas-body">
        <CanvasWorkspaceInteractive />
        <CanvasSidebar />
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
</style>
