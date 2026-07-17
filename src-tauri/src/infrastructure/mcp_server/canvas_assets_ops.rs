use super::*;

pub(super) fn upsert_canvas_token_op(state: &AppState, args: &Value) -> AppResult<Value> {
    let path = required_str(args, "path")?;
    let collection = required_str(args, "collection")?;
    let name = required_str(args, "name")?;
    let value = args
        .get("value")
        .cloned()
        .ok_or_else(|| AppError::Custom("Missing required argument: value".into()))?;
    let kind = args
        .get("kind")
        .and_then(Value::as_str)
        .unwrap_or("generic");
    let mode = args
        .get("mode")
        .and_then(Value::as_str)
        .unwrap_or("default");
    let description = args
        .get("description")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let mut doc = load_canvas_json(state, path)?;
    let token_id = format!("{collection}.{name}:{mode}");
    let entry = serde_json::json!({
        "id": token_id,
        "collection": collection,
        "name": name,
        "kind": kind,
        "mode": mode,
        "value": value,
        "description": description,
        "updatedAt": now_millis()
    });
    let tokens = root_array_mut(&mut doc, "designTokens")?;
    if let Some(existing) = tokens
        .iter_mut()
        .find(|token| token.get("id").and_then(Value::as_str) == Some(token_id.as_str()))
    {
        *existing = entry.clone();
    } else {
        tokens.push(entry.clone());
    }
    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({ "path": path, "token": entry }))
}

pub(super) fn list_canvas_tokens_op(
    state: &AppState,
    path: &str,
    collection: Option<&str>,
) -> AppResult<Value> {
    let doc = load_canvas_json(state, path)?;
    let tokens = root_array(&doc, "designTokens");
    let filtered: Vec<Value> = if let Some(collection_name) = collection {
        tokens
            .into_iter()
            .filter(|token| {
                token.get("collection").and_then(Value::as_str) == Some(collection_name)
            })
            .collect()
    } else {
        tokens
    };
    Ok(serde_json::json!({ "path": path, "count": filtered.len(), "tokens": filtered }))
}

fn set_nested_path(node: &mut Value, path: &[&str], value: Value) {
    if path.is_empty() {
        *node = value;
        return;
    }
    if path.len() == 1 {
        if let Some(obj) = node.as_object_mut() {
            obj.insert(path[0].to_string(), value);
        }
        return;
    }
    if let Some(obj) = node.as_object_mut() {
        let next = obj
            .entry(path[0].to_string())
            .or_insert_with(|| Value::Object(Map::new()));
        if !next.is_object() {
            *next = Value::Object(Map::new());
        }
        set_nested_path(next, &path[1..], value);
    }
}

pub(super) fn bind_canvas_token_op(
    state: &AppState,
    path: &str,
    node_ids: &[String],
    property_path: &str,
    token_id: &str,
) -> AppResult<Value> {
    if node_ids.is_empty() {
        return Err(AppError::Custom(
            "bind_canvas_token requires at least one node_id".into(),
        ));
    }
    let mut doc = load_canvas_json(state, path)?;
    let token_exists = root_array(&doc, "designTokens")
        .iter()
        .any(|token| token.get("id").and_then(Value::as_str) == Some(token_id));
    if !token_exists {
        return Err(AppError::Custom(format!(
            "Token '{token_id}' was not found in {path}"
        )));
    }
    let id_set: std::collections::HashSet<&str> = node_ids.iter().map(String::as_str).collect();
    let path_segments: Vec<&str> = property_path
        .split('.')
        .filter(|segment| !segment.is_empty())
        .collect();
    if path_segments.is_empty() {
        return Err(AppError::Custom("property_path cannot be empty".into()));
    }
    let mut updated = Vec::new();
    let elements = canvas_elements_mut(&mut doc)?;
    for element in elements {
        if let Some(id) = element_id(element).map(str::to_string) {
            if id_set.contains(id.as_str()) {
                set_nested_path(
                    element,
                    &path_segments,
                    serde_json::json!({
                        "tokenRef": token_id,
                        "boundAt": now_millis()
                    }),
                );
                updated.push(id);
            }
        }
    }
    if updated.is_empty() {
        return Err(AppError::Custom(format!(
            "No matching canvas nodes found for token binding in {path}"
        )));
    }
    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({
        "path": path,
        "propertyPath": property_path,
        "tokenId": token_id,
        "updatedIds": updated
    }))
}

