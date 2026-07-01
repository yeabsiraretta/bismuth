/**
 * Bismuth Living Design Canvas — Element data for all pages.
 * Split from bismuth-design-canvas.ts for constitution compliance (300-line limit).
 */

import type { CanvasElement, Page } from '@/features/canvas';

// ─── Helpers ────────────────────────────────────────────────────────────────

function frame(id: string, name: string, x: number, y: number, w: number, h: number): CanvasElement {
  return {
    id, element_type: 'frame', x, y, width: w, height: h, rotation: 0,
    properties: { fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, clipContent: true, padding: 16 },
    layer_id: 'layer_default', z_index: 0, locked: false, visible: true, name,
  };
}

function textEl(id: string, text: string, x: number, y: number, opts: Partial<{ fontSize: number; fontWeight: number; fill: string; width: number }> = {}): CanvasElement {
  return {
    id, element_type: 'text', x, y, width: opts.width ?? 200, height: (opts.fontSize ?? 14) * 1.6, rotation: 0,
    properties: { text, fontSize: opts.fontSize ?? 14, fontWeight: opts.fontWeight ?? 400, fontFamily: 'Inter', fill: opts.fill ?? '#1f2937', textAlign: 'left' },
    layer_id: 'layer_default', z_index: 1, locked: false, visible: true,
  };
}

function rect(id: string, x: number, y: number, w: number, h: number, fill: string, opts: Partial<{ stroke: string; radius: number; opacity: number }> = {}): CanvasElement {
  return {
    id, element_type: 'rectangle', x, y, width: w, height: h, rotation: 0,
    properties: { fill, stroke: opts.stroke, strokeWidth: opts.stroke ? 1 : 0, radius: opts.radius ?? 0, opacity: opts.opacity ?? 1 },
    layer_id: 'layer_default', z_index: 0, locked: false, visible: true,
  };
}

// ─── Pages ──────────────────────────────────────────────────────────────────

export const pages: Page[] = [
  { id: 'page_views', name: 'App Views', order: 0, elements: [] },
  { id: 'page_flows', name: 'User Flows', order: 1, elements: [] },
  { id: 'page_components', name: 'Components', order: 2, elements: [] },
  { id: 'page_tokens', name: 'Design Tokens', order: 3, elements: [] },
  { id: 'page_architecture', name: 'Architecture', order: 4, elements: [] },
];

// ─── Page 1: App Views ──────────────────────────────────────────────────────

export const viewElements: CanvasElement[] = [
  frame('frm_welcome', 'Welcome Screen', 0, 0, 480, 360),
  rect('bg_welcome', 16, 56, 448, 288, '#f8f9fa', { radius: 8 }),
  textEl('lbl_welcome', 'Welcome to Bismuth', 100, 16, { fontSize: 20, fontWeight: 700 }),
  textEl('desc_welcome', 'Select or create a vault to begin', 140, 160, { fontSize: 14, fill: '#6b7280' }),
  rect('btn_open_vault', 160, 220, 160, 40, '#dc2626', { radius: 6 }),
  textEl('lbl_open_vault', 'Open Vault', 200, 230, { fontSize: 14, fontWeight: 600, fill: '#ffffff' }),
  frame('frm_editor', 'Editor View (3-Column)', 560, 0, 960, 640),
  rect('sidebar_left', 576, 56, 48, 568, '#f3f4f6'),
  textEl('lbl_sidebar_l', 'L', 594, 330, { fontSize: 12, fill: '#6b7280' }),
  rect('sidebar_content', 624, 56, 220, 568, '#ffffff', { stroke: '#e5e7eb' }),
  textEl('lbl_file_tree', 'File Tree / Search', 660, 70, { fontSize: 12, fontWeight: 600 }),
  rect('toolbar_area', 844, 56, 660, 48, '#f9fafb', { stroke: '#e5e7eb' }),
  textEl('lbl_toolbar', 'Toolbar: New | Delete | Theme | Settings', 870, 72, { fontSize: 11, fill: '#6b7280' }),
  rect('editor_pane', 844, 104, 460, 520, '#ffffff'),
  textEl('lbl_editor', 'Markdown Editor + Preview', 980, 350, { fontSize: 14, fill: '#374151' }),
  rect('sidebar_right', 1304, 56, 200, 568, '#ffffff', { stroke: '#e5e7eb' }),
  textEl('lbl_sidebar_r', 'Backlinks / Properties', 1320, 70, { fontSize: 12, fontWeight: 600 }),
  frame('frm_graph', 'Graph View', 0, 440, 480, 360),
  rect('graph_bg', 16, 496, 448, 288, '#1e1e1e', { radius: 8 }),
  textEl('lbl_graph', 'Force-Directed Graph', 150, 660, { fontSize: 14, fill: '#ffffff' }),
  frame('frm_canvas', 'Canvas View', 560, 720, 960, 480),
  rect('canvas_bg', 576, 776, 928, 408, '#fafafa', { stroke: '#e5e7eb', radius: 4 }),
  textEl('lbl_canvas', 'Infinite Canvas — Design & Flow Editor', 870, 960, { fontSize: 14 }),
  rect('canvas_toolbar', 576, 720, 928, 56, '#ffffff', { stroke: '#e5e7eb' }),
  textEl('lbl_canvas_tb', 'Canvas Toolbar: Select | Rect | Text | Frame | Component', 600, 740, { fontSize: 11, fill: '#6b7280' }),
  frame('frm_settings', 'Settings Modal', 0, 880, 480, 380),
  rect('settings_overlay', 16, 936, 448, 308, '#ffffff', { radius: 12, stroke: '#e5e7eb' }),
  textEl('lbl_settings', 'Settings', 200, 950, { fontSize: 18, fontWeight: 700 }),
  textEl('lbl_settings_tabs', 'General | Editor | Appearance | Vault | Hotkeys | About', 60, 1000, { fontSize: 11, fill: '#6b7280', width: 400 }),
  frame('frm_cmd_palette', 'Command Palette', 1600, 0, 400, 300),
  rect('cmd_bg', 1616, 56, 368, 228, '#ffffff', { radius: 12, stroke: '#e5e7eb' }),
  rect('cmd_input', 1632, 72, 336, 40, '#f3f4f6', { radius: 6 }),
  textEl('lbl_cmd', 'Search commands...', 1648, 82, { fontSize: 13, fill: '#9ca3af' }),
  textEl('lbl_cmd_items', 'New Note\nOpen Settings\nToggle Theme\nOpen Graph\nOpen Canvas', 1648, 130, { fontSize: 13, fill: '#374151', width: 300 }),
];
pages[0].elements = viewElements.map((e) => e.id);

