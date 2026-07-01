//! Demucs stem-splitting command stub.
//!
//! Returns Err("demucs_not_installed") until the Demucs sidecar binary
//! is present. Frontend shows a friendly installation guide message.

/// Split an audio file into 4 stems using the Demucs sidecar.
///
/// # Errors
/// Returns `Err("demucs_not_installed: ...")` when the Demucs binary is absent.
/// Returns `Err("path_outside_vault")` if `audio_path` is not within `vault_root`.
#[tauri::command]
pub async fn split_stems(
    audio_path: String,
    vault_root: String,
) -> Result<serde_json::Value, String> {
    tracing::info!("split_stems: stub invoked");

    // Validate audio_path is within vault boundary
    let audio = std::fs::canonicalize(&audio_path)
        .map_err(|e| format!("invalid_audio_path: {e}"))?;
    let vault = std::fs::canonicalize(&vault_root)
        .map_err(|e| format!("invalid_vault_root: {e}"))?;
    if !audio.starts_with(&vault) {
        return Err("path_outside_vault: audio file must be inside the vault directory".to_string());
    }

    Err(
        "demucs_not_installed: Install Demucs to enable stem splitting. \
         See docs/guides/music-demucs-setup.md"
            .to_string(),
    )
}
