use super::*;

pub(super) fn list_canvas_elements_op(state: &AppState, path: &str) -> AppResult<Value> {
    let doc = load_canvas_json(state, path)?;
    let elements = canvas_elements(&doc)?;
    let summary: Vec<Value> = elements
        .iter()
        .map(|el| {
            serde_json::json!({
                "id": element_id(el).unwrap_or(""),
                "kind": el.get("kind").and_then(Value::as_str).unwrap_or(""),
                "name": el.get("name").and_then(Value::as_str).unwrap_or(""),
                "x": number_field(el, "x").unwrap_or(0.0),
                "y": number_field(el, "y").unwrap_or(0.0),
                "width": number_field(el, "width").unwrap_or(0.0),
                "height": number_field(el, "height").unwrap_or(0.0),
            })
        })
        .collect();
    Ok(serde_json::json!({ "path": path, "count": summary.len(), "elements": summary }))
}

pub(super) fn align_canvas_elements_op(
    state: &AppState,
    path: &str,
    node_ids: &[String],
    direction: &str,
) -> AppResult<Value> {
    if node_ids.len() < 2 {
        return Err(AppError::Custom(
            "align_canvas_elements requires at least 2 node_ids".into(),
        ));
    }
    let mut doc = load_canvas_json(state, path)?;
    let elements = canvas_elements(&doc)?;

    let selected: Vec<(String, f64, f64, f64, f64)> = node_ids
        .iter()
        .filter_map(|id| {
            elements
                .iter()
                .find(|el| element_id(el) == Some(id.as_str()))
                .map(|el| {
                    (
                        id.clone(),
                        number_field(el, "x").unwrap_or(0.0),
                        number_field(el, "y").unwrap_or(0.0),
                        number_field(el, "width").unwrap_or(0.0),
                        number_field(el, "height").unwrap_or(0.0),
                    )
                })
        })
        .collect();

    if selected.len() < 2 {
        return Err(AppError::Custom(
            "Unable to align: fewer than 2 valid canvas elements found".into(),
        ));
    }

    let target = match direction {
        "left" => selected
            .iter()
            .map(|(_, x, _, _, _)| *x)
            .fold(f64::INFINITY, f64::min),
        "right" => selected
            .iter()
            .map(|(_, x, _, w, _)| x + w)
            .fold(f64::NEG_INFINITY, f64::max),
        "center-x" => {
            let mins = selected
                .iter()
                .map(|(_, x, _, w, _)| x + (w / 2.0))
                .collect::<Vec<_>>();
            (mins.iter().copied().fold(f64::INFINITY, f64::min)
                + mins.iter().copied().fold(f64::NEG_INFINITY, f64::max))
                / 2.0
        },
        "top" => selected
            .iter()
            .map(|(_, _, y, _, _)| *y)
            .fold(f64::INFINITY, f64::min),
        "bottom" => selected
            .iter()
            .map(|(_, _, y, _, h)| y + h)
            .fold(f64::NEG_INFINITY, f64::max),
        "center-y" => {
            let mids = selected
                .iter()
                .map(|(_, _, y, _, h)| y + (h / 2.0))
                .collect::<Vec<_>>();
            (mids.iter().copied().fold(f64::INFINITY, f64::min)
                + mids.iter().copied().fold(f64::NEG_INFINITY, f64::max))
                / 2.0
        },
        _ => {
            return Err(AppError::Custom(format!(
                "Invalid direction '{direction}'. Expected left|center-x|right|top|center-y|bottom"
            )))
        },
    };

    let mut updates = Map::new();
    for (id, x, y, w, h) in &selected {
        let (new_x, new_y) = match direction {
            "left" => (target, *y),
            "right" => (target - *w, *y),
            "center-x" => (target - (*w / 2.0), *y),
            "top" => (*x, target),
            "bottom" => (*x, target - *h),
            "center-y" => (*x, target - (*h / 2.0)),
            _ => (*x, *y),
        };
        updates.insert(id.clone(), serde_json::json!({ "x": new_x, "y": new_y }));
    }

    let elements_mut = canvas_elements_mut(&mut doc)?;
    for el in elements_mut {
        if let Some(id) = element_id(el) {
            if let Some(next) = updates.get(id) {
                if let Some(nx) = next.get("x").and_then(Value::as_f64) {
                    set_number_field(el, "x", nx);
                }
                if let Some(ny) = next.get("y").and_then(Value::as_f64) {
                    set_number_field(el, "y", ny);
                }
            }
        }
    }

    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({ "path": path, "updated": updates }))
}

