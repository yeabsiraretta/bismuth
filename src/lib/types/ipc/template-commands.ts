/**
 * Template IPC Commands — Note template CRUD
 */

interface CommandContract<P, R> { params: P; result: R }

export interface TemplateCommands {
  initialize_template_service: CommandContract<{ vaultPath: string }, void>;
  list_templates: CommandContract<Record<string, never>, unknown[]>;
  render_template: CommandContract<{ templateId: string; variables: Record<string, string> }, string>;
  create_from_template: CommandContract<{ templateId: string; path: string; variables: Record<string, string> }, unknown>;
  save_template: CommandContract<{ template: unknown }, void>;
  delete_template: CommandContract<{ templateId: string }, void>;
}
