<script lang="ts">
  import { goto } from '$app/navigation';
  import { GRAPH_COLORS } from '@/constants/colors';
  import { getGraph } from '@/hubs/core/stores/settings-store.svelte';
  import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
  import { getActiveTab } from '@/hubs/editor/stores/editor-tabs.svelte';
  import type { GraphEdge, GraphNode } from '@/hubs/knowledge/services/graph-builder';
  import { buildGraphData } from '@/hubs/knowledge/services/graph-builder';
  import { type GraphPhysics, simulateStep2D } from '@/hubs/knowledge/services/graph-simulation';
  import { SvelteSet } from 'svelte/reactivity';
  import { fileName, openNote } from '@/ui/panel-actions';

  let canvasEl: HTMLCanvasElement = $state(null!);
  let wrapEl: HTMLDivElement = $state(null!);
  let width = $state(280);
  let height = $state(300);
  let notes = $derived(getNotes());
  let activeTab = $derived(getActiveTab());
  let focusPath = $derived(activeTab?.path ?? null);

  let allNodes: GraphNode[] = $state([]);
  let allEdges: GraphEdge[] = $state([]);
  let hoveredNode: GraphNode | null = $state(null);
  let dragging: GraphNode | null = $state(null);
  let animFrame = 0;
  let buildVersion = 0;
  let depth = $state(1);
  let alpha = $state(1);
  const ALPHA_DECAY = 0.99;
  const ALPHA_MIN = 0.001;

  let connectionCounts = $derived.by(() => {
    const counts: Record<string, number> = {};
    for (const edge of allEdges) {
      counts[edge.source] = (counts[edge.source] ?? 0) + 1;
      counts[edge.target] = (counts[edge.target] ?? 0) + 1;
    }
    return counts;
  });

  let graphSettings = $derived(getGraph());
  let NODE_RADIUS = $derived(graphSettings.nodeRadius);
  let physics: GraphPhysics = $derived({
    linkDistance: graphSettings.linkDistance,
    repulsion: graphSettings.repulsionForce,
    attraction: 0.005,
    damping: graphSettings.damping,
    centerGravity: graphSettings.centerGravity,
    nodeRadius: graphSettings.nodeRadius,
  });

  // Build full graph data when notes change
  $effect(() => {
    if (notes.length === 0) return;
    const version = ++buildVersion;
    buildGraphData(notes).then((result) => {
      if (version !== buildVersion) return;
      allNodes = result.nodes;
      allEdges = result.edges;
    });
  });

  // Derive local subgraph from active note + depth
  let localNodes: GraphNode[] = $derived.by(() => {
    if (!focusPath || allNodes.length === 0) return allNodes;
    const reachable = new SvelteSet<string>([focusPath]);
    for (let d = 0; d < depth; d++) {
      const frontier = new SvelteSet<string>();
      for (const edge of allEdges) {
        if (reachable.has(edge.source) && !reachable.has(edge.target)) frontier.add(edge.target);
        if (reachable.has(edge.target) && !reachable.has(edge.source)) frontier.add(edge.source);
      }
      for (const id of frontier) reachable.add(id);
    }
    return allNodes.filter((n) => reachable.has(n.id));
  });

  let localEdges: GraphEdge[] = $derived.by(() => {
    const ids = new Set(localNodes.map((n) => n.id));
    return allEdges.filter((e) => ids.has(e.source) && ids.has(e.target));
  });

  let noteLabel = $derived(focusPath ? fileName(focusPath, true) || 'Note' : 'No note open');

  $effect(() => {
    if (!wrapEl) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      width = rect.width;
      height = rect.height;
    });
    ro.observe(wrapEl);
    return () => ro.disconnect();
  });

  $effect(() => {
    if (!canvasEl || localNodes.length === 0) return;
    startSimulation();
    return () => cancelAnimationFrame(animFrame);
  });

  function startSimulation() {
    alpha = 1;
    function tick() {
      if (alpha > ALPHA_MIN) {
        simulateStep2D(localNodes, localEdges, dragging?.id ?? null, physics, alpha);
        if (!dragging) alpha *= ALPHA_DECAY;
      }
      draw();
      animFrame = requestAnimationFrame(tick);
    }
    animFrame = requestAnimationFrame(tick);
  }

  // Cached resolved CSS colors — updated once per theme change, not per frame
  let cachedColors = { accent: '', text: '', edge: '' };
  $effect(() => {
    const style = getComputedStyle(document.documentElement);
    cachedColors = {
      accent: style.getPropertyValue('--color-accent').trim() || GRAPH_COLORS.nodeHover,
      text: style.getPropertyValue('--color-text').trim() || GRAPH_COLORS.node,
      edge: style.getPropertyValue('--color-border').trim() || 'rgba(128,128,128,0.3)',
    };
  });

  function draw() {
    const ctx = canvasEl?.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvasEl.width = width * dpr;
    canvasEl.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const accent = cachedColors.accent;
    const textColor = graphSettings.nodeColor || cachedColors.text;
    const edgeColor = graphSettings.edgeColor || cachedColors.edge;

    const nodeMap = new Map(localNodes.map((n) => [n.id, n]));
    ctx.globalAlpha = graphSettings.edgeOpacity;
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 1;
    for (const edge of localEdges) {
      const a = nodeMap.get(edge.source);
      const b = nodeMap.get(edge.target);
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (const node of localNodes) {
      const isFocus = node.id === focusPath;
      const isHovered = node === hoveredNode;
      const conns = connectionCounts[node.id] ?? 0;
      const sizeScale = 1 + Math.min(conns, 20) * 0.06;
      const r =
        (isFocus ? NODE_RADIUS * 1.8 : isHovered ? NODE_RADIUS * 1.4 : NODE_RADIUS) * sizeScale;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isFocus ? accent : isHovered ? accent : textColor;
      ctx.fill();
      if (isFocus || isHovered || graphSettings.showLabels) {
        ctx.font = `${isFocus ? '11' : '10'}px Inter Variable, sans-serif`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y - r - 4);
      }
    }
  }

  function handleMouseMove(e: MouseEvent) {
    const rect = canvasEl.getBoundingClientRect();
    const mx = e.clientX - rect.left,
      my = e.clientY - rect.top;
    if (dragging) {
      dragging.x = mx;
      dragging.y = my;
      dragging.vx = 0;
      dragging.vy = 0;
      return;
    }
    hoveredNode = null;
    for (const node of localNodes) {
      const dx = mx - node.x,
        dy = my - node.y;
      if (dx * dx + dy * dy < (NODE_RADIUS + 4) ** 2) {
        hoveredNode = node;
        break;
      }
    }
  }

  function handleMouseDown(e: MouseEvent) {
    const rect = canvasEl.getBoundingClientRect();
    const mx = e.clientX - rect.left,
      my = e.clientY - rect.top;
    for (const node of localNodes) {
      const dx = mx - node.x,
        dy = my - node.y;
      if (dx * dx + dy * dy < (NODE_RADIUS + 4) ** 2) {
        dragging = node;
        alpha = Math.max(alpha, 0.3);
        return;
      }
    }
  }

  function handleMouseUp() {
    if (dragging && hoveredNode && dragging === hoveredNode) {
      openNote(hoveredNode.id);
    }
    dragging = null;
    alpha = Math.max(alpha, 0.15);
  }
