<script lang="ts">
  import './+page.css';
  import { pageTitle, SITE_URL } from '@/constants/seo';
  import { getGraph } from '@/hubs/core/stores/settings-store.svelte';
  import { setActiveHub } from '@/hubs/core/stores/layout-store.svelte';
  import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
  import Graph3D from '@/hubs/knowledge/components/Graph3D.svelte';
  import type { GraphEdge, GraphNode } from '@/hubs/knowledge/services/graph-builder';
  import { buildGraphData } from '@/hubs/knowledge/services/graph-builder';
  import { type GraphPhysics, simulateStep2D } from '@/hubs/knowledge/services/graph-simulation';
  import { MetaTags } from 'svelte-meta-tags';
  import { GRAPH_COLORS } from '@/constants/colors';
  import CanvasMinimap from '@/ui/canvas-minimap.svelte';
  import type { WorldBounds } from '@/ui/canvas-minimap.svelte';

  let { data } = $props();

  let canvasEl: HTMLCanvasElement = $state(null!);
  let wrapEl: HTMLDivElement = $state(null!);
  let width = $state(800);
  let height = $state(600);
  let notes = $derived(getNotes());

  let nodes: GraphNode[] = $state([]);
  let edges: GraphEdge[] = $state([]);
  let hoveredNode: GraphNode | null = $state(null);
  let dragging: GraphNode | null = $state(null);
  let animFrame = 0;
  let buildVersion = 0;

  let panX = $state(0);
  let panY = $state(0);
  let zoom = $state(1);
  let isPanning = $state(false);
  let needsFit = $state(false);
  let panStart = { x: 0, y: 0 };
  let search = $state('');
  let showMinimap = $state(true);
  let warmupDone = $state(false);
  let mmBounds: WorldBounds = $state({ minX: 0, minY: 0, maxX: 1, maxY: 1 });
  let alpha = $state(1);
  let fitRaf = 0;
  const ALPHA_DECAY = 0.99;
  const ALPHA_MIN = 0.001;

  let graphSettings = $derived(getGraph());
  let viewMode = $derived(graphSettings.viewMode ?? '2d');
  let physics: GraphPhysics = $derived({
    linkDistance: graphSettings.linkDistance,
    repulsion: graphSettings.repulsionForce,
    attraction: 0.005,
    damping: graphSettings.damping,
    centerGravity: graphSettings.centerGravity,
    nodeRadius: graphSettings.nodeRadius,
  });
  let NODE_RADIUS = $derived(graphSettings.nodeRadius);

  let nodeMap = $derived(new Map(nodes.map((n) => [n.id, n])));

  let connectionCounts = $derived.by(() => {
    const counts: Record<string, number> = {};
    for (const edge of edges) {
      counts[edge.source] = (counts[edge.source] ?? 0) + 1;
      counts[edge.target] = (counts[edge.target] ?? 0) + 1;
    }
    return counts;
  });

  let matchedNodeIds = $derived.by(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return new Set(nodes.filter((n) => n.label.toLowerCase().includes(q)).map((n) => n.id));
  });

  $effect(() => {
    if (notes.length === 0) return;
    const version = ++buildVersion;
    warmupDone = false;
    buildGraphData(notes).then((result) => {
      if (version !== buildVersion) return;
      nodes = result.nodes;
      edges = result.edges;
      // Run warm-up ticks so the simulation spreads nodes before centering
      for (let i = 0; i < 120; i++) {
        simulateStep2D(nodes, edges, null, physics, 1);
      }
      alpha = 0.5;
      warmupDone = true;
      needsFit = true;
    });
  });

  $effect(() => {
    if (!wrapEl) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      width = rect.width;
      height = rect.height;
      scheduleAutoFit();
    });
    ro.observe(wrapEl);
    return () => ro.disconnect();
  });

  $effect(() => {
    return () => {
      if (fitRaf) cancelAnimationFrame(fitRaf);
    };
  });

  $effect(() => {
    if (!canvasEl || nodes.length === 0 || viewMode !== '2d' || !warmupDone) return;
    startSimulation();
    return () => cancelAnimationFrame(animFrame);
  });

  function startSimulation() {
    if (needsFit) {
      applyFitToView();
      needsFit = false;
    }
    draw(); // immediate first paint — don't wait for rAF (tab may not be focused)
    function tick() {
      if (alpha > ALPHA_MIN) {
        simulateStep2D(nodes, edges, dragging?.id ?? null, physics, alpha);
        if (!dragging) alpha *= ALPHA_DECAY;
      }
      draw();
      animFrame = requestAnimationFrame(tick);
    }
    animFrame = requestAnimationFrame(tick);
  }

  function screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return { x: (sx - panX) / zoom, y: (sy - panY) / zoom };
  }

  function nodeHitRadius(node: GraphNode): number {
    const conns = connectionCounts[node.id] ?? 0;
    const sizeScale = 1 + Math.min(conns, 20) * 0.08;
    return NODE_RADIUS * sizeScale + 4 / zoom;
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

    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    const accent = cachedColors.accent;
    const textColor = graphSettings.nodeColor || cachedColors.text;
    const edgeColor = graphSettings.edgeColor || cachedColors.edge;

    ctx.globalAlpha = graphSettings.edgeOpacity;
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 1 / zoom;
    for (const edge of edges) {
      const a = nodeMap.get(edge.source);
      const b = nodeMap.get(edge.target);
      if (!a || !b) continue;
      if (matchedNodeIds && !matchedNodeIds.has(a.id) && !matchedNodeIds.has(b.id)) {
        ctx.globalAlpha = graphSettings.edgeOpacity * 0.15;
      } else {
        ctx.globalAlpha = graphSettings.edgeOpacity;
      }
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (const node of nodes) {
      const isHovered = node === hoveredNode;
      const conns = connectionCounts[node.id] ?? 0;
      const sizeScale = 1 + Math.min(conns, 20) * 0.08;
      const r = (isHovered ? NODE_RADIUS * 1.5 : NODE_RADIUS) * sizeScale;
      const isMatch = matchedNodeIds?.has(node.id);
      const isDimmed = matchedNodeIds && !isMatch;

      ctx.globalAlpha = isDimmed ? 0.15 : 1;

      if (isHovered) {
        ctx.shadowColor = accent;
        ctx.shadowBlur = 12;
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isHovered || isMatch ? accent : textColor;
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      if (isMatch || (graphSettings.showLabels && nodes.length <= graphSettings.labelThreshold)) {
        const fontSize = Math.max(10, 12 / zoom);
        ctx.font = `${fontSize}px Inter Variable, sans-serif`;
        ctx.fillStyle = isDimmed ? textColor : isMatch ? accent : textColor;
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y - r - 4);
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function computeNodeBounds(): WorldBounds {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const n of nodes) {
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x > maxX) maxX = n.x;
      if (n.y > maxY) maxY = n.y;
    }
    return { minX, minY, maxX: maxX === -Infinity ? 1 : maxX, maxY: maxY === -Infinity ? 1 : maxY };
  }

  function snapshotWorldBounds() {
    if (nodes.length === 0) return;
    mmBounds = computeNodeBounds();
  }

  function applyFitToView() {
    fitToView();
    snapshotWorldBounds();
  }

  function scheduleAutoFit() {
    if (viewMode !== '2d' || !warmupDone || nodes.length === 0) return;
    if (fitRaf) cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(() => {
      fitRaf = 0;
      applyFitToView();
    });
  }

  function fitToView() {
    if (nodes.length === 0) return;
    const b = computeNodeBounds();
    const rangeX = b.maxX - b.minX || 1;
    const rangeY = b.maxY - b.minY || 1;
    const pad = 60;
    zoom = Math.min((width - pad * 2) / rangeX, (height - pad * 2) / rangeY, 2);
    panX = width / 2 - ((b.minX + b.maxX) / 2) * zoom;
    panY = height / 2 - ((b.minY + b.maxY) / 2) * zoom;
  }

  $effect(() => {
    if (viewMode !== '2d' || !warmupDone || nodes.length === 0) return;
    scheduleAutoFit();
  });

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.05, Math.min(8, zoom * delta));
    const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    const mx = e.clientX - rect.left,
      my = e.clientY - rect.top;
    panX = mx - ((mx - panX) * newZoom) / zoom;
    panY = my - ((my - panY) * newZoom) / zoom;
    zoom = newZoom;
  }

  function handleMouseMove(e: MouseEvent) {
    if (isPanning) {
      panX = e.clientX - panStart.x;
      panY = e.clientY - panStart.y;
      return;
    }

    const rect = canvasEl.getBoundingClientRect();
    const w = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);

    if (dragging) {
      dragging.x = w.x;
      dragging.y = w.y;
      dragging.vx = 0;
      dragging.vy = 0;
      return;
    }

    hoveredNode = null;
    for (const node of nodes) {
      const dx = w.x - node.x;
      const dy = w.y - node.y;
      const hitR = nodeHitRadius(node);
      if (dx * dx + dy * dy < hitR * hitR) {
        hoveredNode = node;
        break;
      }
    }
  }

  function handleMouseDown(e: MouseEvent) {
    if (e.button === 1 || (e.button === 0 && e.metaKey)) {
      isPanning = true;
      panStart = { x: e.clientX - panX, y: e.clientY - panY };
      e.preventDefault();
      return;
    }

    const rect = canvasEl.getBoundingClientRect();
    const w = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    for (const node of nodes) {
      const dx = w.x - node.x;
      const dy = w.y - node.y;
      const hitR = nodeHitRadius(node);
      if (dx * dx + dy * dy < hitR * hitR) {
        dragging = node;
        alpha = Math.max(alpha, 0.3);
        return;
      }
    }
    isPanning = true;
    panStart = { x: e.clientX - panX, y: e.clientY - panY };
  }

  function handleMouseUp() {
    if (dragging && hoveredNode && dragging === hoveredNode) {
      window.dispatchEvent(new CustomEvent('open-note', { detail: { path: hoveredNode.id } }));
    }
    dragging = null;
    isPanning = false;
    alpha = Math.max(alpha, 0.15);
  }
