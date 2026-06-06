<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getGraphData } from '@/services/graph/graph';
  import type { GraphData, GraphNode, GraphEdge, GraphSettings } from '@/types/graph';
  import Icon from '@/components/icons/Icon.svelte';
  import GraphSettingsPanel from '@/components/graph/GraphSettings.svelte';
  import GraphFilter from '@/components/graph/GraphFilter.svelte';
  import GraphContextMenu from '@/components/graph/GraphContextMenu.svelte';
  import GraphHeader from '@/components/graph/GraphHeader.svelte';
  import GraphLocalInfo from '@/components/graph/GraphLocalInfo.svelte';
  import { type SimNode, filterGraphData, initNodes, tickForces, hitTestNode } from '@/utils/graph/simulation';
  import { hiddenTags } from '@/stores/tag/tag';
  import {
    createRenderState,
    renderGraph,
    screenToGraph,
    handleGraphMouseDown,
    handleGraphMouseMove,
    handleGraphMouseUp,
    handleGraphWheel,
    handleGraphKeyDown,
  } from './graphViewRendering';

  export let isLocal = false;
  export let centerNode: string | null = null;
  export let depth = 2;

  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  let graphData: GraphData = { nodes: [], edges: [] };
  let width = 800;
  let height = 600;
  let searchQuery = '';
  let settingsOpen = false;
  let filterOpen = false;

  let filterTags: string[] = [];
  let filterTypes: string[] = [];
  let filterFolder = '';
  let filterDepth = 3;
  let availableTags: string[] = [];
  let availableTypes: string[] = [];

  let contextMenuVisible = false;
  let contextMenuNode: GraphNode | null = null;
  let contextMenuX = 0;
  let contextMenuY = 0;

  let settings: GraphSettings = {
    showTags: true, showAttachments: true, showOrphans: true, showArrows: false,
    showLabels: true, textFadeThreshold: 0.3, nodeSize: 1.0, linkThickness: 0.5,
    centerForce: 0.3, repelForce: 100, linkForce: 0.5, linkDistance: 100, animate: false,
  };

  let colorGroups: Array<{ query: string; color: string }> = [];
  let nodes: SimNode[] = [];
  let edges: GraphEdge[] = [];
  let rState = createRenderState();
  let animationFrame: number;

  async function loadGraphData() {
    try {
      graphData = await getGraphData() as unknown as GraphData;
      initializeSimulation();
    } catch (error) { console.error('Failed to load graph data:', error); }
  }

  function initializeSimulation() {
    const filtered = filterGraphData(graphData, { searchQuery, showOrphans: settings.showOrphans, isLocal, centerNode, depth, tags: filterTags, types: filterTypes, folder: filterFolder, hiddenTags: $hiddenTags });
    nodes = initNodes(filtered.nodes, filtered.edges, width, height);
    edges = filtered.edges;
    const typeSet = new Set<string>();
    graphData.nodes.forEach((n) => { if (n.node_type) typeSet.add(n.node_type); });
    availableTags = []; availableTypes = Array.from(typeSet).sort();
    startSimulation();
  }

  $: if (graphData.nodes.length > 0) {
    const filtered = filterGraphData(graphData, { searchQuery, showOrphans: settings.showOrphans, isLocal, centerNode, depth, tags: filterTags, types: filterTypes, folder: filterFolder, hiddenTags: $hiddenTags });
    nodes = initNodes(filtered.nodes, filtered.edges, width, height, nodes);
    edges = filtered.edges;
    render();
  }

  function handleFilter(detail: { tags: string[]; types: string[]; folder: string; depth: number }) {
    filterTags = detail.tags; filterTypes = detail.types; filterFolder = detail.folder; filterDepth = detail.depth;
  }

  function render() {
    if (!ctx) return;
    renderGraph(ctx, nodes, edges, settings, colorGroups, rState, width, height);
  }

  function startSimulation() {
    function animate() {
      tickForces(nodes, edges, settings, width, height);
      render();
      if (settings.animate) animationFrame = requestAnimationFrame(animate);
    }
    animate();
  }

  function onMouseDown(e: MouseEvent) { rState = handleGraphMouseDown(e, canvasEl, nodes, rState); render(); }
  function onMouseMove(e: MouseEvent) { rState = handleGraphMouseMove(e, canvasEl, nodes, rState); render(); }
  function onMouseUp() { rState = handleGraphMouseUp(rState); }
  function onWheel(e: WheelEvent) { rState = handleGraphWheel(e, rState); render(); }

  function onClick(e: MouseEvent) {
    const { x, y } = screenToGraph(e, canvasEl, rState);
    const node = hitTestNode(nodes, x, y);
    if (node) { rState = { ...rState, selectedNode: node.id }; openNote(node.id); }
  }

  function onContextMenu(e: MouseEvent) {
    e.preventDefault();
    const { x, y } = screenToGraph(e, canvasEl, rState);
    const node = hitTestNode(nodes, x, y);
    if (node) { contextMenuNode = node; contextMenuX = e.clientX; contextMenuY = e.clientY; contextMenuVisible = true; }
  }

  function openNote(nodeId: string) { window.dispatchEvent(new CustomEvent('open-note', { detail: { id: nodeId } })); }

  function handleContextMenuAction(detail: { action: string; node: GraphNode | null }) {
    const { action, node } = detail;
    if (!node) return;
    switch (action) {
      case 'open': openNote(node.id); break;
      case 'open-new-pane': window.dispatchEvent(new CustomEvent('open-note-new-pane', { detail: { id: node.id } })); break;
      case 'show-local-graph': isLocal = true; centerNode = node.id; initializeSimulation(); break;
      case 'show-backlinks': window.dispatchEvent(new CustomEvent('show-backlinks', { detail: { id: node.id } })); break;
      case 'rename': window.dispatchEvent(new CustomEvent('rename-note', { detail: { id: node.id } })); break;
      case 'delete': window.dispatchEvent(new CustomEvent('delete-note', { detail: { id: node.id } })); break;
    }
  }

  function onKeyDown(e: KeyboardEvent) { rState = handleGraphKeyDown(e, rState); render(); }

  function handleResize() {
    if (canvasEl) {
      width = canvasEl.parentElement?.clientWidth || 800;
      height = canvasEl.parentElement?.clientHeight || 600;
      canvasEl.width = width; canvasEl.height = height;
      render();
    }
  }

  onMount(() => { ctx = canvasEl.getContext('2d'); handleResize(); loadGraphData(); window.addEventListener('resize', handleResize); window.addEventListener('keydown', onKeyDown); });
  onDestroy(() => { if (animationFrame) cancelAnimationFrame(animationFrame); window.removeEventListener('resize', handleResize); window.removeEventListener('keydown', onKeyDown); });
