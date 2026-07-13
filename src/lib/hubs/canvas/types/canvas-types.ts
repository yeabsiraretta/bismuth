import type {
  AutoLayoutConfig,
  ChildLayoutOverride,
  Constraints,
} from '@/hubs/canvas/services/canvas-auto-layout';
import { DEFAULT_CONSTRAINTS } from '@/hubs/canvas/services/canvas-auto-layout';
import type {
  BorderStyle,
  NodeShape,
  NodeTextAlign,
} from '@/hubs/canvas/services/canvas-node-styles';

// ── Style types ───────────────────────────────────────────────────

export interface FillStyle {
  color: string;
  opacity: number;
}

export interface StrokeStyle {
  color: string;
  width: number;
  dash: number[];
}

export const DEFAULT_FILL: FillStyle = { color: '#4a90d9', opacity: 1 };
export const DEFAULT_STROKE: StrokeStyle = { color: '#374151', width: 1.5, dash: [] };
const NO_FILL: FillStyle = { color: 'transparent', opacity: 0 };
const NO_STROKE: StrokeStyle = { color: 'transparent', width: 0, dash: [] };

// ── Element kinds ─────────────────────────────────────────────────

type CanvasElementKind =
  | 'card'
  | 'rect'
  | 'ellipse'
  | 'text'
  | 'line'
  | 'image'
  | 'note'
  | 'group'
  | 'frame'
  | 'component'
  | 'instance'
  | 'vector';

// ── Base ──────────────────────────────────────────────────────────

interface CanvasElementBase {
  id: string;
  kind: CanvasElementKind;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  layerId: string;
  zIndex: number;
}

// ── Kind-specific interfaces ──────────────────────────────────────

export interface CardElement extends CanvasElementBase {
  kind: 'card';
  title: string;
  content: string;
  color: string;
  shape: NodeShape;
  borderStyle: BorderStyle;
  textAlign: NodeTextAlign;
}

export interface RectElement extends CanvasElementBase {
  kind: 'rect';
  fill: FillStyle;
  stroke: StrokeStyle;
  cornerRadius: number;
}

export interface EllipseElement extends CanvasElementBase {
  kind: 'ellipse';
  fill: FillStyle;
  stroke: StrokeStyle;
}

export interface TextElement extends CanvasElementBase {
  kind: 'text';
  text: string;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  textColor: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
}

export interface LineElement extends CanvasElementBase {
  kind: 'line';
  x2: number;
  y2: number;
  stroke: StrokeStyle;
  startMarker: 'none' | 'arrow';
  endMarker: 'none' | 'arrow';
}

export interface ImageElement extends CanvasElementBase {
  kind: 'image';
  src: string;
  fit: 'fill' | 'contain' | 'cover';
}

export interface NoteElement extends CanvasElementBase {
  kind: 'note';
  notePath: string;
  title: string;
  content: string;
  color: string;
  shape: NodeShape;
  borderStyle: BorderStyle;
  textAlign: NodeTextAlign;
}

export interface GroupElement extends CanvasElementBase {
  kind: 'group';
  childIds: string[];
  collapsed: boolean;
  label: string;
}

export interface FrameElement extends CanvasElementBase {
  kind: 'frame';
  label: string;
  childIds: string[];
  autoLayout: AutoLayoutConfig | null;
  childOverrides: ChildLayoutOverride[];
  constraints: Constraints;
  clipContent: boolean;
  fill: FillStyle;
  stroke: StrokeStyle;
  cornerRadius: number;
}

export interface ComponentElement extends CanvasElementBase {
  kind: 'component';
  label: string;
  childIds: string[];
  autoLayout: AutoLayoutConfig | null;
  childOverrides: ChildLayoutOverride[];
  constraints: Constraints;
  clipContent: boolean;
  fill: FillStyle;
  stroke: StrokeStyle;
  cornerRadius: number;
  description: string;
}

