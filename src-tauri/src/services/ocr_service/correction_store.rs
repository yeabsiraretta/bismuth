//! OCR correction JSONL store.
//!
//! Corrections are stored per-language in `.bismuth/ocr-corrections/{lang}.jsonl`.
//! File rotation: rename to `{lang}.jsonl.{unix_ts}.bak` when the file reaches 1 MB.
//! Keep at most 3 backups; delete oldest on each rotation.
//!
//! Security: `get_recent` returns at most 20 entries regardless of caller argument.
//! Corrupt JSONL lines are skipped with tracing::warn! — never abort.

use std::path::Path;
use std::io::Write;

const MAX_FILE_BYTES: u64 = 1024 * 1024; // 1 MB
const MAX_BACKUPS: usize = 3;
const MAX_RECENT: usize = 20;

fn corrections_path(vault_root: &str, lang: &str) -> std::path::PathBuf {
    Path::new(vault_root)
        .join(".bismuth")
        .join("ocr-corrections")
        .join(format!("{}.jsonl", lang))
}

fn ensure_corrections_dir(vault_root: &str, lang: &str) -> Result<std::path::PathBuf, String> {
    let path = corrections_path(vault_root, lang);
    std::fs::create_dir_all(path.parent().unwrap())
        .map_err(|e| format!("Cannot create corrections dir: {}", e))?;
    Ok(path)
}

/// Rotate the corrections file when it exceeds `MAX_FILE_BYTES`.
/// Keeps at most `MAX_BACKUPS` backup files; deletes oldest on overflow.
fn maybe_rotate(path: &std::path::Path) -> Result<(), String> {
    let meta = match std::fs::metadata(path) {
        Ok(m) => m,
        Err(_) => return Ok(()), // file doesn't exist yet — nothing to rotate
    };
    if meta.len() < MAX_FILE_BYTES {
        return Ok(());
    }

    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let bak = path.with_extension(format!("jsonl.{}.bak", ts));
    std::fs::rename(path, &bak)
        .map_err(|e| format!("Cannot rotate corrections file: {}", e))?;
    tracing::info!(backup = %bak.display(), "OCR corrections rotated");

    // Enforce MAX_BACKUPS — collect existing backups and delete oldest.
    let parent = path.parent().unwrap();
    let stem = path.file_stem().unwrap_or_default().to_string_lossy().to_string();
    let mut backups: Vec<std::path::PathBuf> = std::fs::read_dir(parent)
        .ok()
        .into_iter()
        .flatten()
        .flatten()
        .map(|e| e.path())
        .filter(|p| {
            p.to_string_lossy().contains(&stem) && p.to_string_lossy().contains(".bak")
        })
        .collect();

    if backups.len() > MAX_BACKUPS {
        backups.sort();
        let to_delete = backups.len() - MAX_BACKUPS;
        for old in backups.iter().take(to_delete) {
            let _ = std::fs::remove_file(old);
            tracing::info!(file = %old.display(), "Oldest OCR backup deleted");
        }
    }

    Ok(())
}

/// Append a correction entry (as a `serde_json::Value`) to the JSONL file.
/// Rotates the file if it has reached the size limit.
pub fn append_correction(
    vault_root: &str,
    lang: &str,
    entry: serde_json::Value,
) -> Result<(), String> {
    let path = ensure_corrections_dir(vault_root, lang)?;
    maybe_rotate(&path)?;

    let line = format!("{}\n", entry.to_string());
    let mut file = std::fs::OpenOptions::new()
        .append(true)
        .create(true)
        .open(&path)
        .map_err(|e| format!("Cannot open corrections file: {}", e))?;
    file.write_all(line.as_bytes())
        .map_err(|e| format!("Cannot write correction: {}", e))?;

    tracing::info!(lang = %lang, "OCR correction appended");
    Ok(())
}

/// Return the last `n` corrections for a given language.
/// Hard cap: returns at most `MAX_RECENT` (20) entries regardless of `n`.
/// Corrupt lines are skipped with a warning.
pub fn load_recent_corrections(
    vault_root: &str,
    lang: &str,
    n: usize,
) -> Result<Vec<serde_json::Value>, String> {
    let path = corrections_path(vault_root, lang);
    if !path.exists() {
        return Ok(vec![]);
    }

    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Cannot read corrections: {}", e))?;

    let entries: Vec<serde_json::Value> = content
        .lines()
        .filter_map(|l| {
            serde_json::from_str(l)
                .map_err(|e| {
                    tracing::warn!(line = %l, error = %e, "Skipping corrupt OCR JSONL line");
                })
                .ok()
        })
        .collect();

    let cap = n.min(MAX_RECENT);
    let start = if entries.len() > cap { entries.len() - cap } else { 0 };
    Ok(entries[start..].to_vec())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use tempfile::TempDir;

    #[test]
    fn append_then_load_round_trips() {
        let vault = TempDir::new().unwrap();
        let entry = json!({ "lang": "en", "raw": "helo", "corrected": "hello" });
        append_correction(vault.path().to_str().unwrap(), "en", entry.clone()).unwrap();

        let results = load_recent_corrections(vault.path().to_str().unwrap(), "en", 5).unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0]["corrected"], "hello");
    }

    #[test]
    fn get_recent_caps_at_twenty() {
        let vault = TempDir::new().unwrap();
        for i in 0..30 {
            let e = json!({ "i": i, "raw": "x", "corrected": "y" });
            append_correction(vault.path().to_str().unwrap(), "en", e).unwrap();
        }
        let results = load_recent_corrections(vault.path().to_str().unwrap(), "en", 25).unwrap();
        assert!(results.len() <= 20, "Expected at most 20 but got {}", results.len());
    }

    #[test]
    fn load_nonexistent_lang_returns_empty() {
        let vault = TempDir::new().unwrap();
        let results =
            load_recent_corrections(vault.path().to_str().unwrap(), "xx", 5).unwrap();
        assert!(results.is_empty());
    }

    #[test]
    fn rotation_triggers_when_file_exceeds_one_mb() {
        let vault = TempDir::new().unwrap();
        // Write just over 1 MB of data.
        let big_entry = json!({ "raw": "a".repeat(1024), "corrected": "b" });
        for _ in 0..1025 {
            append_correction(vault.path().to_str().unwrap(), "en", big_entry.clone()).unwrap();
        }
        // The corrections dir should have at least one .bak file.
        let corr_dir = Path::new(vault.path()).join(".bismuth").join("ocr-corrections");
        let baks: Vec<_> = std::fs::read_dir(&corr_dir)
            .unwrap()
            .flatten()
            .filter(|e| e.path().to_string_lossy().contains(".bak"))
            .collect();
        assert!(!baks.is_empty(), "Expected rotation backup file");
    }
}
