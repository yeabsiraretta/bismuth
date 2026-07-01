//! Spreadsheet file I/O Tauri commands (Spec 042)
//!
//! Exposes four IPC handlers for reading/writing CSV and JSON table formats.
//! All path arguments are validated against the active vault root to prevent
//! path-traversal writes outside the vault.

use crate::services::spreadsheet_service::parser;
use std::path::Path;

// ─── Path Validation ─────────────────────────────────────────────────────────

/// Returns `Ok(())` when `path` resolves to a location inside `vault_root`.
/// Returns `Err` for any path that escapes via `..` or is absolute outside root.
fn validate_in_vault(vault_root: &str, path: &str) -> Result<(), String> {
    if vault_root.is_empty() {
        // No vault configured — skip validation (dev/test mode).
        return Ok(());
    }
    let vault = Path::new(vault_root)
        .canonicalize()
        .map_err(|e| format!("Invalid vault root: {}", e))?;
    let target = Path::new(path);
    let resolved = if target.is_absolute() {
        target.to_path_buf()
    } else {
        vault.join(target)
    };
    let canonical = resolved
        .canonicalize()
        .unwrap_or(resolved.clone());
    if canonical.starts_with(&vault) {
        Ok(())
    } else {
        Err(format!("Path is outside vault: {}", path))
    }
}

// ─── CSV Commands ─────────────────────────────────────────────────────────────

/// Reads a UTF-8 CSV file and returns its contents as a two-dimensional string
/// array (rows × columns). Delimiter is auto-detected as comma.
///
/// # Arguments
/// * `path` — Absolute or vault-relative path to the .csv file.
/// * `vault_root` — Absolute path to the vault directory (may be empty string
///   in tests/dev mode, which disables path validation).
#[tauri::command]
pub async fn read_csv(path: String, vault_root: String) -> Result<Vec<Vec<String>>, String> {
    validate_in_vault(&vault_root, &path)?;
    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file '{}': {}", path, e))?;
    parser::parse_csv(&content, b',')
        .map_err(|e| format!("Failed to parse CSV: {}", e))
}

/// Serialises a two-dimensional string array to CSV and writes it to `path`.
///
/// # Arguments
/// * `path` — Target file path (must be within vault).
/// * `rows` — Cell data. Each inner `Vec<String>` is one row.
/// * `vault_root` — Vault root for path validation.
#[tauri::command]
pub async fn write_csv(
    path: String,
    rows: Vec<Vec<String>>,
    vault_root: String,
) -> Result<(), String> {
    validate_in_vault(&vault_root, &path)?;
    let csv_content = parser::serialize_csv(&rows)
        .map_err(|e| format!("Failed to serialize CSV: {}", e))?;
    if let Some(parent) = std::path::Path::new(&path).parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directory: {}", e))?;
    }
    std::fs::write(&path, csv_content)
        .map_err(|e| format!("Failed to write file '{}': {}", path, e))
}

/// Reads a JSON file containing an array-of-objects or a 2-D array and
/// normalises it to `Vec<Vec<serde_json::Value>>` (rows × columns).
///
/// # Arguments
/// * `path` — Absolute or vault-relative path to the .json file.
/// * `vault_root` — Vault root for path validation.
#[tauri::command]
pub async fn read_json_table(
    path: String,
    vault_root: String,
) -> Result<Vec<Vec<serde_json::Value>>, String> {
    validate_in_vault(&vault_root, &path)?;
    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file '{}': {}", path, e))?;
    parser::parse_json_table(&content)
        .map_err(|e| format!("Failed to parse JSON table: {}", e))
}

/// Serialises a `serde_json::Value` (the full `SpreadsheetDocument` payload
/// from the frontend) and writes it as pretty-printed JSON to `path`.
///
/// # Arguments
/// * `path` — Target file path (must be within vault).
/// * `doc` — Full spreadsheet document value.
/// * `vault_root` — Vault root for path validation.
#[tauri::command]
pub async fn write_json(
    path: String,
    doc: serde_json::Value,
    vault_root: String,
) -> Result<(), String> {
    validate_in_vault(&vault_root, &path)?;
    let json_content = serde_json::to_string_pretty(&doc)
        .map_err(|e| format!("Failed to serialize JSON: {}", e))?;
    if let Some(parent) = std::path::Path::new(&path).parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directory: {}", e))?;
    }
    std::fs::write(&path, json_content)
        .map_err(|e| format!("Failed to write file '{}': {}", path, e))
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[tokio::test]
    async fn test_read_csv_round_trip() {
        let mut file = NamedTempFile::new().unwrap();
        writeln!(file, "a,b,c").unwrap();
        writeln!(file, "1,2,3").unwrap();
        let path = file.path().to_str().unwrap().to_string();
        let rows = read_csv(path, String::new()).await.unwrap();
        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0], vec!["a", "b", "c"]);
        assert_eq!(rows[1], vec!["1", "2", "3"]);
    }

    #[tokio::test]
    async fn test_write_csv_then_read() {
        let file = NamedTempFile::new().unwrap();
        let path = file.path().to_str().unwrap().to_string();
        let rows = vec![
            vec!["name".to_string(), "score".to_string()],
            vec!["Alice".to_string(), "95".to_string()],
        ];
        write_csv(path.clone(), rows.clone(), String::new())
            .await
            .unwrap();
        let read_back = read_csv(path, String::new()).await.unwrap();
        assert_eq!(read_back, rows);
    }

    #[tokio::test]
    async fn test_path_traversal_rejected() {
        let result = read_csv(
            "../../../etc/passwd".to_string(),
            "/tmp".to_string(),
        )
        .await;
        assert!(result.is_err());
    }
}
