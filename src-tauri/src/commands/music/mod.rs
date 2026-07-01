//! Music document Tauri commands — full filesystem persistence.
//!
//! Documents stored as `.bismuth/music/<id>.json` within the vault.
//! All commands validate vault path with canonicalize + starts_with guard.

pub mod demucs;
pub use demucs::*;

use serde::{Deserialize, Serialize};
use std::path::Path;
use crate::config::constants::filesystem::VAULT_DIR_NAME;

// ─── Data structures ─────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MusicDocumentMeta {
    pub id: String,
    pub name: String,
    pub created_at: i64,
    pub modified_at: i64,
    pub track_count: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MusicDocument {
    pub id: String,
    pub name: String,
    pub vault_id: Option<String>,
    pub document_type: String,
    pub bpm: u32,
    pub time_signature_numerator: u32,
    pub time_signature_denominator: u32,
    pub tracks: Vec<serde_json::Value>,
    pub total_bars: u32,
    pub created_at: i64,
    pub modified_at: i64,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

fn music_dir(vault_path: &str) -> std::path::PathBuf {
    Path::new(vault_path).join(VAULT_DIR_NAME).join("music")
}

fn doc_path(vault_path: &str, id: &str) -> std::path::PathBuf {
    music_dir(vault_path).join(format!("{}.json", id))
}

fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

// ─── Commands ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn create_music_document(
    vault_path: String,
    name: String,
) -> Result<MusicDocumentMeta, String> {
    tracing::info!(name = %name, "create_music_document");
    let dir = music_dir(&vault_path);
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create music dir: {}", e))?;

    let id = uuid::Uuid::new_v4().to_string();
    let now = now_ms();
    let doc = MusicDocument {
        id: id.clone(),
        name: name.clone(),
        vault_id: None,
        document_type: "music".to_string(),
        bpm: 120,
        time_signature_numerator: 4,
        time_signature_denominator: 4,
        tracks: vec![],
        total_bars: 32,
        created_at: now,
        modified_at: now,
    };

    let json = serde_json::to_string_pretty(&doc)
        .map_err(|e| format!("Serialize error: {}", e))?;
    std::fs::write(doc_path(&vault_path, &id), json)
        .map_err(|e| format!("Write error: {}", e))?;

    Ok(MusicDocumentMeta {
        id,
        name,
        created_at: now,
        modified_at: now,
        track_count: 0,
    })
}

#[tauri::command]
pub async fn load_music_document(
    vault_path: String,
    id: String,
) -> Result<MusicDocument, String> {
    tracing::info!(id = %id, "load_music_document");
    let path = doc_path(&vault_path, &id);
    let canon = path.canonicalize()
        .map_err(|_| format!("Document not found: {}", id))?;
    let vault_canon = Path::new(&vault_path).canonicalize()
        .map_err(|e| format!("Invalid vault path: {}", e))?;
    if !canon.starts_with(&vault_canon) {
        return Err("path_traversal_denied".to_string());
    }
    let json = std::fs::read_to_string(&canon)
        .map_err(|e| format!("Read error: {}", e))?;
    serde_json::from_str(&json)
        .map_err(|e| format!("Deserialize error: {}", e))
}

#[tauri::command]
pub async fn save_music_document(
    vault_path: String,
    doc: serde_json::Value,
) -> Result<(), String> {
    tracing::info!("save_music_document");
    let doc_type = doc.get("documentType")
        .or_else(|| doc.get("document_type"))
        .and_then(|v| v.as_str())
        .unwrap_or("");
    if doc_type != "music" {
        return Err("invalid_document_type: expected 'music'".to_string());
    }
    let id = doc.get("id").and_then(|v| v.as_str())
        .ok_or_else(|| "missing_id".to_string())?;

    let dir = music_dir(&vault_path);
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Create dir error: {}", e))?;

    let path = doc_path(&vault_path, id);
    let vault_canon = Path::new(&vault_path).canonicalize()
        .map_err(|e| format!("Invalid vault path: {}", e))?;
    let dir_canon = dir.canonicalize()
        .map_err(|e| format!("Invalid music dir: {}", e))?;
    if !dir_canon.starts_with(&vault_canon) {
        return Err("path_traversal_denied".to_string());
    }

    let mut updated = doc.clone();
    updated["modified_at"] = serde_json::Value::Number(now_ms().into());

    let json = serde_json::to_string_pretty(&updated)
        .map_err(|e| format!("Serialize error: {}", e))?;
    std::fs::write(&path, json)
        .map_err(|e| format!("Write error: {}", e))
}

#[tauri::command]
pub async fn list_music_documents(
    vault_path: String,
) -> Result<Vec<MusicDocumentMeta>, String> {
    tracing::info!("list_music_documents");
    let dir = music_dir(&vault_path);
    if !dir.exists() {
        return Ok(vec![]);
    }

    let entries = std::fs::read_dir(&dir)
        .map_err(|e| format!("Read dir error: {}", e))?;

    let mut docs: Vec<MusicDocumentMeta> = entries
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.path().extension().and_then(|s| s.to_str()) == Some("json")
        })
        .filter_map(|e| {
            let json = std::fs::read_to_string(e.path()).ok()?;
            let v: serde_json::Value = serde_json::from_str(&json).ok()?;
            Some(MusicDocumentMeta {
                id: v.get("id")?.as_str()?.to_string(),
                name: v.get("name")?.as_str()?.to_string(),
                created_at: v.get("created_at")?.as_i64().unwrap_or(0),
                modified_at: v.get("modified_at")?.as_i64().unwrap_or(0),
                track_count: v.get("tracks")?.as_array()?.len(),
            })
        })
        .collect();

    docs.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));
    Ok(docs)
}

#[tauri::command]
pub async fn delete_music_document(
    vault_path: String,
    id: String,
) -> Result<(), String> {
    tracing::info!(id = %id, "delete_music_document");
    let path = doc_path(&vault_path, &id);
    if !path.exists() {
        return Ok(());
    }
    let canon = path.canonicalize()
        .map_err(|e| format!("Canonicalize error: {}", e))?;
    let vault_canon = Path::new(&vault_path).canonicalize()
        .map_err(|e| format!("Invalid vault path: {}", e))?;
    if !canon.starts_with(&vault_canon) {
        return Err("path_traversal_denied".to_string());
    }
    std::fs::remove_file(&canon)
        .map_err(|e| format!("Delete error: {}", e))
}
