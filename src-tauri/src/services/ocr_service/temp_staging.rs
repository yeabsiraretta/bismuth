//! Temp image staging — copies external images into vault-bounded OCR temp dir.
//!
//! Security: the sidecar always receives a path within `.bismuth/ocr-temp/`,
//! never the original OS-dialog path. See ocr-data-model.md §External Image Import.

use std::path::Path;
use uuid::Uuid;

const ALLOWED_EXTENSIONS: &[&str] = &[
    "png", "jpg", "jpeg", "webp", "tiff", "bmp", "gif", "pdf",
];

/// Copy an external image into `{vault_root}/.bismuth/ocr-temp/` and return the
/// new vault-bounded path. The sidecar MUST receive this path — never the
/// original `source_path`.
pub fn stage_external_image(
    source_path: &str,
    vault_root: &str,
) -> Result<std::path::PathBuf, String> {
    // 1. Canonicalize source path (validates existence + resolves symlinks).
    let canon_src = Path::new(source_path)
        .canonicalize()
        .map_err(|e| format!("Cannot access image: {}", e))?;

    // 2. Validate file extension.
    let ext = canon_src
        .extension()
        .and_then(|e| e.to_str())
        .ok_or_else(|| "File has no extension".to_string())?;
    let ext_lower = ext.to_lowercase();
    if !ALLOWED_EXTENSIONS.contains(&ext_lower.as_str()) {
        return Err(format!("Unsupported image type: {}", ext));
    }

    // 3. Create temp directory within vault boundary.
    let temp_dir = Path::new(vault_root).join(".bismuth").join("ocr-temp");
    std::fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Cannot create temp dir: {}", e))?;

    // 4. Copy to temp with UUID filename so collisions are impossible.
    let dest = temp_dir.join(format!("{}.{}", Uuid::new_v4(), ext_lower));
    std::fs::copy(&canon_src, &dest)
        .map_err(|e| format!("Cannot stage image: {}", e))?;

    tracing::info!(
        source = %canon_src.display(),
        dest = %dest.display(),
        "OCR image staged"
    );

    Ok(dest)
}

/// Remove a staged temp file. Errors are silently ignored because the file may
/// already be gone (e.g., cleaned up by the job completion handler).
pub fn cleanup_temp_image(staged_path: &str) {
    let _ = std::fs::remove_file(staged_path);
    tracing::info!("OCR temp file cleaned up");
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn make_test_image(dir: &std::path::Path, name: &str) -> std::path::PathBuf {
        let p = dir.join(name);
        std::fs::write(&p, b"fake-image-bytes").unwrap();
        p
    }

    #[test]
    fn stage_valid_png_returns_vault_bounded_path() {
        let src_dir = TempDir::new().unwrap();
        let vault_dir = TempDir::new().unwrap();
        let src = make_test_image(src_dir.path(), "test.png");

        let result = stage_external_image(
            src.to_str().unwrap(),
            vault_dir.path().to_str().unwrap(),
        );
        assert!(result.is_ok(), "Expected Ok, got {:?}", result);
        let dest = result.unwrap();
        assert!(dest.starts_with(vault_dir.path()), "Dest must be inside vault");
        assert!(dest.to_str().unwrap().contains("ocr-temp"));
        assert!(dest.exists());
    }

    #[test]
    fn stage_unsupported_extension_returns_error() {
        let src_dir = TempDir::new().unwrap();
        let vault_dir = TempDir::new().unwrap();
        let src = make_test_image(src_dir.path(), "document.txt");

        let result = stage_external_image(
            src.to_str().unwrap(),
            vault_dir.path().to_str().unwrap(),
        );
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.contains("Unsupported") || err.contains("unsupported"), "{}", err);
    }

    #[test]
    fn stage_nonexistent_file_returns_error() {
        let vault_dir = TempDir::new().unwrap();
        let result = stage_external_image(
            "/nonexistent/path/image.png",
            vault_dir.path().to_str().unwrap(),
        );
        assert!(result.is_err());
    }
}
