use super::McpTool;

pub(super) fn canvas_tool_definitions() -> Vec<McpTool> {
    vec![
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
        McpTool {
            name: "list_canvas_elements".into(),
            description: "List element summaries (id, kind, name, placement) from a canvas".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": { "path": { "type": "string", "description": "Relative path to the .canvas file" } },
                "required": ["path"]
            }),
        },
        McpTool {
            name: "align_canvas_elements".into(),
            description: "Align selected canvas elements (left/center/right/top/middle/bottom)"
                .into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "node_ids": { "type": "array", "items": { "type": "string" }, "description": "Element IDs to align (2+)" },
                    "direction": { "type": "string", "enum": ["left", "center-x", "right", "top", "center-y", "bottom"] }
                },
                "required": ["path", "node_ids", "direction"]
            }),
        },
        McpTool {
            name: "distribute_canvas_elements".into(),
            description: "Distribute selected canvas elements evenly on an axis".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "node_ids": { "type": "array", "items": { "type": "string" }, "description": "Element IDs to distribute (3+)" },
                    "axis": { "type": "string", "enum": ["horizontal", "vertical"] }
                },
                "required": ["path", "node_ids", "axis"]
            }),
        },
        McpTool {
            name: "reorder_canvas_elements".into(),
            description: "Reorder selected layers by z-index".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "node_ids": { "type": "array", "items": { "type": "string" }, "description": "Element IDs to reorder" },
                    "operation": {
                        "type": "string",
                        "enum": ["bring_forward", "send_backward", "bring_to_front", "send_to_back"],
                        "description": "Layer reorder operation"
                    }
                },
                "required": ["path", "node_ids", "operation"]
            }),
        },
        McpTool {
            name: "style_canvas_elements".into(),
            description: "Apply a partial style/object patch to selected canvas elements".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "node_ids": { "type": "array", "items": { "type": "string" }, "description": "Element IDs to update" },
                    "style": { "type": "object", "description": "Partial JSON patch merged into each element" }
                },
                "required": ["path", "node_ids", "style"]
            }),
        },
        McpTool {
            name: "set_canvas_auto_layout".into(),
            description:
                "Set auto-layout/constraints fields on a frame or component-like node".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "node_id": { "type": "string", "description": "Frame/component node id" },
                    "auto_layout": { "type": ["object", "null"], "description": "Auto-layout configuration payload" },
                    "child_overrides": { "type": "array", "items": { "type": "object" }, "description": "Per-child layout overrides" },
                    "constraints": { "type": "object", "description": "Node resize constraints" },
                    "constraint_preset": {
                        "type": "string",
                        "enum": ["fixed", "scale", "stretch", "center", "pin-left-right", "pin-top-bottom", "fill"],
                        "description": "Optional preset to materialize constraints"
                    },
                    "clip_content": { "type": "boolean", "description": "Whether frame clips child content" }
                },
                "required": ["path", "node_id"]
            }),
        },
        McpTool {
            name: "create_canvas_component".into(),
            description: "Promote an element into a reusable component node".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "node_id": { "type": "string", "description": "Element to promote" },
                    "label": { "type": "string", "description": "Optional component label" },
                    "description": { "type": "string", "description": "Optional component description" }
                },
                "required": ["path", "node_id"]
            }),
        },
        McpTool {
            name: "create_canvas_instance".into(),
            description: "Create a component instance with placement and override shell".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "component_id": { "type": "string", "description": "Component node id" },
                    "x": { "type": "number", "description": "Instance x position" },
                    "y": { "type": "number", "description": "Instance y position" },
                    "name": { "type": "string", "description": "Optional instance name" },
                    "overrides": { "type": "object", "description": "Optional validated instance overrides" }
                },
                "required": ["path", "component_id", "x", "y"]
            }),
        },
        McpTool {
            name: "upsert_canvas_component_property".into(),
            description: "Define or update a component property contract".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "node_id": { "type": "string", "description": "Component node id" },
                    "property_name": { "type": "string", "description": "Component property key" },
                    "property": { "type": "object", "description": "Property definition object" }
                },
                "required": ["path", "node_id", "property_name", "property"]
            }),
        },
        McpTool {
            name: "list_canvas_component_properties".into(),
            description: "List declared component properties for a component".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "node_id": { "type": "string", "description": "Component node id" }
                },
                "required": ["path", "node_id"]
            }),
        },
        McpTool {
            name: "set_canvas_instance_overrides".into(),
            description: "Apply validated overrides to an instance using component property definitions"
                .into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "instance_id": { "type": "string", "description": "Instance node id" },
                    "overrides": { "type": "object", "description": "Override key/value payload" }
                },
                "required": ["path", "instance_id", "overrides"]
            }),
        },
        McpTool {
            name: "set_canvas_constraint_preset".into(),
            description: "Apply explicit constraint/resize presets to a node".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "node_id": { "type": "string", "description": "Canvas node id" },
                    "preset": {
                        "type": "string",
                        "enum": ["fixed", "scale", "stretch", "center", "pin-left-right", "pin-top-bottom", "fill"],
                        "description": "Constraint preset name"
                    }
                },
                "required": ["path", "node_id", "preset"]
            }),
        },
        McpTool {
            name: "upsert_canvas_component_state".into(),
            description: "Define or update an interactive component state contract".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "node_id": { "type": "string", "description": "Component node id" },
                    "state_name": { "type": "string", "description": "Interaction state name (hover, active, disabled, etc.)" },
                    "state": { "type": "object", "description": "State contract payload; supports patch + metadata" }
                },
                "required": ["path", "node_id", "state_name", "state"]
            }),
        },
        McpTool {
            name: "set_canvas_instance_state".into(),
            description: "Set active interaction state for an instance and refresh render snapshot"
                .into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "instance_id": { "type": "string", "description": "Instance node id" },
                    "state_name": { "type": "string", "description": "Interaction state name; use base to clear state" }
                },
                "required": ["path", "instance_id", "state_name"]
            }),
        },
        McpTool {
            name: "upsert_canvas_component_slot".into(),
            description: "Define or update a component slot composition contract".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "node_id": { "type": "string", "description": "Component node id" },
                    "slot_name": { "type": "string", "description": "Slot name" },
                    "slot": { "type": "object", "description": "Slot contract payload (required, allowedKinds, maxItems, etc.)" }
                },
                "required": ["path", "node_id", "slot_name", "slot"]
            }),
        },
        McpTool {
            name: "set_canvas_instance_slots".into(),
            description:
                "Assign slot composition payload to an instance with contract validation".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "instance_id": { "type": "string", "description": "Instance node id" },
                    "slots": { "type": "object", "description": "Slot name to composition payload map" }
                },
                "required": ["path", "instance_id", "slots"]
            }),
        },
        McpTool {
            name: "upsert_canvas_code_connect".into(),
            description: "Attach/update code-connect metadata for a design node".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "node_id": { "type": "string", "description": "Design node id" },
                    "framework": { "type": "string", "description": "Target framework (e.g. svelte/react)" },
                    "file_path": { "type": "string", "description": "Repository-relative code file path" },
                    "component_name": { "type": "string", "description": "Code component/symbol name" },
                    "props_mapping": { "type": "object", "description": "Design-property to code-prop map" },
                    "states": { "type": "array", "items": { "type": "object" }, "description": "Optional interactive states contract" },
                    "slots": { "type": "array", "items": { "type": "object" }, "description": "Optional slot/content contract" },
                    "events": { "type": "array", "items": { "type": "object" }, "description": "Optional event contract" },
                    "accessibility": { "type": "object", "description": "Accessibility contract (roles/labels/keyboard)" },
                    "examples": { "type": "array", "items": { "type": "object" }, "description": "Optional usage examples" },
                    "required_props": { "type": "array", "items": { "type": "string" }, "description": "Required code prop names" },
                    "instructions": { "type": "string", "description": "Agent-facing implementation guidance" }
                },
                "required": ["path", "node_id", "framework", "file_path", "component_name"]
            }),
        },
        McpTool {
            name: "validate_canvas_code_connect_contract".into(),
            description:
                "Validate code-connect mappings for contract completeness and consistency".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "node_ids": { "type": "array", "items": { "type": "string" }, "description": "Optional node subset" }
                },
                "required": ["path"]
            }),
        },
        McpTool {
            name: "publish_canvas_design_library".into(),
            description: "Publish a shared design library version from current canvas contracts"
                .into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "library_name": { "type": "string", "description": "Design library name" },
                    "version": { "type": "string", "description": "Library version identifier (semver recommended)" },
                    "component_ids": { "type": "array", "items": { "type": "string" }, "description": "Optional component subset" }
                },
                "required": ["path", "library_name", "version"]
            }),
        },
        McpTool {
            name: "list_canvas_design_library_versions".into(),
            description: "List published design library versions stored in a canvas".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "library_name": { "type": "string", "description": "Optional library name filter" }
                },
                "required": ["path"]
            }),
        },
        McpTool {
            name: "restore_canvas_design_library_version".into(),
            description: "Restore a published design library version into the canvas".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "library_name": { "type": "string", "description": "Design library name" },
                    "version": { "type": "string", "description": "Version to restore" },
                    "merge_mode": { "type": "string", "enum": ["merge", "replace"], "description": "Restore strategy; merge is default" }
                },
                "required": ["path", "library_name", "version"]
            }),
        },
        McpTool {
            name: "upsert_canvas_token".into(),
            description: "Create/update a design token in the canvas token library".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "collection": { "type": "string", "description": "Token collection/group name" },
                    "name": { "type": "string", "description": "Token name" },
                    "kind": { "type": "string", "description": "Token kind (color, spacing, radius, etc.)" },
                    "mode": { "type": "string", "description": "Token mode (default/light/dark/etc.)" },
                    "value": { "description": "Token value" },
                    "description": { "type": "string", "description": "Optional token description" }
                },
                "required": ["path", "collection", "name", "value"]
            }),
        },
        McpTool {
            name: "list_canvas_tokens".into(),
            description: "List design tokens in the canvas token library".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "collection": { "type": "string", "description": "Optional token collection filter" }
                },
                "required": ["path"]
            }),
        },
        McpTool {
            name: "bind_canvas_token".into(),
            description: "Bind a token to one or more canvas nodes via a property path".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "node_ids": { "type": "array", "items": { "type": "string" }, "description": "Node IDs to bind" },
                    "property_path": { "type": "string", "description": "Dot path to property (e.g. fill.color, stroke.width)" },
                    "token_id": { "type": "string", "description": "Token ID to bind" }
                },
                "required": ["path", "node_ids", "property_path", "token_id"]
            }),
        },
        McpTool {
            name: "upsert_canvas_style".into(),
            description: "Create/update a reusable shared style in the canvas style library".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "name": { "type": "string", "description": "Style name" },
                    "style": { "type": "object", "description": "Style payload to apply/reuse" },
                    "style_id": { "type": "string", "description": "Optional explicit style id" },
                    "description": { "type": "string", "description": "Optional style description" }
                },
                "required": ["path", "name", "style"]
            }),
        },
        McpTool {
            name: "apply_canvas_style".into(),
            description: "Apply a shared style to selected nodes".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "node_ids": { "type": "array", "items": { "type": "string" }, "description": "Node IDs to update" },
                    "style_id": { "type": "string", "description": "Shared style id" }
                },
                "required": ["path", "node_ids", "style_id"]
            }),
        },
        McpTool {
            name: "define_canvas_variant_set".into(),
            description: "Create/update a variant property model set for components".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "set_id": { "type": "string", "description": "Variant set id" },
                    "name": { "type": "string", "description": "Variant set name" },
                    "properties": { "type": "object", "description": "Property axis map (e.g. size: [sm,md])" }
                },
                "required": ["path", "set_id", "name", "properties"]
            }),
        },
        McpTool {
            name: "upsert_canvas_variant".into(),
            description: "Assign/update variant properties for a component in a variant set".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "node_id": { "type": "string", "description": "Component node id" },
                    "set_id": { "type": "string", "description": "Variant set id" },
                    "variant_properties": { "type": "object", "description": "Property selection for the variant" }
                },
                "required": ["path", "node_id", "set_id", "variant_properties"]
            }),
        },
        McpTool {
            name: "set_canvas_instance_variant".into(),
            description: "Apply variant property selection to an instance and resolve best matching component"
                .into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "instance_id": { "type": "string", "description": "Instance node id" },
                    "selection": { "type": "object", "description": "Variant selection map" }
                },
                "required": ["path", "instance_id", "selection"]
            }),
        },
        McpTool {
            name: "set_canvas_token_mode".into(),
            description: "Set active token mode for a canvas and refresh resolved instance render payloads"
                .into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "mode": { "type": "string", "description": "Token mode name (default/light/dark/etc.)" },
                    "refresh_instances": { "type": "boolean", "description": "Whether to recalculate instance render snapshots", "default": true }
                },
                "required": ["path", "mode"]
            }),
        },
        McpTool {
            name: "list_canvas_code_connect".into(),
            description: "List code-connect mappings in a canvas, optionally filtered by node id"
                .into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "node_id": { "type": "string", "description": "Optional design node id filter" }
                },
                "required": ["path"]
            }),
        },
        McpTool {
            name: "resolve_canvas_instance_render".into(),
            description: "Resolve and persist token-aware render payload for one instance".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "instance_id": { "type": "string", "description": "Instance node id" },
                    "mode": { "type": "string", "description": "Optional override mode (falls back to active mode)" }
                },
                "required": ["path", "instance_id"]
            }),
        },
        McpTool {
            name: "generate_code_connect_snippets".into(),
            description: "Generate framework snippets from canvas code-connect mappings".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "node_ids": { "type": "array", "items": { "type": "string" }, "description": "Optional node subset" }
                },
                "required": ["path"]
            }),
        },
        McpTool {
            name: "export_canvas_handoff".into(),
            description: "Export a design+dev handoff bundle including node geometry and code-connect mapping"
                .into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Relative path to the .canvas file" },
                    "node_ids": { "type": "array", "items": { "type": "string" }, "description": "Optional node subset" }
                },
                "required": ["path"]
            }),
        },
    ]
}
