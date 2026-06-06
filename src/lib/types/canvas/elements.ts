import type { Fill, Stroke, BlendMode } from './paint';
import type { VectorNetwork, BooleanOperation, TextSegment } from './paint';
import type { Effect } from './paint';
import type { Interaction, CodeConnect, GridLayoutConfig } from './interactions';
import type { Point, Shadow, CornerRadius, AutoLayout, Constraints, DeviceType } from './settings';

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
  | 'screen'
  | 'boolean_operation'
  | 'vector'
  | 'star'
  | 'polygon'
  | 'slice';

/** Bag of visual/behavioral properties keyed by element type. */
export interface ElementProperties {
  fill?: string;
  /** Multiple fills layered on the element (like Figma). First = bottom. */
  fills?: Fill[];
  stroke?: string;
  strokeWidth?: number;
  /** Multiple strokes (outline, inner, center). */
  strokes?: Stroke[];
  strokeAlign?: 'inside' | 'outside' | 'center';
  strokeCap?: 'none' | 'round' | 'square';
  strokeJoin?: 'miter' | 'round' | 'bevel';
  opacity?: number;
  /** CSS blend mode for compositing. */
  blendMode?: BlendMode;

  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: 'none' | 'underline' | 'strikethrough';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  /** Text auto-resize behavior. */
  textAutoResize?: 'none' | 'height' | 'width-and-height' | 'truncate';
  /** Rich text segments (for mixed styling within a text node). */
  textSegments?: TextSegment[];

  src?: string;
  /** Image fit mode within bounds. */
  imageFit?: 'fill' | 'fit' | 'crop' | 'tile';

  radius?: number;
  borderRadius?: CornerRadius;
  /** For star/polygon: number of points/sides. */
  pointCount?: number;
  /** For star: inner radius ratio (0-1). */
  innerRadius?: number;

  points?: Point[];
  startArrow?: boolean;
  endArrow?: boolean;
  lineStyle?: 'solid' | 'dashed' | 'dotted';

  pathData?: string;
  /** Vector network (Figma-style fill regions between paths). */
  vectorNetwork?: VectorNetwork;

  booleanOperation?: BooleanOperation;

  clipContent?: boolean;
  padding?: number;

  /** If true, this element acts as a mask for its siblings below. */
  isMask?: boolean;
  maskType?: 'alpha' | 'vector' | 'luminance';

  componentId?: string;
  overrides?: Record<string, unknown>;
  /** Active variant selections (axis → value). */
  variantSelections?: Record<string, string>;
  /** Active interaction state. */
  activeState?: string;

  deviceType?: DeviceType;

  autoLayout?: AutoLayout;
  /** Grid layout config (when frame uses grid instead of flex). */
  gridLayout?: GridLayoutConfig;
  constraints?: Constraints;
  /** Sizing behavior within a parent auto-layout. */
  layoutSizing?: { horizontal: 'fixed' | 'hug' | 'fill'; vertical: 'fixed' | 'hug' | 'fill' };
  /** Absolute positioning within an auto-layout parent (breakout). */
  layoutPositioning?: 'auto' | 'absolute';

  shadow?: Shadow;
  /** Multiple layered effects. */
  effects?: Effect[];
  blur?: number;
  /** Background blur (frosted glass). */
  backgroundBlur?: number;

  /** Interactions defined on this element (click, hover, etc.). */
  interactions?: Interaction[];

  /** Reference to a shared fill style by ID. */
  fillStyleId?: string;
  /** Reference to a shared stroke style. */
  strokeStyleId?: string;
  /** Reference to a shared text style. */
  textStyleId?: string;
  /** Reference to a shared effect style. */
  effectStyleId?: string;

  /** Maps property names to design token IDs for MCP export. */
  tokenBindings?: Record<string, string>;

  /** Direct code mapping for MCP → code generation pipeline. */
  codeConnect?: CodeConnect;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