</script>

<div class="gp-root">
  <div class="gp-header">
    <span class="gp-title" title={focusPath ?? ''}>{noteLabel}</span>
    <label class="gp-depth" title="Traversal depth">
      <span>Depth</span>
      <input type="range" min="1" max="5" bind:value={depth} />
      <span class="gp-val">{depth}</span>
    </label>
  </div>
  <div class="gp-canvas" bind:this={wrapEl}>
    {#if localNodes.length === 0}
      <div class="gp-empty">{focusPath ? 'No connections' : 'Open a note'}</div>
    {:else}
      <canvas
        bind:this={canvasEl}
        style="width:{width}px;height:{height}px"
        onmousemove={handleMouseMove}
        onmousedown={handleMouseDown}
        onmouseup={handleMouseUp}
        onmouseleave={handleMouseUp}
      ></canvas>
    {/if}
  </div>
  <div class="gp-footer">
    <span class="gp-count">{localNodes.length} node{localNodes.length !== 1 ? 's' : ''}</span>
    <button class="gp-btn gp-btn-full" type="button" onclick={() => goto('/graph')}
      >Full Graph</button
    >
  </div>
</div>

<style>
  .gp-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .gp-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }
  .gp-title {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-text);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .gp-depth {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.6rem;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }
  .gp-depth input {
    width: 48px;
    accent-color: var(--color-accent);
  }
  .gp-val {
    font-size: 0.6rem;
    color: var(--color-text-subtle);
    min-width: 18px;
    text-align: right;
  }
  .gp-canvas {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: var(--color-background);
    min-height: 120px;
  }
  .gp-canvas canvas {
    display: block;
    cursor: crosshair;
  }
  .gp-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-text-muted);
    font-size: 0.7rem;
  }
  .gp-footer {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-top: 1px solid var(--color-border);
    flex-shrink: 0;
  }
  .gp-count {
    font-size: 0.6rem;
    color: var(--color-text-subtle);
    flex: 1;
  }
  .gp-btn {
    padding: 2px 8px;
    font-size: 0.6rem;
    font-weight: 500;
    border: none;
    border-radius: var(--radius-s);
    background: var(--color-surface);
    color: var(--color-text-muted);
    cursor: pointer;
  }
  .gp-btn:hover {
    color: var(--color-text);
  }
  .gp-btn-full {
    background: var(--color-accent);
    color: var(--color-background);
  }
  .gp-btn-full:hover {
    opacity: 0.9;
  }
</style>
