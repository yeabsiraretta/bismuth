/**
 * Graph view rendering logic.
 * Extracted from GraphView.svelte for the 300-line limit.
 */

import type { GraphEdge, GraphSettings } from '../../types';
import {
  type SimNode,
  DEFAULT_NODE_COLORS,
  getNodeRadius,
  getNodeColor,
  hitTestNode,
} from '../../utils/simulation';

export interface GraphRenderState {
  offsetX: number;
  offsetY: number;
  scale: number;
  hoveredNode: string | null;
  selectedNode: string | null;
  isDragging: boolean;
  dragNode: SimNode | null;
  isPanning: boolean;
  lastPanX: number;
  lastPanY: number;
}

export function createRenderState(): GraphRenderState {
  return {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    hoveredNode: null,
    selectedNode: null,
    isDragging: false,
    dragNode: null,
    isPanning: false,
    lastPanX: 0,
    lastPanY: 0,
  };
}

export interface GraphColors {
  bg: string;
  edge: string;
  nodeLabel: string;
  badge: string;
}

export function resolveGraphColors(el: HTMLElement): GraphColors {
  const s = getComputedStyle(el);
  return {
    bg: s.getPropertyValue('--graph-bg').trim() || '#1a1a2e',
    edge: s.getPropertyValue('--graph-edge').trim() || '#5a5a7a',
    nodeLabel: s.getPropertyValue('--graph-node-label').trim() || 'rgba(200, 200, 220, 0.8)',
    badge: s.getPropertyValue('--graph-text').trim() || 'rgba(200, 200, 220, 0.5)',
  };
}

export function renderGraph(
  ctx: CanvasRenderingContext2D,
  nodes: SimNode[],
  edges: GraphEdge[],
  settings: GraphSettings,
  colorGroups: Array<{ query: string; color: string }>,
  state: GraphRenderState,
  width: number,
  height: number,
  colors?: GraphColors
) {
  const c = colors ?? {
    bg: '#1a1a2e',
    edge: '#5a5a7a',
    nodeLabel: 'rgba(200, 200, 220, 0.8)',
    badge: 'rgba(200, 200, 220, 0.5)',
  };
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.translate(state.offsetX, state.offsetY);
  ctx.scale(state.scale, state.scale);

  // Draw edges — O(1) lookup via map
  const nodeMap = new Map<string, (typeof nodes)[0]>();
  for (const n of nodes) nodeMap.set(n.id, n);

  ctx.globalAlpha = 0.4;
  edges.forEach((edge) => {
    const source = nodeMap.get(edge.from);
    const target = nodeMap.get(edge.to);
    if (!source || !target) return;

    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = c.edge;
    ctx.lineWidth = settings.linkThickness;
    ctx.stroke();

    if (settings.showArrows) {
      const angle = Math.atan2(target.y - source.y, target.x - source.x);
      const arrowSize = 6;
      ctx.save();
      ctx.translate(target.x, target.y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-arrowSize, -arrowSize / 2);
      ctx.lineTo(0, 0);
      ctx.lineTo(-arrowSize, arrowSize / 2);
      ctx.fillStyle = c.edge;
      ctx.fill();
      ctx.restore();
    }
  });
  ctx.globalAlpha = 1.0;

  // Draw nodes
  nodes.forEach((node) => {
    const isHovered = state.hoveredNode === node.id;
    const isSelected = state.selectedNode === node.id;
    const radius = getNodeRadius(node, settings) * (isHovered || isSelected ? 1.4 : 1);
    const nodeColor = getNodeColor(node, DEFAULT_NODE_COLORS, colorGroups);

    if (isHovered || isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? 'rgba(74, 158, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? '#4a9eff' : isHovered ? '#6bb6ff' : nodeColor;
    ctx.fill();

    const showLabel =
      settings.showLabels && (isHovered || isSelected || state.scale > settings.textFadeThreshold);
    if (showLabel) {
      ctx.fillStyle = isHovered || isSelected ? '#ffffff' : c.nodeLabel;
      ctx.font = `${isHovered || isSelected ? '12px' : '11px'} system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(node.label, node.x, node.y + radius + 4);
    }
  });

  ctx.restore();

  // Node count badge
  ctx.fillStyle = c.badge;
  ctx.font = '11px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText(`${nodes.length} nodes · ${edges.length} connections`, 12, height - 12);
}

export function screenToGraph(e: MouseEvent, canvas: HTMLCanvasElement, state: GraphRenderState) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left - state.offsetX) / state.scale,
    y: (e.clientY - rect.top - state.offsetY) / state.scale,
  };
}

export function handleGraphMouseDown(
  e: MouseEvent,
  canvas: HTMLCanvasElement,
  nodes: SimNode[],
  state: GraphRenderState
): GraphRenderState {
  const { x, y } = screenToGraph(e, canvas, state);
  const node = hitTestNode(nodes, x, y);
  if (node) return { ...state, dragNode: node, isDragging: true };
  return { ...state, isPanning: true, lastPanX: e.clientX, lastPanY: e.clientY };
}

export function handleGraphMouseMove(
  e: MouseEvent,
  canvas: HTMLCanvasElement,
  nodes: SimNode[],
  state: GraphRenderState
): GraphRenderState {
  const { x, y } = screenToGraph(e, canvas, state);
  if (state.isDragging && state.dragNode) {
    state.dragNode.x = x;
    state.dragNode.y = y;
    state.dragNode.vx = 0;
    state.dragNode.vy = 0;
    return state;
  }
  if (state.isPanning) {
    const dx = e.clientX - state.lastPanX;
    const dy = e.clientY - state.lastPanY;
    return {
      ...state,
      offsetX: state.offsetX + dx,
      offsetY: state.offsetY + dy,
      lastPanX: e.clientX,
      lastPanY: e.clientY,
    };
  }
  const node = hitTestNode(nodes, x, y);
  return { ...state, hoveredNode: node ? node.id : null };
}

export function handleGraphMouseUp(state: GraphRenderState): GraphRenderState {
  return { ...state, isDragging: false, dragNode: null, isPanning: false };
}

export function handleGraphWheel(e: WheelEvent, state: GraphRenderState): GraphRenderState {
  e.preventDefault();
  const zoomFactor = e.deltaY > 0 ? 0.93 : 1.07;
  const newScale = Math.max(0.01, Math.min(20, state.scale * zoomFactor));
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const scaleChange = newScale / state.scale;
  const newOffsetX = mouseX - (mouseX - state.offsetX) * scaleChange;
  const newOffsetY = mouseY - (mouseY - state.offsetY) * scaleChange;
  return { ...state, scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY };
}

export function handleGraphKeyDown(e: KeyboardEvent, state: GraphRenderState): GraphRenderState {
  const speed = e.shiftKey ? 20 : 5;
  let { offsetX, offsetY, scale } = state;

  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      offsetY += speed;
      break;
    case 'ArrowDown':
      e.preventDefault();
      offsetY -= speed;
      break;
    case 'ArrowLeft':
      e.preventDefault();
      offsetX += speed;
      break;
    case 'ArrowRight':
      e.preventDefault();
      offsetX -= speed;
      break;
    case '+':
    case '=':
      e.preventDefault();
      scale = Math.min(5, scale * 1.1);
      break;
    case '-':
    case '_':
      e.preventDefault();
      scale = Math.max(0.1, scale * 0.9);
      break;
    default:
      return state;
  }
  return { ...state, offsetX, offsetY, scale };
}
