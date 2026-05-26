use serde::{Deserialize, Serialize};

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

/// Get all frontmatter properties from the vault
/// TODO: Implement when FrontmatterService is integrated
#[tauri::command]
pub async fn get_all_properties(
    _vault_path: String,
) -> Result<Vec<PropertyInfo>, String> {
    Ok(vec![])
}

/// Get values for a specific property key
/// TODO: Implement when FrontmatterService is integrated
#[tauri::command]
pub async fn get_property_values(
    _key: String,
    _vault_path: String,
) -> Result<Vec<PropertyValue>, String> {
    Ok(vec![])
}

/// Get notes by property filter
/// TODO: Implement when FrontmatterService is integrated
#[tauri::command]
pub async fn get_notes_by_property(
    _key: String,
    _value: String,
    _vault_path: String,
) -> Result<Vec<String>, String> {
    Ok(vec![])
}

/// Search properties by key or value
/// TODO: Implement when FrontmatterService is integrated
#[tauri::command]
pub async fn search_properties(
    _query: String,
    _vault_path: String,
) -> Result<Vec<PropertyInfo>, String> {
    Ok(vec![])
}
