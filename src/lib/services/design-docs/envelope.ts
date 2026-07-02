/**
 * Shared envelope factory for design documents.
 * Used by both document generators and code reflectors.
 */

import type { DesignDocument, CanvasSource } from '@/types/design-documents';

/** Options for creating a document envelope. */
export interface EnvelopeOptions {
  canvasSource?: CanvasSource;
}

/** Create a DesignDocument envelope wrapping a payload. */
export function createDocumentEnvelope<T>(
  type: DesignDocument<T>['document_type'],
  id: string,
  name: string,
  payload: T,
  options?: EnvelopeOptions
): DesignDocument<T> {
  const now = new Date().toISOString();
  return {
    schema_version: '1.0.0',
    document_type: type,
    document_id: id,
    name,
    canvas_source: options?.canvasSource ?? { document_id: '', page_id: '', frame_ids: [] },
    created_at: now,
    modified_at: now,
    version: 1,
    payload,
  };
}
