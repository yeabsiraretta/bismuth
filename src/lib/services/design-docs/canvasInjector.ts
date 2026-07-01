/**
 * Canvas Injector — takes a DesignDocument and creates/updates canvas elements
 * to represent it visually (inverse of extraction).
 *
 * Uses a grid-based layout system for clean, organized placement of
 * design document elements on the canvas. Elements are grouped by type
 * with section headers and consistent spacing.
 */

import type { DesignDocumentAny } from '@/types/design-documents';
import type { CanvasElement } from '@/features/canvas/types';
import type { TokenPayload } from '@/types/design-documents/token';
import type { ComponentPayload } from '@/types/design-documents/component';
import type { LayoutPayload } from '@/types/design-documents/layout';
import type { FlowPayload } from '@/types/design-documents/flow';

/** Layout constants for injected elements. */
const LAYOUT = {
  /** Padding from the page origin. */
  pageMargin: 64,
  /** Spacing between section header and first element. */
  sectionGap: 32,
  /** Vertical spacing between sections. */
  sectionSpacing: 120,
  /** Grid cell size for token swatches. */
  tokenCell: { width: 100, height: 80 },
  /** Number of token swatches per row. */
  tokenColumns: 5,
  /** Gap between token swatches in the grid. */
  tokenGap: 16,
  /** Component card dimensions. */
  componentCard: { width: 280, height: 180 },
  /** Variant card dimensions. */
  variantCard: { width: 200, height: 140 },
  /** Gap between component cards. */
  componentGap: 24,
  /** Section header frame dimensions. */
  sectionHeader: { width: 200, height: 36 },
} as const;

/** Minimal canvas element blueprint for injection (subset of CanvasElement fields). */
export interface CanvasElementBlueprint {
  name: string;
  element_type: CanvasElement['element_type'];
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Partial<CanvasElement['properties']>;
}

/** Result of injecting a document into canvas representation. */
export interface InjectionResult {
  elements: CanvasElementBlueprint[];
  pageTarget: string;
}

/** Inject a design document into canvas element representations. */
export function injectToCanvas(doc: DesignDocumentAny): InjectionResult {
  switch (doc.document_type) {
    case 'token':
      return injectTokenDocument(doc.payload as TokenPayload);
    case 'component':
      return injectComponentDocument(doc.payload as ComponentPayload);
    case 'layout':
      return injectLayoutDocument(doc.payload as LayoutPayload);
    case 'flow':
      return injectFlowDocument(doc.payload as FlowPayload);
    default:
      return { elements: [], pageTarget: '' };
  }
}

/** Create a section header label element. */
function createSectionHeader(label: string, x: number, y: number): CanvasElementBlueprint {
  return {
    name: `[design:section-header] ${label}`,
    element_type: 'text',
    x,
    y,
    width: LAYOUT.sectionHeader.width,
    height: LAYOUT.sectionHeader.height,
    properties: {
      text: label,
      fontSize: 18,
      fontWeight: 600,
    },
  };
}

/** Inject token document as organized color swatch grid with collection headers. */
function injectTokenDocument(payload: TokenPayload): InjectionResult {
  const elements: CanvasElementBlueprint[] = [];
  let cursorY = LAYOUT.pageMargin;

  for (const collection of payload.collections) {
    // Section header for each collection
    elements.push(createSectionHeader(collection.name, LAYOUT.pageMargin, cursorY));
    cursorY += LAYOUT.sectionHeader.height + LAYOUT.sectionGap;

    // Grid layout for tokens within the collection
    const tokens = collection.tokens;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const col = i % LAYOUT.tokenColumns;
      const row = Math.floor(i / LAYOUT.tokenColumns);

      const x = LAYOUT.pageMargin + col * (LAYOUT.tokenCell.width + LAYOUT.tokenGap);
      const y = cursorY + row * (LAYOUT.tokenCell.height + LAYOUT.tokenGap);

      elements.push({
        name: `[design:token-swatch:${collection.name}] ${token.name}`,
        element_type: 'frame',
        x,
        y,
        width: LAYOUT.tokenCell.width,
        height: LAYOUT.tokenCell.height,
        properties: {
          fill: token.type === 'color' ? String(token.values['default'] || token.values['light'] || '') : undefined,
        },
      });
    }

    // Advance cursor past the grid rows
    const rows = Math.ceil(tokens.length / LAYOUT.tokenColumns);
    cursorY += rows * (LAYOUT.tokenCell.height + LAYOUT.tokenGap) + LAYOUT.sectionSpacing;
  }

  return { elements, pageTarget: 'Tokens' };
}