pub(super) fn distribute_canvas_elements_op(
    state: &AppState,
    path: &str,
    node_ids: &[String],
    axis: &str,
) -> AppResult<Value> {
    if node_ids.len() < 3 {
        return Err(AppError::Custom(
            "distribute_canvas_elements requires at least 3 node_ids".into(),
        ));
    }
    let mut doc = load_canvas_json(state, path)?;
    let elements = canvas_elements(&doc)?;

    let mut selected: Vec<(String, f64, f64, f64, f64)> = node_ids
        .iter()
        .filter_map(|id| {
            elements
                .iter()
                .find(|el| element_id(el) == Some(id.as_str()))
                .map(|el| {
                    (
                        id.clone(),
                        number_field(el, "x").unwrap_or(0.0),
                        number_field(el, "y").unwrap_or(0.0),
                        number_field(el, "width").unwrap_or(0.0),
                        number_field(el, "height").unwrap_or(0.0),
                    )
                })
        })
        .collect();

    if selected.len() < 3 {
        return Err(AppError::Custom(
            "Unable to distribute: fewer than 3 valid canvas elements found".into(),
        ));
    }

    let mut updates = Map::new();
    match axis {
        "horizontal" => {
            selected.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal));
            let first = selected[0].1;
            let last = selected[selected.len() - 1].1 + selected[selected.len() - 1].3;
            let total_width: f64 = selected.iter().map(|(_, _, _, w, _)| *w).sum();
            let gap = (last - first - total_width) / ((selected.len() - 1) as f64);
            let mut cursor = first;
            for (id, _, y, w, _) in &selected {
                updates.insert(id.clone(), serde_json::json!({ "x": cursor, "y": y }));
                cursor += *w + gap;
            }
        },
        "vertical" => {
            selected.sort_by(|a, b| a.2.partial_cmp(&b.2).unwrap_or(std::cmp::Ordering::Equal));
            let first = selected[0].2;
            let last = selected[selected.len() - 1].2 + selected[selected.len() - 1].4;
            let total_height: f64 = selected.iter().map(|(_, _, _, _, h)| *h).sum();
            let gap = (last - first - total_height) / ((selected.len() - 1) as f64);
            let mut cursor = first;
            for (id, x, _, _, h) in &selected {
                updates.insert(id.clone(), serde_json::json!({ "x": x, "y": cursor }));
                cursor += *h + gap;
            }
        },
        _ => {
            return Err(AppError::Custom(format!(
                "Invalid axis '{axis}'. Expected horizontal|vertical"
            )))
        },
    }

    let elements_mut = canvas_elements_mut(&mut doc)?;
    for el in elements_mut {
        if let Some(id) = element_id(el) {
            if let Some(next) = updates.get(id) {
                if let Some(nx) = next.get("x").and_then(Value::as_f64) {
                    set_number_field(el, "x", nx);
                }
                if let Some(ny) = next.get("y").and_then(Value::as_f64) {
                    set_number_field(el, "y", ny);
                }
            }
        }
    }

    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({ "path": path, "updated": updates }))
}

