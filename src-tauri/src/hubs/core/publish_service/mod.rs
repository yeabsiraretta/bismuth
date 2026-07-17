use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::infrastructure::error::AppResult;
use crate::infrastructure::state::{ensure_parent, AppState};

// ── Types ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub(crate) enum ExportFormat {
    Html,
    Markdown,
    Pdf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PublishResult {
    pub exported: u32,
    pub failed: u32,
    pub output_path: String,
    pub errors: Vec<String>,
}

// ── Public API ──────────────────────────────────────────────────────────────

pub(crate) fn publish_notes(
    state: &AppState,
    format: ExportFormat,
    note_paths: &[String],
    output_dir: Option<&str>,
) -> AppResult<PublishResult> {
    let root = state.vault_root()?;

    let out_dir = match output_dir {
        Some(d) => PathBuf::from(d),
        None => root.join(".bismuth").join("publish"),
    };
    fs::create_dir_all(&out_dir)?;

    let mut result = PublishResult {
        exported: 0,
        failed: 0,
        output_path: out_dir.to_string_lossy().to_string(),
        errors: Vec::new(),
    };

    for note_path in note_paths {
        let src = root.join(note_path);
        if !src.exists() {
            result.failed += 1;
            result.errors.push(format!("Not found: {note_path}"));
            continue;
        }

        match export_note(&src, &root, &out_dir, format) {
            Ok(()) => result.exported += 1,
            Err(e) => {
                result.failed += 1;
                result.errors.push(format!("{note_path}: {e}"));
            },
        }
    }

    tracing::info!(
        format = ?format,
        exported = result.exported,
        failed = result.failed,
        output = %out_dir.display(),
        "Publish complete"
    );

    Ok(result)
}

fn export_note(
    src: &Path,
    vault_root: &Path,
    out_dir: &Path,
    format: ExportFormat,
) -> AppResult<()> {
    let content = fs::read_to_string(src)?;
    let rel = src.strip_prefix(vault_root).unwrap_or(src);

    match format {
        ExportFormat::Markdown => {
            let dest = out_dir.join(rel);
            ensure_parent(&dest)?;
            fs::write(&dest, &content)?;
        },
        ExportFormat::Html => {
            let dest = out_dir.join(rel).with_extension("html");
            ensure_parent(&dest)?;
            let html = markdown_to_html(&content, rel);
            fs::write(&dest, html)?;
        },
        ExportFormat::Pdf => {
            // PDF generation: produce a print-ready HTML file with .pdf.html extension
            // Real PDF rendering would need a headless browser or wkhtmltopdf — we generate
            // a self-contained HTML that can be printed to PDF from any browser.
            let dest = out_dir.join(rel).with_extension("pdf.html");
            ensure_parent(&dest)?;
            let html = markdown_to_print_html(&content, rel);
            fs::write(&dest, html)?;
        },
    }

    Ok(())
}

// ── Markdown → HTML conversion ──────────────────────────────────────────────

