/**
 * Version Store — tracks document version history with rollback capability.
 */

import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';
import type { DocumentType, DesignDocumentAny } from '@/types/design-documents';

/** Version history entry. */
export interface VersionEntry {
  version: number;
  timestamp: string;
  payload: unknown;
}

/** Version history for a single document. */
export interface DocumentHistory {
  document_type: DocumentType;
  document_id: string;
  versions: VersionEntry[];
}

const BASE_DIR = '.bismuth/design-docs/.versions';

/** Save a new version entry for a document. */
export async function saveVersion(doc: DesignDocumentAny): Promise<void> {
  const entry: VersionEntry = {
    version: doc.version,
    timestamp: new Date().toISOString(),
    payload: doc.payload,
  };
  const path = `${BASE_DIR}/${doc.document_type}/${doc.document_id}.json`;
  try {
    // Read existing history
    let history: DocumentHistory;
    try {
      const text = await invoke<string>('design_doc_read', { path });
      history = JSON.parse(text);
      history.versions.push(entry);
    } catch {
      history = {
        document_type: doc.document_type,
        document_id: doc.document_id,
        versions: [entry],
      };
    }
    // Write updated history
    const content = JSON.stringify(history, null, 2);
    await invoke('design_doc_write', { path, content });
  } catch (error) {
    log.error('Failed to save version', error);
  }
}

/** List all versions for a document. */
export async function listVersions(type: DocumentType, id: string): Promise<VersionEntry[]> {
  const path = `${BASE_DIR}/${type}/${id}.json`;
  try {
    const text = await invoke<string>('design_doc_read', { path });
    const history: DocumentHistory = JSON.parse(text);
    return history.versions;
  } catch {
    return [];
  }
}

/** Get a specific version's payload. */
export async function getVersion(
  type: DocumentType,
  id: string,
  version: number
): Promise<unknown | null> {
  const versions = await listVersions(type, id);
  const entry = versions.find((v) => v.version === version);
  return entry?.payload || null;
}

/** Rollback to a previous version (returns the payload to restore). */
export async function rollbackToVersion(
  type: DocumentType,
  id: string,
  version: number
): Promise<unknown | null> {
  return getVersion(type, id, version);
}