pub(super) fn reorder_canvas_elements_op(
    state: &AppState,
    path: &str,
    node_ids: &[String],
    operation: &str,
) -> AppResult<Value> {
    if node_ids.is_empty() {
        return Err(AppError::Custom(
            "reorder_canvas_elements requires at least one node_id".into(),
        ));
    }
    let mut doc = load_canvas_json(state, path)?;
    let elements = canvas_elements(&doc)?;
    let id_set: std::collections::HashSet<&str> = node_ids.iter().map(String::as_str).collect();
    let mut ordered: Vec<(String, f64, usize)> = elements
        .iter()
        .enumerate()
        .filter_map(|(idx, element)| {
            element_id(element).map(|id| {
                (
                    id.to_string(),
                    number_field(element, "zIndex").unwrap_or(idx as f64),
                    idx,
                )
            })
        })
        .collect();
    ordered.sort_by(|a, b| {
        a.1.partial_cmp(&b.1)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then_with(|| a.2.cmp(&b.2))
    });

    let mut layer_order: Vec<String> = ordered.into_iter().map(|entry| entry.0).collect();
    if !layer_order.iter().any(|id| id_set.contains(id.as_str())) {
        return Err(AppError::Custom(format!(
            "No matching canvas nodes found for reorder in {path}"
        )));
    }

    match operation {
        "bring_to_front" => {
            let mut selected = Vec::new();
            layer_order.retain(|id| {
                if id_set.contains(id.as_str()) {
                    selected.push(id.clone());
                    false
                } else {
                    true
                }
            });
            layer_order.extend(selected);
        }
        "send_to_back" => {
            let mut selected = Vec::new();
            layer_order.retain(|id| {
                if id_set.contains(id.as_str()) {
                    selected.push(id.clone());
                    false
                } else {
                    true
                }
            });
            selected.extend(layer_order);
            layer_order = selected;
        }
        "bring_forward" => {
            for index in (0..layer_order.len().saturating_sub(1)).rev() {
                let left_selected = id_set.contains(layer_order[index].as_str());
                let right_selected = id_set.contains(layer_order[index + 1].as_str());
                if left_selected && !right_selected {
                    layer_order.swap(index, index + 1);
                }
            }
        }
        "send_backward" => {
            for index in 1..layer_order.len() {
                let current_selected = id_set.contains(layer_order[index].as_str());
                let previous_selected = id_set.contains(layer_order[index - 1].as_str());
                if current_selected && !previous_selected {
                    layer_order.swap(index - 1, index);
                }
            }
        }
        _ => {
            return Err(AppError::Custom(format!(
                "Invalid operation '{operation}'. Expected bring_forward|send_backward|bring_to_front|send_to_back"
            )))
        }
    }

    let mut z_index_map = std::collections::HashMap::new();
    for (z_index, id) in layer_order.iter().enumerate() {
        z_index_map.insert(id.clone(), z_index as f64);
    }

    let elements_mut = canvas_elements_mut(&mut doc)?;
    for element in elements_mut {
        if let Some(id) = element_id(element) {
            if let Some(z_index) = z_index_map.get(id) {
                set_number_field(element, "zIndex", *z_index);
            }
        }
    }

    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({
        "path": path,
        "operation": operation,
        "updatedIds": node_ids,
        "order": layer_order
    }))
}

pub(super) fn style_canvas_elements_op(
    state: &AppState,
    path: &str,
    node_ids: &[String],
    style_patch: &Value,
) -> AppResult<Value> {
    if node_ids.is_empty() {
        return Err(AppError::Custom(
            "style_canvas_elements requires at least one node_id".into(),
        ));
    }
    let mut doc = load_canvas_json(state, path)?;
    let id_set: std::collections::HashSet<&str> = node_ids.iter().map(String::as_str).collect();
    let mut updated = Vec::new();

    let elements_mut = canvas_elements_mut(&mut doc)?;
    for el in elements_mut {
        if let Some(id) = element_id(el).map(str::to_string) {
            if id_set.contains(id.as_str()) {
                merge_json_patch(el, style_patch);
                updated.push(id);
            }
        }
    }
    if updated.is_empty() {
        return Err(AppError::Custom(format!(
            "No matching canvas nodes found for style patch in {path}"
        )));
    }

    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({ "path": path, "updated_ids": updated }))
}

pub(super) fn set_canvas_auto_layout_op(state: &AppState, args: &Value) -> AppResult<Value> {
    let path = required_str(args, "path")?;
    let node_id = required_str(args, "node_id")?;
    let mut doc = load_canvas_json(state, path)?;
    let elements_mut = canvas_elements_mut(&mut doc)?;
    let mut found = false;

    for el in elements_mut {
        if element_id(el) == Some(node_id) {
            let obj = el
                .as_object_mut()
                .ok_or_else(|| AppError::Custom("Canvas element is not an object".into()))?;
            if let Some(value) = args.get("auto_layout") {
                obj.insert("autoLayout".into(), value.clone());
            }
            if let Some(value) = args.get("child_overrides") {
                obj.insert("childOverrides".into(), value.clone());
            }
            if let Some(value) = args.get("constraints") {
                obj.insert("constraints".into(), value.clone());
            }
            if let Some(preset) = args.get("constraint_preset").and_then(Value::as_str) {
                obj.insert("constraints".into(), constraint_preset_payload(preset)?);
            }
            if let Some(value) = args.get("clip_content").and_then(Value::as_bool) {
                obj.insert("clipContent".into(), Value::Bool(value));
            }
            found = true;
            break;
        }
    }

    if !found {
        return Err(AppError::Custom(format!(
            "Canvas node '{node_id}' was not found in {path}"
        )));
    }
    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({ "path": path, "node_id": node_id, "updated": true }))
}