pub(super) fn upsert_canvas_style_op(state: &AppState, args: &Value) -> AppResult<Value> {
    let path = required_str(args, "path")?;
    let name = required_str(args, "name")?;
    let style = args
        .get("style")
        .cloned()
        .ok_or_else(|| AppError::Custom("Missing required argument: style".into()))?;
    let style_id = args
        .get("style_id")
        .and_then(Value::as_str)
        .map(String::from)
        .unwrap_or_else(|| format!("style-{}-{}", now_millis(), name.to_lowercase().replace(' ', "-")));
    let description = args
        .get("description")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let mut doc = load_canvas_json(state, path)?;
    let entry = serde_json::json!({
        "id": style_id,
        "name": name,
        "description": description,
        "style": style,
        "updatedAt": now_millis()
    });
    let styles = root_array_mut(&mut doc, "sharedStyles")?;
    if let Some(existing) = styles
        .iter_mut()
        .find(|item| item.get("id").and_then(Value::as_str) == Some(style_id.as_str()))
    {
        *existing = entry.clone();
    } else {
        styles.push(entry.clone());
    }
    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({ "path": path, "style": entry }))
}

pub(super) fn apply_canvas_style_op(
    state: &AppState,
    path: &str,
    node_ids: &[String],
    style_id: &str,
) -> AppResult<Value> {
    if node_ids.is_empty() {
        return Err(AppError::Custom(
            "apply_canvas_style requires at least one node_id".into(),
        ));
    }
    let mut doc = load_canvas_json(state, path)?;
    let style_payload = root_array(&doc, "sharedStyles")
        .into_iter()
        .find(|item| item.get("id").and_then(Value::as_str) == Some(style_id))
        .and_then(|item| item.get("style").cloned())
        .ok_or_else(|| AppError::Custom(format!("Shared style '{style_id}' was not found")))?;
    let id_set: std::collections::HashSet<&str> = node_ids.iter().map(String::as_str).collect();
    let mut updated = Vec::new();
    let elements = canvas_elements_mut(&mut doc)?;
    for element in elements {
        if let Some(id) = element_id(element).map(str::to_string) {
            if id_set.contains(id.as_str()) {
                merge_json_patch(element, &style_payload);
                if let Some(obj) = element.as_object_mut() {
                    obj.insert("styleRef".into(), Value::String(style_id.to_string()));
                }
                updated.push(id);
            }
        }
    }
    if updated.is_empty() {
        return Err(AppError::Custom(format!(
            "No matching canvas nodes found for shared style '{style_id}' in {path}"
        )));
    }
    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({ "path": path, "styleId": style_id, "updatedIds": updated }))
}

pub(super) fn define_canvas_variant_set_op(state: &AppState, args: &Value) -> AppResult<Value> {
    let path = required_str(args, "path")?;
    let set_id = required_str(args, "set_id")?;
    let name = required_str(args, "name")?;
    let properties = args
        .get("properties")
        .cloned()
        .ok_or_else(|| AppError::Custom("Missing required argument: properties".into()))?;
    let mut doc = load_canvas_json(state, path)?;
    let entry = serde_json::json!({
        "id": set_id,
        "name": name,
        "properties": properties,
        "componentIds": root_array(&doc, "variantSets")
            .into_iter()
            .find(|set| set.get("id").and_then(Value::as_str) == Some(set_id))
            .and_then(|set| set.get("componentIds").cloned())
            .unwrap_or_else(|| serde_json::json!([])),
        "updatedAt": now_millis()
    });
    let sets = root_array_mut(&mut doc, "variantSets")?;
    if let Some(existing) = sets
        .iter_mut()
        .find(|set| set.get("id").and_then(Value::as_str) == Some(set_id))
    {
        *existing = entry.clone();
    } else {
        sets.push(entry.clone());
    }
    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({ "path": path, "variantSet": entry }))
}

