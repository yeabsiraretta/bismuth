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
use serde::Serialize;
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
use canvas_code_connect_ops::{
    list_canvas_code_connect_op, upsert_canvas_code_connect_op,
    validate_canvas_code_connect_contract_op,
};
use canvas_render_ops::{build_instance_render_snapshot, update_instance_snapshot};
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

const MCP_INTERNAL_SERIALIZATION_ERROR_CODE: i32 = -32603;

fn mcp_serialization_error(
    id: &Option<Value>,
    operation: &str,
    error: serde_json::Error,
) -> JsonRpcResponse {
    JsonRpcResponse::err(
        id.clone(),
        MCP_INTERNAL_SERIALIZATION_ERROR_CODE,
        format!("Serialization failed during {operation}: {error}"),
    )
}

fn safe_to_value<T: Serialize>(
    id: &Option<Value>,
    operation: &str,
    value: T,
) -> Result<Value, JsonRpcResponse> {
    serde_json::to_value(value).map_err(|error| mcp_serialization_error(id, operation, error))
}

fn safe_to_pretty_json<T: Serialize>(
    id: &Option<Value>,
    operation: &str,
    value: &T,
) -> Result<String, JsonRpcResponse> {
    serde_json::to_string_pretty(value)
        .map_err(|error| mcp_serialization_error(id, operation, error))
}

enum ToolCallFailure {
    Tool(AppError),
    JsonRpc(JsonRpcResponse),
}

fn safe_tool_pretty<T: Serialize>(
    id: &Option<Value>,
    operation: &str,
    value: T,
) -> Result<String, ToolCallFailure> {
    safe_to_pretty_json(id, operation, &value).map_err(ToolCallFailure::JsonRpc)
}

fn tool_result_response(
    id: Option<Value>,
    operation: &str,
    text: String,
    is_error: bool,
) -> JsonRpcResponse {
    let tool_result = McpToolResult {
        content: vec![McpTextContent {
            content_type: "text",
            text,
        }],
        is_error,
    };

    match safe_to_value(&id, operation, tool_result) {
        Ok(result) => JsonRpcResponse::ok(id, result),
        Err(response) => response,
    }
}

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
    match safe_to_value(&id, "initialize", result) {
        Ok(result_value) => JsonRpcResponse::ok(id, result_value),
        Err(response) => response,
    }
}

fn handle_tools_list(id: Option<Value>) -> JsonRpcResponse {
    let tools = tool_definitions();
    match safe_to_value(&id, "tools/list", tools) {
        Ok(tools_value) => JsonRpcResponse::ok(id, serde_json::json!({ "tools": tools_value })),
        Err(response) => response,
    }
}

