use super::*;

pub(super) fn token_mode_from_doc(doc: &Value) -> String {
    doc.get("designSystem")
        .and_then(Value::as_object)
        .and_then(|system| system.get("activeTokenMode"))
        .and_then(Value::as_str)
        .unwrap_or("default")
        .to_string()
}

pub(super) fn token_base_key(token_ref: &str) -> &str {
    token_ref.split(':').next().unwrap_or(token_ref)
}

pub(super) fn token_mode_from_id(token_id: &str) -> &str {
    token_id.split(':').nth(1).unwrap_or("default")
}

pub(super) fn resolve_token_value(doc: &Value, token_ref: &str, mode: &str) -> Option<Value> {
    let tokens = root_array(doc, "designTokens");
    let base = token_base_key(token_ref);
    if token_ref.contains(':') {
        return tokens.into_iter().find_map(|token| {
            if token.get("id").and_then(Value::as_str) == Some(token_ref) {
                token.get("value").cloned()
            } else {
                None
            }
        });
    }

    let mode_match = tokens.iter().find_map(|token| {
        let id = token.get("id").and_then(Value::as_str)?;
        if token_base_key(id) == base && token_mode_from_id(id) == mode {
            token.get("value").cloned()
        } else {
            None
        }
    });
    if mode_match.is_some() {
        return mode_match;
    }
    tokens.into_iter().find_map(|token| {
        let id = token.get("id").and_then(Value::as_str)?;
        if token_base_key(id) == base && token_mode_from_id(id) == "default" {
            token.get("value").cloned()
        } else {
            None
        }
    })
}

pub(super) fn resolve_token_refs_in_value(doc: &Value, value: &Value, mode: &str) -> Value {
    match value {
        Value::Object(obj) => {
            if let Some(token_ref) = obj.get("tokenRef").and_then(Value::as_str) {
                return resolve_token_value(doc, token_ref, mode).unwrap_or(Value::Null);
            }
            let mut next = Map::new();
            for (k, v) in obj {
                next.insert(k.clone(), resolve_token_refs_in_value(doc, v, mode));
            }
            Value::Object(next)
        },
        Value::Array(arr) => Value::Array(
            arr.iter()
                .map(|entry| resolve_token_refs_in_value(doc, entry, mode))
                .collect(),
        ),
        _ => value.clone(),
    }
}

pub(super) fn element_by_id<'a>(elements: &'a [Value], id: &str) -> Option<&'a Value> {
    elements
        .iter()
        .find(|element| element_id(element) == Some(id))
}

pub(super) fn build_parent_lookup(elements: &[Value]) -> std::collections::HashMap<String, String> {
    let mut lookup = std::collections::HashMap::new();
    for element in elements {
        let Some(parent_id) = element_id(element) else {
            continue;
        };
        let Some(children) = element.get("childIds").and_then(Value::as_array) else {
            continue;
        };
        for child in children {
            if let Some(child_id) = child.as_str() {
                lookup.insert(child_id.to_string(), parent_id.to_string());
            }
        }
    }
    lookup
}

pub(super) fn resolve_effective_component_properties(instance: &Value, component: &Value) -> Value {
    let mut resolved = Map::new();
    let definitions = component
        .get("componentProperties")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    let overrides = instance
        .get("overrides")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    for (key, definition) in definitions {
        if let Some(override_value) = overrides.get(key.as_str()) {
            resolved.insert(
                key,
                serde_json::json!({ "value": override_value, "source": "override", "definition": definition }),
            );
        } else if let Some(default_value) = definition.get("default") {
            resolved.insert(
                key,
                serde_json::json!({ "value": default_value, "source": "default", "definition": definition }),
            );
        } else {
            resolved.insert(
                key,
                serde_json::json!({ "value": Value::Null, "source": "unset", "definition": definition }),
            );
        }
    }
    Value::Object(resolved)
}

