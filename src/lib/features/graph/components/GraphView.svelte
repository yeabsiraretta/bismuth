<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { GraphNode, GraphSettings } from '../types';
  import Icon from '@/components/icons/Icon.svelte';
  import GraphSettingsPanel from './controls/GraphSettings.svelte';
  import GraphFilter from './controls/GraphFilter.svelte';
  import GraphContextMenu from './GraphContextMenu.svelte';
  import GraphHeader from './GraphHeader.svelte';
  import GraphLocalInfo from './GraphLocalInfo.svelte';
  import { GraphLayoutWorker } from '../workers/layoutWorkerManager';
  import { hiddenTags } from '@/features/tag';
  import { openNote as navOpenNote } from '@/appNavigation';
  import { loadGraphSession, saveGraphSession } from '../stores/graphSession';
  import {
    createController, render as ctrlRender, loadGraphData as ctrlLoad,
    initializeSimulation as ctrlInitSim, startWarmup,
    handleClick as ctrlClick, handleContextMenu as ctrlCtxMenu, handleContextAction,
    applyFilterUpdate, fitToView as ctrlFitToView, resetView as ctrlResetView,
    handleGraphMouseDown, handleGraphMouseMove, handleGraphMouseUp,
    handleGraphWheel, handleGraphKeyDown, type GraphViewController,
  } from './view/graphViewController';

  // Restore session on mount
  const session = loadGraphSession();

  export let isLocal = session.isLocal;
  export let centerNode: string | null = session.centerNode;
  export let depth = session.depth;

  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  let width = 800;
  let height = 600;
  let searchQuery = session.searchQuery;
  let settingsOpen = false;
  let filterOpen = false;
  let filterTags: string[] = session.filterTags;
  let filterTypes: string[] = session.filterTypes;
  let filterFolder = session.filterFolder;
  let filterDepth = session.filterDepth;
  let contextMenuVisible = false;
  let contextMenuNode: GraphNode | null = null;
  let contextMenuX = 0;
  let contextMenuY = 0;

  let settings: GraphSettings = { ...session.settings };
  let colorGroups: Array<{ query: string; color: string }> = [...session.colorGroups];
  let ctrl: GraphViewController = createController();

  // Restore camera state after first render
  let sessionRestored = false;

  function toggleFilter() { filterOpen = !filterOpen; if (filterOpen) settingsOpen = false; }
  function toggleSettings() { settingsOpen = !settingsOpen; if (settingsOpen) filterOpen = false; }
  function fp() { return { searchQuery, showOrphans: settings.showOrphans, isLocal, centerNode, depth, tags: filterTags, types: filterTypes, folder: filterFolder, hiddenTags: $hiddenTags, width, height }; }
  function doRender() { ctrl = ctrlRender(ctx, canvasEl, ctrl, settings, colorGroups, width, height); }
  function syncCtrl(c: GraphViewController) { ctrl = c; }

  async function loadData() {
    ctrl = await ctrlLoad(ctx, canvasEl, ctrl, settings, colorGroups, fp(), syncCtrl);
    if (!sessionRestored && (session.offsetX !== 0 || session.offsetY !== 0 || session.scale !== 1)) {
      ctrl = { ...ctrl, rState: { ...ctrl.rState, offsetX: session.offsetX, offsetY: session.offsetY, scale: session.scale, selectedNode: session.selectedNode } };
      doRender();
    }
    sessionRestored = true;
  }
  async function initSim() { ctrl = await ctrlInitSim(ctx, canvasEl, ctrl, settings, colorGroups, fp(), syncCtrl); }

  $: if (ctrl.graphData.nodes.length > 0 && !ctrl.initializing) { ctrl = applyFilterUpdate(ctrl, fp()); doRender(); }

  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  function persistSession() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveGraphSession({
        offsetX: ctrl.rState.offsetX, offsetY: ctrl.rState.offsetY, scale: ctrl.rState.scale,
        selectedNode: ctrl.rState.selectedNode, isLocal, centerNode, depth, searchQuery,
        filterTags, filterTypes, filterFolder, filterDepth, settings, colorGroups,
      });
    }, 500);
  }

  function handleFilter(d: { tags: string[]; types: string[]; folder: string; depth: number }) { filterTags = d.tags; filterTypes = d.types; filterFolder = d.folder; filterDepth = d.depth; persistSession(); }
  function onMouseDown(e: MouseEvent) { ctrl = { ...ctrl, rState: handleGraphMouseDown(e, canvasEl, ctrl.nodes, ctrl.rState) }; doRender(); }
  function onMouseMove(e: MouseEvent) { ctrl = { ...ctrl, rState: handleGraphMouseMove(e, canvasEl, ctrl.nodes, ctrl.rState) }; doRender(); }
  function onMouseUp() { ctrl = { ...ctrl, rState: handleGraphMouseUp(ctrl.rState) }; persistSession(); }
  function onWheel(e: WheelEvent) { ctrl = { ...ctrl, rState: handleGraphWheel(e, ctrl.rState) }; doRender(); persistSession(); }
  function onKeyDown(e: KeyboardEvent) { ctrl = { ...ctrl, rState: handleGraphKeyDown(e, ctrl.rState) }; doRender(); }
  function onClick(e: MouseEvent) { ctrl = ctrlClick(e, canvasEl, ctrl, navOpenNote); persistSession(); }
  function onContextMenu(e: MouseEvent) { const r = ctrlCtxMenu(e, canvasEl, ctrl); ctrl = r.ctrl; contextMenuNode = r.node; contextMenuX = r.x; contextMenuY = r.y; contextMenuVisible = r.visible; }
  function onCtxAction(d: { action: string; node: GraphNode | null }) { handleContextAction(d.action, d.node, navOpenNote, (nid) => { isLocal = true; centerNode = nid; initSim(); }); }
  function onFitToView() { ctrl = ctrlFitToView(ctx, canvasEl, ctrl, settings, colorGroups, width, height); persistSession(); }
  function onResetView() { ctrl = ctrlResetView(ctx, canvasEl, ctrl, settings, colorGroups, width, height); persistSession(); }
  function handleResize() { if (canvasEl) { width = canvasEl.parentElement?.clientWidth || 800; height = canvasEl.parentElement?.clientHeight || 600; canvasEl.width = width; canvasEl.height = height; doRender(); } }
  function handleSettingsEvent(e: Event) { const detail = (e as CustomEvent<GraphSettings>).detail; if (detail) { settings = { ...settings, ...detail }; doRender(); persistSession(); } }

  onMount(() => { ctx = canvasEl.getContext('2d'); handleResize(); ctrl = { ...ctrl, layoutWorker: new GraphLayoutWorker() }; loadData(); window.addEventListener('resize', handleResize); window.addEventListener('keydown', onKeyDown); window.addEventListener('graph-settings-change', handleSettingsEvent); });
  onDestroy(() => { if (saveTimer) clearTimeout(saveTimer); persistSession(); if (ctrl.animationFrame) cancelAnimationFrame(ctrl.animationFrame); ctrl.layoutWorker?.terminate(); window.removeEventListener('resize', handleResize); window.removeEventListener('keydown', onKeyDown); window.removeEventListener('graph-settings-change', handleSettingsEvent); });
