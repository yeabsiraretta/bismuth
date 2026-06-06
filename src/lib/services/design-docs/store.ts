/**
 * Design Document Store — CRUD operations for design documents as JSON files.
 * Operates on `.bismuth/design-docs/` directory.
 */

import { invoke } from '@tauri-apps/api/core';
import type { DesignDocument, DocumentType, DesignDocumentMeta, DesignDocumentAny } from '@/types/design-documents';
import { saveVersion } from './versionStore';
import { log } from '@/utils/logger';

const BASE_DIR = '.bismuth/design-docs';

/** Get the subdirectory for a document type. */
function getTypeDir(type: DocumentType): string {
  const dirs: Record<DocumentType, string> = {
    token: '',
    component: 'components',
    layout: 'layouts',
    flow: 'flows',
    theme: 'themes',
    page: 'pages',
  };
  return dirs[type];
}

/** Get file path for a document. */
function getFilePath(type: DocumentType, id: string): string {
  const dir = getTypeDir(type);
  if (type === 'token') return `${BASE_DIR}/tokens.json`;
  return `${BASE_DIR}/${dir}/${id}.json`;
}

/** Read a design document by type and ID. */
export async function readDocument<T>(type: DocumentType, id: string): Promise<DesignDocument<T> | null> {
  try {
    const path = getFilePath(type, id);
    const text = await invoke<string>('design_doc_read', { path });
    return JSON.parse(text) as DesignDocument<T>;
  } catch {
    return null;
  }
}

/** Write a design document to the store. Auto-saves version history. */
export async function writeDocument(doc: DesignDocumentAny): Promise<boolean> {
  try {
    const path = getFilePath(doc.document_type, doc.document_id);
    const versionedDoc = { ...doc, modified_at: new Date().toISOString(), version: doc.version + 1 };
    const content = JSON.stringify(versionedDoc, null, 2);
    await invoke('design_doc_write', { path, content });
    await saveVersion(versionedDoc);
    log.info('Design doc written', { type: doc.document_type, id: doc.document_id });
    return true;
  } catch (error) {
    log.error('Failed to write design doc', error as Error);
    return false;
  }
}

/** List all documents, optionally filtered by type. */
export async function listDocuments(type?: DocumentType): Promise<DesignDocumentMeta[]> {
  try {
    return await invoke<DesignDocumentMeta[]>('design_doc_list', { basePath: BASE_DIR, docType: type ?? null });
  } catch {
    return [];
  }
}

/** Delete a document by type and ID. */
export async function deleteDocument(type: DocumentType, id: string): Promise<boolean> {
  try {
    const path = getFilePath(type, id);
    await invoke('design_doc_delete', { path });
    log.info('Design doc deleted', { type, id });
    return true;
  } catch (error) {
    log.error('Failed to delete design doc', error as Error);
    return false;
  }
}
