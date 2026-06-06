/**
 * Graph view rendering logic.
 * Extracted from GraphView.svelte for the 300-line limit.
 */

import type { GraphEdge, GraphSettings } from '@/types/graph';
import { type SimNode, DEFAULT_NODE_COLORS, getNodeRadius, getNodeColor, hitTestNode } from '@/utils/graph/simulation';

export interface GraphRenderState {
  offsetX: number;
  offsetY: number;
  scale: number;
  hoveredNode: string | null;
  selectedNode: string | null;
  isDragging: boolean;
  dragNode: SimNode | null;
}

export function createRenderState(): GraphRenderState {
  return { offsetX: 0, offsetY: 0, scale: 1, hoveredNode: null, selectedNode: null, isDragging: false, dragNode: null };
}

export function renderGraph(
  ctx: CanvasRenderingContext2D,
  nodes: SimNode[],
  edges: GraphEdge[],
  settings: GraphSettings,
  colorGroups: Array<{ query: string; color: string }>,
  state: GraphRenderState,
  width: number,
  height: number
) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.translate(state.offsetX, state.offsetY);
  ctx.scale(state.scale, state.scale);

  // Draw edges
  ctx.globalAlpha = 0.4;
  edges.forEach((edge) => {
    const source = nodes.find((n) => n.id === edge.from);
    const target = nodes.find((n) => n.id === edge.to);
    if (!source || !target) return;

    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = '#5a5a7a';
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
      ctx.fillStyle = '#5a5a7a';
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

    const showLabel = settings.showLabels && (isHovered || isSelected || state.scale > settings.textFadeThreshold);
    if (showLabel) {
      ctx.fillStyle = isHovered || isSelected ? '#ffffff' : 'rgba(200, 200, 220, 0.8)';
      ctx.font = `${isHovered || isSelected ? '12px' : '11px'} system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(node.label, node.x, node.y + radius + 4);
    }
  });

  ctx.restore();

  // Node count badge
  ctx.fillStyle = 'rgba(200, 200, 220, 0.5)';
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

export function handleGraphMouseDown(e: MouseEvent, canvas: HTMLCanvasElement, nodes: SimNode[], state: GraphRenderState): GraphRenderState {
  const { x, y } = screenToGraph(e, canvas, state);
  const node = hitTestNode(nodes, x, y);
  if (node) return { ...state, dragNode: node, isDragging: true };
  return state;
}

export function handleGraphMouseMove(e: MouseEvent, canvas: HTMLCanvasElement, nodes: SimNode[], state: GraphRenderState): GraphRenderState {
  const { x, y } = screenToGraph(e, canvas, state);
  if (state.isDragging && state.dragNode) {
    state.dragNode.x = x;
    state.dragNode.y = y;
    state.dragNode.vx = 0;
    state.dragNode.vy = 0;
    return state;
  }
  const node = hitTestNode(nodes, x, y);
  return { ...state, hoveredNode: node ? node.id : null };
}

export function handleGraphMouseUp(state: GraphRenderState): GraphRenderState {
  return { ...state, isDragging: false, dragNode: null };
}

export function handleGraphWheel(e: WheelEvent, state: GraphRenderState): GraphRenderState {
  e.preventDefault();
  const newScale = Math.max(0.1, Math.min(5, state.scale * (e.deltaY > 0 ? 0.9 : 1.1)));
  return { ...state, scale: newScale };
}

export function handleGraphKeyDown(e: KeyboardEvent, state: GraphRenderState): GraphRenderState {
  const speed = e.shiftKey ? 20 : 5;
  let { offsetX, offsetY, scale } = state;

  switch (e.key) {
    case 'ArrowUp': e.preventDefault(); offsetY += speed; break;
    case 'ArrowDown': e.preventDefault(); offsetY -= speed; break;
    case 'ArrowLeft': e.preventDefault(); offsetX += speed; break;
    case 'ArrowRight': e.preventDefault(); offsetX -= speed; break;
    case '+': case '=': e.preventDefault(); scale = Math.min(5, scale * 1.1); break;
    case '-': case '_': e.preventDefault(); scale = Math.max(0.1, scale * 0.9); break;
    default: return state;
  }
  return { ...state, offsetX, offsetY, scale };
}
