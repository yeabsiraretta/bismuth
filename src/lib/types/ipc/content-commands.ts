/**
 * Content IPC Commands — Tasks, properties, tags, lifecycle, embeddings, entities
 */

interface CommandContract<P, R> {
  params: P;
  result: R;
}

export interface ContentCommands {
  get_all_tasks: CommandContract<Record<string, never>, unknown[]>;
  get_tasks_filtered: CommandContract<{ filter: unknown }, unknown[]>;
  get_task_projects: CommandContract<Record<string, never>, string[]>;
  update_task_status: CommandContract<{ path: string; line: number; done: boolean }, void>;
  execute_task_query: CommandContract<{ query: string }, unknown[]>;
  get_all_properties: CommandContract<Record<string, never>, Record<string, string[]>>;
  get_property_values: CommandContract<{ property: string }, string[]>;
  get_notes_by_property: CommandContract<{ property: string; value: string }, unknown[]>;
  search_properties: CommandContract<{ query: string }, unknown[]>;
  get_all_tags: CommandContract<Record<string, never>, string[]>;
  get_note_tags: CommandContract<{ path: string }, string[]>;
  get_notes_by_tag: CommandContract<{ tag: string }, unknown[]>;
  search_tags: CommandContract<{ query: string }, string[]>;
  get_tag_stats: CommandContract<Record<string, never>, Record<string, number>>;
  rename_tag: CommandContract<{ oldTag: string; newTag: string }, void>;
  merge_tags: CommandContract<{ sourceTags: string[]; targetTag: string }, void>;
  get_random_note_with_tag: CommandContract<{ tag: string }, unknown | null>;
  get_captured_notes: CommandContract<Record<string, never>, unknown[]>;
  get_lifecycle_stats: CommandContract<Record<string, never>, unknown>;
  quick_capture: CommandContract<{ content: string; tags?: string[] }, unknown>;
  archive_note: CommandContract<{ path: string }, void>;
  organize_note: CommandContract<{ path: string; folder: string }, void>;
  set_lifecycle_state: CommandContract<{ path: string; state: string }, void>;
  get_entity_types: CommandContract<Record<string, never>, unknown[]>;
  get_custom_entity_types: CommandContract<Record<string, never>, unknown[]>;
  get_type_definition: CommandContract<{ typeName: string }, unknown>;
  get_entity_relationships: CommandContract<{ path: string }, unknown[]>;
  get_concept_suggestions: CommandContract<{ content: string }, string[]>;
  initialize_embeddings: CommandContract<{ vaultRoot: string }, number>;
  index_all_embeddings: CommandContract<Record<string, never>, number>;
  get_similar_notes: CommandContract<{ path: string; limit?: number }, unknown[]>;
  lookup_by_text: CommandContract<{ text: string; limit?: number }, unknown[]>;
  get_embedding_config: CommandContract<Record<string, never>, unknown>;
  set_embedding_config: CommandContract<{ config: unknown }, void>;
  get_embedding_stats: CommandContract<Record<string, never>, unknown>;
  changelog_append: CommandContract<{ entry: string }, void>;
  changelog_recent: CommandContract<{ limit?: number }, string[]>;
}
