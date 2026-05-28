// ─── Document ────────────────────────────────────────────────────────────────

export interface CanvasDocument {
  id: string;
  name: string;
  vault_id: string | null;
  viewport: Viewport;
  grid_size: number;
  snap_to_grid: boolean;
  elements: CanvasElement[];
  layers: Layer[];
  pages: Page[];
  activePageId: string;
  components: ComponentDefinition[];
  created_at: number;
  modified_at: number;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

// ─── Pages ───────────────────────────────────────────────────────────────────

export interface Page {
  id: string;
  name: string;
  order: number;
  elements: string[]; // element IDs belonging to this page
  background?: string;
}

// ─── Elements ────────────────────────────────────────────────────────────────

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
  parentId?: string; // For elements inside frames or groups
  name?: string; // User-assigned layer name
}

export type ElementType =
  | 'rectangle'
  | 'circle'
  | 'text'
  | 'image'
  | 'group'
  | 'frame'
  | 'line'
  | 'arrow'
  | 'pen'
  | 'component_instance'
  | 'screen';

export interface ElementProperties {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  src?: string;
  radius?: number;
  // Line/Arrow
  points?: Point[];
  startArrow?: boolean;
  endArrow?: boolean;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  // Pen / path
  pathData?: string; // SVG path d attribute
  // Frame
  clipContent?: boolean;
  padding?: number;
  // Component instance
  componentId?: string;
  overrides?: Record<string, unknown>;
  // Screen
  deviceType?: DeviceType;
  // Layout
  autoLayout?: AutoLayout;
  // Constraints (responsive)
  constraints?: Constraints;
  // Effects
  shadow?: Shadow;
  blur?: number;
  borderRadius?: CornerRadius;
  [key: string]: any;
}

// ─── Supporting Types ────────────────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface Shadow {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

export interface CornerRadius {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

export interface AutoLayout {
  direction: 'horizontal' | 'vertical';
  gap: number;
  padding: { top: number; right: number; bottom: number; left: number };
  alignItems: 'start' | 'center' | 'end' | 'stretch';
  justifyContent: 'start' | 'center' | 'end' | 'space-between';
}

export interface Constraints {
  horizontal: 'left' | 'right' | 'center' | 'stretch' | 'scale';
  vertical: 'top' | 'bottom' | 'center' | 'stretch' | 'scale';
}

export type DeviceType =
  | 'iphone-15'
  | 'iphone-15-pro-max'
  | 'ipad'
  | 'desktop-1440'
  | 'desktop-1920'
  | 'custom';

export const DEVICE_PRESETS: Record<DeviceType, { width: number; height: number; label: string }> = {
  'iphone-15': { width: 393, height: 852, label: 'iPhone 15' },
  'iphone-15-pro-max': { width: 430, height: 932, label: 'iPhone 15 Pro Max' },
  'ipad': { width: 1024, height: 1366, label: 'iPad Pro 12.9"' },
  'desktop-1440': { width: 1440, height: 900, label: 'Desktop 1440' },
  'desktop-1920': { width: 1920, height: 1080, label: 'Desktop 1080p' },
  'custom': { width: 800, height: 600, label: 'Custom' },
};

// ─── Components (Reusable Symbols) ──────────────────────────────────────────

export interface ComponentDefinition {
  id: string;
  name: string;
  description?: string;
  category?: string;
  /** The master element tree for this component */
  elements: CanvasElement[];
  /** Exposed props that instances can override */
  exposedProps: ComponentProp[];
  width: number;
  height: number;
  created_at: number;
  modified_at: number;
}

export interface ComponentProp {
  key: string;
  label: string;
  type: 'text' | 'color' | 'boolean' | 'number' | 'image';
  defaultValue: unknown;
}

// ─── Layers ──────────────────────────────────────────────────────────────────

export interface Layer {
  id: string;
  name: string;
  z_order: number;
  visible: boolean;
  locked: boolean;
}

// ─── Tools ───────────────────────────────────────────────────────────────────

export type Tool =
  | 'select'
  | 'rectangle'
  | 'circle'
  | 'text'
  | 'image'
  | 'pan'
  | 'frame'
  | 'line'
  | 'arrow'
  | 'pen'
  | 'screen'
  | 'component';

// ─── Settings ────────────────────────────────────────────────────────────────

export interface CanvasSettings {
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  showRulers: boolean;
  showPixelGrid: boolean;
}