// ─── Page 2: User Flows ─────────────────────────────────────────────────────

export const flowElements: CanvasElement[] = [
  frame('flow_onboard_1', 'Launch App', 0, 0, 240, 140),
  textEl('flow_ob_lbl1', 'App launches\nCheck for vault', 20, 40, { fontSize: 12, fill: '#374151', width: 200 }),
  frame('flow_onboard_2', 'Vault Selection', 320, 0, 240, 140),
  textEl('flow_ob_lbl2', 'Show welcome\nOpen/Create vault', 340, 40, { fontSize: 12, fill: '#374151', width: 200 }),
  frame('flow_onboard_3', 'Load Editor', 640, 0, 240, 140),
  textEl('flow_ob_lbl3', 'Initialize stores\nLoad file tree\nShow editor', 660, 30, { fontSize: 12, fill: '#374151', width: 200 }),
  frame('flow_edit_1', 'Select Note', 0, 220, 240, 140),
  textEl('flow_ed_lbl1', 'Click in file tree\nor search result', 20, 260, { fontSize: 12, fill: '#374151', width: 200 }),
  frame('flow_edit_2', 'Open Editor', 320, 220, 240, 140),
  textEl('flow_ed_lbl2', 'Load markdown\nShow formatting bar\nEnable split view', 340, 250, { fontSize: 12, fill: '#374151', width: 200 }),
  frame('flow_edit_3', 'Auto-Save', 640, 220, 240, 140),
  textEl('flow_ed_lbl3', 'Debounce 500ms\nWrite to vault\nUpdate backlinks', 660, 250, { fontSize: 12, fill: '#374151', width: 200 }),
  frame('flow_canvas_1', 'Open Canvas', 0, 440, 240, 140),
  textEl('flow_cv_lbl1', 'Click Canvas btn\nor create new', 20, 480, { fontSize: 12, fill: '#374151', width: 200 }),
  frame('flow_canvas_2', 'Design', 320, 440, 240, 140),
  textEl('flow_cv_lbl2', 'Draw elements\nCreate components\nAdd flow links', 340, 470, { fontSize: 12, fill: '#374151', width: 200 }),
  frame('flow_canvas_3', 'Generate Docs', 640, 440, 240, 140),
  textEl('flow_cv_lbl3', 'Save triggers\ndocumentGenerator\nJSON design docs', 660, 470, { fontSize: 12, fill: '#374151', width: 200 }),
  frame('flow_mcp_1', 'MCP Request', 0, 660, 240, 140),
  textEl('flow_mcp_lbl1', 'AI agent calls\nget_design_context', 20, 700, { fontSize: 12, fill: '#374151', width: 200 }),
  frame('flow_mcp_2', 'Canvas Lookup', 320, 660, 240, 140),
  textEl('flow_mcp_lbl2', 'Resolve URI\nLoad frame tree\nResolve variables', 340, 690, { fontSize: 12, fill: '#374151', width: 200 }),
  frame('flow_mcp_3', 'Code Generation', 640, 660, 240, 140),
  textEl('flow_mcp_lbl3', 'Return structured\ndesign context for\nSvelte codegen', 660, 690, { fontSize: 12, fill: '#374151', width: 200 }),
];
pages[1].elements = flowElements.map((e) => e.id);

