use std::fs;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

use crate::infrastructure::error::{AppError, AppResult};
use crate::infrastructure::state::AppState;
use url::Url;

use super::types::{
    BatchNoteContent, GraphDataResult, GraphEdgeResult, GraphNodeResult, NoteMeta, NoteResponse,
    SearchMatch, SearchResult, VaultResponse,
};

/// Join a relative path to the vault root, rejecting traversal attempts.
/// Returns an error if the resolved path escapes the root directory.
fn safe_join(root: &Path, rel: &str) -> AppResult<PathBuf> {
    let joined = root.join(rel);
    // Normalize by resolving `.` and `..` components without requiring the path to exist
    let mut normalized = PathBuf::new();
    for comp in joined.components() {
        match comp {
            std::path::Component::ParentDir => {
                if !normalized.pop() {
                    return Err(AppError::Custom("Path traversal rejected".into()));
                }
            }
            std::path::Component::CurDir => {}
            other => normalized.push(other),
        }
    }
    if !normalized.starts_with(root) {
        return Err(AppError::Custom(format!(
            "Path escapes vault root: {rel}"
        )));
    }
    Ok(normalized)
}

/// Derive a human-readable title from a file stem.
fn title_from_path(p: &Path) -> String {
    p.file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Untitled")
        .to_string()
}

fn normalize_note_extension(extension: Option<&str>) -> AppResult<String> {
    let normalized = extension
        .unwrap_or("md")
        .trim()
        .trim_start_matches('.')
        .to_lowercase();

    match normalized.as_str() {
        "md" | "pen" => Ok(normalized),
        _ => Err(AppError::Custom(format!(
            "Unsupported note extension: {normalized}. Allowed: md, pen"
        ))),
    }
}

fn normalize_note_folder(folder: Option<&str>, extension: &str) -> Option<String> {
    let raw = folder.unwrap_or("").trim().trim_matches('/');
    if extension != "pen" {
        return if raw.is_empty() {
            None
        } else {
            Some(raw.to_string())
        };
    }

    if raw.is_empty() {
        return Some("design".to_string());
    }

    let lowered = raw.to_lowercase();
    if lowered == "design" || lowered.starts_with("design/") {
        Some(raw.to_string())
    } else {
        Some(format!("design/{raw}"))
    }
}

fn resolve_vault_root(path: &str) -> AppResult<PathBuf> {
    fn normalize(path: PathBuf) -> PathBuf {
        path.components().collect()
    }

    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err(AppError::Custom("Vault path is required".into()));
    }
    if trimmed.starts_with("file://") {
        let url = Url::parse(trimmed)
            .map_err(|e| AppError::Custom(format!("Invalid vault file URL: {trimmed} ({e})")))?;
        return url.to_file_path().map_err(|_| {
            AppError::Custom(format!(
                "Unsupported vault file URL (cannot convert to local path): {trimmed}"
            ))
        }).map(normalize);
    }
    Ok(normalize(PathBuf::from(trimmed)))
}

/// Extract Unix-epoch millis from file metadata timestamps.
fn timestamps(meta: &fs::Metadata) -> (u64, u64) {
    let modified = meta
        .modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    let created = meta
        .created()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    (modified, created)
}

// ── Vault operations ─────────────────────────────────────────────────────────

pub(crate) fn open_vault(state: &AppState, path: &str) -> AppResult<VaultResponse> {
    let root = resolve_vault_root(path)?;
    if !root.is_dir() {
        return Err(AppError::Custom(format!(
            "Not a directory: {}",
            root.display()
        )));
    }
    let name = root
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("vault")
        .to_string();

    let mut guard = state
        .vault
        .write()
        .map_err(|e| AppError::LockPoisoned(e.to_string()))?;
    guard.path = Some(root.to_string_lossy().to_string());
    guard.name = Some(name.clone());

    tracing::info!(vault_path = %root.display(), "Vault opened");
    Ok(VaultResponse {
        name,
        root_path: root.to_string_lossy().to_string(),
    })
}

pub(crate) fn create_vault(state: &AppState, path: &str, name: &str) -> AppResult<VaultResponse> {
    let root = resolve_vault_root(path)?;
    fs::create_dir_all(&root)?;

    let mut guard = state
        .vault
        .write()
        .map_err(|e| AppError::LockPoisoned(e.to_string()))?;
    guard.path = Some(root.to_string_lossy().to_string());
    guard.name = Some(name.to_string());

    tracing::info!(vault_path = %root.display(), vault_name = name, "Vault created");
    Ok(VaultResponse {
        name: name.to_string(),
        root_path: root.to_string_lossy().to_string(),
    })
}

