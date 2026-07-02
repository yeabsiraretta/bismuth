//! Markdown → HTML renderer for published notes.
//!
//! Uses pulldown-cmark for standard Markdown parsing, with pre/post-processing
//! for Bismuth-specific features: callouts, wikilinks, highlights,
//! math (KaTeX), mermaid diagrams, and footnotes.
//! Wikilinks to unpublished notes are rendered as plain text (not links).

use pulldown_cmark::{html, Options, Parser};

use super::callouts::{parse_callout_start, render_callout, Callout};
use super::footnotes::process_footnotes;
use super::renderer_extensions::{
    katex_head_snippets, mermaid_script_tag, postprocess_mermaid, preprocess_highlights,
    preprocess_math, preprocess_wikilinks,
};
use super::toc;
use super::PublishableNote;

/// Escape HTML special characters (XSS prevention for wikilinks/user content).
pub fn html_escape(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

/// Post-process HTML to convert blockquotes with [!type] into callout divs.
fn postprocess_callouts(html_output: &str) -> String {
    let mut result = String::new();
    let mut remaining = html_output;

    loop {
        // Find <blockquote> tags
        if let Some(bq_start) = remaining.find("<blockquote>") {
            // Add everything before this blockquote
            result.push_str(&remaining[..bq_start]);

            // Find matching </blockquote>
            let after_tag = &remaining[bq_start + 12..]; // len("<blockquote>") == 12
            if let Some(bq_end) = after_tag.find("</blockquote>") {
                let inner = &after_tag[..bq_end];

                // Check if it starts with a callout pattern [!type]
                // Inner HTML may have <p> wrapping, so strip that
                let inner_text = inner.trim();
                let check_text = if inner_text.starts_with("<p>") {
                    &inner_text[3..]
                } else {
                    inner_text
                };

                if let Some((callout_type, title)) = parse_callout_start(check_text) {
                    // Extract body (everything after the callout header line)
                    let body_start = check_text
                        .find('\n')
                        .or_else(|| check_text.find("</p>"))
                        .unwrap_or(check_text.len());
                    let body_raw = &check_text[body_start..];
                    let body_clean = body_raw
                        .replace("<p>", "")
                        .replace("</p>", "")
                        .trim()
                        .to_string();
                    let body_lines: Vec<String> = if body_clean.is_empty() {
                        Vec::new()
                    } else {
                        body_clean
                            .lines()
                            .map(|l| l.trim().to_string())
                            .filter(|l| !l.is_empty())
                            .collect()
                    };

                    let callout = Callout {
                        callout_type,
                        title,
                        body_lines,
                    };
                    result.push_str(&render_callout(&callout));
                } else {
                    // Regular blockquote, keep as-is
                    result.push_str(&remaining[bq_start..bq_start + 12 + bq_end + 13]);
                }

                remaining = &after_tag[bq_end + 13..]; // len("</blockquote>") == 13
            } else {
                // No closing tag found, just output the rest
                result.push_str(&remaining[bq_start..]);
                break;
            }
        } else {
            result.push_str(remaining);
            break;
        }
    }

    result
}

/// Renders a publishable note's markdown content to HTML.
pub fn render_to_html(note: &PublishableNote, published_slugs: &[String]) -> String {
    let body = crate::utils::markdown::strip_frontmatter(&note.content);
    let (html_body, has_math, has_mermaid) = markdown_to_html(&body, published_slugs);

    // Build optional head injections
    let mut head_extra = String::new();
    if has_math {
        head_extra.push('\n');
        head_extra.push_str(katex_head_snippets());
    }

    // Build optional body-end injections
    let mut body_extra = String::new();
    if has_mermaid {
        body_extra.push('\n');
        body_extra.push_str(mermaid_script_tag());
        body_extra.push('\n');
    }

    let page = format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <link rel="stylesheet" href="/style.css">{head_extra}
</head>
<body>
  <article class="note-content">
    <h1>{title}</h1>
    {body}
  </article>{body_extra}
</body>
</html>"#,
        title = html_escape(&note.title),
        body = html_body,
        head_extra = head_extra,
        body_extra = body_extra,
    );

    // Insert TOC unless suppressed by frontmatter
    if toc::should_hide_toc(&note.content) {
        page
    } else {
        let headings = toc::collect_headings(&html_body);
        toc::insert_toc(&page, &headings)
    }
}

