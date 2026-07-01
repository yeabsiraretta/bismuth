/**
 * Vault IPC Commands — Note and vault CRUD operations
 */
import type { Vault, Note } from '@/types/data/vault';

interface CommandContract<P, R> {
  params: P;
  result: R;
}

export interface VaultCommands {
  open_vault: CommandContract<{ path: string }, Vault>;
  create_vault: CommandContract<{ path: string }, Vault>;
  create_vault_from_template: CommandContract<{ path: string; template: number }, Vault>;
  get_current_vault: CommandContract<Record<string, never>, Vault | null>;
  scan_vault: CommandContract<Record<string, never>, Note[]>;
  list_notes: CommandContract<Record<string, never>, Note[]>;
  list_folders: CommandContract<Record<string, never>, string[]>;
  create_note: CommandContract<{ path: string; content?: string }, Note>;
  read_note: CommandContract<{ path: string }, Note>;
  write_note: CommandContract<{ path: string; content: string }, void>;
  delete_note: CommandContract<{ path: string }, void>;
  rename_note: CommandContract<{ oldPath: string; newPath: string }, Note>;
  duplicate_note: CommandContract<{ path: string }, Note>;
  move_note: CommandContract<{ oldPath: string; newPath: string }, Note>;
  merge_notes: CommandContract<{ paths: string[]; targetPath: string }, Note>;
  create_folder: CommandContract<{ path: string }, void>;
  move_folder: CommandContract<{ oldPath: string; newPath: string }, void>;
  embed_note: CommandContract<{ sourcePath: string; targetPath: string }, void>;
  create_note_from_wikilink: CommandContract<{ title: string; folder?: string }, Note>;
  open_in_file_manager: CommandContract<{ path: string }, void>;
  export_vault_markdown: CommandContract<{ outputPath: string }, void>;
  read_file_text: CommandContract<{ path: string }, string>;
  search_notes: CommandContract<{ query: string }, Note[]>;
  search_vault: CommandContract<{ query: string }, Note[]>;
  advanced_search: CommandContract<{ query: string; options?: Record<string, unknown> }, Note[]>;
  search_in_file: CommandContract<{ path: string; query: string }, string[]>;
  get_backlinks: CommandContract<{ path: string }, Note[]>;
  get_outgoing_links: CommandContract<{ path: string }, string[]>;
  get_graph_backlinks: CommandContract<{ path: string }, unknown[]>;
  get_graph_data: CommandContract<Record<string, never>, unknown>;
  compute_graph_layout: CommandContract<{ algorithm?: string }, unknown>;
  find_unlinked_references: CommandContract<{ path: string }, unknown[]>;
  create_link_from_mention: CommandContract<{ sourcePath: string; targetTitle: string }, void>;
  create_link_from_unlinked_mention: CommandContract<
    { sourcePath: string; targetTitle: string },
    void
  >;
  update_links_on_rename: CommandContract<{ oldPath: string; newPath: string }, void>;
  parse_frontmatter: CommandContract<{ content: string }, Record<string, unknown>>;
  update_frontmatter_field: CommandContract<{ path: string; field: string; value: unknown }, void>;
  batch_update_frontmatter_field: CommandContract<
    { paths: string[]; field: string; value: unknown },
    void
  >;
  lint_note_text: CommandContract<{ content: string }, unknown[]>;
  read_navigator_state: CommandContract<Record<string, never>, unknown>;
  write_navigator_state: CommandContract<{ state: unknown }, void>;
}
