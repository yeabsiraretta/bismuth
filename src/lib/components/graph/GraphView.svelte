<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import type { GraphData, GraphNode, GraphEdge, GraphSettings } from '@/types/graph';
  import Icon from '@/components/icons/Icon.svelte';
  import GraphSettingsPanel from '@/components/graph/GraphSettings.svelte';
  import GraphFilter from '@/components/graph/GraphFilter.svelte';
  import GraphContextMenu from '@/components/graph/GraphContextMenu.svelte';
  import GraphHeader from '@/components/graph/GraphHeader.svelte';
  import GraphLocalInfo from '@/components/graph/GraphLocalInfo.svelte';
  import {
    type SimNode,
    DEFAULT_NODE_COLORS,
    filterGraphData,
    initNodes,
    tickForces,
    getNodeRadius,
    getNodeColor,
    hitTestNode,
  } from '@/utils/graphSimulation';
  import { hiddenTags } from '@/stores/tag/tag';

  export let isLocal = false;
  export let centerNode: string | null = null;
  export let depth = 2;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  let graphData: GraphData = { nodes: [], edges: [] };
  let width = 800;
  let height = 600;
  let searchQuery = '';
  let settingsOpen = false;
  let filterOpen = false;

  // Filter state
  let filterTags: string[] = [];
  let filterTypes: string[] = [];
  let filterFolder = '';
  let filterDepth = 3;
  let availableTags: string[] = [];
  let availableTypes: string[] = [];

  // Context menu state
  let contextMenuVisible = false;
  let contextMenuNode: GraphNode | null = null;
  let contextMenuX = 0;
  let contextMenuY = 0;

  // Settings
  let settings: GraphSettings = {
    showTags: true,
    showAttachments: true,
    showOrphans: true,
    showArrows: false,
    showLabels: true,
    textFadeThreshold: 0.3,
    nodeSize: 1.0,
    linkThickness: 0.5,
    centerForce: 0.3,
    repelForce: 100,
    linkForce: 0.5,
    linkDistance: 100,
    animate: false,
  };

  // Color groups
  let colorGroups: Array<{ query: string; color: string }> = [];

  // Simulation state
  let nodes: SimNode[] = [];
  let edges: GraphEdge[] = [];
  let hoveredNode: string | null = null;
  let selectedNode: string | null = null;
  let isDragging = false;
  let dragNode: (typeof nodes)[0] | null = null;
  let offsetX = 0;
  let offsetY = 0;
  let scale = 1;
  let animationFrame: number;

  // Load graph data
  async function loadGraphData() {
    try {
      const data = await invoke<GraphData>('get_graph_data');
      graphData = data;
      initializeSimulation();
    } catch (error) {
      console.error('Failed to load graph data:', error);
    }
  }

  // Initialize force simulation
  function initializeSimulation() {
    const filtered = filterGraphData(graphData, {
      searchQuery,
      showOrphans: settings.showOrphans,
      isLocal,
      centerNode,
      depth,
      tags: filterTags,
      types: filterTypes,
      folder: filterFolder,
      hiddenTags: $hiddenTags,
    });
    nodes = initNodes(filtered.nodes, filtered.edges, width, height);
    edges = filtered.edges;

    // Extract available tags/types from raw data for filter dropdowns
    const tagSet = new Set<string>();
    const typeSet = new Set<string>();
    graphData.nodes.forEach((n) => {
      if (n.node_type) typeSet.add(n.node_type);
    });
    availableTags = Array.from(tagSet).sort();
    availableTypes = Array.from(typeSet).sort();

    startSimulation();
  }

  // Reactive: Re-filter when settings, search, or filters change
  $: if (graphData.nodes.length > 0) {
    const filtered = filterGraphData(graphData, {
      searchQuery,
      showOrphans: settings.showOrphans,
      isLocal,
      centerNode,
      depth,
      tags: filterTags,
      types: filterTypes,
      folder: filterFolder,
      hiddenTags: $hiddenTags,
    });
    nodes = initNodes(filtered.nodes, filtered.edges, width, height, nodes);
    edges = filtered.edges;
    render();
  }

  function handleFilter(detail: {
    tags: string[];
    types: string[];
    folder: string;
    depth: number;
  }) {
    filterTags = detail.tags;
    filterTypes = detail.types;
    filterFolder = detail.folder;
    filterDepth = detail.depth;
  }

  function applyForces() {
    tickForces(nodes, edges, settings, width, height);
  }

  // Render graph (Obsidian-inspired)
  function render() {
    if (!ctx) return;

    // Dark background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Draw edges - subtle thin lines
    ctx.globalAlpha = 0.4;
    edges.forEach((edge) => {
      const source = nodes.find((n) => n.id === edge.from);
      const target = nodes.find((n) => n.id === edge.to);
      if (!source || !target) return;

      ctx!.beginPath();
      ctx!.moveTo(source.x, source.y);
      ctx!.lineTo(target.x, target.y);
      ctx!.strokeStyle = '#5a5a7a';
      ctx!.lineWidth = settings.linkThickness;
      ctx!.stroke();

      // Draw arrows (disabled by default, Obsidian-style)
      if (settings.showArrows) {
        const angle = Math.atan2(target.y - source.y, target.x - source.x);
        const arrowSize = 6;
        ctx!.save();
        ctx!.translate(target.x, target.y);
        ctx!.rotate(angle);
        ctx!.beginPath();
        ctx!.moveTo(-arrowSize, -arrowSize / 2);
        ctx!.lineTo(0, 0);
        ctx!.lineTo(-arrowSize, arrowSize / 2);
        ctx!.fillStyle = '#5a5a7a';
        ctx!.fill();
        ctx!.restore();
      }
    });
    ctx.globalAlpha = 1.0;

    // Draw nodes - sized by connection count
    nodes.forEach((node) => {
      const isHovered = hoveredNode === node.id;
      const isSelected = selectedNode === node.id;
      const radius = getNodeRadius(node, settings) * (isHovered || isSelected ? 1.4 : 1);
      const nodeColor = getNodeColor(node, DEFAULT_NODE_COLORS, colorGroups);

      // Node glow on hover/select
      if (isHovered || isSelected) {
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
        ctx!.fillStyle = isSelected ? 'rgba(74, 158, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';
        ctx!.fill();
      }

      // Node fill
      ctx!.beginPath();
      ctx!.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx!.fillStyle = isSelected ? '#4a9eff' : isHovered ? '#6bb6ff' : nodeColor;
      ctx!.fill();

      // Draw label
      const showLabel =
        settings.showLabels && (isHovered || isSelected || scale > settings.textFadeThreshold);
      if (showLabel) {
        ctx!.fillStyle = isHovered || isSelected ? '#ffffff' : 'rgba(200, 200, 220, 0.8)';
        ctx!.font = `${isHovered || isSelected ? '12px' : '11px'} system-ui, -apple-system, sans-serif`;
        ctx!.textAlign = 'center';
        ctx!.textBaseline = 'top';
        ctx!.fillText(node.label, node.x, node.y + radius + 4);
      }
    });

    ctx.restore();

    // Draw node count badge (bottom-left)
    ctx.fillStyle = 'rgba(200, 200, 220, 0.5)';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`${nodes.length} nodes · ${edges.length} connections`, 12, height - 12);
  }

  // Animation loop
  function startSimulation() {
    function animate() {
      applyForces();
      render();
      if (settings.animate) {
        animationFrame = requestAnimationFrame(animate);
      }
    }
    animate();
  }

  function screenToGraph(e: MouseEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offsetX) / scale,
      y: (e.clientY - rect.top - offsetY) / scale,
    };
  }

  function handleMouseDown(e: MouseEvent) {
    const { x, y } = screenToGraph(e);
    const node = hitTestNode(nodes, x, y);
    if (node) {
      dragNode = node;
      isDragging = true;
    }
  }

  function handleMouseMove(e: MouseEvent) {
    const { x, y } = screenToGraph(e);
    if (isDragging && dragNode) {
      dragNode.x = x;
      dragNode.y = y;
      dragNode.vx = 0;
      dragNode.vy = 0;
      render();
    } else {
      const node = hitTestNode(nodes, x, y);
      hoveredNode = node ? node.id : null;
      render();
    }
  }

  function handleMouseUp() {
    isDragging = false;
    dragNode = null;
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    scale = Math.max(0.1, Math.min(5, scale * (e.deltaY > 0 ? 0.9 : 1.1)));
    render();
  }

  function handleClick(e: MouseEvent) {
    const { x, y } = screenToGraph(e);
    const node = hitTestNode(nodes, x, y);
    if (node) {
      selectedNode = node.id;
      openNote(node.id);
    }
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    const { x, y } = screenToGraph(e);
    const node = hitTestNode(nodes, x, y);
    if (node) showContextMenu(node, e.clientX, e.clientY);
  }

  function openNote(nodeId: string) {
    // Emit event to parent component
    window.dispatchEvent(new CustomEvent('open-note', { detail: { id: nodeId } }));
  }

  function showContextMenu(node: GraphNode, x: number, y: number) {
    contextMenuNode = node;
    contextMenuX = x;
    contextMenuY = y;
    contextMenuVisible = true;
  }

  function handleContextMenuAction(detail: { action: string; node: GraphNode | null }) {
    const { action, node } = detail;
    if (!node) return;

    switch (action) {
      case 'open':
        openNote(node.id);
        break;
      case 'open-new-pane':
        window.dispatchEvent(new CustomEvent('open-note-new-pane', { detail: { id: node.id } }));
        break;
      case 'show-local-graph':
        isLocal = true;
        centerNode = node.id;
        initializeSimulation();
        break;
      case 'show-backlinks':
        window.dispatchEvent(new CustomEvent('show-backlinks', { detail: { id: node.id } }));
        break;
      case 'rename':
        window.dispatchEvent(new CustomEvent('rename-note', { detail: { id: node.id } }));
        break;
      case 'delete':
        window.dispatchEvent(new CustomEvent('delete-note', { detail: { id: node.id } }));
        break;
    }
  }

  // Keyboard controls
  function handleKeyDown(e: KeyboardEvent) {
    const speed = e.shiftKey ? 20 : 5;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        offsetY += speed;
        render();
        break;
      case 'ArrowDown':
        e.preventDefault();
        offsetY -= speed;
        render();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        offsetX += speed;
        render();
        break;
      case 'ArrowRight':
        e.preventDefault();
        offsetX -= speed;
        render();
        break;
      case '+':
      case '=':
        e.preventDefault();
        scale *= 1.1;
        scale = Math.min(5, scale);
        render();
        break;
      case '-':
      case '_':
        e.preventDefault();
        scale *= 0.9;
        scale = Math.max(0.1, scale);
        render();
        break;
    }
  }

  // Resize handler
  function handleResize() {
    if (canvas) {
      width = canvas.parentElement?.clientWidth || 800;
      height = canvas.parentElement?.clientHeight || 600;
      canvas.width = width;
      canvas.height = height;
      render();
    }
  }

  onMount(() => {
    ctx = canvas.getContext('2d');
    handleResize();
    loadGraphData();
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
  });

  onDestroy(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<div class="graph-view">
  <GraphHeader onRefresh={loadGraphData} />

  <!-- Canvas container -->
  <div class="graph-canvas-container">
    <canvas
      bind:this={canvas}
      on:mousedown={handleMouseDown}
      on:mousemove={handleMouseMove}
      on:mouseup={handleMouseUp}
      on:wheel={handleWheel}
      on:click={handleClick}
      on:contextmenu={handleContextMenu}
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
  .graph-view {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: #1a1a2e;
    position: relative;
  }

  .graph-canvas-container {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  canvas {
    display: block;
    cursor: grab;
  }

  canvas:active {
    cursor: grabbing;
  }

  .graph-floating-controls {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .floating-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: rgba(30, 30, 50, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: rgba(200, 200, 220, 0.7);
    cursor: pointer;
    transition: all 0.15s ease;
    backdrop-filter: blur(8px);
  }

  .floating-btn:hover {
    background: rgba(50, 50, 80, 0.9);
    color: rgba(200, 200, 220, 1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .floating-btn.active {
    background: rgba(74, 158, 255, 0.2);
    border-color: rgba(74, 158, 255, 0.4);
    color: #4a9eff;
  }

  .graph-search-overlay {
    position: absolute;
    top: 12px;
    left: 12px;
  }

  .search-input {
    width: 200px;
    padding: 6px 10px;
    background: rgba(30, 30, 50, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    font-size: 12px;
    color: rgba(200, 200, 220, 0.9);
    backdrop-filter: blur(8px);
  }

  .search-input::placeholder {
    color: rgba(200, 200, 220, 0.4);
  }

  .search-input:focus {
    outline: none;
    border-color: rgba(74, 158, 255, 0.5);
  }

  .graph-settings-overlay {
    position: absolute;
    top: 52px;
    right: 12px;
    background: rgba(25, 25, 45, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 12px;
    backdrop-filter: blur(12px);
    max-width: 280px;
    max-height: 60vh;
    overflow-y: auto;
  }

  .graph-filter-overlay {
    position: absolute;
    top: 52px;
    left: 12px;
    background: rgba(25, 25, 45, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0;
    backdrop-filter: blur(12px);
    max-width: 260px;
    max-height: 60vh;
    overflow-y: auto;
  }
</style>
