/**
 * Canvas element rendering functions.
 * Extracted from CanvasWorkspaceInteractive.svelte for the 300-line limit.
 */

import type { CanvasElement, CanvasSettings } from '@/features/canvas/types';
import type { TokenBinding } from '@/features/canvas/types/design/tokens';
import { resolveToken, activeMode } from '@/features/canvas/stores/design/tokenStore';
import { sharedStyles } from '@/features/canvas/stores/design/styleLibrary';
import { get } from 'svelte/store';
import {
  drawRectangle,
  drawCircle,
  drawText,
  drawFrame,
  drawLine,
  drawArrow,
  drawPen,
  drawComponentInstance,
  drawFeatureCard,
  drawSelectionBox,
} from './canvasShapeDrawing';
import {
  focusModeEnabled,
  focusedElementId,
  edgeHighlightEnabled,
  highlightedEdgeIds,
} from '@/features/canvas/stores/workspace/canvasInteractionModes';

/**
 * T013: Resolves token bindings to produce effective property values.
 * When an element has tokenBindings, resolves each bound token against the active mode.
 */
export function resolveTokenBindings(element: CanvasElement): Record<string, unknown> {
  const bindings = element.properties.tokenBindings as TokenBinding[] | undefined;
  if (!bindings || bindings.length === 0) return element.properties;

  const mode = get(activeMode);
  const resolved = { ...element.properties };

  for (const binding of bindings) {
    const value = resolveToken(binding.tokenId, mode);
    if (value !== null) {
      resolved[binding.property] = value;
    }
  }

  return resolved;
}

/**
 * T038: Resolves style bindings — when element has fillStyleId/strokeStyleId,
 * looks up the shared style and returns effective fill/stroke values.
 */
export function resolveStyleBindings(element: CanvasElement): Record<string, unknown> {
  const props = element.properties;
  const fillStyleId = props.fillStyleId as string | undefined;
  const strokeStyleId = props.strokeStyleId as string | undefined;

  if (!fillStyleId && !strokeStyleId) return props;

  const styles = get(sharedStyles);
  const resolved: Record<string, unknown> = { ...props };

  if (fillStyleId) {
    const style = styles.find(s => s.id === fillStyleId);
    if (style?.properties?.['color']) {
      resolved['fill'] = style.properties['color'];
    }
  }

  if (strokeStyleId) {
    const style = styles.find(s => s.id === strokeStyleId);
    if (style?.properties?.['color']) {
      resolved['stroke'] = style.properties['color'];
    }
  }

  return resolved;
}

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

let _isDarkTheme: boolean | null = null;
let _lastThemeCheck = 0;

export function isDarkTheme(): boolean {
  const now = Date.now();
  if (_isDarkTheme !== null && now - _lastThemeCheck < 500) return _isDarkTheme;
  _lastThemeCheck = now;
  _isDarkTheme = typeof document !== 'undefined'
    && document.documentElement.getAttribute('data-theme') === 'dark';
  return _isDarkTheme;
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportState,
  settings: CanvasSettings,
  width: number,
  height: number
) {
  const gridSize = settings.gridSize;
  const startX = Math.floor(-viewport.x / viewport.scale / gridSize) * gridSize;
  const startY = Math.floor(-viewport.y / viewport.scale / gridSize) * gridSize;
  const endX = startX + width / viewport.scale + gridSize;
  const endY = startY + height / viewport.scale + gridSize;

  const dark = isDarkTheme();
  const dotColor = dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
  const lineColor = dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

  // Draw dot-grid for cleaner appearance
  const dotRadius = 1.2 / viewport.scale;
  ctx.fillStyle = dotColor;
  for (let x = startX; x < endX; x += gridSize) {
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw major grid lines every 5 cells
  const majorSize = gridSize * 5;
  const majorStartX = Math.floor(-viewport.x / viewport.scale / majorSize) * majorSize;
  const majorStartY = Math.floor(-viewport.y / viewport.scale / majorSize) * majorSize;
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1 / viewport.scale;
  for (let x = majorStartX; x < endX; x += majorSize) {
    ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke();
  }
  for (let y = majorStartY; y < endY; y += majorSize) {
    ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
  }
}

export function drawElements(
  ctx: CanvasRenderingContext2D,
  elements: CanvasElement[],
  selectedIds: string[],
  viewport: ViewportState
) {
  const focusOn = get(focusModeEnabled);
  const focusId = get(focusedElementId);
  const edgeHL = get(edgeHighlightEnabled);
  const hlEdges = edgeHL ? get(highlightedEdgeIds) : new Set<string>();

  // Build set of elements hidden by collapsed parents
  const collapsedParents = new Set<string>();
  for (const el of elements) {
    if ((el.element_type === 'frame' || el.element_type === 'group') && el.properties.collapsed) {
      collapsedParents.add(el.id);
    }
  }

  for (const element of elements) {
    if (!element.visible) continue;
    // Skip children of collapsed groups
    if (element.parentId && collapsedParents.has(element.parentId)) continue;

    const isSelected = selectedIds.includes(element.id);
    const isEdge = element.element_type === 'arrow' || element.element_type === 'line';

    // Focus mode: dim non-focused elements
    if (focusOn && focusId && element.id !== focusId) {
      // Don't dim highlighted edges connected to the focused element
      if (!(isEdge && hlEdges.has(element.id))) {
        ctx.save();
        ctx.globalAlpha = 0.15;
        drawElement(ctx, element, isSelected, viewport);
        ctx.restore();
        continue;
      }
    }

    // Edge highlight glow
    if (isEdge && hlEdges.has(element.id)) {
      ctx.save();
      ctx.shadowColor = isDarkTheme() ? '#ef4444' : '#dc2626';
      ctx.shadowBlur = 6;
      drawElement(ctx, element, isSelected, viewport);
      ctx.restore();
      continue;
    }

    drawElement(ctx, element, isSelected, viewport);
  }
}

export function drawElement(
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  isSelected: boolean = false,
  viewport: ViewportState
) {
  ctx.save();
  ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
  ctx.rotate((element.rotation * Math.PI) / 180);
  ctx.translate(-(element.x + element.width / 2), -(element.y + element.height / 2));

  switch (element.element_type) {
    case 'rectangle':
      drawRectangle(ctx, element);
      break;
    case 'circle':
      drawCircle(ctx, element);
      break;
    case 'text':
      drawText(ctx, element);
      break;
    case 'frame':
    case 'screen':
      drawFrame(ctx, element);
      break;
    case 'line':
      drawLine(ctx, element);
      break;
    case 'arrow':
      drawArrow(ctx, element);
      break;
    case 'pen':
      drawPen(ctx, element);
      break;
    case 'component_instance':
      drawComponentInstance(ctx, element, viewport, drawElement);
      break;
    case 'feature_card':
      drawFeatureCard(ctx, element);
      break;
  }

  if (isSelected) {
    drawSelectionBox(ctx, element, viewport);
  }

  ctx.restore();
}

