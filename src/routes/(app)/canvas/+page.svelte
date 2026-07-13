<script lang="ts">
  import './+page.css';
  import { onMount } from 'svelte';
  import { SWATCH_COLORS } from '@/constants/colors';
  import { pageTitle, SITE_URL } from '@/constants/seo';
  import CanvasAlignBar from '@/hubs/canvas/components/CanvasAlignBar.svelte';
  import CanvasCardRenderer from '@/hubs/canvas/components/CanvasCardRenderer.svelte';
  import CanvasContextMenu from '@/hubs/canvas/components/CanvasContextMenu.svelte';
  import CanvasOverlays from '@/hubs/canvas/components/CanvasOverlays.svelte';
  import CanvasGridOverlay from '@/hubs/canvas/components/CanvasGridOverlay.svelte';
  import CanvasToolbar from '@/hubs/canvas/components/CanvasToolbar.svelte';
  import SelectionOverlay from '@/hubs/canvas/components/SelectionOverlay.svelte';
  import {
    computePath,
    getAnchorPoint,
    getPathMidpoint,
    type Point,
  } from '@/hubs/canvas/services/canvas-connections';
  import {
    canvasNameFromPath,
    createCanvasFile,
    deleteCanvasFile,
    getCanvasList,
  } from '@/hubs/canvas/services/canvas-file-service';
  import { goto } from '$app/navigation';
  import { DEFAULT_GRID, type GridConfig } from '@/hubs/canvas/services/canvas-grid';
  import type { BoundingBox } from '@/hubs/canvas/services/canvas-math';
  import {
    addElement,
    clearSelection,
    deleteElements,
    getActiveCanvasPath,
    getConnections,
    getElementById,
    getSelectedIds,
    getSortedElements,
    getZoom,
    isSelected,
    openCanvas,
    selectElement,
    setZoom,
    updateElement,
  } from '@/hubs/canvas/stores/canvas-store.svelte';
  import {
    getToolMode,
    isConnectMode,
    isDrawingMode,
  } from '@/hubs/canvas/stores/canvas-tool-store.svelte';
  import type { CanvasElement } from '@/hubs/canvas/types/canvas-types';
  import { createCard, createFrame } from '@/hubs/canvas/types/canvas-types';
  import { vectorPathToSVG } from '@/hubs/canvas/services/canvas-vector';
  import { MetaTags } from 'svelte-meta-tags';
  import type { Snapshot } from './$types';
  import {
    createKeyHandler,
    doMarqueeSelect,
    elTransform,
    finishDraw,
    focusOnSelected,
    getViewport,
    handleConnectDown as doConnectDown,
    handleConnectMove as doConnectMove,
    handleConnectUp as doConnectUp,
    worldFromEvent,
  } from '@/hubs/canvas/services/canvas-page-utils';

  let { data } = $props();

  export const snapshot: Snapshot<{ panX: number; panY: number }> = {
    capture: () => ({ panX, panY }),
    restore: (snap) => {
      panX = snap.panX;
      panY = snap.panY;
    },
  };

  let cardNum = 0;
  let panX = $state(0);
  let panY = $state(0);
  let isPanning = $state(false);
  let panStart = { x: 0, y: 0 };
  let dragging: CanvasElement | null = $state(null);
  let dragOffset = { x: 0, y: 0 };
  let marquee: BoundingBox | null = $state(null);
  let marqueeStart = { x: 0, y: 0 };
  let drawStart: { x: number; y: number } | null = $state(null);
  let drawPreview: BoundingBox | null = $state(null);

  let toolMode = $derived(getToolMode());
  let drawing = $derived(isDrawingMode());
  let connecting = $derived(isConnectMode());
  let sortedEls = $derived(getSortedElements());
  let selectedIds = $derived(getSelectedIds());
  let zoom = $derived(getZoom());
  let visibleEls = $derived(sortedEls.filter((e) => !e.locked || isSelected(e.id)));
  let conns = $derived(getConnections());
  let grid = $state<GridConfig>({ ...DEFAULT_GRID });
  let activePath = $derived(getActiveCanvasPath());
  let canvasName = $derived(activePath ? canvasNameFromPath(activePath) : 'Untitled');

  let ctxMenu: {
    x: number;
    y: number;
    worldX: number;
    worldY: number;
    el: CanvasElement | null;
  } | null = $state(null);
  let connectSource: { elId: string; point: Point } | null = $state(null);
  let connectPreview: Point | null = $state(null);

  let frameNum = 0;

  function addNewCard() {
    const cx = (-panX + 400) / zoom,
      cy = (-panY + 300) / zoom;
    const card = createCard({
      x: cx + Math.random() * 100 - 50,
      y: cy + Math.random() * 100 - 50,
      width: 180,
      height: 120,
      title: `Card ${++cardNum}`,
      color: SWATCH_COLORS[cardNum % SWATCH_COLORS.length],
    });
    addElement(card);
    selectElement(card.id);
  }

  function addNewFrame() {
    const cx = (-panX + 400) / zoom,
      cy = (-panY + 300) / zoom;
    const frame = createFrame({
      x: cx + Math.random() * 60 - 30,
      y: cy + Math.random() * 60 - 30,
      label: `Frame ${++frameNum}`,
    });
    addElement(frame);
    selectElement(frame.id);
  }

  async function safeConfirm(message: string): Promise<boolean> {
    try {
      const { confirm } = await import('@tauri-apps/plugin-dialog');
      return await confirm(message, { title: 'Bismuth', kind: 'warning' });
    } catch {
      return window.confirm(message);
    }
  }

  async function deleteCurrentCanvas() {
    if (!activePath) return;
    const ok = await safeConfirm(`Delete canvas "${canvasName}"? This cannot be undone.`);
    if (!ok) return;
    await deleteCanvasFile(activePath);
    const remaining = getCanvasList();
    if (remaining.length > 0) {
      openCanvas(remaining[0].path);
    } else {
      goto('/');
    }
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom * delta));
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mx = e.clientX - rect.left,
      my = e.clientY - rect.top;
    panX = mx - ((mx - panX) * newZoom) / zoom;
    panY = my - ((my - panY) * newZoom) / zoom;
    setZoom(newZoom);
  }

  function handlePointerDown(e: PointerEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('.canvas-el') || target.closest('.handle')) return;
    const w = worldFromEvent(e, e.currentTarget as HTMLElement, panX, panY, zoom);
    if (drawing) {
      drawStart = w;
      drawPreview = { ...w, width: 0, height: 0 };
      return;
    }
    if (toolMode === 'pan' || !(e.shiftKey || e.metaKey)) {
      isPanning = true;
      panStart = { x: e.clientX - panX, y: e.clientY - panY };
      if (toolMode !== 'pan') clearSelection();
      return;
    }
    marqueeStart = w;
    marquee = { ...w, width: 0, height: 0 };
  }

  function handlePointerMove(e: PointerEvent) {
    if (connectSource) {
      connectPreview = doConnectMove(e, panX, panY, zoom);
      return;
    }
    if (drawStart && drawPreview) {
      const vp = getViewport();
      if (!vp) return;
      const w = worldFromEvent(e, vp, panX, panY, zoom);
      drawPreview = {
        x: Math.min(drawStart.x, w.x),
        y: Math.min(drawStart.y, w.y),
        width: Math.abs(w.x - drawStart.x),
        height: Math.abs(w.y - drawStart.y),
      };
      return;
    }
    if (marquee) {
      const vp = getViewport();
      if (!vp) return;
      const w = worldFromEvent(e, vp, panX, panY, zoom);
      marquee = {
        x: Math.min(marqueeStart.x, w.x),
        y: Math.min(marqueeStart.y, w.y),
        width: Math.abs(w.x - marqueeStart.x),
        height: Math.abs(w.y - marqueeStart.y),
      };
      return;
    }
    if (isPanning) {
      panX = e.clientX - panStart.x;
      panY = e.clientY - panStart.y;
      return;
    }
    if (dragging) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const nx = (e.clientX - rect.left - panX) / zoom - dragOffset.x;
      const ny = (e.clientY - rect.top - panY) / zoom - dragOffset.y;
      updateElement(dragging.id, { x: nx, y: ny } as Partial<CanvasElement>);
      dragging = { ...dragging, x: nx, y: ny } as CanvasElement;
    }
  }

  function handlePointerUp(e: PointerEvent) {
    if (connectSource) {
      doConnectUp(e, connectSource, sortedEls, panX, panY, zoom);
      connectSource = null;
      connectPreview = null;
      return;
    }
    if (drawStart && drawPreview) {
      finishDraw(drawPreview, toolMode);
      drawStart = null;
      drawPreview = null;
      return;
    }
    if (marquee) {
      doMarqueeSelect(sortedEls, marquee);
      marquee = null;
      return;
    }
    isPanning = false;
    dragging = null;
  }

  function handleElDown(e: PointerEvent, el: CanvasElement) {
    if (el.locked) return;
    e.stopPropagation();
    dragging = el;
    selectElement(el.id, e.shiftKey || e.metaKey);
    const rect = (e.currentTarget as HTMLElement)
      .closest('.canvas-viewport')!
      .getBoundingClientRect();
    dragOffset.x = (e.clientX - rect.left - panX) / zoom - el.x;
    dragOffset.y = (e.clientY - rect.top - panY) / zoom - el.y;
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    const w = worldFromEvent(e, e.currentTarget as HTMLElement, panX, panY, zoom);
    const elDiv = (e.target as HTMLElement).closest('.canvas-el');
    let targetEl: CanvasElement | null = null;
    if (elDiv) {
      const elId = elDiv.getAttribute('data-el-id');
      if (elId) targetEl = getElementById(elId) ?? null;
    }
    if (targetEl && !isSelected(targetEl.id)) selectElement(targetEl.id);
    ctxMenu = { x: e.clientX, y: e.clientY, worldX: w.x, worldY: w.y, el: targetEl };
  }

  function handleConnectDown(e: PointerEvent, el: CanvasElement) {
    if (!connecting) return;
    const result = doConnectDown(e, el, panX, panY, zoom);
    if (result) {
      connectSource = result.source;
      connectPreview = result.preview;
    }
  }

  function toggleGrid() {
    grid = { ...grid, enabled: !grid.enabled };
  }

  function doFocus() {
    const r = focusOnSelected();
    if (r) {
      panX = r.panX;
      panY = r.panY;
    }
  }

  const handleKeyDown = createKeyHandler({
    clearCtxMenu: () => {
      ctxMenu = null;
    },
    toggleGrid,
    doFocus,
  });

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    if (!getActiveCanvasPath()) {
      createCanvasFile('Untitled')
        .then((entry) => openCanvas(entry.path))
        .catch(() => {});
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<MetaTags
  title={pageTitle(data.title ?? 'Canvas')}
  description={data.description ??
    'Freeform visual workspace for spatial note arrangement and brainstorming.'}
  canonical="{SITE_URL}/canvas"
  openGraph={{
    url: `${SITE_URL}/canvas`,
    title: pageTitle(data.title ?? 'Canvas'),
    description: data.description ?? '',
  }}
/>

<div class="canvas-page">
  <div class="canvas-toolbar">
    <span class="canvas-label">{canvasName}</span>
    <CanvasToolbar />
    <CanvasAlignBar />
    <button class="canvas-btn" onclick={addNewCard}>+ Card</button>
    <button class="canvas-btn" onclick={addNewFrame}>+ Frame</button>
    <button
      class="canvas-btn"
      onclick={() => {
        if (selectedIds.length > 0) deleteElements(selectedIds);
      }}
      disabled={selectedIds.length === 0}>Delete</button
    >
    <button
      class="canvas-btn canvas-btn-danger"
      onclick={deleteCurrentCanvas}
      title="Delete this canvas file">Delete Canvas</button
    >
    <button
      class="canvas-btn"
      onclick={focusOnSelected}
      disabled={selectedIds.length === 0}
      title="Focus on selected (F)">Focus</button
    >
    <button
      class="canvas-btn"
      class:active={grid.enabled}
      onclick={toggleGrid}
      title="Toggle Grid (⌘')">#</button
    >
    <span class="canvas-zoom">{Math.round(zoom * 100)}%</span>
  </div>
  <div
    class="canvas-viewport"
    onwheel={handleWheel}
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointerleave={handlePointerUp}
    oncontextmenu={handleContextMenu}
    role="application"
    aria-label="Infinite canvas"
  >
    <CanvasGridOverlay {grid} {panX} {panY} {zoom} />
    <div class="canvas-world" style="transform: translate({panX}px, {panY}px) scale({zoom})">
      <svg class="svg-layer" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker
            id="arrow-end"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
            ><polygon points="0 0, 10 3.5, 0 7" fill="var(--color-text-muted)" /></marker
          >
          <marker id="circle-end" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"
            ><circle cx="3" cy="3" r="2.5" fill="var(--color-text-muted)" /></marker
          >
          <marker
            id="diamond-end"
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="5"
            orient="auto"
            ><polygon points="5 0, 10 5, 5 10, 0 5" fill="var(--color-text-muted)" /></marker
          >
        </defs>
        {#each conns as conn (conn.id)}
          {@const srcEl = getElementById(conn.sourceId)}
          {@const tgtEl = getElementById(conn.targetId)}
          {#if srcEl && tgtEl}
            {@const start = getAnchorPoint(srcEl, conn.sourceAnchor)}
            {@const end = getAnchorPoint(tgtEl, conn.targetAnchor)}
            {@const d = computePath(start, end, conn.routing, conn.sourceAnchor, conn.targetAnchor)}
            {@const mid = getPathMidpoint(start, end)}
            <path
              {d}
              fill="none"
              stroke={conn.strokeColor}
              stroke-width={conn.strokeWidth}
              stroke-dasharray={conn.strokeDash.length ? conn.strokeDash.join(' ') : undefined}
              marker-start={conn.startMarker !== 'none'
                ? `url(#${conn.startMarker}-end)`
                : undefined}
              marker-end={conn.endMarker !== 'none' ? `url(#${conn.endMarker}-end)` : undefined}
            />
            {#if conn.label}
              <text
                x={mid.x}
                y={mid.y - 6}
                text-anchor="middle"
                fill="var(--color-text)"
                font-size="11">{conn.label}</text
              >
            {/if}
          {/if}
        {/each}
        {#each visibleEls as el (el.id)}
          {#if el.kind === 'vector'}
            <path
              class="canvas-el svg-el"
              class:selected={isSelected(el.id)}
              data-el-id={el.id}
              d={vectorPathToSVG(el.paths.flat())}
              fill={el.fill.opacity > 0 ? el.fill.color : 'none'}
              fill-opacity={el.fill.opacity}
              fill-rule={el.windingRule}
              stroke={el.stroke.width > 0 ? el.stroke.color : 'none'}
              stroke-width={el.stroke.width}
              transform="translate({el.x} {el.y}) rotate({el.rotation} {el.width / 2} {el.height /
                2})"
              opacity={el.opacity}
              onpointerdown={(e) => (connecting ? handleConnectDown(e, el) : handleElDown(e, el))}
              role="button"
              tabindex="0"
            />
          {:else if el.kind === 'rect'}
            <rect
              class="canvas-el svg-el"
              class:selected={isSelected(el.id)}
              data-el-id={el.id}
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              rx={el.cornerRadius}
              fill={el.fill.opacity > 0 ? el.fill.color : 'none'}
              fill-opacity={el.fill.opacity}
              stroke={el.stroke.width > 0 ? el.stroke.color : 'none'}
              stroke-width={el.stroke.width}
              stroke-dasharray={el.stroke.dash.length ? el.stroke.dash.join(' ') : undefined}
              transform="rotate({el.rotation} {el.x + el.width / 2} {el.y + el.height / 2})"
              opacity={el.opacity}
              onpointerdown={(e) => (connecting ? handleConnectDown(e, el) : handleElDown(e, el))}
              role="button"
              tabindex="0"
            />
          {:else if el.kind === 'ellipse'}
            <ellipse
              class="canvas-el svg-el"
              class:selected={isSelected(el.id)}
              data-el-id={el.id}
              cx={el.x + el.width / 2}
              cy={el.y + el.height / 2}
              rx={el.width / 2}
              ry={el.height / 2}
              fill={el.fill.opacity > 0 ? el.fill.color : 'none'}
              fill-opacity={el.fill.opacity}
              stroke={el.stroke.width > 0 ? el.stroke.color : 'none'}
              stroke-width={el.stroke.width}
              opacity={el.opacity}
              onpointerdown={(e) => (connecting ? handleConnectDown(e, el) : handleElDown(e, el))}
              role="button"
              tabindex="0"
            />
          {:else if el.kind === 'line'}
            <line
              class="canvas-el svg-el"
              class:selected={isSelected(el.id)}
              data-el-id={el.id}
              x1={el.x}
              y1={el.y}
              x2={el.x2}
              y2={el.y2}
              stroke={el.stroke.color}
              stroke-width={Math.max(el.stroke.width, 2)}
              opacity={el.opacity}
              onpointerdown={(e) => (connecting ? handleConnectDown(e, el) : handleElDown(e, el))}
              role="button"
              tabindex="0"
            />
          {/if}
        {/each}
      </svg>

      {#each visibleEls as el (el.id)}
        {#if el.kind === 'frame' || el.kind === 'component'}
          <div
            class="canvas-el canvas-frame"
            class:selected={isSelected(el.id)}
            class:component={el.kind === 'component'}
            data-el-id={el.id}
            style="transform: {elTransform(
              el
            )}; width: {el.width}px; height: {el.height}px; border-radius: {el.cornerRadius}px; background: {el
              .fill.opacity > 0
              ? el.fill.color
              : 'transparent'}; border-color: {el.stroke.width > 0
              ? el.stroke.color
              : 'transparent'}; border-width: {el.stroke
              .width}px; opacity: {el.opacity}; {el.clipContent
              ? 'overflow: hidden;'
              : 'overflow: visible;'}"
            onpointerdown={(e) => (connecting ? handleConnectDown(e, el) : handleElDown(e, el))}
            role="button"
            tabindex="0"
          >
            <span class="frame-label">{el.label}</span>
          </div>
        {:else if el.kind === 'instance'}
          <div
            class="canvas-el canvas-frame instance"
            class:selected={isSelected(el.id)}
            data-el-id={el.id}
            style="transform: {elTransform(
              el
            )}; width: {el.width}px; height: {el.height}px; opacity: {el.opacity}"
            onpointerdown={(e) => (connecting ? handleConnectDown(e, el) : handleElDown(e, el))}
            role="button"
            tabindex="0"
          >
            <span class="frame-label">⬦ {el.name || 'Instance'}</span>
          </div>
        {:else if el.kind === 'card' || el.kind === 'note'}
          <div
            class="canvas-el canvas-card"
            class:selected={isSelected(el.id)}
            data-el-id={el.id}
            style="transform: {elTransform(
              el
            )}; width: {el.width}px; min-height: {el.height}px; border-color: {el.color}; opacity: {el.opacity}"
            onpointerdown={(e) => (connecting ? handleConnectDown(e, el) : handleElDown(e, el))}
            role="button"
            tabindex="0"
          >
            <CanvasCardRenderer
              title={el.title}
              content={el.content}
              color={el.color}
              notePath={el.kind === 'note' ? el.notePath : undefined}
              onTitleChange={(v) => updateElement(el.id, { title: v } as Partial<CanvasElement>)}
              onContentChange={(v) =>
                updateElement(el.id, { content: v } as Partial<CanvasElement>)}
            />
          </div>
        {:else if el.kind === 'text'}
          <div
            class="canvas-el canvas-text"
            class:selected={isSelected(el.id)}
            data-el-id={el.id}
            style="transform: {elTransform(
              el
            )}; width: {el.width}px; min-height: {el.height}px; font-size: {el.fontSize}px; font-weight: {el.fontWeight}; color: {el.textColor}; text-align: {el.textAlign}; line-height: {el.lineHeight}; opacity: {el.opacity}"
            onpointerdown={(e) => (connecting ? handleConnectDown(e, el) : handleElDown(e, el))}
            role="button"
            tabindex="0"
            contenteditable="true"
            oninput={(e) =>
              updateElement(el.id, {
                text: (e.currentTarget as HTMLElement).textContent ?? '',
              } as Partial<CanvasElement>)}
          >
            {el.text}
          </div>
        {:else if el.kind === 'image' && el.src}
          <img
            class="canvas-el canvas-img"
            class:selected={isSelected(el.id)}
            data-el-id={el.id}
            src={el.src}
            alt={el.name}
            style="transform: {elTransform(
              el
            )}; width: {el.width}px; height: {el.height}px; object-fit: {el.fit}; opacity: {el.opacity}"
            onpointerdown={(e) => (connecting ? handleConnectDown(e, el) : handleElDown(e, el))}
            draggable="false"
          />
        {/if}
      {/each}

      <SelectionOverlay />

      <CanvasOverlays
        {drawPreview}
        {drawStart}
        {connectSource}
        {connectPreview}
        {marquee}
        {zoom}
        {toolMode}
      />
    </div>

    {#if sortedEls.length === 0}
      <div class="canvas-empty">
        <p>Empty canvas</p>
        <p class="canvas-hint">Click "+ Add Card" to get started</p>
      </div>
    {/if}
  </div>

  {#if ctxMenu}
    <CanvasContextMenu
      x={ctxMenu.x}
      y={ctxMenu.y}
      worldX={ctxMenu.worldX}
      worldY={ctxMenu.worldY}
      targetEl={ctxMenu.el}
      onclose={() => {
        ctxMenu = null;
      }}
    />
  {/if}
</div>
