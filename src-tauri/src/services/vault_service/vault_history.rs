use crate::error::Result;
use crate::models::Vault;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::{self, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub timestamp: DateTime<Utc>,
    pub content: String,
}

pub struct HistoryService;

impl HistoryService {
    pub fn append_history(vault: &Vault, path: &Path, content: &str) -> Result<()> {
        let history_dir = vault.root_path.join(".bismuth/history");
        fs::create_dir_all(&history_dir)?;

        let hash = Self::hash_path(path);
        let history_file = history_dir.join(format!("{}.jsonl", hash));

        let entry = HistoryEntry {
            timestamp: Utc::now(),
            content: content.to_string(),
        };

        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&history_file)?;

        let json_line = serde_json::to_string(&entry)?;
        writeln!(file, "{}", json_line)?;

        Ok(())
    }

    pub fn get_history(vault: &Vault, path: &Path) -> Result<Vec<HistoryEntry>> {
        let history_dir = vault.root_path.join(".bismuth/history");
        let hash = Self::hash_path(path);
        let history_file = history_dir.join(format!("{}.jsonl", hash));

        if !history_file.exists() {
            return Ok(Vec::new());
        }

        let file = fs::File::open(&history_file)?;
        let reader = BufReader::new(file);

        let mut entries = Vec::new();
        for line in reader.lines() {
            let line = line?;
            if let Ok(entry) = serde_json::from_str::<HistoryEntry>(&line) {
                entries.push(entry);
            }
        }

        entries.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

        Ok(entries)
    }

    pub fn restore_version(
        vault: &Vault,
        path: &Path,
        timestamp: DateTime<Utc>,
    ) -> Result<String> {
        let entries = Self::get_history(vault, path)?;

        let entry = entries
            .iter()
            .find(|e| e.timestamp == timestamp)
            .ok_or_else(|| {
                crate::error::BismuthError::NotFound(format!(
                    "History entry not found for timestamp: {}",
                    timestamp
                ))
            })?;

        fs::write(path, &entry.content)?;

        Ok(entry.content.clone())
    }

    fn hash_path(path: &Path) -> String {
        let mut hasher = Sha256::new();
        hasher.update(path.to_string_lossy().as_bytes());
        format!("{:x}", hasher.finalize())
    }
}
