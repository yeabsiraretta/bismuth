use std::collections::{HashMap, HashSet};
use std::fs;

use regex::Regex;
use serde::{Deserialize, Serialize};

use crate::infrastructure::error::AppResult;
use crate::infrastructure::state::AppState;

use super::vault_service;

// ── Types ────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct VaultStats {
    pub notes: usize,
    pub folders: usize,
    pub attachments: usize,
    pub total_files: usize,
    pub total_words: usize,
    pub total_chars: usize,
    pub total_size: u64,
    pub total_links: usize,
    pub orphan_notes: usize,
    pub avg_words_per_note: usize,
    pub avg_links_per_note: f64,
    pub tags: Vec<TagCount>,
    pub file_types: Vec<FileTypeCount>,
    pub longest_note: Option<NoteStatEntry>,
    pub shortest_note: Option<NoteStatEntry>,
    pub newest_note: Option<NoteStatEntry>,
    pub oldest_note: Option<NoteStatEntry>,
    pub last_modified: Option<NoteStatEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct NoteStatEntry {
    pub path: String,
    pub title: String,
    pub value: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct TagCount {
    pub tag: String,
    pub count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct FileTypeCount {
    pub ext: String,
    pub count: usize,
    pub size: u64,
}

// ── Regex helpers (compiled once via OnceLock) ───────────────────────────────

macro_rules! cached_regex {
    ($name:ident, $pattern:expr) => {
        fn $name() -> &'static Regex {
            use std::sync::OnceLock;
            static RE: OnceLock<Regex> = OnceLock::new();
            RE.get_or_init(|| Regex::new($pattern).unwrap())
        }
    };
}

cached_regex!(comment_re, r"%%[\s\S]*?%%|<!--[\s\S]*?-->");
cached_regex!(code_block_re, r"```[\s\S]*?```");
cached_regex!(fm_re, r"(?s)^---\s*\n.*?\n---");
cached_regex!(word_re, r"\S+");
cached_regex!(wikilink_re, r"\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]+)?\]\]");
cached_regex!(md_link_re, r"\[([^\]]+)\]\([^)]+\)");
cached_regex!(tag_inline_re, r"(?:^|\s)#([a-zA-Z][a-zA-Z0-9_/-]*)");
cached_regex!(fm_tags_re, r"(?m)^tags:\s*(.+)");

// ── Text analysis ────────────────────────────────────────────────────────────

fn strip_comments(content: &str) -> String {
    comment_re().replace_all(content, "").to_string()
}

pub(crate) fn count_words(content: &str) -> usize {
    let cleaned = strip_comments(content);
    let cleaned = code_block_re().replace_all(&cleaned, "");
    let cleaned = fm_re().replace_all(&cleaned, "");
    word_re().find_iter(&cleaned).count()
}

pub(crate) fn count_chars(content: &str) -> usize {
    let cleaned = strip_comments(content);
    let cleaned = fm_re().replace_all(&cleaned, "");
    cleaned.chars().filter(|c| !c.is_whitespace()).count()
}

pub(crate) fn extract_links(content: &str) -> Vec<String> {
    let mut links = Vec::new();
    for cap in wikilink_re().captures_iter(content) {
        if let Some(m) = cap.get(1) {
            links.push(m.as_str().trim().to_lowercase());
        }
    }
    for cap in md_link_re().captures_iter(content) {
        if let Some(m) = cap.get(1) {
            links.push(m.as_str().trim().to_lowercase());
        }
    }
    links
}

pub(crate) fn extract_tags(content: &str) -> Vec<String> {
    let mut tags = Vec::new();
    let cleaned = strip_comments(content);
    let cleaned = code_block_re().replace_all(&cleaned, "");

    // Frontmatter tags
    if let Some(fm_cap) = fm_re().find(&cleaned) {
        let fm_text = fm_cap.as_str();
        if let Some(tag_cap) = fm_tags_re().captures(fm_text) {
            let tag_line = tag_cap.get(1).map(|m| m.as_str()).unwrap_or("");
            let trimmed = tag_line.trim();
            if trimmed.starts_with('[') && trimmed.ends_with(']') {
                for t in trimmed[1..trimmed.len() - 1].split(',') {
                    let t = t.trim().trim_matches(|c| c == '"' || c == '\'');
                    if !t.is_empty() {
                        tags.push(t.to_string());
                    }
                }
            } else {
                for t in trimmed.split(',') {
                    let t = t.trim();
                    if !t.is_empty() {
                        tags.push(t.to_string());
                    }
                }
            }
        }
    }

    // Inline #tags
    for cap in tag_inline_re().captures_iter(&cleaned) {
        if let Some(m) = cap.get(1) {
            tags.push(m.as_str().to_string());
        }
    }

    tags
}

// ── File classification ──────────────────────────────────────────────────────

const NOTE_EXTS: &[&str] = &["md", "markdown", "txt"];
const ATTACHMENT_EXTS: &[&str] = &[
    "png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico",
    "pdf", "mp3", "mp4", "wav", "ogg", "webm", "mov",
    "zip", "tar", "gz", "csv", "json", "xml",
];

fn get_extension(path: &str) -> String {
    path.rsplit('.').next().unwrap_or("").to_lowercase()
}

fn is_note(path: &str) -> bool {
    NOTE_EXTS.contains(&get_extension(path).as_str())
}

fn is_attachment(path: &str) -> bool {
    ATTACHMENT_EXTS.contains(&get_extension(path).as_str())
}

fn extract_folders(paths: &[String]) -> HashSet<String> {
    let mut dirs = HashSet::new();
    for p in paths {
        let parts: Vec<&str> = p.split('/').collect();
        for i in 1..parts.len() {
            dirs.insert(parts[..i].join("/"));
        }
    }
    dirs
}

// ── Main computation ─────────────────────────────────────────────────────────

pub(crate) fn compute_vault_stats(state: &AppState) -> AppResult<VaultStats> {
    let root = state.vault_root()?;
    let root_path = root.as_path();
    let all_notes = vault_service::scan_vault(state)?;

    let mut total_words: usize = 0;
    let mut total_chars: usize = 0;
    let mut total_links: usize = 0;
    let mut total_size: u64 = 0;
    let mut attachments: usize = 0;
    let mut tag_map: HashMap<String, usize> = HashMap::new();
    let mut ext_map: HashMap<String, (usize, u64)> = HashMap::new();
    let mut linked_names: HashSet<String> = HashSet::new();
    let mut all_note_names: HashMap<String, String> = HashMap::new();

    let mut longest_note: Option<NoteStatEntry> = None;
    let mut shortest_note: Option<NoteStatEntry> = None;
    let mut newest_note: Option<NoteStatEntry> = None;
    let mut oldest_note: Option<NoteStatEntry> = None;
    let mut last_modified: Option<NoteStatEntry> = None;

    for note in &all_notes {
        total_size += note.size;

        let ext = get_extension(&note.path);
        let entry = ext_map.entry(ext).or_insert((0, 0));
        entry.0 += 1;
        entry.1 += note.size;

        if !is_note(&note.path) {
            if is_attachment(&note.path) {
                attachments += 1;
            }
            continue;
        }

        let name = note.path.rsplit('/').next().unwrap_or(&note.path)
            .trim_end_matches(".md").to_lowercase();
        all_note_names.insert(name, note.path.clone());

        let full_path = root_path.join(&note.path);
        if let Ok(content) = fs::read_to_string(&full_path) {
            let wc = count_words(&content);
            let cc = count_chars(&content);
            total_words += wc;
            total_chars += cc;

            let links = extract_links(&content);
            total_links += links.len();
            for l in &links {
                linked_names.insert(l.clone());
            }

            let tags = extract_tags(&content);
            for t in &tags {
                *tag_map.entry(t.clone()).or_insert(0) += 1;
            }

            match &longest_note {
                Some(e) if wc as u64 <= e.value => {}
                _ => longest_note = Some(NoteStatEntry {
                    path: note.path.clone(), title: note.title.clone(), value: wc as u64,
                }),
            }
            match &shortest_note {
                Some(e) if wc as u64 >= e.value => {}
                _ => shortest_note = Some(NoteStatEntry {
                    path: note.path.clone(), title: note.title.clone(), value: wc as u64,
                }),
            }
        }

        match &newest_note {
            Some(e) if note.created_at <= e.value => {}
            _ => newest_note = Some(NoteStatEntry {
                path: note.path.clone(), title: note.title.clone(), value: note.created_at,
            }),
        }
        match &oldest_note {
            Some(e) if note.created_at >= e.value => {}
            _ => oldest_note = Some(NoteStatEntry {
                path: note.path.clone(), title: note.title.clone(), value: note.created_at,
            }),
        }
        match &last_modified {
            Some(e) if note.modified_at <= e.value => {}
            _ => last_modified = Some(NoteStatEntry {
                path: note.path.clone(), title: note.title.clone(), value: note.modified_at,
            }),
        }
    }

    let note_count = all_note_names.len();
    let mut orphan_notes = 0;
    for name in all_note_names.keys() {
        if !linked_names.contains(name) {
            orphan_notes += 1;
        }
    }

    let folders = extract_folders(&all_notes.iter().map(|n| n.path.clone()).collect::<Vec<_>>());

    let mut tags: Vec<TagCount> = tag_map.into_iter()
        .map(|(tag, count)| TagCount { tag, count })
        .collect();
    tags.sort_by_key(|t| std::cmp::Reverse(t.count));

    let mut file_types: Vec<FileTypeCount> = ext_map.into_iter()
        .map(|(ext, (count, size))| FileTypeCount { ext, count, size })
        .collect();
    file_types.sort_by_key(|f| std::cmp::Reverse(f.count));

    Ok(VaultStats {
        notes: note_count,
        folders: folders.len(),
        attachments,
        total_files: all_notes.len(),
        total_words,
        total_chars,
        total_size,
        total_links,
        orphan_notes,
        avg_words_per_note: total_words.checked_div(note_count).unwrap_or(0),
        avg_links_per_note: if note_count > 0 {
            ((total_links as f64 / note_count as f64) * 10.0).round() / 10.0
        } else {
            0.0
        },
        tags,
        file_types,
        longest_note,
        shortest_note,
        newest_note,
        oldest_note,
        last_modified,
    })
}

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn count_words_basic() {
        assert_eq!(count_words("hello world foo"), 3);
    }

    #[test]
    fn count_words_strips_comments() {
        assert_eq!(count_words("hello %% hidden %% world"), 2);
    }

    #[test]
    fn count_words_strips_code_blocks() {
        assert_eq!(count_words("hello\n```\ncode block\n```\nworld"), 2);
    }

    #[test]
    fn count_words_strips_frontmatter() {
        assert_eq!(count_words("---\ntitle: test\n---\nhello world"), 2);
    }

    #[test]
    fn count_chars_excludes_whitespace() {
        assert_eq!(count_chars("a b c"), 3);
    }

    #[test]
    fn extract_links_wikilinks() {
        let links = extract_links("see [[Page One]] and [[Page Two|alias]]");
        assert_eq!(links, vec!["page one", "page two"]);
    }

    #[test]
    fn extract_links_md_links() {
        let links = extract_links("see [Link](url.md)");
        assert_eq!(links, vec!["link"]);
    }

    #[test]
    fn extract_tags_inline() {
        let tags = extract_tags("hello #rust #programming");
        assert!(tags.contains(&"rust".to_string()));
        assert!(tags.contains(&"programming".to_string()));
    }

    #[test]
    fn extract_tags_frontmatter() {
        let tags = extract_tags("---\ntags: [foo, bar]\n---\ncontent");
        assert!(tags.contains(&"foo".to_string()));
        assert!(tags.contains(&"bar".to_string()));
    }

    #[test]
    fn extract_folders_nested() {
        let paths = vec!["a/b/c.md".to_string(), "x/y.md".to_string()];
        let folders = extract_folders(&paths);
        assert!(folders.contains("a"));
        assert!(folders.contains("a/b"));
        assert!(folders.contains("x"));
        assert_eq!(folders.len(), 3);
    }
}
