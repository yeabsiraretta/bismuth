export interface CanvasDocument {
  id: string;
  name: string;
  vault_id: string | null;
  viewport: Viewport;
  grid_size: number;
  snap_to_grid: boolean;
  elements: CanvasElement[];
  layers: Layer[];
  created_at: number;
  modified_at: number;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface CanvasElement {
  id: string;
  element_type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  properties: ElementProperties;
  layer_id: string;
  z_index: number;
  locked: boolean;
  visible: boolean;
}

export type ElementType = 'rectangle' | 'circle' | 'text' | 'image' | 'group';

export interface ElementProperties {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  src?: string;
  radius?: number;
  [key: string]: any;
}

export interface Layer {
  id: string;
  name: string;
  z_order: number;
  visible: boolean;
  locked: boolean;
}

export type Tool = 'select' | 'rectangle' | 'circle' | 'text' | 'image' | 'pan';

export interface CanvasSettings {
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
}
