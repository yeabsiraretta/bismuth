//! Folder listing operations for the vault.

use crate::error::Result;
use crate::models::{Note, Vault};
use std::fs;
use std::path::Path;

use super::vault_operations::VaultOperations;

/// Provides folder-related operations within a vault.
pub(super) struct VaultFolders;

impl VaultFolders {
    /// Recursively lists all subdirectories in the vault (excluding hidden dirs).
    pub fn list_folders(vault_path: &Path) -> Result<Vec<String>> {
        let mut folders = Vec::new();

        fn collect_folders(dir: &Path, base: &Path, folders: &mut Vec<String>) -> Result<()> {
            if dir.is_dir() {
                for entry in fs::read_dir(dir)? {
                    let entry = entry?;
                    let path = entry.path();

                    if path.is_dir() {
                        // Skip hidden folders and .bismuth
                        if let Some(name) = path.file_name() {
                            let name_str = name.to_string_lossy();
                            if name_str.starts_with('.') {
                                continue;
                            }
                        }

                        if let Ok(relative) = path.strip_prefix(base) {
                            folders.push(relative.to_string_lossy().to_string());
                        }

                        collect_folders(&path, base, folders)?;
                    }
                }
            }
            Ok(())
        }

        collect_folders(vault_path, vault_path, &mut folders)?;
        Ok(folders)
    }

    /// Lists all `.md` notes in a specific folder (non-recursive).
    pub fn list_notes_in_folder(
        vault_path: &Path,
        folder_path: &str,
        vault: &Vault,
        operations: &VaultOperations,
    ) -> Result<Vec<Note>> {
        use crate::utils::path::validate_path;

        let folder = vault_path.join(folder_path);
        validate_path(&folder, vault_path)?;
        let mut notes = Vec::new();

        if folder.is_dir() {
            for entry in fs::read_dir(&folder)? {
                let entry = entry?;
                let path = entry.path();

                if path.is_file() {
                    if let Some(ext) = path.extension() {
                        if ext == "md" {
                            if let Ok(note) = operations.get_note(&path, vault) {
                                notes.push(note);
                            }
                        }
                    }
                }
            }
        }

        Ok(notes)
    }
}