interface InstanceElement extends CanvasElementBase {
  kind: 'instance';
  componentId: string;
  overrides: Record<string, Partial<CanvasElementBase>>;
  detached: boolean;
}

export interface VectorPathSegment {
  type: 'M' | 'L' | 'C' | 'Q' | 'Z';
  x: number;
  y: number;
  cx1?: number;
  cy1?: number;
  cx2?: number;
  cy2?: number;
}

export interface VectorElement extends CanvasElementBase {
  kind: 'vector';
  paths: VectorPathSegment[][];
  fill: FillStyle;
  stroke: StrokeStyle;
  closed: boolean;
  windingRule: 'nonzero' | 'evenodd';
}

// ── Discriminated union ───────────────────────────────────────────

export type CanvasElement =
  | CardElement
  | RectElement
  | EllipseElement
  | TextElement
  | LineElement
  | ImageElement
  | NoteElement
  | GroupElement
  | FrameElement
  | ComponentElement
  | InstanceElement
  | VectorElement;

// ── Factory functions ─────────────────────────────────────────────

let nextZIndex = 0;

function baseDefaults(
  kind: CanvasElementKind,
  overrides?: Partial<CanvasElementBase>
): CanvasElementBase {
  return {
    id: overrides?.id ?? crypto.randomUUID(),
    kind,
    name: overrides?.name ?? '',
    x: overrides?.x ?? 0,
    y: overrides?.y ?? 0,
    width: overrides?.width ?? 200,
    height: overrides?.height ?? 150,
    rotation: overrides?.rotation ?? 0,
    opacity: overrides?.opacity ?? 1,
    locked: overrides?.locked ?? false,
    layerId: overrides?.layerId ?? 'default',
    zIndex: overrides?.zIndex ?? nextZIndex++,
  };
}

export function createCard(overrides?: Partial<CardElement>): CardElement {
  return {
    ...baseDefaults('card', overrides),
    kind: 'card',
    title: overrides?.title ?? 'Card',
    content: overrides?.content ?? '',
    color: overrides?.color ?? '#4a90d9',
    shape: overrides?.shape ?? 'rectangle',
    borderStyle: overrides?.borderStyle ?? 'solid',
    textAlign: overrides?.textAlign ?? 'left',
  };
}

export function createRect(overrides?: Partial<RectElement>): RectElement {
  return {
    ...baseDefaults('rect', overrides),
    kind: 'rect',
    fill: overrides?.fill ?? { ...DEFAULT_FILL },
    stroke: overrides?.stroke ?? { ...DEFAULT_STROKE },
    cornerRadius: overrides?.cornerRadius ?? 0,
  };
}

export function createEllipse(overrides?: Partial<EllipseElement>): EllipseElement {
  return {
    ...baseDefaults('ellipse', overrides),
    kind: 'ellipse',
    fill: overrides?.fill ?? { ...DEFAULT_FILL },
    stroke: overrides?.stroke ?? { ...DEFAULT_STROKE },
  };
}

export function createText(overrides?: Partial<TextElement>): TextElement {
  return {
    ...baseDefaults('text', overrides),
    kind: 'text',
    width: overrides?.width ?? 200,
    height: overrides?.height ?? 40,
    text: overrides?.text ?? 'Text',
    fontSize: overrides?.fontSize ?? 16,
    fontWeight: overrides?.fontWeight ?? 400,
    fontFamily: overrides?.fontFamily ?? 'inherit',
    textColor: overrides?.textColor ?? 'var(--color-text)',
    textAlign: overrides?.textAlign ?? 'left',
    lineHeight: overrides?.lineHeight ?? 1.4,
  };
}

export function createLine(overrides?: Partial<LineElement>): LineElement {
  return {
    ...baseDefaults('line', overrides),
    kind: 'line',
    width: overrides?.width ?? 0,
    height: overrides?.height ?? 0,
    x2: overrides?.x2 ?? 200,
    y2: overrides?.y2 ?? 0,
    stroke: overrides?.stroke ?? { ...DEFAULT_STROKE },
    startMarker: overrides?.startMarker ?? 'none',
    endMarker: overrides?.endMarker ?? 'none',
  };
}

