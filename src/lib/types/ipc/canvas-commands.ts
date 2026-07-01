/**
 * Canvas IPC Commands — Canvas, component, and design doc operations
 */

interface CommandContract<P, R> { params: P; result: R }

export interface CanvasCommands {
  create_canvas: CommandContract<{ name: string; noteId?: string }, unknown>;
  save_canvas: CommandContract<{ name: string; data: unknown }, void>;
  load_canvas: CommandContract<{ name: string }, unknown>;
  list_canvases: CommandContract<Record<string, never>, string[]>;
  delete_canvas: CommandContract<{ name: string }, void>;
  link_canvas_to_note: CommandContract<{ canvasName: string; notePath: string }, void>;
  get_canvases_for_note: CommandContract<{ notePath: string }, string[]>;
  export_canvas_to_file: CommandContract<{ name: string; outputPath: string }, void>;
  export_all_canvases: CommandContract<{ outputPath: string }, void>;
  save_component: CommandContract<{ component: unknown }, void>;
  read_component: CommandContract<{ id: string }, unknown>;
  list_components: CommandContract<Record<string, never>, unknown[]>;
  delete_component: CommandContract<{ id: string }, void>;
  export_components_markdown: CommandContract<{ outputPath: string }, void>;
  save_canvas_template: CommandContract<{ name: string; data: unknown }, void>;
  load_canvas_template: CommandContract<{ name: string }, unknown>;
  list_canvas_templates: CommandContract<Record<string, never>, string[]>;
  delete_canvas_template: CommandContract<{ name: string }, void>;
  list_token_collections: CommandContract<Record<string, never>, unknown[]>;
  save_token_collection: CommandContract<{ collection: unknown }, void>;
  delete_token_collection: CommandContract<{ id: string }, void>;
  export_tokens_css: CommandContract<{ id: string; outputPath: string }, string>;
  load_custom_tokens: CommandContract<Record<string, never>, unknown>;
  save_custom_tokens: CommandContract<{ tokens: unknown }, void>;
  load_shared_styles: CommandContract<Record<string, never>, unknown[]>;
  save_shared_styles: CommandContract<{ styles: unknown[] }, void>;
  delete_shared_style: CommandContract<{ id: string }, void>;
  design_doc_read: CommandContract<{ canvasName: string; docId: string }, unknown>;
  design_doc_write: CommandContract<{ canvasName: string; docId: string; content: unknown }, void>;
  design_doc_list: CommandContract<{ canvasName: string }, string[]>;
  design_doc_delete: CommandContract<{ canvasName: string; docId: string }, void>;
}
