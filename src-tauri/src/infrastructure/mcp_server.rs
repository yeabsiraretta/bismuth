//! MCP (Model Context Protocol) server for Bismuth.
//!
//! Implements JSON-RPC 2.0 over HTTP at `/mcp`. AI assistants can discover
//! and interact with the user's vault through standard MCP tools/resources.

use std::sync::Arc;

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::hubs::core::{backup_service, embedding_service, git_service, stats_service, vault_service, version_service};
use crate::infrastructure::state::AppState;

// ── JSON-RPC types ──────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct JsonRpcRequest {
    pub jsonrpc: String,
    pub id: Option<Value>,
    pub method: String,
    #[serde(default)]
    pub params: Value,
}

#[derive(Serialize)]
pub struct JsonRpcResponse {
    pub jsonrpc: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<JsonRpcError>,
}

#[derive(Serialize)]
pub struct JsonRpcError {
    pub code: i32,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Value>,
}

impl JsonRpcResponse {
    fn ok(id: Option<Value>, result: Value) -> Self {
        Self {
            jsonrpc: "2.0",
            id,
            result: Some(result),
            error: None,
        }
    }

    fn err(id: Option<Value>, code: i32, message: String) -> Self {
        Self {
            jsonrpc: "2.0",
            id,
            result: None,
            error: Some(JsonRpcError {
                code,
                message,
                data: None,
            }),
        }
    }
}

// ── MCP protocol types ──────────────────────────────────────────────────────

#[derive(Serialize)]
struct McpCapabilities {
    tools: McpToolCaps,
    resources: McpResourceCaps,
}

#[derive(Serialize)]
struct McpToolCaps {
    #[serde(rename = "listChanged")]
    list_changed: bool,
}

#[derive(Serialize)]
struct McpResourceCaps {
    subscribe: bool,
    #[serde(rename = "listChanged")]
    list_changed: bool,
}

#[derive(Serialize)]
struct McpServerInfo {
    name: &'static str,
    version: &'static str,
}

#[derive(Serialize)]
struct McpInitResult {
    #[serde(rename = "protocolVersion")]
    protocol_version: &'static str,
    capabilities: McpCapabilities,
    #[serde(rename = "serverInfo")]
    server_info: McpServerInfo,
}

#[derive(Serialize)]
struct McpTool {
    name: String,
    description: String,
    #[serde(rename = "inputSchema")]
    input_schema: Value,
}

#[derive(Serialize)]
struct McpResource {
    uri: String,
    name: String,
    description: String,
    #[serde(rename = "mimeType")]
    mime_type: String,
}

#[derive(Serialize)]
struct McpResourceContent {
    uri: String,
    #[serde(rename = "mimeType")]
    mime_type: String,
    text: String,
}

#[derive(Serialize)]
struct McpToolResult {
    content: Vec<McpTextContent>,
    #[serde(rename = "isError")]
    is_error: bool,
}

#[derive(Serialize)]
struct McpTextContent {
    #[serde(rename = "type")]
    content_type: &'static str,
    text: String,
}

// ── Tool definitions ────────────────────────────────────────────────────────

fn tool_definitions() -> Vec<McpTool> {
    vec![
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
            description: "Create a new note with a title and optional folder".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "title": { "type": "string", "description": "Title for the new note" },
                    "folder": { "type": "string", "description": "Optional subfolder" }
                },
                "required": ["title"]
            }),
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
        // ── Canvas ──
        McpTool {
            name: "list_canvases".into(),
            description: "List all .canvas files in the vault".into(),
            input_schema: serde_json::json!({ "type": "object", "properties": {} }),
        },
        McpTool {
            name: "read_canvas".into(),
            description: "Read a canvas file (returns JSON with elements and connections)".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": { "path": { "type": "string", "description": "Relative path to the .canvas file" } },
                "required": ["path"]
            }),
        },
        McpTool {
            name: "write_canvas".into(),
            description: "Write/overwrite a canvas file with JSON data".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "content": { "type": "string", "description": "Full JSON content of the canvas" }
                },
                "required": ["path", "content"]
            }),
        },
        // ── Git ──
        McpTool {
            name: "git_status".into(),
            description: "Get git status of the vault (branch, staged, modified, untracked counts)".into(),
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
            description: "Find notes semantically similar to a given note (TF-IDF cosine similarity)".into(),
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
    ]
}

// ── Method dispatch ─────────────────────────────────────────────────────────

fn handle_initialize(id: Option<Value>) -> JsonRpcResponse {
    let result = McpInitResult {
        protocol_version: "2024-11-05",
        capabilities: McpCapabilities {
            tools: McpToolCaps {
                list_changed: false,
            },
            resources: McpResourceCaps {
                subscribe: false,
                list_changed: false,
            },
        },
        server_info: McpServerInfo {
            name: "bismuth",
            version: env!("CARGO_PKG_VERSION"),
        },
    };
    JsonRpcResponse::ok(id, serde_json::to_value(result).unwrap())
}

