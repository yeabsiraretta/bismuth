//! NAS sync journal — read, append, compact, and replay operations.
//!
//! All journal entries are stored as JSONL in `.bismuth/nas-journal.jsonl`.

use super::sync::{safe_canonicalize, ChangeJournalEntry, SyncError};
use std::path::Path;

/// Journal compaction threshold — lines.
pub(super) const JOURNAL_MAX_LINES: usize = 1000;

/// Journal compaction threshold — bytes.
pub(super) const JOURNAL_MAX_BYTES: u64 = 100 * 1024;

/// Read the change journal from `.bismuth/nas-journal.jsonl`.
/// Returns empty Vec if file does not exist.
pub fn read_journal(local_root: &Path) -> Result<Vec<ChangeJournalEntry>, SyncError> {
    let journal_path = local_root.join(".bismuth").join("nas-journal.jsonl");
    if !journal_path.exists() {
        return Ok(Vec::new());
    }
    let content = std::fs::read_to_string(&journal_path)?;
    let mut entries = Vec::new();
    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() { continue; }
        let entry: ChangeJournalEntry = serde_json::from_str(line)?;
        entries.push(entry);
    }
    Ok(entries)
}

/// Append one entry to the change journal, triggering compaction if needed.
pub fn append_journal(
    local_root: &Path,
    entry: ChangeJournalEntry,
) -> Result<(), SyncError> {
    let bismuth_dir = local_root.join(".bismuth");
    std::fs::create_dir_all(&bismuth_dir)?;
    let journal_path = bismuth_dir.join("nas-journal.jsonl");

    let line = serde_json::to_string(&entry)? + "\n";
    use std::io::Write;
    let mut file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&journal_path)?;
    file.write_all(line.as_bytes())?;
    drop(file);

    // Compaction: rewrite with only unsynced entries if file exceeds threshold
    let meta = std::fs::metadata(&journal_path)?;
    let line_count = std::fs::read_to_string(&journal_path)?
        .lines()
        .filter(|l| !l.trim().is_empty())
        .count();

    if line_count > JOURNAL_MAX_LINES || meta.len() > JOURNAL_MAX_BYTES {
        compact_journal(local_root)?;
    }

    Ok(())
}

/// Compact the journal: rewrite file keeping only `synced: false` entries.
pub(super) fn compact_journal(local_root: &Path) -> Result<(), SyncError> {
    let journal_path = local_root.join(".bismuth").join("nas-journal.jsonl");
    let entries = read_journal(local_root)?;
    let unsynced: Vec<&ChangeJournalEntry> = entries.iter().filter(|e| !e.synced).collect();

    let mut content = String::new();
    for e in &unsynced {
        content.push_str(&serde_json::to_string(e)?);
        content.push('\n');
    }
    // Final comment line documenting the compaction
    content.push_str(&format!(
        "{{\"_compacted_at\":\"{}\",\"retained\":{}}}\n",
        chrono::Utc::now().to_rfc3339(),
        unsynced.len()
    ));

    std::fs::write(&journal_path, content)?;
    Ok(())
}

/// Replay all unsynced journal entries against the WebDAV server.
/// Marks each entry as synced and rewrites the journal after full replay.
pub async fn replay_journal(
    client: &crate::services::nas_service::webdav_client::WebDavClient,
    local_root: &Path,
) -> Result<(), SyncError> {
    let mut entries = read_journal(local_root)?;
    let bismuth_dir = local_root.join(".bismuth");
    let cache_root = bismuth_dir.join("nas-cache");

    for entry in entries.iter_mut() {
        if entry.synced { continue; }

        let result = match entry.op.as_str() {
            "put" => {
                let local_path = cache_root.join(&entry.path);
                let canonical = safe_canonicalize(&cache_root, &local_path)
                    .map_err(|e| SyncError::Io(std::io::Error::new(std::io::ErrorKind::Other, format!("{e}"))))?;
                let data = std::fs::read(&canonical)?;
                client
                    .put(&entry.path, data, "application/octet-stream")
                    .await
                    .map_err(SyncError::from)
            }
            "delete" => client.delete(&entry.path).await.map_err(SyncError::from),
            "move" => {
                let dst = entry.dest_path.as_deref().unwrap_or(&entry.path);
                client.move_resource(&entry.path, dst, true).await.map_err(SyncError::from)
            }
            _ => Ok(()),
        };

        if result.is_ok() {
            entry.synced = true;
        }
    }

    // Rewrite journal with updated synced flags
    let journal_path = bismuth_dir.join("nas-journal.jsonl");
    let mut content = String::new();
    for e in &entries {
        content.push_str(&serde_json::to_string(e)?);
        content.push('\n');
    }
    std::fs::write(&journal_path, content)?;

    Ok(())
}
