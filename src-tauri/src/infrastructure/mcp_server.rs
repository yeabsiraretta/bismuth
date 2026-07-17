//! MCP (Model Context Protocol) server for Bismuth.
//!
//! Implements JSON-RPC 2.0 over HTTP at `/mcp`. AI assistants can discover
//! and interact with the user's vault through standard MCP tools/resources.

use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{Map, Value};

use crate::hubs::core::{
    backup_service, embedding_service, git_service, stats_service, vault_service, version_service,
};
use crate::infrastructure::error::{AppError, AppResult};
use crate::infrastructure::state::AppState;

mod canvas_advanced_ops;
mod canvas_assets_ops;
mod canvas_code_connect_ops;
mod canvas_render_ops;
mod canvas_structure_ops;
mod protocol;
mod tool_catalog;
use canvas_advanced_ops::{
    constraint_preset_payload, list_canvas_design_library_versions_op,
    publish_canvas_design_library_op, restore_canvas_design_library_version_op,
    set_canvas_constraint_preset_op, set_canvas_instance_slots_op, set_canvas_instance_state_op,
    upsert_canvas_component_slot_op, upsert_canvas_component_state_op,
};
use canvas_assets_ops::{
    apply_canvas_style_op, bind_canvas_token_op, define_canvas_variant_set_op,
    export_canvas_handoff_op, generate_code_connect_snippets_op, list_canvas_tokens_op,
    resolve_canvas_instance_render_op, set_canvas_instance_variant_op, set_canvas_token_mode_op,
    upsert_canvas_style_op, upsert_canvas_token_op, upsert_canvas_variant_op,
};
use canvas_render_ops::{build_instance_render_snapshot, update_instance_snapshot};
use canvas_code_connect_ops::{
    list_canvas_code_connect_op, upsert_canvas_code_connect_op,
    validate_canvas_code_connect_contract_op,
};
use canvas_structure_ops::{
    align_canvas_elements_op, create_canvas_component_op, create_canvas_instance_op,
    distribute_canvas_elements_op, list_canvas_component_properties_op, list_canvas_elements_op,
    reorder_canvas_elements_op, set_canvas_auto_layout_op, set_canvas_instance_overrides_op,
    style_canvas_elements_op, upsert_canvas_component_property_op,
};
use protocol::*;
use tool_catalog::tool_definitions;

fn required_str<'a>(args: &'a Value, key: &str) -> AppResult<&'a str> {
    args.get(key)
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::Custom(format!("Missing required string argument: {key}")))
}

fn optional_string_list(args: &Value, key: &str) -> Vec<String> {
    args.get(key)
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default()
}

fn now_millis() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn load_canvas_json(state: &AppState, path: &str) -> AppResult<Value> {
    let note = vault_service::read_note(state, path)?;
    let doc: Value = serde_json::from_str(&note.content)?;
    if !doc.get("elements").is_some_and(|v| v.is_array()) {
        return Err(AppError::Custom(format!(
            "Invalid canvas file '{path}': expected root.elements array"
        )));
    }
    Ok(doc)
}

fn save_canvas_json(state: &AppState, path: &str, doc: &Value) -> AppResult<()> {
    let content = serde_json::to_string_pretty(doc)?;
    vault_service::write_note(state, path, &content)
}

fn canvas_elements(doc: &Value) -> AppResult<&Vec<Value>> {
    doc.get("elements")
        .and_then(Value::as_array)
        .ok_or_else(|| AppError::Custom("Canvas is missing elements array".into()))
}

fn canvas_elements_mut(doc: &mut Value) -> AppResult<&mut Vec<Value>> {
    doc.get_mut("elements")
        .and_then(Value::as_array_mut)
        .ok_or_else(|| AppError::Custom("Canvas is missing elements array".into()))
}

fn canvas_root_mut(doc: &mut Value) -> AppResult<&mut Map<String, Value>> {
    doc.as_object_mut()
        .ok_or_else(|| AppError::Custom("Canvas root must be a JSON object".into()))
}

fn root_array_mut<'a>(doc: &'a mut Value, key: &str) -> AppResult<&'a mut Vec<Value>> {
    let root = canvas_root_mut(doc)?;
    root.entry(key)
        .or_insert_with(|| Value::Array(Vec::new()))
        .as_array_mut()
        .ok_or_else(|| AppError::Custom(format!("Canvas {key} must be an array")))
}

