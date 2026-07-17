use super::*;

pub(crate) fn publish_canvas_design_library_op(state: &AppState, args: &Value) -> AppResult<Value> {
    let path = required_str(args, "path")?;
    let library_name = required_str(args, "library_name")?;
    let version = required_str(args, "version")?;
    let selected_component_ids: Vec<String> = optional_string_list(args, "component_ids");
    let selected_set: Option<std::collections::HashSet<&str>> = if selected_component_ids.is_empty()
    {
        None
    } else {
        Some(selected_component_ids.iter().map(String::as_str).collect())
    };

    let mut doc = load_canvas_json(state, path)?;
    let elements = canvas_elements(&doc)?;
    let components: Vec<Value> = elements
        .iter()
        .filter(|el| el.get("kind").and_then(Value::as_str) == Some("component"))
        .filter(|el| {
            selected_set
                .as_ref()
                .map(|set| set.contains(element_id(el).unwrap_or_default()))
                .unwrap_or(true)
        })
        .cloned()
        .collect();
    let component_ids: Vec<String> = components
        .iter()
        .filter_map(|el| element_id(el).map(str::to_string))
        .collect();
    let component_set: std::collections::HashSet<&str> =
        component_ids.iter().map(String::as_str).collect();

    if component_ids.is_empty() {
        return Err(AppError::Custom(format!(
            "No component contracts selected for publish in {path}"
        )));
    }

    let variant_sets: Vec<Value> = root_array(&doc, "variantSets")
        .into_iter()
        .filter(|set| {
            set.get("componentIds")
                .and_then(Value::as_array)
                .map(|ids| {
                    ids.iter()
                        .filter_map(Value::as_str)
                        .any(|id| component_set.contains(id))
                })
                .unwrap_or(false)
        })
        .collect();
    let code_connect: Vec<Value> = root_array(&doc, "codeConnect")
        .into_iter()
        .filter(|entry| {
            entry
                .get("nodeId")
                .and_then(Value::as_str)
                .map(|id| component_set.contains(id))
                .unwrap_or(false)
        })
        .collect();
    let release = serde_json::json!({
        "id": format!("{library_name}:{version}"),
        "libraryName": library_name,
        "version": version,
        "publishedAt": now_millis(),
        "componentIds": component_ids,
        "components": components,
        "variantSets": variant_sets,
        "sharedStyles": root_array(&doc, "sharedStyles"),
        "designTokens": root_array(&doc, "designTokens"),
        "codeConnect": code_connect
    });

    let releases = root_array_mut(&mut doc, "designLibraryReleases")?;
    if let Some(existing) = releases.iter_mut().find(|entry| {
        entry.get("libraryName").and_then(Value::as_str) == Some(library_name)
            && entry.get("version").and_then(Value::as_str) == Some(version)
    }) {
        *existing = release.clone();
    } else {
        releases.push(release.clone());
    }

    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({
        "path": path,
        "libraryName": library_name,
        "version": version,
        "release": release
    }))
}

pub(crate) fn list_canvas_design_library_versions_op(
    state: &AppState,
    path: &str,
    library_name: Option<&str>,
) -> AppResult<Value> {
    let doc = load_canvas_json(state, path)?;
    let releases = root_array(&doc, "designLibraryReleases");
    let filtered: Vec<Value> = releases
        .into_iter()
        .filter(|entry| {
            library_name
                .map(|name| entry.get("libraryName").and_then(Value::as_str) == Some(name))
                .unwrap_or(true)
        })
        .map(|entry| {
            serde_json::json!({
                "id": entry.get("id").cloned().unwrap_or(Value::Null),
                "libraryName": entry.get("libraryName").cloned().unwrap_or(Value::Null),
                "version": entry.get("version").cloned().unwrap_or(Value::Null),
                "publishedAt": entry.get("publishedAt").cloned().unwrap_or(Value::Null),
                "componentCount": entry.get("componentIds").and_then(Value::as_array).map(|ids| ids.len()).unwrap_or(0)
            })
        })
        .collect();
    Ok(serde_json::json!({
        "path": path,
        "count": filtered.len(),
        "versions": filtered
    }))
}

