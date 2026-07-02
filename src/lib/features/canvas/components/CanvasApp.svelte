<script lang="ts">
  import { onMount } from 'svelte';
  import CanvasWorkspaceInteractive from '@/features/canvas/components/workspace/CanvasWorkspaceInteractive.svelte';
  import CanvasLibrary from '@/features/canvas/components/library/CanvasLibrary.svelte';
  import CanvasHeader from '@/features/canvas/components/CanvasHeader.svelte';
  import CanvasSidebar from '@/features/canvas/components/CanvasSidebar.svelte';
  import RoadmapExport from '@/features/canvas/components/roadmap/RoadmapExport.svelte';
  import { RoadmapKanban, syncRoadmapFlowLinks } from '@/features/canvas/components/roadmap';
  import SlidePresentation from '@/features/canvas/components/slides/SlidePresentation.svelte';
  import {
    currentCanvas,
    saveCurrentCanvas,
    copySelectedElements,
    pasteElements,
    duplicateSelectedElements,
    groupSelectedElements,
    ungroupSelectedElements,
    alignSelectedElements,
    activeTool,
    setActiveTool,
    viewMode,
    toggleViewMode,
    setCurrentCanvas,
  } from '@/features/canvas/stores';
  import { undo, redo } from '@/features/canvas/stores';
  import { log } from '@/utils/logger';
  import {
    exportCanvas,
    saveCanvasWithLogging,
    type ExportFormat,
  } from '@/features/canvas/components/workspace/canvasInteractions';
  import { handleCanvasShortcut } from '@/features/canvas/components/workspace/canvasShortcuts';
  import { startPresentation, presentationMode } from '@/features/canvas/stores';

  let view: 'library' | 'canvas' = 'library';
  let showExportMenu = false;
  let showRoadmapExportModal = false;
  let showSlidePresentation = false;
  let showCreateComponentDialog = false;

  $: isRoadmap = $currentCanvas?.documentType === 'roadmap';
  $: isSlides = $currentCanvas?.documentType === 'slides';

  // Sync local flag with store when presentation exits via keyboard
  $: if (!$presentationMode) showSlidePresentation = false;

  function togglePreview() {
    if ($activeTool === 'preview') {
      setActiveTool('select');
    } else {
      setActiveTool('preview');
    }
  }

  function toggleOverview() {
    toggleViewMode();
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
      createComponent: () => {
        showCreateComponentDialog = true;
      },
      togglePreview,
      toggleOverview,
    });
  }

  function handleSave() {
    const doc = $currentCanvas;
    if (doc?.documentType === 'roadmap') {
      const synced = syncRoadmapFlowLinks(doc);
      setCurrentCanvas(synced);
    }
    saveCanvasWithLogging(saveCurrentCanvas);
  }

  async function handleExport(format: ExportFormat) {
    await exportCanvas($currentCanvas, format);
    showExportMenu = false;
  }

  function handleStatusDrop(detail: { id: string; status: string }) {
    const { id, status } = detail;
    currentCanvas.update((doc) => {
      if (!doc) return doc;
      const elements = doc.elements.map((el) => {
        if (el.id !== id || !el.properties.featureCardData) return el;
        return {
          ...el,
          properties: {
            ...el.properties,
            featureCardData: {
              ...el.properties.featureCardData,
              status: status as 'done' | 'idea' | 'planned' | 'in-progress' | 'deferred',
            },
          },
        };
      });
      return { ...doc, elements };
    });
    log.info('CanvasApp: status drop', { id, status });
  }

  function handleExportRoadmap() {
    showRoadmapExportModal = true;
    log.info('CanvasApp: open roadmap export modal');
  }

  function handleStartPresentation() {
    const doc = $currentCanvas;
    if (!doc) return;
    startPresentation(doc);
    showSlidePresentation = true;
    log.interaction('ui', 'slides:presentation:start', { docId: doc.id });
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
        showRoadmapExport={isRoadmap}
        showPresent={isSlides}
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
        onExportRoadmap={handleExportRoadmap}
        onStartPresentation={handleStartPresentation}
      />

      <div class="canvas-body">
        <CanvasWorkspaceInteractive bind:showCreateComponentDialog />
        {#if isRoadmap}
          <RoadmapKanban
            elements={$currentCanvas?.elements ?? []}
            onStatusDrop={handleStatusDrop}
          />
        {/if}
        <CanvasSidebar />
      </div>
    </div>

    {#if showRoadmapExportModal && isRoadmap}
      <div
        class="roadmap-modal-overlay"
        role="dialog"
        aria-label="Export Roadmap"
        aria-modal="true"
      >
        <div class="roadmap-modal">
          <div class="roadmap-modal-header">
            <h2 class="roadmap-modal-title">Export Roadmap</h2>
            <button
              class="roadmap-modal-close"
              on:click={() => (showRoadmapExportModal = false)}
              aria-label="Close export modal"
            >
              x
            </button>
          </div>
          <RoadmapExport elements={$currentCanvas?.elements ?? []} />
        </div>
      </div>
    {/if}

    <SlidePresentation bind:show={showSlidePresentation} />
  {/if}
</div>

<style>
  .canvas-app {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--background-primary-alt);
    position: relative;
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

  .roadmap-modal-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .roadmap-modal {
    background: var(--background-primary);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-l, 0 8px 32px rgba(0, 0, 0, 0.2));
    overflow: hidden;
    max-width: 600px;
    width: 100%;
  }

  .roadmap-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
  }

  .roadmap-modal-title {
    margin: 0;
    font-size: var(--font-ui-medium);
    font-weight: 600;
  }

  .roadmap-modal-close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    font-size: 16px;
    line-height: 1;
    padding: 4px;
    border-radius: var(--radius-s);
  }

  .roadmap-modal-close:hover {
    background: var(--background-secondary);
  }
</style>
