# Bismuth IPC API Specification

> Complete reference for the Tauri IPC commands exposed by the Rust backend.  
> Frontend services invoke these via `@tauri-apps/api/core` → `invoke(command, args)`.

---

## Overview

Bismuth uses Tauri's IPC bridge for frontend–backend communication. All commands are registered in `src-tauri/src/app/handlers.rs` and invoked from TypeScript service files in `src/lib/services/`.

**Convention**: Commands return `Result<T, BismuthError>` serialized as JSON. Errors are caught by the frontend service layer.

---

## Vault Commands

Commands for vault lifecycle and note CRUD operations.

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `open_vault` | `path: string` | `Vault` | Opens an existing vault at the given path |
| `create_vault` | `path: string, name: string` | `Vault` | Creates a new vault directory |
| `create_vault_from_template` | `path: string, template: string` | `Vault` | Creates a vault from a template preset |
| `get_current_vault` | — | `Vault \| null` | Returns the currently open vault |
| `scan_vault` | — | `Note[]` | Scans and indexes all notes in the vault |
| `read_note` | `path: string` | `Note` | Reads a note's content and metadata |
| `write_note` | `path: string, content: string` | `()` | Writes content to a note file |
| `delete_note` | `path: string` | `()` | Deletes a note file |
| `rename_note` | `path: string, new_name: string` | `string` | Renames a note, returns new path |
| `create_note` | `path: string, content?: string` | `Note` | Creates a new note |
| `duplicate_note` | `path: string` | `Note` | Duplicates an existing note |
| `move_note` | `path: string, destination: string` | `string` | Moves a note to a new location |
| `merge_notes` | `paths: string[]` | `Note` | Merges multiple notes into one |
| `list_folders` | — | `string[]` | Lists all folders in the vault |
| `list_notes` | — | `Note[]` | Lists all notes in the vault |
| `create_folder` | `path: string` | `()` | Creates a new folder (recursive) |
| `update_links_on_rename` | `old_path: string, new_path: string` | `()` | Updates wikilinks after a rename |
| `create_note_from_wikilink` | `link_name: string` | `Note` | Creates a note from a wikilink reference |
| `open_in_file_manager` | `path: string` | `()` | Opens path in system file manager |
| `update_frontmatter_field` | `path: string, key: string, value: any` | `()` | Updates a single frontmatter field |
| `parse_frontmatter` | `content: string` | `{ frontmatter: Record<string, any>, body: string }` | Parses YAML frontmatter from markdown |
| `get_note_tags` | `path: string` | `string[]` | Extracts all tags (frontmatter + inline) |
| `read_file_text` | `path: string` | `string` | Reads raw file text content |
| `get_custom_entity_types` | — | `EntityType[]` | Returns user-defined entity types |

---

## Navigator Commands

Commands for persisting sidebar/navigation state.

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `read_navigator_state` | — | `NavigatorState` | Reads persisted navigator state |
| `write_navigator_state` | `state: NavigatorState` | `()` | Saves navigator state to disk |

---

## Search Commands

Full-text search powered by Tantivy.

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `search_vault` | `query: string, limit?: number` | `SearchResult[]` | Full-text search across all notes |
| `search_notes` | `query: string, limit?: number` | `SearchResult[]` | Alias for `search_vault` (used by command palette) |
| `advanced_search` | `query: string, filters: SearchFilters` | `SearchResult[]` | Search with tag/folder/date filters |
| `search_in_file` | `path: string, query: string` | `FileMatch[]` | Search within a specific file |

---

## Graph Commands

Knowledge graph data for visualization.

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `get_graph_data` | — | `GraphData` | Returns all nodes and edges for the graph view |
| `get_graph_backlinks` | `path: string` | `GraphLink[]` | Gets backlink edges for a specific note |

---

## Backlinks Commands

Bidirectional link discovery.

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `get_backlinks` | `path: string` | `Backlink[]` | Gets all notes linking to the given note |
| `get_outgoing_links` | `path: string` | `Link[]` | Gets all links going out from a note |
| `create_link_from_mention` | `source: string, target: string, text: string` | `()` | Creates a wikilink from a detected mention |
| `create_link_from_unlinked_mention` | `source: string, target: string, text: string` | `()` | Links an unlinked mention |

---

## Tag Commands

Tag management and discovery.

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `get_all_tags` | — | `TagInfo[]` | Returns all tags with counts |
| `get_notes_by_tag` | `tag: string` | `Note[]` | Finds notes with a specific tag |
| `get_tag_stats` | — | `TagStats` | Returns tag usage statistics |
| `search_tags` | `query: string` | `TagInfo[]` | Fuzzy searches tags by name |
| `rename_tag` | `old_name: string, new_name: string` | `number` | Renames a tag across all notes, returns count |
| `merge_tags` | `source: string, target: string` | `number` | Merges one tag into another |
| `get_random_note_with_tag` | `tag: string` | `Note` | Returns a random note with the given tag |

---

## Property Commands

Note property/metadata queries.

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `get_all_properties` | — | `PropertyInfo[]` | Lists all frontmatter properties across the vault |
| `get_property_values` | `property: string` | `string[]` | Gets distinct values for a property |
| `get_notes_by_property` | `key: string, value: string` | `Note[]` | Finds notes with a specific property value |
| `search_properties` | `query: string` | `PropertyInfo[]` | Searches property names |

---

## Wikilink Commands

Wikilink analysis and suggestions.

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `find_unlinked_references` | `path: string` | `UnlinkedRef[]` | Finds text that could be wikilinked |
| `get_concept_suggestions` | `content: string` | `Suggestion[]` | AI-powered link suggestions from content |

---

## Canvas Commands

