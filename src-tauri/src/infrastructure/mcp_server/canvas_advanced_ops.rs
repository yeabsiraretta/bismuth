use super::*;

mod canvas_design_library_ops;
pub(super) use canvas_design_library_ops::{
    list_canvas_design_library_versions_op, publish_canvas_design_library_op,
    restore_canvas_design_library_version_op,
};

pub(super) fn constraint_preset_payload(preset: &str) -> AppResult<Value> {
    let payload = match preset {
        "fixed" => serde_json::json!({
            "preset": "fixed",
            "horizontal": "left",
            "vertical": "top",
            "widthMode": "fixed",
            "heightMode": "fixed"
        }),
        "scale" => serde_json::json!({
            "preset": "scale",
            "horizontal": "scale",
            "vertical": "scale",
            "widthMode": "scale",
            "heightMode": "scale"
        }),
        "stretch" => serde_json::json!({
            "preset": "stretch",
            "horizontal": "left-right",
            "vertical": "top-bottom",
            "widthMode": "stretch",
            "heightMode": "stretch"
        }),
        "center" => serde_json::json!({
            "preset": "center",
            "horizontal": "center",
            "vertical": "middle",
            "widthMode": "fixed",
            "heightMode": "fixed"
        }),
        "pin-left-right" => serde_json::json!({
            "preset": "pin-left-right",
            "horizontal": "left-right",
            "vertical": "top",
            "widthMode": "stretch",
            "heightMode": "fixed"
        }),
        "pin-top-bottom" => serde_json::json!({
            "preset": "pin-top-bottom",
            "horizontal": "left",
            "vertical": "top-bottom",
            "widthMode": "fixed",
            "heightMode": "stretch"
        }),
        "fill" => serde_json::json!({
            "preset": "fill",
            "horizontal": "fill",
            "vertical": "fill",
            "widthMode": "fill",
            "heightMode": "fill"
        }),
        _ => {
            return Err(AppError::Custom(format!(
                "Unknown constraint preset '{preset}'"
            )))
        },
    };
    Ok(payload)
}

pub(super) fn set_canvas_constraint_preset_op(state: &AppState, args: &Value) -> AppResult<Value> {
    let path = required_str(args, "path")?;
    let node_id = required_str(args, "node_id")?;
    let preset = required_str(args, "preset")?;
    let payload = constraint_preset_payload(preset)?;
    let mut doc = load_canvas_json(state, path)?;
    let elements = canvas_elements_mut(&mut doc)?;
    for element in elements {
        if element_id(element) == Some(node_id) {
            let obj = element
                .as_object_mut()
                .ok_or_else(|| AppError::Custom("Canvas element is not an object".into()))?;
            obj.insert("constraints".into(), payload.clone());
            save_canvas_json(state, path, &doc)?;
            return Ok(serde_json::json!({
                "path": path,
                "nodeId": node_id,
                "constraints": payload
            }));
        }
    }
    Err(AppError::Custom(format!(
        "Canvas node '{node_id}' was not found in {path}"
    )))
}

pub(super) fn upsert_canvas_component_state_op(state: &AppState, args: &Value) -> AppResult<Value> {
    let path = required_str(args, "path")?;
    let node_id = required_str(args, "node_id")?;
    let state_name = required_str(args, "state_name")?;
    let state_payload = args
        .get("state")
        .ok_or_else(|| AppError::Custom("Missing required object argument: state".into()))?;
    if !state_payload.is_object() {
        return Err(AppError::Custom("state must be an object".into()));
    }

    let mut doc = load_canvas_json(state, path)?;
    let elements = canvas_elements_mut(&mut doc)?;
    for element in elements {
        if element_id(element) != Some(node_id) {
            continue;
        }
        if element.get("kind").and_then(Value::as_str) != Some("component") {
            return Err(AppError::Custom(format!(
                "Node '{node_id}' is not a component in {path}"
            )));
        }
        let obj = element
            .as_object_mut()
            .ok_or_else(|| AppError::Custom("Canvas element is not an object".into()))?;
        let states = obj
            .entry("interactionStates")
            .or_insert_with(|| serde_json::json!({}))
            .as_object_mut()
            .ok_or_else(|| AppError::Custom("interactionStates must be an object".into()))?;
        states.insert(state_name.to_string(), state_payload.clone());
        save_canvas_json(state, path, &doc)?;
        return Ok(serde_json::json!({
            "path": path,
            "nodeId": node_id,
            "stateName": state_name,
            "state": state_payload
        }));
    }
    Err(AppError::Custom(format!(
        "Canvas component '{node_id}' was not found in {path}"
    )))
}