pub(super) fn create_canvas_component_op(state: &AppState, args: &Value) -> AppResult<Value> {
    let path = required_str(args, "path")?;
    let node_id = required_str(args, "node_id")?;
    let label = args
        .get("label")
        .and_then(Value::as_str)
        .unwrap_or("Component");
    let description = args
        .get("description")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let mut doc = load_canvas_json(state, path)?;
    let elements_mut = canvas_elements_mut(&mut doc)?;
    let mut found = false;

    for el in elements_mut {
        if element_id(el) == Some(node_id) {
            let obj = el
                .as_object_mut()
                .ok_or_else(|| AppError::Custom("Canvas element is not an object".into()))?;
            obj.insert("kind".into(), Value::String("component".into()));
            obj.insert("label".into(), Value::String(label.to_string()));
            obj.insert("description".into(), Value::String(description.to_string()));
            obj.entry("childIds")
                .or_insert_with(|| serde_json::json!([]));
            obj.entry("autoLayout").or_insert(Value::Null);
            obj.entry("childOverrides")
                .or_insert_with(|| serde_json::json!([]));
            obj.entry("constraints").or_insert_with(|| {
                serde_json::json!({
                    "preset": "fixed",
                    "horizontal": "left",
                    "vertical": "top",
                    "widthMode": "fixed",
                    "heightMode": "fixed"
                })
            });
            obj.entry("componentProperties")
                .or_insert_with(|| serde_json::json!({}));
            obj.entry("interactionStates")
                .or_insert_with(|| serde_json::json!({}));
            obj.entry("slotDefinitions")
                .or_insert_with(|| serde_json::json!({}));
            obj.entry("clipContent").or_insert(Value::Bool(true));
            obj.entry("fill")
                .or_insert_with(|| serde_json::json!({ "color": "#ffffff", "opacity": 1 }));
            obj.entry("stroke").or_insert_with(
                || serde_json::json!({ "color": "#7c3aed", "width": 2, "dash": [] }),
            );
            obj.entry("cornerRadius")
                .or_insert_with(|| serde_json::json!(0));
            found = true;
            break;
        }
    }

    if !found {
        return Err(AppError::Custom(format!(
            "Canvas node '{node_id}' was not found in {path}"
        )));
    }
    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({ "path": path, "node_id": node_id, "kind": "component" }))
}

pub(super) fn create_canvas_instance_op(state: &AppState, args: &Value) -> AppResult<Value> {
    let path = required_str(args, "path")?;
    let component_id = required_str(args, "component_id")?;
    let x = args
        .get("x")
        .and_then(Value::as_f64)
        .ok_or_else(|| AppError::Custom("Missing required numeric argument: x".into()))?;
    let y = args
        .get("y")
        .and_then(Value::as_f64)
        .ok_or_else(|| AppError::Custom("Missing required numeric argument: y".into()))?;
    let mut doc = load_canvas_json(state, path)?;
    let elements = canvas_elements(&doc)?;
    let component = elements
        .iter()
        .find(|el| element_id(el) == Some(component_id))
        .ok_or_else(|| {
            AppError::Custom(format!("Component '{component_id}' not found in {path}"))
        })?;
    let overrides = args
        .get("overrides")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    validate_instance_overrides(component, &overrides)?;

    let width = number_field(component, "width").unwrap_or(320.0);
    let height = number_field(component, "height").unwrap_or(240.0);
    let rotation = number_field(component, "rotation").unwrap_or(0.0);
    let opacity = number_field(component, "opacity").unwrap_or(1.0);
    let layer_id = component
        .get("layerId")
        .and_then(Value::as_str)
        .unwrap_or("default");
    let max_z = elements
        .iter()
        .filter_map(|el| number_field(el, "zIndex"))
        .fold(0.0, f64::max);

    let instance_id = format!("instance-{}-{}", now_millis(), elements.len() + 1);
    let name = args
        .get("name")
        .and_then(Value::as_str)
        .unwrap_or("Instance")
        .to_string();
    let instance = serde_json::json!({
        "id": instance_id,
        "kind": "instance",
        "name": name,
        "x": x,
        "y": y,
        "width": width,
        "height": height,
        "rotation": rotation,
        "opacity": opacity,
        "locked": false,
        "layerId": layer_id,
        "zIndex": max_z + 1.0,
        "componentId": component_id,
        "overrides": overrides,
        "interactionState": "base",
        "slots": {},
        "detached": false
    });

    let elements_mut = canvas_elements_mut(&mut doc)?;
    elements_mut.push(instance.clone());
    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({ "path": path, "instance": instance }))
}