Visual canvas document management.

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `create_canvas` | `name: string` | `CanvasDocument` | Creates a new canvas document |
| `save_canvas` | `id: string, data: CanvasDocument` | `()` | Saves canvas state to disk |
| `load_canvas` | `id: string` | `CanvasDocument` | Loads a canvas document |
| `list_canvases` | — | `CanvasMeta[]` | Lists all canvas documents |
| `delete_canvas` | `id: string` | `()` | Deletes a canvas document |

### Canvas Templates

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `save_canvas_template` | `name: string, data: CanvasDocument` | `()` | Saves a canvas as a reusable template |
| `load_canvas_template` | `name: string` | `CanvasDocument` | Loads a canvas template |
| `list_canvas_templates` | — | `string[]` | Lists available templates |
| `delete_canvas_template` | `name: string` | `()` | Deletes a template |

### Canvas–Note Linking

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `link_canvas_to_note` | `canvas_id: string, note_path: string` | `()` | Associates a canvas with a note |
| `get_canvases_for_note` | `note_path: string` | `CanvasMeta[]` | Gets canvases linked to a note |

---

## Entity Commands

Typed entity/ontology system.

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `get_entity_types` | — | `EntityType[]` | Returns all defined entity types |
| `get_type_definition` | `type_name: string` | `TypeDefinition` | Gets schema for an entity type |
| `get_entity_relationships` | `path: string` | `Relationship[]` | Gets typed relationships for an entity |

---

## Lifecycle Commands

Note capture and lifecycle management.

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `quick_capture` | `content: string, tags?: string[]` | `Note` | Quickly captures a new note to inbox |
| `get_captured_notes` | — | `Note[]` | Lists notes in the capture/inbox state |
| `get_lifecycle_stats` | — | `LifecycleStats` | Returns counts per lifecycle state |
| `archive_note` | `path: string` | `()` | Moves a note to archived state |
| `organize_note` | `path: string, destination: string` | `()` | Moves a captured note to an organized location |
| `set_lifecycle_state` | `path: string, state: string` | `()` | Sets the lifecycle state of a note |

---

## Theme Commands

Theme loading and customization.

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `get_available_themes` | — | `ThemeMeta[]` | Lists installed themes |
| `load_theme` | `id: string` | `ThemeData` | Loads a theme's CSS variables |
| `get_theme_style_settings` | `id: string` | `StyleSettings` | Gets configurable style options |
| `initialize_theme_service` | — | `()` | Bootstraps the theme service |

---

## Plugin Commands

Plugin system management.

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `initialize_plugins` | — | `()` | Discovers and loads installed plugins |
| `get_plugins` | — | `PluginInfo[]` | Lists all plugins with status |
| `set_plugin_enabled` | `id: string, enabled: boolean` | `()` | Enables or disables a plugin |

---

## Embedding Commands

Vector embeddings for semantic search.

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `initialize_embeddings` | — | `()` | Initializes the embedding engine |
| `embed_note` | `path: string` | `()` | Generates embedding for a single note |
| `index_all_embeddings` | — | `number` | Re-indexes all notes, returns count |
| `get_similar_notes` | `path: string, limit?: number` | `SimilarNote[]` | Finds semantically similar notes |
| `lookup_by_text` | `text: string, limit?: number` | `SimilarNote[]` | Semantic search by arbitrary text |
| `get_embedding_config` | — | `EmbeddingConfig` | Returns current embedding configuration |
| `set_embedding_config` | `config: EmbeddingConfig` | `()` | Updates embedding configuration |
| `get_embedding_stats` | — | `EmbeddingStats` | Returns indexing statistics |

---

## Component Commands

Design component library management.

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `list_components` | — | `ComponentMeta[]` | Lists all saved design components |
| `read_component` | `id: string` | `Component` | Reads a component definition |
| `save_component` | `component: Component` | `()` | Saves or updates a component |
| `delete_component` | `id: string` | `()` | Deletes a component |

---

## Design Document Commands

Design document CRUD (stored in `.bismuth/design-docs/`).

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `design_doc_read` | `path: string` | `string` | Reads a design document's content |
| `design_doc_write` | `path: string, content: string` | `()` | Writes/updates a design document |
| `design_doc_list` | `doc_type?: string` | `string[]` | Lists design documents, optionally by type |
| `design_doc_delete` | `path: string` | `()` | Deletes a design document |

---

## Type Reference

### Core Types

```typescript
interface Vault {
  name: string;
  root_path: string;
}

interface Note {
  path: string;
  title: string;
  content: string;
  frontmatter: Record<string, unknown>;
  created_at: string;
  modified_at: string;
}

interface SearchResult {
  path: string;
  title: string;
  snippet: string;
  score: number;
}

interface TagInfo {
  name: string;
  count: number;
}

interface Backlink {
  source_path: string;
  context: string;
  line: number;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

---

## Error Handling

All commands return `Result<T, BismuthError>`. Error variants:

| Variant | Description |
|---------|-------------|
| `VaultError` | Vault state issues (no vault open, vault not found) |
| `IoError` | File system errors (permission denied, not found) |
| `SearchError` | Search indexing or query failures |
| `ParseError` | YAML/JSON parsing failures |
| `ValidationError` | Path traversal or input validation failures |

---

## Security

- All file operations validate paths stay within the vault boundary via `validate_path()`
- Path traversal attacks (e.g., `../../etc/passwd`) are rejected with `ValidationError`
- No network requests are made by the backend — all operations are local

---

## Adding New Commands

1. Create the command function in the appropriate `src-tauri/src/commands/` module
2. Annotate with `#[tauri::command]`
3. Register in `src-tauri/src/app/handlers.rs` → `generate_handler![]`
4. Create a frontend service wrapper in `src/lib/services/`
5. Add TypeScript types to `src/lib/types/`
6. Update this API spec

---

*Last Updated: 2026-06-09*
