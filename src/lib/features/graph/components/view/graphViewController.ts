/**
 * Graph view controller — simulation lifecycle, event handlers, and data loading.
 * Extracted from GraphView.svelte for the 350-line limit.
 */

import { getGraphData } from '../../services/graph';
import type { GraphData, GraphNode, GraphEdge, GraphSettings } from '../../types';
import { hitTestNode } from '../../utils/simulation';
import { GraphLayoutWorker } from '../../workers/layoutWorkerManager';
import {
  createRenderState,
  renderGraph,
  resolveGraphColors,
  screenToGraph,
  handleGraphMouseDown,
  handleGraphMouseMove,
  handleGraphMouseUp,
  handleGraphWheel,
  handleGraphKeyDown,
  type GraphColors,
} from './graphViewRendering';
import {
  applyFilters,
  applyBackendLayout,
  runWarmupSimulation,
  runAnimationTick,
  computeCentreOffset,
  extractAvailableTypes,
  dispatchContextMenuAction,
  type SimNode,
} from './graphViewLogic';
import { log } from '@/utils/logger';

export type { SimNode, GraphColors };
export { createRenderState, screenToGraph };
export { hitTestNode };

export interface GraphFilterParams {
  searchQuery: string;
  showOrphans: boolean;
  isLocal: boolean;
  centerNode: string | null;
  depth: number;
  tags: string[];
  types: string[];
  folder: string;
  hiddenTags: Set<string>;
  width: number;
  height: number;
}

export interface GraphViewController {
  graphData: GraphData;
  nodes: SimNode[];
  edges: GraphEdge[];
  rState: ReturnType<typeof createRenderState>;
  graphColors: GraphColors | undefined;
  availableTags: string[];
  availableTypes: string[];
  layoutWorker: GraphLayoutWorker | null;
  animationFrame: number;
  initializing: boolean;
}

export function createController(): GraphViewController {
  return {
    graphData: { nodes: [], edges: [] },
    nodes: [],
    edges: [],
    rState: createRenderState(),
    graphColors: undefined,
    availableTags: [],
    availableTypes: [],
    layoutWorker: null,
    animationFrame: 0,
    initializing: false,
  };
}

export function render(
  ctx: CanvasRenderingContext2D | null,
  canvasEl: HTMLCanvasElement,
  ctrl: GraphViewController,
  settings: GraphSettings,
  colorGroups: Array<{ query: string; color: string }>,
  width: number,
  height: number,
): GraphViewController {
  if (!ctx) return ctrl;
  const graphColors = canvasEl ? resolveGraphColors(canvasEl) : ctrl.graphColors;
  renderGraph(ctx, ctrl.nodes, ctrl.edges, settings, colorGroups, ctrl.rState, width, height, graphColors);
  return { ...ctrl, graphColors };
}

export async function loadGraphData(
  ctx: CanvasRenderingContext2D | null,
  canvasEl: HTMLCanvasElement,
  ctrl: GraphViewController,
  settings: GraphSettings,
  colorGroups: Array<{ query: string; color: string }>,
  filterParams: GraphFilterParams,
  onUpdate: (ctrl: GraphViewController) => void,
): Promise<GraphViewController> {
  try {
    const graphData = await getGraphData();
    log.debug('Graph data loaded', { nodes: graphData.nodes.length, edges: graphData.edges.length });
    ctrl = { ...ctrl, graphData };
    return await initializeSimulation(ctx, canvasEl, ctrl, settings, colorGroups, filterParams, onUpdate);
  } catch (error) {
    log.error('Failed to load graph data', error);
    return ctrl;
  }
}

export async function initializeSimulation(
  ctx: CanvasRenderingContext2D | null,
  canvasEl: HTMLCanvasElement,
  ctrl: GraphViewController,
  settings: GraphSettings,
  colorGroups: Array<{ query: string; color: string }>,
  filterParams: GraphFilterParams,
  onUpdate: (ctrl: GraphViewController) => void,
): Promise<GraphViewController> {
  ctrl = { ...ctrl, initializing: true };
  // Use bloom=true so nodes start at center and animate outward
  const result = applyFilters(ctrl.graphData, filterParams, [], true);
  ctrl = { ...ctrl, nodes: result.nodes, edges: result.edges, availableTags: [], availableTypes: extractAvailableTypes(ctrl.graphData) };
  log.debug('Graph simulation init', { filteredNodes: ctrl.nodes.length, filteredEdges: ctrl.edges.length });

  try {
    const layoutNodes = await applyBackendLayout(ctrl.nodes, {
      centerForce: settings.centerForce, repelForce: settings.repelForce,
      linkForce: settings.linkForce, linkDistance: settings.linkDistance,
      width: filterParams.width, height: filterParams.height, nodeCount: ctrl.nodes.length,
    });
    const off = computeCentreOffset(layoutNodes, filterParams.width, filterParams.height);
    ctrl = { ...ctrl, nodes: layoutNodes, rState: { ...ctrl.rState, offsetX: off.offsetX, offsetY: off.offsetY }, initializing: false };
    ctrl = render(ctx, canvasEl, ctrl, settings, colorGroups, filterParams.width, filterParams.height);
    // Always auto-animate on first load for smooth entrance
    ctrl = startAnimationLoop(ctx, canvasEl, ctrl, settings, colorGroups, filterParams.width, filterParams.height, onUpdate);
  } catch {
    log.debug('Backend layout unavailable, running frontend simulation');
    ctrl = startWarmup(ctx, canvasEl, ctrl, settings, colorGroups, filterParams.width, filterParams.height, onUpdate);
    ctrl = { ...ctrl, initializing: false };
  }
  return ctrl;
}