/** Inject component document as organized card layout with variants. */
function injectComponentDocument(payload: ComponentPayload): InjectionResult {
  const elements: CanvasElementBlueprint[] = [];
  const startX = LAYOUT.pageMargin;
  let cursorY = LAYOUT.pageMargin;

  // Component header
  elements.push(createSectionHeader(payload.component_name, startX, cursorY));
  cursorY += LAYOUT.sectionHeader.height + LAYOUT.sectionGap;

  // Main component frame
  elements.push({
    name: `[design:component] ${payload.component_name}`,
    element_type: 'frame',
    x: startX,
    y: cursorY,
    width: LAYOUT.componentCard.width,
    height: LAYOUT.componentCard.height,
    properties: {},
  });

  // Variant frames in a row next to the component
  if (payload.variants.length > 0) {
    let variantX = startX + LAYOUT.componentCard.width + LAYOUT.componentGap * 2;
    for (const variant of payload.variants) {
      elements.push({
        name: `[design:variant:${payload.component_name}] ${variant.name}`,
        element_type: 'frame',
        x: variantX,
        y: cursorY + (LAYOUT.componentCard.height - LAYOUT.variantCard.height) / 2,
        width: LAYOUT.variantCard.width,
        height: LAYOUT.variantCard.height,
        properties: {},
      });
      variantX += LAYOUT.variantCard.width + LAYOUT.componentGap;
    }
  }

  return { elements, pageTarget: 'Components' };
}

/** Inject layout document as annotated wireframe. */
function injectLayoutDocument(payload: LayoutPayload): InjectionResult {
  const elements: CanvasElementBlueprint[] = [];
  const startX = LAYOUT.pageMargin;
  let cursorY = LAYOUT.pageMargin;

  // Section header
  elements.push(createSectionHeader(payload.layout_name, startX, cursorY));
  cursorY += LAYOUT.sectionHeader.height + LAYOUT.sectionGap;

  // Layout container frame
  elements.push({
    name: `[design:layout] ${payload.layout_name}`,
    element_type: 'frame',
    x: startX,
    y: cursorY,
    width: 400,
    height: 300,
    properties: {},
  });

  // Region frames inside the layout
  if (payload.regions) {
    const regionX = startX + 16;
    let regionY = cursorY + 48;
    for (const region of payload.regions) {
      elements.push({
        name: `[design:layout-region] ${region.name}`,
        element_type: 'frame',
        x: regionX,
        y: regionY,
        width: 180,
        height: 80,
        properties: {},
      });
      regionY += 96;
    }
  }

  return { elements, pageTarget: 'Layouts' };
}

/** Inject flow document as connected screen nodes. */
function injectFlowDocument(payload: FlowPayload): InjectionResult {
  const elements: CanvasElementBlueprint[] = [];
  const startX = LAYOUT.pageMargin;
  let cursorY = LAYOUT.pageMargin;

  // Section header
  elements.push(createSectionHeader(payload.flow_name, startX, cursorY));
  cursorY += LAYOUT.sectionHeader.height + LAYOUT.sectionGap;

  // Place flow steps in a horizontal sequence
  const steps = payload.steps || [];
  let stepX = startX;
  for (const step of steps) {
    elements.push({
      name: `[design:flow-step] ${step.screen}`,
      element_type: 'frame',
      x: stepX,
      y: cursorY,
      width: 160,
      height: 120,
      properties: {},
    });
    stepX += 200;
  }

  return { elements, pageTarget: 'Flows' };
}
