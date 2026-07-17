use super::McpTool;

mod canvas_tools;
use canvas_tools::canvas_tool_definitions;

pub(super) fn tool_definitions() -> Vec<McpTool> {
    let mut tools = vec![
        McpTool {
            name: "list_notes".into(),
            description: "List all notes in the vault with metadata".into(),
            input_schema: serde_json::json!({ "type": "object", "properties": {} }),
        },
        McpTool {
            name: "read_note".into(),
            description: "Read the content of a note by its relative path".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": { "path": { "type": "string", "description": "Relative path to the note (e.g. 'folder/note.md')" } },
                "required": ["path"]
            }),
        },
        McpTool {
            name: "write_note".into(),
            description: "Write/overwrite the content of a note".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the note" },
                    "content": { "type": "string", "description": "Full markdown content to write" }
                },
                "required": ["path", "content"]
            }),
        },
        McpTool {
            name: "create_note".into(),
            description: "Create a new note with a title, optional folder, and optional extension"
                .into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "title": { "type": "string", "description": "Title for the new note" },
                    "folder": { "type": "string", "description": "Optional subfolder" },
                    "extension": { "type": "string", "enum": ["md", "pen"], "description": "Optional note extension (default: md)" }
                },
                "required": ["title"]
            }),
        },
        McpTool {
            name: "list_pen_notes".into(),
            description: "List all .pen files in the vault".into(),
            input_schema: serde_json::json!({ "type": "object", "properties": {} }),
        },
        McpTool {
            name: "search_vault".into(),
            description: "Full-text search across all vault notes".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": { "query": { "type": "string", "description": "Search query" } },
                "required": ["query"]
            }),
        },
        McpTool {
            name: "vault_stats".into(),
            description: "Get statistics about the vault (note count, word count, tags, etc.)".into(),
            input_schema: serde_json::json!({ "type": "object", "properties": {} }),
        },
        McpTool {
            name: "vault_tags".into(),
            description: "List all tags in the vault with occurrence counts".into(),
            input_schema: serde_json::json!({ "type": "object", "properties": {} }),
        },
        McpTool {
            name: "delete_note".into(),
            description: "Delete a note by its relative path".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": { "path": { "type": "string", "description": "Relative path to delete" } },
                "required": ["path"]
            }),
        },
        McpTool {
            name: "rename_note".into(),
            description: "Rename a note (moves file and returns updated metadata)".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "old_path": { "type": "string", "description": "Current relative path" },
                    "new_title": { "type": "string", "description": "New title (without .md extension)" }
                },
                "required": ["old_path", "new_title"]
            }),
        },
        McpTool {
            name: "batch_read_notes".into(),
            description: "Read content of multiple notes in one call".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "paths": { "type": "array", "items": { "type": "string" }, "description": "Array of relative paths" }
                },
                "required": ["paths"]
            }),
        },
        // ── Graph ──
        McpTool {
            name: "graph_data".into(),
            description: "Get the full knowledge graph (nodes and edges from wikilinks)".into(),
            input_schema: serde_json::json!({ "type": "object", "properties": {} }),
        },
    ];

    tools.extend(canvas_tool_definitions());
    tools.extend(vec![
        // ── Git ──
        McpTool {
            name: "git_status".into(),
            description:
                "Get git status of the vault (branch, staged, modified, untracked counts)".into(),
            input_schema: serde_json::json!({ "type": "object", "properties": {} }),
        },
        McpTool {
            name: "git_stage_all".into(),
            description: "Stage all changes in the vault (git add -A)".into(),
            input_schema: serde_json::json!({ "type": "object", "properties": {} }),
        },
        McpTool {
            name: "git_commit".into(),
            description: "Commit staged changes with a message".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": { "message": { "type": "string", "description": "Commit message" } },
                "required": ["message"]
            }),
        },
        McpTool {
            name: "git_push".into(),
            description: "Push commits to the remote".into(),
            input_schema: serde_json::json!({ "type": "object", "properties": {} }),
        },
        McpTool {
            name: "git_pull".into(),
            description: "Pull latest from the remote".into(),
            input_schema: serde_json::json!({ "type": "object", "properties": {} }),
        },
        // ── Versions ──
        McpTool {
            name: "list_versions".into(),
            description: "List version history snapshots of a note".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": { "note_path": { "type": "string", "description": "Relative path to the note" } },
                "required": ["note_path"]
            }),
        },
        McpTool {
            name: "create_version".into(),
            description: "Create a version snapshot of a note".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "note_path": { "type": "string", "description": "Relative path to the note" },
                    "label": { "type": "string", "description": "Optional label for this version" }
                },
                "required": ["note_path"]
            }),
        },
        McpTool {
            name: "read_version".into(),
            description: "Read the content of a specific version snapshot".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "note_path": { "type": "string", "description": "Relative path to the note" },
                    "version_id": { "type": "string", "description": "Version ID" }
                },
                "required": ["note_path", "version_id"]
            }),
        },
        // ── Backups ──
        McpTool {
            name: "create_backup".into(),
            description: "Create a zip backup of the entire vault".into(),
            input_schema: serde_json::json!({ "type": "object", "properties": {} }),
        },
        McpTool {
            name: "list_backups".into(),
            description: "List all vault backups".into(),
            input_schema: serde_json::json!({ "type": "object", "properties": {} }),
        },
        // ── Smart Connections ──
        McpTool {
            name: "find_similar_notes".into(),
            description: "Find notes semantically similar to a given note (TF-IDF cosine similarity)"
                .into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "note_path": { "type": "string", "description": "Relative path to the reference note" },
                    "limit": { "type": "integer", "description": "Max results (default 10)", "default": 10 },
                    "min_score": { "type": "number", "description": "Minimum similarity score 0-1 (default 0.1)", "default": 0.1 }
                },
                "required": ["note_path"]
            }),
        },
        McpTool {
            name: "find_similar_to_text".into(),
            description: "Find notes semantically similar to arbitrary text".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "query": { "type": "string", "description": "Text to find similar notes for" },
                    "limit": { "type": "integer", "description": "Max results (default 10)", "default": 10 },
                    "min_score": { "type": "number", "description": "Minimum similarity score 0-1 (default 0.1)", "default": 0.1 }
                },
                "required": ["query"]
            }),
        },
    ]);
    tools
}
