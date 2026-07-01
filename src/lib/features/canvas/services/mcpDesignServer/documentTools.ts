/**
 * MCP Document Tools — handlers for design document CRUD via MCP protocol.
 */

import type { DocumentType, DesignDocumentMeta, DesignDocumentAny } from '@/types/design-documents';
import { readDocument, writeDocument, listDocuments } from '@/services/design-docs';
import { validateDocument } from '@/services/design-docs/validation';

/** MCP tool: get_design_document — retrieve a specific document by type and ID. */
export async function handleGetDesignDocument(args: {
  type: DocumentType;
  id: string;
}): Promise<{ success: boolean; document?: unknown; error?: string }> {
  const doc = await readDocument(args.type, args.id);
  if (!doc) {
    return { success: false, error: `Document not found: ${args.type}/${args.id}` };
  }
  return { success: true, document: doc };
}

/** MCP tool: list_design_documents — list all documents optionally filtered by type. */
export async function handleListDesignDocuments(args: {
  type?: DocumentType;
}): Promise<{ success: boolean; documents: DesignDocumentMeta[] }> {
  const documents = await listDocuments(args.type);
  return { success: true, documents };
}

/** MCP tool: put_design_document — write a document (for code→canvas sync). */
export async function handlePutDesignDocument(args: {
  document: unknown;
}): Promise<{ success: boolean; error?: string }> {
  const validation = validateDocument(args.document);
  if (!validation.valid) {
    return { success: false, error: `Validation failed: ${validation.errors.join(', ')}` };
  }
  const written = await writeDocument(args.document as DesignDocumentAny);
  return { success: written, error: written ? undefined : 'Write failed' };
}

/** MCP tool: diff_design_document — compute diff between document versions. */
export async function handleDiffDesignDocument(args: {
  type: DocumentType;
  id: string;
  version_a?: number;
  version_b?: number;
}): Promise<{ success: boolean; diff?: unknown; error?: string }> {
  const doc = await readDocument(args.type, args.id);
  if (!doc) {
    return { success: false, error: `Document not found: ${args.type}/${args.id}` };
  }
  // For now, return the current document as the diff target
  // Full version diffing will be implemented with versionStore (Phase 6)
  return { success: true, diff: { current_version: doc.version, payload: doc.payload } };
}

/** MCP tool: sync_design_state — trigger full sync pipeline. */
export async function handleSyncDesignState(args: {
  direction: 'canvas_to_code' | 'code_to_canvas';
}): Promise<{ success: boolean; message: string }> {
  // Integration point: will be wired to generator or reflector
  return {
    success: true,
    message: `Sync ${args.direction} triggered (pipeline integration pending)`,
  };
}

/** Tool manifest entries for MCP tools/list response. */
export const DOCUMENT_TOOLS = [
  {
    name: 'get_design_document',
    description: 'Retrieve a design document by type and ID',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['token', 'component', 'layout', 'flow', 'theme', 'page'] },
        id: { type: 'string', description: 'Document ID' },
      },
      required: ['type', 'id'],
    },
  },
  {
    name: 'list_design_documents',
    description: 'List all design documents, optionally filtered by type',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['token', 'component', 'layout', 'flow', 'theme', 'page'] },
      },
    },
  },
  {
    name: 'put_design_document',
    description: 'Write a design document (for code→canvas sync)',
    inputSchema: {
      type: 'object',
      properties: {
        document: { type: 'object', description: 'Full design document with envelope' },
      },
      required: ['document'],
    },
  },
  {
    name: 'diff_design_document',
    description: 'Get diff between document versions',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['token', 'component', 'layout', 'flow', 'theme', 'page'] },
        id: { type: 'string' },
        version_a: { type: 'number' },
        version_b: { type: 'number' },
      },
      required: ['type', 'id'],
    },
  },
  {
    name: 'sync_design_state',
    description: 'Trigger bi-directional sync between canvas and code',
    inputSchema: {
      type: 'object',
      properties: {
        direction: { type: 'string', enum: ['canvas_to_code', 'code_to_canvas'] },
      },
      required: ['direction'],
    },
  },
] as const;
