import type { Fill, Stroke, BlendMode } from '@/features/canvas/types/paint';
import type { VectorNetwork, BooleanOperation, TextSegment } from '@/features/canvas/types/paint';
import type { Effect } from '@/features/canvas/types/paint';
import type {
  Interaction,
  CodeConnect,
  GridLayoutConfig,
} from '@/features/canvas/types/interactions';
import type {
  Point,
  Shadow,
  CornerRadius,
  AutoLayout,
  Constraints,
  DeviceType,
} from '@/features/canvas/types/settings';

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
  | 'slice'
  | 'feature_card';

/** Flowchart node shapes (applied to rectangles/frames via nodeShape property). */
export type NodeShape =
  | 'rectangle'
  | 'pill'
  | 'diamond'
  | 'parallelogram'
  | 'hexagon'
  | 'stadium'
  | 'cylinder'
  | 'document'
  | 'predefined-process'
  | 'circle';

/** Arrow head drawing styles for edge endpoints. */
export type ArrowHeadStyle =
  | 'triangle'
  | 'triangle-outline'
  | 'thin-triangle'
  | 'diamond'
  | 'diamond-outline'
  | 'circle'
  | 'circle-outline'
  | 'none';

/** Edge pathfinding algorithm. */
export type EdgePathfinding = 'direct' | 'orthogonal' | 'curved';

/** Border rendering style. */
export type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'none';

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

  /** Flowchart shape override for rectangle/frame elements. */
  nodeShape?: NodeShape;
  /** Border rendering style (solid, dashed, dotted, none). */
  borderStyle?: BorderStyle;
  /** Arrow head style at the start of an edge. */
  startArrowStyle?: ArrowHeadStyle;
  /** Arrow head style at the end of an edge. */
  endArrowStyle?: ArrowHeadStyle;
  /** Edge pathfinding algorithm. */
  pathfinding?: EdgePathfinding;
  /** Whether the node is collapsed (for collapsible groups). */
  collapsed?: boolean;
  /** Whether the node auto-resizes to fit its text content. */
  autoResize?: boolean;
  /** Edge label text. */
  edgeLabel?: string;
  /** Custom CSS class names applied to the node. */
  cssClasses?: string[];

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

  /** Feature roadmap card data (used when element_type === 'feature_card'). */
  featureCardData?: FeatureCardData;

  [key: string]: unknown;
}

/** Data model for a feature_card canvas element used in roadmap documents. */
export interface FeatureCardData {
  title: string;
  status: 'idea' | 'planned' | 'in-progress' | 'done' | 'deferred';
  /** Priority level: 1 = highest, 5 = lowest. */
  priority: 1 | 2 | 3 | 4 | 5;
  /** Relative path to the feature spec file (e.g. specs/045-release-channels/spec.md). */
  specPath?: string;
  /** IDs of other feature_card elements this card depends on. */
  dependsOn: string[];
  milestone?: string;
  owner?: string;
  description?: string;
}
