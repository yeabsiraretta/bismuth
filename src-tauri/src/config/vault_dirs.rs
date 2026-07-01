//! Typed vault directory path helpers.
//! All `.bismuth/` subdirectory paths go through here — no hardcoded strings elsewhere.

use std::path::{Path, PathBuf};

pub fn bismuth_dir(root: &Path) -> PathBuf {
    root.join(".bismuth")
}

pub fn canvas_dir(root: &Path) -> PathBuf {
    bismuth_dir(root).join("canvas")
}

pub fn design_docs_dir(root: &Path) -> PathBuf {
    bismuth_dir(root).join("design-docs")
}

pub fn tokens_dir(root: &Path) -> PathBuf {
    bismuth_dir(root).join("tokens")
}

pub fn embeddings_dir(root: &Path) -> PathBuf {
    bismuth_dir(root).join("embeddings")
}

pub fn logs_dir(root: &Path) -> PathBuf {
    bismuth_dir(root).join("logs")
}

pub fn components_dir(root: &Path) -> PathBuf {
    bismuth_dir(root).join("components")
}

pub fn themes_dir(root: &Path) -> PathBuf {
    bismuth_dir(root).join("themes")
}

pub fn templates_dir(root: &Path) -> PathBuf {
    bismuth_dir(root).join("templates")
}

/// All canonical subdirs that should exist on vault init.
pub const VAULT_SUBDIRS: &[&str] = &[
    ".bismuth",
    ".bismuth/canvas",
    ".bismuth/design-docs",
    ".bismuth/tokens",
    ".bismuth/embeddings",
    ".bismuth/logs",
    ".bismuth/components",
    ".bismuth/themes",
    ".bismuth/templates",
];

/// Create all canonical vault subdirectories under `root`.
pub fn init_vault_dirs(root: &Path) -> std::io::Result<()> {
    for subdir in VAULT_SUBDIRS {
        std::fs::create_dir_all(root.join(subdir))?;
    }
    Ok(())
}
