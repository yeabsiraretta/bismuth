use std::fs;
use std::path::Path;

use regex::Regex;

use crate::infrastructure::error::AppResult;

use super::{collect_files, ensure_parent, ImportResult};

pub(super) fn import_notion(src: &Path, vault_root: &Path) -> AppResult<ImportResult> {
    use std::sync::OnceLock;
    static NOTION_ID: OnceLock<Regex> = OnceLock::new();
    let notion_id_re = NOTION_ID.get_or_init(|| Regex::new(r"\s+[a-f0-9]{32}$").unwrap());

    let md_files = collect_files(src, &["md"]);
    let html_files = collect_files(src, &["html"]);

    let mut result = ImportResult {
        success: 0,
        failed: 0,
        errors: Vec::new(),
    };

    for file in &md_files {
        let stem = file
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Untitled");
        let clean_name = notion_id_re.replace(stem, "").to_string();
        let rel = file.strip_prefix(src).unwrap_or(file);
        let dest = vault_root
            .join(rel.parent().unwrap_or(Path::new("")))
            .join(format!("{clean_name}.md"));

        match import_notion_md(file, &dest) {
            Ok(()) => result.success += 1,
            Err(e) => {
                result.failed += 1;
                result.errors.push(format!("{}: {e}", file.display()));
            }
        }
    }

    // HTML files: basic conversion to markdown
    for file in &html_files {
        let stem = file
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Untitled");
        let clean_name = notion_id_re.replace(stem, "").to_string();
        let rel = file.strip_prefix(src).unwrap_or(file);
        let dest = vault_root
            .join(rel.parent().unwrap_or(Path::new("")))
            .join(format!("{clean_name}.md"));

        match import_notion_html(file, &dest) {
            Ok(()) => result.success += 1,
            Err(e) => {
                result.failed += 1;
                result.errors.push(format!("{}: {e}", file.display()));
            }
        }
    }

    tracing::info!(success = result.success, failed = result.failed, "Notion import complete");
    Ok(result)
}

fn import_notion_md(src: &Path, dest: &Path) -> AppResult<()> {
    let content = fs::read_to_string(src)?;
    // Clean up Notion-specific formatting (inline database references, etc.)
    let cleaned = content
        .replace("\u{00a0}", " ") // non-breaking spaces
        .replace("%20", " "); // URL-encoded spaces in links
    ensure_parent(dest)?;
    fs::write(dest, cleaned)?;
    Ok(())
}

fn import_notion_html(src: &Path, dest: &Path) -> AppResult<()> {
    let html = fs::read_to_string(src)?;
    let md = html_to_markdown(&html);
    ensure_parent(dest)?;
    fs::write(dest, md)?;
    Ok(())
}

pub(super) fn html_to_markdown(html: &str) -> String {
    use std::sync::OnceLock;
    static TAG: OnceLock<Regex> = OnceLock::new();
    static MULTI_NL: OnceLock<Regex> = OnceLock::new();
    let tag_re = TAG.get_or_init(|| Regex::new(r"<(/?)(\w+)[^>]*>").unwrap());

    let mut out = String::with_capacity(html.len());
    let mut pos = 0;
    let mut in_pre = false;

    for cap in tag_re.captures_iter(html) {
        let m = cap.get(0).unwrap();
        let before = &html[pos..m.start()];
        let closing = &cap[1] == "/";
        let tag = cap[2].to_lowercase();
        pos = m.end();

        if !in_pre {
            let text = before.trim();
            if !text.is_empty() {
                out.push_str(&decode_html_entities(text));
            }
        } else {
            out.push_str(before);
        }

        match tag.as_str() {
            "h1" if !closing => out.push_str("\n# "),
            "h2" if !closing => out.push_str("\n## "),
            "h3" if !closing => out.push_str("\n### "),
            "h4" if !closing => out.push_str("\n#### "),
            "p" if closing => out.push_str("\n\n"),
            "br" => out.push('\n'),
            "li" if !closing => out.push_str("\n- "),
            "strong" | "b" if !closing => out.push_str("**"),
            "strong" | "b" if closing => out.push_str("**"),
            "em" | "i" if !closing => out.push('*'),
            "em" | "i" if closing => out.push('*'),
            "code" if !closing && !in_pre => out.push('`'),
            "code" if closing && !in_pre => out.push('`'),
            "pre" if !closing => {
                in_pre = true;
                out.push_str("\n```\n");
            }
            "pre" if closing => {
                in_pre = false;
                out.push_str("\n```\n");
            }
            "hr" => out.push_str("\n---\n"),
            "blockquote" if !closing => out.push_str("\n> "),
            _ => {}
        }
    }

    if pos < html.len() {
        let remaining = html[pos..].trim();
        if !remaining.is_empty() {
            out.push_str(&decode_html_entities(remaining));
        }
    }

    // Clean up excessive newlines
    let multi_nl = MULTI_NL.get_or_init(|| Regex::new(r"\n{3,}").unwrap());
    multi_nl.replace_all(out.trim(), "\n\n").to_string()
}

fn decode_html_entities(s: &str) -> String {
    s.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&nbsp;", " ")
}
