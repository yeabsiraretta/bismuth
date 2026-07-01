/**
 * MCP Design Server (T141)
 *
 * Exposes Bismuth canvas data to AI agents and code generators via MCP protocol.
 * Barrel re-export of protocol and endpoint modules.
 */

// ─── MCP Export Types ───────────────────────────────────────────────────────

/** MCP JSON-RPC 2.0 request format. */
export interface MCPRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: 'tools/list' | 'tools/call' | 'resources/list' | 'resources/read';
  params: {
    name?: string;
    arguments?: Record<string, unknown>;
    uri?: string;
  };
}

/** MCP JSON-RPC 2.0 response format. */
export interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: {
    content: Array<{ type: 'text' | 'image'; text?: string; data?: string; mimeType?: string }>;
  };
  error?: { code: number; message: string; data?: unknown };
}

/** Structured design summary exported from Bismuth canvas. */
export interface DesignSummary {
  canvas: { id: string; name: string; width: number; height: number };
  components: ComponentExport[];
  colors: ColorExport[];
  spacing: SpacingExport[];
  typography: TypographyExport[];
  layouts: LayoutExport[];
  elementTree: ElementExport[];
  _stats: {
    totalElements: number;
    componentInstances: number;
    frames: number;
    textNodes: number;
    tokensCovered: number;
    tokensUnresolved: number;
  };
}

export interface ComponentExport {
  name: string;
  tag: string;
  props: Record<string, string>;
  tokenBindings: Record<string, string>;
  elementId: string;
}

export interface ColorExport {
  raw: string;
  token: string | null;
  cssVar: string | null;
  count: number;
}

export interface SpacingExport {
  raw: number;
  token: string | null;
  cssVar: string | null;
  context: string;
}

export interface TypographyExport {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight?: number;
  token: string | null;
}

export interface LayoutExport {
  elementId: string;
  elementName: string;
  type: 'flex' | 'grid';
  direction?: 'horizontal' | 'vertical';
  gap: number;
  padding: { top: number; right: number; bottom: number; left: number };
  alignItems: string;
  justifyContent?: string;
}

export interface ElementExport {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  componentTag?: string;
  children: ElementExport[];
}

export interface CodeMapping {
  match: string;
  tag: string;
  defaultProps: Record<string, string>;
}

// ─── Re-exports ─────────────────────────────────────────────────────────────

export { parseBismuthUrl, buildBismuthUrl, handleMCPToolCall, formatMCPResponse } from './protocol';
export {
  extractCanvasTree,
  generateDesignSummary,
  generateSvelteComponent,
  BISMUTH_CODE_MAPPINGS,
} from './endpoints';
export {
  handleGetDesignDocument,
  handleListDesignDocuments,
  handlePutDesignDocument,
  handleDiffDesignDocument,
  handleSyncDesignState,
  DOCUMENT_TOOLS,
} from './documentTools';