fn root_object_mut<'a>(doc: &'a mut Value, key: &str) -> AppResult<&'a mut Map<String, Value>> {
    let root = canvas_root_mut(doc)?;
    root.entry(key)
        .or_insert_with(|| Value::Object(Map::new()))
        .as_object_mut()
        .ok_or_else(|| AppError::Custom(format!("Canvas {key} must be an object")))
}

fn root_array(doc: &Value, key: &str) -> Vec<Value> {
    doc.get(key)
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default()
}

fn element_id(el: &Value) -> Option<&str> {
    el.get("id").and_then(Value::as_str)
}

fn number_field(el: &Value, key: &str) -> Option<f64> {
    el.get(key).and_then(Value::as_f64)
}

fn set_number_field(el: &mut Value, key: &str, value: f64) {
    if let Some(obj) = el.as_object_mut() {
        obj.insert(key.to_string(), serde_json::json!(value));
    }
}

fn merge_json_patch(target: &mut Value, patch: &Value) {
    match (target, patch) {
        (Value::Object(target_obj), Value::Object(patch_obj)) => {
            for (k, v) in patch_obj {
                let entry = target_obj.entry(k.clone()).or_insert(Value::Null);
                merge_json_patch(entry, v);
            }
        },
        (target_value, patch_value) => {
            *target_value = patch_value.clone();
        },
    }
}

fn slot_value_is_empty(value: &Value) -> bool {
    match value {
        Value::Null => true,
        Value::String(s) => s.trim().is_empty(),
        Value::Array(items) => items.is_empty(),
        Value::Object(map) => map.is_empty(),
        _ => false,
    }
}

