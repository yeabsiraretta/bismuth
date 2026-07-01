import type { CanvasElement } from '@/features/canvas/types/elements';
import type { ComponentDefinition } from '@/features/canvas/types/components';
import type { FlowLink } from '@/features/canvas/types/components';
import type { SharedStyle } from '@/features/canvas/types/interactions';
import type { TokenCollection } from '@/features/canvas/types/design/tokens';

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
  /** Design token collections (new system, replaces variables). */
  tokenCollections?: TokenCollection[];
  /** MCP server config for this canvas (exposure settings). */
  mcpConfig?: MCPCanvasConfig;
  /**
   * Discriminates canvas document subtypes.
   * Absence means standard canvas (backward compatible).
   */
  documentType?: 'canvas' | 'slides' | 'roadmap';
  /**
   * Per-frame slide configuration.
   * Only populated when documentType === 'slides'.
   * Absence on existing documents is backward compatible.
   */
  slideMetadata?: SlideMetadata[];
  /**
   * Semver version string for this canvas document (e.g. "1.2.3").
   * Written by the versioning hook after each save. Absence means unversioned.
   * Spec 051, Phase 4.2.
   */
  version?: string;
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

/**
 * Per-slide presentation metadata stored on a canvas document when
 * documentType === 'slides'. One entry per frame used as a slide.
 */
export interface SlideMetadata {
  /** ID of the CanvasElement (frame) this metadata belongs to. */
  frameId: string;
  /** Markdown speaker notes shown in the presenter panel. */
  speakerNotes: string;
  /** CSS animation applied when transitioning into this slide. */
  transitionType: 'instant' | 'fade' | 'slide-left' | 'slide-right' | 'scale';
  /**
   * Transition duration in milliseconds.
   * Valid range: 100–1000. Default: 300.
   */
  transitionDuration: number;
}