pub(super) fn set_canvas_instance_state_op(state: &AppState, args: &Value) -> AppResult<Value> {
    let path = required_str(args, "path")?;
    let instance_id = required_str(args, "instance_id")?;
    let state_name = required_str(args, "state_name")?;
    let mut doc = load_canvas_json(state, path)?;

    let component_id = {
        let elements = canvas_elements(&doc)?;
        let instance = elements
            .iter()
            .find(|el| element_id(el) == Some(instance_id))
            .ok_or_else(|| {
                AppError::Custom(format!(
                    "Canvas instance '{instance_id}' was not found in {path}"
                ))
            })?;
        if instance.get("kind").and_then(Value::as_str) != Some("instance") {
            return Err(AppError::Custom(format!(
                "Node '{instance_id}' is not an instance"
            )));
        }
        instance
            .get("componentId")
            .and_then(Value::as_str)
            .ok_or_else(|| AppError::Custom("Instance is missing componentId".into()))?
            .to_string()
    };

    if state_name != "base" {
        let elements = canvas_elements(&doc)?;
        let component = elements
            .iter()
            .find(|el| element_id(el) == Some(component_id.as_str()))
            .ok_or_else(|| AppError::Custom(format!("Component '{component_id}' not found")))?;
        let has_state = component
            .get("interactionStates")
            .and_then(Value::as_object)
            .map(|states| states.contains_key(state_name))
            .unwrap_or(false);
        if !has_state {
            return Err(AppError::Custom(format!(
                "Component '{component_id}' does not define interaction state '{state_name}'"
            )));
        }
    }

    let elements = canvas_elements_mut(&mut doc)?;
    if let Some(instance) = elements
        .iter_mut()
        .find(|el| element_id(el) == Some(instance_id))
    {
        let obj = instance
            .as_object_mut()
            .ok_or_else(|| AppError::Custom("Canvas element is not an object".into()))?;
        obj.insert(
            "interactionState".into(),
            Value::String(state_name.to_string()),
        );
    }

    let snapshot = build_instance_render_snapshot(&doc, instance_id, None)?;
    update_instance_snapshot(&mut doc, instance_id, snapshot.clone())?;
    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({
        "path": path,
        "instanceId": instance_id,
        "componentId": component_id,
        "stateName": state_name,
        "resolvedRender": snapshot
    }))
}

pub(super) fn upsert_canvas_component_slot_op(state: &AppState, args: &Value) -> AppResult<Value> {
    let path = required_str(args, "path")?;
    let node_id = required_str(args, "node_id")?;
    let slot_name = required_str(args, "slot_name")?;
    let slot_payload = args
        .get("slot")
        .ok_or_else(|| AppError::Custom("Missing required object argument: slot".into()))?;
    if !slot_payload.is_object() {
        return Err(AppError::Custom("slot must be an object".into()));
    }

    let mut doc = load_canvas_json(state, path)?;
    let elements = canvas_elements_mut(&mut doc)?;
    for element in elements {
        if element_id(element) != Some(node_id) {
            continue;
        }
        if element.get("kind").and_then(Value::as_str) != Some("component") {
            return Err(AppError::Custom(format!(
                "Node '{node_id}' is not a component in {path}"
            )));
        }
        let obj = element
            .as_object_mut()
            .ok_or_else(|| AppError::Custom("Canvas element is not an object".into()))?;
        let slots = obj
            .entry("slotDefinitions")
            .or_insert_with(|| serde_json::json!({}))
            .as_object_mut()
            .ok_or_else(|| AppError::Custom("slotDefinitions must be an object".into()))?;
        slots.insert(slot_name.to_string(), slot_payload.clone());
        save_canvas_json(state, path, &doc)?;
        return Ok(serde_json::json!({
            "path": path,
            "nodeId": node_id,
            "slotName": slot_name,
            "slot": slot_payload
        }));
    }
    Err(AppError::Custom(format!(
        "Canvas component '{node_id}' was not found in {path}"
    )))
}

pub(super) fn set_canvas_instance_slots_op(state: &AppState, args: &Value) -> AppResult<Value> {
    let path = required_str(args, "path")?;
    let instance_id = required_str(args, "instance_id")?;
    let slots = args
        .get("slots")
        .and_then(Value::as_object)
        .ok_or_else(|| AppError::Custom("slots must be an object".into()))?;
    let mut doc = load_canvas_json(state, path)?;

    let (component_id, slot_definitions) = {
        let elements = canvas_elements(&doc)?;
        let instance = elements
            .iter()
            .find(|el| element_id(el) == Some(instance_id))
            .ok_or_else(|| {
                AppError::Custom(format!(
                    "Canvas instance '{instance_id}' was not found in {path}"
                ))
            })?;
        if instance.get("kind").and_then(Value::as_str) != Some("instance") {
            return Err(AppError::Custom(format!(
                "Node '{instance_id}' is not an instance"
            )));
        }
        let component_id = instance
            .get("componentId")
            .and_then(Value::as_str)
            .ok_or_else(|| AppError::Custom("Instance is missing componentId".into()))?
            .to_string();
        let component = elements
            .iter()
            .find(|el| element_id(el) == Some(component_id.as_str()))
            .ok_or_else(|| AppError::Custom(format!("Component '{component_id}' not found")))?;
        let defs = component
            .get("slotDefinitions")
            .and_then(Value::as_object)
            .cloned()
            .unwrap_or_default();
        (component_id, defs)
    };

    for key in slots.keys() {
        if !slot_definitions.contains_key(key) {
            return Err(AppError::Custom(format!(
                "Unknown slot '{key}' for component '{component_id}'"
            )));
        }
    }
    for (slot_name, def) in &slot_definitions {
        let required = def
            .get("required")
            .and_then(Value::as_bool)
            .unwrap_or(false);
        if required {
            let value = slots.get(slot_name);
            if value.is_none() || value.is_some_and(slot_value_is_empty) {
                return Err(AppError::Custom(format!(
                    "Missing required slot '{slot_name}' for component '{component_id}'"
                )));
            }
        }
    }

    let elements = canvas_elements_mut(&mut doc)?;
    if let Some(instance) = elements
        .iter_mut()
        .find(|el| element_id(el) == Some(instance_id))
    {
        let obj = instance
            .as_object_mut()
            .ok_or_else(|| AppError::Custom("Canvas element is not an object".into()))?;
        obj.insert("slots".into(), Value::Object(slots.clone()));
    }

    let snapshot = build_instance_render_snapshot(&doc, instance_id, None)?;
    update_instance_snapshot(&mut doc, instance_id, snapshot.clone())?;
    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({
        "path": path,
        "instanceId": instance_id,
        "componentId": component_id,
        "slots": slots,
        "resolvedRender": snapshot
    }))
}