fn upsert_entries_by_id(target: &mut Vec<Value>, incoming: &[Value]) {
    for entry in incoming {
        let entry_id = entry.get("id").and_then(Value::as_str).unwrap_or_default();
        if entry_id.is_empty() {
            target.push(entry.clone());
            continue;
        }
        if let Some(existing) = target
            .iter_mut()
            .find(|candidate| candidate.get("id").and_then(Value::as_str) == Some(entry_id))
        {
            *existing = entry.clone();
        } else {
            target.push(entry.clone());
        }
    }
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

fn handle_tools_call(id: Option<Value>, params: &Value, state: &AppState) -> JsonRpcResponse {
    let tool_name = params.get("name").and_then(|v| v.as_str()).unwrap_or("");
    let args = params
        .get("arguments")
        .cloned()
        .unwrap_or(Value::Object(Default::default()));

    let result = match tool_name {
        "list_notes" => {
            vault_service::scan_vault(state).map(|n| serde_json::to_string_pretty(&n).unwrap())
        },
        "read_note" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::read_note(state, path).map(|n| serde_json::to_string_pretty(&n).unwrap())
        },
        "write_note" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let content = args.get("content").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::write_note(state, path, content).map(|_| "Note written.".into())
        },
        "create_note" => {
            let title = args.get("title").and_then(|v| v.as_str()).unwrap_or("");
            let folder = args.get("folder").and_then(|v| v.as_str());
            let extension = args.get("extension").and_then(|v| v.as_str());
            vault_service::create_note(state, title, folder, extension)
                .map(|n| serde_json::to_string_pretty(&n).unwrap())
        },
        "list_pen_notes" => vault_service::scan_vault(state).map(|notes| {
            let pen_notes: Vec<_> = notes.iter().filter(|n| n.path.ends_with(".pen")).collect();
            serde_json::to_string_pretty(&pen_notes).unwrap()
        }),
        "delete_note" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::delete_note(state, path).map(|_| "Note deleted.".into())
        },
        "search_vault" => {
            let query = args.get("query").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::search_vault(state, query)
                .map(|r| serde_json::to_string_pretty(&r).unwrap())
        },
        "vault_stats" => stats_service::compute_vault_stats(state)
            .map(|s| serde_json::to_string_pretty(&s).unwrap()),
        "vault_tags" => vault_service::extract_vault_tags(state)
            .map(|t| serde_json::to_string_pretty(&t).unwrap()),
        "rename_note" => {
            let old_path = args.get("old_path").and_then(|v| v.as_str()).unwrap_or("");
            let new_title = args.get("new_title").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::rename_note(state, old_path, new_title)
                .map(|n| serde_json::to_string_pretty(&n).unwrap())
        },
        "batch_read_notes" => {
            let paths: Vec<String> = args
                .get("paths")
                .and_then(|v| v.as_array())
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.as_str().map(String::from))
                        .collect()
                })
                .unwrap_or_default();
            vault_service::batch_read_notes(state, &paths)
                .map(|b| serde_json::to_string_pretty(&b).unwrap())
        },
        "graph_data" => vault_service::build_graph_data(state)
            .map(|g| serde_json::to_string_pretty(&g).unwrap()),
        "list_canvases" => {
            // Filter vault scan for .canvas files
            vault_service::scan_vault(state).map(|notes| {
                let canvases: Vec<_> = notes
                    .iter()
                    .filter(|n| n.path.ends_with(".canvas"))
                    .collect();
                serde_json::to_string_pretty(&canvases).unwrap()
            })
        },
        "read_canvas" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::read_note(state, path).map(|n| n.content)
        },
        "write_canvas" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let content = args.get("content").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::write_note(state, path, content).map(|_| "Canvas written.".into())
        },
        "list_canvas_elements" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            list_canvas_elements_op(state, path)
                .map(|payload| serde_json::to_string_pretty(&payload).unwrap())
        },
        "align_canvas_elements" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_ids = optional_string_list(&args, "node_ids");
            let direction = args.get("direction").and_then(|v| v.as_str()).unwrap_or("");
            align_canvas_elements_op(state, path, &node_ids, direction)
                .map(|payload| serde_json::to_string_pretty(&payload).unwrap())
        },
        "distribute_canvas_elements" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_ids = optional_string_list(&args, "node_ids");
            let axis = args.get("axis").and_then(|v| v.as_str()).unwrap_or("");
            distribute_canvas_elements_op(state, path, &node_ids, axis)
                .map(|payload| serde_json::to_string_pretty(&payload).unwrap())
        },
        "reorder_canvas_elements" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_ids = optional_string_list(&args, "node_ids");
            let operation = args.get("operation").and_then(|v| v.as_str()).unwrap_or("");
            reorder_canvas_elements_op(state, path, &node_ids, operation)
                .map(|payload| serde_json::to_string_pretty(&payload).unwrap())
        },
        "style_canvas_elements" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_ids = optional_string_list(&args, "node_ids");
            let style = args
                .get("style")
                .cloned()
                .unwrap_or_else(|| serde_json::json!({}));
            style_canvas_elements_op(state, path, &node_ids, &style)
                .map(|payload| serde_json::to_string_pretty(&payload).unwrap())
        },
        "set_canvas_auto_layout" => set_canvas_auto_layout_op(state, &args)
            .map(|payload| serde_json::to_string_pretty(&payload).unwrap()),
        "create_canvas_component" => create_canvas_component_op(state, &args)
            .map(|payload| serde_json::to_string_pretty(&payload).unwrap()),
        "create_canvas_instance" => create_canvas_instance_op(state, &args)
            .map(|payload| serde_json::to_string_pretty(&payload).unwrap()),
        "upsert_canvas_component_property" => upsert_canvas_component_property_op(state, &args)
            .map(|payload| serde_json::to_string_pretty(&payload).unwrap()),
        "list_canvas_component_properties" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_id = args.get("node_id").and_then(|v| v.as_str()).unwrap_or("");
            list_canvas_component_properties_op(state, path, node_id)
                .map(|payload| serde_json::to_string_pretty(&payload).unwrap())
        },
        "set_canvas_instance_overrides" => set_canvas_instance_overrides_op(state, &args)
            .map(|payload| serde_json::to_string_pretty(&payload).unwrap()),
        "set_canvas_constraint_preset" => set_canvas_constraint_preset_op(state, &args)
            .map(|payload| serde_json::to_string_pretty(&payload).unwrap()),
        "upsert_canvas_component_state" => upsert_canvas_component_state_op(state, &args)
            .map(|payload| serde_json::to_string_pretty(&payload).unwrap()),
        "set_canvas_instance_state" => set_canvas_instance_state_op(state, &args)
            .map(|payload| serde_json::to_string_pretty(&payload).unwrap()),
        "upsert_canvas_component_slot" => upsert_canvas_component_slot_op(state, &args)
            .map(|payload| serde_json::to_string_pretty(&payload).unwrap()),
        "set_canvas_instance_slots" => set_canvas_instance_slots_op(state, &args)
            .map(|payload| serde_json::to_string_pretty(&payload).unwrap()),
        "upsert_canvas_code_connect" => upsert_canvas_code_connect_op(state, &args)
            .map(|payload| serde_json::to_string_pretty(&payload).unwrap()),
        "upsert_canvas_token" => upsert_canvas_token_op(state, &args)
            .map(|payload| serde_json::to_string_pretty(&payload).unwrap()),
        "list_canvas_tokens" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let collection = args.get("collection").and_then(|v| v.as_str());
            list_canvas_tokens_op(state, path, collection)
                .map(|payload| serde_json::to_string_pretty(&payload).unwrap())
        },
        "bind_canvas_token" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_ids = optional_string_list(&args, "node_ids");
            let property_path = args
                .get("property_path")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let token_id = args.get("token_id").and_then(|v| v.as_str()).unwrap_or("");
            bind_canvas_token_op(state, path, &node_ids, property_path, token_id)
                .map(|payload| serde_json::to_string_pretty(&payload).unwrap())
        },
        "upsert_canvas_style" => upsert_canvas_style_op(state, &args)
            .map(|payload| serde_json::to_string_pretty(&payload).unwrap()),
        "apply_canvas_style" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_ids = optional_string_list(&args, "node_ids");
            let style_id = args.get("style_id").and_then(|v| v.as_str()).unwrap_or("");
            apply_canvas_style_op(state, path, &node_ids, style_id)
                .map(|payload| serde_json::to_string_pretty(&payload).unwrap())
        },
        "define_canvas_variant_set" => define_canvas_variant_set_op(state, &args)
            .map(|payload| serde_json::to_string_pretty(&payload).unwrap()),
        "upsert_canvas_variant" => upsert_canvas_variant_op(state, &args)
            .map(|payload| serde_json::to_string_pretty(&payload).unwrap()),
        "set_canvas_instance_variant" => set_canvas_instance_variant_op(state, &args)
            .map(|payload| serde_json::to_string_pretty(&payload).unwrap()),
        "set_canvas_token_mode" => set_canvas_token_mode_op(state, &args)
            .map(|payload| serde_json::to_string_pretty(&payload).unwrap()),
        "list_canvas_code_connect" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_id = args.get("node_id").and_then(|v| v.as_str());
            list_canvas_code_connect_op(state, path, node_id)
                .map(|payload| serde_json::to_string_pretty(&payload).unwrap())
        },
        "validate_canvas_code_connect_contract" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_ids = optional_string_list(&args, "node_ids");
            validate_canvas_code_connect_contract_op(state, path, &node_ids)
                .map(|payload| serde_json::to_string_pretty(&payload).unwrap())
        },
        "publish_canvas_design_library" => publish_canvas_design_library_op(state, &args)
            .map(|payload| serde_json::to_string_pretty(&payload).unwrap()),
        "list_canvas_design_library_versions" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let library_name = args.get("library_name").and_then(|v| v.as_str());
            list_canvas_design_library_versions_op(state, path, library_name)
                .map(|payload| serde_json::to_string_pretty(&payload).unwrap())
        },
        "restore_canvas_design_library_version" => {
            restore_canvas_design_library_version_op(state, &args)
                .map(|payload| serde_json::to_string_pretty(&payload).unwrap())
        },
        "resolve_canvas_instance_render" => resolve_canvas_instance_render_op(state, &args)
            .map(|payload| serde_json::to_string_pretty(&payload).unwrap()),
        "generate_code_connect_snippets" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_ids = optional_string_list(&args, "node_ids");
            let node_subset = if node_ids.is_empty() {
                None
            } else {
                Some(node_ids.as_slice())
            };
            generate_code_connect_snippets_op(state, path, node_subset)
                .map(|payload| serde_json::to_string_pretty(&payload).unwrap())
        },
        "export_canvas_handoff" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_ids = optional_string_list(&args, "node_ids");
            export_canvas_handoff_op(state, path, &node_ids)
                .map(|payload| serde_json::to_string_pretty(&payload).unwrap())
        },
        "git_status" => {
            git_service::git_status(state).map(|s| serde_json::to_string_pretty(&s).unwrap())
        },
        "git_stage_all" => git_service::git_stage_all(state).map(|_| "All changes staged.".into()),
        "git_commit" => {
            let message = args
                .get("message")
                .and_then(|v| v.as_str())
                .unwrap_or("MCP commit");
            git_service::git_commit(state, message).map(|_| "Committed.".into())
        },
        "git_push" => git_service::git_push(state).map(|_| "Pushed.".into()),
        "git_pull" => git_service::git_pull(state).map(|_| "Pulled.".into()),
        "list_versions" => {
            let note_path = args.get("note_path").and_then(|v| v.as_str()).unwrap_or("");
            version_service::list_versions(state, note_path)
                .map(|v| serde_json::to_string_pretty(&v).unwrap())
        },
        "create_version" => {
            let note_path = args.get("note_path").and_then(|v| v.as_str()).unwrap_or("");
            let label = args.get("label").and_then(|v| v.as_str());
            version_service::create_version(state, note_path, label)
                .map(|v| serde_json::to_string_pretty(&v).unwrap())
        },
        "read_version" => {
            let note_path = args.get("note_path").and_then(|v| v.as_str()).unwrap_or("");
            let version_id = args
                .get("version_id")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            version_service::read_version(state, note_path, version_id)
        },
        "create_backup" => {
            backup_service::create_backup(state).map(|b| serde_json::to_string_pretty(&b).unwrap())
        },
        "list_backups" => {
            backup_service::list_backups(state).map(|b| serde_json::to_string_pretty(&b).unwrap())
        },
        "find_similar_notes" => {
            let note_path = args.get("note_path").and_then(|v| v.as_str()).unwrap_or("");
            let limit = args.get("limit").and_then(|v| v.as_u64()).unwrap_or(10) as usize;
            let min_score = args
                .get("min_score")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.1);
            embedding_service::find_similar_notes(state, note_path, limit, min_score)
                .map(|s| serde_json::to_string_pretty(&s).unwrap())
        },
        "find_similar_to_text" => {
            let query = args.get("query").and_then(|v| v.as_str()).unwrap_or("");
            let limit = args.get("limit").and_then(|v| v.as_u64()).unwrap_or(10) as usize;
            let min_score = args
                .get("min_score")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.1);
            embedding_service::find_similar_to_text(state, query, limit, min_score)
                .map(|s| serde_json::to_string_pretty(&s).unwrap())
        },
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
        },
        Err(e) => {
            let tool_result = McpToolResult {
                content: vec![McpTextContent {
                    content_type: "text",
                    text: e.to_string(),
                }],
                is_error: true,
            };
            JsonRpcResponse::ok(id, serde_json::to_value(tool_result).unwrap())
        },
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
                mime_type: if note.path.ends_with(".canvas") {
                    "application/json".into()
                } else if note.path.ends_with(".pen") {
                    "text/plain".into()
                } else {
                    "text/markdown".into()
                },
            });
        }
    }

    JsonRpcResponse::ok(
        id,
        serde_json::json!({ "resources": serde_json::to_value(resources).unwrap() }),
    )
}

