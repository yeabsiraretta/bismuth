/**
 * Document Generator orchestrator — transforms a CanvasDocument into design documents.
 */

import type { CanvasDocument } from '@/features/canvas/types';
import type { DesignDocumentAny } from '@/types/design-documents';
import type { FlowPayload } from '@/types/design-documents/flow';
import type { ThemePayload } from '@/types/design-documents/theme';
import { createDocumentEnvelope } from '@/services/design-docs/envelope';
import { extractTokens } from './tokenExtractor';
import { extractComponent } from './componentExtractor';
import { extractLayout } from './layoutExtractor';
import { extractFlow } from './flowExtractor';
import { extractTheme } from './themeExtractor';
import { extractPage } from './pageExtractor';
import { filterByDesignTag } from './tagging';

/** Find a page ID by keyword match on page name. */
function findPageId(pages: CanvasDocument['pages'], keyword: string): string {
  return pages.find((p) => p.name.toLowerCase().includes(keyword))?.id || '';
}

/** Create an envelope with canvas source context. */
function envelope<T>(
  type: Parameters<typeof createDocumentEnvelope<T>>[0],
  id: string,
  name: string,
  canvasDoc: CanvasDocument,
  pageId: string,
  payload: T
) {
  return createDocumentEnvelope<T>(type, id, name, payload, {
    canvasSource: { document_id: canvasDoc.id, page_id: pageId, frame_ids: [] },
  });
}

/** Generate all design documents from a canvas document. */
export function generateDocuments(canvasDoc: CanvasDocument): DesignDocumentAny[] {
  const docs: DesignDocumentAny[] = [];
  const tokensPageId = findPageId(canvasDoc.pages, 'token');
  const componentsPageId = findPageId(canvasDoc.pages, 'component');
  const layoutsPageId = findPageId(canvasDoc.pages, 'layout');
  const flowsPageId = findPageId(canvasDoc.pages, 'flow');
  const pagesPageId = findPageId(canvasDoc.pages, 'page');

  // Token document
  if (canvasDoc.variables.length > 0) {
    const tokenPayload = extractTokens(canvasDoc.variables);
    docs.push(envelope('token', 'tok_001', `${canvasDoc.name} Tokens`, canvasDoc, tokensPageId, tokenPayload));
  }

  // Component documents
  for (const def of canvasDoc.components) {
    const payload = extractComponent(def, canvasDoc.elements);
    docs.push(envelope('component', `comp_${def.id}`, def.name, canvasDoc, componentsPageId, payload));
  }

  // Layout document
  const layoutPayload = extractLayout(canvasDoc.elements);
  if (layoutPayload) {
    docs.push(envelope('layout', `layout_${layoutPayload.layout_name}`, layoutPayload.layout_name, canvasDoc, layoutsPageId, layoutPayload));
  }

  // Flow documents
  if (canvasDoc.flowLinks && canvasDoc.flowLinks.length > 0) {
    const flowPayload = extractFlow(canvasDoc.flowLinks, canvasDoc.elements, canvasDoc.name);
    docs.push(envelope<FlowPayload>('flow', `flow_${canvasDoc.id}`, `${canvasDoc.name} Flow`, canvasDoc, flowsPageId, flowPayload));
  }

  // Theme document (dark mode)
  const themePayload = extractTheme(canvasDoc.variables, 'Dark', 'tok_001');
  if (themePayload) {
    docs.push(envelope<ThemePayload>('theme', 'theme_dark', 'Dark Theme', canvasDoc, tokensPageId, themePayload));
  }

  // Page documents
  const pageElements = filterByDesignTag(canvasDoc.elements, 'page-composition');
  if (pageElements.length > 0) {
    const pagePayload = extractPage(canvasDoc.elements, canvasDoc.name, layoutPayload?.layout_name || 'default');
    if (pagePayload) {
      docs.push(envelope('page', `page_${canvasDoc.id}`, `${canvasDoc.name} Page`, canvasDoc, pagesPageId, pagePayload));
    }
  }

  return docs;
}

export { extractTokens } from './tokenExtractor';
export { extractComponent } from './componentExtractor';
export { extractLayout } from './layoutExtractor';
export { extractFlow } from './flowExtractor';
export { extractTheme } from './themeExtractor';
export { extractPage } from './pageExtractor';
export { getDesignSourceTag, isDesignSource, filterByDesignTag } from './tagging';