pub(super) fn validate_override_type(definition: &Map<String, Value>, value: &Value) -> AppResult<()> {
    let prop_type = definition
        .get("type")
        .and_then(Value::as_str)
        .unwrap_or("string");
    match prop_type {
        "boolean" => {
            if !value.is_boolean() {
                return Err(AppError::Custom("Expected boolean override value".into()));
            }
        },
        "number" => {
            if !value.is_number() {
                return Err(AppError::Custom("Expected numeric override value".into()));
            }
        },
        "enum" => {
            let as_str = value
                .as_str()
                .ok_or_else(|| AppError::Custom("Expected string enum override value".into()))?;
            let allowed = definition
                .get("options")
                .and_then(Value::as_array)
                .ok_or_else(|| {
                    AppError::Custom("Enum property definition missing options".into())
                })?;
            if !allowed
                .iter()
                .any(|candidate| candidate.as_str() == Some(as_str))
            {
                return Err(AppError::Custom(format!(
                    "Enum override value '{as_str}' is not in declared options"
                )));
            }
        },
        "instance-swap" => {
            if !value.is_string() {
                return Err(AppError::Custom(
                    "Expected instance-swap override value as string id".into(),
                ));
            }
        },
        _ => {
            if !value.is_string() {
                return Err(AppError::Custom("Expected string override value".into()));
            }
        },
    }
    Ok(())
}

pub(super) fn validate_instance_overrides(component: &Value, overrides: &Map<String, Value>) -> AppResult<()> {
    if overrides.is_empty() {
        return Ok(());
    }
    let Some(property_defs) = component
        .get("componentProperties")
        .and_then(Value::as_object)
    else {
        return Err(AppError::Custom(
            "Component does not declare componentProperties for overrides".into(),
        ));
    };
    for (key, value) in overrides {
        let definition = property_defs
            .get(key)
            .and_then(Value::as_object)
            .ok_or_else(|| AppError::Custom(format!("Unknown component property '{key}'")))?;
        validate_override_type(definition, value)
            .map_err(|err| AppError::Custom(format!("Invalid override for '{key}': {err}")))?;
    }
    Ok(())
}

pub(super) fn upsert_canvas_component_property_op(state: &AppState, args: &Value) -> AppResult<Value> {
    let path = required_str(args, "path")?;
    let node_id = required_str(args, "node_id")?;
    let property_name = required_str(args, "property_name")?;
    let property = args
        .get("property")
        .and_then(Value::as_object)
        .cloned()
        .ok_or_else(|| AppError::Custom("property must be an object".into()))?;
    let mut doc = load_canvas_json(state, path)?;
    let elements = canvas_elements_mut(&mut doc)?;
    for element in elements {
        if element_id(element) == Some(node_id) {
            let obj = element
                .as_object_mut()
                .ok_or_else(|| AppError::Custom("Canvas element is not an object".into()))?;
            obj.insert("kind".into(), Value::String("component".into()));
            let props = obj
                .entry("componentProperties")
                .or_insert_with(|| Value::Object(Map::new()))
                .as_object_mut()
                .ok_or_else(|| AppError::Custom("componentProperties must be an object".into()))?;
            props.insert(property_name.to_string(), Value::Object(property.clone()));
            save_canvas_json(state, path, &doc)?;
            return Ok(serde_json::json!({
                "path": path,
                "nodeId": node_id,
                "propertyName": property_name,
                "property": property
            }));
        }
    }
    Err(AppError::Custom(format!(
        "Component node '{node_id}' not found in {path}"
    )))
}

pub(super) fn list_canvas_component_properties_op(
    state: &AppState,
    path: &str,
    node_id: &str,
) -> AppResult<Value> {
    let doc = load_canvas_json(state, path)?;
    let elements = canvas_elements(&doc)?;
    let component = elements
        .iter()
        .find(|element| element_id(element) == Some(node_id))
        .ok_or_else(|| {
            AppError::Custom(format!("Component node '{node_id}' not found in {path}"))
        })?;
    let properties = component
        .get("componentProperties")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    Ok(serde_json::json!({
        "path": path,
        "nodeId": node_id,
        "count": properties.len(),
        "properties": properties
    }))
}