pub(super) fn upsert_canvas_variant_op(state: &AppState, args: &Value) -> AppResult<Value> {
    let path = required_str(args, "path")?;
    let node_id = required_str(args, "node_id")?;
    let set_id = required_str(args, "set_id")?;
    let variant_properties = args
        .get("variant_properties")
        .cloned()
        .ok_or_else(|| AppError::Custom("Missing required argument: variant_properties".into()))?;
    let mut doc = load_canvas_json(state, path)?;
    let mut found_component = false;
    {
        let elements = canvas_elements_mut(&mut doc)?;
        for element in elements {
            if element_id(element) == Some(node_id) {
                let obj = element
                    .as_object_mut()
                    .ok_or_else(|| AppError::Custom("Canvas element is not an object".into()))?;
                obj.insert("kind".into(), Value::String("component".into()));
                obj.insert("variantSetId".into(), Value::String(set_id.to_string()));
                obj.insert("variantProperties".into(), variant_properties.clone());
                found_component = true;
                break;
            }
        }
    }
    if !found_component {
        return Err(AppError::Custom(format!(
            "Component node '{node_id}' not found in {path}"
        )));
    }

    let sets = root_array_mut(&mut doc, "variantSets")?;
    if let Some(set) = sets
        .iter_mut()
        .find(|candidate| candidate.get("id").and_then(Value::as_str) == Some(set_id))
    {
        let arr = set
            .as_object_mut()
            .and_then(|obj| obj.get_mut("componentIds"))
            .and_then(Value::as_array_mut)
            .ok_or_else(|| AppError::Custom("variantSet.componentIds must be an array".into()))?;
        if !arr.iter().any(|id| id.as_str() == Some(node_id)) {
            arr.push(Value::String(node_id.to_string()));
        }
    } else {
        sets.push(serde_json::json!({
            "id": set_id,
            "name": set_id,
            "properties": {},
            "componentIds": [node_id],
            "updatedAt": now_millis()
        }));
    }
    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({
        "path": path,
        "nodeId": node_id,
        "variantSetId": set_id,
        "variantProperties": variant_properties
    }))
}

fn properties_match(candidate: &Value, selection: &Map<String, Value>) -> bool {
    let Some(candidate_map) = candidate.as_object() else {
        return false;
    };
    for (key, value) in selection {
        if candidate_map.get(key) != Some(value) {
            return false;
        }
    }
    true
}

pub(super) fn set_canvas_instance_variant_op(state: &AppState, args: &Value) -> AppResult<Value> {
    let path = required_str(args, "path")?;
    let instance_id = required_str(args, "instance_id")?;
    let selection_map = args
        .get("selection")
        .and_then(Value::as_object)
        .cloned()
        .ok_or_else(|| AppError::Custom("selection must be an object".into()))?;
    let mut doc = load_canvas_json(state, path)?;

    let (base_component_id, set_id_opt) = {
        let elements = canvas_elements(&doc)?;
        let instance = elements
            .iter()
            .find(|el| element_id(el) == Some(instance_id))
            .ok_or_else(|| AppError::Custom(format!("Instance '{instance_id}' not found in {path}")))?;
        let base_component = instance
            .get("componentId")
            .and_then(Value::as_str)
            .ok_or_else(|| AppError::Custom("Instance missing componentId".into()))?
            .to_string();
        let set_id = elements
            .iter()
            .find(|el| element_id(el) == Some(base_component.as_str()))
            .and_then(|el| el.get("variantSetId"))
            .and_then(Value::as_str)
            .map(String::from);
        (base_component, set_id)
    };

    let resolved_component_id = if let Some(set_id) = &set_id_opt {
        let elements = canvas_elements(&doc)?;
        elements
            .iter()
            .find(|candidate| {
                candidate.get("kind").and_then(Value::as_str) == Some("component")
                    && candidate.get("variantSetId").and_then(Value::as_str) == Some(set_id.as_str())
                    && candidate
                        .get("variantProperties")
                        .is_some_and(|props| properties_match(props, &selection_map))
            })
            .and_then(element_id)
            .map(String::from)
            .unwrap_or(base_component_id)
    } else {
        base_component_id
    };

    let elements = canvas_elements_mut(&mut doc)?;
    let mut updated = false;
    for element in elements {
        if element_id(element) == Some(instance_id) {
            let obj = element
                .as_object_mut()
                .ok_or_else(|| AppError::Custom("Canvas element is not an object".into()))?;
            obj.insert("variantSelection".into(), Value::Object(selection_map.clone()));
            obj.insert("componentId".into(), Value::String(resolved_component_id.clone()));
            updated = true;
            break;
        }
    }

    if !updated {
        return Err(AppError::Custom(format!(
            "Instance '{instance_id}' not found in {path}"
        )));
    }

    let snapshot = build_instance_render_snapshot(&doc, instance_id, None)?;
    update_instance_snapshot(&mut doc, instance_id, snapshot.clone())?;
    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({
        "path": path,
        "instanceId": instance_id,
        "selection": selection_map,
        "resolvedComponentId": resolved_component_id,
        "resolvedRender": snapshot
    }))
}

