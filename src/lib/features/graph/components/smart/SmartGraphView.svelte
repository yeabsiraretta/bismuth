<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import SmartGraphSettingsPanel from './SmartGraphSettings.svelte';
  import type { SmartGraphSettings, GraphEdge } from '../../types';
  import { type SimNode, initNodes, tickForces } from '../../utils/simulation';
  import {
    DEFAULT_SMART_SETTINGS,
    getSmartConnections,
    buildSmartGraph,
    getRelevanceDistance,
    getNoteExcerpt,
  } from '../../services/smartConnections';
  import { renderSmartGraph, renderPreviewTooltip } from './smartGraphRendering';
  import {
    createRenderState,
    resolveGraphColors,
    screenToGraph,
    handleGraphMouseDown,
    handleGraphMouseMove,
    handleGraphMouseUp,
    handleGraphWheel,
    type GraphRenderState,
    type GraphColors,
  } from '../view/graphViewRendering';
  import { activeNote } from '@/stores/vault/vault';
  import { openNote as navOpenNote } from '@/appNavigation';
  import { hitTestNode } from '../../utils/simulation';
  import { log } from '@/utils/logger';

  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  let width = 800;
  let height = 600;
  let settingsOpen = false;
  let smartSettings: SmartGraphSettings = { ...DEFAULT_SMART_SETTINGS };
  let rState: GraphRenderState = createRenderState();
  let graphColors: GraphColors | undefined;

  let nodes: SimNode[] = [];
  let edges: GraphEdge[] = [];
  let centerNodeId = '';
  let loading = false;
  let animFrame = 0;
  let modKeyDown = false;
  let previewText = '';
  let previewScreenX = 0;
  let previewScreenY = 0;

  const graphSettings = {
    showTags: false,
    showAttachments: true,
    showOrphans: false,
    showArrows: false,
    showLabels: true,
    textFadeThreshold: 0.3,
    nodeSize: 1.0,
    linkThickness: 1,
    centerForce: 0.08,
    repelForce: 250,
    linkForce: 0.2,
    linkDistance: 140,
    animate: true,
    damping: 0.85,
    collisionRadius: 22,
  };

  function doRender() {
    if (!ctx || !canvasEl) return;
    graphColors = graphColors ?? resolveGraphColors(canvasEl);
    renderSmartGraph(
      ctx,
      nodes,
      edges,
      centerNodeId,
      smartSettings,
      rState,
      width,
      height,
      graphColors
    );
    if (modKeyDown && previewText && rState.hoveredNode) {
      renderPreviewTooltip(ctx, previewText, previewScreenX, previewScreenY, width);
    }
  }

  async function loadConnections() {
    const note = $activeNote;
    if (!note?.path) return;
    loading = true;
    centerNodeId = note.path;
    try {
      const conns = await getSmartConnections(note.path, 25, smartSettings.connectionMode);
      const graph = buildSmartGraph(note.path, note.title, conns, smartSettings);

      // Apply relevance-based link distances to the simulation settings
      const edgesWithDist = graph.edges.map((e) => ({
        ...e,
        _idealDist: getRelevanceDistance(e.relevance ?? 0.5, graphSettings.linkDistance),
      }));

      nodes = initNodes(graph.nodes, edgesWithDist, width, height, [], true);
      edges = edgesWithDist;

      // Warmup
      for (let i = 0; i < 60; i++) tickForces(nodes, edges, graphSettings, width, height);
      // Center on center node
      const cn = nodes.find((n) => n.id === centerNodeId);
      if (cn) {
        rState = { ...rState, offsetX: width / 2 - cn.x, offsetY: height / 2 - cn.y };
      }
      startAnimation();
    } catch (err) {
      log.warn('Failed to load smart connections', { error: String(err) });
    }
    loading = false;
    doRender();
  }

  function startAnimation() {
    cancelAnimationFrame(animFrame);
    function loop() {
      tickForces(nodes, edges, graphSettings, width, height);
      doRender();
      if (graphSettings.animate) animFrame = requestAnimationFrame(loop);
    }
    loop();
  }

  // ── Event handlers ──
  function onMouseDown(e: MouseEvent) {
    rState = handleGraphMouseDown(e, canvasEl, nodes, rState);
    doRender();
  }
  function onMouseMove(e: MouseEvent) {
    rState = handleGraphMouseMove(e, canvasEl, nodes, rState);
    if (rState.hoveredNode && modKeyDown && smartSettings.showPreviewOnHover) {
      previewText = getNoteExcerpt(rState.hoveredNode, 300);
      const rect = canvasEl.getBoundingClientRect();
      previewScreenX = e.clientX - rect.left;
      previewScreenY = e.clientY - rect.top;
    } else {
      previewText = '';
    }
    doRender();
  }
  function onMouseUp() {
    rState = handleGraphMouseUp(rState);
  }
  function onWheel(e: WheelEvent) {
    rState = handleGraphWheel(e, rState);
    doRender();
  }
  function onClick(e: MouseEvent) {
    const { x, y } = screenToGraph(e, canvasEl, rState);
    const node = hitTestNode(nodes, x, y);
    if (node && node.id !== centerNodeId) {
      navOpenNote(node.id);
    }
  }
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Meta' || e.key === 'Control') {
      modKeyDown = true;
      doRender();
    }
  }
  function onKeyUp(e: KeyboardEvent) {
    if (e.key === 'Meta' || e.key === 'Control') {
      modKeyDown = false;
      previewText = '';
      doRender();
    }
  }

  function handleResize() {
    if (!canvasEl) return;
    width = canvasEl.parentElement?.clientWidth || 800;
    height = canvasEl.parentElement?.clientHeight || 600;
    canvasEl.width = width;
    canvasEl.height = height;
    doRender();
  }

  $: if ($activeNote?.path && $activeNote.path !== centerNodeId && canvasEl) loadConnections();
  $: if (smartSettings && nodes.length > 0) doRender();

  onMount(() => {
    ctx = canvasEl.getContext('2d');
    handleResize();
    loadConnections();
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  });

  onDestroy(() => {
    cancelAnimationFrame(animFrame);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  });
