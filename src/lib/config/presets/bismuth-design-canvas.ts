/**
 * Bismuth Living Design Canvas — Assembled document with flow links,
 * design variables, and MCP configuration.
 *
 * Element data lives in ./bismuth-design-elements.ts for constitution compliance.
 */

import type { CanvasDocument, CanvasVariable, CanvasElement, FlowLink } from '@/features/canvas';
import { MCP } from '@/config/constants';
import {
  pages,
  viewElements,
  flowElements,
  componentElements,
  tokenElements,
  archElements,
} from '@/config/presets/bismuth-design-elements';

// ─── Flow Links ─────────────────────────────────────────────────────────────

const flowLinks: FlowLink[] = [
  // Onboarding flow
  { id: 'fl_ob_1_2', fromFrameId: 'flow_onboard_1', toFrameId: 'flow_onboard_2', transition: { type: 'dissolve', duration: 300 }, label: 'No vault' },
  { id: 'fl_ob_2_3', fromFrameId: 'flow_onboard_2', toFrameId: 'flow_onboard_3', transition: { type: 'dissolve', duration: 300 }, label: 'Vault opened' },
  // Edit flow
  { id: 'fl_ed_1_2', fromFrameId: 'flow_edit_1', toFrameId: 'flow_edit_2', transition: { type: 'instant', duration: 0 }, label: 'Click' },
  { id: 'fl_ed_2_3', fromFrameId: 'flow_edit_2', toFrameId: 'flow_edit_3', transition: { type: 'instant', duration: 0 }, label: 'Type' },
  // Canvas flow
  { id: 'fl_cv_1_2', fromFrameId: 'flow_canvas_1', toFrameId: 'flow_canvas_2', transition: { type: 'slide-right', duration: 300 } },
  { id: 'fl_cv_2_3', fromFrameId: 'flow_canvas_2', toFrameId: 'flow_canvas_3', transition: { type: 'instant', duration: 0 }, label: 'Save' },
  // MCP flow
  { id: 'fl_mcp_1_2', fromFrameId: 'flow_mcp_1', toFrameId: 'flow_mcp_2', transition: { type: 'instant', duration: 0 }, label: 'HTTP' },
  { id: 'fl_mcp_2_3', fromFrameId: 'flow_mcp_2', toFrameId: 'flow_mcp_3', transition: { type: 'instant', duration: 0 }, label: 'Response' },
  // View navigation (page_views)
  { id: 'fl_welcome_editor', fromFrameId: 'frm_welcome', toFrameId: 'frm_editor', transition: { type: 'slide-right', duration: 300 }, label: 'Open vault' },
  { id: 'fl_editor_graph', fromFrameId: 'frm_editor', toFrameId: 'frm_graph', transition: { type: 'dissolve', duration: 200 }, label: 'Graph tab' },
  { id: 'fl_editor_canvas', fromFrameId: 'frm_editor', toFrameId: 'frm_canvas', transition: { type: 'slide-right', duration: 300 }, label: 'Canvas btn' },
  { id: 'fl_editor_settings', fromFrameId: 'frm_editor', toFrameId: 'frm_settings', transition: { type: 'dissolve', duration: 200 }, label: 'Cmd+,' },
  { id: 'fl_editor_cmd', fromFrameId: 'frm_editor', toFrameId: 'frm_cmd_palette', transition: { type: 'dissolve', duration: 150 }, label: 'Cmd+K' },
];

// ─── Design Variables ───────────────────────────────────────────────────────

const variables: CanvasVariable[] = [
  { id: 'var_accent', name: 'accent', collection: 'Colors', type: 'color', values: { Light: '#dc2626', Dark: '#ef4444' }, scopes: ['fill', 'stroke'] },
  { id: 'var_accent_hover', name: 'accent-hover', collection: 'Colors', type: 'color', values: { Light: '#b91c1c', Dark: '#f87171' }, scopes: ['fill'] },
  { id: 'var_bg_primary', name: 'bg-primary', collection: 'Colors', type: 'color', values: { Light: '#ffffff', Dark: '#1e1e1e' }, scopes: ['fill'] },
  { id: 'var_bg_secondary', name: 'bg-secondary', collection: 'Colors', type: 'color', values: { Light: '#f3f4f6', Dark: '#252525' }, scopes: ['fill'] },
  { id: 'var_text_normal', name: 'text-normal', collection: 'Colors', type: 'color', values: { Light: '#1f2937', Dark: '#dcddde' }, scopes: ['text'] },
  { id: 'var_text_muted', name: 'text-muted', collection: 'Colors', type: 'color', values: { Light: '#6b7280', Dark: '#999999' }, scopes: ['text'] },
  { id: 'var_border', name: 'border', collection: 'Colors', type: 'color', values: { Light: '#e5e7eb', Dark: '#333333' }, scopes: ['stroke'] },
  { id: 'var_gap_xs', name: 'gap-xs', collection: 'Spacing', type: 'number', values: { default: 4 }, scopes: ['spacing'] },
  { id: 'var_gap_sm', name: 'gap-sm', collection: 'Spacing', type: 'number', values: { default: 8 }, scopes: ['spacing'] },
  { id: 'var_gap_md', name: 'gap-md', collection: 'Spacing', type: 'number', values: { default: 16 }, scopes: ['spacing'] },
  { id: 'var_panel_height', name: 'panel-header-height', collection: 'Spacing', type: 'number', values: { default: 48 }, scopes: ['spacing'] },
  { id: 'var_btn_size', name: 'toolbar-btn-size', collection: 'Spacing', type: 'number', values: { default: 32 }, scopes: ['spacing'] },
];

// ─── Assemble Document ──────────────────────────────────────────────────────

const allElements: CanvasElement[] = [
  ...viewElements,
  ...flowElements,
  ...componentElements,
  ...tokenElements,
  ...archElements,
];

/** The complete Bismuth Living Design Canvas document. */
export const BISMUTH_DESIGN_CANVAS: CanvasDocument = {
  id: 'bismuth_living_design',
  name: 'Bismuth — Living Design Document',
  vault_id: null,
  note_id: null,
  viewport: { x: 0, y: 0, scale: 0.75 },
  grid_size: 8,
  snap_to_grid: true,
  elements: allElements,
  layers: [
    { id: 'layer_default', name: 'Default', z_order: 0, visible: true, locked: false },
    { id: 'layer_annotations', name: 'Annotations', z_order: 1, visible: true, locked: false },
  ],
  pages,
  activePageId: 'page_views',
  components: [],
  flowLinks,
  styles: [],
  variables,
  mcpConfig: {
    enabled: true,
    serverUrl: MCP.DEFAULT_SERVER_URL,
    resourceUri: 'bismuth://canvas/bismuth_living_design',
    codegenFramework: 'svelte',
    includeScreenshots: false,
  },
  created_at: Math.floor(Date.now() / 1000),
  modified_at: Math.floor(Date.now() / 1000),
};