</script>

<div class="graph-view">
  <GraphHeader onRefresh={loadGraphData} />

  <!-- Canvas container -->
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

    <!-- Floating controls (top-right, Obsidian-style) -->
    <div class="graph-floating-controls">
      <button
        class="floating-btn"
        on:click={() => (filterOpen = !filterOpen)}
        title="Graph filters"
        class:active={filterOpen}
      >
        <Icon name="filter" size={16} />
      </button>
      <button
        class="floating-btn"
        on:click={() => (settingsOpen = !settingsOpen)}
        title="Graph settings"
        class:active={settingsOpen}
      >
        <Icon name="settings" size={16} />
      </button>
      <button
        class="floating-btn"
        on:click={() => {
          settings.animate = !settings.animate;
          if (settings.animate) startSimulation();
        }}
        title={settings.animate ? 'Pause simulation' : 'Start simulation'}
        class:active={settings.animate}
      >
        <Icon name="zap" size={16} />
      </button>
    </div>

    <!-- Search overlay (top-left) -->
    {#if searchQuery || settingsOpen}
      <div class="graph-search-overlay">
        <input
          type="text"
          placeholder="Filter nodes..."
          bind:value={searchQuery}
          class="search-input"
        />
      </div>
    {/if}

    <!-- Settings panel overlay -->
    {#if settingsOpen}
      <div class="graph-settings-overlay">
        <GraphSettingsPanel bind:settings bind:isOpen={settingsOpen} />
      </div>
    {/if}

    <!-- Filter panel overlay -->
    {#if filterOpen}
      <div class="graph-filter-overlay">
        <GraphFilter
          {availableTags}
          {availableTypes}
          selectedTags={filterTags}
          selectedTypes={filterTypes}
          folderFilter={filterFolder}
          linkDepth={filterDepth}
          onFilter={handleFilter}
        />
      </div>
    {/if}

    {#if isLocal && centerNode}
      <GraphLocalInfo
        {centerNode}
        {depth}
        onDepthChange={(d) => {
          depth = d;
        }}
        onShowGlobal={() => {
          isLocal = false;
          centerNode = null;
          initializeSimulation();
        }}
      />
    {/if}
  </div>

  <GraphContextMenu
    bind:visible={contextMenuVisible}
    bind:node={contextMenuNode}
    bind:x={contextMenuX}
    bind:y={contextMenuY}
    onAction={handleContextMenuAction}
  />
</div>

<style>
  .graph-view { display: flex; flex-direction: column; width: 100%; height: 100%; background: #1a1a2e; position: relative; }
  .graph-canvas-container { flex: 1; position: relative; overflow: hidden; }
  canvas { display: block; cursor: grab; }
  canvas:active { cursor: grabbing; }
  .graph-floating-controls { position: absolute; top: 12px; right: 12px; display: flex; flex-direction: column; gap: 4px; }
  .floating-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(30, 30, 50, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; color: rgba(200, 200, 220, 0.7); cursor: pointer; transition: all 0.15s ease; backdrop-filter: blur(8px); }
  .floating-btn:hover { background: rgba(50, 50, 80, 0.9); color: rgba(200, 200, 220, 1); border-color: rgba(255, 255, 255, 0.2); }
  .floating-btn.active { background: rgba(74, 158, 255, 0.2); border-color: rgba(74, 158, 255, 0.4); color: #4a9eff; }
  .graph-search-overlay { position: absolute; top: 12px; left: 12px; }
  .search-input { width: 200px; padding: 6px 10px; background: rgba(30, 30, 50, 0.9); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; font-size: 12px; color: rgba(200, 200, 220, 0.9); backdrop-filter: blur(8px); }
  .search-input::placeholder { color: rgba(200, 200, 220, 0.4); }
  .search-input:focus { outline: none; border-color: rgba(74, 158, 255, 0.5); }
  .graph-settings-overlay { position: absolute; top: 52px; right: 12px; background: rgba(25, 25, 45, 0.95); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 12px; backdrop-filter: blur(12px); max-width: 280px; max-height: 60vh; overflow-y: auto; }
  .graph-filter-overlay { position: absolute; top: 52px; left: 12px; background: rgba(25, 25, 45, 0.95); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 0; backdrop-filter: blur(12px); max-width: 260px; max-height: 60vh; overflow-y: auto; }
</style>