</script>

<div class="graph-view">
  <GraphHeader onRefresh={loadData} />

  <div class="graph-canvas-container">
    <canvas
      bind:this={canvasEl}
      on:mousedown={onMouseDown}
      on:mousemove={onMouseMove}
      on:mouseup={onMouseUp}
      on:wheel={onWheel}
      on:click={onClick}
      on:contextmenu={onContextMenu}
      {width}
      {height}
    ></canvas>

    <div class="graph-search-bar">
      <Icon name="search" size={14} />
      <input type="text" placeholder="Filter nodes..." bind:value={searchQuery} class="search-input" />
    </div>

    <div class="graph-toolbar">
      <button class="toolbar-btn" on:click={toggleFilter} title="Filters" class:active={filterOpen}>
        <Icon name="filter" size={14} />
        <span class="toolbar-label">Filters</span>
      </button>
      <button class="toolbar-btn" on:click={toggleSettings} title="Settings" class:active={settingsOpen}>
        <Icon name="settings" size={14} />
        <span class="toolbar-label">Settings</span>
      </button>
      <button
        class="toolbar-btn"
        on:click={() => { settings.animate = !settings.animate; if (settings.animate) { ctrl = startWarmup(ctx, canvasEl, ctrl, settings, colorGroups, width, height, syncCtrl); } persistSession(); }}
        title={settings.animate ? 'Pause simulation' : 'Start simulation'}
        class:active={settings.animate}
      >
        <Icon name="zap" size={14} />
        <span class="toolbar-label">{settings.animate ? 'Pause' : 'Animate'}</span>
      </button>
      <button class="toolbar-btn" on:click={onFitToView} title="Fit all nodes in view">
        <Icon name="maximize-2" size={14} />
      </button>
      <button class="toolbar-btn" on:click={onResetView} title="Reset zoom to 1×">
        <Icon name="minimize-2" size={14} />
      </button>
    </div>

    {#if settingsOpen}
      <div class="graph-panel-overlay graph-panel-right">
        <div class="panel-overlay-header">
          <span>Settings</span>
          <button class="panel-close-btn" on:click={() => (settingsOpen = false)} title="Close">
            <Icon name="x" size={14} />
          </button>
        </div>
        <GraphSettingsPanel bind:settings />
      </div>
    {/if}

    {#if filterOpen}
      <div class="graph-panel-overlay graph-panel-left">
        <div class="panel-overlay-header">
          <span>Filters</span>
          <button class="panel-close-btn" on:click={() => (filterOpen = false)} title="Close">
            <Icon name="x" size={14} />
          </button>
        </div>
        <GraphFilter
          availableTags={ctrl.availableTags} availableTypes={ctrl.availableTypes}
          selectedTags={filterTags} selectedTypes={filterTypes}
          folderFilter={filterFolder} linkDepth={filterDepth}
          onFilter={handleFilter}
        />
      </div>
    {/if}

    {#if isLocal && centerNode}
      <GraphLocalInfo
        {centerNode} {depth}
        onDepthChange={(d) => { depth = d; }}
        onShowGlobal={() => { isLocal = false; centerNode = null; initSim(); }}
      />
    {/if}
  </div>
</div>

<GraphContextMenu
  bind:visible={contextMenuVisible}
  bind:node={contextMenuNode}
  bind:x={contextMenuX}
  bind:y={contextMenuY}
  onAction={onCtxAction}
/>

<style>
  .graph-view {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--graph-bg);
    position: relative;
  }

  .graph-canvas-container {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  canvas { display: block; cursor: grab; }
  canvas:active { cursor: grabbing; }

  /* ─── Search bar (top-left, always visible) ─── */
  .graph-search-bar {
    position: absolute;
    top: 12px;
    left: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: var(--graph-surface);
    border: 1px solid var(--graph-border);
    border-radius: var(--radius-m);
    backdrop-filter: blur(8px);
    color: var(--graph-text);
  }

  .search-input {
    width: 160px;
    padding: 2px 0;
    background: transparent;
    border: none;
    font-size: var(--font-ui-smaller, 0.75rem);
    color: var(--graph-text-active);
    outline: none;
  }

  .search-input::placeholder {
    color: var(--graph-text);
  }

  /* ─── Toolbar (bottom-right, labeled buttons) ─── */
  .graph-toolbar {
    position: absolute;
    bottom: 12px;
    right: 12px;
    display: flex;
    gap: 6px;
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    height: 30px;
    padding: 0 10px;
    background: var(--graph-surface);
    border: 1px solid var(--graph-border);
    border-radius: var(--radius-m);
    color: var(--graph-text);
    cursor: pointer;
    font-size: var(--font-ui-smaller, 0.75rem);
    transition: all 0.15s ease;
    backdrop-filter: blur(8px);
    white-space: nowrap;
  }

  .toolbar-btn:hover {
    background: var(--graph-surface-hover);
    color: var(--graph-text-active);
    border-color: var(--graph-border-hover);
  }

  .toolbar-btn.active {
    background: color-mix(in srgb, var(--graph-accent) 20%, transparent);
    border-color: color-mix(in srgb, var(--graph-accent) 40%, transparent);
    color: var(--graph-accent);
  }

  .toolbar-label {
    pointer-events: none;
  }

  /* ─── Panel overlays (filter / settings) ─── */
  .graph-panel-overlay {
    position: absolute;
    top: 52px;
    bottom: 52px;
    width: 280px;
    background: var(--graph-surface);
    border: 1px solid var(--graph-border);
    border-radius: var(--radius-m);
    backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 10;
  }

  .graph-panel-overlay > :global(:last-child) {
    flex: 1;
    overflow-y: auto;
  }

  .graph-panel-left {
    left: 12px;
  }

  .graph-panel-right {
    right: 12px;
  }

  .panel-overlay-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--graph-border);
    font-size: var(--font-ui-small, 0.8125rem);
    font-weight: 600;
    color: var(--graph-text-active);
    flex-shrink: 0;
  }

  .panel-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--graph-text);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .panel-close-btn:hover {
    background: var(--graph-surface-hover);
    color: var(--graph-text-active);
  }
</style>
