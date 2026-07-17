use std::path::Path;

use crate::infrastructure::error::AppResult;

use super::{collect_files, copy_file, relative_dest, ImportResult};

pub(super) fn import_markdown(src: &Path, vault_root: &Path) -> AppResult<ImportResult> {
    let files = if src.is_file() {
        vec![src.to_path_buf()]
    } else {
        collect_files(src, &["md", "txt"])
    };

    let mut result = ImportResult {
        success: 0,
        failed: 0,
        errors: Vec::new(),
    };

    for file in &files {
        let dest = if src.is_file() {
            vault_root.join(file.file_name().unwrap_or_default())
        } else {
            relative_dest(src, file, vault_root)
        };

        // Rename .txt to .md
        let dest = if dest.extension().and_then(|e| e.to_str()) == Some("txt") {
            dest.with_extension("md")
        } else {
            dest
        };

        match copy_file(file, &dest) {
            Ok(()) => result.success += 1,
            Err(e) => {
                result.failed += 1;
                result.errors.push(format!("{}: {e}", file.display()));
            },
        }
    }

    tracing::info!(
        success = result.success,
        failed = result.failed,
        "Markdown import complete"
    );
    Ok(result)
}