pub(super) fn set_canvas_instance_overrides_op(state: &AppState, args: &Value) -> AppResult<Value> {
    let path = required_str(args, "path")?;
    let instance_id = required_str(args, "instance_id")?;
    let overrides = args
        .get("overrides")
        .and_then(Value::as_object)
        .cloned()
        .ok_or_else(|| AppError::Custom("overrides must be an object".into()))?;
    let mut doc = load_canvas_json(state, path)?;
    let component_id = {
        let elements = canvas_elements(&doc)?;
        elements
            .iter()
            .find(|element| element_id(element) == Some(instance_id))
            .and_then(|instance| instance.get("componentId"))
            .and_then(Value::as_str)
            .map(str::to_string)
            .ok_or_else(|| {
                AppError::Custom(format!("Instance '{instance_id}' not found in {path}"))
            })?
    };
    {
        let elements = canvas_elements(&doc)?;
        let component = elements
            .iter()
            .find(|element| element_id(element) == Some(component_id.as_str()))
            .ok_or_else(|| {
                AppError::Custom(format!("Component '{component_id}' not found in {path}"))
            })?;
        validate_instance_overrides(component, &overrides)?;
    }
    let mut found_instance = false;
    {
        let elements = canvas_elements_mut(&mut doc)?;
        for element in elements {
            if element_id(element) == Some(instance_id) {
                let obj = element
                    .as_object_mut()
                    .ok_or_else(|| AppError::Custom("Canvas element is not an object".into()))?;
                obj.insert("overrides".into(), Value::Object(overrides.clone()));
                found_instance = true;
                break;
            }
        }
    }
    if !found_instance {
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
        "componentId": component_id,
        "overrides": overrides,
        "resolvedRender": snapshot
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
    fn align_canvas_elements_updates_positions() {
        let (_tmp, state) = setup_state();
        let path = "test.canvas";
        let seed = serde_json::json!({
          "version": 1,
          "elements": [
            { "id": "a", "kind": "rect", "name": "A", "x": 10, "y": 20, "width": 100, "height": 40, "rotation": 0, "opacity": 1, "locked": false, "layerId": "default", "zIndex": 0 },
            { "id": "b", "kind": "rect", "name": "B", "x": 80, "y": 60, "width": 80, "height": 40, "rotation": 0, "opacity": 1, "locked": false, "layerId": "default", "zIndex": 1 }
          ],
          "connections": [],
          "viewport": { "x": 0, "y": 0, "zoom": 1 }
        });
        vault_service::write_note(&state, path, &serde_json::to_string_pretty(&seed).expect("seed"))
            .expect("write seed");

        align_canvas_elements_op(&state, path, &["a".into(), "b".into()], "left").expect("align");
        let changed = load_canvas_json(&state, path).expect("load changed");
        let elements = canvas_elements(&changed).expect("elements");
        let ax = elements
            .iter()
            .find(|el| element_id(el) == Some("a"))
            .and_then(|el| number_field(el, "x"));
        let bx = elements
            .iter()
            .find(|el| element_id(el) == Some("b"))
            .and_then(|el| number_field(el, "x"));
        assert_eq!(ax, Some(10.0));
        assert_eq!(bx, Some(10.0));
    }

    #[test]
    fn upsert_and_list_component_properties_round_trip() {
        let (_tmp, state) = setup_state();
        let path = "component-props.canvas";
        let seed = serde_json::json!({
          "version": 1,
          "elements": [
            { "id": "comp-1", "kind": "component", "name": "Button", "x": 0, "y": 0, "width": 120, "height": 40, "rotation": 0, "opacity": 1, "locked": false, "layerId": "default", "zIndex": 0 }
          ],
          "connections": [],
          "viewport": { "x": 0, "y": 0, "zoom": 1 }
        });
        vault_service::write_note(&state, path, &serde_json::to_string_pretty(&seed).expect("seed"))
            .expect("write seed");

        let args = serde_json::json!({
            "path": path,
            "node_id": "comp-1",
            "property_name": "size",
            "property": {
                "type": "variant",
                "default": "md",
                "options": ["sm", "md", "lg"]
            }
        });
        upsert_canvas_component_property_op(&state, &args).expect("upsert");

        let listed = list_canvas_component_properties_op(&state, path, "comp-1").expect("list");
        assert_eq!(listed.get("count").and_then(Value::as_u64), Some(1));
    }
}
