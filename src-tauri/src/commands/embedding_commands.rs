//! Semantic embedding IPC commands (FR-025)
//!
//! Provides commands for initializing embeddings, indexing notes,
//! querying similar notes, and performing natural language lookup.

use crate::commands::AppState;
use crate::services::embedding_service::{EmbeddingConfig, EmbeddingService, SimilarNote};
use std::sync::Mutex;
use tauri::State;

/// Managed state holding the embedding service.
pub struct EmbeddingState {
    pub embedding_service: Mutex<Option<EmbeddingService>>,
}

/// Initialize the embedding service for the given vault.
/// Creates the embeddings directory and loads existing vectors into cache.
#[tauri::command]
pub async fn initialize_embeddings(
    state: State<'_, EmbeddingState>,
    vault_root: String,
) -> Result<usize, String> {
    let path = std::path::PathBuf::from(&vault_root);
    let mut service = EmbeddingService::new(&path);
    service
        .initialize()
        .map_err(|e| format!("Failed to initialize embeddings: {}", e))?;
    let count = service.embedding_count();
    let mut guard = state.embedding_service.lock().unwrap();
    *guard = Some(service);
    Ok(count)
}

/// Index a single note's content for embedding.
/// Call this after note creation or modification.
#[tauri::command]
pub async fn embed_note(
    embedding_state: State<'_, EmbeddingState>,
    app_state: State<'_, AppState>,
    path: String,
) -> Result<(), String> {
    // Read note content first (drop vault lock before using embedding service)
    let (content, tags) = {
        let vault_service = app_state.vault_service.lock().unwrap();
        let note_path = std::path::PathBuf::from(&path);
        let note = vault_service
            .get_note(&note_path)
            .map_err(|e| format!("Failed to read note: {}", e))?;

        let tags: Vec<String> = note
            .frontmatter
            .get("tags")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_default();
        (note.content.clone(), tags)
    };

    let mut guard = embedding_state.embedding_service.lock().unwrap();
    let service = guard
        .as_mut()
        .ok_or_else(|| "Embedding service not initialized".to_string())?;

    // Check exclusion
    if service.is_excluded(&path, &tags) {
        service.remove_embedding(&path).ok();
        return Ok(());
    }

    // Embed and store
    let vector = service
        .embed(&content)
        .map_err(|e| format!("Embedding error: {}", e))?;
    service
        .store_embedding(&path, &vector)
        .map_err(|e| format!("Storage error: {}", e))?;

    Ok(())
}

/// Index all notes in the vault for embedding (batch operation).
#[tauri::command]
pub async fn index_all_embeddings(
    embedding_state: State<'_, EmbeddingState>,
    app_state: State<'_, AppState>,
) -> Result<usize, String> {
    // Read all notes first, then drop vault lock
    let notes = {
        let vault_service = app_state.vault_service.lock().unwrap();
        vault_service
            .scan()
            .map_err(|e| format!("Scan error: {}", e))?
    };

    let mut guard = embedding_state.embedding_service.lock().unwrap();
    let service = guard
        .as_mut()
        .ok_or_else(|| "Embedding service not initialized".to_string())?;

    let mut indexed = 0;
    for note in &notes {
        let path_str = note.path.to_string_lossy().to_string();

        // Extract tags
        let tags: Vec<String> = note
            .frontmatter
            .get("tags")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_default();

        // Skip excluded
        if service.is_excluded(&path_str, &tags) {
            continue;
        }

        // Skip if already embedded
        if service.has_embedding(&path_str) {
            indexed += 1;
            continue;
        }

        let vector = service
            .embed(&note.content)
            .map_err(|e| format!("Embedding error: {}", e))?;
        service
            .store_embedding(&path_str, &vector)
            .map_err(|e| format!("Storage error: {}", e))?;
        indexed += 1;
    }

    Ok(indexed)
}

/// Get semantically similar notes for the given note path.
#[tauri::command]
pub async fn get_similar_notes(
    state: State<'_, EmbeddingState>,
    path: String,
    top_k: Option<usize>,
) -> Result<Vec<SimilarNote>, String> {
    let guard = state.embedding_service.lock().unwrap();
    let service = guard
        .as_ref()
        .ok_or_else(|| "Embedding service not initialized".to_string())?;

    service
        .get_similar(&path, top_k.unwrap_or(5))
        .map_err(|e| format!("Similarity error: {}", e))
}

/// Natural language lookup: embed arbitrary text and find similar notes.
#[tauri::command]
pub async fn lookup_by_text(
    state: State<'_, EmbeddingState>,
    query: String,
    top_k: Option<usize>,
) -> Result<Vec<SimilarNote>, String> {
    let guard = state.embedding_service.lock().unwrap();
    let service = guard
        .as_ref()
        .ok_or_else(|| "Embedding service not initialized".to_string())?;

    let query_vec = service
        .embed(&query)
        .map_err(|e| format!("Embedding error: {}", e))?;

    Ok(service.get_similar_to_vector(&query_vec, top_k.unwrap_or(10)))
}

/// Get/set embedding exclusion configuration.
#[tauri::command]
pub async fn get_embedding_config(
    state: State<'_, EmbeddingState>,
) -> Result<EmbeddingConfig, String> {
    let guard = state.embedding_service.lock().unwrap();
    let service = guard
        .as_ref()
        .ok_or_else(|| "Embedding service not initialized".to_string())?;
    Ok(service.get_config().clone())
}

#[tauri::command]
pub async fn set_embedding_config(
    state: State<'_, EmbeddingState>,
    config: EmbeddingConfig,
) -> Result<(), String> {
    let mut guard = state.embedding_service.lock().unwrap();
    let service = guard
        .as_mut()
        .ok_or_else(|| "Embedding service not initialized".to_string())?;
    service
        .set_config(config)
        .map_err(|e| format!("Config error: {}", e))
}

/// Get the current embedding index stats.
#[tauri::command]
pub async fn get_embedding_stats(
    state: State<'_, EmbeddingState>,
) -> Result<EmbeddingStats, String> {
    let guard = state.embedding_service.lock().unwrap();
    let service = guard
        .as_ref()
        .ok_or_else(|| "Embedding service not initialized".to_string())?;
    Ok(EmbeddingStats {
        total_embeddings: service.embedding_count(),
        is_ready: service.is_ready(),
    })
}

#[derive(serde::Serialize)]
pub struct EmbeddingStats {
    pub total_embeddings: usize,
    pub is_ready: bool,
}