// ─── Page 3: Components ─────────────────────────────────────────────────────

export const componentElements: CanvasElement[] = [
  frame('comp_tab_btn', 'Tab Button', 0, 0, 200, 160),
  rect('comp_tab_bg', 16, 56, 48, 48, '#f3f4f6', { radius: 8 }),
  textEl('comp_tab_lbl', 'Tab Button\n48×48, icon centered\nActive: accent fill', 80, 60, { fontSize: 11, fill: '#6b7280', width: 120 }),
  frame('comp_toolbar_btn', 'Toolbar Button', 240, 0, 200, 160),
  rect('comp_tb_bg', 256, 56, 32, 32, '#ffffff', { radius: 6, stroke: '#e5e7eb' }),
  textEl('comp_tb_lbl', 'Toolbar Btn\n32×32 icon-only\nBorder on hover', 300, 60, { fontSize: 11, fill: '#6b7280', width: 120 }),
  frame('comp_mode_btn', 'Mode Toggle', 480, 0, 200, 160),
  rect('comp_mode_active', 496, 56, 80, 28, '#dc2626', { radius: 6 }),
  textEl('comp_mode_a_lbl', 'Edit', 520, 62, { fontSize: 12, fontWeight: 600, fill: '#ffffff' }),
  rect('comp_mode_inactive', 580, 56, 80, 28, '#ffffff', { radius: 6, stroke: '#e5e7eb' }),
  textEl('comp_mode_i_lbl', 'Preview', 596, 62, { fontSize: 12, fill: '#6b7280' }),
  frame('comp_fmt_bar', 'Formatting Toolbar', 0, 200, 480, 120),
  rect('comp_fmt_bg', 16, 256, 448, 40, '#f9fafb', { stroke: '#e5e7eb' }),
  textEl('comp_fmt_lbl', 'B  I  S  </>  |  H  "  •  1.  |  link  table', 36, 266, { fontSize: 14, fill: '#6b7280', width: 420 }),
  textEl('comp_fmt_desc', 'Rich text formatting — bold, italic, strikethrough, code, headings, lists, links, tables', 16, 300, { fontSize: 11, fill: '#9ca3af', width: 460 }),
  frame('comp_settings_item', 'Settings Item', 0, 360, 320, 120),
  textEl('comp_si_label', 'Auto-save delay', 16, 416, { fontSize: 13, fontWeight: 500 }),
  textEl('comp_si_desc', 'Milliseconds before auto-saving', 16, 436, { fontSize: 11, fill: '#9ca3af', width: 200 }),
  rect('comp_si_input', 220, 410, 80, 32, '#ffffff', { stroke: '#e5e7eb', radius: 4 }),
  textEl('comp_si_val', '500', 248, 418, { fontSize: 13 }),
  frame('comp_toast', 'Toast Notification', 360, 360, 280, 120),
  rect('comp_toast_bg', 376, 416, 248, 48, '#ffffff', { radius: 8, stroke: '#e5e7eb' }),
  rect('comp_toast_accent', 376, 416, 3, 48, '#dc2626', { radius: 2 }),
  textEl('comp_toast_msg', 'File saved successfully', 396, 432, { fontSize: 13 }),
];
pages[2].elements = componentElements.map((e) => e.id);

// ─── Page 4: Design Tokens ──────────────────────────────────────────────────

