//! File builtin module for templates.
//!
//! Provides: title, name, folder, path, extension, created, modified, tags.
//! Security: All paths validated against vault root.

use std::collections::HashMap;
use std::path::Path;

/// Dispatch a file.* function call.
pub fn call(func: &str, context: &HashMap<String, String>, vault_root: &Path) -> Option<String> {
    // Get the current file path from context
    let file_path = context.get("file.path")
        .or_else(|| context.get("filepath"))?;

    let path = Path::new(file_path);

    // Security: validate path is within vault
    if !path.starts_with(vault_root) {
        return Some("[path outside vault]".to_string());
    }

    match func {
        "title" | "name" => {
            path.file_stem()
                .map(|s| s.to_string_lossy().to_string())
        }
        "filename" => {
            path.file_name()
                .map(|s| s.to_string_lossy().to_string())
        }
        "folder" => {
            path.parent()
                .and_then(|p| p.file_name())
                .map(|s| s.to_string_lossy().to_string())
        }
        "path" => Some(file_path.clone()),
        "extension" | "ext" => {
            path.extension()
                .map(|s| s.to_string_lossy().to_string())
        }
        "created" => {
            std::fs::metadata(path).ok()
                .and_then(|m| m.created().ok())
                .map(|t| {
                    let dt: chrono::DateTime<chrono::Local> = t.into();
                    dt.format("%Y-%m-%d").to_string()
                })
        }
        "modified" => {
            std::fs::metadata(path).ok()
                .and_then(|m| m.modified().ok())
                .map(|t| {
                    let dt: chrono::DateTime<chrono::Local> = t.into();
                    dt.format("%Y-%m-%d").to_string()
                })
        }
        "tags" => {
            // Read frontmatter tags if available
            context.get("file.tags").cloned()
        }
        _ => None,
    }
}