/// Full markdown to HTML conversion using pulldown-cmark with Bismuth extensions.
/// Returns (html, has_math, has_mermaid).
fn markdown_to_html(markdown: &str, published_slugs: &[String]) -> (String, bool, bool) {
    // Pre-process footnotes (strip definitions, number inline refs)
    let processed = process_footnotes(markdown);

    // Pre-process Bismuth-specific syntax
    let processed = preprocess_highlights(&processed);
    let processed = preprocess_wikilinks(&processed, published_slugs);

    // Pre-process math ($$...$$ and $...$)
    let math_result = preprocess_math(&processed);
    let has_math = math_result.has_math;
    let processed = math_result.processed;

    // Configure pulldown-cmark with all relevant extensions
    let mut options = Options::empty();
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_TASKLISTS);

    // Parse and render to HTML
    let parser = Parser::new_ext(&processed, options);
    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);

    // Post-process: heading level offset (h1 → h2, etc. since page title is h1)
    let html_output = offset_headings(&html_output);

    // Post-process: callout detection in blockquotes
    let html_output = postprocess_callouts(&html_output);

    // Post-process: mermaid diagram blocks
    let mermaid_result = postprocess_mermaid(&html_output);
    let has_mermaid = mermaid_result.has_mermaid;
    let html_output = mermaid_result.processed;

    (html_output, has_math, has_mermaid)
}

/// Offset heading levels by 1 (since the page title occupies h1).
fn offset_headings(html: &str) -> String {
    let mut result = html.to_string();
    // Process h5→h6, h4→h5, h3→h4, h2→h3, h1→h2 (reverse to avoid double-shifting)
    for level in (1..=5).rev() {
        let from_open = format!("<h{}>", level);
        let from_close = format!("</h{}>", level);
        let to_open = format!("<h{}>", level + 1);
        let to_close = format!("</h{}>", level + 1);
        result = result.replace(&from_open, &to_open);
        result = result.replace(&from_close, &to_close);
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    fn render_md(md: &str, slugs: &[&str]) -> String {
        let slug_strings: Vec<String> = slugs.iter().map(|s| s.to_string()).collect();
        let (html, _, _) = markdown_to_html(md, &slug_strings);
        html
    }

    #[test]
    fn test_basic_paragraph() {
        let out = render_md("Hello world", &[]);
        assert!(out.contains("<p>Hello world</p>"));
    }

    #[test]
    fn test_heading_offset() {
        let out = render_md("# Title\n## Subtitle", &[]);
        assert!(out.contains("<h2>Title</h2>"));
        assert!(out.contains("<h3>Subtitle</h3>"));
    }

    #[test]
    fn test_bold_italic() {
        let out = render_md("**bold** and *italic*", &[]);
        assert!(out.contains("<strong>bold</strong>"));
        assert!(out.contains("<em>italic</em>"));
    }

    #[test]
    fn test_strikethrough() {
        let out = render_md("~~deleted~~", &[]);
        assert!(out.contains("<del>deleted</del>"));
    }

    #[test]
    fn test_highlight() {
        let out = render_md("==highlighted==", &[]);
        assert!(out.contains("<mark>highlighted</mark>"));
    }

    #[test]
    fn test_code_block() {
        let out = render_md("```rust\nfn main() {}\n```", &[]);
        assert!(out.contains("<code"));
        assert!(out.contains("fn main()"));
    }

    #[test]
    fn test_wikilink_published() {
        let out = render_md("See [[My Note]]", &["my-note"]);
        assert!(out.contains("<a href=\"/my-note.html\">My Note</a>"));
    }

    #[test]
    fn test_wikilink_unpublished() {
        let out = render_md("See [[Secret Note]]", &[]);
        assert!(!out.contains("<a"));
        assert!(out.contains("Secret Note"));
    }

    #[test]
    fn test_wikilink_xss_prevention() {
        let out = render_md("See [[<script>alert(1)</script>]]", &[]);
        assert!(!out.contains("<script>"));
        assert!(out.contains("&lt;script&gt;"));
    }

    #[test]
    fn test_unordered_list() {
        let out = render_md("- item one\n- item two", &[]);
        assert!(out.contains("<li>"));
        assert!(out.contains("item one"));
    }

    #[test]
    fn test_task_list() {
        let out = render_md("- [x] done\n- [ ] todo", &[]);
        assert!(out.contains("checked"));
        assert!(out.contains("todo"));
    }

    #[test]
    fn test_html_escape_function() {
        assert_eq!(html_escape("<script>"), "&lt;script&gt;");
        assert_eq!(html_escape("a & b"), "a &amp; b");
    }
}
