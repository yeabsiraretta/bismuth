import type { Point } from '@/features/canvas/types/settings';

/** Fill type discriminator. */
export type FillType = 'solid' | 'linear_gradient' | 'radial_gradient' | 'image';

/** A single fill layer (elements can have multiple). */
export interface Fill {
  type: FillType;
  visible: boolean;
  opacity: number;
  /** Solid color (hex). */
  color?: string;
  /** Gradient stops (for linear/radial). */
  gradientStops?: GradientStop[];
  /** Gradient transform (angle for linear, center for radial). */
  gradientTransform?: { angle?: number; cx?: number; cy?: number };
  /** Image source (for image fills). */
  imageUrl?: string;
  imageFit?: 'fill' | 'fit' | 'crop' | 'tile';
  /** Bound design token ID. */
  tokenId?: string;
}

/** A gradient color stop. */
export interface GradientStop {
  position: number;
  color: string;
}

/** A single stroke layer. */
export interface Stroke {
  type: 'solid' | 'gradient';
  visible: boolean;
  color?: string;
  width: number;
  align: 'inside' | 'outside' | 'center';
  dashPattern?: number[];
  cap?: 'none' | 'round' | 'square';
  join?: 'miter' | 'round' | 'bevel';
  gradientStops?: GradientStop[];
  tokenId?: string;
}

/** CSS blend mode for layer compositing. */
export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

/** A styled text segment (for mixed formatting within one text node). */
export interface TextSegment {
  start: number;
  end: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: 'normal' | 'italic';
  color?: string;
  textDecoration?: 'none' | 'underline' | 'strikethrough';
  letterSpacing?: number;
  lineHeight?: number;
  /** Hyperlink URL for this segment. */
  href?: string;
}

/** Figma-style vector network: vertices + segments + regions. */
export interface VectorNetwork {
  vertices: VectorVertex[];
  segments: VectorSegment[];
  /** Closed regions that receive fills. */
  regions: VectorRegion[];
}

export interface VectorVertex {
  x: number;
  y: number;
  /** Radius for rounded corners at this vertex. */
  cornerRadius?: number;
}

export interface VectorSegment {
  start: number;
  end: number;
  /** Cubic bezier tangent at start (relative to start vertex). */
  tangentStart?: Point;
  /** Cubic bezier tangent at end (relative to end vertex). */
  tangentEnd?: Point;
}

export interface VectorRegion {
  /** Ordered list of segment indices forming this closed region. */
  loops: number[][];
  /** Fill for this region. */
  fills?: Fill[];
}

/** Boolean operation type (applied to children of a boolean_operation element). */
export type BooleanOperation = 'union' | 'subtract' | 'intersect' | 'exclude';

export type EffectType = 'drop_shadow' | 'inner_shadow' | 'layer_blur' | 'background_blur';

/** A single visual effect in the element's effect stack. */
export interface Effect {
  type: EffectType;
  visible: boolean;
  /** For shadows: offset X. */
  x?: number;
  /** For shadows: offset Y. */
  y?: number;
  /** Blur radius. */
  blur: number;
  /** Shadow spread (drop_shadow/inner_shadow only). */
  spread?: number;
  /** Shadow/blur color. */
  color?: string;
}
