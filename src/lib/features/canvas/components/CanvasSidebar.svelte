<script lang="ts">
  import { get } from 'svelte/store';
  import PropertyPanel from '@/features/canvas/components/panels/property/PropertyPanel.svelte';
  import LayerPanel from '@/features/canvas/components/panels/layout/LayerPanel.svelte';
  import LayerTreePanel from '@/features/canvas/components/panels/layout/LayerTreePanel.svelte';
  import PagesPanel from '@/features/canvas/components/panels/PagesPanel.svelte';
  import ComponentsPanel from '@/features/canvas/components/panels/ComponentsPanel.svelte';
  import AutoLayoutPanel from '@/features/canvas/components/panels/layout/AutoLayoutPanel.svelte';
  import InspectPanel from '@/features/canvas/components/panels/InspectPanel.svelte';
  import ComponentBrowser from '@/features/canvas/components/components/ComponentBrowser.svelte';
  import AssetsPanel from '@/features/canvas/components/panels/AssetsPanel.svelte';
  import DesignDocPanel from '@/features/canvas/components/design/DesignDocPanel.svelte';
  import DocumentSyncButton from '@/features/canvas/components/design/DocumentSyncButton.svelte';
  import { currentCanvas, addElement } from '@/features/canvas/stores';
  import { generateDocuments } from '@/features/canvas/services/documentGenerator';
  import { writeDocument, reflectAll, injectToCanvas } from '@/services/design-docs';
  import type { CanvasElementBlueprint } from '@/services/design-docs';
  import type { ElementProperties } from '@/features/canvas/types/elements';
  import { readFileText } from '@/services/vault/vault';
  import { generateId } from '@/utils/id';
  import { log } from '@/utils/logger';

  type SidebarTab = 'design' | 'inspect' | 'components' | 'assets' | 'docs';
  let activeTab: SidebarTab = 'design';
  let syncing = false;

  async function readFileViaBackend(path: string): Promise<string> {
    return readFileText(path);
  }

  /** Convert a blueprint into a fully-realized CanvasElement and add it to the store. */
  function addBlueprintToCanvas(blueprint: CanvasElementBlueprint, layerId: string) {
    addElement({
      id: generateId(),
      element_type: blueprint.element_type,
      x: blueprint.x,
      y: blueprint.y,
      width: blueprint.width,
      height: blueprint.height,
      rotation: 0,
      properties: blueprint.properties as ElementProperties,
      layer_id: layerId,
      z_index: 0,
      locked: false,
      visible: true,
      name: blueprint.name,
    });
  }

  async function handleSync(detail: { direction: 'canvas_to_code' | 'code_to_canvas' }) {
    const { direction } = detail;
    syncing = true;
    try {
      if (direction === 'canvas_to_code') {
        const canvas = get(currentCanvas);
        if (!canvas) return;
        const docs = generateDocuments(canvas);
        await Promise.all(docs.map((d) => writeDocument(d)));
        log.info('Sync canvas→code complete', { count: docs.length });
      } else {
        const canvas = get(currentCanvas);
        if (!canvas) return;
        const defaultLayerId = canvas.layers?.[0]?.id || 'layer_default';
        const docs = await reflectAll(readFileViaBackend);
        let totalElements = 0;
        for (const doc of docs) {
          const result = injectToCanvas(doc);
          for (const blueprint of result.elements) {
            addBlueprintToCanvas(blueprint, defaultLayerId);
            totalElements++;
          }
        }
        log.info('Sync code→canvas complete', { count: docs.length, elements: totalElements });
      }
    } catch (error) {
      log.error('Sync failed', error as Error);
    } finally {
      syncing = false;
    }
  }
</script>

<div class="canvas-sidebar">
  <div class="sidebar-tabs">
    <button
      class="sidebar-tab"
      class:active={activeTab === 'design'}
      on:click={() => (activeTab = 'design')}
    >
      Design
    </button>
    <button
      class="sidebar-tab"
      class:active={activeTab === 'inspect'}
      on:click={() => (activeTab = 'inspect')}
    >
      Inspect
    </button>
    <button
      class="sidebar-tab"
      class:active={activeTab === 'components'}
      on:click={() => (activeTab = 'components')}
    >
      Components
    </button>
    <button
      class="sidebar-tab"
      class:active={activeTab === 'assets'}
      on:click={() => (activeTab = 'assets')}
    >
      Assets
    </button>
    <button
      class="sidebar-tab"
      class:active={activeTab === 'docs'}
      on:click={() => (activeTab = 'docs')}
    >
      Docs
    </button>
  </div>

  <div class="sidebar-content">
    {#if activeTab === 'design'}
      <PagesPanel />
      <PropertyPanel />
      <AutoLayoutPanel />
      <LayerTreePanel />
      <LayerPanel />
      <ComponentsPanel />
    {:else if activeTab === 'inspect'}
      <InspectPanel />
    {:else if activeTab === 'components'}
      <ComponentBrowser />
    {:else if activeTab === 'assets'}
      <AssetsPanel />
    {:else if activeTab === 'docs'}
      <div class="docs-tab">
        <div class="sync-actions">
          <DocumentSyncButton direction="canvas_to_code" {syncing} onSync={handleSync} />
          <DocumentSyncButton direction="code_to_canvas" {syncing} onSync={handleSync} />
        </div>
        <DesignDocPanel />
      </div>
    {/if}
  </div>
</div>

<style>
  .canvas-sidebar {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    width: 280px;
    height: 100%;
    border-left: 1px solid var(--border-color);
    background: var(--background-primary);
    overflow: hidden;
  }

  .sidebar-tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    background: var(--background-secondary);
    flex-shrink: 0;
  }

  .sidebar-tab {
    flex: 1;
    padding: var(--spacing-s) var(--spacing-m);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-size: var(--font-smaller);
    font-weight: var(--font-medium);
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .sidebar-tab:hover {
    color: var(--text-normal);
  }

  .sidebar-tab.active {
    color: var(--interactive-accent);
    border-bottom-color: var(--interactive-accent);
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
  }

  .docs-tab {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .sync-actions {
    display: flex;
    gap: var(--spacing-xs);
    padding: var(--spacing-s);
    border-bottom: 1px solid var(--border-color);
  }
</style>
