/**
 * Canvas Node Styles — flowchart shapes, border styles, text alignment.
 *
 * Inspired by obsidian-advanced-canvas by Developer-Mike.
 * Pure functions, no side effects.
 */

// ── Node shapes ──────────────────────────────────────────────────────────────

export type NodeShape =
  | 'rectangle'
  | 'terminal'
  | 'process'
  | 'decision'
  | 'io'
  | 'predefined-process'
  | 'document'
  | 'database'
  | 'pill';

export const ALL_NODE_SHAPES: NodeShape[] = [
  'rectangle',
  'terminal',
  'process',
  'decision',
  'io',
  'predefined-process',
  'document',
  'database',
  'pill',
];

interface NodeShapeMeta {
  label: string;
  icon: string;
}

const NODE_SHAPE_META: Record<NodeShape, NodeShapeMeta> = {
  rectangle: { label: 'Rectangle', icon: 'square' },
  terminal: { label: 'Terminal', icon: 'octagon' },
  process: { label: 'Process', icon: 'box' },
  decision: { label: 'Decision', icon: 'diamond' },
  io: { label: 'Input/Output', icon: 'parallelogram' },
  'predefined-process': { label: 'Predefined Process', icon: 'box' },
  document: { label: 'Document', icon: 'file' },
  database: { label: 'Database', icon: 'database' },
  pill: { label: 'Pill', icon: 'pill' },
};

// ── SVG clip-path generators ─────────────────────────────────────────────────

function getShapeClipPath(shape: NodeShape, w: number, h: number): string | null {
  switch (shape) {
    case 'rectangle':
    case 'process':
      return null;
    case 'terminal':
      return `M ${h / 2} 0 L ${w - h / 2} 0 A ${h / 2} ${h / 2} 0 0 1 ${w - h / 2} ${h} L ${h / 2} ${h} A ${h / 2} ${h / 2} 0 0 1 ${h / 2} 0 Z`;
    case 'decision': {
      const cx = w / 2;
      const cy = h / 2;
      return `M ${cx} 0 L ${w} ${cy} L ${cx} ${h} L 0 ${cy} Z`;
    }
    case 'io': {
      const skew = w * 0.15;
      return `M ${skew} 0 L ${w} 0 L ${w - skew} ${h} L 0 ${h} Z`;
    }
    case 'predefined-process': {
      const inset = w * 0.1;
      return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z M ${inset} 0 L ${inset} ${h} M ${w - inset} 0 L ${w - inset} ${h}`;
    }
    case 'document': {
      const curl = h * 0.15;
      return `M 0 0 L ${w} 0 L ${w} ${h - curl} Q ${w * 0.75} ${h - curl * 2} ${w / 2} ${h - curl} Q ${w * 0.25} ${h} 0 ${h - curl} Z`;
    }
    case 'database': {
      const ry = h * 0.12;
      return `M 0 ${ry} A ${w / 2} ${ry} 0 0 1 ${w} ${ry} L ${w} ${h - ry} A ${w / 2} ${ry} 0 0 1 0 ${h - ry} Z`;
    }
    case 'pill':
      return `M ${h / 2} 0 L ${w - h / 2} 0 A ${h / 2} ${h / 2} 0 0 1 ${w - h / 2} ${h} L ${h / 2} ${h} A ${h / 2} ${h / 2} 0 0 1 ${h / 2} 0 Z`;
  }
}

function getShapeSVG(shape: NodeShape, w: number, h: number): string {
  const fill = 'var(--fill, transparent)';
  const stroke = 'var(--stroke, var(--color-border))';
  const sw = 'var(--stroke-width, 1.5)';

  switch (shape) {
    case 'rectangle':
    case 'process':
      return `<rect width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
    case 'terminal':
    case 'pill': {
      const r = h / 2;
      return `<rect width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
    }
    case 'decision': {
      const cx = w / 2;
      const cy = h / 2;
      return `<polygon points="${cx},0 ${w},${cy} ${cx},${h} 0,${cy}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
    }
    case 'io': {
      const skew = w * 0.15;
      return `<polygon points="${skew},0 ${w},0 ${w - skew},${h} 0,${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
    }
    case 'predefined-process': {
      const inset = w * 0.1;
      return `<rect width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" /><line x1="${inset}" y1="0" x2="${inset}" y2="${h}" stroke="${stroke}" stroke-width="${sw}" /><line x1="${w - inset}" y1="0" x2="${w - inset}" y2="${h}" stroke="${stroke}" stroke-width="${sw}" />`;
    }
    case 'document': {
      const curl = h * 0.15;
      return `<path d="M 0 0 L ${w} 0 L ${w} ${h - curl} Q ${w * 0.75} ${h - curl * 2} ${w / 2} ${h - curl} Q ${w * 0.25} ${h} 0 ${h - curl} Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
    }
    case 'database': {
      const ry = h * 0.12;
      return `<path d="M 0 ${ry} A ${w / 2} ${ry} 0 0 1 ${w} ${ry} L ${w} ${h - ry} A ${w / 2} ${ry} 0 0 1 0 ${h - ry} Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" /><ellipse cx="${w / 2}" cy="${ry}" rx="${w / 2}" ry="${ry}" fill="none" stroke="${stroke}" stroke-width="${sw}" />`;
    }
  }
}

// ── Border styles ────────────────────────────────────────────────────────────

export type BorderStyle = 'solid' | 'dotted' | 'dashed' | 'invisible';

export const ALL_BORDER_STYLES: BorderStyle[] = ['solid', 'dotted', 'dashed', 'invisible'];

function getBorderDash(style: BorderStyle): string {
  switch (style) {
    case 'solid':
      return 'none';
    case 'dotted':
      return '2 4';
    case 'dashed':
      return '8 4';
    case 'invisible':
      return 'none';
  }
}

function getBorderCSS(style: BorderStyle): string {
  switch (style) {
    case 'solid':
      return 'solid';
    case 'dotted':
      return 'dotted';
    case 'dashed':
      return 'dashed';
    case 'invisible':
      return 'none';
  }
}

// ── Text alignment ───────────────────────────────────────────────────────────

export type NodeTextAlign = 'left' | 'center' | 'right';

export const ALL_TEXT_ALIGNS: NodeTextAlign[] = ['left', 'center', 'right'];
