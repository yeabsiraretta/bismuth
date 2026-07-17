use super::*;

pub(super) fn upsert_canvas_code_connect_op(state: &AppState, args: &Value) -> AppResult<Value> {
    let path = required_str(args, "path")?;
    let node_id = required_str(args, "node_id")?;
    let framework = required_str(args, "framework")?;
    let file_path = required_str(args, "file_path")?;
    let component_name = required_str(args, "component_name")?;
    let props_mapping = args
        .get("props_mapping")
        .cloned()
        .unwrap_or_else(|| serde_json::json!({}));
    let states = args
        .get("states")
        .cloned()
        .unwrap_or_else(|| serde_json::json!([]));
    let slots = args
        .get("slots")
        .cloned()
        .unwrap_or_else(|| serde_json::json!([]));
    let events = args
        .get("events")
        .cloned()
        .unwrap_or_else(|| serde_json::json!([]));
    let accessibility = args
        .get("accessibility")
        .cloned()
        .unwrap_or_else(|| serde_json::json!({}));
    let examples = args
        .get("examples")
        .cloned()
        .unwrap_or_else(|| serde_json::json!([]));
    let required_props = args
        .get("required_props")
        .cloned()
        .unwrap_or_else(|| serde_json::json!([]));
    let instructions = args
        .get("instructions")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let mut doc = load_canvas_json(state, path)?;
    let updated_at = now_millis();
    let entry = serde_json::json!({
        "id": format!("{node_id}:{framework}:{component_name}"),
        "nodeId": node_id,
        "framework": framework,
        "filePath": file_path,
        "componentName": component_name,
        "propsMapping": props_mapping,
        "states": states,
        "slots": slots,
        "events": events,
        "accessibility": accessibility,
        "examples": examples,
        "requiredProps": required_props,
        "instructions": instructions,
        "updatedAt": updated_at
    });

    let root = doc
        .as_object_mut()
        .ok_or_else(|| AppError::Custom("Canvas root must be a JSON object".into()))?;
    let list = root
        .entry("codeConnect")
        .or_insert_with(|| Value::Array(Vec::new()))
        .as_array_mut()
        .ok_or_else(|| AppError::Custom("Canvas codeConnect must be an array".into()))?;

    if let Some(existing) = list.iter_mut().find(|candidate| {
        candidate.get("nodeId").and_then(Value::as_str) == Some(node_id)
            && candidate.get("framework").and_then(Value::as_str) == Some(framework)
            && candidate.get("componentName").and_then(Value::as_str) == Some(component_name)
    }) {
        *existing = entry.clone();
    } else {
        list.push(entry.clone());
    }

    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({ "path": path, "mapping": entry }))
}

pub(super) fn list_canvas_code_connect_op(
    state: &AppState,
    path: &str,
    node_id: Option<&str>,
) -> AppResult<Value> {
    let doc = load_canvas_json(state, path)?;
    let all = doc
        .get("codeConnect")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let filtered: Vec<Value> = if let Some(id) = node_id {
        all.into_iter()
            .filter(|entry| entry.get("nodeId").and_then(Value::as_str) == Some(id))
            .collect()
    } else {
        all
    };
    Ok(serde_json::json!({ "path": path, "count": filtered.len(), "mappings": filtered }))
}

pub(super) fn validate_canvas_code_connect_contract_op(
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
    let mappings = root_array(&doc, "codeConnect");
    let mut reports = Vec::new();
    let mut ok_count = 0usize;
    let mut issue_count = 0usize;
    for mapping in mappings {
        let node_id = mapping.get("nodeId").and_then(Value::as_str).unwrap_or("");
        if id_set
            .as_ref()
            .map(|set| !set.contains(node_id))
            .unwrap_or(false)
        {
            continue;
        }
        let mut issues = Vec::new();
        if mapping
            .get("filePath")
            .and_then(Value::as_str)
            .unwrap_or("")
            .is_empty()
        {
            issues.push("missing filePath".to_string());
        }
        if mapping
            .get("componentName")
            .and_then(Value::as_str)
            .unwrap_or("")
            .is_empty()
        {
            issues.push("missing componentName".to_string());
        }
        if mapping
            .get("propsMapping")
            .and_then(Value::as_object)
            .map_or(true, |props| props.is_empty())
        {
            issues.push("empty propsMapping".to_string());
        }
        let has_node = elements
            .iter()
            .any(|element| element_id(element) == Some(node_id));
        if !has_node {
            issues.push("nodeId not found in canvas elements".to_string());
        }
        if let Some(required_props) = mapping.get("requiredProps").and_then(Value::as_array) {
            let mapped_names: std::collections::HashSet<String> = mapping
                .get("propsMapping")
                .and_then(Value::as_object)
                .map(|props| {
                    props
                        .values()
                        .filter_map(|value| {
                            value.as_str().map(str::to_string).or_else(|| {
                                value
                                    .get("prop")
                                    .and_then(Value::as_str)
                                    .map(str::to_string)
                            })
                        })
                        .collect()
                })
                .unwrap_or_default();
            for required in required_props.iter().filter_map(Value::as_str) {
                if !mapped_names.contains(required) {
                    issues.push(format!("required prop '{required}' not mapped"));
                }
            }
        }
        let status = if issues.is_empty() {
            ok_count += 1;
            "ok"
        } else {
            issue_count += 1;
            "issues"
        };
        reports.push(serde_json::json!({
            "nodeId": node_id,
            "framework": mapping.get("framework").and_then(Value::as_str).unwrap_or(""),
            "componentName": mapping.get("componentName").and_then(Value::as_str).unwrap_or(""),
            "status": status,
            "issues": issues
        }));
    }
    Ok(serde_json::json!({
        "path": path,
        "checked": reports.len(),
        "ok": ok_count,
        "withIssues": issue_count,
        "reports": reports
    }))
}