fn handle_tools_call(id: Option<Value>, params: &Value, state: &AppState) -> JsonRpcResponse {
    let tool_name = params.get("name").and_then(|v| v.as_str()).unwrap_or("");
    let tool_operation = format!("tools/call:{tool_name}");
    let args = params
        .get("arguments")
        .cloned()
        .unwrap_or(Value::Object(Default::default()));

    let result = match tool_name {
        "list_notes" => vault_service::scan_vault(state)
            .map_err(ToolCallFailure::Tool)
            .and_then(|notes| safe_tool_pretty(&id, &tool_operation, notes)),
        "read_note" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::read_note(state, path)
                .map_err(ToolCallFailure::Tool)
                .and_then(|note| safe_tool_pretty(&id, &tool_operation, note))
        },
        "write_note" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let content = args.get("content").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::write_note(state, path, content)
                .map(|_| "Note written.".into())
                .map_err(ToolCallFailure::Tool)
        },
        "create_note" => {
            let title = args.get("title").and_then(|v| v.as_str()).unwrap_or("");
            let folder = args.get("folder").and_then(|v| v.as_str());
            let extension = args.get("extension").and_then(|v| v.as_str());
            vault_service::create_note(state, title, folder, extension)
                .map_err(ToolCallFailure::Tool)
                .and_then(|note| safe_tool_pretty(&id, &tool_operation, note))
        },
        "list_pen_notes" => vault_service::scan_vault(state)
            .map_err(ToolCallFailure::Tool)
            .and_then(|notes| {
                let pen_notes: Vec<_> = notes
                    .into_iter()
                    .filter(|n| n.path.ends_with(".pen"))
                    .collect();
                safe_tool_pretty(&id, &tool_operation, pen_notes)
            }),
        "delete_note" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::delete_note(state, path)
                .map(|_| "Note deleted.".into())
                .map_err(ToolCallFailure::Tool)
        },
        "search_vault" => {
            let query = args.get("query").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::search_vault(state, query)
                .map_err(ToolCallFailure::Tool)
                .and_then(|results| safe_tool_pretty(&id, &tool_operation, results))
        },
        "vault_stats" => stats_service::compute_vault_stats(state)
            .map_err(ToolCallFailure::Tool)
            .and_then(|stats| safe_tool_pretty(&id, &tool_operation, stats)),
        "vault_tags" => vault_service::extract_vault_tags(state)
            .map_err(ToolCallFailure::Tool)
            .and_then(|tags| safe_tool_pretty(&id, &tool_operation, tags)),
        "rename_note" => {
            let old_path = args.get("old_path").and_then(|v| v.as_str()).unwrap_or("");
            let new_title = args.get("new_title").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::rename_note(state, old_path, new_title)
                .map_err(ToolCallFailure::Tool)
                .and_then(|note| safe_tool_pretty(&id, &tool_operation, note))
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
                .map_err(ToolCallFailure::Tool)
                .and_then(|batch| safe_tool_pretty(&id, &tool_operation, batch))
        },
        "graph_data" => vault_service::build_graph_data(state)
            .map_err(ToolCallFailure::Tool)
            .and_then(|graph| safe_tool_pretty(&id, &tool_operation, graph)),
        "list_canvases" => {
            // Filter vault scan for .canvas files
            vault_service::scan_vault(state)
                .map_err(ToolCallFailure::Tool)
                .and_then(|notes| {
                    let canvases: Vec<_> = notes
                        .into_iter()
                        .filter(|n| n.path.ends_with(".canvas"))
                        .collect();
                    safe_tool_pretty(&id, &tool_operation, canvases)
                })
        },
        "read_canvas" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::read_note(state, path)
                .map(|note| note.content)
                .map_err(ToolCallFailure::Tool)
        },
        "write_canvas" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let content = args.get("content").and_then(|v| v.as_str()).unwrap_or("");
            vault_service::write_note(state, path, content)
                .map(|_| "Canvas written.".into())
                .map_err(ToolCallFailure::Tool)
        },
        "list_canvas_elements" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            list_canvas_elements_op(state, path)
                .map_err(ToolCallFailure::Tool)
                .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload))
        },
        "align_canvas_elements" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_ids = optional_string_list(&args, "node_ids");
            let direction = args.get("direction").and_then(|v| v.as_str()).unwrap_or("");
            align_canvas_elements_op(state, path, &node_ids, direction)
                .map_err(ToolCallFailure::Tool)
                .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload))
        },
        "distribute_canvas_elements" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_ids = optional_string_list(&args, "node_ids");
            let axis = args.get("axis").and_then(|v| v.as_str()).unwrap_or("");
            distribute_canvas_elements_op(state, path, &node_ids, axis)
                .map_err(ToolCallFailure::Tool)
                .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload))
        },
        "reorder_canvas_elements" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_ids = optional_string_list(&args, "node_ids");
            let operation = args.get("operation").and_then(|v| v.as_str()).unwrap_or("");
            reorder_canvas_elements_op(state, path, &node_ids, operation)
                .map_err(ToolCallFailure::Tool)
                .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload))
        },
        "style_canvas_elements" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_ids = optional_string_list(&args, "node_ids");
            let style = args
                .get("style")
                .cloned()
                .unwrap_or_else(|| serde_json::json!({}));
            style_canvas_elements_op(state, path, &node_ids, &style)
                .map_err(ToolCallFailure::Tool)
                .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload))
        },
        "set_canvas_auto_layout" => set_canvas_auto_layout_op(state, &args)
            .map_err(ToolCallFailure::Tool)
            .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload)),
        "create_canvas_component" => create_canvas_component_op(state, &args)
            .map_err(ToolCallFailure::Tool)
            .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload)),
        "create_canvas_instance" => create_canvas_instance_op(state, &args)
            .map_err(ToolCallFailure::Tool)
            .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload)),
        "upsert_canvas_component_property" => upsert_canvas_component_property_op(state, &args)
            .map_err(ToolCallFailure::Tool)
            .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload)),
        "list_canvas_component_properties" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_id = args.get("node_id").and_then(|v| v.as_str()).unwrap_or("");
            list_canvas_component_properties_op(state, path, node_id)
                .map_err(ToolCallFailure::Tool)
                .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload))
        },
        "set_canvas_instance_overrides" => set_canvas_instance_overrides_op(state, &args)
            .map_err(ToolCallFailure::Tool)
            .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload)),
        "set_canvas_constraint_preset" => set_canvas_constraint_preset_op(state, &args)
            .map_err(ToolCallFailure::Tool)
            .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload)),
        "upsert_canvas_component_state" => upsert_canvas_component_state_op(state, &args)
            .map_err(ToolCallFailure::Tool)
            .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload)),
        "set_canvas_instance_state" => set_canvas_instance_state_op(state, &args)
            .map_err(ToolCallFailure::Tool)
            .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload)),
        "upsert_canvas_component_slot" => upsert_canvas_component_slot_op(state, &args)
            .map_err(ToolCallFailure::Tool)
            .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload)),
        "set_canvas_instance_slots" => set_canvas_instance_slots_op(state, &args)
            .map_err(ToolCallFailure::Tool)
            .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload)),
        "upsert_canvas_code_connect" => upsert_canvas_code_connect_op(state, &args)
            .map_err(ToolCallFailure::Tool)
            .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload)),
        "upsert_canvas_token" => upsert_canvas_token_op(state, &args)
            .map_err(ToolCallFailure::Tool)
            .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload)),
        "list_canvas_tokens" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let collection = args.get("collection").and_then(|v| v.as_str());
            list_canvas_tokens_op(state, path, collection)
                .map_err(ToolCallFailure::Tool)
                .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload))
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
                .map_err(ToolCallFailure::Tool)
                .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload))
        },
        "upsert_canvas_style" => upsert_canvas_style_op(state, &args)
            .map_err(ToolCallFailure::Tool)
            .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload)),
        "apply_canvas_style" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_ids = optional_string_list(&args, "node_ids");
            let style_id = args.get("style_id").and_then(|v| v.as_str()).unwrap_or("");
            apply_canvas_style_op(state, path, &node_ids, style_id)
                .map_err(ToolCallFailure::Tool)
                .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload))
        },
        "define_canvas_variant_set" => define_canvas_variant_set_op(state, &args)
            .map_err(ToolCallFailure::Tool)
            .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload)),
        "upsert_canvas_variant" => upsert_canvas_variant_op(state, &args)
            .map_err(ToolCallFailure::Tool)
            .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload)),
        "set_canvas_instance_variant" => set_canvas_instance_variant_op(state, &args)
            .map_err(ToolCallFailure::Tool)
            .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload)),
        "set_canvas_token_mode" => set_canvas_token_mode_op(state, &args)
            .map_err(ToolCallFailure::Tool)
            .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload)),
        "list_canvas_code_connect" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_id = args.get("node_id").and_then(|v| v.as_str());
            list_canvas_code_connect_op(state, path, node_id)
                .map_err(ToolCallFailure::Tool)
                .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload))
        },
        "validate_canvas_code_connect_contract" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_ids = optional_string_list(&args, "node_ids");
            validate_canvas_code_connect_contract_op(state, path, &node_ids)
                .map_err(ToolCallFailure::Tool)
                .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload))
        },
        "publish_canvas_design_library" => publish_canvas_design_library_op(state, &args)
            .map_err(ToolCallFailure::Tool)
            .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload)),
        "list_canvas_design_library_versions" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let library_name = args.get("library_name").and_then(|v| v.as_str());
            list_canvas_design_library_versions_op(state, path, library_name)
                .map_err(ToolCallFailure::Tool)
                .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload))
        },
        "restore_canvas_design_library_version" => {
            restore_canvas_design_library_version_op(state, &args)
                .map_err(ToolCallFailure::Tool)
                .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload))
        },
        "resolve_canvas_instance_render" => resolve_canvas_instance_render_op(state, &args)
            .map_err(ToolCallFailure::Tool)
            .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload)),
        "generate_code_connect_snippets" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_ids = optional_string_list(&args, "node_ids");
            let node_subset = if node_ids.is_empty() {
                None
            } else {
                Some(node_ids.as_slice())
            };
            generate_code_connect_snippets_op(state, path, node_subset)
                .map_err(ToolCallFailure::Tool)
                .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload))
        },
        "export_canvas_handoff" => {
            let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let node_ids = optional_string_list(&args, "node_ids");
            export_canvas_handoff_op(state, path, &node_ids)
                .map_err(ToolCallFailure::Tool)
                .and_then(|payload| safe_tool_pretty(&id, &tool_operation, payload))
        },
        "git_status" => git_service::git_status(state)
            .map_err(ToolCallFailure::Tool)
            .and_then(|status| safe_tool_pretty(&id, &tool_operation, status)),
        "git_stage_all" => git_service::git_stage_all(state)
            .map(|_| "All changes staged.".into())
            .map_err(ToolCallFailure::Tool),
        "git_commit" => {
            let message = args
                .get("message")
                .and_then(|v| v.as_str())
                .unwrap_or("MCP commit");
            git_service::git_commit(state, message)
                .map(|_| "Committed.".into())
                .map_err(ToolCallFailure::Tool)
        },
        "git_push" => git_service::git_push(state)
            .map(|_| "Pushed.".into())
            .map_err(ToolCallFailure::Tool),
        "git_pull" => git_service::git_pull(state)
            .map(|_| "Pulled.".into())
            .map_err(ToolCallFailure::Tool),
        "list_versions" => {
            let note_path = args.get("note_path").and_then(|v| v.as_str()).unwrap_or("");
            version_service::list_versions(state, note_path)
                .map_err(ToolCallFailure::Tool)
                .and_then(|versions| safe_tool_pretty(&id, &tool_operation, versions))
        },
        "create_version" => {
            let note_path = args.get("note_path").and_then(|v| v.as_str()).unwrap_or("");
            let label = args.get("label").and_then(|v| v.as_str());
            version_service::create_version(state, note_path, label)
                .map_err(ToolCallFailure::Tool)
                .and_then(|version| safe_tool_pretty(&id, &tool_operation, version))
        },
        "read_version" => {
            let note_path = args.get("note_path").and_then(|v| v.as_str()).unwrap_or("");
            let version_id = args
                .get("version_id")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            version_service::read_version(state, note_path, version_id)
                .map_err(ToolCallFailure::Tool)
        },
        "create_backup" => backup_service::create_backup(state)
            .map_err(ToolCallFailure::Tool)
            .and_then(|backup| safe_tool_pretty(&id, &tool_operation, backup)),
        "list_backups" => backup_service::list_backups(state)
            .map_err(ToolCallFailure::Tool)
            .and_then(|backups| safe_tool_pretty(&id, &tool_operation, backups)),
        "find_similar_notes" => {
            let note_path = args.get("note_path").and_then(|v| v.as_str()).unwrap_or("");
            let limit = args.get("limit").and_then(|v| v.as_u64()).unwrap_or(10) as usize;
            let min_score = args
                .get("min_score")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.1);
            embedding_service::find_similar_notes(state, note_path, limit, min_score)
                .map_err(ToolCallFailure::Tool)
                .and_then(|results| safe_tool_pretty(&id, &tool_operation, results))
        },
        "find_similar_to_text" => {
            let query = args.get("query").and_then(|v| v.as_str()).unwrap_or("");
            let limit = args.get("limit").and_then(|v| v.as_u64()).unwrap_or(10) as usize;
            let min_score = args
                .get("min_score")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.1);
            embedding_service::find_similar_to_text(state, query, limit, min_score)
                .map_err(ToolCallFailure::Tool)
                .and_then(|results| safe_tool_pretty(&id, &tool_operation, results))
        },
        _ => Err(ToolCallFailure::Tool(AppError::Custom(format!(
            "Unknown tool: {tool_name}"
        )))),
    };

    match result {
        Ok(text) => tool_result_response(id, "tools/call:result", text, false),
        Err(ToolCallFailure::Tool(error)) => {
            tool_result_response(id, "tools/call:error-result", error.to_string(), true)
        },
        Err(ToolCallFailure::JsonRpc(response)) => response,
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

    match safe_to_value(&id, "resources/list", resources) {
        Ok(resources_value) => {
            JsonRpcResponse::ok(id, serde_json::json!({ "resources": resources_value }))
        },
        Err(response) => response,
    }
}

