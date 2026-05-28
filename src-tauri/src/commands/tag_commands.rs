use crate::commands::AppState;
use crate::services::FrontmatterService;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagInfo {
    pub name: String,
    pub count: usize,
    pub notes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagStats {
    pub total_tags: usize,
    pub total_tagged_notes: usize,
    pub tags: Vec<TagInfo>,
}

/// Scan all notes and collect tags from frontmatter and inline #tags
fn collect_tags_from_vault(state: &State<'_, AppState>) -> Result<Vec<TagInfo>, String> {
    let service = state.vault_service.lock().unwrap();
    let notes = service.scan().map_err(|e| format!("Failed to scan vault: {}", e))?;

    let mut tag_map: HashMap<String, Vec<String>> = HashMap::new();

    for note in &notes {
        let path_str = note.path.to_string_lossy().to_string();

        // Tags from frontmatter
        if let Some(tags_val) = note.frontmatter.get("tags") {
            if let Some(arr) = tags_val.as_array() {
                for tag in arr {
                    if let Some(name) = tag.as_str() {
                        tag_map.entry(name.to_string()).or_default().push(path_str.clone());
                    }
                }
            }
        }

        // Inline #tags from content
        let re = regex::Regex::new(r"#([a-zA-Z0-9_/\-]+)").unwrap();
        for cap in re.captures_iter(&note.content) {
            let name = cap[1].to_string();
            tag_map.entry(name).or_default().push(path_str.clone());
        }
    }

    let mut tags: Vec<TagInfo> = tag_map
        .into_iter()
        .map(|(name, notes)| TagInfo {
            count: notes.len(),
            name,
            notes,
        })
        .collect();

    tags.sort_by(|a, b| b.count.cmp(&a.count).then(a.name.cmp(&b.name)));
    Ok(tags)
}

/// Get all tags from the vault
#[tauri::command]
pub async fn get_all_tags(
    state: State<'_, AppState>,
    _vault_path: String,
) -> Result<Vec<TagInfo>, String> {
    collect_tags_from_vault(&state)
}

/// Get notes for a specific tag
#[tauri::command]
pub async fn get_notes_by_tag(
    state: State<'_, AppState>,
    tag: String,
    _vault_path: String,
) -> Result<Vec<String>, String> {
    let tags = collect_tags_from_vault(&state)?;
    Ok(tags
        .into_iter()
        .find(|t| t.name == tag)
        .map(|t| t.notes)
        .unwrap_or_default())
}

/// Get tag statistics
#[tauri::command]
pub async fn get_tag_stats(
    state: State<'_, AppState>,
    _vault_path: String,
) -> Result<TagStats, String> {
    let tags = collect_tags_from_vault(&state)?;
    let total_tags = tags.len();
    let total_tagged_notes = tags.iter().flat_map(|t| &t.notes).collect::<std::collections::HashSet<_>>().len();

    Ok(TagStats {
        total_tags,
        total_tagged_notes,
        tags,
    })
}

/// Search tags by prefix
#[tauri::command]
pub async fn search_tags(
    state: State<'_, AppState>,
    query: String,
    _vault_path: String,
) -> Result<Vec<TagInfo>, String> {
    let tags = collect_tags_from_vault(&state)?;
    let lower = query.to_lowercase();
    Ok(tags
        .into_iter()
        .filter(|t| t.name.to_lowercase().contains(&lower))
        .collect())
}

/// Rename a tag across all notes in the vault
#[tauri::command]
pub async fn rename_tag(
    state: State<'_, AppState>,
    old_name: String,
    new_name: String,
) -> Result<(), String> {
    let service = state.vault_service.lock().unwrap();
    let notes = service.scan().map_err(|e| format!("Failed to scan: {}", e))?;

    for note in &notes {
        let mut modified = false;
        let (mut frontmatter, body) = FrontmatterService::parse(&note.content)
            .map_err(|e| format!("Parse error: {}", e))?;

        // Update frontmatter tags array
        if let Some(tags_val) = frontmatter.get_mut("tags") {
            if let Some(arr) = tags_val.as_array_mut() {
                for item in arr.iter_mut() {
                    if item.as_str() == Some(&old_name) {
                        *item = serde_json::Value::String(new_name.clone());
                        modified = true;
                    }
                }
            }
        }

        // Update inline #tags in body
        let new_body = body.replace(
            &format!("#{}", old_name),
            &format!("#{}", new_name),
        );
        let body_modified = new_body != body;

        if modified || body_modified {
            let new_content = FrontmatterService::serialize(
                &frontmatter,
                if body_modified { &new_body } else { &body },
            ).map_err(|e| format!("Serialize error: {}", e))?;

            service.write_note(&note.path, &new_content)
                .map_err(|e| format!("Write error: {}", e))?;
        }
    }

    Ok(())
}

/// Merge source tag into target tag (rename source → target)
#[tauri::command]
pub async fn merge_tags(
    state: State<'_, AppState>,
    source_tag: String,
    target_tag: String,
) -> Result<(), String> {
    // Merging is equivalent to renaming source → target
    rename_tag(state, source_tag, target_tag).await
}
