<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import type { GraphData, GraphNode, GraphEdge, GraphSettings } from '@/types/graph';
  import GraphSettingsPanel from '@/components/graph/GraphSettings.svelte';
  import GraphContextMenu from '@/components/graph/GraphContextMenu.svelte';
  import { exportGraphAsPNG, exportGraphAsSVG, exportGraphAsJSON } from '@/utils/graphExport';

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

  // Context menu state
  let contextMenuVisible = false;
  let contextMenuNode: GraphNode | null = null;
  let contextMenuX = 0;
  let contextMenuY = 0;

  // Settings
  let settings: GraphSettings = {
    showTags: true,
    showAttachments: true,
    showOrphans: false,
    showArrows: true,
    textFadeThreshold: 0.5,
    nodeSize: 1.0,
    linkThickness: 1.0,
    centerForce: 0.3,
    repelForce: 100,
    linkForce: 0.5,
    linkDistance: 100,
    animate: false,
  };

  // Color groups
  let colorGroups: Array<{ query: string; color: string }> = [];

  // Simulation state
  let nodes: Array<GraphNode & { x: number; y: number; vx: number; vy: number }> = [];
  let edges: GraphEdge[] = [];
  let hoveredNode: string | null = null;
  let selectedNode: string | null = null;
  let isDragging = false;
  let dragNode: (typeof nodes)[0] | null = null;
  let offsetX = 0;
  let offsetY = 0;
  let scale = 1;
  let animationFrame: number;

  // Filter nodes based on search and settings
  function filterNodes(data: GraphData): GraphData {
    let filteredNodes = data.nodes;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredNodes = filteredNodes.filter((n) => n.label.toLowerCase().includes(query));
    }

    // Filter orphans
    if (!settings.showOrphans) {
      const connectedNodeIds = new Set<string>();
      data.edges.forEach((e) => {
        connectedNodeIds.add(e.from);
        connectedNodeIds.add(e.to);
      });
      filteredNodes = filteredNodes.filter((n) => connectedNodeIds.has(n.id));
    }

    // Local graph mode
    if (isLocal && centerNode) {
      const connectedIds = new Set<string>([centerNode]);
      for (let d = 0; d < depth; d++) {
        const currentIds = Array.from(connectedIds);
        data.edges.forEach((e) => {
          if (currentIds.includes(e.from)) connectedIds.add(e.to);
          if (currentIds.includes(e.to)) connectedIds.add(e.from);
        });
      }
      filteredNodes = filteredNodes.filter((n) => connectedIds.has(n.id));
    }

    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = data.edges.filter(
      (e) => filteredNodeIds.has(e.from) && filteredNodeIds.has(e.to)
    );

    return { nodes: filteredNodes, edges: filteredEdges };
  }

  // Get node color based on groups
  function getNodeColor(node: GraphNode): string {
    for (const group of colorGroups) {
      if (node.label.toLowerCase().includes(group.query.toLowerCase())) {
        return group.color;
      }
    }
    return '#888';
  }

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
    const filtered = filterNodes(graphData);
    nodes = filtered.nodes.map((node) => ({
      ...node,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
    }));
    edges = filtered.edges;
    startSimulation();
  }

  // Reactive: Re-filter when settings or search changes
  $: if (graphData.nodes.length > 0) {
    const filtered = filterNodes(graphData);
    nodes = filtered.nodes.map((node) => {
      const existing = nodes.find((n) => n.id === node.id);
      return (
        existing || {
          ...node,
          x: Math.random() * width,
          y: Math.random() * height,
          vx: 0,
          vy: 0,
        }
      );
    });
    edges = filtered.edges;
    render();
  }

  // Force simulation
  function applyForces() {
    const centerX = width / 2;
    const centerY = height / 2;

    // Apply center force
    nodes.forEach((node) => {
      const dx = centerX - node.x;
      const dy = centerY - node.y;
      node.vx += dx * settings.centerForce * 0.01;
      node.vy += dy * settings.centerForce * 0.01;
    });

    // Apply repel force
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = settings.repelForce / (dist * dist);

        nodes[i].vx -= (dx / dist) * force;
        nodes[i].vy -= (dy / dist) * force;
        nodes[j].vx += (dx / dist) * force;
        nodes[j].vy += (dy / dist) * force;
      }
    }

    // Apply link force
    edges.forEach((edge) => {
      const source = nodes.find((n) => n.id === edge.from);
      const target = nodes.find((n) => n.id === edge.to);
      if (!source || !target) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - settings.linkDistance) * settings.linkForce * 0.01;

      source.vx += (dx / dist) * force;
      source.vy += (dy / dist) * force;
      target.vx -= (dx / dist) * force;
      target.vy -= (dy / dist) * force;
    });

    // Update positions
    nodes.forEach((node) => {
      node.x += node.vx;
      node.y += node.vy;
      node.vx *= 0.9; // Damping
      node.vy *= 0.9;
    });
  }

  // Render graph
  function render() {
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Draw edges
    edges.forEach((edge) => {
      const source = nodes.find((n) => n.id === edge.from);
      const target = nodes.find((n) => n.id === edge.to);
      if (!source || !target) return;

      ctx!.beginPath();
      ctx!.moveTo(source.x, source.y);
      ctx!.lineTo(target.x, target.y);
      ctx!.strokeStyle = '#666';
      ctx!.lineWidth = settings.linkThickness;
      ctx!.stroke();

      // Draw arrows
      if (settings.showArrows) {
        const angle = Math.atan2(target.y - source.y, target.x - source.x);
        const arrowSize = 8;
        ctx!.save();
        ctx!.translate(target.x, target.y);
        ctx!.rotate(angle);
        ctx!.beginPath();
        ctx!.moveTo(-arrowSize, -arrowSize / 2);
        ctx!.lineTo(0, 0);
        ctx!.lineTo(-arrowSize, arrowSize / 2);
        ctx!.fillStyle = '#666';
        ctx!.fill();
        ctx!.restore();
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      const isHovered = hoveredNode === node.id;
      const isSelected = selectedNode === node.id;
      const radius = 5 * settings.nodeSize * (isHovered || isSelected ? 1.5 : 1);

      const nodeColor = getNodeColor(node);
      ctx!.beginPath();
      ctx!.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx!.fillStyle = isSelected ? '#4a9eff' : isHovered ? '#6bb6ff' : nodeColor;
      ctx!.fill();
      ctx!.strokeStyle = '#fff';
      ctx!.lineWidth = 2;
      ctx!.stroke();

      // Draw label
      if (isHovered || isSelected || scale > settings.textFadeThreshold) {
        ctx!.fillStyle = '#fff';
        ctx!.font = '12px system-ui';
        ctx!.textAlign = 'center';
        ctx!.fillText(node.label, node.x, node.y - radius - 5);
      }
    });

    ctx.restore();
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

  // Mouse events
  function handleMouseDown(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offsetX) / scale;
    const y = (e.clientY - rect.top - offsetY) / scale;

    const node = nodes.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 10;
    });

    if (node) {
      dragNode = node;
      isDragging = true;
    }
  }

  function handleMouseMove(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offsetX) / scale;
    const y = (e.clientY - rect.top - offsetY) / scale;

    if (isDragging && dragNode) {
      dragNode.x = x;
      dragNode.y = y;
      dragNode.vx = 0;
      dragNode.vy = 0;
      render();
    } else {
      const node = nodes.find((n) => {
        const dx = n.x - x;
        const dy = n.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 10;
      });
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
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    scale *= delta;
    scale = Math.max(0.1, Math.min(5, scale));
    render();
  }

  function handleClick(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offsetX) / scale;
    const y = (e.clientY - rect.top - offsetY) / scale;

    const node = nodes.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 10;
    });

    if (node) {
      selectedNode = node.id;
      openNote(node.id);
    }
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offsetX) / scale;
    const y = (e.clientY - rect.top - offsetY) / scale;

    const node = nodes.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 10;
    });

    if (node) {
      showContextMenu(node, e.clientX, e.clientY);
    }
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

  function handleContextMenuAction(event: CustomEvent<{ action: string; node: GraphNode }>) {
    const { action, node } = event.detail;

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
  <div class="graph-controls">
    <input
      type="text"
      placeholder="Search nodes..."
      bind:value={searchQuery}
      class="search-input"
    />
    <button on:click={() => (settings.animate = !settings.animate)}>
      {settings.animate ? 'Pause' : 'Animate'}
    </button>
    <button on:click={() => (scale = 1)}>Reset Zoom</button>
    <button on:click={loadGraphData}>Refresh</button>
    <button on:click={() => exportGraphAsPNG(canvas)}>Export PNG</button>
    <button on:click={() => exportGraphAsSVG(graphData)}>Export SVG</button>
    <button on:click={() => exportGraphAsJSON(graphData)}> Export JSON </button>
    <GraphSettingsPanel bind:settings bind:isOpen={settingsOpen} />
  </div>

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
  />

  {#if isLocal && centerNode}
    <div class="local-graph-info">
      <p>Local graph: {centerNode}</p>
      <label>
        Depth: {depth}
        <input type="range" min="1" max="5" bind:value={depth} />
      </label>
    </div>
  {/if}

  <GraphContextMenu
    bind:visible={contextMenuVisible}
    bind:node={contextMenuNode}
    bind:x={contextMenuX}
    bind:y={contextMenuY}
    on:action={handleContextMenuAction}
  />
</div>

<style>
  .graph-view {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--color-bg);
    position: relative;
  }

  .graph-controls {
    display: flex;
    gap: var(--space-2);
    padding: var(--space-3);
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    align-items: center;
  }

  .search-input {
    flex: 1;
    max-width: 300px;
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 0.875rem;
    color: var(--color-text);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .graph-controls button {
    padding: var(--space-2) var(--space-4);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-text);
    transition: background 0.2s;
  }

  .graph-controls button:hover {
    background: var(--color-surface);
    border-color: var(--color-primary);
  }

  .local-graph-info {
    position: absolute;
    top: 70px;
    left: var(--space-3);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: var(--space-3);
    font-size: 0.875rem;
    color: var(--color-text);
  }

  .local-graph-info label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }

  .local-graph-info input[type='range'] {
    flex: 1;
  }

  canvas {
    flex: 1;
    cursor: grab;
  }

  canvas:active {
    cursor: grabbing;
  }
</style>