fn markdown_to_html(md: &str, rel_path: &Path) -> String {
    let title = rel_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Untitled");

    let body = md_to_html_body(md);

    format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #1a1a1a; }}
    h1 {{ border-bottom: 1px solid #eee; padding-bottom: 0.3em; }}
    h2 {{ border-bottom: 1px solid #f0f0f0; padding-bottom: 0.2em; }}
    code {{ background: #f5f5f5; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; }}
    pre {{ background: #f5f5f5; padding: 1em; border-radius: 6px; overflow-x: auto; }}
    pre code {{ background: none; padding: 0; }}
    blockquote {{ border-left: 3px solid #ddd; margin-left: 0; padding-left: 1em; color: #555; }}
    a {{ color: #0969da; text-decoration: none; }}
    a:hover {{ text-decoration: underline; }}
    img {{ max-width: 100%; }}
    hr {{ border: none; border-top: 1px solid #eee; margin: 2em 0; }}
    table {{ border-collapse: collapse; width: 100%; }}
    th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
    th {{ background: #f5f5f5; }}
  </style>
</head>
<body>
{body}
</body>
</html>"#
    )
}

fn markdown_to_print_html(md: &str, rel_path: &Path) -> String {
    let title = rel_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Untitled");

    let body = md_to_html_body(md);

    format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{title}</title>
  <style>
    @page {{ margin: 2cm; }}
    body {{ font-family: 'Georgia', serif; font-size: 12pt; line-height: 1.6; color: #000; max-width: 100%; }}
    h1 {{ font-size: 24pt; margin-top: 0; }}
    h2 {{ font-size: 18pt; }}
    h3 {{ font-size: 14pt; }}
    code {{ font-family: 'Courier New', monospace; font-size: 0.9em; background: #f0f0f0; padding: 1px 4px; }}
    pre {{ background: #f5f5f5; padding: 1em; border: 1px solid #ddd; page-break-inside: avoid; }}
    pre code {{ background: none; padding: 0; }}
    blockquote {{ border-left: 2px solid #999; margin-left: 0; padding-left: 1em; color: #333; }}
    a {{ color: #000; text-decoration: underline; }}
    img {{ max-width: 100%; page-break-inside: avoid; }}
    table {{ border-collapse: collapse; width: 100%; page-break-inside: avoid; }}
    th, td {{ border: 1px solid #000; padding: 6px; }}
  </style>
</head>
<body>
{body}
<script>window.onload = function() {{ window.print(); }}</script>
</body>
</html>"#
    )
}

fn md_to_html_body(md: &str) -> String {
    let mut out = String::with_capacity(md.len() * 2);
    let mut in_code_block = false;
    let mut in_list = false;
    let mut paragraph = String::new();

    let flush_paragraph = |paragraph: &mut String, out: &mut String| {
        let text = paragraph.trim().to_string();
        if !text.is_empty() {
            out.push_str(&format!("<p>{}</p>\n", inline_md(&text)));
        }
        paragraph.clear();
    };

    for line in md.lines() {
        // Fenced code blocks
        if line.trim().starts_with("```") {
            if in_code_block {
                out.push_str("</code></pre>\n");
                in_code_block = false;
            } else {
                flush_paragraph(&mut paragraph, &mut out);
                if in_list {
                    out.push_str("</ul>\n");
                    in_list = false;
                }
                let lang = line.trim().strip_prefix("```").unwrap_or("");
                if lang.is_empty() {
                    out.push_str("<pre><code>");
                } else {
                    out.push_str(&format!("<pre><code class=\"language-{lang}\">"));
                }
                in_code_block = true;
            }
            continue;
        }

        if in_code_block {
            out.push_str(&escape_html(line));
            out.push('\n');
            continue;
        }

        let trimmed = line.trim();

        // Empty line
        if trimmed.is_empty() {
            flush_paragraph(&mut paragraph, &mut out);
            if in_list {
                out.push_str("</ul>\n");
                in_list = false;
            }
            continue;
        }

        // Headings
        if let Some(rest) = trimmed.strip_prefix("# ") {
            flush_paragraph(&mut paragraph, &mut out);
            out.push_str(&format!("<h1>{}</h1>\n", inline_md(rest)));
            continue;
        }
        if let Some(rest) = trimmed.strip_prefix("## ") {
            flush_paragraph(&mut paragraph, &mut out);
            out.push_str(&format!("<h2>{}</h2>\n", inline_md(rest)));
            continue;
        }
        if let Some(rest) = trimmed.strip_prefix("### ") {
            flush_paragraph(&mut paragraph, &mut out);
            out.push_str(&format!("<h3>{}</h3>\n", inline_md(rest)));
            continue;
        }
        if let Some(rest) = trimmed.strip_prefix("#### ") {
            flush_paragraph(&mut paragraph, &mut out);
            out.push_str(&format!("<h4>{}</h4>\n", inline_md(rest)));
            continue;
        }

        // Horizontal rule
        if trimmed == "---" || trimmed == "***" || trimmed == "___" {
            flush_paragraph(&mut paragraph, &mut out);
            out.push_str("<hr>\n");
            continue;
        }

        // Blockquote
        if let Some(rest) = trimmed.strip_prefix("> ") {
            flush_paragraph(&mut paragraph, &mut out);
            out.push_str(&format!(
                "<blockquote><p>{}</p></blockquote>\n",
                inline_md(rest)
            ));
            continue;
        }

        // Unordered list
        if trimmed.starts_with("- ") || trimmed.starts_with("* ") {
            flush_paragraph(&mut paragraph, &mut out);
            if !in_list {
                out.push_str("<ul>\n");
                in_list = true;
            }
            let item = &trimmed[2..];
            out.push_str(&format!("  <li>{}</li>\n", inline_md(item)));
            continue;
        }

        // Default: accumulate paragraph text
        if !paragraph.is_empty() {
            paragraph.push(' ');
        }
        paragraph.push_str(trimmed);
    }

    if in_code_block {
        out.push_str("</code></pre>\n");
    }
    if in_list {
        out.push_str("</ul>\n");
    }
    flush_paragraph(&mut paragraph, &mut out);

    out
}

fn inline_md(text: &str) -> String {
    use regex::Regex;
    use std::sync::OnceLock;

    static BOLD: OnceLock<Regex> = OnceLock::new();
    static ITALIC: OnceLock<Regex> = OnceLock::new();
    static CODE: OnceLock<Regex> = OnceLock::new();
    static IMG: OnceLock<Regex> = OnceLock::new();
    static LINK: OnceLock<Regex> = OnceLock::new();

    let bold = BOLD.get_or_init(|| Regex::new(r"\*\*(.+?)\*\*").unwrap());
    let italic = ITALIC.get_or_init(|| Regex::new(r"\*(.+?)\*").unwrap());
    let code = CODE.get_or_init(|| Regex::new(r"`([^`]+)`").unwrap());
    let img = IMG.get_or_init(|| Regex::new(r"!\[([^\]]*)\]\(([^)]+)\)").unwrap());
    let link = LINK.get_or_init(|| Regex::new(r"\[([^\]]+)\]\(([^)]+)\)").unwrap());

    let mut s = escape_html(text);

    // Bold: **text**
    s = bold.replace_all(&s, "<strong>$1</strong>").to_string();

    // Italic: *text*
    s = italic.replace_all(&s, "<em>$1</em>").to_string();

    // Inline code: `text`
    s = code.replace_all(&s, "<code>$1</code>").to_string();

    // Images BEFORE links — link regex `[…](…)` would swallow `![…](…)` otherwise
    s = img
        .replace_all(&s, r#"<img src="$2" alt="$1">"#)
        .to_string();

    // Links: [text](url)
    s = link.replace_all(&s, r#"<a href="$2">$1</a>"#).to_string();

    s
}

fn escape_html(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
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
    fn test_publish_markdown() {
        let vault_dir = TempDir::new().unwrap();
        let out_dir = TempDir::new().unwrap();
        fs::write(vault_dir.path().join("note.md"), "# Hello\nWorld").unwrap();
        let state = setup_state(vault_dir.path());

        let result = publish_notes(
            &state,
            ExportFormat::Markdown,
            &["note.md".to_string()],
            Some(&out_dir.path().to_string_lossy()),
        )
        .unwrap();

        assert_eq!(result.exported, 1);
        assert_eq!(result.failed, 0);
        let content = fs::read_to_string(out_dir.path().join("note.md")).unwrap();
        assert!(content.contains("# Hello"));
    }

    #[test]
    fn test_publish_html() {
        let vault_dir = TempDir::new().unwrap();
        let out_dir = TempDir::new().unwrap();
        fs::write(
            vault_dir.path().join("test.md"),
            "# Title\n\nHello **bold** and *italic*\n\n- item 1\n- item 2",
        )
        .unwrap();
        let state = setup_state(vault_dir.path());

        let result = publish_notes(
            &state,
            ExportFormat::Html,
            &["test.md".to_string()],
            Some(&out_dir.path().to_string_lossy()),
        )
        .unwrap();

        assert_eq!(result.exported, 1);
        let html = fs::read_to_string(out_dir.path().join("test.html")).unwrap();
        assert!(html.contains("<h1>Title</h1>"));
        assert!(html.contains("<strong>bold</strong>"));
        assert!(html.contains("<em>italic</em>"));
        assert!(html.contains("<li>item 1</li>"));
    }

    #[test]
    fn test_publish_missing_note() {
        let vault_dir = TempDir::new().unwrap();
        let state = setup_state(vault_dir.path());

        let result = publish_notes(
            &state,
            ExportFormat::Html,
            &["nonexistent.md".to_string()],
            None,
        )
        .unwrap();

        assert_eq!(result.exported, 0);
        assert_eq!(result.failed, 1);
    }

    #[test]
    fn test_md_to_html_code_blocks() {
        let md = "text\n\n```rust\nfn main() {}\n```\n\nmore text";
        let html = md_to_html_body(md);
        assert!(html.contains("<pre><code class=\"language-rust\">"));
        assert!(html.contains("fn main() {}"));
    }
}