fn handle_resources_read(id: Option<Value>, params: &Value, state: &AppState) -> JsonRpcResponse {
    let uri = params.get("uri").and_then(|v| v.as_str()).unwrap_or("");

    if uri == "bismuth://vault" {
        return match stats_service::compute_vault_stats(state) {
            Ok(stats) => {
                let text = match safe_to_pretty_json(&id, "resources/read:vault-stats", &stats) {
                    Ok(text) => text,
                    Err(response) => return response,
                };
                let content = McpResourceContent {
                    uri: uri.to_string(),
                    mime_type: "application/json".into(),
                    text,
                };
                match safe_to_value(&id, "resources/read:vault-content", content) {
                    Ok(content_value) => {
                        JsonRpcResponse::ok(id, serde_json::json!({ "contents": [content_value] }))
                    },
                    Err(response) => response,
                }
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
                match safe_to_value(&id, "resources/read:note-content", content) {
                    Ok(content_value) => {
                        JsonRpcResponse::ok(id, serde_json::json!({ "contents": [content_value] }))
                    },
                    Err(response) => response,
                }
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

#[cfg(test)]
mod tests {
    use super::*;
    use serde::ser::Error as _;
    use serde::Serializer;

    struct FailingSerialize;

    impl Serialize for FailingSerialize {
        fn serialize<S>(&self, _serializer: S) -> Result<S::Ok, S::Error>
        where
            S: Serializer,
        {
            Err(S::Error::custom("intentional serialize failure"))
        }
    }

    #[test]
    fn safe_to_value_maps_serialization_failure_to_jsonrpc_error() {
        let id = Some(serde_json::json!(7));
        let response = safe_to_value(&id, "tools/list", FailingSerialize)
            .expect_err("expected serialization to fail");

        let error = response.error.expect("expected jsonrpc error");
        assert_eq!(error.code, MCP_INTERNAL_SERIALIZATION_ERROR_CODE);
        assert!(error.message.contains("tools/list"));
        assert!(error.message.contains("intentional serialize failure"));
        assert_eq!(response.id, id);
    }

    #[test]
    fn handle_initialize_preserves_success_contract() {
        let id = Some(serde_json::json!(1));
        let response = handle_initialize(id.clone());

        assert!(response.error.is_none());
        assert_eq!(response.id, id);

        let result = response.result.expect("expected initialize result");
        assert_eq!(
            result.get("protocolVersion"),
            Some(&serde_json::json!("2024-11-05"))
        );
        assert!(result.get("capabilities").is_some());
        assert!(result.get("serverInfo").is_some());
    }
}
