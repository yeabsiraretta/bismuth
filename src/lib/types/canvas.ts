// ─── Document ────────────────────────────────────────────────────────────────

/** Top-level canvas document containing all elements, layers, pages, and metadata. */
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

/** Camera position and zoom level for the canvas viewport. */
export interface Viewport {
  /** Horizontal pan offset in screen pixels. */
  x: number;
  /** Vertical pan offset in screen pixels. */
  y: number;
  /** Zoom multiplier (1.0 = 100%). */
  scale: number;
}

// ─── Pages ───────────────────────────────────────────────────────────────────

/** A named page within a multi-page canvas document. */
export interface Page {
  id: string;
  name: string;
  /** Sort order (0-based). */
  order: number;
  /** Element IDs belonging to this page. */
  elements: string[];
  /** Optional page background color. */
  background?: string;
}

// ─── Elements ────────────────────────────────────────────────────────────────

/** A single visual element on the canvas (shape, text, frame, etc.). */
export interface CanvasElement {
  id: string;
  element_type: ElementType;
  /** Absolute X position on the canvas. */
  x: number;
  /** Absolute Y position on the canvas. */
  y: number;
  width: number;
  height: number;
  /** Rotation in degrees (0–360). */
  rotation: number;
  /** Type-specific visual properties (fill, stroke, text, etc.). */
  properties: ElementProperties;
  layer_id: string;
  /** Stacking order within the layer. */
  z_index: number;
  locked: boolean;
  visible: boolean;
  /** Parent frame/group ID for nested elements. */
  parentId?: string;
  /** User-assigned display name shown in the layer tree. */
  name?: string;
}

/** Discriminator for the kind of canvas element. */
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

/** Bag of visual/behavioral properties keyed by element type. */
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

/** A 2D coordinate point on the canvas. */
export interface Point {
  x: number;
  y: number;
}

/** Drop shadow effect parameters. */
export interface Shadow {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

/** Per-corner border radius for rectangles and frames. */
export interface CornerRadius {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

/** Flexbox-style auto layout configuration for frames. */
export interface AutoLayout {
  /** Main axis direction. */
  direction: 'horizontal' | 'vertical';
  /** Spacing between children along the main axis (px). */
  gap: number;
  /** Inner padding of the frame container. */
  padding: { top: number; right: number; bottom: number; left: number };
  /** Cross-axis alignment of children. */
  alignItems: 'start' | 'center' | 'end' | 'stretch';
  /** Main-axis distribution of children. */
  justifyContent: 'start' | 'center' | 'end' | 'space-between';
}

/** Responsive resize constraints when a parent frame is resized. */
export interface Constraints {
  horizontal: 'left' | 'right' | 'center' | 'stretch' | 'scale';
  vertical: 'top' | 'bottom' | 'center' | 'stretch' | 'scale';
}

/** Predefined device frame presets for screen elements. */
export type DeviceType =
  | 'iphone-15'
  | 'iphone-15-pro-max'
  | 'ipad'
  | 'desktop-1440'
  | 'desktop-1920'
  | 'custom';

/** Pixel dimensions and display labels for each device preset. */
export const DEVICE_PRESETS: Record<DeviceType, { width: number; height: number; label: string }> = {
  'iphone-15': { width: 393, height: 852, label: 'iPhone 15' },
  'iphone-15-pro-max': { width: 430, height: 932, label: 'iPhone 15 Pro Max' },
  'ipad': { width: 1024, height: 1366, label: 'iPad Pro 12.9"' },
  'desktop-1440': { width: 1440, height: 900, label: 'Desktop 1440' },
  'desktop-1920': { width: 1920, height: 1080, label: 'Desktop 1080p' },
  'custom': { width: 800, height: 600, label: 'Custom' },
};

// ─── Components (Reusable Symbols) ──────────────────────────────────────────

/** A reusable component (symbol) that can be instantiated on the canvas. */
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

/** An overridable property exposed by a component definition. */
export interface ComponentProp {
  key: string;
  label: string;
  type: 'text' | 'color' | 'boolean' | 'number' | 'image';
  defaultValue: unknown;
}

// ─── Layers ──────────────────────────────────────────────────────────────────

/** A named layer that groups elements for visibility/lock control. */
export interface Layer {
  id: string;
  name: string;
  /** Global stacking order (higher = in front). */
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