pub(super) fn resolve_resize_resolution(
    instance: &Value,
    component: &Value,
    elements: &[Value],
    component_id: &str,
) -> Value {
    let (constraints, source) = if let Some(value) = instance.get("constraints").cloned() {
        (value, "instance")
    } else if let Some(value) = component.get("constraints").cloned() {
        (value, "component")
    } else {
        (
            serde_json::json!({ "preset": "fixed", "horizontal": "left", "vertical": "top", "widthMode": "fixed", "heightMode": "fixed" }),
            "default",
        )
    };
    let preset = constraints
        .get("preset")
        .and_then(Value::as_str)
        .unwrap_or("fixed");
    let horizontal = constraints
        .get("horizontal")
        .and_then(Value::as_str)
        .unwrap_or("left");
    let vertical = constraints
        .get("vertical")
        .and_then(Value::as_str)
        .unwrap_or("top");
    let width_mode = constraints
        .get("widthMode")
        .and_then(Value::as_str)
        .unwrap_or("fixed");
    let height_mode = constraints
        .get("heightMode")
        .and_then(Value::as_str)
        .unwrap_or("fixed");
    let parent_lookup = build_parent_lookup(elements);
    let mut parent_chain = Vec::new();
    let mut auto_layout_chain = Vec::new();
    let mut current = component_id.to_string();
    let mut effective_width_mode = width_mode.to_string();
    let mut effective_height_mode = height_mode.to_string();
    while let Some(parent_id) = parent_lookup.get(current.as_str()) {
        parent_chain.push(parent_id.clone());
        if let Some(parent) = element_by_id(elements, parent_id) {
            if let Some(layout) = parent.get("autoLayout") {
                auto_layout_chain.push(serde_json::json!({
                    "nodeId": parent_id,
                    "autoLayout": layout
                }));
            }
            if let Some(child_overrides) = parent.get("childOverrides").and_then(Value::as_array) {
                if let Some(override_entry) = child_overrides.iter().find(|entry| {
                    entry.get("nodeId").and_then(Value::as_str) == Some(current.as_str())
                }) {
                    if let Some(width) = override_entry.get("widthMode").and_then(Value::as_str) {
                        effective_width_mode = width.to_string();
                    }
                    if let Some(height) = override_entry.get("heightMode").and_then(Value::as_str) {
                        effective_height_mode = height.to_string();
                    }
                }
            }
        }
        current = parent_id.clone();
    }
    let nesting_depth = parent_chain.len();
    serde_json::json!({
        "preset": preset,
        "horizontal": horizontal,
        "vertical": vertical,
        "widthMode": width_mode,
        "heightMode": height_mode,
        "source": source,
        "effectiveWidthMode": effective_width_mode,
        "effectiveHeightMode": effective_height_mode,
        "parentChain": parent_chain,
        "autoLayoutChain": auto_layout_chain,
        "nestingDepth": nesting_depth
    })
}

pub(super) fn build_instance_render_snapshot(
    doc: &Value,
    instance_id: &str,
    mode_override: Option<&str>,
) -> AppResult<Value> {
    let elements = canvas_elements(doc)?;
    let instance = element_by_id(elements, instance_id)
        .ok_or_else(|| AppError::Custom(format!("Instance '{instance_id}' not found")))?;
    let component_id = instance
        .get("componentId")
        .and_then(Value::as_str)
        .ok_or_else(|| AppError::Custom("Instance missing componentId".into()))?;
    let component = element_by_id(elements, component_id)
        .ok_or_else(|| AppError::Custom(format!("Component '{component_id}' not found")))?;
    let mode = mode_override
        .map(String::from)
        .unwrap_or_else(|| token_mode_from_doc(doc));
    let mut resolved = resolve_token_refs_in_value(doc, component, &mode);
    let active_state = instance
        .get("interactionState")
        .and_then(Value::as_str)
        .unwrap_or("base");
    let interaction_states = component
        .get("interactionStates")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    let state_payload = interaction_states
        .get(active_state)
        .cloned()
        .unwrap_or(Value::Null);
    if active_state != "base" && !state_payload.is_null() {
        let patch = state_payload.get("patch").unwrap_or(&state_payload);
        if patch.is_object() {
            merge_json_patch(&mut resolved, patch);
        }
    }

    let slot_definitions = component
        .get("slotDefinitions")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    let assigned_slots = instance
        .get("slots")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    let missing_required_slots: Vec<String> = slot_definitions
        .iter()
        .filter_map(|(name, def)| {
            let required = def
                .get("required")
                .and_then(Value::as_bool)
                .unwrap_or(false);
            if !required {
                return None;
            }
            let value = assigned_slots.get(name);
            if value.is_none() || value.is_some_and(slot_value_is_empty) {
                Some(name.clone())
            } else {
                None
            }
        })
        .collect();

    if let Some(obj) = resolved.as_object_mut() {
        obj.insert("slots".into(), Value::Object(assigned_slots.clone()));
    }
    let resize_resolution = resolve_resize_resolution(instance, component, elements, component_id);
    let effective_properties = resolve_effective_component_properties(instance, component);
    Ok(serde_json::json!({
        "instanceId": instance_id,
        "componentId": component_id,
        "mode": mode,
        "interactionResolution": {
            "activeState": active_state,
            "availableStates": interaction_states.keys().cloned().collect::<Vec<String>>(),
            "source": if active_state == "base" { "base" } else { "instance" },
            "state": state_payload
        },
        "slotResolution": {
            "definitions": slot_definitions,
            "assigned": assigned_slots,
            "missingRequired": missing_required_slots.clone(),
            "isValid": missing_required_slots.is_empty()
        },
        "resizeResolution": resize_resolution,
        "effectiveProperties": effective_properties,
        "resolvedNode": resolved,
        "resolvedAt": now_millis()
    }))
}

pub(super) fn update_instance_snapshot(doc: &mut Value, instance_id: &str, snapshot: Value) -> AppResult<()> {
    let elements = canvas_elements_mut(doc)?;
    for element in elements {
        if element_id(element) == Some(instance_id) {
            let obj = element
                .as_object_mut()
                .ok_or_else(|| AppError::Custom("Canvas element is not an object".into()))?;
            obj.insert("resolvedRender".into(), snapshot);
            return Ok(());
        }
    }
    Err(AppError::Custom(format!(
        "Instance '{instance_id}' not found while updating render snapshot"
    )))
}