pub(crate) fn scan_vault(state: &AppState) -> AppResult<Vec<NoteMeta>> {
    let root = state.vault_root()?;
    let mut notes = Vec::new();
    collect_notes(&root, &root, &mut notes)?;
    Ok(notes)
}

fn collect_notes(root: &Path, dir: &Path, notes: &mut Vec<NoteMeta>) -> AppResult<()> {
    let entries = fs::read_dir(dir)?;
    for entry in entries {
        let entry = entry?;
        let path = entry.path();
        if path.is_dir() {
            let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
            if name.starts_with('.') {
                // Allow .bismuth/templates/ to be scanned for template discovery
                if name == ".bismuth" {
                    let tmpl_dir = path.join("templates");
                    if tmpl_dir.is_dir() {
                        collect_notes(root, &tmpl_dir, notes)?;
                    }
                }
                continue;
            }
            collect_notes(root, &path, notes)?;
        } else if matches!(
            path.extension().and_then(|e| e.to_str()),
            Some("md") | Some("pen") | Some("canvas")
        ) {
            let meta = fs::metadata(&path)?;
            let (modified, created) = timestamps(&meta);
            let rel = path
                .strip_prefix(root)
                .unwrap_or(&path)
                .to_string_lossy()
                .to_string();
            notes.push(NoteMeta {
                title: title_from_path(&path),
                path: rel,
                modified_at: modified,
                created_at: created,
                size: meta.len(),
            });
        }
    }
    Ok(())
}

// ── Note CRUD ────────────────────────────────────────────────────────────────

pub(crate) fn read_note(state: &AppState, rel_path: &str) -> AppResult<NoteResponse> {
    let root = state.vault_root()?;
    let full = safe_join(&root, rel_path)?;
    let content = fs::read_to_string(&full)?;
    let meta = fs::metadata(&full)?;
    let (modified, created) = timestamps(&meta);
    Ok(NoteResponse {
        path: rel_path.to_string(),
        title: title_from_path(&full),
        content,
        modified_at: modified,
        created_at: created,
    })
}

pub(crate) fn write_note(state: &AppState, rel_path: &str, content: &str) -> AppResult<()> {
    let root = state.vault_root()?;
    let full = safe_join(&root, rel_path)?;
    if let Some(parent) = full.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(&full, content)?;
    Ok(())
}

pub(crate) fn create_note(
    state: &AppState,
    title: &str,
    folder: Option<&str>,
    extension: Option<&str>,
) -> AppResult<NoteResponse> {
    let root = state.vault_root()?;
    let extension = normalize_note_extension(extension)?;
    let folder = normalize_note_folder(folder, &extension);
    let filename = format!("{title}.{extension}");
    let rel = match folder {
        Some(f) if !f.is_empty() => format!("{f}/{filename}"),
        _ => filename,
    };
    let full = root.join(&rel);

    if full.exists() {
        return Err(AppError::Custom(format!("Note already exists: {rel}")));
    }
    if let Some(parent) = full.parent() {
        fs::create_dir_all(parent)?;
    }

    let content = if extension == "md" {
        format!("# {title}\n")
    } else {
        String::new()
    };
    fs::write(&full, &content)?;

    let meta = fs::metadata(&full)?;
    let (modified, created) = timestamps(&meta);
    Ok(NoteResponse {
        path: rel,
        title: title.to_string(),
        content,
        modified_at: modified,
        created_at: created,
    })
}

pub(crate) fn delete_note(state: &AppState, rel_path: &str) -> AppResult<()> {
    let root = state.vault_root()?;
    let full = safe_join(&root, rel_path)?;
    if !full.exists() {
        return Err(AppError::Custom(format!("Note not found: {rel_path}")));
    }
    fs::remove_file(&full)?;
    Ok(())
}

pub(crate) fn rename_note(
    state: &AppState,
    old_path: &str,
    new_title: &str,
) -> AppResult<NoteResponse> {
    let root = state.vault_root()?;
    let old_full = safe_join(&root, old_path)?;
    if !old_full.exists() {
        return Err(AppError::Custom(format!("Note not found: {old_path}")));
    }

    let parent = old_full.parent().unwrap_or(&root);
    let extension = old_full
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("md");
    let new_filename = format!("{new_title}.{extension}");
    let new_full = parent.join(&new_filename);

    if new_full.exists() {
        return Err(AppError::Custom(format!(
            "A note named '{new_title}' already exists"
        )));
    }

    let content = fs::read_to_string(&old_full)?;
    fs::rename(&old_full, &new_full)?;

    let rel = new_full
        .strip_prefix(&root)
        .unwrap_or(&new_full)
        .to_string_lossy()
        .to_string();
    let meta = fs::metadata(&new_full)?;
    let (modified, created) = timestamps(&meta);

    Ok(NoteResponse {
        path: rel,
        title: new_title.to_string(),
        content,
        modified_at: modified,
        created_at: created,
    })
}

