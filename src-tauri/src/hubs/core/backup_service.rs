use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

use serde::{Deserialize, Serialize};

use crate::infrastructure::error::{AppError, AppResult};
use crate::infrastructure::state::AppState;

// ── Types ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupInfo {
    pub path: String,
    pub size_bytes: u64,
    pub created_at: u64,
    pub note_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupListResult {
    pub backups: Vec<BackupInfo>,
}

// ── Helpers ─────────────────────────────────────────────────────────────────

fn backup_dir(vault_root: &Path) -> PathBuf {
    vault_root.join(".bismuth").join("backups")
}

fn collect_vault_files(dir: &Path, root: &Path, out: &mut Vec<PathBuf>) {
    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };
    for entry in entries.flatten() {
        let path = entry.path();
        let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
        if name.starts_with('.') {
            continue;
        }
        if path.is_dir() {
            collect_vault_files(&path, root, out);
        } else {
            out.push(path);
        }
    }
}

// ── Public API ──────────────────────────────────────────────────────────────

pub fn create_backup(state: &AppState) -> AppResult<BackupInfo> {
    let root = state.vault_root()?;
    let bak_dir = backup_dir(&root);
    fs::create_dir_all(&bak_dir)?;

    let now = std::time::SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let timestamp = now.as_secs();
    let filename = format!("backup-{timestamp}.zip");
    let zip_path = bak_dir.join(&filename);

    let mut files = Vec::new();
    collect_vault_files(&root, &root, &mut files);

    let file = fs::File::create(&zip_path)?;
    let mut zip = ZipWriter::new(file);
    let options = ZipOptions::default();

    let mut note_count = 0u32;
    for f in &files {
        let rel = f.strip_prefix(&root).unwrap_or(f);
        let name = rel.to_string_lossy().to_string();
        let content = fs::read(f)?;
        zip.start_file(&name, options)?;
        zip.write_all(&content)?;
        if name.ends_with(".md") {
            note_count += 1;
        }
    }
    zip.finish()?;

    let size_bytes = fs::metadata(&zip_path)?.len();

    tracing::info!(
        path = %zip_path.display(),
        note_count,
        size_bytes,
        "Backup created"
    );

    Ok(BackupInfo {
        path: zip_path.to_string_lossy().to_string(),
        size_bytes,
        created_at: timestamp * 1000,
        note_count,
    })
}

pub fn list_backups(state: &AppState) -> AppResult<BackupListResult> {
    let root = state.vault_root()?;
    let bak_dir = backup_dir(&root);

    if !bak_dir.exists() {
        return Ok(BackupListResult {
            backups: Vec::new(),
        });
    }

    let mut backups = Vec::new();
    for entry in fs::read_dir(&bak_dir)?.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("zip") {
            continue;
        }
        let meta = fs::metadata(&path)?;
        let created_at = meta
            .created()
            .ok()
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);

        backups.push(BackupInfo {
            path: path.to_string_lossy().to_string(),
            size_bytes: meta.len(),
            created_at,
            note_count: 0,
        });
    }

    backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(BackupListResult { backups })
}

pub fn delete_backup(state: &AppState, backup_path: &str) -> AppResult<()> {
    let root = state.vault_root()?;
    let bak_dir = backup_dir(&root);
    let path = Path::new(backup_path);

    // Safety: only delete files within the backup directory
    if !path.starts_with(&bak_dir) {
        return Err(AppError::Custom("Path is not in backup directory".into()));
    }
    fs::remove_file(path)?;
    tracing::info!(path = backup_path, "Backup deleted");
    Ok(())
}

// ── Minimal zip writer (no external crate needed) ───────────────────────────

struct ZipWriter<W: Write> {
    writer: W,
    entries: Vec<ZipEntry>,
    offset: u32,
}

#[derive(Clone, Copy, Default)]
struct ZipOptions;

struct ZipEntry {
    name: String,
    offset: u32,
    compressed_size: u32,
    uncompressed_size: u32,
    crc32: u32,
}

impl<W: Write> ZipWriter<W> {
    fn new(writer: W) -> Self {
        Self {
            writer,
            entries: Vec::new(),
            offset: 0,
        }
    }

    fn start_file(&mut self, name: &str, _options: ZipOptions) -> io::Result<()> {
        self.entries.push(ZipEntry {
            name: name.to_string(),
            offset: self.offset,
            compressed_size: 0,
            uncompressed_size: 0,
            crc32: 0,
        });
        // Placeholder — written fully in write_all
        Ok(())
    }