</script>

<MetaTags
  title={pageTitle(data.title ?? 'Graph')}
  description={data.description ??
    'Visualize your knowledge graph — explore connections between notes in 2D or 3D.'}
  canonical="{SITE_URL}/graph"
  openGraph={{
    url: `${SITE_URL}/graph`,
    title: pageTitle(data.title ?? 'Graph'),
    description: data.description ?? '',
  }}
/>

<div class="graph-container">
  <div class="graph-header">
    <span class="graph-title">Graph View</span>
    <div class="graph-search-wrap">
      <input
        type="text"
        class="graph-search"
        placeholder="Search nodes..."
        bind:value={search}
        aria-label="Search graph nodes"
      />
      {#if matchedNodeIds}
        <span class="graph-match-count"
          >{matchedNodeIds.size} match{matchedNodeIds.size !== 1 ? 'es' : ''}</span
        >
      {/if}
    </div>
    <span class="graph-count"
      >{nodes.length} notes · {edges.length} links · {Math.round(zoom * 100)}%</span
    >
    <div class="graph-actions">
      <button
        class="graph-btn"
        type="button"
        onclick={() => {
          const cx = width / 2,
            cy = height / 2;
          const newZoom = Math.min(8, zoom * 1.2);
          panX = cx - ((cx - panX) * newZoom) / zoom;
          panY = cy - ((cy - panY) * newZoom) / zoom;
          zoom = newZoom;
        }}
        title="Zoom in">+</button
      >
      <button
        class="graph-btn"
        type="button"
        onclick={() => {
          const cx = width / 2,
            cy = height / 2;
          const newZoom = Math.max(0.05, zoom * 0.8);
          panX = cx - ((cx - panX) * newZoom) / zoom;
          panY = cy - ((cy - panY) * newZoom) / zoom;
          zoom = newZoom;
        }}
        title="Zoom out">−</button
      >
      <button
        class="graph-btn"
        type="button"
        onclick={() => {
          applyFitToView();
        }}
        title="Fit to view">Fit</button
      >
      <button
        class="graph-btn"
        class:active={showMinimap}
        type="button"
        onclick={() => {
          showMinimap = !showMinimap;
        }}
        title="Toggle minimap">Map</button
      >
      <button
        class="graph-btn"
        type="button"
        onclick={() => {
          setActiveHub('right', 'graph', 'graph-config');
        }}>Config</button
      >
    </div>
  </div>
  <div class="graph-canvas-wrap" bind:this={wrapEl}>
    {#if nodes.length === 0}
      <div class="graph-empty">
        <p>No notes in vault</p>
        <p class="graph-hint">Open a vault to see the knowledge graph</p>
      </div>
    {:else if viewMode === '2d'}
      <canvas
        bind:this={canvasEl}
        style="width:{width}px;height:{height}px"
        onwheel={handleWheel}
        onmousemove={handleMouseMove}
        onmousedown={handleMouseDown}
        onmouseup={handleMouseUp}
        onmouseleave={handleMouseUp}
      ></canvas>
      {#if showMinimap && nodes.length > 0}
        <CanvasMinimap
          items={nodes}
          worldBounds={mmBounds}
          {panX}
          {panY}
          {zoom}
          viewportWidth={width}
          viewportHeight={height}
          highlightIds={matchedNodeIds}
        />
      {/if}
    {:else}
      <Graph3D
        {nodes}
        {edges}
        {physics}
        nodeColor={graphSettings.nodeColor}
        edgeColor={graphSettings.edgeColor}
        edgeOpacity={graphSettings.edgeOpacity}
        nodeRadius={NODE_RADIUS}
      />
    {/if}
  </div>
  {#if hoveredNode}
    <div class="graph-tooltip">
      <span class="graph-tooltip-label">{hoveredNode.label}</span>
      <span class="graph-tooltip-conns">{connectionCounts[hoveredNode.id] ?? 0} connections</span>
    </div>
  {/if}
</div>