fn handle_tools_list(id: Option<Value>) -> JsonRpcResponse {
    let tools = tool_definitions();
    JsonRpcResponse::ok(
        id,
        serde_json::json!({ "tools": serde_json::to_value(tools).unwrap() }),
    )
}

fn handle_tools_call(
    id: Option<Value>,
    params: &Value,
    state: &AppState,
) -> JsonRpcResponse {
    let tool_name = params
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let args = params.get("arguments").cloned().unwrap_or(Value::Object(Default::default()));

    let result = match tool_name {
        "list_notes" => vault_service::scan_vault(state)
            .map(|n| serde_json::to_string_pretty(&n).unwrap()),
        "read_note" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::read_note(state, path)
                .map(|n| serde_json::to_string_pretty(&n).unwrap())
        }
        "write_note" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let content = args.get("content").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::write_note(state, path, content).map(|_| "Note written.".into())
        }
        "create_note" => {
            let title = args.get("title").and_then(|v| v.as_str()).unwrap_or("");
            let folder = args.get("folder").and_then(|v| v.as_str());
            vault_service::create_note(state, title, folder)
                .map(|n| serde_json::to_string_pretty(&n).unwrap())
        }
        "delete_note" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::delete_note(state, path).map(|_| "Note deleted.".into())
        }
        "search_vault" => {
            let query = args.get("query").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::search_vault(state, query)
                .map(|r| serde_json::to_string_pretty(&r).unwrap())
        }
        "vault_stats" => stats_service::compute_vault_stats(state)
            .map(|s| serde_json::to_string_pretty(&s).unwrap()),
        "vault_tags" => vault_service::extract_vault_tags(state)
            .map(|t| serde_json::to_string_pretty(&t).unwrap()),
        "rename_note" => {
            let old_path = args.get("old_path").and_then(|v| v.as_str()).unwrap_or("");
            let new_title = args.get("new_title").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::rename_note(state, old_path, new_title)
                .map(|n| serde_json::to_string_pretty(&n).unwrap())
        }
        "batch_read_notes" => {
            let paths: Vec<String> = args.get("paths")
                .and_then(|v| v.as_array())
                .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
                .unwrap_or_default();
            vault_service::batch_read_notes(state, &paths)
                .map(|b| serde_json::to_string_pretty(&b).unwrap())
        }
        "graph_data" => vault_service::build_graph_data(state)
            .map(|g| serde_json::to_string_pretty(&g).unwrap()),
        "list_canvases" => {
            // Filter vault scan for .canvas files
            vault_service::scan_vault(state).map(|notes| {
                let canvases: Vec<_> = notes.iter().filter(|n| n.path.ends_with(".canvas")).collect();
                serde_json::to_string_pretty(&canvases).unwrap()
            })
        }
        "read_canvas" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::read_note(state, path)
                .map(|n| n.content)
        }
        "write_canvas" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let content = args.get("content").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::write_note(state, path, content).map(|_| "Canvas written.".into())
        }
        "git_status" => git_service::git_status(state)
            .map(|s| serde_json::to_string_pretty(&s).unwrap()),
        "git_stage_all" => git_service::git_stage_all(state)
            .map(|_| "All changes staged.".into()),
        "git_commit" => {
            let message = args.get("message").and_then(|v| v.as_str()).unwrap_or("MCP commit");
            git_service::git_commit(state, message).map(|_| "Committed.".into())
        }
        "git_push" => git_service::git_push(state)
            .map(|_| "Pushed.".into()),
        "git_pull" => git_service::git_pull(state)
            .map(|_| "Pulled.".into()),
        "list_versions" => {
            let note_path = args.get("note_path").and_then(|v| v.as_str()).unwrap_or("");
            version_service::list_versions(state, note_path)
                .map(|v| serde_json::to_string_pretty(&v).unwrap())
        }
        "create_version" => {
            let note_path = args.get("note_path").and_then(|v| v.as_str()).unwrap_or("");
            let label = args.get("label").and_then(|v| v.as_str());
            version_service::create_version(state, note_path, label)
                .map(|v| serde_json::to_string_pretty(&v).unwrap())
        }
        "read_version" => {
            let note_path = args.get("note_path").and_then(|v| v.as_str()).unwrap_or("");
            let version_id = args.get("version_id").and_then(|v| v.as_str()).unwrap_or("");
            version_service::read_version(state, note_path, version_id)
        }
        "create_backup" => backup_service::create_backup(state)
            .map(|b| serde_json::to_string_pretty(&b).unwrap()),
        "list_backups" => backup_service::list_backups(state)
            .map(|b| serde_json::to_string_pretty(&b).unwrap()),
        "find_similar_notes" => {
            let note_path = args.get("note_path").and_then(|v| v.as_str()).unwrap_or("");
            let limit = args.get("limit").and_then(|v| v.as_u64()).unwrap_or(10) as usize;
            let min_score = args.get("min_score").and_then(|v| v.as_f64()).unwrap_or(0.1);
            embedding_service::find_similar_notes(state, note_path, limit, min_score)
                .map(|s| serde_json::to_string_pretty(&s).unwrap())
        }
        "find_similar_to_text" => {
            let query = args.get("query").and_then(|v| v.as_str()).unwrap_or("");
            let limit = args.get("limit").and_then(|v| v.as_u64()).unwrap_or(10) as usize;
            let min_score = args.get("min_score").and_then(|v| v.as_f64()).unwrap_or(0.1);
            embedding_service::find_similar_to_text(state, query, limit, min_score)
                .map(|s| serde_json::to_string_pretty(&s).unwrap())
        }
        _ => Err(crate::infrastructure::error::AppError::Custom(format!(
            "Unknown tool: {tool_name}"
        ))),
    };

    match result {
        Ok(text) => {
            let tool_result = McpToolResult {
                content: vec![McpTextContent {
                    content_type: "text",
                    text,
                }],
                is_error: false,
            };
            JsonRpcResponse::ok(id, serde_json::to_value(tool_result).unwrap())
        }
        Err(e) => {
            let tool_result = McpToolResult {
                content: vec![McpTextContent {
                    content_type: "text",
                    text: e.to_string(),
                }],
                is_error: true,
            };
            JsonRpcResponse::ok(id, serde_json::to_value(tool_result).unwrap())
        }
    }
}