    fn write_all(&mut self, data: &[u8]) -> io::Result<()> {
        let entry = self.entries.last_mut().unwrap();
        let crc = crc32(data);
        let size = data.len() as u32;
        entry.compressed_size = size;
        entry.uncompressed_size = size;
        entry.crc32 = crc;

        let name_bytes = entry.name.as_bytes();
        let name_len = name_bytes.len() as u16;

        // Local file header
        self.writer.write_all(&0x04034b50u32.to_le_bytes())?; // signature
        self.writer.write_all(&20u16.to_le_bytes())?; // version needed
        self.writer.write_all(&0u16.to_le_bytes())?; // flags
        self.writer.write_all(&0u16.to_le_bytes())?; // compression (stored)
        self.writer.write_all(&0u16.to_le_bytes())?; // mod time
        self.writer.write_all(&0u16.to_le_bytes())?; // mod date
        self.writer.write_all(&crc.to_le_bytes())?; // crc32
        self.writer.write_all(&size.to_le_bytes())?; // compressed
        self.writer.write_all(&size.to_le_bytes())?; // uncompressed
        self.writer.write_all(&name_len.to_le_bytes())?; // name len
        self.writer.write_all(&0u16.to_le_bytes())?; // extra len
        self.writer.write_all(name_bytes)?;
        self.writer.write_all(data)?;

        self.offset += 30 + name_len as u32 + size;
        Ok(())
    }

    fn finish(mut self) -> io::Result<()> {
        let cd_offset = self.offset;
        let mut cd_size = 0u32;

        for entry in &self.entries {
            let name_bytes = entry.name.as_bytes();
            let name_len = name_bytes.len() as u16;

            // Central directory header
            self.writer.write_all(&0x02014b50u32.to_le_bytes())?;
            self.writer.write_all(&20u16.to_le_bytes())?; // version made by
            self.writer.write_all(&20u16.to_le_bytes())?; // version needed
            self.writer.write_all(&0u16.to_le_bytes())?; // flags
            self.writer.write_all(&0u16.to_le_bytes())?; // compression
            self.writer.write_all(&0u16.to_le_bytes())?; // mod time
            self.writer.write_all(&0u16.to_le_bytes())?; // mod date
            self.writer.write_all(&entry.crc32.to_le_bytes())?;
            self.writer.write_all(&entry.compressed_size.to_le_bytes())?;
            self.writer.write_all(&entry.uncompressed_size.to_le_bytes())?;
            self.writer.write_all(&name_len.to_le_bytes())?;
            self.writer.write_all(&0u16.to_le_bytes())?; // extra len
            self.writer.write_all(&0u16.to_le_bytes())?; // comment len
            self.writer.write_all(&0u16.to_le_bytes())?; // disk start
            self.writer.write_all(&0u16.to_le_bytes())?; // internal attrs
            self.writer.write_all(&0u32.to_le_bytes())?; // external attrs
            self.writer.write_all(&entry.offset.to_le_bytes())?;
            self.writer.write_all(name_bytes)?;

            cd_size += 46 + name_len as u32;
        }

        let entry_count = self.entries.len() as u16;

        // End of central directory
        self.writer.write_all(&0x06054b50u32.to_le_bytes())?;
        self.writer.write_all(&0u16.to_le_bytes())?; // disk number
        self.writer.write_all(&0u16.to_le_bytes())?; // disk with CD
        self.writer.write_all(&entry_count.to_le_bytes())?;
        self.writer.write_all(&entry_count.to_le_bytes())?;
        self.writer.write_all(&cd_size.to_le_bytes())?;
        self.writer.write_all(&cd_offset.to_le_bytes())?;
        self.writer.write_all(&0u16.to_le_bytes())?; // comment len

        Ok(())
    }
}

fn crc32(data: &[u8]) -> u32 {
    let mut crc = 0xFFFF_FFFFu32;
    for &byte in data {
        crc ^= byte as u32;
        for _ in 0..8 {
            if crc & 1 != 0 {
                crc = (crc >> 1) ^ 0xEDB8_8320;
            } else {
                crc >>= 1;
            }
        }
    }
    !crc
}

// ── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn setup_state(vault_dir: &Path) -> AppState {
        let state = AppState::default();
        {
            let mut guard = state.vault.write().unwrap();
            guard.path = Some(vault_dir.to_string_lossy().to_string());
            guard.name = Some("test-vault".into());
        }
        state
    }

    #[test]
    fn test_create_and_list_backups() {
        let vault_dir = TempDir::new().unwrap();
        fs::write(vault_dir.path().join("note1.md"), "# Test").unwrap();
        fs::write(vault_dir.path().join("note2.md"), "# Test 2").unwrap();
        let state = setup_state(vault_dir.path());

        let info = create_backup(&state).unwrap();
        assert_eq!(info.note_count, 2);
        assert!(info.size_bytes > 0);
        assert!(Path::new(&info.path).exists());

        let list = list_backups(&state).unwrap();
        assert_eq!(list.backups.len(), 1);
    }

    #[test]
    fn test_delete_backup() {
        let vault_dir = TempDir::new().unwrap();
        fs::write(vault_dir.path().join("test.md"), "hello").unwrap();
        let state = setup_state(vault_dir.path());

        let info = create_backup(&state).unwrap();
        assert!(Path::new(&info.path).exists());

        delete_backup(&state, &info.path).unwrap();
        assert!(!Path::new(&info.path).exists());
    }

    #[test]
    fn test_list_empty() {
        let vault_dir = TempDir::new().unwrap();
        let state = setup_state(vault_dir.path());
        let list = list_backups(&state).unwrap();
        assert!(list.backups.is_empty());
    }

    #[test]
    fn test_crc32_known() {
        assert_eq!(crc32(b""), 0x0000_0000);
        assert_eq!(crc32(b"hello"), 0x3610_A686);
    }
}
