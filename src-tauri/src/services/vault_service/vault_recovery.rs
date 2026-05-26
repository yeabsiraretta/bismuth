use crate::error::Result;
use crate::models::Vault;
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

pub struct RecoveryService;

impl RecoveryService {
    pub fn save_recovery_file(vault: &Vault, path: &Path, content: &str) -> Result<()> {
        let recovery_dir = vault.root_path.join(".bismuth/recovery");
        fs::create_dir_all(&recovery_dir)?;

        let hash = Self::hash_path(path);
        let recovery_path = recovery_dir.join(format!("{}.tmp", hash));

        fs::write(&recovery_path, content)?;
        Ok(())
    }

    pub fn check_recovery_files(vault: &Vault) -> Result<Vec<RecoveryEntry>> {
        let recovery_dir = vault.root_path.join(".bismuth/recovery");
        
        if !recovery_dir.exists() {
            return Ok(Vec::new());
        }

        let mut entries = Vec::new();

        for entry in fs::read_dir(&recovery_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.extension().and_then(|s| s.to_str()) == Some("tmp") {
                if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                    if let Some(original_path) = Self::find_original_path(vault, stem) {
                        let recovery_time = Self::get_modified_time(&path)?;
                        let original_time = if original_path.exists() {
                            Self::get_modified_time(&original_path)?
                        } else {
                            SystemTime::UNIX_EPOCH
                        };

                        if recovery_time > original_time {
                            let content = fs::read_to_string(&path)?;
                            entries.push(RecoveryEntry {
                                original_path,
                                recovery_path: path,
                                content,
                                recovery_time,
                            });
                        }
                    }
                }
            }
        }

        Ok(entries)
    }

    pub fn restore_from_recovery(entry: &RecoveryEntry) -> Result<()> {
        if let Some(parent) = entry.original_path.parent() {
            fs::create_dir_all(parent)?;
        }

        fs::write(&entry.original_path, &entry.content)?;
        fs::remove_file(&entry.recovery_path)?;
        Ok(())
    }

    pub fn clear_recovery_file(recovery_path: &Path) -> Result<()> {
        if recovery_path.exists() {
            fs::remove_file(recovery_path)?;
        }
        Ok(())
    }

    fn hash_path(path: &Path) -> String {
        let mut hasher = Sha256::new();
        hasher.update(path.to_string_lossy().as_bytes());
        format!("{:x}", hasher.finalize())
    }

    fn find_original_path(vault: &Vault, hash: &str) -> Option<PathBuf> {
        Self::scan_for_hash(&vault.root_path, hash)
    }

    fn scan_for_hash(dir: &Path, target_hash: &str) -> Option<PathBuf> {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();

                if path.is_dir() && !path.ends_with(".bismuth") {
                    if let Some(found) = Self::scan_for_hash(&path, target_hash) {
                        return Some(found);
                    }
                } else if path.extension().and_then(|s| s.to_str()) == Some("md") {
                    let hash = Self::hash_path(&path);
                    if hash == target_hash {
                        return Some(path);
                    }
                }
            }
        }
        None
    }

    fn get_modified_time(path: &Path) -> Result<SystemTime> {
        let metadata = fs::metadata(path)?;
        Ok(metadata.modified()?)
    }
}

pub struct RecoveryEntry {
    pub original_path: PathBuf,
    pub recovery_path: PathBuf,
    pub content: String,
    pub recovery_time: SystemTime,
}
