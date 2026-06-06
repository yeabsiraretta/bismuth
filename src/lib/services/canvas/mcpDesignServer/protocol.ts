/**
 * MCP Protocol Integration
 *
 * Implements the Bismuth Canvas MCP Protocol.
 * URL Scheme: bismuth://canvas/{document_id}/{frame_id}?{params}
 */

import type { CanvasDocument } from '@/types/canvas';
import type { MCPResponse, DesignSummary } from './index';
import { generateDesignSummary, extractCanvasTree } from './endpoints';

/** Parses a bismuth:// canvas URL into document and frame IDs. */
export function parseBismuthUrl(url: string): { documentId: string; frameId?: string; params?: Record<string, string> } | null {
  const match = url.match(/^bismuth:\/\/canvas\/([^/?]+)(?:\/([^?]+))?(?:\?(.+))?$/);
  if (!match) return null;

  const params: Record<string, string> = {};
  if (match[3]) {
    for (const pair of match[3].split('&')) {
      const [k, v] = pair.split('=');
      params[k] = decodeURIComponent(v);
    }
  }

  return { documentId: match[1], frameId: match[2], params };
}

/** Constructs a bismuth:// canvas URL. */
export function buildBismuthUrl(documentId: string, frameId?: string, params?: Record<string, string>): string {
  let url = `bismuth://canvas/${documentId}`;
  if (frameId) url += `/${frameId}`;
  if (params && Object.keys(params).length > 0) {
    const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    url += `?${qs}`;
  }
  return url;
}

/** Handles an incoming MCP request against a canvas document store. */
export function handleMCPToolCall(
  toolName: string,
  args: Record<string, unknown>,
  getDocument: (id: string) => CanvasDocument | null
): MCPResponse['result'] | MCPResponse['error'] {
  switch (toolName) {
    case 'get_design_context': {
      const parsed = parseBismuthUrl(args.frame_url as string);
      if (!parsed) return { code: -32602, message: 'Invalid frame URL' };
      const doc = getDocument(parsed.documentId);
      if (!doc) return { code: -32000, message: 'Document not found' };
      const summary = generateDesignSummary(doc);
      return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] };
    }
    case 'get_metadata': {
      const parsed = parseBismuthUrl(args.frame_url as string);
      if (!parsed) return { code: -32602, message: 'Invalid URL' };
      const doc = getDocument(parsed.documentId);
      if (!doc) return { code: -32000, message: 'Document not found' };
      const tree = extractCanvasTree(doc);
      return { content: [{ type: 'text', text: JSON.stringify({ document: { id: doc.id, name: doc.name, pages: doc.pages }, nodeTree: tree }, null, 2) }] };
    }
    default:
      return { code: -32601, message: `Unknown tool: ${toolName}` };
  }
}

/**
 * Formats the design summary as an MCP-compatible response.
 */
export function formatMCPResponse(summary: DesignSummary): string {
  return JSON.stringify(summary, null, 2);
}
