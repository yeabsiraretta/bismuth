use std::cmp::Reverse;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

use crate::infrastructure::error::{AppError, AppResult};
use crate::infrastructure::state::AppState;


#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct NoteVersion {
    pub id: String,
    pub note_path: String,
    pub label: String,
    pub timestamp: u64,
    pub size: u64,
}

fn versions_dir(vault_root: &Path) -> PathBuf {
    vault_root.join(".bismuth").join("versions")
}

fn note_versions_dir(vault_root: &Path, note_path: &str) -> PathBuf {
    let sanitized = note_path.replace(['/', '\\'], "__");
    versions_dir(vault_root).join(sanitized)
}

fn now_millis() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

pub(crate) fn create_version(
    state: &AppState,
    note_path: &str,
    label: Option<&str>,
) -> AppResult<NoteVersion> {
    let root = state.vault_root()?;

    let full_path = root.join(note_path);
    if !full_path.exists() {
        return Err(AppError::Custom(format!("Note not found: {note_path}")));
    }

    let content = fs::read_to_string(&full_path)?;

    let ts = now_millis();
    let id = format!("{ts}");
    let ver_dir = note_versions_dir(&root, note_path);
    fs::create_dir_all(&ver_dir)?;

    let ver_file = ver_dir.join(format!("{id}.md"));
    fs::write(&ver_file, &content)?;

    Ok(NoteVersion {
        id,
        note_path: note_path.to_string(),
        label: label.unwrap_or("Auto-save").to_string(),
        timestamp: ts,
        size: content.len() as u64,
    })
}

pub(crate) fn list_versions(state: &AppState, note_path: &str) -> AppResult<Vec<NoteVersion>> {
    let root = state.vault_root()?;

    let ver_dir = note_versions_dir(&root, note_path);
    if !ver_dir.exists() {
        return Ok(vec![]);
    }

    let mut versions: Vec<NoteVersion> = Vec::new();
    for entry in fs::read_dir(&ver_dir)?
    {
        let entry = entry?;
        let path = entry.path();
        if path.extension().is_none_or(|ext| ext != "md") {
            continue;
        }

        let file_name = path.file_stem().unwrap_or_default().to_string_lossy();
        let ts: u64 = file_name.parse().unwrap_or(0);
        let size = entry.metadata().map(|m| m.len()).unwrap_or(0);

        versions.push(NoteVersion {
            id: file_name.to_string(),
            note_path: note_path.to_string(),
            label: "Auto-save".to_string(),
            timestamp: ts,
            size,
        });
    }

    versions.sort_by_key(|v| Reverse(v.timestamp));
    Ok(versions)
}

pub(crate) fn read_version(
    state: &AppState,
    note_path: &str,
    version_id: &str,
) -> AppResult<String> {
    let root = state.vault_root()?;

    let ver_file = note_versions_dir(&root, note_path).join(format!("{version_id}.md"));
    if !ver_file.exists() {
        return Err(AppError::Custom(format!(
            "Version {version_id} not found for {note_path}"
        )));
    }

    Ok(fs::read_to_string(&ver_file)?)
}

pub(crate) fn delete_version(
    state: &AppState,
    note_path: &str,
    version_id: &str,
) -> AppResult<()> {
    let root = state.vault_root()?;

    let ver_file = note_versions_dir(&root, note_path).join(format!("{version_id}.md"));
    if ver_file.exists() {
        fs::remove_file(&ver_file)?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    fn setup_state() -> (AppState, TempDir) {
        let dir = TempDir::new().unwrap();
        let state = AppState::default();
        {
            let mut vault = state.vault.write().unwrap();
            vault.path = Some(dir.path().to_string_lossy().to_string());
            vault.name = Some("test".to_string());
        }
        // Create a test note
        let note_path = dir.path().join("test.md");
        fs::write(&note_path, "# Hello\n\nContent here.").unwrap();
        (state, dir)
    }

    #[test]
    fn test_create_and_list_versions() {
        let (state, _dir) = setup_state();
        let ver = create_version(&state, "test.md", Some("First save")).unwrap();
        assert_eq!(ver.note_path, "test.md");
        assert_eq!(ver.label, "First save");
        assert!(ver.size > 0);

        let versions = list_versions(&state, "test.md").unwrap();
        assert_eq!(versions.len(), 1);
        assert_eq!(versions[0].id, ver.id);
    }

    #[test]
    fn test_read_version() {
        let (state, _dir) = setup_state();
        let ver = create_version(&state, "test.md", None).unwrap();
        let content = read_version(&state, "test.md", &ver.id).unwrap();
        assert!(content.contains("# Hello"));
    }

    #[test]
    fn test_delete_version() {
        let (state, _dir) = setup_state();
        let ver = create_version(&state, "test.md", None).unwrap();
        delete_version(&state, "test.md", &ver.id).unwrap();
        let versions = list_versions(&state, "test.md").unwrap();
        assert!(versions.is_empty());
    }

    #[test]
    fn test_list_empty() {
        let (state, _dir) = setup_state();
        let versions = list_versions(&state, "nonexistent.md").unwrap();
        assert!(versions.is_empty());
    }
}