pub(super) fn set_canvas_token_mode_op(state: &AppState, args: &Value) -> AppResult<Value> {
    let path = required_str(args, "path")?;
    let mode = required_str(args, "mode")?;
    let refresh_instances = args
        .get("refresh_instances")
        .and_then(Value::as_bool)
        .unwrap_or(true);
    let mut doc = load_canvas_json(state, path)?;
    let design_system = root_object_mut(&mut doc, "designSystem")?;
    design_system.insert("activeTokenMode".into(), Value::String(mode.to_string()));

    let mut refreshed = 0usize;
    if refresh_instances {
        let instance_ids: Vec<String> = canvas_elements(&doc)?
            .iter()
            .filter(|el| el.get("kind").and_then(Value::as_str) == Some("instance"))
            .filter_map(|el| element_id(el).map(str::to_string))
            .collect();
        for instance_id in instance_ids {
            if let Ok(snapshot) = build_instance_render_snapshot(&doc, &instance_id, Some(mode)) {
                update_instance_snapshot(&mut doc, &instance_id, snapshot)?;
                refreshed += 1;
            }
        }
    }

    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({
        "path": path,
        "mode": mode,
        "refreshInstances": refresh_instances,
        "refreshedInstances": refreshed
    }))
}

pub(super) fn resolve_canvas_instance_render_op(state: &AppState, args: &Value) -> AppResult<Value> {
    let path = required_str(args, "path")?;
    let instance_id = required_str(args, "instance_id")?;
    let mode = args.get("mode").and_then(Value::as_str);
    let mut doc = load_canvas_json(state, path)?;
    let snapshot = build_instance_render_snapshot(&doc, instance_id, mode)?;
    update_instance_snapshot(&mut doc, instance_id, snapshot.clone())?;
    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({
        "path": path,
        "instanceId": instance_id,
        "resolvedRender": snapshot
    }))
}

fn prop_expression_for_mapping(
    design_key: &str,
    mapped_value: &Value,
    node: Option<&Value>,
) -> Option<(String, String)> {
    if let Some(code_prop) = mapped_value.as_str() {
        return Some((code_prop.to_string(), format!("design[\"{design_key}\"]")));
    }
    if let Some(obj) = mapped_value.as_object() {
        let code_prop = obj
            .get("prop")
            .and_then(Value::as_str)
            .unwrap_or(design_key)
            .to_string();
        if let Some(literal) = obj.get("literal").and_then(Value::as_str) {
            return Some((code_prop, format!("\"{literal}\"")));
        }
        if let Some(path) = obj.get("nodePath").and_then(Value::as_str) {
            let from_node = node.and_then(|n| {
                path.split('.')
                    .try_fold(n, |acc, key| acc.get(key))
                    .cloned()
            });
            if let Some(value) = from_node {
                if let Some(s) = value.as_str() {
                    return Some((code_prop, format!("\"{s}\"")));
                }
                return Some((code_prop, value.to_string()));
            }
        }
        return Some((code_prop, format!("design[\"{design_key}\"]")));
    }
    None
}

fn normalize_vue_expression(expression: &str) -> String {
    let trimmed = expression.trim();
    if trimmed.len() >= 2 && trimmed.starts_with('"') && trimmed.ends_with('"') {
        let inner = &trimmed[1..trimmed.len() - 1];
        return format!("'{}'", inner.replace('\'', "\\'"));
    }
    trimmed.replace("[\"", "['").replace("\"]", "']")
}

