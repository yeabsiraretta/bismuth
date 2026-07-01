/** Node element factory functions — rectangles, circles, text, frames, screens. */
import type { CanvasElement, DeviceType } from '@/features/canvas/types';
import { DEVICE_PRESETS } from '@/features/canvas/types';
import { generateId } from '@/utils/id';

export function createRectangle(
  x: number,
  y: number,
  width: number,
  height: number,
  layerId: string
): CanvasElement {
  return {
    id: generateId(),
    element_type: 'rectangle',
    x,
    y,
    width,
    height,
    rotation: 0,
    properties: { fill: '#3b82f6', stroke: '#1e40af', strokeWidth: 2, opacity: 1 },
    layer_id: layerId,
    z_index: 0,
    locked: false,
    visible: true,
  };
}

export function createCircle(x: number, y: number, radius: number, layerId: string): CanvasElement {
  return {
    id: generateId(),
    element_type: 'circle',
    x: x - radius,
    y: y - radius,
    width: radius * 2,
    height: radius * 2,
    rotation: 0,
    properties: { fill: '#10b981', stroke: '#059669', strokeWidth: 2, opacity: 1, radius },
    layer_id: layerId,
    z_index: 0,
    locked: false,
    visible: true,
  };
}

export function createText(x: number, y: number, text: string, layerId: string): CanvasElement {
  return {
    id: generateId(),
    element_type: 'text',
    x,
    y,
    width: 100,
    height: 24,
    rotation: 0,
    properties: {
      text,
      fontSize: 16,
      fontFamily: 'Inter, sans-serif',
      fill: '#000000',
      opacity: 1,
    },
    layer_id: layerId,
    z_index: 0,
    locked: false,
    visible: true,
  };
}

export function createFrame(
  x: number,
  y: number,
  width: number,
  height: number,
  layerId: string,
  name?: string
): CanvasElement {
  return {
    id: generateId(),
    element_type: 'frame',
    x,
    y,
    width,
    height,
    rotation: 0,
    properties: {
      fill: '#ffffff',
      stroke: '#d4d4d8',
      strokeWidth: 1,
      opacity: 1,
      clipContent: true,
      padding: 0,
    },
    layer_id: layerId,
    z_index: 0,
    locked: false,
    visible: true,
    name: name || 'Frame',
  };
}

export function createScreen(
  x: number,
  y: number,
  deviceType: DeviceType,
  layerId: string
): CanvasElement {
  const preset = DEVICE_PRESETS[deviceType] || { width: 393, height: 852 };
  return {
    id: generateId(),
    element_type: 'screen',
    x,
    y,
    width: preset.width,
    height: preset.height,
    rotation: 0,
    properties: {
      fill: '#ffffff',
      stroke: '#27272a',
      strokeWidth: 2,
      opacity: 1,
      clipContent: true,
      deviceType,
      borderRadius: { topLeft: 40, topRight: 40, bottomRight: 40, bottomLeft: 40 },
    },
    layer_id: layerId,
    z_index: 0,
    locked: false,
    visible: true,
    name: DEVICE_PRESETS[deviceType]?.label || 'Screen',
  };
}
