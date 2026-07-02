/**
 * Design Document envelope — shared structure wrapping all document payloads.
 */

/** Document type discriminator. */
export type DocumentType = 'token' | 'component' | 'layout' | 'flow' | 'theme' | 'page';

/** Canvas source reference linking a document back to its canvas origin. */
export interface CanvasSource {
  document_id: string;
  page_id: string;
  frame_ids: string[];
}

/** Generic design document envelope. All documents share this structure. */
export interface DesignDocument<T> {
  schema_version: string;
  document_type: DocumentType;
  document_id: string;
  name: string;
  canvas_source: CanvasSource;
  created_at: string;
  modified_at: string;
  version: number;
  payload: T;
}

/** Metadata subset for listing documents without full payload. */
export interface DesignDocumentMeta {
  document_type: DocumentType;
  document_id: string;
  name: string;
  version: number;
  modified_at: string;
}
