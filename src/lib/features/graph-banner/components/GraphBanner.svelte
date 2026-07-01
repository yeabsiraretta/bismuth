<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { activeNote } from '@/stores/vault/vault';
  import { openNote } from '@/appNavigation';
  import Icon from '@/components/icons/Icon.svelte';
  import { getGraphData, filterGraphData, initNodes, tickForces, hitTestNode } from '@/features/graph';
  import type { GraphData, GraphEdge, GraphSettings } from '@/features/graph';
  import { graphBannerConfig, toggleGraphBanner, setGraphBannerDepth } from '../stores/graphBannerStore';

  type SimNode = ReturnType<typeof initNodes>[number];

  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  let nodes: SimNode[] = [];
  let edges: GraphEdge[] = [];
  let graphData: GraphData = { nodes: [], edges: [] };
  let hoveredNode: string | null = null;
  let width = 400;
  let animFrame = 0;
  let loadedForPath = '';

  $: height = $graphBannerConfig.height;
  $: depth = $graphBannerConfig.depth;

  // Reload when the active note changes
  $: if ($activeNote?.path && $activeNote.path !== loadedForPath) {
    loadedForPath = $activeNote.path;
    loadBannerGraph($activeNote.path);
  }

  function buildSettings(): GraphSettings {
    return {
      showTags: $graphBannerConfig.showTags,
      showAttachments: $graphBannerConfig.showAttachments,
      showOrphans: false,
      showArrows: false,
      showLabels: $graphBannerConfig.showLabels,
      textFadeThreshold: 0.4,
      nodeSize: $graphBannerConfig.nodeSize,
      linkThickness: $graphBannerConfig.linkThickness,
      centerForce: 0.1,
      repelForce: 120,
      linkForce: 0.3,
      linkDistance: 60,
      animate: false,
      damping: 0.9,
      collisionRadius: 8,
    };
  }

  async function loadBannerGraph(notePath: string) {
    try {
      graphData = await getGraphData();
    } catch { return; }

    const filtered = filterGraphData(graphData, {
      showOrphans: false,
      isLocal: true,
      centerNode: notePath,
      depth,
      hiddenTags: new Set(),
    });

    const settings = buildSettings();
    nodes = initNodes(filtered.nodes, filtered.edges, width, height, [], false);
    edges = filtered.edges;

    // Warmup simulation
    for (let i = 0; i < 80; i++) tickForces(nodes, edges, settings, width, height);

    // Highlight center node
    const center = nodes.find(n => n.id === notePath);
    if (center) { center.x = width / 2; center.y = height / 2; }

    render();
  }

  function render() {
    if (!ctx || !canvasEl) return;
    const dpr = window.devicePixelRatio || 1;
    canvasEl.width = width * dpr;
    canvasEl.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background
    const style = getComputedStyle(canvasEl);
    const bg = style.getPropertyValue('--graph-banner-bg').trim() || 'var(--background-secondary)';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const settings = buildSettings();

    // Edges
    ctx.globalAlpha = 0.3;
    for (const edge of edges) {
      const src = nodeMap.get(edge.from);
      const tgt = nodeMap.get(edge.to);
      if (!src || !tgt) continue;
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = style.getPropertyValue('--graph-edge').trim() || '#5a5a7a';
      ctx.lineWidth = settings.linkThickness;
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // Nodes
    const isCenter = $activeNote?.path || '';
    for (const node of nodes) {
      const isHovered = hoveredNode === node.id;
      const isCenterNode = node.id === isCenter;
      const radius = (settings.nodeSize + (node.connection_count || 0) * 0.3) * (isHovered ? 1.5 : isCenterNode ? 1.3 : 1);

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isCenterNode ? '#4a9eff' : isHovered ? '#6bb6ff' : (
        node.node_type === 'tag' ? '#7c3aed' : '#9ca3af'
      );
      ctx.fill();

      if (settings.showLabels && (isHovered || isCenterNode)) {
        ctx.fillStyle = isHovered || isCenterNode ? '#ffffff' : 'rgba(200,200,220,0.7)';
        ctx.font = '10px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(node.label, node.x, node.y + radius + 3);
      }
    }
  }

  function onMouseMove(e: MouseEvent) {
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = hitTestNode(nodes, x, y);
    const newHovered = node ? node.id : null;
    if (newHovered !== hoveredNode) {
      hoveredNode = newHovered;
      canvasEl.style.cursor = hoveredNode ? 'pointer' : 'default';
      render();
    }
  }

  function onClick(e: MouseEvent) {
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = hitTestNode(nodes, x, y);
    if (node && node.id !== $activeNote?.path) {
      openNote(node.id);
    }
  }

  function handleResize() {
    if (!canvasEl?.parentElement) return;
    width = canvasEl.parentElement.clientWidth;
    if (loadedForPath) loadBannerGraph(loadedForPath);
  }

  onMount(() => {
    ctx = canvasEl?.getContext('2d') ?? null;
    handleResize();
    window.addEventListener('resize', handleResize);
  });

  onDestroy(() => {
    if (animFrame) cancelAnimationFrame(animFrame);
    window.removeEventListener('resize', handleResize);
  });
</script>

<div class="graph-banner" style="height: {height}px">
  <canvas
    bind:this={canvasEl}
    style="width: 100%; height: {height}px"
    on:mousemove={onMouseMove}
    on:click={onClick}
  ></canvas>

  <div class="banner-controls">
    <button class="banner-btn" on:click={() => toggleGraphBanner()} title="Hide graph banner">
      <Icon name="eye-off" size={12} />
    </button>
    <div class="depth-control">
      <button class="banner-btn" on:click={() => setGraphBannerDepth(depth - 1)} title="Decrease depth" disabled={depth <= 1}>
        <Icon name="minus" size={12} />
      </button>
      <span class="depth-label">{depth}</span>
      <button class="banner-btn" on:click={() => setGraphBannerDepth(depth + 1)} title="Increase depth" disabled={depth >= 5}>
        <Icon name="plus" size={12} />
      </button>
    </div>
  </div>
</div>

<style>
  .graph-banner {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));
    background: var(--graph-banner-bg, var(--background-secondary, #16213e));
    flex-shrink: 0;
  }

  canvas {
    display: block;
  }

  .banner-controls {
    position: absolute;
    top: 6px;
    right: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: var(--radius-s, 4px);
    padding: 2px 4px;
    backdrop-filter: blur(6px);
  }

  .depth-control {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .depth-label {
    font-size: 10px;
    color: rgba(200, 200, 220, 0.8);
    min-width: 12px;
    text-align: center;
  }

  .banner-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    background: none;
    border: none;
    border-radius: var(--radius-s, 3px);
    color: rgba(200, 200, 220, 0.6);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .banner-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(200, 200, 220, 1);
  }

  .banner-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
</style>