export function createImage(overrides?: Partial<ImageElement>): ImageElement {
  return {
    ...baseDefaults('image', overrides),
    kind: 'image',
    src: overrides?.src ?? '',
    fit: overrides?.fit ?? 'cover',
  };
}

export function createNote(overrides?: Partial<NoteElement>): NoteElement {
  return {
    ...baseDefaults('note', overrides),
    kind: 'note',
    notePath: overrides?.notePath ?? '',
    title: overrides?.title ?? 'Note',
    content: overrides?.content ?? '',
    color: overrides?.color ?? '#10b981',
    shape: overrides?.shape ?? 'rectangle',
    borderStyle: overrides?.borderStyle ?? 'solid',
    textAlign: overrides?.textAlign ?? 'left',
  };
}

export function createGroup(overrides?: Partial<GroupElement>): GroupElement {
  return {
    ...baseDefaults('group', overrides),
    kind: 'group',
    childIds: overrides?.childIds ?? [],
    collapsed: overrides?.collapsed ?? false,
    label: overrides?.label ?? '',
  };
}

export function createFrame(overrides?: Partial<FrameElement>): FrameElement {
  return {
    ...baseDefaults('frame', overrides),
    kind: 'frame',
    width: overrides?.width ?? 320,
    height: overrides?.height ?? 240,
    label: overrides?.label ?? 'Frame',
    childIds: overrides?.childIds ?? [],
    autoLayout: overrides?.autoLayout ?? null,
    childOverrides: overrides?.childOverrides ?? [],
    constraints: overrides?.constraints ?? { ...DEFAULT_CONSTRAINTS },
    clipContent: overrides?.clipContent ?? true,
    fill: overrides?.fill ?? { color: '#ffffff', opacity: 1 },
    stroke: overrides?.stroke ?? { ...DEFAULT_STROKE },
    cornerRadius: overrides?.cornerRadius ?? 0,
  };
}

export function createComponent(overrides?: Partial<ComponentElement>): ComponentElement {
  return {
    ...baseDefaults('component', overrides),
    kind: 'component',
    width: overrides?.width ?? 320,
    height: overrides?.height ?? 240,
    label: overrides?.label ?? 'Component',
    childIds: overrides?.childIds ?? [],
    autoLayout: overrides?.autoLayout ?? null,
    childOverrides: overrides?.childOverrides ?? [],
    constraints: overrides?.constraints ?? { ...DEFAULT_CONSTRAINTS },
    clipContent: overrides?.clipContent ?? true,
    fill: overrides?.fill ?? { color: '#ffffff', opacity: 1 },
    stroke: overrides?.stroke ?? { color: '#7c3aed', width: 2, dash: [] },
    cornerRadius: overrides?.cornerRadius ?? 0,
    description: overrides?.description ?? '',
  };
}

function createInstance(overrides?: Partial<InstanceElement>): InstanceElement {
  return {
    ...baseDefaults('instance', overrides),
    kind: 'instance',
    componentId: overrides?.componentId ?? '',
    overrides: overrides?.overrides ?? {},
    detached: overrides?.detached ?? false,
  };
}

export function createVector(overrides?: Partial<VectorElement>): VectorElement {
  return {
    ...baseDefaults('vector', overrides),
    kind: 'vector',
    width: overrides?.width ?? 100,
    height: overrides?.height ?? 100,
    paths: overrides?.paths ?? [],
    fill: overrides?.fill ?? { ...NO_FILL },
    stroke: overrides?.stroke ?? { ...DEFAULT_STROKE },
    closed: overrides?.closed ?? false,
    windingRule: overrides?.windingRule ?? 'nonzero',
  };
}
