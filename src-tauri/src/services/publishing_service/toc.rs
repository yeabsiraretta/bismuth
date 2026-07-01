//! Table of contents generation for published notes.
//!
//! Parses rendered HTML for heading tags, generates a nested nav TOC,
//! and inserts it after the `<h1>` page title in the output.
//! Respects `dg-hide-toc: true` frontmatter to suppress generation.

/// A single entry in the table of contents.
#[derive(Debug, Clone, PartialEq)]
pub struct TocEntry {
    /// Heading level (1–3), where 1 is the top-level section heading.
    pub level: u8,
    /// Display text of the heading (HTML-stripped).
    pub text: String,
    /// URL fragment anchor (slugified from text).
    pub anchor: String,
}

/// Parse `<h1>` through `<h3>` tags from rendered HTML.
///
/// Returns a list of `TocEntry` values in document order.
/// Note: heading levels in rendered HTML are already offset by 1 (the page
/// title is `<h1>`, so markdown `#` headings appear as `<h2>`).
/// TOC levels are normalised: `<h2>` → level 1, `<h3>` → level 2, `<h4>` → level 3.
pub fn collect_headings(html: &str) -> Vec<TocEntry> {
    let mut entries = Vec::new();
    let mut remaining = html;

    loop {
        // Find the earliest h2/h3/h4 open tag
        let candidates = [
            remaining.find("<h2>").map(|p| (p, 2u8)),
            remaining.find("<h3>").map(|p| (p, 3u8)),
            remaining.find("<h4>").map(|p| (p, 4u8)),
        ];

        let best = candidates.into_iter().flatten().min_by_key(|(pos, _)| *pos);

        let (pos, raw_level) = match best {
            Some(v) => v,
            None => break,
        };

        let close_tag = format!("</h{}>", raw_level);
        let open_len = 4usize; // "<hN>" is always 4 chars

        let after_open = &remaining[pos + open_len..];
        if let Some(close_pos) = after_open.find(&close_tag) {
            let inner = &after_open[..close_pos];
            let text = strip_inline_tags(inner);
            if !text.is_empty() {
                let anchor = slugify(&text);
                // Map rendered heading level to TOC depth: h2→1, h3→2, h4→3
                let level = raw_level - 1;
                entries.push(TocEntry {
                    level,
                    text,
                    anchor,
                });
            }
            remaining = &after_open[close_pos + close_tag.len()..];
        } else {
            // Unclosed tag — skip past the open tag and continue
            remaining = &remaining[pos + open_len..];
        }
    }

    entries
}

/// Render a `<nav class="toc">` block from collected headings.
///
/// Produces a two-level nested `<ul>`: level-1 entries are top-level `<li>`,
/// level-2 and level-3 entries are nested under their nearest level-1 parent.
pub fn render_toc(headings: &[TocEntry]) -> String {
    if headings.is_empty() {
        return String::new();
    }

    let mut html = String::from("<nav class=\"toc\">\n<ul>\n");
    let mut depth: u8 = 1;

    for entry in headings {
        match entry.level.cmp(&depth) {
            std::cmp::Ordering::Greater => {
                // Open nested lists until we reach the target depth
                while depth < entry.level {
                    html.push_str("<ul>\n");
                    depth += 1;
                }
            },
            std::cmp::Ordering::Less => {
                // Close nested lists until we reach the target depth
                while depth > entry.level {
                    html.push_str("</ul>\n");
                    depth -= 1;
                }
            },
            std::cmp::Ordering::Equal => {},
        }

        html.push_str(&format!(
            "<li><a href=\"#{}\">{}</a></li>\n",
            entry.anchor,
            html_escape_text(&entry.text),
        ));
    }

    // Close any remaining open nested lists
    while depth > 1 {
        html.push_str("</ul>\n");
        depth -= 1;
    }

    html.push_str("</ul>\n</nav>\n");
    html
}

/// Insert the TOC into the HTML string after the first `<h1>` closing tag.
///
/// If `headings` is empty or there is no `</h1>` in the HTML, returns the
/// original HTML unchanged.
pub fn insert_toc(html: &str, headings: &[TocEntry]) -> String {
    if headings.is_empty() {
        return html.to_string();
    }

    let toc_html = render_toc(headings);

    if let Some(pos) = html.find("</h1>") {
        let insert_at = pos + 5; // len("</h1>") == 5
        let mut result = String::with_capacity(html.len() + toc_html.len());
        result.push_str(&html[..insert_at]);
        result.push('\n');
        result.push_str(&toc_html);
        result.push_str(&html[insert_at..]);
        result
    } else {
        html.to_string()
    }
}