fn generate_code_connect_snippets_for_doc(doc: &Value, node_ids: Option<&[String]>) -> Vec<Value> {
    let id_set: Option<std::collections::HashSet<&str>> =
        node_ids.map(|ids| ids.iter().map(String::as_str).collect());
    let elements = canvas_elements(doc).map(|all| all.clone()).unwrap_or_default();
    let code_connect = root_array(doc, "codeConnect");

    code_connect
        .into_iter()
        .filter(|mapping| {
            let node_id = mapping.get("nodeId").and_then(Value::as_str);
            id_set
                .as_ref()
                .map(|set| node_id.is_some_and(|id| set.contains(id)))
                .unwrap_or(true)
        })
        .map(|mapping| {
            let node_id = mapping.get("nodeId").and_then(Value::as_str).unwrap_or("");
            let framework = mapping
                .get("framework")
                .and_then(Value::as_str)
                .unwrap_or("generic");
            let component_name = mapping
                .get("componentName")
                .and_then(Value::as_str)
                .unwrap_or("Component");
            let file_path = mapping.get("filePath").and_then(Value::as_str).unwrap_or("");
            let instructions = mapping
                .get("instructions")
                .and_then(Value::as_str)
                .unwrap_or_default();
            let states = mapping
                .get("states")
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_default();
            let slots = mapping
                .get("slots")
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_default();
            let events = mapping
                .get("events")
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_default();
            let accessibility = mapping
                .get("accessibility")
                .cloned()
                .unwrap_or_else(|| serde_json::json!({}));
            let node = elements.iter().find(|element| element_id(element) == Some(node_id));
            let props = mapping
                .get("propsMapping")
                .and_then(Value::as_object)
                .cloned()
                .unwrap_or_default();

            let mut prop_pairs = Vec::new();
            for (design_key, mapped_value) in props {
                if let Some((prop_name, expression)) =
                    prop_expression_for_mapping(&design_key, &mapped_value, node)
                {
                    prop_pairs.push((prop_name, expression));
                }
            }
            prop_pairs.sort_by(|a, b| a.0.cmp(&b.0));
            let (snippet, language) = match framework {
                "react" => (
                    {
                        let attrs: Vec<String> = prop_pairs
                            .iter()
                            .map(|(prop, expression)| format!("{prop}={{{expression}}}"))
                            .collect();
                        let attr_block = if attrs.is_empty() {
                            String::new()
                        } else {
                            format!("\n  {}\n", attrs.join("\n  "))
                        };
                        format!(
                            "import {{ {component_name} }} from \"{file_path}\";\n\nexport function Example() {{\n  return (\n    <{component_name}{attr_block}/>\n  );\n}}"
                        )
                    },
                    "tsx",
                ),
                "svelte" => (
                    {
                        let attrs: Vec<String> = prop_pairs
                            .iter()
                            .map(|(prop, expression)| format!("{prop}={{{expression}}}"))
                            .collect();
                        let attr_block = if attrs.is_empty() {
                            String::new()
                        } else {
                            format!("\n  {}\n", attrs.join("\n  "))
                        };
                        format!(
                            "<script lang=\"ts\">\n  import {component_name} from \"{file_path}\";\n</script>\n\n<{component_name}{attr_block}/>"
                        )
                    },
                    "svelte",
                ),
                "vue" => (
                    {
                        let attrs: Vec<String> = prop_pairs
                            .iter()
                            .map(|(prop, expression)| {
                                format!(":{prop}=\"{}\"", normalize_vue_expression(expression))
                            })
                            .collect();
                        let attr_block = if attrs.is_empty() {
                            String::new()
                        } else {
                            format!("\n    {}\n", attrs.join("\n    "))
                        };
                        format!(
                            "<script setup lang=\"ts\">\nimport {component_name} from \"{file_path}\";\n</script>\n\n<template>\n  <{component_name}{attr_block}/>\n</template>"
                        )
                    },
                    "vue",
                ),
                _ => (
                    format!(
                        "{component_name}({})",
                        prop_pairs
                            .iter()
                            .map(|(prop, expression)| format!("{prop}: {expression}"))
                            .collect::<Vec<_>>()
                            .join(", ")
                    ),
                    "txt",
                ),
            };

            serde_json::json!({
                "nodeId": node_id,
                "framework": framework,
                "language": language,
                "filePath": file_path,
                "componentName": component_name,
                "instructions": instructions,
                "states": states,
                "slots": slots,
                "events": events,
                "accessibility": accessibility,
                "snippet": snippet
            })
        })
        .collect()
}

pub(super) fn generate_code_connect_snippets_op(
    state: &AppState,
    path: &str,
    node_ids: Option<&[String]>,
) -> AppResult<Value> {
    let doc = load_canvas_json(state, path)?;
    let snippets = generate_code_connect_snippets_for_doc(&doc, node_ids);
    Ok(serde_json::json!({
        "path": path,
        "count": snippets.len(),
        "snippets": snippets
    }))
}

