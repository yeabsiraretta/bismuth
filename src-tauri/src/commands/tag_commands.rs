//! Tag management IPC commands (FR-004)
//!
//! Collects, searches, renames, and merges tags from both YAML frontmatter
//! (`tags:` array) and inline `#tag` syntax across all vault notes.

use crate::commands::AppState;
use crate::services::FrontmatterService;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;

/// Metadata about a single tag across the vault.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagInfo {
    /// Tag name (without `#` prefix).
    pub name: String,
    /// Number of notes using this tag.
    pub count: usize,
    /// Paths of notes that contain this tag.
    pub notes: Vec<String>,
}

/// Aggregate statistics for all tags in the vault.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagStats {
    /// Total number of distinct tags.
    pub total_tags: usize,
    /// Total number of notes that have at least one tag.
    pub total_tagged_notes: usize,
    /// Full list of tags sorted by frequency (descending).
    pub tags: Vec<TagInfo>,
}

/// Scans all vault notes and aggregates tags from frontmatter arrays and inline `#tag` syntax.
///
/// Results are sorted by frequency (descending), then alphabetically.
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

/// Returns all tags in the vault, sorted by usage frequency.
///
/// # Arguments
///
/// * `_vault_path` — Unused; vault is determined from app state.
#[tauri::command]
pub async fn get_all_tags(
    state: State<'_, AppState>,
    _vault_path: String,
) -> Result<Vec<TagInfo>, String> {
    collect_tags_from_vault(&state)
}

/// Returns paths of all notes tagged with the given tag name.
///
/// # Arguments
///
/// * `tag` — Tag name to filter by (without `#` prefix).
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

/// Returns aggregate tag statistics: totals and per-tag breakdowns.
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

/// Searches tags by substring match (case-insensitive).
///
/// # Arguments
///
/// * `query` — Substring to match against tag names.
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

/// Result of a rename operation with conflict info.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenameResult {
    /// Number of notes modified.
    pub notes_modified: usize,
    /// Whether the target tag already existed (merge occurred).
    pub was_merge: bool,
    /// Number of child tags that were also renamed.
    pub children_renamed: usize,
}

/// Renames a tag across all notes in the vault.
///
/// Updates both frontmatter `tags:` arrays and inline `#tag` occurrences.
/// Also propagates to child tags (e.g. renaming `parent` also renames `parent/child`
/// to `newparent/child`). Detects when target tag already exists (merge).
///
/// # Arguments
///
/// * `old_name` — Current tag name.
/// * `new_name` — Replacement tag name.
#[tauri::command]
pub async fn rename_tag(
    state: State<'_, AppState>,
    old_name: String,
    new_name: String,
) -> Result<RenameResult, String> {
    let service = state.vault_service.lock().unwrap();
    let notes = service.scan().map_err(|e| format!("Failed to scan: {}", e))?;

    // Detect merge: check if new_name already exists
    let mut was_merge = false;
    let mut children_renamed: usize = 0;
    let old_prefix = format!("{}/", old_name);
    let new_prefix = format!("{}/", new_name);

    for note in &notes {
        if let Some(tags_val) = note.frontmatter.get("tags") {
            if let Some(arr) = tags_val.as_array() {
                if arr.iter().any(|t| t.as_str() == Some(&new_name)) {
                    was_merge = true;
                    break;
                }
            }
        }
        if note.content.contains(&format!("#{}", new_name)) {
            was_merge = true;
            break;
        }
    }

    let mut notes_modified: usize = 0;

    for note in &notes {
        let mut modified = false;
        let (mut frontmatter, body) = FrontmatterService::parse(&note.content)
            .map_err(|e| format!("Parse error: {}", e))?;

        // Update frontmatter tags array (exact match + child tags)
        if let Some(tags_val) = frontmatter.get_mut("tags") {
            if let Some(arr) = tags_val.as_array_mut() {
                for item in arr.iter_mut() {
                    if let Some(tag_str) = item.as_str().map(|s| s.to_string()) {
                        if tag_str == old_name {
                            *item = serde_json::Value::String(new_name.clone());
                            modified = true;
                        } else if tag_str.starts_with(&old_prefix) {
                            // Child tag: parent/child → newparent/child
                            let suffix = &tag_str[old_prefix.len()..];
                            *item = serde_json::Value::String(format!("{}{}", new_prefix, suffix));
                            modified = true;
                            children_renamed += 1;
                        }
                    }
                }
            }
        }

        // Update inline #tags in body (exact + children)
        let mut new_body = body.replace(
            &format!("#{}", old_name),
            &format!("#{}", new_name),
        );
        // Also replace child tags: #parent/child → #newparent/child
        let inline_old_prefix = format!("#{}", old_prefix);
        let inline_new_prefix = format!("#{}", new_prefix);
        if new_body.contains(&inline_old_prefix) {
            new_body = new_body.replace(&inline_old_prefix, &inline_new_prefix);
            children_renamed += 1;
        }
        let body_modified = new_body != body;

        if modified || body_modified {
            let new_content = FrontmatterService::serialize(
                &frontmatter,
                if body_modified { &new_body } else { &body },
            ).map_err(|e| format!("Serialize error: {}", e))?;

            service.write_note(&note.path, &new_content)
                .map_err(|e| format!("Write error: {}", e))?;
            notes_modified += 1;
        }
    }

    Ok(RenameResult {
        notes_modified,
        was_merge,
        children_renamed,
    })
}

/// Merges a source tag into a target tag (equivalent to renaming source → target).
///
/// # Arguments
///
/// * `source_tag` — Tag to eliminate.
/// * `target_tag` — Tag to absorb the source's notes.
#[tauri::command]
pub async fn merge_tags(
    state: State<'_, AppState>,
    source_tag: String,
    target_tag: String,
) -> Result<RenameResult, String> {
    rename_tag(state, source_tag, target_tag).await
}

/// Returns a random note path from notes tagged with the given tag.
///
/// # Arguments
///
/// * `tag` — Tag name to filter by (without `#` prefix).
#[tauri::command]
pub async fn get_random_note_with_tag(
    state: State<'_, AppState>,
    tag: String,
) -> Result<String, String> {
    let tags = collect_tags_from_vault(&state)?;
    let tag_info = tags
        .into_iter()
        .find(|t| t.name == tag)
        .ok_or_else(|| format!("Tag '{}' not found", tag))?;

    if tag_info.notes.is_empty() {
        return Err(format!("No notes with tag '{}'", tag));
    }

    use std::time::{SystemTime, UNIX_EPOCH};
    let seed = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .subsec_nanos() as usize;
    let idx = seed % tag_info.notes.len();
    Ok(tag_info.notes[idx].clone())
}