/// Returns `true` if the note's raw content contains `dg-hide-toc: true` in frontmatter.
pub fn should_hide_toc(raw_content: &str) -> bool {
    use crate::services::FrontmatterService;
    let (fm, _) = FrontmatterService::parse(raw_content).unwrap_or_default();
    fm.get("dg-hide-toc")
        .and_then(|v| v.as_bool())
        .unwrap_or(false)
}

/// CSS for the TOC nav block.
pub fn toc_css() -> &'static str {
    r#"
.toc { background: var(--code-bg); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem 1rem; margin: 1.5rem 0; font-size: 0.9em; }
.toc ul { list-style: none; padding-left: 0; margin: 0; }
.toc ul ul { padding-left: 1.25rem; margin-top: 0.25rem; }
.toc li { margin: 0.2rem 0; }
.toc a { color: var(--accent); text-decoration: none; }
.toc a:hover { text-decoration: underline; }
"#
}

/// Strip inline HTML tags from a heading's inner HTML to get plain text.
fn strip_inline_tags(html: &str) -> String {
    let mut out = String::new();
    let mut in_tag = false;
    for ch in html.chars() {
        match ch {
            '<' => in_tag = true,
            '>' => in_tag = false,
            _ if !in_tag => out.push(ch),
            _ => {},
        }
    }
    out.trim().to_string()
}

/// Convert a heading string to a URL-safe anchor fragment.
fn slugify(text: &str) -> String {
    text.chars()
        .map(|c| {
            if c.is_alphanumeric() {
                c.to_ascii_lowercase()
            } else {
                '-'
            }
        })
        .collect::<String>()
        .split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("-")
}

/// Escape `<`, `>`, `&`, and `"` for HTML text nodes.
fn html_escape_text(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn e(level: u8, text: &str, anchor: &str) -> TocEntry {
        TocEntry {
            level,
            text: text.to_string(),
            anchor: anchor.to_string(),
        }
    }

    #[test]
    fn test_collect_headings_basic() {
        let html = "<h1>Page Title</h1>\n<h2>Section One</h2>\n<h3>Subsection</h3>";
        let entries = collect_headings(html);
        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0], e(1, "Section One", "section-one"));
        assert_eq!(entries[1].level, 2);
        assert_eq!(entries[1].text, "Subsection");
    }

    #[test]
    fn test_collect_headings_strips_inline_tags() {
        let html = "<h2><a href=\"/x\">Link Heading</a></h2>";
        let entries = collect_headings(html);
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].text, "Link Heading");
    }

    #[test]
    fn test_collect_headings_empty_html() {
        assert!(collect_headings("<p>No headings here</p>").is_empty());
    }

    #[test]
    fn test_render_toc_empty_headings() {
        assert!(render_toc(&[]).is_empty());
    }

    #[test]
    fn test_render_toc_flat_structure() {
        let entries = vec![e(1, "A", "a"), e(1, "B", "b")];
        let toc = render_toc(&entries);
        assert!(toc.contains("<nav class=\"toc\">"));
        assert!(toc.contains("<a href=\"#a\">A</a>"));
        assert!(toc.contains("<a href=\"#b\">B</a>"));
    }

    #[test]
    fn test_render_toc_nested_structure() {
        let entries = vec![e(1, "Top", "top"), e(2, "Sub", "sub")];
        let toc = render_toc(&entries);
        assert!(toc.contains("<ul>\n<li><a href=\"#sub\">"));
    }

    #[test]
    fn test_insert_toc_after_h1() {
        let html = "<h1>Title</h1>\n<p>Body</p>";
        let out = insert_toc(html, &[e(1, "Section", "section")]);
        assert!(out.find("<nav class=\"toc\">").unwrap() > out.find("</h1>").unwrap());
        assert!(out.contains("<p>Body</p>"));
    }

    #[test]
    fn test_insert_toc_no_h1_unchanged() {
        let html = "<p>No title here</p>";
        let out = insert_toc(html, &[e(1, "Section", "section")]);
        assert_eq!(out, html);
    }

    #[test]
    fn test_insert_toc_empty_headings_unchanged() {
        let html = "<h1>Title</h1><p>Body</p>";
        assert_eq!(insert_toc(html, &[]), html);
    }

    #[test]
    fn test_slugify_basic() {
        assert_eq!(slugify("Hello World"), "hello-world");
        assert_eq!(slugify("Section 1.2"), "section-1-2");
        assert_eq!(slugify("  Spaces  "), "spaces");
    }

    #[test]
    fn test_should_hide_toc_false_when_absent() {
        assert!(!should_hide_toc("---\ntitle: Test\n---\nBody text"));
    }
}