pub(super) fn export_canvas_handoff_op(
    state: &AppState,
    path: &str,
    node_ids: &[String],
) -> AppResult<Value> {
    let doc = load_canvas_json(state, path)?;
    let elements = canvas_elements(&doc)?;
    let id_set: Option<std::collections::HashSet<&str>> = if node_ids.is_empty() {
        None
    } else {
        Some(node_ids.iter().map(String::as_str).collect())
    };
    let nodes: Vec<Value> = elements
        .iter()
        .filter(|el| {
            id_set
                .as_ref()
                .map(|set| element_id(el).is_some_and(|id| set.contains(id)))
                .unwrap_or(true)
        })
        .cloned()
        .collect();

    let code_connect = doc
        .get("codeConnect")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let code_map: Vec<Value> = if let Some(set) = &id_set {
        code_connect
            .into_iter()
            .filter(|entry| {
                entry
                    .get("nodeId")
                    .and_then(Value::as_str)
                    .is_some_and(|id| set.contains(id))
            })
            .collect()
    } else {
        code_connect
    };
    let variant_sets = root_array(&doc, "variantSets");
    let shared_styles = root_array(&doc, "sharedStyles");
    let design_tokens = root_array(&doc, "designTokens");
    let design_library_releases = root_array(&doc, "designLibraryReleases");
    let snippets = generate_code_connect_snippets_for_doc(
        &doc,
        if node_ids.is_empty() {
            None
        } else {
            Some(node_ids)
        },
    );
    let contract_validation = validate_canvas_code_connect_contract_op(state, path, node_ids)?;
    let component_property_contracts: Vec<Value> = nodes
        .iter()
        .filter_map(|node| {
            let node_id = element_id(node)?;
            let properties = node.get("componentProperties")?;
            Some(serde_json::json!({
                "nodeId": node_id,
                "properties": properties
            }))
        })
        .collect();
    let component_state_contracts: Vec<Value> = nodes
        .iter()
        .filter_map(|node| {
            let node_id = element_id(node)?;
            let states = node.get("interactionStates")?;
            Some(serde_json::json!({
                "nodeId": node_id,
                "states": states
            }))
        })
        .collect();
    let component_slot_contracts: Vec<Value> = nodes
        .iter()
        .filter_map(|node| {
            let node_id = element_id(node)?;
            let slots = node.get("slotDefinitions")?;
            Some(serde_json::json!({
                "nodeId": node_id,
                "slots": slots
            }))
        })
        .collect();
    let instance_snapshots: Vec<Value> = nodes
        .iter()
        .filter(|node| node.get("kind").and_then(Value::as_str) == Some("instance"))
        .filter_map(|node| {
            let instance_id = element_id(node)?;
            let snapshot = build_instance_render_snapshot(&doc, instance_id, None).ok()?;
            Some(snapshot)
        })
        .collect();

    Ok(serde_json::json!({
        "path": path,
        "generatedAt": now_millis(),
        "nodes": nodes,
        "codeConnect": code_map,
        "codeConnectValidation": contract_validation,
        "codeSnippets": snippets,
        "instanceSnapshots": instance_snapshots,
        "componentPropertyContracts": component_property_contracts,
        "componentStateContracts": component_state_contracts,
        "componentSlotContracts": component_slot_contracts,
        "variantSets": variant_sets,
        "sharedStyles": shared_styles,
        "designTokens": design_tokens,
        "designLibraryReleases": design_library_releases
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::infrastructure::state::AppState;
    use tempfile::TempDir;

    fn setup_state() -> (TempDir, AppState) {
        let tmp = TempDir::new().expect("tempdir");
        let state = AppState::default();
        {
            let mut guard = state.vault.write().expect("vault lock");
            guard.path = Some(tmp.path().to_string_lossy().to_string());
            guard.name = Some("test-vault".into());
        }
        (tmp, state)
    }

    #[test]
    fn bind_canvas_token_errors_when_token_missing() {
        let (_tmp, state) = setup_state();
        let path = "tokens.canvas";
        let seed = serde_json::json!({
          "version": 1,
          "elements": [
            { "id": "n1", "kind": "rect", "name": "N1", "x": 0, "y": 0, "width": 10, "height": 10, "rotation": 0, "opacity": 1, "locked": false, "layerId": "default", "zIndex": 0 }
          ],
          "connections": [],
          "viewport": { "x": 0, "y": 0, "zoom": 1 },
          "designTokens": []
        });
        vault_service::write_note(&state, path, &serde_json::to_string_pretty(&seed).expect("seed"))
            .expect("write seed");

        let err = bind_canvas_token_op(
            &state,
            path,
            &["n1".into()],
            "fill.color",
            "colors.primary:default",
        )
        .expect_err("missing token should error");
        assert!(err.to_string().contains("Token 'colors.primary:default'"));
    }
}
