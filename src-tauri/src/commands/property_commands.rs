use crate::commands::AppState;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertyInfo {
    pub key: String,
    pub values: Vec<String>,
    pub count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertyValue {
    pub value: String,
    pub count: usize,
    pub notes: Vec<String>,
}

/// Excluded frontmatter keys that aren't user-meaningful properties
const EXCLUDED_KEYS: &[&str] = &["title", "content"];

/// Scan vault and collect all frontmatter properties
fn collect_properties(state: &State<'_, AppState>) -> Result<Vec<PropertyInfo>, String> {
    let service = state.vault_service.lock().unwrap();
    let notes = service.scan().map_err(|e| format!("Failed to scan vault: {}", e))?;

    let mut prop_map: HashMap<String, HashMap<String, Vec<String>>> = HashMap::new();

    for note in &notes {
        let path_str = note.path.to_string_lossy().to_string();
        for (key, value) in &note.frontmatter {
            if EXCLUDED_KEYS.contains(&key.as_str()) {
                continue;
            }
            let val_str = match value {
                serde_json::Value::String(s) => s.clone(),
                serde_json::Value::Bool(b) => b.to_string(),
                serde_json::Value::Number(n) => n.to_string(),
                serde_json::Value::Array(arr) => arr
                    .iter()
                    .filter_map(|v| v.as_str().map(String::from))
                    .collect::<Vec<_>>()
                    .join(", "),
                _ => continue,
            };

            prop_map
                .entry(key.clone())
                .or_default()
                .entry(val_str)
                .or_default()
                .push(path_str.clone());
        }
    }

    let mut properties: Vec<PropertyInfo> = prop_map
        .into_iter()
        .map(|(key, values_map)| {
            let count = values_map.values().map(|v| v.len()).sum();
            let values: Vec<String> = values_map.keys().cloned().collect();
            PropertyInfo { key, values, count }
        })
        .collect();

    properties.sort_by(|a, b| b.count.cmp(&a.count).then(a.key.cmp(&b.key)));
    Ok(properties)
}

/// Get all frontmatter properties from the vault
#[tauri::command]
pub async fn get_all_properties(
    state: State<'_, AppState>,
    _vault_path: String,
) -> Result<Vec<PropertyInfo>, String> {
    collect_properties(&state)
}

/// Get values for a specific property key
#[tauri::command]
pub async fn get_property_values(
    state: State<'_, AppState>,
    key: String,
    _vault_path: String,
) -> Result<Vec<PropertyValue>, String> {
    let service = state.vault_service.lock().unwrap();
    let notes = service.scan().map_err(|e| format!("Failed to scan: {}", e))?;

    let mut value_map: HashMap<String, Vec<String>> = HashMap::new();

    for note in &notes {
        if let Some(val) = note.frontmatter.get(&key) {
            let path_str = note.path.to_string_lossy().to_string();
            let val_str = match val {
                serde_json::Value::String(s) => s.clone(),
                serde_json::Value::Bool(b) => b.to_string(),
                serde_json::Value::Number(n) => n.to_string(),
                _ => continue,
            };
            value_map.entry(val_str).or_default().push(path_str);
        }
    }

    let mut values: Vec<PropertyValue> = value_map
        .into_iter()
        .map(|(value, notes)| PropertyValue {
            count: notes.len(),
            value,
            notes,
        })
        .collect();

    values.sort_by(|a, b| b.count.cmp(&a.count));
    Ok(values)
}

/// Get notes by property filter
#[tauri::command]
pub async fn get_notes_by_property(
    state: State<'_, AppState>,
    key: String,
    value: String,
    _vault_path: String,
) -> Result<Vec<String>, String> {
    let service = state.vault_service.lock().unwrap();
    let notes = service.scan().map_err(|e| format!("Failed to scan: {}", e))?;

    let matching: Vec<String> = notes
        .iter()
        .filter(|n| {
            n.frontmatter.get(&key).map_or(false, |v| {
                match v {
                    serde_json::Value::String(s) => s == &value,
                    serde_json::Value::Bool(b) => b.to_string() == value,
                    serde_json::Value::Number(n) => n.to_string() == value,
                    _ => false,
                }
            })
        })
        .map(|n| n.path.to_string_lossy().to_string())
        .collect();

    Ok(matching)
}

/// Search properties by key or value
#[tauri::command]
pub async fn search_properties(
    state: State<'_, AppState>,
    query: String,
    _vault_path: String,
) -> Result<Vec<PropertyInfo>, String> {
    let properties = collect_properties(&state)?;
    let lower = query.to_lowercase();
    Ok(properties
        .into_iter()
        .filter(|p| {
            p.key.to_lowercase().contains(&lower)
                || p.values.iter().any(|v| v.to_lowercase().contains(&lower))
        })
        .collect())
}
