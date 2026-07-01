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
  /** Whether children wrap to next line when exceeding container width. */
  wrap?: boolean;
  /** Spacing between rows/columns when wrap is enabled. */
  counterAxisSpacing?: number;
}

/** Per-child layout sizing and constraint configuration. */
export interface LayoutChild {
  /** How the child is sized along the main axis. */
  sizing: 'fill' | 'hug' | 'fixed';
  /** Minimum width constraint (px). */
  minWidth?: number;
  /** Maximum width constraint (px). */
  maxWidth?: number;
  /** Minimum height constraint (px). */
  minHeight?: number;
  /** Maximum height constraint (px). */
  maxHeight?: number;
  /** Positioning mode — absolute removes from layout flow. */
  positioning: 'auto' | 'absolute';
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
  | 'component'
  | 'flow_link'
  | 'preview';

export interface CanvasSettings {
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  showRulers: boolean;
  showPixelGrid: boolean;
}