pub(crate) fn restore_canvas_design_library_version_op(
    state: &AppState,
    args: &Value,
) -> AppResult<Value> {
    let path = required_str(args, "path")?;
    let library_name = required_str(args, "library_name")?;
    let version = required_str(args, "version")?;
    let merge_mode = args
        .get("merge_mode")
        .and_then(Value::as_str)
        .unwrap_or("merge");
    if merge_mode != "merge" && merge_mode != "replace" {
        return Err(AppError::Custom(
            "merge_mode must be one of: merge, replace".into(),
        ));
    }

    let mut doc = load_canvas_json(state, path)?;
    let releases = root_array(&doc, "designLibraryReleases");
    let release = releases
        .iter()
        .find(|entry| {
            entry.get("libraryName").and_then(Value::as_str) == Some(library_name)
                && entry.get("version").and_then(Value::as_str) == Some(version)
        })
        .cloned()
        .ok_or_else(|| {
            AppError::Custom(format!(
                "Design library release '{library_name}@{version}' not found in {path}"
            ))
        })?;

    let release_components = release
        .get("components")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let release_component_ids: std::collections::HashSet<&str> =
        release_components.iter().filter_map(element_id).collect();
    {
        let elements = canvas_elements_mut(&mut doc)?;
        elements.retain(|el| {
            if el.get("kind").and_then(Value::as_str) != Some("component") {
                return true;
            }
            let id = element_id(el).unwrap_or_default();
            if merge_mode == "replace" {
                !release_component_ids.contains(id)
            } else {
                !release_component_ids.contains(id)
            }
        });
        elements.extend(release_components.clone());
    }

    let release_variant_sets = release
        .get("variantSets")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let release_styles = release
        .get("sharedStyles")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let release_tokens = release
        .get("designTokens")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let release_code_connect = release
        .get("codeConnect")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();

    if merge_mode == "replace" {
        *root_array_mut(&mut doc, "variantSets")? = release_variant_sets.clone();
        *root_array_mut(&mut doc, "sharedStyles")? = release_styles.clone();
        *root_array_mut(&mut doc, "designTokens")? = release_tokens.clone();
        *root_array_mut(&mut doc, "codeConnect")? = release_code_connect.clone();
    } else {
        upsert_entries_by_id(
            root_array_mut(&mut doc, "variantSets")?,
            &release_variant_sets,
        );
        upsert_entries_by_id(root_array_mut(&mut doc, "sharedStyles")?, &release_styles);
        upsert_entries_by_id(root_array_mut(&mut doc, "designTokens")?, &release_tokens);
        upsert_entries_by_id(
            root_array_mut(&mut doc, "codeConnect")?,
            &release_code_connect,
        );
    }

    save_canvas_json(state, path, &doc)?;
    Ok(serde_json::json!({
        "path": path,
        "libraryName": library_name,
        "version": version,
        "mergeMode": merge_mode,
        "restoredComponents": release_component_ids.len()
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
    fn publish_and_restore_canvas_design_library_version_restores_tokens() {
        let (_tmp, state) = setup_state();
        let path = "design-library.canvas";
        let seed = serde_json::json!({
          "version": 1,
          "elements": [
            { "id": "comp-1", "kind": "component", "name": "Button", "x": 0, "y": 0, "width": 120, "height": 40, "rotation": 0, "opacity": 1, "locked": false, "layerId": "default", "zIndex": 0 }
          ],
          "connections": [],
          "viewport": { "x": 0, "y": 0, "zoom": 1 },
          "designTokens": [{ "id": "colors.primary:default", "collection": "colors", "name": "primary", "kind": "color", "mode": "default", "value": "#ffffff" }],
          "sharedStyles": [],
          "variantSets": [],
          "codeConnect": []
        });
        vault_service::write_note(&state, path, &serde_json::to_string_pretty(&seed).expect("seed"))
            .expect("write seed");

        let publish_args = serde_json::json!({
            "path": path,
            "library_name": "core-ui",
            "version": "1.0.0"
        });
        publish_canvas_design_library_op(&state, &publish_args).expect("publish");

        let mutate_doc = serde_json::json!({
          "version": 1,
          "elements": seed["elements"],
          "connections": [],
          "viewport": { "x": 0, "y": 0, "zoom": 1 },
          "designTokens": [{ "id": "colors.primary:default", "collection": "colors", "name": "primary", "kind": "color", "mode": "default", "value": "#000000" }],
          "sharedStyles": [],
          "variantSets": [],
          "codeConnect": [],
          "designLibraryReleases": root_array(&load_canvas_json(&state, path).expect("load"), "designLibraryReleases")
        });
        save_canvas_json(&state, path, &mutate_doc).expect("mutate");

        let restore_args = serde_json::json!({
          "path": path,
          "library_name": "core-ui",
          "version": "1.0.0",
          "merge_mode": "merge"
        });
        restore_canvas_design_library_version_op(&state, &restore_args).expect("restore");

        let doc = load_canvas_json(&state, path).expect("load final");
        let token = root_array(&doc, "designTokens")
            .into_iter()
            .find(|entry| entry.get("id").and_then(Value::as_str) == Some("colors.primary:default"))
            .expect("token");
        assert_eq!(token.get("value").and_then(Value::as_str), Some("#ffffff"));
    }
}
