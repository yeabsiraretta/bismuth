/**
 * 3D Graph controller — camera orbit, simulation lifecycle, focus, and events.
 */

import type { GraphData, GraphEdge } from '../../types';
import type { SimNode3D, Camera3D, Graph3DSettings, FocusState3D } from '../../types/graph3d';
import { DEFAULT_CAMERA, EMPTY_FOCUS } from '../../types/graph3d';
import {
  initNodes3D,
  tickForces3D,
  projectAllNodes,
  hitTestNode3D,
  getNeighborIds,
} from '../../utils/simulation3d';
import { filterGraphData } from '../../utils/simulation';
import { render3DGraph, resolve3DColors, type Graph3DColors } from './graph3dRendering';
import { getGraphData } from '../../services/graph';
import { log } from '@/utils/logger';

export interface Graph3DState {
  graphData: GraphData;
  nodes: SimNode3D[];
  edges: GraphEdge[];
  camera: Camera3D;
  focus: FocusState3D;
  colors: Graph3DColors | null;
  animFrame: number;
  initializing: boolean;
}

export function createState(): Graph3DState {
  return {
    graphData: { nodes: [], edges: [] },
    nodes: [],
    edges: [],
    camera: { ...DEFAULT_CAMERA },
    focus: { ...EMPTY_FOCUS },
    colors: null,
    animFrame: 0,
    initializing: false,
  };
}

// ─── Data loading ───────────────────────────────────────────────────────────

export async function loadGraph3D(
  state: Graph3DState,
  settings: Graph3DSettings,
  searchQuery: string
): Promise<Graph3DState> {
  try {
    const graphData = await getGraphData();
    log.debug('3D graph data loaded', {
      nodes: graphData.nodes.length,
      edges: graphData.edges.length,
    });
    const filtered = filterGraphData(graphData, {
      searchQuery,
      showOrphans: settings.showOrphans,
      isLocal: false,
      centerNode: null,
      depth: 3,
    });
    const nodes = initNodes3D(filtered.nodes, filtered.edges, state.nodes, true);
    // Warmup
    for (let i = 0; i < settings.warmupTicks; i++) tickForces3D(nodes, filtered.edges, settings);
    return { ...state, graphData, nodes, edges: filtered.edges, initializing: false };
  } catch (error) {
    log.error('Failed to load 3D graph data', error);
    return state;
  }
}

// ─── Rendering ──────────────────────────────────────────────────────────────

export function render3D(
  ctx: CanvasRenderingContext2D,
  canvasEl: HTMLCanvasElement,
  state: Graph3DState,
  settings: Graph3DSettings,
  width: number,
  height: number
): Graph3DState {
  if (!ctx) return state;
  const colors = state.colors ?? resolve3DColors(canvasEl);
  projectAllNodes(state.nodes, state.camera, width, height);
  render3DGraph(
    ctx,
    state.nodes,
    state.edges,
    state.camera,
    settings,
    state.focus,
    width,
    height,
    colors
  );
  return { ...state, colors };
}

// ─── Animation ──────────────────────────────────────────────────────────────

export function startAnimation3D(
  ctx: CanvasRenderingContext2D,
  canvasEl: HTMLCanvasElement,
  state: Graph3DState,
  settings: Graph3DSettings,
  width: number,
  height: number,
  onUpdate: (s: Graph3DState) => void
): Graph3DState {
  cancelAnimationFrame(state.animFrame);
  function loop() {
    tickForces3D(state.nodes, state.edges, settings);
    state = render3D(ctx, canvasEl, state, settings, width, height);
    onUpdate(state);
    if (settings.animate) state = { ...state, animFrame: requestAnimationFrame(loop) };
  }
  loop();
  return state;
}

// ─── Camera controls ────────────────────────────────────────────────────────

export function orbitCamera(camera: Camera3D, dTheta: number, dPhi: number): Camera3D {
  return {
    ...camera,
    theta: camera.theta + dTheta,
    phi: Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, camera.phi + dPhi)),
  };
}

export function zoomCamera(camera: Camera3D, delta: number): Camera3D {
  return { ...camera, distance: Math.max(100, Math.min(3000, camera.distance + delta)) };
}

export function focusCameraOnNode(camera: Camera3D, node: SimNode3D): Camera3D {
  return { ...camera, focusX: node.x, focusY: node.y, focusZ: node.z, distance: 300 };
}

// ─── Node interaction ───────────────────────────────────────────────────────

export function handleNodeClick(
  state: Graph3DState,
  sx: number,
  sy: number
): { state: Graph3DState; clickedNode: SimNode3D | undefined } {
  const node = hitTestNode3D(state.nodes, sx, sy);
  if (!node) {
    return { state: { ...state, focus: { ...EMPTY_FOCUS } }, clickedNode: undefined };
  }
  const neighbors = getNeighborIds(node.id, state.edges);
  const camera = focusCameraOnNode(state.camera, node);
  return {
    state: {
      ...state,
      camera,
      focus: { focusedNodeId: node.id, highlightedNeighborIds: neighbors },
    },
    clickedNode: node,
  };
}

export function handleNodeDoubleClick(
  state: Graph3DState,
  sx: number,
  sy: number
): SimNode3D | undefined {
  return hitTestNode3D(state.nodes, sx, sy);
}

// ─── Hover ──────────────────────────────────────────────────────────────────

export function getHoveredNode(state: Graph3DState, sx: number, sy: number): SimNode3D | undefined {
  return hitTestNode3D(state.nodes, sx, sy);
}

// ─── Filter update ──────────────────────────────────────────────────────────

export function applyFilter3D(
  state: Graph3DState,
  settings: Graph3DSettings,
  searchQuery: string
): Graph3DState {
  if (state.graphData.nodes.length === 0) return state;
  const filtered = filterGraphData(state.graphData, {
    searchQuery,
    showOrphans: settings.showOrphans,
    isLocal: false,
    centerNode: null,
    depth: 3,
  });
  const nodes = initNodes3D(filtered.nodes, filtered.edges, state.nodes);
  return { ...state, nodes, edges: filtered.edges };
}
