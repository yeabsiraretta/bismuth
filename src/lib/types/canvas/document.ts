import type { CanvasElement } from './elements';
import type { ComponentDefinition } from './components';
import type { FlowLink } from './components';
import type { SharedStyle } from './interactions';

/** Top-level canvas document containing all elements, layers, pages, and metadata. */
export interface CanvasDocument {
  id: string;
  name: string;
  vault_id: string | null;
  /** Associated note path (links canvas to a specific note). */
  note_id: string | null;
  viewport: Viewport;
  grid_size: number;
  snap_to_grid: boolean;
  elements: CanvasElement[];
  layers: Layer[];
  pages: Page[];
  activePageId: string;
  components: ComponentDefinition[];
  /** Navigational flow links between frames. */
  flowLinks?: FlowLink[];
  /** Shared styles (fill, stroke, text, effect) reusable across elements. */
  styles: SharedStyle[];
  /** Design variables / tokens defined in this document. */
  variables: CanvasVariable[];
  /** MCP server config for this canvas (exposure settings). */
  mcpConfig?: MCPCanvasConfig;
  created_at: number;
  modified_at: number;
}

/** A design variable (token) scoped to a canvas document. */
export interface CanvasVariable {
  id: string;
  name: string;
  /** Variable collection (e.g., "Colors", "Spacing"). */
  collection: string;
  type: 'color' | 'number' | 'string' | 'boolean';
  /** Value per mode (e.g., { "Light": "#fff", "Dark": "#000" }). */
  values: Record<string, unknown>;
  /** Scopes where this variable can be applied. */
  scopes: ('fill' | 'stroke' | 'text' | 'spacing' | 'radius' | 'opacity')[];
  description?: string;
}

/** MCP exposure configuration for a canvas document. */
export interface MCPCanvasConfig {
  /** Whether this canvas is exposed via MCP. */
  enabled: boolean;
  /** Base URL for the MCP server (default: http://localhost:3456). */
  serverUrl: string;
  /** The bismuth:// URI for this document. */
  resourceUri: string;
  /** Code generation framework target. */
  codegenFramework: 'svelte' | 'react' | 'vue' | 'html';
  /** Whether to include screenshots in MCP responses. */
  includeScreenshots: boolean;
}

/** Camera position and zoom level for the canvas viewport. */
export interface Viewport {
  /** Horizontal pan offset in screen pixels. */
  x: number;
  /** Vertical pan offset in screen pixels. */
  y: number;
  /** Zoom multiplier (1.0 = 100%). */
  scale: number;
}

/** A named page within a multi-page canvas document. */
export interface Page {
  id: string;
  name: string;
  /** Sort order (0-based). */
  order: number;
  /** Element IDs belonging to this page. */
  elements: string[];
  /** Optional page background color. */
  background?: string;
}

/** A named layer that groups elements for visibility/lock control. */
export interface Layer {
  id: string;
  name: string;
  /** Global stacking order (higher = in front). */
  z_order: number;
  visible: boolean;
  locked: boolean;
}
