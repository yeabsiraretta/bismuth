//! OCR image import commands.
//!
//! Security policy:
//! - External images are ALWAYS staged to `.bismuth/ocr-temp/` before any sidecar call.
//! - The sidecar NEVER receives the original OS-dialog path.
//! - Cleanup validates the staged path is within vault boundary before deleting.

use crate::services::ocr_service::{temp_staging, correction_store};

/// Stage an external image into the vault temp dir and return a pending job JSON.
/// The frontend spawns the Tier 1 WASM worker against the staged path.
#[tauri::command]
pub async fn import_image(
    source_path: String,
    language: String,
    vault_root: String,
) -> Result<serde_json::Value, String> {
    tracing::info!(lang = %language, "import_image");

    let staged = temp_staging::stage_external_image(&source_path, &vault_root)?;
    let job_id = uuid::Uuid::new_v4().to_string();

    Ok(serde_json::json!({
        "jobId": job_id,
        "stagedPath": staged.to_string_lossy(),
        "language": language,
        "status": "staged"
    }))
}

/// Remove a staged temp file after verifying it is within the vault boundary.
#[tauri::command]
pub async fn cleanup_ocr_temp(
    staged_path: String,
    vault_root: String,
) -> Result<(), String> {
    tracing::info!("cleanup_ocr_temp");

    let canon_vault = std::path::Path::new(&vault_root)
        .canonicalize()
        .map_err(|e| format!("Invalid vault root: {}", e))?;
    let canon_staged = std::path::Path::new(&staged_path)
        .canonicalize()
        .map_err(|e| format!("Invalid staged path: {}", e))?;

    if !canon_staged.starts_with(&canon_vault) {
        return Err("Staged path escapes vault boundary".into());
    }

    std::fs::remove_file(&staged_path)
        .map_err(|e| format!("Cannot remove temp: {}", e))?;
    Ok(())
}

/// Append a user or LLM correction entry to the JSONL correction store.
#[tauri::command]
pub async fn append_ocr_correction(
    vault_root: String,
    language: String,
    entry: serde_json::Value,
) -> Result<(), String> {
    tracing::info!(lang = %language, "append_ocr_correction");
    correction_store::append_correction(&vault_root, &language, entry)
}

/// Return the most recent OCR corrections for a language (capped at 20).
#[tauri::command]
pub async fn get_ocr_corrections(
    vault_root: String,
    language: String,
    n: usize,
) -> Result<serde_json::Value, String> {
    tracing::info!(lang = %language, n = n, "get_ocr_corrections");
    let entries = correction_store::load_recent_corrections(&vault_root, &language, n)?;
    Ok(serde_json::json!(entries))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn make_test_image(dir: &std::path::Path, name: &str) -> std::path::PathBuf {
        let p = dir.join(name);
        std::fs::write(&p, b"fake-image").unwrap();
        p
    }

    #[tokio::test]
    async fn import_image_valid_returns_staged_job() {
        let src_dir = TempDir::new().unwrap();
        let vault_dir = TempDir::new().unwrap();
        let src = make_test_image(src_dir.path(), "photo.jpg");

        let result = import_image(
            src.to_str().unwrap().to_string(),
            "en".to_string(),
            vault_dir.path().to_str().unwrap().to_string(),
        )
        .await;

        assert!(result.is_ok(), "{:?}", result);
        let val = result.unwrap();
        assert_eq!(val["status"], "staged");
        assert!(val["stagedPath"].as_str().unwrap().contains("ocr-temp"));
    }

    #[tokio::test]
    async fn cleanup_ocr_temp_rejects_path_outside_vault() {
        let vault_dir = TempDir::new().unwrap();
        let other_dir = TempDir::new().unwrap();
        let outside_file = other_dir.path().join("outside.txt");
        std::fs::write(&outside_file, b"data").unwrap();

        let result = cleanup_ocr_temp(
            outside_file.to_str().unwrap().to_string(),
            vault_dir.path().to_str().unwrap().to_string(),
        )
        .await;

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("escapes vault"));
    }
}