fn handle_resources_read(id: Option<Value>, params: &Value, state: &AppState) -> JsonRpcResponse {
    let uri = params.get("uri").and_then(|v| v.as_str()).unwrap_or("");

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
            },
            Err(e) => JsonRpcResponse::err(id, -32000, e.to_string()),
        };
    }

    if let Some(note_path) = uri.strip_prefix("bismuth://notes/") {
        return match vault_service::read_note(state, note_path) {
            Ok(note) => {
                let content = McpResourceContent {
                    uri: uri.to_string(),
                    mime_type: if note_path.ends_with(".canvas") {
                        "application/json".into()
                    } else if note_path.ends_with(".pen") {
                        "text/plain".into()
                    } else {
                        "text/markdown".into()
                    },
                    text: note.content,
                };
                JsonRpcResponse::ok(
                    id,
                    serde_json::json!({ "contents": [serde_json::to_value(content).unwrap()] }),
                )
            },
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
            return (
                StatusCode::OK,
                Json(JsonRpcResponse::ok(
                    req.id,
                    Value::Object(Default::default()),
                )),
            );
        },
        "tools/list" => handle_tools_list(req.id),
        "tools/call" => handle_tools_call(req.id, &req.params, &state),
        "resources/list" => handle_resources_list(req.id, &state),
        "resources/read" => handle_resources_read(req.id, &req.params, &state),
        "ping" => JsonRpcResponse::ok(req.id, Value::Object(Default::default())),
        _ => JsonRpcResponse::err(req.id, -32601, format!("Method not found: {}", req.method)),
    };

    (StatusCode::OK, Json(resp))
}