// ── Batch read (parallel content hydration) ──────────────────────────────────

/// Read multiple notes in one IPC call. Returns a vec of (path, content) pairs.
/// Files that fail to read are silently skipped.
pub(crate) fn batch_read_notes(state: &AppState, paths: &[String]) -> AppResult<Vec<BatchNoteContent>> {
    let root = state.vault_root()?;
    let results: Vec<BatchNoteContent> = paths
        .iter()
        .filter_map(|rel| {
            let full = root.join(rel);
            fs::read_to_string(&full).ok().map(|content| BatchNoteContent {
                path: rel.clone(),
                content,
            })
        })
        .collect();
    Ok(results)
}

// ── Graph data (wikilink extraction) ─────────────────────────────────────────

/// Build graph nodes + edges from vault content in Rust. Scans all notes for
/// wikilinks and resolves targets to known note paths.
pub(crate) fn build_graph_data(state: &AppState) -> AppResult<GraphDataResult> {
    use std::collections::HashMap;

    let root = state.vault_root()?;
    let mut all_notes = Vec::new();
    collect_notes(&root, &root, &mut all_notes)?;

    // Build a lookup: lowercase stem -> path
    let stem_to_path: HashMap<String, String> = all_notes
        .iter()
        .filter_map(|n| {
            let stem = Path::new(&n.path)
                .file_stem()
                .and_then(|s| s.to_str())
                .map(|s| s.to_lowercase())?;
            Some((stem, n.path.clone()))
        })
        .collect();

    use std::sync::OnceLock;
    static GRAPH_WIKILINK: OnceLock<regex::Regex> = OnceLock::new();
    let wikilink_re = GRAPH_WIKILINK.get_or_init(|| regex::Regex::new(r"\[\[([^\]|#]+)").unwrap());

    let mut nodes: Vec<GraphNodeResult> = Vec::with_capacity(all_notes.len());
    let mut edges: Vec<GraphEdgeResult> = Vec::new();

    for note in &all_notes {
        nodes.push(GraphNodeResult {
            id: note.path.clone(),
            label: note.title.clone(),
        });

        let full = root.join(&note.path);
        let content = match fs::read_to_string(&full) {
            Ok(c) => c,
            Err(_) => continue,
        };

        for cap in wikilink_re.captures_iter(&content) {
            if let Some(m) = cap.get(1) {
                let target = m.as_str().trim().to_lowercase();
                if let Some(resolved) = stem_to_path.get(&target) {
                    if resolved != &note.path {
                        edges.push(GraphEdgeResult {
                            source: note.path.clone(),
                            target: resolved.clone(),
                        });
                    }
                }
            }
        }
    }

    Ok(GraphDataResult { nodes, edges })
}

// ── Tag extraction (vault-wide) ──────────────────────────────────────────────

/// Extract all tags from the vault with counts, computed in Rust.
pub(crate) fn extract_vault_tags(state: &AppState) -> AppResult<Vec<super::stats_service::TagCount>> {
    use std::collections::HashMap;

    let root = state.vault_root()?;
    let mut all_notes = Vec::new();
    collect_notes(&root, &root, &mut all_notes)?;
    let mut tag_map: HashMap<String, usize> = HashMap::new();

    for note in &all_notes {
        let full = root.join(&note.path);
        if let Ok(content) = fs::read_to_string(&full) {
            let tags = super::stats_service::extract_tags(&content);
            for t in tags {
                *tag_map.entry(t).or_insert(0) += 1;
            }
        }
    }

    let mut result: Vec<super::stats_service::TagCount> = tag_map
        .into_iter()
        .map(|(tag, count)| super::stats_service::TagCount { tag, count })
        .collect();
    result.sort_by(|a, b| b.count.cmp(&a.count));
    Ok(result)
}

// ── Search ───────────────────────────────────────────────────────────────────