export const tokenElements: CanvasElement[] = [
  frame('tok_colors', 'Color Tokens', 0, 0, 560, 280),
  textEl('tok_col_title', 'Accent & Interactive', 16, 56, { fontSize: 14, fontWeight: 700 }),
  rect('tok_swatch_accent', 16, 90, 40, 40, '#dc2626', { radius: 4 }),
  textEl('tok_col_accent', '--interactive-accent: #dc2626', 68, 100, { fontSize: 12 }),
  rect('tok_swatch_hover', 16, 140, 40, 40, '#b91c1c', { radius: 4 }),
  textEl('tok_col_hover', '--interactive-accent-hover: #b91c1c', 68, 150, { fontSize: 12, width: 280 }),
  rect('tok_swatch_bg', 16, 190, 40, 40, '#ffffff', { radius: 4, stroke: '#e5e7eb' }),
  textEl('tok_col_bg', '--background-primary: #ffffff', 68, 200, { fontSize: 12 }),
  rect('tok_swatch_surface', 16, 240, 40, 40, '#f3f4f6', { radius: 4 }),
  textEl('tok_col_surface', '--background-secondary: #f3f4f6', 68, 250, { fontSize: 12, width: 280 }),
  textEl('tok_text_title', 'Text Colors', 320, 56, { fontSize: 14, fontWeight: 700 }),
  rect('tok_swatch_text', 320, 90, 40, 40, '#1f2937', { radius: 4 }),
  textEl('tok_col_text', '--text-normal: #1f2937', 372, 100, { fontSize: 12 }),
  rect('tok_swatch_muted', 320, 140, 40, 40, '#6b7280', { radius: 4 }),
  textEl('tok_col_muted', '--text-muted: #6b7280', 372, 150, { fontSize: 12 }),
  rect('tok_swatch_error', 320, 190, 40, 40, '#ef4444', { radius: 4 }),
  textEl('tok_col_error', '--text-error: #ef4444', 372, 200, { fontSize: 12 }),
  frame('tok_spacing', 'Spacing Tokens', 0, 320, 560, 200),
  textEl('tok_sp_title', 'Grid Gaps', 16, 376, { fontSize: 14, fontWeight: 700 }),
  rect('tok_sp_xs', 16, 410, 4, 24, '#dc2626'),
  textEl('tok_sp_xs_lbl', '--grid-gap-xs: 4px', 28, 414, { fontSize: 11 }),
  rect('tok_sp_sm', 16, 444, 8, 24, '#dc2626'),
  textEl('tok_sp_sm_lbl', '--grid-gap-sm: 8px', 32, 448, { fontSize: 11 }),
  rect('tok_sp_md', 16, 478, 16, 24, '#dc2626'),
  textEl('tok_sp_md_lbl', '--grid-gap-md: 16px', 40, 482, { fontSize: 11 }),
  textEl('tok_rad_title', 'Border Radius', 280, 376, { fontSize: 14, fontWeight: 700 }),
  rect('tok_rad_s', 280, 410, 40, 40, '#f3f4f6', { radius: 4, stroke: '#e5e7eb' }),
  textEl('tok_rad_s_lbl', '4px', 328, 424, { fontSize: 11 }),
  rect('tok_rad_m', 380, 410, 40, 40, '#f3f4f6', { radius: 8, stroke: '#e5e7eb' }),
  textEl('tok_rad_m_lbl', '8px', 428, 424, { fontSize: 11 }),
  rect('tok_rad_l', 480, 410, 40, 40, '#f3f4f6', { radius: 12, stroke: '#e5e7eb' }),
  textEl('tok_rad_l_lbl', '12px', 528, 424, { fontSize: 11 }),
];
pages[3].elements = tokenElements.map((e) => e.id);

// ─── Page 5: Architecture ───────────────────────────────────────────────────

export const archElements: CanvasElement[] = [
  frame('arch_backend', 'Tauri Backend (Rust)', 0, 0, 360, 200),
  textEl('arch_be_desc', '- Vault service (FS ops)\n- Canvas SQLite DB\n- Search indexing\n- MCP server (HTTP/SSE)\n- Git integration', 16, 56, { fontSize: 12, fill: '#374151', width: 320 }),
  frame('arch_frontend', 'Svelte Frontend', 440, 0, 360, 200),
  textEl('arch_fe_desc', '- App.svelte (3-column layout)\n- Stores (layout, vault, canvas)\n- Canvas workspace (2D rendering)\n- Editor (CodeMirror 6)\n- Sidebar system', 456, 56, { fontSize: 12, fill: '#374151', width: 320 }),
  frame('arch_design', 'Design Doc Layer', 220, 280, 360, 160),
  textEl('arch_dd_desc', '- .bismuth/design-docs/ (JSON)\n- documentGenerator.ts\n- Component/Flow/Token docs\n- Version history', 236, 336, { fontSize: 12, fill: '#374151', width: 320 }),
  frame('arch_mcp', 'MCP Integration', 0, 520, 360, 160),
  textEl('arch_mcp_desc', '- get_design_context\n- list_components\n- get_variables\n- bismuth:// URI scheme', 16, 576, { fontSize: 12, fill: '#374151', width: 320 }),
  frame('arch_agents', 'AI Agents', 440, 520, 360, 160),
  textEl('arch_ag_desc', '- Claude / Windsurf / Devin\n- Read canvas via MCP\n- Generate Svelte components\n- Update design docs', 456, 576, { fontSize: 12, fill: '#374151', width: 320 }),
];
pages[4].elements = archElements.map((e) => e.id);
