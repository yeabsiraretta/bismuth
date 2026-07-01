//! Lifecycle startup helpers — filesystem walking and filename sanitization.

use crate::error::{BismuthError, Result};
use std::path::{Path, PathBuf};

pub(super) fn walk_markdown_files(dir: &Path, visitor: &mut dyn FnMut(PathBuf)) -> Result<()> {
    if !dir.is_dir() {
        return Ok(());
    }
    let entries = std::fs::read_dir(dir)
        .map_err(|e| BismuthError::VaultError(format!("Failed to read dir: {}", e)))?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.file_name().map_or(false, |n| n.to_string_lossy().starts_with('.')) {
            continue;
        }
        if path.is_dir() {
            walk_markdown_files(&path, visitor)?;
        } else if path.extension().map_or(false, |ext| ext == "md") {
            visitor(path);
        }
    }
    Ok(())
}

pub(super) fn sanitize_filename(title: &str) -> String {
    title
        .chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
            _ => c,
        })
        .collect()
}