pub(crate) fn search_vault(state: &AppState, query: &str) -> AppResult<Vec<SearchResult>> {
    let root = state.vault_root()?;
    let mut notes = Vec::new();
    collect_notes(&root, &root, &mut notes)?;
    let query_lower = query.to_lowercase();
    let mut results = Vec::new();

    for note in &notes {
        let full = root.join(&note.path);
        let content = match fs::read_to_string(&full) {
            Ok(c) => c,
            Err(_) => continue,
        };

        let mut matches = Vec::new();
        let query_lower_len = query_lower.chars().count();
        for (i, line) in content.lines().enumerate() {
            let line_lower = line.to_lowercase();
            let mut char_offset = 0;
            let mut byte_offset = 0;
            while byte_offset < line_lower.len() {
                if let Some(pos) = line_lower[byte_offset..].find(&query_lower) {
                    // Convert byte position to char position
                    let chars_before = line_lower[byte_offset..byte_offset + pos].chars().count();
                    let match_char_start = char_offset + chars_before;
                    matches.push(SearchMatch {
                        line_number: i + 1,
                        line_content: line.to_string(),
                        match_start: match_char_start,
                        match_end: match_char_start + query_lower_len,
                    });
                    let match_byte_len = line_lower[byte_offset + pos..]
                        .char_indices()
                        .nth(query_lower_len)
                        .map(|(i, _)| i)
                        .unwrap_or(line_lower.len() - byte_offset - pos);
                    char_offset = match_char_start + query_lower_len;
                    byte_offset = byte_offset + pos + match_byte_len;
                } else {
                    break;
                }
            }
        }

        if !matches.is_empty() {
            let score = matches.len() as f64;
            results.push(SearchResult {
                path: note.path.clone(),
                title: note.title.clone(),
                matches,
                score,
            });
        }
    }

    results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    fn setup() -> (TempDir, AppState) {
        let tmp = TempDir::new().unwrap();
        let state = AppState::default();
        {
            let mut guard = state.vault.write().unwrap();
            guard.path = Some(tmp.path().to_string_lossy().to_string());
            guard.name = Some("test-vault".to_string());
        }
        (tmp, state)
    }

    #[test]
    fn scan_empty_vault() {
        let (_tmp, state) = setup();
        let notes = scan_vault(&state).unwrap();
        assert!(notes.is_empty());
    }

    #[test]
    fn create_and_read_note() {
        let (_tmp, state) = setup();
        let created = create_note(&state, "Hello", None, None).unwrap();
        assert_eq!(created.title, "Hello");
        assert!(created.content.contains("# Hello"));

        let read = read_note(&state, &created.path).unwrap();
        assert_eq!(read.content, created.content);
    }

    #[test]
    fn write_and_read_note() {
        let (tmp, state) = setup();
        fs::write(tmp.path().join("test.md"), "initial").unwrap();
        write_note(&state, "test.md", "updated").unwrap();
        let note = read_note(&state, "test.md").unwrap();
        assert_eq!(note.content, "updated");
    }

    #[test]
    fn delete_note_removes_file() {
        let (_tmp, state) = setup();
        create_note(&state, "Removable", None, None).unwrap();
        assert!(delete_note(&state, "Removable.md").is_ok());
        assert!(read_note(&state, "Removable.md").is_err());
    }

    #[test]
    fn rename_note_updates_path() {
        let (_tmp, state) = setup();
        create_note(&state, "OldName", None, None).unwrap();
        let renamed = rename_note(&state, "OldName.md", "NewName").unwrap();
        assert_eq!(renamed.title, "NewName");
        assert!(renamed.path.contains("NewName.md"));
        assert!(read_note(&state, "OldName.md").is_err());
    }

    #[test]
    fn search_finds_matches() {
        let (_tmp, state) = setup();
        create_note(&state, "Searchable", None, None).unwrap();
        write_note(&state, "Searchable.md", "# Searchable\nfoo bar baz\nfoo again").unwrap();
        let results = search_vault(&state, "foo").unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].matches.len(), 2);
    }

    #[test]
    fn scan_finds_created_notes() {
        let (_tmp, state) = setup();
        create_note(&state, "Note1", None, None).unwrap();
        create_note(&state, "Note2", Some("subfolder"), None).unwrap();
        let notes = scan_vault(&state).unwrap();
        assert_eq!(notes.len(), 2);
    }

    #[test]
    fn batch_read_returns_contents() {
        let (_tmp, state) = setup();
        create_note(&state, "Alpha", None, None).unwrap();
        write_note(&state, "Alpha.md", "alpha content").unwrap();
        create_note(&state, "Beta", None, None).unwrap();
        write_note(&state, "Beta.md", "beta content").unwrap();

        let result = batch_read_notes(
            &state,
            &["Alpha.md".to_string(), "Beta.md".to_string(), "Missing.md".to_string()],
        )
        .unwrap();
        assert_eq!(result.len(), 2);
        assert!(result.iter().any(|r| r.path == "Alpha.md" && r.content == "alpha content"));
        assert!(result.iter().any(|r| r.path == "Beta.md" && r.content == "beta content"));
    }

    #[test]
    fn build_graph_extracts_links() {
        let (_tmp, state) = setup();
        create_note(&state, "PageA", None, None).unwrap();
        write_note(&state, "PageA.md", "# A\nSee [[PageB]] for details").unwrap();
        create_note(&state, "PageB", None, None).unwrap();
        write_note(&state, "PageB.md", "# B\nNothing here").unwrap();

        let graph = build_graph_data(&state).unwrap();
        assert_eq!(graph.nodes.len(), 2);
        assert_eq!(graph.edges.len(), 1);
        assert_eq!(graph.edges[0].source, "PageA.md");
        assert_eq!(graph.edges[0].target, "PageB.md");
    }

    #[test]
    fn scan_includes_bismuth_templates() {
        let (_tmp, state) = setup();
        let root = state.vault_root().unwrap();
        let tmpl_dir = root.join(".bismuth").join("templates");
        fs::create_dir_all(&tmpl_dir).unwrap();
        fs::write(tmpl_dir.join("daily.md"), "# {{date.today}}").unwrap();
        fs::write(tmpl_dir.join("meeting.md"), "# Meeting Notes").unwrap();
        // Also create a regular note
        create_note(&state, "Regular", None, None).unwrap();
        let notes = scan_vault(&state).unwrap();
        assert_eq!(notes.len(), 3);
        assert!(notes.iter().any(|n| n.path.contains("daily.md")));
        assert!(notes.iter().any(|n| n.path.contains("meeting.md")));
    }

    #[test]
    fn extract_vault_tags_counts() {
        let (_tmp, state) = setup();
        create_note(&state, "Tagged", None, None).unwrap();
        write_note(&state, "Tagged.md", "# Tagged\n#rust #programming\n#rust again").unwrap();

        let tags = extract_vault_tags(&state).unwrap();
        let rust_tag = tags.iter().find(|t| t.tag == "rust");
        assert!(rust_tag.is_some());
        assert_eq!(rust_tag.unwrap().count, 2);
    }

    #[test]
    fn create_pen_note_and_scan() {
        let (_tmp, state) = setup();
        let created = create_note(&state, "Sketch", Some("Ink"), Some("pen")).unwrap();
        assert_eq!(created.path, "design/Ink/Sketch.pen");
        let notes = scan_vault(&state).unwrap();
        assert!(notes.iter().any(|n| n.path == "design/Ink/Sketch.pen"));
    }

    #[test]
    fn rename_pen_note_keeps_extension() {
        let (_tmp, state) = setup();
        create_note(&state, "Draft", None, Some("pen")).unwrap();
        let renamed = rename_note(&state, "design/Draft.pen", "Final").unwrap();
        assert_eq!(renamed.path, "design/Final.pen");
        assert!(read_note(&state, "design/Final.pen").is_ok());
        assert!(read_note(&state, "design/Draft.pen").is_err());
    }

    #[test]
    fn create_pen_note_in_design_root_when_folder_missing() {
        let (_tmp, state) = setup();
        let created = create_note(&state, "Wireframe", None, Some("pen")).unwrap();
        assert_eq!(created.path, "design/Wireframe.pen");
    }

    #[test]
    fn create_pen_note_keeps_design_prefix_if_explicit() {
        let (_tmp, state) = setup();
        let created = create_note(&state, "Flow", Some("design/UX"), Some("pen")).unwrap();
        assert_eq!(created.path, "design/UX/Flow.pen");
    }

    #[test]
    fn reject_unsupported_extension() {
        let (_tmp, state) = setup();
        let err = create_note(&state, "Bad", None, Some("txt")).unwrap_err();
        assert!(err.to_string().contains("Unsupported note extension"));
    }

    #[test]
    fn open_vault_accepts_file_url() {
        let (tmp, state) = setup();
        let uri = Url::from_directory_path(tmp.path()).unwrap().to_string();
        let opened = open_vault(&state, &uri).unwrap();
        assert_eq!(
            opened.root_path,
            tmp.path().to_string_lossy().to_string()
        );
    }
}