fn handle_resources_list(id: Option<Value>, state: &AppState) -> JsonRpcResponse {
    let mut resources = vec![McpResource {
        uri: "bismuth://vault".into(),
        name: "Vault Info".into(),
        description: "Current vault metadata and statistics".into(),
        mime_type: "application/json".into(),
    }];

    if let Ok(notes) = vault_service::scan_vault(state) {
        for note in notes.iter().take(500) {
            resources.push(McpResource {
                uri: format!("bismuth://notes/{}", note.path),
                name: note.title.clone(),
                description: format!("Note: {}", note.path),
                mime_type: "text/markdown".into(),
            });
        }
    }

    JsonRpcResponse::ok(
        id,
        serde_json::json!({ "resources": serde_json::to_value(resources).unwrap() }),
    )
}

fn handle_resources_read(
    id: Option<Value>,
    params: &Value,
    state: &AppState,
) -> JsonRpcResponse {
    let uri = params
        .get("uri")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    if uri == "bismuth://vault" {
        return match stats_service::compute_vault_stats(state) {
            Ok(stats) => {
                let content = McpResourceContent {
                    uri: uri.to_string(),
                    mime_type: "application/json".into(),
                    text: serde_json::to_string_pretty(&stats).unwrap(),
                };
                JsonRpcResponse::ok(
                    id,
                    serde_json::json!({ "contents": [serde_json::to_value(content).unwrap()] }),
                )
            }
            Err(e) => JsonRpcResponse::err(id, -32000, e.to_string()),
        };
    }

    if let Some(note_path) = uri.strip_prefix("bismuth://notes/") {
        return match vault_service::read_note(state, note_path) {
            Ok(note) => {
                let content = McpResourceContent {
                    uri: uri.to_string(),
                    mime_type: "text/markdown".into(),
                    text: note.content,
                };
                JsonRpcResponse::ok(
                    id,
                    serde_json::json!({ "contents": [serde_json::to_value(content).unwrap()] }),
                )
            }
            Err(e) => JsonRpcResponse::err(id, -32002, e.to_string()),
        };
    }

    JsonRpcResponse::err(id, -32001, format!("Unknown resource URI: {uri}"))
}

// ── HTTP handler ────────────────────────────────────────────────────────────

pub async fn mcp_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<JsonRpcRequest>,
) -> impl IntoResponse {
    tracing::debug!(method = %req.method, "MCP request");

    let resp = match req.method.as_str() {
        "initialize" => handle_initialize(req.id),
        "initialized" => {
            // Notification — no response required, but return empty for HTTP
            return (StatusCode::OK, Json(JsonRpcResponse::ok(req.id, Value::Object(Default::default()))));
        }
        "tools/list" => handle_tools_list(req.id),
        "tools/call" => handle_tools_call(req.id, &req.params, &state),
        "resources/list" => handle_resources_list(req.id, &state),
        "resources/read" => handle_resources_read(req.id, &req.params, &state),
        "ping" => JsonRpcResponse::ok(req.id, Value::Object(Default::default())),
        _ => JsonRpcResponse::err(req.id, -32601, format!("Method not found: {}", req.method)),
    };

    (StatusCode::OK, Json(resp))
}
