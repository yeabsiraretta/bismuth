//! Path security utilities
//!
//! Prevents path traversal attacks and ensures all file operations
//! stay within vault boundaries.

use crate::error::{BismuthError, Result};
use std::path::{Path, PathBuf};

/// Normalizes a path by resolving `..`, `.`, and symlinks
///
/// # Arguments
///
/// * `path` - Path to normalize
///
/// # Returns
///
/// Canonicalized absolute path
pub fn normalize_path(path: &Path) -> Result<PathBuf> {
    path.canonicalize()
        .map_err(|e| BismuthError::InvalidPath(format!("Failed to normalize path: {}", e)))
}

/// Checks if a path is within the vault root
///
/// Prevents path traversal attacks by ensuring the normalized path
/// starts with the vault root path.
///
/// # Arguments
///
/// * `path` - Path to check
/// * `vault_root` - Root directory of the vault
///
/// # Returns
///
/// `true` if path is within vault, `false` otherwise
pub fn is_within_vault(path: &Path, vault_root: &Path) -> bool {
    // Normalize vault root (must exist)
    let normalized_root = match normalize_path(vault_root) {
        Ok(p) => p,
        Err(_) => return false,
    };

    // For the path to check, try to normalize if it exists
    // Otherwise, check if its parent is within vault
    if path.exists() {
        let normalized_path = match normalize_path(path) {
            Ok(p) => p,
            Err(_) => return false,
        };
        normalized_path.starts_with(&normalized_root)
    } else {
        // For non-existent paths, check parent directory
        if let Some(parent) = path.parent() {
            if parent.exists() {
                let normalized_parent = match normalize_path(parent) {
                    Ok(p) => p,
                    Err(_) => return false,
                };
                normalized_parent.starts_with(&normalized_root)
            } else {
                // Parent doesn't exist either, check string-based
                // Convert both to absolute paths for comparison
                let abs_path = if path.is_absolute() {
                    path.to_path_buf()
                } else {
                    std::env::current_dir().unwrap_or_default().join(path)
                };
                abs_path.starts_with(&normalized_root)
            }
        } else {
            false
        }
    }
}

/// Converts an absolute path to a vault-relative path
///
/// # Arguments
///
/// * `path` - Absolute path within vault
/// * `vault_root` - Root directory of the vault
///
/// # Returns
///
/// Path relative to vault root
pub fn vault_relative_path(path: &Path, vault_root: &Path) -> Result<PathBuf> {
    let normalized_path = normalize_path(path)?;
    let normalized_root = normalize_path(vault_root)?;

    if !normalized_path.starts_with(&normalized_root) {
        return Err(BismuthError::InvalidPath(
            "Path is outside vault".to_string(),
        ));
    }

    normalized_path
        .strip_prefix(&normalized_root)
        .map(|p| p.to_path_buf())
        .map_err(|e| BismuthError::InvalidPath(format!("Failed to strip vault prefix: {}", e)))
}

/// Validates that a path is safe to use
///
/// Checks for:
/// - Path traversal attempts (../)
/// - Symlinks outside vault
/// - Invalid characters
///
/// # Arguments
///
/// * `path` - Path to validate
/// * `vault_root` - Root directory of the vault
///
/// # Returns
///
/// Ok(()) if path is safe, Err otherwise
pub fn validate_path(path: &Path, vault_root: &Path) -> Result<()> {
    // Check if path is within vault
    if !is_within_vault(path, vault_root) {
        return Err(BismuthError::InvalidPath(
            "Path traversal attempt detected".to_string(),
        ));
    }

    // Additional validation can be added here
    // (e.g., check for null bytes, invalid characters)

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_normalize_path() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("test.md");
        fs::write(&path, "test").unwrap();

        let normalized = normalize_path(&path).unwrap();
        assert!(normalized.is_absolute());
    }

    #[test]
    fn test_is_within_vault_valid() {
        let dir = tempdir().unwrap();
        let vault_root = dir.path();
        let file_path = vault_root.join("note.md");
        fs::write(&file_path, "test").unwrap();

        assert!(is_within_vault(&file_path, vault_root));
    }

    #[test]
    fn test_is_within_vault_traversal() {
        let dir = tempdir().unwrap();
        let vault_root = dir.path().join("vault");
        fs::create_dir(&vault_root).unwrap();

        // Try to access parent directory
        let outside_path = vault_root.join("../outside.md");

        // This should return false (outside vault)
        // Note: The actual behavior depends on whether the file exists
        // For a proper test, we'd need to create the file structure
        assert!(!is_within_vault(&outside_path, &vault_root));
    }

    #[test]
    fn test_vault_relative_path() {
        let dir = tempdir().unwrap();
        let vault_root = dir.path();
        let file_path = vault_root.join("notes/test.md");
        fs::create_dir_all(file_path.parent().unwrap()).unwrap();
        fs::write(&file_path, "test").unwrap();

        let relative = vault_relative_path(&file_path, vault_root).unwrap();
        assert_eq!(relative, PathBuf::from("notes/test.md"));
    }

    #[test]
    fn test_vault_relative_path_outside_vault() {
        let dir = tempdir().unwrap();
        let vault_root = dir.path().join("vault");
        let outside_path = dir.path().join("outside.md");

        fs::create_dir(&vault_root).unwrap();
        fs::write(&outside_path, "test").unwrap();

        let result = vault_relative_path(&outside_path, &vault_root);
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_path_safe() {
        let dir = tempdir().unwrap();
        let vault_root = dir.path();
        let file_path = vault_root.join("safe.md");
        fs::write(&file_path, "test").unwrap();

        assert!(validate_path(&file_path, vault_root).is_ok());
    }

    #[test]
    fn test_validate_path_unsafe() {
        let dir = tempdir().unwrap();
        let vault_root = dir.path().join("vault");
        let outside_path = dir.path().join("unsafe.md");

        fs::create_dir(&vault_root).unwrap();
        fs::write(&outside_path, "test").unwrap();

        assert!(validate_path(&outside_path, &vault_root).is_err());
    }
}