</script>

<div class="smart-graph-view">
  <div class="sg-header-bar">
    <div class="sg-title">
      <Icon name="zap" size={14} />
      <span>Smart Connections</span>
    </div>
    <div class="sg-actions">
      <button class="sg-btn" on:click={loadConnections} title="Refresh connections">
        <Icon name="refresh-cw" size={13} />
      </button>
      <button
        class="sg-btn"
        class:active={settingsOpen}
        on:click={() => (settingsOpen = !settingsOpen)}
        title="Settings"
      >
        <Icon name="settings" size={13} />
      </button>
    </div>
  </div>

  <div class="sg-canvas-wrap">
    {#if loading}
      <div class="sg-loading">Finding connections...</div>
    {/if}
    <canvas
      bind:this={canvasEl}
      on:mousedown={onMouseDown}
      on:mousemove={onMouseMove}
      on:mouseup={onMouseUp}
      on:wheel={onWheel}
      on:click={onClick}
      {width}
      {height}
    ></canvas>

    {#if rState.hoveredNode}
      <div class="sg-tooltip-hint">
        {#if !modKeyDown}
          Hold <kbd>{navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}</kbd> to preview
        {/if}
      </div>
    {/if}

    {#if settingsOpen}
      <div class="sg-settings-panel">
        <div class="sg-settings-header">
          <span>Settings</span>
          <button class="sg-close" on:click={() => (settingsOpen = false)}
            ><Icon name="x" size={13} /></button
          >
        </div>
        <SmartGraphSettingsPanel bind:settings={smartSettings} />
      </div>
    {/if}

    {#if nodes.length === 0 && !loading}
      <div class="sg-empty">
        <Icon name="zap" size={28} color="var(--text-faint)" />
        <p>Select a note to visualize its connections</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .smart-graph-view {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--graph-bg, #1a1a2e);
  }
  .sg-header-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    border-bottom: 1px solid var(--graph-border, var(--border-color));
    background: var(--graph-surface, rgba(30, 30, 50, 0.5));
    flex-shrink: 0;
  }
  .sg-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--graph-text-active, var(--text-normal));
  }
  .sg-actions {
    display: flex;
    gap: 4px;
  }
  .sg-btn {
    display: flex;
    align-items: center;
    padding: 4px 6px;
    background: none;
    border: 1px solid var(--graph-border, var(--border-color));
    border-radius: var(--radius-s);
    color: var(--graph-text, var(--text-muted));
    cursor: pointer;
  }
  .sg-btn:hover {
    background: var(--graph-surface-hover);
    color: var(--graph-text-active);
  }
  .sg-btn.active {
    background: color-mix(in srgb, var(--interactive-accent, #4a9eff) 20%, transparent);
    border-color: var(--interactive-accent, #4a9eff);
    color: var(--interactive-accent, #4a9eff);
  }
  .sg-canvas-wrap {
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
  .sg-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.8rem;
    color: var(--graph-text, var(--text-muted));
    z-index: 5;
  }
  .sg-empty {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: var(--text-faint);
  }
  .sg-empty p {
    margin: 0;
    font-size: 0.8rem;
  }
  .sg-tooltip-hint {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.7rem;
    color: var(--graph-text, var(--text-faint));
    background: rgba(0, 0, 0, 0.5);
    padding: 3px 8px;
    border-radius: 4px;
    pointer-events: none;
  }
  .sg-tooltip-hint kbd {
    background: rgba(255, 255, 255, 0.15);
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 0.65rem;
  }
  .sg-settings-panel {
    position: absolute;
    top: 8px;
    right: 8px;
    bottom: 48px;
    width: 260px;
    background: var(--graph-surface, rgba(30, 30, 50, 0.95));
    border: 1px solid var(--graph-border, var(--border-color));
    border-radius: var(--radius-m);
    backdrop-filter: blur(12px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    z-index: 10;
  }
  .sg-settings-panel > :global(:last-child) {
    flex: 1;
    overflow-y: auto;
  }
  .sg-settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--graph-border, var(--border-color));
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--graph-text-active);
    flex-shrink: 0;
  }
  .sg-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--graph-text);
    cursor: pointer;
  }
  .sg-close:hover {
    background: var(--graph-surface-hover);
    color: var(--graph-text-active);
  }
</style>
