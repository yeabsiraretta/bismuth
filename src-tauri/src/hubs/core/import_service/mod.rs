mod evernote;
mod logseq;
mod markdown;
mod notion;
mod obsidian;
mod roam;

use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::infrastructure::error::{AppError, AppResult};
use crate::infrastructure::state::{self, AppState};

// ── Types ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ImportResult {
    pub success: u32,
    pub failed: u32,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub(crate) enum ImportSource {
    Markdown,
    Obsidian,
    Notion,
    Roam,
    Evernote,
    Logseq,
}

// ── Public API ──────────────────────────────────────────────────────────────

pub(crate) fn import_notes(
    state: &AppState,
    source: ImportSource,
    source_path: &str,
) -> AppResult<ImportResult> {
    let vault_root = state.vault_root()?;

    let src = Path::new(source_path);
    if !src.exists() {
        return Err(AppError::Custom(format!(
            "Source path does not exist: {source_path}"
        )));
    }

    tracing::info!(
        source = ?source,
        source_path,
        vault = ?vault_root,
        "Starting import"
    );

    match source {
        ImportSource::Markdown => markdown::import_markdown(src, &vault_root),
        ImportSource::Obsidian => obsidian::import_obsidian(src, &vault_root),
        ImportSource::Notion => notion::import_notion(src, &vault_root),
        ImportSource::Roam => roam::import_roam(src, &vault_root),
        ImportSource::Evernote => evernote::import_evernote(src, &vault_root),
        ImportSource::Logseq => logseq::import_logseq(src, &vault_root),
    }
}

// ── Shared helpers ─────────────────────────────────────────────────────────

fn ensure_parent(path: &Path) -> AppResult<()> {
    state::ensure_parent(path)
}

fn collect_files(dir: &Path, extensions: &[&str]) -> Vec<PathBuf> {
    let mut files = Vec::new();
    collect_files_recursive(dir, extensions, &mut files);
    files
}

fn collect_files_recursive(dir: &Path, extensions: &[&str], out: &mut Vec<PathBuf>) {
    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
            if !name.starts_with('.') {
                collect_files_recursive(&path, extensions, out);
            }
        } else if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            if extensions.iter().any(|&e| e.eq_ignore_ascii_case(ext)) {
                out.push(path);
            }
        }
    }
}

fn relative_dest(source_root: &Path, file: &Path, vault_root: &Path) -> PathBuf {
    let rel = file.strip_prefix(source_root).unwrap_or(file);
    vault_root.join(rel)
}

fn copy_file(src: &Path, dest: &Path) -> AppResult<()> {
    ensure_parent(dest)?;
    fs::copy(src, dest)?;
    Ok(())
}

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
            _ => c,
        })
        .collect()
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
    fn test_import_markdown_copies_files() {
        let src_dir = TempDir::new().unwrap();
        let vault_dir = TempDir::new().unwrap();
        let state = setup_state(vault_dir.path());

        fs::write(src_dir.path().join("note1.md"), "# Hello\nWorld").unwrap();
        fs::write(src_dir.path().join("note2.txt"), "Plain text").unwrap();

        let result = import_notes(
            &state,
            ImportSource::Markdown,
            &src_dir.path().to_string_lossy(),
        )
        .unwrap();

        assert_eq!(result.success, 2);
        assert_eq!(result.failed, 0);
        assert!(vault_dir.path().join("note1.md").exists());
        assert!(vault_dir.path().join("note2.md").exists()); // .txt → .md
    }

    #[test]
    fn test_import_obsidian_converts_wikilinks() {
        let src_dir = TempDir::new().unwrap();
        let vault_dir = TempDir::new().unwrap();
        let state = setup_state(vault_dir.path());

        fs::write(
            src_dir.path().join("test.md"),
            "Link to [[Other Note]] and [[Page|Display]]",
        )
        .unwrap();

        let result = import_notes(
            &state,
            ImportSource::Obsidian,
            &src_dir.path().to_string_lossy(),
        )
        .unwrap();

        assert_eq!(result.success, 1);
        let content = fs::read_to_string(vault_dir.path().join("test.md")).unwrap();
        assert!(content.contains("[Other Note](Other Note.md)"));
        assert!(content.contains("[Display](Page.md)"));
    }

    #[test]
    fn test_import_roam_json() {
        let src_dir = TempDir::new().unwrap();
        let vault_dir = TempDir::new().unwrap();
        let state = setup_state(vault_dir.path());

        let roam_json = r#"[
            {
                "title": "My Page",
                "children": [
                    {"string": "First block", "children": [
                        {"string": "Nested block"}
                    ]},
                    {"string": "Second block"}
                ]
            }
        ]"#;
        fs::write(src_dir.path().join("export.json"), roam_json).unwrap();

        let result = import_notes(
            &state,
            ImportSource::Roam,
            &src_dir.path().to_string_lossy(),
        )
        .unwrap();

        assert_eq!(result.success, 1);
        let content = fs::read_to_string(vault_dir.path().join("My Page.md")).unwrap();
        assert!(content.contains("# My Page"));
        assert!(content.contains("- First block"));
        assert!(content.contains("  - Nested block"));
    }

    #[test]
    fn test_import_evernote_enex() {
        let src_dir = TempDir::new().unwrap();
        let vault_dir = TempDir::new().unwrap();
        let state = setup_state(vault_dir.path());

        let enex = r#"<?xml version="1.0" encoding="UTF-8"?>
<en-export>
  <note>
    <title>Test Note</title>
    <content><![CDATA[<p>Hello <b>world</b></p>]]></content>
  </note>
</en-export>"#;
        fs::write(src_dir.path().join("export.enex"), enex).unwrap();

        let result = import_notes(
            &state,
            ImportSource::Evernote,
            &src_dir.path().to_string_lossy(),
        )
        .unwrap();

        assert_eq!(result.success, 1);
        let content = fs::read_to_string(vault_dir.path().join("Test Note.md")).unwrap();
        assert!(content.contains("# Test Note"));
        assert!(content.contains("**world**"));
    }

    #[test]
    fn test_import_logseq_converts_wikilinks() {
        let src_dir = TempDir::new().unwrap();
        let pages_dir = src_dir.path().join("pages");
        fs::create_dir(&pages_dir).unwrap();
        let vault_dir = TempDir::new().unwrap();
        let state = setup_state(vault_dir.path());

        fs::write(
            pages_dir.join("test.md"),
            "- Link to [[Other Page]]\n- Regular text",
        )
        .unwrap();

        let result = import_notes(
            &state,
            ImportSource::Logseq,
            &src_dir.path().to_string_lossy(),
        )
        .unwrap();

        assert_eq!(result.success, 1);
        let content = fs::read_to_string(vault_dir.path().join("test.md")).unwrap();
        assert!(content.contains("[Other Page](Other Page.md)"));
    }

    #[test]
    fn test_sanitize_filename() {
        assert_eq!(sanitize_filename("Hello/World"), "Hello_World");
        assert_eq!(sanitize_filename("test:note"), "test_note");
        assert_eq!(sanitize_filename("normal"), "normal");
    }

    #[test]
    fn test_html_to_markdown() {
        let html = "<h1>Title</h1><p>Hello <b>bold</b> and <em>italic</em></p>";
        let md = notion::html_to_markdown(html);
        assert!(md.contains("# Title"));
        assert!(md.contains("**bold**"));
        assert!(md.contains("*italic*"));
    }

    #[test]
    fn test_no_vault_open() {
        let state = AppState::default();
        let result = import_notes(&state, ImportSource::Markdown, "/tmp/test");
        assert!(result.is_err());
    }
}
