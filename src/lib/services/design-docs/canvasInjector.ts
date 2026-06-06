/**
 * Canvas Injector — takes a DesignDocument and creates/updates canvas elements
 * to represent it visually (inverse of extraction).
 */

import type { DesignDocumentAny } from '@/types/design-documents';
import type { CanvasElement } from '@/types/canvas';
import type { TokenPayload } from '@/types/design-documents/token';
import type { ComponentPayload } from '@/types/design-documents/component';

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
    default:
      return { elements: [], pageTarget: '' };
  }
}

/** Inject token document as color swatch frames. */
function injectTokenDocument(payload: TokenPayload): InjectionResult {
  const elements: CanvasElementBlueprint[] = [];
  let y = 0;

  for (const collection of payload.collections) {
    for (const token of collection.tokens) {
      elements.push({
        name: `[design:token-swatch:${collection.name}] ${token.name}`,
        element_type: 'frame',
        x: 0,
        y,
        width: 120,
        height: 60,
        properties: {
          fill: token.type === 'color' ? String(token.values.default || token.values.light || '') : undefined,
        },
      });
      y += 80;
    }
  }

  return { elements, pageTarget: 'Tokens' };
}

/** Inject component document as component frame with props annotation. */
function injectComponentDocument(payload: ComponentPayload): InjectionResult {
  const elements: CanvasElementBlueprint[] = [];

  elements.push({
    name: `[design:component] ${payload.component_name}`,
    element_type: 'frame',
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    properties: {},
  });

  // Add variant frames
  let x = 320;
  for (const variant of payload.variants) {
    elements.push({
      name: `[design:variant:${payload.component_name}] ${variant.name}`,
      element_type: 'frame',
      x,
      y: 0,
      width: 200,
      height: 150,
      properties: {},
    });
    x += 220;
  }

  return { elements, pageTarget: 'Components' };
}