export function startWarmup(
  ctx: CanvasRenderingContext2D | null,
  canvasEl: HTMLCanvasElement,
  ctrl: GraphViewController,
  settings: GraphSettings,
  colorGroups: Array<{ query: string; color: string }>,
  width: number,
  height: number,
  onUpdate: (ctrl: GraphViewController) => void,
): GraphViewController {
  runWarmupSimulation(ctrl.nodes, ctrl.edges, settings, width, height, ctrl.layoutWorker, (updated) => {
    const off = computeCentreOffset(updated, width, height);
    ctrl = { ...ctrl, nodes: updated, rState: { ...ctrl.rState, offsetX: off.offsetX, offsetY: off.offsetY } };
    ctrl = render(ctx, canvasEl, ctrl, settings, colorGroups, width, height);
    ctrl = startAnimationLoop(ctx, canvasEl, ctrl, settings, colorGroups, width, height, onUpdate);
    onUpdate(ctrl);
  });
  return ctrl;
}

export function startAnimationLoop(
  ctx: CanvasRenderingContext2D | null,
  canvasEl: HTMLCanvasElement,
  ctrl: GraphViewController,
  settings: GraphSettings,
  colorGroups: Array<{ query: string; color: string }>,
  width: number,
  height: number,
  onUpdate: (ctrl: GraphViewController) => void,
): GraphViewController {
  function animate() {
    runAnimationTick(ctrl.nodes, ctrl.edges, settings, width, height, ctrl.layoutWorker, (updated) => {
      ctrl = { ...ctrl, nodes: updated };
      ctrl = render(ctx, canvasEl, ctrl, settings, colorGroups, width, height);
      onUpdate(ctrl);
      if (settings.animate) ctrl = { ...ctrl, animationFrame: requestAnimationFrame(animate) };
    });
  }
  animate();
  return ctrl;
}

export function handleClick(
  e: MouseEvent,
  canvasEl: HTMLCanvasElement,
  ctrl: GraphViewController,
  openNote: (id: string) => void,
): GraphViewController {
  const { x, y } = screenToGraph(e, canvasEl, ctrl.rState);
  const node = hitTestNode(ctrl.nodes, x, y);
  if (node) {
    ctrl = { ...ctrl, rState: { ...ctrl.rState, selectedNode: node.id } };
    openNote(node.id);
  }
  return ctrl;
}

export function handleContextMenu(
  e: MouseEvent,
  canvasEl: HTMLCanvasElement,
  ctrl: GraphViewController,
): { ctrl: GraphViewController; node: GraphNode | null; x: number; y: number; visible: boolean } {
  e.preventDefault();
  const { x, y } = screenToGraph(e, canvasEl, ctrl.rState);
  const node = hitTestNode(ctrl.nodes, x, y);
  if (node) {
    return { ctrl, node, x: e.clientX, y: e.clientY, visible: true };
  }
  return { ctrl, node: null, x: 0, y: 0, visible: false };
}

export function handleContextAction(
  action: string,
  node: GraphNode | null,
  openNote: (id: string) => void,
  onLocalView: (nid: string) => void,
): void {
  if (!node) return;
  const id = dispatchContextMenuAction(action, node.id, onLocalView);
  if (id) openNote(id);
}

export function applyFilterUpdate(
  ctrl: GraphViewController,
  filterParams: GraphFilterParams,
): GraphViewController {
  if (ctrl.graphData.nodes.length === 0 || ctrl.initializing) return ctrl;
  const r = applyFilters(ctrl.graphData, filterParams, ctrl.nodes);
  return { ...ctrl, nodes: r.nodes, edges: r.edges };
}

/** Compute scale + offset to fit all nodes within the viewport with padding. */
export function fitToView(
  ctx: CanvasRenderingContext2D | null,
  canvasEl: HTMLCanvasElement,
  ctrl: GraphViewController,
  settings: GraphSettings,
  colorGroups: Array<{ query: string; color: string }>,
  width: number,
  height: number,
): GraphViewController {
  if (ctrl.nodes.length === 0) return ctrl;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const n of ctrl.nodes) {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  }
  const pad = 60;
  const graphW = (maxX - minX) || 1;
  const graphH = (maxY - minY) || 1;
  const scale = Math.min((width - pad * 2) / graphW, (height - pad * 2) / graphH, 3);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const rState = { ...ctrl.rState, scale, offsetX: width / 2 - cx * scale, offsetY: height / 2 - cy * scale };
  ctrl = { ...ctrl, rState };
  return render(ctx, canvasEl, ctrl, settings, colorGroups, width, height);
}

/** Reset zoom to 1x and center the graph. */
export function resetView(
  ctx: CanvasRenderingContext2D | null,
  canvasEl: HTMLCanvasElement,
  ctrl: GraphViewController,
  settings: GraphSettings,
  colorGroups: Array<{ query: string; color: string }>,
  width: number,
  height: number,
): GraphViewController {
  const off = computeCentreOffset(ctrl.nodes, width, height);
  ctrl = { ...ctrl, rState: { ...ctrl.rState, scale: 1, offsetX: off.offsetX, offsetY: off.offsetY } };
  return render(ctx, canvasEl, ctrl, settings, colorGroups, width, height);
}

export { handleGraphMouseDown, handleGraphMouseMove, handleGraphMouseUp, handleGraphWheel, handleGraphKeyDown };
export { resolveGraphColors, renderGraph };
